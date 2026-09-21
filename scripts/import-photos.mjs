#!/usr/bin/env node
/**
 * 답사 사진 가져오기
 *
 * 구글 드라이브에서 받은 답사 사진 폴더(예: "1일차_9.11._금/03_대학_예일대학교/*.jpg")를
 * 웹용 WebP로 줄여서 public/photos/ 아래에 저장한다. 원본 사진은 레포에 넣지 않는다.
 *
 *   npm run photos:import -- <원본폴더> [--view <폴더>] [--manifest <파일>]
 *
 *   <원본폴더>   "N일차_..." 폴더들이 들어 있는 폴더
 *   --view       (선택) 사진을 눈으로 확인할 1024px JPEG 사본을 둘 폴더 (레포 밖 권장)
 *   --manifest   (선택) 촬영 시각·GPS까지 담은 상세 목록 JSON 경로 (레포 밖 권장)
 *
 * 결과
 *   public/photos/s<답사일>/f<폴더순번>/<파일이름>.webp        긴 변 1600px
 *   public/photos/s<답사일>/f<폴더순번>/<파일이름>.thumb.webp  긴 변 480px
 *   content/photo-sources.json  폴더 번호 ↔ 원래 폴더 이름, 사진별 촬영 시각·크기
 *
 * 동영상(.mp4, .mov)은 ffmpeg 로 H.264 1280px·30fps MP4 로 줄이고, 1초 지점 화면을 표지 사진으로 만든다
 * (ffmpeg 가 없으면 동영상만 건너뛴다). 목록에는 사진처럼 들어가고 video 칸에 영상 경로가 붙는다.
 *
 * 메타데이터(EXIF, GPS 포함)는 WebP에 남기지 않는다. 이미 변환된 사진은 건너뛴다.
 * content/photo-excluded.json 에 적힌 사진(개인정보 등)은 가져오지 않는다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import sharp from 'sharp'
import exifr from 'exifr'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'photos')
const SOURCES = path.join(ROOT, 'content', 'photo-sources.json')
// 개인정보 등으로 빼기로 한 사진 { "s1/f01/20260911_070544": "탑승권에 이름이 보임" }
const EXCLUDED = path.join(ROOT, 'content', 'photo-excluded.json')
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'])
const VIDEO_EXT = new Set(['.mp4', '.mov'])

function hasFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** 동영상 → 웹용 MP4 + 표지 JPEG(임시). 표지 경로를 돌려준다. */
function convertVideo(input, outMp4) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', input, '-vf', "scale='min(1280,iw)':-2,fps=30", '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-map_metadata', '-1', '-c:a', 'aac', '-b:a', '96k', outMp4])
  const poster = path.join(os.tmpdir(), `poster-${process.pid}-${Date.now()}.jpg`)
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '1', '-i', input, '-frames:v', '1', '-q:v', '3', poster])
  return poster
}

function parseArgs(argv) {
  const args = { src: null, view: null, manifest: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--view') args.view = argv[++i]
    else if (a === '--manifest') args.manifest = argv[++i]
    else if (!args.src) args.src = a
  }
  if (!args.src) {
    console.error('사용법: npm run photos:import -- <원본폴더> [--view <폴더>] [--manifest <파일>]')
    process.exit(1)
  }
  return args
}

const byName = (a, b) => a.localeCompare(b, 'ko')
const listDirs = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(byName)

/** "20260911_132237.jpg" → "2026-09-11T13:22:37" (파일 이름이 촬영 시각인 삼성폰 형식) */
function timeFromName(name) {
  const m = name.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null
}

function localIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const p = (n) => String(n).padStart(2, '0')
  // exifr은 시간대 없는 EXIF 시각을 로컬 시각으로 읽으므로 로컬 필드를 그대로 쓴다.
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const src = path.resolve(args.src)
  const sources = fs.existsSync(SOURCES) ? JSON.parse(fs.readFileSync(SOURCES, 'utf8')) : { folders: {}, photos: {} }
  const manifest = args.manifest && fs.existsSync(args.manifest) ? JSON.parse(fs.readFileSync(args.manifest, 'utf8')) : {}
  const excluded = fs.existsSync(EXCLUDED) ? JSON.parse(fs.readFileSync(EXCLUDED, 'utf8')) : {}
  // 나중에 제외하기로 한 사진은 이미 변환된 파일과 목록에서도 지운다.
  for (const id of Object.keys(excluded)) {
    const entry = sources.photos[id]
    if (!entry) continue
    for (const rel of [entry.src, entry.thumb, entry.video].filter(Boolean)) fs.rmSync(path.join(ROOT, 'public', rel), { force: true })
    delete sources.photos[id]
  }
  const skipped = []
  const ffmpeg = hasFfmpeg()
  let converted = 0
  let kept = 0

  for (const surveyDir of listDirs(src)) {
    const dayMatch = surveyDir.match(/^(\d+)일차/)
    if (!dayMatch) {
      skipped.push(`${surveyDir}/ (답사 일자 폴더 이름이 "N일차_"로 시작하지 않음)`)
      continue
    }
    const s = `s${dayMatch[1]}`
    for (const [index, folder] of listDirs(path.join(src, surveyDir)).entries()) {
      const f = `f${String(index + 1).padStart(2, '0')}`
      sources.folders[`${s}/${f}`] = { survey: surveyDir, folder }
      const folderPath = path.join(src, surveyDir, folder)
      const files = fs.readdirSync(folderPath).sort(byName)
      for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        const rel = `${surveyDir}/${folder}/${file}`
        const isVideo = VIDEO_EXT.has(ext)
        if (!IMAGE_EXT.has(ext) && !isVideo) {
          skipped.push(`${rel} (사진·동영상 아님)`)
          continue
        }
        if (isVideo && !ffmpeg) {
          skipped.push(`${rel} (동영상: ffmpeg 가 없어 건너뜀)`)
          continue
        }
        const base = path.basename(file, path.extname(file))
        const id = `${s}/${f}/${base}`
        if (excluded[id]) {
          skipped.push(`${rel} (제외: ${excluded[id]})`)
          continue
        }
        const outDir = path.join(OUT, s, f)
        const full = path.join(outDir, `${base}.webp`)
        const thumb = path.join(outDir, `${base}.thumb.webp`)
        const original = path.join(folderPath, file)
        const video = path.join(outDir, `${base}.mp4`)
        fs.mkdirSync(outDir, { recursive: true })

        let exif = null
        try {
          exif = isVideo ? null : await exifr.parse(original, { gps: true, pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude', 'Orientation'] })
        } catch {
          exif = null
        }

        // 동영상은 표지 이미지를 사진처럼 다룬다.
        let input = original
        if (isVideo) {
          if (!fs.existsSync(video) || !fs.existsSync(full) || !fs.existsSync(thumb)) input = convertVideo(original, video)
        }

        if (!fs.existsSync(full) || !fs.existsSync(thumb)) {
          const img = sharp(input, { failOn: 'none' }).rotate()
          await img.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(full)
          await img.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 70 }).toFile(thumb)
          converted++
        } else {
          kept++
        }
        if (args.view) {
          const viewFile = path.join(path.resolve(args.view), s, f, `${base}.jpg`)
          if (!fs.existsSync(viewFile)) {
            fs.mkdirSync(path.dirname(viewFile), { recursive: true })
            await sharp(isVideo ? full : input, { failOn: 'none' }).rotate().resize({ width: 1024, height: 1024, fit: 'inside' }).jpeg({ quality: 80 }).toFile(viewFile)
          }
        }
        if (input !== original) fs.rmSync(input, { force: true })

        const meta = await sharp(full).metadata()
        const takenAt = localIso(exif?.DateTimeOriginal ?? exif?.CreateDate) ?? timeFromName(file)
        sources.photos[id] = {
          src: `photos/${s}/${f}/${base}.webp`,
          thumb: `photos/${s}/${f}/${base}.thumb.webp`,
          from: rel,
          takenAt,
          w: meta.width,
          h: meta.height,
          ...(isVideo ? { video: `photos/${s}/${f}/${base}.mp4` } : {}),
        }
        if (args.manifest) {
          manifest[id] = {
            ...sources.photos[id],
            original,
            gps: exif?.latitude != null ? [Number(exif.longitude.toFixed(6)), Number(exif.latitude.toFixed(6))] : null,
          }
        }
      }
    }
  }

  const sortedPhotos = Object.fromEntries(Object.entries(sources.photos).sort(([a], [b]) => byName(a, b)))
  const sortedFolders = Object.fromEntries(Object.entries(sources.folders).sort(([a], [b]) => byName(a, b)))
  fs.mkdirSync(path.dirname(SOURCES), { recursive: true })
  fs.writeFileSync(SOURCES, JSON.stringify({ folders: sortedFolders, photos: sortedPhotos }, null, 2) + '\n')
  if (args.manifest) {
    fs.mkdirSync(path.dirname(path.resolve(args.manifest)), { recursive: true })
    fs.writeFileSync(args.manifest, JSON.stringify(manifest, null, 2) + '\n')
  }

  console.log(`변환 ${converted}장, 이미 있던 사진 ${kept}장, 전체 ${Object.keys(sortedPhotos).length}장`)
  if (skipped.length) {
    console.log(`건너뜀 ${skipped.length}개:`)
    for (const line of skipped) console.log(`  - ${line}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
