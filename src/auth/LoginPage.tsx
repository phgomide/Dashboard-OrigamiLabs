import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { signIn, enterDemo, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true)
    try { await signIn(email, password) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.') } finally { setSaving(false) }
  }
  return <main className="login-page"><section className="login-brand"><img src="/brand/origami-logo.png" alt="Origami Labs" /><div><span>Origami Labs</span><h1>Transforme conversas em projetos.</h1><p>Prospecção, propostas e projetos em um só lugar.</p></div><small>Origami Command Center</small></section><section className="login-panel"><div className="login-card"><span className="eyebrow">Acesso interno</span><h2>Bem-vindo de volta</h2><p>Entre com sua conta da Origami Labs.</p>{configured ? <form onSubmit={submit}><label>E-mail<div><Mail size={17}/><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@origamilabs.com" /></div></label><label>Senha<div><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>{error && <div className="login-error" role="alert">{error}</div>}<button className="login-submit" disabled={saving}>{saving ? 'Entrando…' : 'Entrar no Command Center'}</button></form> : <div className="demo-access"><p>O Supabase ainda não foi configurado neste ambiente.</p><button className="login-submit" onClick={enterDemo}>Entrar no modo demonstração</button><small>Para autenticação real, configure o arquivo <code>.env.local</code>.</small></div>}<footer>Uso interno · Origami Labs</footer></div></section></main>
}
