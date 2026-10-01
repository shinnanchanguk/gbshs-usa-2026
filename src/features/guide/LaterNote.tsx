import { Icon } from '../../components/Icon'
/** 사전 안내판에서 명단(자리·방·연락처) 대신 두는 안내 */
export function LaterNote({ icon, title, text }: { icon: 'seat' | 'bed' | 'phone' | 'users'; title: string; text: string }) {
  return (
    <section className="later" aria-label={title}>
      <Icon name={icon} size="1.15rem" />
      <div>
        <h3 className="later__title">{title}</h3>
        <p className="later__text">{text}</p>
      </div>
    </section>
  )
}
