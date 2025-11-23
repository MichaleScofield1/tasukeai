import React, { useState, useEffect } from 'react';
import Login from './Login';
import SkillSharePlatform from './SkillSharePlatform';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      console.log('Token:', token);

      if (token) {
        try {
          // トークンが有効か確認 & 最新のユーザー情報を取得
          const response = await fetch('https://tasukeai.vercel.app/api/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('AuthUser:', userData);
            setAuthUser(userData);
            setIsAuthenticated(true);
          } else {
            // トークンが無効な場合
            handleLogout();
          }
        } catch (error) {
          console.error('認証チェックエラー:', error);
          handleLogout();
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // ログイン成功時の処理
  const handleLoginSuccess = async (token) => {
    localStorage.setItem('authToken', token);
    
    try {
      // ログイン直後にユーザー情報を取得
      const response = await fetch('https://tasukeai.vercel.app/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('ログイン成功 - ユーザー情報:', userData);
        setAuthUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
    }
  };

  // プロフィール更新時の処理
  const handleProfileUpdate = async (updatedProfile) => {
    const token = localStorage.getItem('authToken');
    
    try {
      // プロフィールを保存
      const saveResponse = await fetch('https://tasukeai.vercel.app/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfile)
      });

      if (!saveResponse.ok) {
        throw new Error('プロフィール保存に失敗しました');
      }

      // 保存後、キャッシュバスティングで最新データを取得
      const refreshResponse = await fetch(
        `https://tasukeai.vercel.app/api/profile?_t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );

      if (refreshResponse.ok) {
        const freshData = await refreshResponse.json();
        console.log('プロフィール更新成功:', freshData);
        setAuthUser(freshData);
        return { success: true, data: freshData };
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return { success: false, error: error.message };
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setAuthUser(null);
    setIsAuthenticated(false);
    console.log('ログアウトしました');
  };

  // ローディング画面
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>読み込み中...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <SkillSharePlatform 
          onLogout={handleLogout}
          authUser={authUser}
          onProfileUpdate={handleProfileUpdate}
        />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default App;