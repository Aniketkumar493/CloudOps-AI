import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar/Sidebar'
import AWSAccounts from './pages/AWSAccounts'

// Layout wrapper to include fixed Sidebar and dynamic page outlets
function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 pl-16 md:pl-64 min-h-screen transition-all duration-300">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// Stylized Placeholder components for future phases
const ComingSoonCard = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 border border-slate-800 bg-slate-900/30 rounded-2xl text-center space-y-4">
    <div className="text-xl md:text-2xl font-bold text-white">{title}</div>
    <p className="text-xs text-slate-500 max-w-sm">
      This section is currently under active development as part of the CloudOps-AI roadmap. Stay tuned!
    </p>
  </div>
)

const Dashboard = () => <ComingSoonCard title="Dashboard" />
const EC2Instances = () => <ComingSoonCard title="EC2 Instances" />
const CloudWatch = () => <ComingSoonCard title="CloudWatch" />
const Alerts = () => <ComingSoonCard title="Alerts" />
const AutoHealing = () => <ComingSoonCard title="Auto Healing" />
const ActivityLogs = () => <ComingSoonCard title="Activity Logs" />
const Settings = () => <ComingSoonCard title="Settings" />

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="aws-accounts" element={<AWSAccounts />} />
        <Route path="instances" element={<EC2Instances />} />
        <Route path="cloudwatch" element={<CloudWatch />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="auto-healing" element={<AutoHealing />} />
        <Route path="logs" element={<ActivityLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
