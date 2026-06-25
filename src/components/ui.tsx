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

export function ConfirmDialog({ title, description, confirmLabel = 'Remover', onCancel, onConfirm }: { title: string; description: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void | Promise<void> }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}><section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" onMouseDown={(event) => event.stopPropagation()}><div className="confirm-card__mark"><X size={18} /></div><div><span className="eyebrow">Confirmar alteração</span><h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p></div><footer><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></footer></section></div>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-state__mark" /><h3>{title}</h3><p>{description}</p></div>
}
