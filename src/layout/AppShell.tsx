import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bell, CalendarDays, ChartNoAxesCombined, CircleDollarSign, Database, FileJson, FileText, FolderKanban, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles, Users, X } from 'lucide-react'
import { Button } from '../components/ui'
import { LeadForm } from '../components/LeadForm'
import { useAuth } from '../auth/useAuth'
import { monthlyRevenueStatus } from '../lib/analytics'
import { currency } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

const nav = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/leads', 'Leads', Users],
  ['/pipeline', 'Pipeline', FolderKanban],
  ['/agenda', 'Agenda', CalendarDays],
  ['/propostas', 'Propostas', FileText],
  ['/projetos', 'Projetos', Sparkles],
  ['/financeiro', 'Financeiro', CircleDollarSign],
  ['/relatorios', 'Relatorios', ChartNoAxesCombined],
  ['/admin/leads', 'Base Origami', Database],
  ['/admin/leads/import', 'Importar JSON', FileJson],
  ['/configuracoes', 'Configuracoes', Settings],
] as const
const labels: Record<string, string> = Object.fromEntries(nav.map(([path, label]) => [path, label]))

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const location = useLocation()
  const { signOut, demoMode } = useAuth()
  const { activities, projects } = useAppStore()
  const agendaCount = activities.filter((activity) => !activity.status.toLowerCase().startsWith('conclu')).length
  const revenue = monthlyRevenueStatus(projects)

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Pular para o conteudo</a>
    <aside className={menuOpen ? 'sidebar sidebar--open' : 'sidebar'}>
      <div className="brand"><img src="/brand/origami-logo.png" alt="Origami Labs"/><div><strong>Origami</strong><small>Command Center</small></div></div>
      <button className="sidebar__close icon-button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={19} /></button>
      <nav aria-label="Navegacao principal">
        <span className="sidebar__section">Workspace</span>
        {nav.slice(0, 8).map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span>{label === 'Agenda' && agendaCount > 0 && <em>{agendaCount}</em>}</NavLink>)}
        <span className="sidebar__section sidebar__section--second">Sistema</span>
        {nav.slice(8).map(([path, label, Icon]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar__insight">
        <span className="sidebar__insight-icon"><Sparkles size={16} /></span>
        <strong>{demoMode ? 'Modo demonstracao' : 'Receita do mes'}</strong>
        <p>{demoMode ? 'Dados locais de exemplo' : currency.format(revenue.closed)}</p>
        <div className="progress"><span style={{ width: `${revenue.percentReceived}%` }} /></div>
        <small>{demoMode ? 'Configure o Supabase para uso real' : `${currency.format(revenue.received)} recebido - ${revenue.count} projetos`}</small>
      </div>
      <div className="profile">
        <span className="avatar">OL</span>
        <div><strong>Origami Labs</strong><small>{demoMode ? 'Modo demonstracao' : 'Workspace interno'}</small></div>
        <button className="icon-button" aria-label="Sair" onClick={() => void signOut()}><LogOut size={16}/></button>
      </div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <div className="workspace">
      <header className="topbar">
        <div className="topbar__title"><button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div><span>Origami Labs</span><strong>{labels[location.pathname] ?? 'Command Center'}</strong></div></div>
        <label className="global-search"><Search size={17} /><input type="search" placeholder="Buscar leads, propostas..." aria-label="Buscar no Command Center" /><kbd>Ctrl K</kbd></label>
        <div className="topbar__actions"><button className="icon-button notification" aria-label="Notificacoes"><Bell size={19} /><span /></button><Button onClick={() => setLeadOpen(true)}><Plus size={17} />Novo lead</Button><span className="avatar avatar--top">OL</span></div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
    {leadOpen && <LeadForm onClose={() => setLeadOpen(false)} />}
  </div>
}
