import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './AdminPage'
import ClientePage from './ClientePage'
import RedefinirSenhaPage from './RedefinirSenhaPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
