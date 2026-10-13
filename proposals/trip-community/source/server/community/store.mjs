import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { ApiError } from './auth.mjs'

/** 게시글·댓글·처리된 사진을 한 DB 트랜잭션으로 저장한다. DB 파일은 영속 디스크에 둔다. */
export function openStore(filename) {
  const db = new DatabaseSync(filename)
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
    INSERT OR IGNORE INTO schema_version VALUES (1);
    CREATE TABLE IF NOT EXISTS posts (
      seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL,
      event_id TEXT NOT NULL DEFAULT 'gbshs-usa-2026', author_id TEXT NOT NULL,
      author_name TEXT NOT NULL, author_role TEXT NOT NULL CHECK(author_role IN ('student','teacher')),
      client_id TEXT NOT NULL, request_hash TEXT, region_id TEXT NOT NULL, location_key TEXT,
      kind TEXT NOT NULL CHECK(kind IN ('tip','question','review')), title TEXT NOT NULL, body TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(author_id,client_id)
    );
    CREATE INDEX IF NOT EXISTS posts_region ON posts(region_id,hidden,seq DESC);
    CREATE INDEX IF NOT EXISTS posts_location ON posts(location_key,hidden,seq DESC);
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 4), width INTEGER NOT NULL, height INTEGER NOT NULL,
      bytes BLOB NOT NULL, UNIQUE(post_id,ordinal)
    );
    CREATE TABLE IF NOT EXISTS comments (
      seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL,
      client_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(author_id,client_id)
    );
    CREATE INDEX IF NOT EXISTS comments_post ON comments(post_id,seq);
    CREATE TABLE IF NOT EXISTS audit (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, target_id TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rate_limits (actor_id TEXT NOT NULL, bucket TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(actor_id,bucket));
  `)
  // 첫 버전의 DB를 그대로 열어도 데이터 삭제 없이 재전송 검증을 추가한다.
  if (!db.prepare('PRAGMA table_info(posts)').all().some((c) => c.name === 'request_hash')) db.exec('ALTER TABLE posts ADD COLUMN request_hash TEXT')
  db.exec('INSERT OR IGNORE INTO schema_version VALUES (2)')
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE')
    try { const value = fn(); db.exec('COMMIT'); return value } catch (error) { db.exec('ROLLBACK'); throw error }
  }
  const raw = (id) => db.prepare('SELECT * FROM posts WHERE id=?').get(id)
  function readable(id, actor) {
    const post = raw(id)
    if (!post || (post.hidden && actor.role !== 'teacher')) throw new ApiError(404, 'not_found')
    return post
  }
  function serialize(post, actor) {
    return {
      id: post.id, regionId: post.region_id, locationKey: post.location_key, kind: post.kind,
      title: post.title, body: post.body, authorName: post.author_name, authorRole: post.author_role,
      createdAt: post.created_at, updatedAt: post.updated_at, version: post.version, hidden: !!post.hidden,
      canEdit: post.author_id === actor.id, canModerate: actor.role === 'teacher',
      photos: db.prepare('SELECT id,width,height FROM photos WHERE post_id=? ORDER BY ordinal').all(post.id),
      commentCount: db.prepare('SELECT count(*) AS n FROM comments WHERE post_id=?').get(post.id).n,
    }
  }
  function commentJson(c, actor) {
    return { id: c.id, body: c.body, authorName: c.author_name, createdAt: c.created_at, canDelete: actor.role === 'teacher' || c.author_id === actor.id }
  }
  const audit = (actor, action, target) => db.prepare('INSERT INTO audit VALUES (?,?,?,?,?)').run(randomUUID(), actor.id, action, target, new Date().toISOString())
  function owned(id, version, actor) {
    const post = readable(id, actor)
    if (post.author_id !== actor.id) throw new ApiError(403, 'not_owner')
    if (post.hidden) throw new ApiError(403, 'hidden_post')
    if (post.version !== version) throw new ApiError(409, 'version_conflict')
    return post
  }
  return {
    close: () => db.close(),
    rate(actor, kind, limit = 30) {
      const minute = Math.floor(Date.now() / 60000)
      const bucket = `${minute}:${kind}`
      const count = db.prepare('INSERT INTO rate_limits VALUES (?,?,1) ON CONFLICT(actor_id,bucket) DO UPDATE SET count=count+1 RETURNING count').get(actor.id, bucket).count
      if (count > limit) throw new ApiError(429, 'rate_limited')
      db.prepare('DELETE FROM rate_limits WHERE bucket < ?').run(`${minute - 2}:`)
    },
    list(actor, filters) {
      if (filters.hidden && actor.role !== 'teacher') throw new ApiError(403, 'teacher_required')
      const conditions = ['hidden=?'], args = [filters.hidden ? 1 : 0]
      for (const [key, column] of [['region', 'region_id'], ['location', 'location_key'], ['kind', 'kind']]) {
        if (filters[key]) { conditions.push(`${column}=?`); args.push(filters[key]) }
      }
      if (filters.before) { conditions.push('seq < ?'); args.push(filters.before) }
      const rows = db.prepare(`SELECT * FROM posts WHERE ${conditions.join(' AND ')} ORDER BY seq DESC LIMIT 21`).all(...args)
      return { posts: rows.slice(0, 20).map((p) => serialize(p, actor)), next: rows.length > 20 ? rows[19].seq : null }
    },
    get(actor, id) {
      const p = readable(id, actor)
      return { post: serialize(p, actor), comments: db.prepare('SELECT * FROM comments WHERE post_id=? ORDER BY seq LIMIT 500').all(id).map((c) => commentJson(c, actor)) }
    },
    existing(actor, clientId, requestHash) {
      const p = db.prepare('SELECT * FROM posts WHERE author_id=? AND client_id=?').get(actor.id, clientId)
      if (p?.request_hash && requestHash && p.request_hash !== requestHash) throw new ApiError(409, 'duplicate_post_key')
      return p ? serialize(readable(p.id, actor), actor) : null
    },
    create(actor, input, photos) {
      return transaction(() => {
        const existing = db.prepare('SELECT * FROM posts WHERE author_id=? AND client_id=?').get(actor.id, input.clientId)
        if (existing) {
          if (existing.request_hash && input.requestHash && existing.request_hash !== input.requestHash) throw new ApiError(409, 'duplicate_post_key')
          return serialize(readable(existing.id, actor), actor)
        }
        if (photos.length > 5) throw new ApiError(400, 'too_many_photos')
        const id = randomUUID(), now = new Date().toISOString()
        db.prepare('INSERT INTO posts (id,author_id,author_name,author_role,client_id,request_hash,region_id,location_key,kind,title,body,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .run(id, actor.id, actor.name, actor.role, input.clientId, input.requestHash ?? null, input.regionId, input.locationKey, input.kind, input.title, input.body, now, now)
        photos.forEach((p, i) => db.prepare('INSERT INTO photos VALUES (?,?,?,?,?,?)').run(randomUUID(), id, i, p.width, p.height, p.bytes))
        return serialize(raw(id), actor)
      })
    },
    update(actor, id, input, version) {
      return transaction(() => {
        owned(id, version, actor)
        db.prepare('UPDATE posts SET region_id=?,location_key=?,kind=?,title=?,body=?,updated_at=?,version=version+1 WHERE id=?').run(input.regionId, input.locationKey, input.kind, input.title, input.body, new Date().toISOString(), id)
        return serialize(raw(id), actor)
      })
    },
    remove(actor, id, version) {
      transaction(() => { const p = raw(id); if (!p) throw new ApiError(404, 'not_found'); if (p.author_id !== actor.id) throw new ApiError(403, 'not_owner'); if (p.version !== version) throw new ApiError(409, 'version_conflict'); audit(actor, 'delete_post', id); db.prepare('DELETE FROM posts WHERE id=?').run(id) })
    },
    moderate(actor, id, hidden, version) {
      return transaction(() => {
        if (actor.role !== 'teacher') throw new ApiError(403, 'teacher_required')
        const p = readable(id, actor)
        if (p.version !== version) throw new ApiError(409, 'version_conflict')
        db.prepare('UPDATE posts SET hidden=?,version=version+1,updated_at=? WHERE id=?').run(hidden ? 1 : 0, new Date().toISOString(), id)
        audit(actor, hidden ? 'hide_post' : 'restore_post', id)
        return serialize(raw(id), actor)
      })
    },
    comment(actor, postId, body, clientId) {
      return transaction(() => {
        const p = readable(postId, actor)
        if (p.hidden) throw new ApiError(403, 'hidden_post')
        const existing = db.prepare('SELECT * FROM comments WHERE author_id=? AND client_id=?').get(actor.id, clientId)
        if (existing) { if (existing.post_id !== postId) throw new ApiError(409, 'duplicate_comment_key'); return commentJson(existing, actor) }
        if (db.prepare('SELECT count(*) AS n FROM comments WHERE post_id=?').get(postId).n >= 500) throw new ApiError(400, 'comment_limit')
        const id = randomUUID()
        db.prepare('INSERT INTO comments (id,post_id,author_id,author_name,body,client_id,created_at) VALUES (?,?,?,?,?,?,?)').run(id, postId, actor.id, actor.name, body, clientId, new Date().toISOString())
        return commentJson(db.prepare('SELECT * FROM comments WHERE id=?').get(id), actor)
      })
    },
    removeComment(actor, postId, id) {
      transaction(() => {
        readable(postId, actor)
        const c = db.prepare('SELECT * FROM comments WHERE id=? AND post_id=?').get(id, postId)
        if (!c) throw new ApiError(404, 'not_found')
        if (actor.role !== 'teacher' && c.author_id !== actor.id) throw new ApiError(403, 'not_owner')
        audit(actor, 'delete_comment', id); db.prepare('DELETE FROM comments WHERE id=?').run(id)
      })
    },
    photo(actor, id) {
      const p = db.prepare('SELECT * FROM photos WHERE id=?').get(id)
      if (!p) throw new ApiError(404, 'not_found')
      readable(p.post_id, actor)
      return p.bytes
    },
  }
}
