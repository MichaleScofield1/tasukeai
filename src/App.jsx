import React, { useState, useEffect } from 'react';
import Login from './Login';
import SkillSharePlatform from './SkillSharePlatform';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const authUser = localStorage.getItem('authUser');  // ← 修正ポイント

      console.log('Token:', token);
      console.log('AuthUser:', authUser);

      if (token && authUser) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');   // ← 修正ポイント
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <SkillSharePlatform onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default App;
