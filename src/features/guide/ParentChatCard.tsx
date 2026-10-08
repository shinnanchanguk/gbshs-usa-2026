import { Icon } from '../../components/Icon'
import { QrCode } from '../../components/QrCode'
import type { ParentContact } from '../../lib/roster'

/** 보호자 문의: 부장 선생님 1:1 오픈채팅(10/7 회의). 누르면 카카오톡으로 넘어가고, 컴퓨터로 볼 때는 QR 을 찍는다. */
export function ParentChatCard({ contact, teacherView }: { contact: ParentContact; teacherView: boolean }) {
  const shown = contact.url.replace(/^https:\/\//, '')
  return (
    <section className="card parent-chat">
      <h3 className="card__title">
        <Icon name="chat" size="1.05rem" /> 보호자 문의
      </h3>
      <p className="parent-chat__lead">여행 중 궁금한 일은 {contact.teacher} 부장 선생님께 카카오톡 1:1 오픈채팅으로 물어봐 주세요.</p>
      <div className="parent-chat__row">
        <QrCode size={contact.qr.size} path={contact.qr.path} label="부장 선생님 오픈채팅 QR 코드" />
        <div className="parent-chat__go">
          <a className="call" href={contact.url} target="_blank" rel="noopener noreferrer">
            <Icon name="chat" size="1rem" />
            오픈채팅 열기
          </a>
          <p className="fineprint">컴퓨터로 보고 있다면 휴대폰 카메라로 QR 코드를 찍어 주세요.</p>
        </div>
      </div>
      <a className="parent-chat__url mono" href={contact.url} target="_blank" rel="noopener noreferrer">
        {shown}
      </a>
      {teacherView ? <p className="fineprint">보호자 화면에도 이 칸이 보여요.</p> : null}
    </section>
  )
}
