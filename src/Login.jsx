import React, { useState } from 'react';
import { User, Lock, LogIn, UserPlus, Mail } from 'lucide-react';

const API_BASE = "https://tasukeai.vercel.app";

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------------
  // 送信処理 ★修正箇所★
  // ----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';

      const body = isLogin
        ? { studentId, password }
        : { studentId, password, nickname, department, year, email };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("JSON を解析できません（サーバー側エラー）");
      }

      if (!response.ok) {
        setError(data.error || 'エラーが発生しました');
        setLoading(false);
        return;
      }

      // ★★★ ここが重要な変更点 ★★★
      if (isLogin) {
        // ログイン成功時、トークンをApp.jsxに渡す
        alert('ログインしました');
        onLoginSuccess(data.token); // ← トークンを渡す
      } else {
        // 新規登録時
        alert('登録が完了しました。メールを確認してください！');
        setIsLogin(true); // ログイン画面に切り替え
      }

    } catch (err) {
      console.error('エラー:', err);
      setError('サーバーに接続できません');
    }

    setLoading(false);
  };

  // ----------------------------------------------------------
  // UI（元のコードそのまま）
  // ----------------------------------------------------------

  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh'
  };

  const formContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={formContainerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
            助け合いの極み
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {isLogin ? 'アカウントにログイン' : '新規アカウント作成'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* 学籍番号 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>学籍番号</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={20} />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  placeholder="学籍番号を入力"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '44px', 
                    paddingRight: '16px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>パスワード</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '44px', 
                    paddingRight: '16px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {!isLogin && (
              <>
                {/* メールアドレス */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                    メールアドレス（@ed.tus.ac.jp）<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="6323xxxx@ed.tus.ac.jp"
                      style={{ 
                        width: '100%', 
                        paddingLeft: '44px', 
                        padding: '10px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px', 
                        fontSize: '14px' 
                      }}
                    />
                  </div>
                </div>

                {/* ニックネーム */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>ニックネーム</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    placeholder="ニックネームを入力"
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>

                {/* 学科 */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>学科</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    placeholder="例: 情報工学科"
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>

                {/* 学年 */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>学年</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  >
                    <option value="">選択してください</option>
                    <option value="1年">1年</option>
                    <option value="2年">2年</option>
                    <option value="3年">3年</option>
                    <option value="4年">4年</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '12px',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px', fontWeight: '500'
              }}
            >
              {loading ? '処理中...' : isLogin ? <><LogIn size={20} />ログイン</> : <><UserPlus size={20} />新規登録</>}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setStudentId('');
              setPassword('');
              setNickname('');
              setDepartment('');
              setYear('');
              setEmail('');
            }}
            style={{ color: '#2563eb', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;