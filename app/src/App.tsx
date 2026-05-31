import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import Workbench from './pages/Workbench'
import Assistant from './pages/Assistant'
import CryptoStego from './pages/CryptoStego'
import PageFrame from '@/components/PageFrame'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PageFrame><Home /></PageFrame>} />
      <Route path="/login" element={<PageFrame><Login /></PageFrame>} />
      <Route path="/register" element={<PageFrame><Register /></PageFrame>} />
      <Route path="/admin" element={<PageFrame><Admin /></PageFrame>} />
      <Route path="/workbench" element={<PageFrame><Workbench /></PageFrame>} />
      <Route path="/assistant" element={<PageFrame><Assistant /></PageFrame>} />
      <Route path="/crypto" element={<PageFrame><CryptoStego /></PageFrame>} />
      <Route path="*" element={<PageFrame><NotFound /></PageFrame>} />
    </Routes>
  )
}
