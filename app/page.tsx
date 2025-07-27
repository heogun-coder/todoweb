"use client"
import { TaskProvider } from "@/contexts/TaskContext"
import { AuthProvider } from "@/contexts/AuthContext"
import LoginForm from "@/components/LoginForm"
import Dashboard from "@/components/Dashboard"
import { useAuth } from "@/contexts/AuthContext"

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <TaskProvider>
          <Dashboard />
        </TaskProvider>
      ) : (
        <LoginForm />
      )}
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
