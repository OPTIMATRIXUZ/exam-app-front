import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/auth-store'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ModulePage from './pages/module/ModulePage'
import AddQuestionPage from './pages/module/AddQuestionPage'
import ResultsPage from './pages/module/ResultsPage'
import ResultDetailPage from './pages/module/ResultDetailPage'
import StartTestPage from './pages/StartTestPage'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/auth/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/module/:id" 
        element={
          <ProtectedRoute>
            <ModulePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/module/:id/add-question" 
        element={
          <ProtectedRoute>
            <AddQuestionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/module/:id/results" 
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/module/:id/results/:result_id" 
        element={
          <ProtectedRoute>
            <ResultDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/start-test/:id" 
        element={
          <ProtectedRoute>
            <StartTestPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App