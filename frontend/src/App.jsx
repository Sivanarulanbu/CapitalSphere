import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransferPage from './pages/TransferPage';
import TransactionsPage from './pages/TransactionsPage';
import LoansPage from './pages/LoansPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import DepositPage from './pages/DepositPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-loader">
      <div className="logo-mark" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
        <div className="logo-icon" style={{ width: 52, height: 52, fontSize: '1.4rem' }}>N</div>
      </div>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/accounts" element={<PrivateRoute><AccountsPage /></PrivateRoute>} />
      <Route path="/deposit" element={<PrivateRoute><DepositPage /></PrivateRoute>} />
      <Route path="/transfer" element={<PrivateRoute><TransferPage /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
      <Route path="/loans" element={<PrivateRoute><LoansPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a2235',
                color: '#f0f4ff',
                border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: '12px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.88rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#f0f4ff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f0f4ff' } },
              duration: 4000,
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
