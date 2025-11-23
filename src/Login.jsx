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

      if (isLogin) {
        alert('ログインしました');
        onLoginSuccess(data.token);
      } else {
        alert('登録が完了しました。メールを確認してください！');
        setIsLogin(true);
      }

    } catch (err) {
      console.error('エラー:', err);
      setError('サーバーに接続できません');
    }

    setLoading(false);
  };

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
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                    メールアドレス（@ed.tus.ac.jp）<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="xxxxxxxx@ed.tus.ac.jp"
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

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>ニックネーム</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    placeholder="ニックネームを入力"
                    style={{ 
                      width: '100%', 
                      padding: '10px',
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>学科</label>
  <select
    value={department}
    onChange={(e) => setDepartment(e.target.value)}
    required
    style={{ 
      width: '100%', 
      padding: '10px',
      border: '1px solid #d1d5db', 
      borderRadius: '8px', 
      fontSize: '14px',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}
  >
    <option value="">選択してください</option>
    <option value="情報計算科学科">情報計算科学科</option>
    <option value="数理科学科">数理科学科</option>
    <option value="先端物理学科">先端物理学科</option>
    <option value="生命情報学科">生命情報学科</option>
    <option value="電気電子情報工学科">電気電子情報工学科</option>
    <option value="経営システム工学科">経営システム工学科</option>
    <option value="機械航空宇宙工学科">機械航空宇宙工学科</option>
    <option value="社会基盤工学科">社会基盤工学科</option>
    <option value="建築学科">建築学科</option>
    <option value="その他">その他</option>
  </select>
</div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>学年</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '10px',
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">選択してください</option>
                    <option value="1年">1年</option>
                    <option value="2年">2年</option>
                    <option value="3年">3年</option>
                    <option value="4年">4年</option>
                    <option value="その他">その他</option>
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