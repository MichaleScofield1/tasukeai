import React, { useState } from 'react';
import { User, Lock, LogIn, Mail, CheckCircle, UserPlus } from 'lucide-react';

const API_BASE = "https://tasukeai.vercel.app";

const Login = ({ onLoginSuccess }) => {
  // ====================================================================
  // State管理
  // ====================================================================
  const [isLogin, setIsLogin] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ログイン用フォーム
  const [loginForm, setLoginForm] = useState({
    studentId: '',
    password: ''
  });

  // 新規登録用フォーム（confirmPasswordを追加）
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '', // ← 追加
    nickname: '',
    department: '',
    year: ''
  });

  // パスワード一致チェック
  const passwordsMatch = registerForm.password === registerForm.confirmPassword;
  const showPasswordError = registerForm.confirmPassword.length > 0 && !passwordsMatch;

  // ====================================================================
  // ログイン処理
  // ====================================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loginForm.studentId || !loginForm.password) {
      setError('学籍番号とパスワードを入力してください');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: loginForm.studentId,
          password: loginForm.password
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("JSON を解析できません（サーバー側エラー）");
      }

      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.token);

    } catch (err) {
      console.error('ログインエラー:', err);
      setError('サーバーに接続できません');
    }

    setLoading(false);
  };

  // ====================================================================
  // 新規登録処理
  // ====================================================================
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // バリデーション
    if (!registerForm.studentId || !registerForm.email || !registerForm.password || 
        !registerForm.confirmPassword || !registerForm.nickname || !registerForm.department || !registerForm.year) {
      setError('すべての項目を入力してください');
      setLoading(false);
      return;
    }

    // パスワード一致チェック
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 6) {
      setError('パスワードは6文字以上で設定してください');
      setLoading(false);
      return;
    }

    if (!registerForm.email.endsWith('@ed.tus.ac.jp')) {
      setError('大学のメールアドレス（@ed.tus.ac.jp）を使用してください');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: registerForm.studentId,
          email: registerForm.email,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword, // ← 追加
          nickname: registerForm.nickname,
          department: registerForm.department,
          year: registerForm.year
        })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("JSON を解析できません（サーバー側エラー）");
      }

      if (!res.ok) {
        setError(data.error || '登録に失敗しました');
        setLoading(false);
        return;
      }

      setRegisteredEmail(registerForm.email);
      setShowEmailConfirmation(true);
      setError('');
      
      setRegisterForm({
        studentId: '',
        email: '',
        password: '',
        confirmPassword: '', // ← リセット時も追加
        nickname: '',
        department: '',
        year: ''
      });

    } catch (err) {
      console.error('登録エラー:', err);
      setError('サーバーに接続できません');
    }

    setLoading(false);
  };

  // ====================================================================
  // メール確認画面
  // ====================================================================
  if (showEmailConfirmation) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            登録ありがとうございます！
          </h2>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Mail size={32} color="#2563eb" />
          </div>

          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            <strong>{registeredEmail}</strong> 宛に<br />
            確認メールを送信しました。
          </p>

          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#374151',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              次の手順でアカウントを有効化してください：
            </p>
            <ol style={{
              fontSize: '14px',
              color: '#4b5563',
              paddingLeft: '20px',
              margin: '0',
              lineHeight: '1.8'
            }}>
              <li>メールボックスを確認してください</li>
              <li>届いたメール内のリンクをクリックしてください</li>
              <li>ログイン画面が表示されます</li>
              <li>学籍番号とパスワードでログインしてください</li>
            </ol>
          </div>

          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            ※ メールが届かない場合は、迷惑メールフォルダをご確認ください
          </p>

          <button
            onClick={() => window.close()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            このタブを閉じてください
          </button>
        </div>
      </div>
    );
  }

  // ====================================================================
  // スタイル定義
  // ====================================================================
  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
    overflowY: 'auto',
    padding: '40px 0' // 上下の余白を増やす
  };

  const formContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    margin: '20px auto', // 上下にマージンを追加
    maxHeight: 'none' // 最大高さ制限を解除
  };

  // ====================================================================
  // ログイン/新規登録画面
  // ====================================================================
  return (
    <div style={modalOverlayStyle}>
      <div style={formContainerStyle}>
        {/* タイトル */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
            助け合いの極み
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {isLogin ? 'アカウントにログイン' : '新規アカウント作成'}
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  学籍番号
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af', 
                    pointerEvents: 'none' 
                  }} size={20} />
                  <input
                    type="text"
                    value={loginForm.studentId}
                    onChange={(e) => setLoginForm({...loginForm, studentId: e.target.value})}
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
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  パスワード
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af', 
                    pointerEvents: 'none' 
                  }} size={20} />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    required
                    minLength={6}
                    placeholder="6文字以上で入力"
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

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px', 
                  padding: '12px',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px', 
                  fontWeight: '500'
                }}
              >
                {loading ? '処理中...' : <><LogIn size={20} />ログイン</>}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  学籍番号
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af', 
                    pointerEvents: 'none' 
                  }} size={20} />
                  <input
                    type="text"
                    value={registerForm.studentId}
                    onChange={(e) => setRegisterForm({...registerForm, studentId: e.target.value})}
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
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  メールアドレス（@ed.tus.ac.jp）<span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af', 
                    pointerEvents: 'none' 
                  }} size={20} />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
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

              {/* パスワード */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  パスワード
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af', 
                    pointerEvents: 'none' 
                  }} size={20} />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    required
                    minLength={6}
                    placeholder="6文字以上で入力"
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
                {registerForm.password && registerForm.password.length < 6 && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    パスワードは6文字以上で入力してください
                  </p>
                )}
              </div>

              {/* パスワード確認（新規追加） */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  パスワード（確認）<span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af', 
                    pointerEvents: 'none' 
                  }} size={20} />
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    required
                    placeholder="もう一度パスワードを入力"
                    style={{ 
                      width: '100%', 
                      paddingLeft: '44px', 
                      paddingRight: '16px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      border: showPasswordError ? '1px solid #dc2626' : '1px solid #d1d5db', 
                      borderRadius: '8px', 
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {showPasswordError && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '4px' }}>⚠️</span>
                    パスワードが一致しません
                  </p>
                )}
                {registerForm.confirmPassword.length > 0 && passwordsMatch && (
                  <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '4px' }}>✓</span>
                    パスワードが一致しています
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  ニックネーム
                </label>
                <input
                  type="text"
                  value={registerForm.nickname}
                  onChange={(e) => setRegisterForm({...registerForm, nickname: e.target.value})}
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
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  学科
                </label>
                <select
                  value={registerForm.department}
                  onChange={(e) => setRegisterForm({...registerForm, department: e.target.value})}
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
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px', 
                  color: '#374151' 
                }}>
                  学年
                </label>
                <select
                  value={registerForm.year}
                  onChange={(e) => setRegisterForm({...registerForm, year: e.target.value})}
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
                  <option value="1年">1年</option>
                  <option value="2年">2年</option>
                  <option value="3年">3年</option>
                  <option value="4年">4年</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px', 
                  padding: '12px',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px', 
                  fontWeight: '500'
                }}
              >
                {loading ? '処理中...' : <><UserPlus size={20} />新規登録</>}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setLoginForm({ studentId: '', password: '' });
              setRegisterForm({
                studentId: '',
                email: '',
                password: '',
                confirmPassword: '', // ← リセット時も追加
                nickname: '',
                department: '',
                year: ''
              });
            }}
            style={{ 
              color: '#2563eb', 
              fontSize: '14px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              textDecoration: 'underline' 
            }}
          >
            {isLogin ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
