import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import EquipmentRegisterPage from './pages/EquipmentRegisterPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import DashboardPage from './pages/DashboardPage';
import FaultsListPage from './pages/FaultsListPage';
import RepairsListPage from './pages/RepairsListPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<EquipmentRegisterPage />} />
                <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
                <Route path="/faults" element={<FaultsListPage />} />
                <Route path="/repairs" element={<RepairsListPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
