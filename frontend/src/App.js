import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import ActivityTimeline from './components/ActivityTimeline';
import Tools from './components/Tools';
import Upload from './pages/Upload';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <Dashboard />
                  </main>
                </>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route path="/transactions" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <TransactionHistory />
                  </main>
                </>
              </ProtectedRoute>
            } />

            <Route path="/tools" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <Tools />
                  </main>
                </>
              </ProtectedRoute>
            } />

            <Route path="/upload" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <Upload />
                  </main>
                </>
              </ProtectedRoute>
            } />

            <Route path="/activity" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <ActivityTimeline />
                  </main>
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;