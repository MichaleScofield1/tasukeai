import React, { useState, useEffect } from 'react';
import Login from './Login';
import SkillSharePlatform from './SkillSharePlatform';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ページ読み込み時にログイン状態を確認
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userProfile = localStorage.getItem('userProfile');
      
      console.log('Token:', token);
      console.log('UserProfile:', userProfile);
      
      if (token && userProfile) {
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
    localStorage.removeItem('userProfile');
    setIsAuthenticated(false);
  };

  // ローディング中
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>読み込み中...</p>
      </div>
    );
  }

  // 認証状態に応じて表示を切り替え
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