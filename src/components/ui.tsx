import { X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={clsx('button', `button--${variant}`, className)} {...props} />
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' }) {
  return <span className={clsx('badge', `badge--${tone}`)}>{children}</span>
}

export function Modal({ title, children, onClose, size = 'md' }: { title: string; children: ReactNode; onClose: () => void; size?: 'md' | 'lg' }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className={clsx('modal', `modal--${size}`)} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><header className="modal__header"><div><span className="eyebrow">Origami Command Center</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={19} /></button></header><div className="modal__body">{children}</div></section></div>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-state__mark" /><h3>{title}</h3><p>{description}</p></div>
}
