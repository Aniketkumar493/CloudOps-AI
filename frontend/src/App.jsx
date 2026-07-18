import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar/Sidebar'
import AWSAccounts from './pages/AWSAccounts'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EC2Instances from './pages/EC2Instances'
import InstanceDetail from './pages/InstanceDetail'
import ProtectedRoute from './components/ProtectedRoute'
import Alerts from './pages/Alerts'
import AutoHealing from './pages/AutoHealing'
import ActivityLogs from './pages/ActivityLogs'
import CloudWatch from './pages/CloudWatch'
import Settings from './pages/Settings'

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







function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected App Layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="aws-accounts" element={<AWSAccounts />} />
          <Route path="instances" element={<EC2Instances />} />
          <Route path="instances/:id" element={<InstanceDetail />} />
          <Route path="cloudwatch" element={<CloudWatch />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="auto-healing" element={<AutoHealing />} />
          <Route path="logs" element={<ActivityLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

