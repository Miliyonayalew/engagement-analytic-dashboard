import { DashboardProvider } from './contexts/DashboardContext'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <DashboardProvider>
      <div className="app">
        <Dashboard />
      </div>
    </DashboardProvider>
  )
}

export default App 