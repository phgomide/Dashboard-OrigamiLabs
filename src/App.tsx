import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { AppStoreProvider } from './store/AppStore'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const LeadsPage = lazy(() => import('./pages/LeadsPage').then((module) => ({ default: module.LeadsPage })))
const PipelinePage = lazy(() => import('./pages/PipelinePage').then((module) => ({ default: module.PipelinePage })))
const operations = import('./pages/OperationsPages')
const AgendaPage = lazy(() => operations.then((module) => ({ default: module.AgendaPage })))
const ProposalsPage = lazy(() => operations.then((module) => ({ default: module.ProposalsPage })))
const ProjectsPage = lazy(() => operations.then((module) => ({ default: module.ProjectsPage })))
const FinancePage = lazy(() => operations.then((module) => ({ default: module.FinancePage })))
const ReportsPage = lazy(() => operations.then((module) => ({ default: module.ReportsPage })))
const SettingsPage = lazy(() => operations.then((module) => ({ default: module.SettingsPage })))

function PageLoader() {
  return <div className="page" aria-busy="true" aria-label="Carregando página"><div className="page-skeleton"><span /><span /><span /><span /></div></div>
}

export default function App() {
  return <AuthProvider><ProtectedRoute><AppStoreProvider><BrowserRouter><AppShell><Suspense fallback={<PageLoader />}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/leads" element={<LeadsPage />} /><Route path="/pipeline" element={<PipelinePage />} /><Route path="/agenda" element={<AgendaPage />} /><Route path="/propostas" element={<ProposalsPage />} /><Route path="/projetos" element={<ProjectsPage />} /><Route path="/financeiro" element={<FinancePage />} /><Route path="/relatorios" element={<ReportsPage />} /><Route path="/configuracoes" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense></AppShell></BrowserRouter></AppStoreProvider></ProtectedRoute></AuthProvider>
}
