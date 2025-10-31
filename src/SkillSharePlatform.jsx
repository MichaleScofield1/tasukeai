import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Lock } from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  arrayUnion,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

const SkillSharePlatform = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reply, setReply] = useState('');
  const [profile, setProfile] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    tags: []
  });

  const categories = ['機械学習', 'ウェブ開発', 'データ分析', 'デザイン', 'その他'];

  useEffect(() => {
    loadProfile();
    loadThreads();
  }, []);

  const loadProfile = () => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setShowProfile(true);
    }
  };

  const loadThreads = async () => {
    try {
      const threadsQuery = query(collection(db, 'threads'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(threadsQuery);
      const threadsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(threadsData);
    } catch (error) {
      console.error('スレッドの読み込みエラー:', error);
      alert('スレッドの読み込みに失敗しました');
    }
  };

  const saveProfile = (profileData) => {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setProfile(profileData);
    setShowProfile(false);
  };

  const createThread = async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    if (!profile) {
      alert('プロフィールを設定してください');
      return;
    }

    try {
      const threadData = {
        ...newThread,
        author: profile.nickname,
        authorId: profile.userId,
        responses: [],
        status: 'open',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'threads'), threadData);
      
      setNewThread({ title: '', content: '', tags: [] });
      setShowNewThread(false);
      loadThreads();
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  const addReply = async () => {
    if (!reply.trim()) return;
    if (!profile) {
      alert('プロフィールを設定してください');
      return;
    }

    try {
      const threadRef = doc(db, 'threads', selectedThread.id);
      const newResponse = {
        id: Date.now(),
        author: profile.nickname,
        authorId: profile.userId,
        content: reply,
        timestamp: new Date().toISOString(),
        isBest: false
      };

      await updateDoc(threadRef, {
        responses: arrayUnion(newResponse)
      });

      setReply('');
      const updatedThread = {
        ...selectedThread,
        responses: [...(selectedThread.responses || []), newResponse]
      };
      setSelectedThread(updatedThread);
      loadThreads();
    } catch (error) {
      console.error('返信エラー:', error);
      alert('返信の投稿に失敗しました');
    }
  };

  const selectBestAnswer = async (responseId) => {
    if (!selectedThread || selectedThread.author !== profile.nickname) return;

    try {
      const threadRef = doc(db, 'threads', selectedThread.id);
      const updatedResponses = selectedThread.responses.map(response => ({
        ...response,
        isBest: response.id === responseId
      }));

      await updateDoc(threadRef, {
        responses: updatedResponses
      });

      setShowCloseConfirm(true);

      const updatedThread = {
        ...selectedThread,
        responses: updatedResponses
      };
      setSelectedThread(updatedThread);
      loadThreads();
    } catch (error) {
      console.error('ベストアンサー選択エラー:', error);
      alert('ベストアンサーの選択に失敗しました');
    }
  };

  const closeThread = async (shouldClose) => {
    setShowCloseConfirm(false);
    
    if (!shouldClose || !selectedThread) return;

    try {
      const threadRef = doc(db, 'threads', selectedThread.id);
      await updateDoc(threadRef, {
        status: 'closed'
      });

      const updatedThread = {
        ...selectedThread,
        status: 'closed'
      };
      setSelectedThread(updatedThread);
      loadThreads();
    } catch (error) {
      console.error('スレッドクローズエラー:', error);
      alert('スレッドのクローズに失敗しました');
    }
  };

  const closeThreadDirectly = async () => {
    if (!selectedThread || selectedThread.author !== profile.nickname) return;

    if (!window.confirm('このスレッドを解決済みにしますか？\n※この操作は取り消せません')) {
      return;
    }

    try {
      const threadRef = doc(db, 'threads', selectedThread.id);
      await updateDoc(threadRef, {
        status: 'closed'
      });

      const updatedThread = {
        ...selectedThread,
        status: 'closed'
      };
      setSelectedThread(updatedThread);
      loadThreads();
    } catch (error) {
      console.error('スレッドクローズエラー:', error);
      alert('スレッドのクローズに失敗しました');
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb', borderBottom: '4px solid #2563eb', paddingBottom: '8px' }}>
              助け合いの極み
            </h1>
            <button 
              onClick={() => setShowProfile(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
            >
              <User size={20} />
              {profile ? profile.nickname : 'プロフィール設定'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} size={20} />
              <input
                type="text"
                placeholder="スレッドを検索..."
                style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowNewThread(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={20} />
              新規スレッド
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {filteredThreads.map(thread => (
            <div 
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', cursor: 'pointer', borderLeft: '4px solid #2563eb' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{thread.title}</h3>
                    {thread.status === 'closed' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', fontSize: '12px' }}>
                        <CheckCircle size={14} />
                        解決済み
                      </span>
                    )}
                    {thread.author === profile?.nickname && (
                      <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '12px' }}>
                        あなたの投稿
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                    投稿者: {thread.author} @{thread.authorId?.substring(0, 4)}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {thread.tags.map((tag, idx) => (
                      <span key={idx} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '9999px', fontSize: '12px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  返信: {thread.responses?.length || 0}件
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 新規スレッド作成モーダル */}
        {showNewThread && (
          <div style={modalOverlayStyle} onClick={() => setShowNewThread(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>新規スレッド作成</h2>
                <button 
                  onClick={() => setShowNewThread(false)}
                  style={{ padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="タイトル"
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                />
                
                <textarea
                  placeholder="内容"
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', height: '160px', outline: 'none' }}
                  value={newThread.content}
                  onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                />
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>カテゴリータグ</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          const tags = newThread.tags.includes(cat)
                            ? newThread.tags.filter(t => t !== cat)
                            : [...newThread.tags, cat];
                          setNewThread({...newThread, tags});
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: newThread.tags.includes(cat) ? '#2563eb' : '#e5e7eb',
                          color: newThread.tags.includes(cat) ? 'white' : '#374151'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={createThread}
                  style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  投稿する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* スレッド詳細モーダル */}
        {selectedThread && (
          <div style={modalOverlayStyle} onClick={() => setSelectedThread(null)}>
            <div style={{...modalContentStyle, maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedThread.title}</h2>
                    {selectedThread.status === 'closed' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '14px' }}>
                        <CheckCircle size={16} />
                        解決済み
                      </span>
                    )}
                  </div>
                  {selectedThread.status === 'open' && selectedThread.author === profile?.nickname && (
                    <button 
                      onClick={closeThreadDirectly}
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                    >
                      <Lock size={16} />
                      解決済みにする
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedThread(null)}
                  style={{ padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ backgroundColor: '#f9fafb', borderLeft: '4px solid #2563eb', padding: '16px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>1: 名前: {selectedThread.author}</p>
                  <p style={{ color: '#1f2937', whiteSpace: 'pre-wrap' }}>{selectedThread.content}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                    {selectedThread.tags.map((tag, idx) => (
                      <span key={idx} style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontSize: '12px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedThread.responses && selectedThread.responses.map((response, idx) => (
                  <div key={response.id} style={{
                    borderLeft: response.isBest ? '4px solid #eab308' : '4px solid #d1d5db',
                    backgroundColor: response.isBest ? '#fefce8' : '#f9fafb',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <p style={{ fontSize: '14px', color: '#4b5563' }}>{idx + 2}: 名前: {response.author}</p>
                      {!response.isBest && selectedThread.status === 'open' && selectedThread.author === profile?.nickname && (
                        <button 
                          onClick={() => selectBestAnswer(response.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          <CheckCircle size={14} />
                          ベストアンサー
                        </button>
                      )}
                      {response.isBest && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#eab308', color: 'white', borderRadius: '6px', fontSize: '12px' }}>
                          <CheckCircle size={14} />
                          ベストアンサー
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#1f2937', whiteSpace: 'pre-wrap' }}>{response.content}</p>
                  </div>
                ))}
              </div>

              {selectedThread.status === 'open' && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '8px', outline: 'none' }}
                    rows="3"
                    placeholder="返信を書く..."
                  />
                  <button 
                    onClick={addReply}
                    style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '8px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    返信する
                  </button>
                </div>
              )}

              {selectedThread.status === 'closed' && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '6px', textAlign: 'center' }}>
                  <p style={{ color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Lock size={20} />
                    このスレッドは解決済みです
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ベストアンサー確認モーダル */}
        {showCloseConfirm && (
          <div style={modalOverlayStyle} onClick={() => setShowCloseConfirm(false)}>
            <div style={{...modalContentStyle, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>ベストアンサーを選択しました</h3>
              <p style={{ color: '#4b5563', marginBottom: '24px' }}>
                このスレッドを解決済みにしますか？
                <br />
                <span style={{ fontSize: '14px', color: '#dc2626' }}>※この操作は取り消せません</span>
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => closeThread(false)}
                  style={{ flex: 1, padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  いいえ、まだ開いておく
                </button>
                <button 
                  onClick={() => closeThread(true)}
                  style={{ flex: 1, padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  はい、解決済みにする
                </button>
              </div>
            </div>
          </div>
        )}

        {/* プロフィール設定モーダル */}
        {showProfile && (
          <div style={modalOverlayStyle} onClick={profile ? () => setShowProfile(false) : null}>
            <div style={{...modalContentStyle, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>プロフィール設定</h2>
              {!profile && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px' }}>
                  <p style={{ fontSize: '14px', color: '#92400e' }}>⚠️ 初回起動です。ニックネームを設定してください。</p>
                </div>
              )}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const profileData = {
                  nickname: formData.get('nickname'),
                  skills: formData.get('skills').split(',').map(s => s.trim()).filter(Boolean),
                  department: formData.get('department'),
                  year: formData.get('year'),
                  userId: profile?.userId || `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`
                };
                saveProfile(profileData);
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      ニックネーム <span style={{ color: '#dc2626' }}>*必須</span>
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      required
                      defaultValue={profile?.nickname}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                      placeholder="例: 山田太郎"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>スキルタグ</label>
                    <input
                      type="text"
                      name="skills"
                      defaultValue={profile?.skills?.join(', ')}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                      placeholder="例: JavaScript, React, デザイン"
                    />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>カンマ区切りで入力</p>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>学科</label>
                    <select 
                      name="department"
                      defaultValue={profile?.department || ''}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                    >
                      <option value="">選択してください</option>
                      <option value="情報計算科学科">情報計算科学科</option>
                      <option value="数理科学科">数理科学科</option>
                      <option value="先端物理学科">先端物理学科</option>
                      <option value="生命情報学科">生命情報学科</option>
                      <option value="先端科学科">先端科学科</option>
                      <option value="電気電子情報工学科">電気電子情報工学科</option>
                      <option value="経営システム工学科">経営システム工学科</option>
                      <option value="機械航空宇宙工学科">機械航空宇宙工学科</option>
                      <option value="社会基盤工学科">社会基盤工学科</option>
                      <option value="建築学科">建築学科</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>学年</label>
                    <select 
                      name="year"
                      defaultValue={profile?.year || ''}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                    >
                      <option value="">選択してください</option>
                      <option value="1年">1年</option>
                      <option value="2年">2年</option>
                      <option value="3年">3年</option>
                      <option value="4年">4年</option>
                      <option value="修士1年">修士1年</option>
                      <option value="修士2年">修士2年</option>
                    </select>
                  </div>
                  
                  <button 
                    type="submit"
                    style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    保存する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSharePlatform;