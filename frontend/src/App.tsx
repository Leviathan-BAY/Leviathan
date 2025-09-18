import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@shared/components/ui/toaster'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import HermitFinancePage from './pages/HermitFinancePage'
import HumpbackLaunchpadPage from './pages/HumpbackLaunchpadPage'
import SplashZonePage from './pages/SplashZonePage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/hermit" element={<HermitFinancePage />} />
          <Route path="/launchpad" element={<HumpbackLaunchpadPage />} />
          <Route path="/splash" element={<SplashZonePage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App