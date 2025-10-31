import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Lock, ChevronDown, Tag, Calendar, MessageCircle, TrendingUp, Filter } from 'lucide-react';

const SkillSharePlatform = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reply, setReply] = useState('');
  const [profile, setProfile] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    tags: []
  });

  const categories = ['機械学習', 'ウェブ開発', 'データ分析', 'デザイン', 'その他'];

  useEffect(() => {
    loadProfile();
    loadDemoThreads();
  }, []);

  const loadProfile = () => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setShowProfile(true);
    }
  };

  const loadDemoThreads = () => {
    const demoThreads = [
      {
        id: '1',
        title: 'ReactのuseEffectの使い方について',
        content: 'useEffectの依存配列について教えてください',
        tags: ['ウェブ開発'],
        author: 'デモユーザー',
        authorId: 'demo001',
        responses: [
          {
            id: 1,
            author: 'サポーター',
            authorId: 'sup001',
            content: '依存配列には、effect内で使用する変数を入れます',
            timestamp: new Date().toISOString(),
            isBest: false
          }
        ],
        status: 'open',
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Pythonでのデータ可視化',
        content: 'matplotlibとseabornの使い分けについて',
        tags: ['データ分析'],
        author: 'データ太郎',
        authorId: 'data123',
        responses: [],
        status: 'open',
        createdAt: new Date(Date.now() - 86400000)
      }
    ];
    setThreads(demoThreads);
  };

  const saveProfile = (profileData) => {
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setProfile(profileData);
    setShowProfile(false);
  };

  const createThread = () => {
    if (!newThread.title.trim() || !newThread.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    if (!profile) {
      alert('プロフィールを設定してください');
      return;
    }

    const threadData = {
      id: Date.now().toString(),
      ...newThread,
      author: profile.nickname,
      authorId: profile.userId,
      responses: [],
      status: 'open',
      createdAt: new Date()
    };

    setThreads([threadData, ...threads]);
    setNewThread({ title: '', content: '', tags: [] });
    setShowNewThread(false);
  };

  const addReply = () => {
    if (!reply.trim()) return;
    if (!profile) {
      alert('プロフィールを設定してください');
      return;
    }

    const newResponse = {
      id: Date.now(),
      author: profile.nickname,
      authorId: profile.userId,
      content: reply,
      timestamp: new Date().toISOString(),
      isBest: false
    };

    const updatedThreads = threads.map(t => 
      t.id === selectedThread.id 
        ? { ...t, responses: [...(t.responses || []), newResponse] }
        : t
    );

    setThreads(updatedThreads);
    setSelectedThread({
      ...selectedThread,
      responses: [...(selectedThread.responses || []), newResponse]
    });
    setReply('');
  };

  const selectBestAnswer = (responseId) => {
    if (!selectedThread || selectedThread.author !== profile?.nickname) return;

    const updatedResponses = selectedThread.responses.map(response => ({
      ...response,
      isBest: response.id === responseId
    }));

    const updatedThreads = threads.map(t =>
      t.id === selectedThread.id ? { ...t, responses: updatedResponses } : t
    );

    setThreads(updatedThreads);
    setSelectedThread({ ...selectedThread, responses: updatedResponses });
    setShowCloseConfirm(true);
  };

  const closeThread = (shouldClose) => {
    setShowCloseConfirm(false);
    if (!shouldClose || !selectedThread) return;

    const updatedThreads = threads.map(t =>
      t.id === selectedThread.id ? { ...t, status: 'closed' } : t
    );

    setThreads(updatedThreads);
    setSelectedThread({ ...selectedThread, status: 'closed' });
  };

  const closeThreadDirectly = () => {
    if (!selectedThread || selectedThread.author !== profile?.nickname) return;

    if (!window.confirm('このスレッドを解決済みにしますか？\n※この操作は取り消せません')) {
      return;
    }

    const updatedThreads = threads.map(t =>
      t.id === selectedThread.id ? { ...t, status: 'closed' } : t
    );

    setThreads(updatedThreads);
    setSelectedThread({ ...selectedThread, status: 'closed' });
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || thread.status === filterStatus;
    const matchesCategory = selectedCategory === 'all' || thread.tags.includes(selectedCategory);
    return matchesSearch && matchesStatus && matchesCategory;
  });

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
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease-out'
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease-out'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        .tag-hover:hover {
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        .button-hover:hover {
          transform: scale(1.02);
          transition: all 0.2s ease;
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp size={32} />
                助け合いの極み
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>知識を共有し、共に成長しよう</p>
            </div>
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="button-hover"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '10px 18px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '12px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2563eb', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {profile?.nickname?.charAt(0) || 'U'}
                </div>
                <span>{profile?.nickname || 'ゲスト'}</span>
                <ChevronDown size={18} style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </button>
              
              {showUserMenu && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '8px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  padding: '8px',
                  zIndex: 1000,
                  animation: 'slideUp 0.2s ease-out'
                }}>
                  <button 
                    onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                    style={{ 
                      width: '100%', 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      border: 'none', 
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User size={18} />
                    プロフィール編集
                  </button>
                  {profile?.skills && profile.skills.length > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>スキル</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {profile.skills.map((skill, idx) => (
                          <span key={idx} style={{ 
                            padding: '2px 8px', 
                            backgroundColor: '#dbeafe', 
                            color: '#1e40af', 
                            borderRadius: '12px', 
                            fontSize: '11px' 
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
              <input
                type="text"
                placeholder="スレッドやタグで検索..."
                style={{ 
                  width: '100%', 
                  paddingLeft: '48px', 
                  paddingRight: '16px', 
                  paddingTop: '12px', 
                  paddingBottom: '12px', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '12px', 
                  outline: 'none',
                  fontSize: '15px'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ 
                  padding: '12px 40px 12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  fontSize: '15px',
                  appearance: 'none'
                }}
              >
                <option value="all">すべてのカテゴリー</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ 
                  padding: '12px 40px 12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  fontSize: '15px',
                  appearance: 'none'
                }}
              >
                <option value="all">すべて</option>
                <option value="open">未解決</option>
                <option value="closed">解決済み</option>
              </select>
              <Filter size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
            </div>
            
            <button 
              onClick={() => setShowNewThread(true)}
              className="button-hover"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '12px 24px', 
                backgroundColor: '#2563eb', 
                color: 'white', 
                borderRadius: '12px', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px'
              }}
            >
              <Plus size={20} />
              新規スレッド
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {filteredThreads.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '60px 24px', 
              borderRadius: '16px', 
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <MessageCircle size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', fontSize: '16px' }}>該当するスレッドが見つかりません</p>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <div 
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className="hover-lift"
                style={{ 
                  backgroundColor: 'white', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
                  cursor: 'pointer', 
                  borderLeft: '5px solid #2563eb',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '19px', fontWeight: '600', color: '#1f2937' }}>{thread.title}</h3>
                      {thread.status === 'closed' && (
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          padding: '4px 12px', 
                          backgroundColor: '#d1fae5', 
                          color: '#065f46', 
                          borderRadius: '8px', 
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          <CheckCircle size={14} />
                          解決済み
                        </span>
                      )}
                      {thread.author === profile?.nickname && (
                        <span style={{ 
                          padding: '4px 12px', 
                          backgroundColor: '#dbeafe', 
                          color: '#1e40af', 
                          borderRadius: '8px', 
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          自分の投稿
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={16} />
                        {thread.author}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} />
                        {new Date(thread.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {thread.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="tag-hover"
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px', 
                            backgroundColor: '#f0f9ff', 
                            color: '#0369a1', 
                            borderRadius: '10px', 
                            fontSize: '13px',
                            fontWeight: '500',
                            border: '1px solid #bae6fd',
                            cursor: 'pointer'
                          }}
                        >
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4b5563'
                  }}>
                    <MessageCircle size={18} />
                    {thread.responses?.length || 0}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showNewThread && (
          <div style={modalOverlayStyle} onClick={() => setShowNewThread(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937' }}>新規スレッド作成</h2>
                <button 
                  onClick={() => setShowNewThread(false)}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    cursor: 'pointer', 
                    backgroundColor: '#f3f4f6' 
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    タイトル <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例: ReactのuseEffectについて教えてください"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '10px', 
                      outline: 'none',
                      fontSize: '15px'
                    }}
                    value={newThread.title}
                    onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    内容 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    placeholder="詳しい内容を記載してください..."
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '10px', 
                      height: '180px', 
                      outline: 'none',
                      fontSize: '15px',
                      resize: 'vertical'
                    }}
                    value={newThread.content}
                    onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                    カテゴリータグ
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          const tags = newThread.tags.includes(cat)
                            ? newThread.tags.filter(t => t !== cat)
                            : [...newThread.tags, cat];
                          setNewThread({...newThread, tags});
                        }}
                        className="tag-hover"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: newThread.tags.includes(cat) ? '2px solid #2563eb' : '2px solid #e5e7eb',
                          cursor: 'pointer',
                          backgroundColor: newThread.tags.includes(cat) ? '#2563eb' : 'white',
                          color: newThread.tags.includes(cat) ? 'white' : '#374151',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={createThread}
                  className="button-hover"
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    padding: '14px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  投稿する
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedThread && (
          <div style={modalOverlayStyle} onClick={() => setSelectedThread(null)}>
            <div style={{...modalContentStyle, maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start', 
                marginBottom: '20px', 
                paddingBottom: '20px', 
                borderBottom: '2px solid #e5e7eb' 
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937' }}>{selectedThread.title}</h2>
                    {selectedThread.status === 'closed' && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '6px 14px', 
                        backgroundColor: '#d1fae5', 
                        color: '#065f46', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        <CheckCircle size={16} />
                        解決済み
                      </span>
                    )}
                  </div>
                  {selectedThread.status === 'open' && selectedThread.author === profile?.nickname && (
                    <button 
                      onClick={closeThreadDirectly}
                      className="button-hover"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '8px 16px', 
                        backgroundColor: '#10b981', 
                        color: 'white', 
                        borderRadius: '8px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <Lock size={16} />
                      解決済みにする
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedThread(null)}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    cursor: 'pointer', 
                    backgroundColor: '#f3f4f6' 
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ backgroundColor: '#f9fafb', borderLeft: '4px solid #2563eb', padding: '16px', marginBottom: '16px', borderRadius: '8px' }}>
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
                    marginBottom: '16px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <p style={{ fontSize: '14px', color: '#4b5563' }}>{idx + 2}: 名前: {response.author}</p>
                      {!response.isBest && selectedThread.status === 'open' && selectedThread.author === profile?.nickname && (
                        <button 
                          onClick={() => selectBestAnswer(response.id)}
                          className="button-hover"
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
                    style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '10px', marginBottom: '8px', outline: 'none', fontSize: '15px' }}
                    rows="3"
                    placeholder="返信を書く..."
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <button 
                    onClick={addReply}
                    className="button-hover"
                    style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    返信する
                  </button>
                </div>
              )}

              {selectedThread.status === 'closed' && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Lock size={20} />
                    このスレッドは解決済みです
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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
                  className="button-hover"
                  style={{ flex: 1, padding: '10px 16px', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  いいえ、まだ開いておく
                </button>
                <button 
                  onClick={() => closeThread(true)}
                  className="button-hover"
                  style={{ flex: 1, padding: '10px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  はい、解決済みにする
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfile && (
          <div style={modalOverlayStyle} onClick={profile ? () => setShowProfile(false) : null}>
            <div style={{...modalContentStyle, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>プロフィール設定</h2>
              {!profile && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px' }}>
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
                      style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                      placeholder="例: 山田太郎"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>スキルタグ</label>
                    <input
                      type="text"
                      name="skills"
                      defaultValue={profile?.skills?.join(', ')}
                      style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                      placeholder="例: JavaScript, React, デザイン"
                    />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>カンマ区切りで入力</p>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>学科</label>
                    <select 
                      name="department"
                      defaultValue={profile?.department || ''}
                      style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                    >
                      <option value="">選択してください</option>
                      <option value="情報工学科">情報工学科</option>
                      <option value="電気電子工学科">電気電子工学科</option>
                      <option value="機械工学科">機械工学科</option>
                      <option value="デザイン学科">デザイン学科</option>
                      <option value="建築学科">建築学科</option>
                      <option value="経営学科">経営学科</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>学年</label>
                    <select 
                      name="year"
                      defaultValue={profile?.year || ''}
                      style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
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
                    className="button-hover"
                    style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
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
