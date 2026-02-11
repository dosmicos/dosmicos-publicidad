import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import UgcUploadPage from './pages/UgcUploadPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/upload/:token" element={<UgcUploadPage />} />
        {/* Cualquier otra ruta redirige a una página genérica */}
        <Route path="*" element={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center space-y-4">
              <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-8 mx-auto" />
              <p className="text-gray-400 text-sm">Portal de upload de videos</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
