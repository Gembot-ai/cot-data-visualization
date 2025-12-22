import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './pages/Dashboard.page';
import { LoginPage } from './components/auth/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Check if password is in URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPassword = urlParams.get('password');
    const storedPassword = localStorage.getItem('app_password');

    if (urlPassword) {
      setPassword(urlPassword);
      localStorage.setItem('app_password', urlPassword);
      setIsAuthenticated(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (storedPassword) {
      setPassword(storedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (enteredPassword: string) => {
    // Test password by making a request to the API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/markets${enteredPassword ? `?password=${enteredPassword}` : ''}`);

      if (response.ok) {
        setPassword(enteredPassword);
        if (enteredPassword) {
          localStorage.setItem('app_password', enteredPassword);
        }
        setIsAuthenticated(true);
      } else {
        alert('Invalid password');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };

  // Add password to all API requests
  useEffect(() => {
    if (password) {
      // Store password globally for API client
      (window as any).__APP_PASSWORD__ = password;
    }
  }, [password]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
}

export default App;
