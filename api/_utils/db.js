import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Lock, Trash2 } from 'lucide-react';

const API_BASE = "";

const SkillSharePlatform = ({ onLogout, authUser, onProfileUpdate }) => {
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [showNewThread, setShowNewThread] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [reply, setReply] = useState('');
    const [profile, setProfile] = useState(null);
    const [newThread, setNewThread] = useState({
      title: '',
      content: '',
      tags: [],
      customTag: ''
    });
    const [profileForm, setProfileForm] = useState({
      nickname: '',
      skills: [], // 配列に変更
      department: '',
      year: ''
    });

    // 利用可能なスキル一覧
    const availableSkills = ['数学', '英語', '物理', '化学', '生物', '地学', 'プログラミング', 'その他'];

    useEffect(() => {
        if (authUser) {
          setProfile(authUser);
          setProfileForm({
              nickname: authUser.nickname || "",
              skills: authUser.skills || [], // 配列のまま保持
              department: authUser.department || "",
              year: authUser.year || "",
          });
        }
        loadThreads();
    }, [authUser]);

    const loadThreads = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/threads`);
        const data = await res.json();
        setThreads(data);
      } catch (error) {
        console.error("スレッド読み込みエラー:", error);
      }
    };
    
    const loadReplies = async (threadId) => {
        try {
          const res = await fetch(`${API_BASE}/api/replies?threadId=${threadId}`);
          return await res.json();
        } catch (err) {
          console.error("返信読み込みエラー:", err);
          return [];
        }
    };

    // スキルタグのトグル処理
    const handleSkillToggle = (skill) => {
      if (profileForm.skills.includes(skill)) {
        setProfileForm({
          ...profileForm,
          skills: profileForm.skills.filter(s => s !== skill)
        });
      } else {
        setProfileForm({
          ...profileForm,
          skills: [...profileForm.skills, skill]
        });
      }
    };

    const handleProfileSubmit = async () => {
        try {
          if (!profile || !profile.userid) {
            alert("ログイン情報がありません。再ログインしてください。");
            return;
          }
      
          const updated = {
            nickname: profileForm.nickname,
            skills: profileForm.skills, // 既に配列なのでそのまま送信
            department: profileForm.department,
            year: profileForm.year
          };
      
          const result = await onProfileUpdate(updated);
          
          if (result.success) {
            setProfile(result.data);
            setProfileForm({
              nickname: result.data.nickname || "",
              skills: result.data.skills || [], // 配列のまま
              department: result.data.department || "",
              year: result.data.year || "",
            });
            setShowProfile(false);
            alert("プロフィールを更新しました！");
          } else {
            alert("プロフィール更新エラー: " + result.error);
          }
        } catch (err) {
          console.error("プロフィール更新エラー:", err);
          alert("プロフィール更新エラー: " + err.message);
        }
    };

    const createThread = async () => {
        if (!newThread.title.trim() || !newThread.content.trim()) {
          alert('タイトルと内容を入力してください');
          return;
        }
    
        if (!profile || !profile.nickname) {
          alert('プロフィールでニックネームを設定してください');
          return;
        }
    
        try {
          const token = localStorage.getItem("authToken");

          const res = await fetch(`${API_BASE}/api/threads`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              title: newThread.title,
              content: newThread.content,
              authorId: profile.userid,
              authorNickname: profile.nickname,
              tags: newThread.tags.join(","),
            })
          });
    
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "スレッド作成に失敗");
    
          setNewThread({ title: '', content: '', tags: [] });
          setShowNewThread(false);
          loadThreads();
        } catch (error) {
          console.error("投稿エラー:", error);
          alert("エラーが発生しました: " + error.message);
        }
    };

    const deleteThread = async (threadId, threadTitle) => {
        if (!window.confirm(`「${threadTitle}」を削除しますか？\n※この操作は取り消せません`)) return;
    
        try {
          await fetch(`${API_BASE}/api/delete-thread/${threadId}`, {
            method: "DELETE"
          });
          alert("スレッドを削除しました");
          setSelectedThread(null);
          loadThreads();
        } catch (error) {
          console.error("削除エラー:", error);
          alert("スレッドの削除に失敗しました");
        }
    };

    const closeThreadDirectly = async () => {
        if (!selectedThread || selectedThread.authorId !== profile.userid) return;
        if (!window.confirm('このスレッドを解決済みにしますか？\n※この操作は取り消せません')) return;
    
        try {
          await fetch(`${API_BASE}/api/close-thread/${selectedThread.id}`, {
            method: "POST"
          });
          setSelectedThread({
            ...selectedThread,
            status: "closed"
          });
          loadThreads();
        } catch (error) {
          console.error("スレッドクローズエラー:", error);
          alert("スレッドのクローズに失敗しました");
        }
    };

    const addReply = async () => {
        if (!reply.trim()) return;
        if (!profile) {
          alert('プロフィールを設定してください');
          return;
        }
    
        try {
          const res = await fetch(`${API_BASE}/api/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId: selectedThread.id,
              authorId: profile.userid,
              authorNickname: profile.nickname,
              content: reply
            })
          });
    
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || data.error);

          setReply('');
          const updatedReplies = await loadReplies(selectedThread.id);
          setSelectedThread({
            ...selectedThread,
            responses: updatedReplies
          });
        } catch (error) {
          console.error("返信エラー:", error);
          alert("返信の投稿に失敗しました: " + error.message);
        }
    };

    const deleteReply = async (replyId) => {
        if (!window.confirm("この返信を削除しますか？")) return;
      
        try {
          const res = await fetch(`${API_BASE}/api/delete-reply/${replyId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "削除に失敗しました");
            return;
          }
          const updatedReplies = await loadReplies(selectedThread.id);
          setSelectedThread({
            ...selectedThread,
            responses: updatedReplies
          });
        } catch (err) {
          console.error("返信削除エラー:", err);
          alert("エラーが発生しました");
        }
    };

    const filteredThreads = threads.filter(thread =>
        (thread.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.tags || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const modalOverlayStyle = {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
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
            
            {/* ヘッダー */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb', borderBottom: '4px solid #2563eb', paddingBottom: '8px' }}>
                  助け合いの極み
                </h1>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setShowProfile(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    <User size={20} />
                    {profile ? profile.nickname : 'プロフィール設定'}
                  </button>
                  <button 
                    onClick={onLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    ログアウト
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} size={20} />
                  <input
                    type="text"
                    placeholder="スレッドを検索..."
                    style={{ width: '250px', paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setShowNewThread(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={20} />
                  新規スレッド
                </button>
              </div>
            </div>

            {/* スレッド一覧 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {filteredThreads.map(thread => (
                <div 
                  key={thread.id}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                    borderLeft: '4px solid #2563eb',
                    transition: 'transform 0.1s',
                  }}
                  onClick={async () => {
                    const replies = await loadReplies(thread.id);
                    const newThreadData = {
                      ...thread,
                      responses: replies,
                      tags: (thread.tags || "").split(",").filter(Boolean)
                    };
                    setSelectedThread(newThreadData);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{thread.title}</h3>
                        {thread.status === 'closed' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', fontSize: '12px' }}>
                            <CheckCircle size={14} />
                            解決済み
                          </span>
                        )}
                        {thread.authorId === profile?.userid && (
                          <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '12px' }}>
                            あなたの投稿
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                        投稿者: {thread.authorNickname}
                        {thread.authorDepartment && (
                          <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                            ({thread.authorDepartment} {thread.authorYear})
                          </span>
                        )}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(thread.tags || "").split(",").filter(t => t).map((tag, idx) => (
                          <span key={idx} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '9999px', fontSize: '12px' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {thread.authorId === profile?.userid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id, thread.title);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 新規スレッド作成モーダル */}
            {showNewThread && (
              <div style={modalOverlayStyle} onClick={() => setShowNewThread(false)}>
                <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>新規スレッド作成</h2>
                    <button onClick={() => setShowNewThread(false)} style={{ padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "transparent" }}>
                      <X size={24} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <input
                      type="text"
                      placeholder="タイトル"
                      style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                      value={newThread.title}
                      onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                    />
                    <textarea
                      placeholder="内容"
                      style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", height: "160px" }}
                      value={newThread.content}
                      onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                    />
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
                        タグを追加（#で始めてください）
                      </label>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <input
                          type="text"
                          value={newThread.customTag}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !value.startsWith('#')) value = '#' + value;
                            setNewThread({ ...newThread, customTag: value });
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const tag = newThread.customTag.trim();
                              if (tag && tag.length > 1) {
                                const tagName = tag.startsWith('#') ? tag.slice(1) : tag;
                                if (tagName && !newThread.tags.includes(tagName)) {
                                  setNewThread({ 
                                    ...newThread, 
                                    tags: [...newThread.tags, tagName],
                                    customTag: ''
                                  });
                                }
                              }
                            }
                          }}
                          placeholder="#例: 機械学習"
                          style={{ flex: 1, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const tag = newThread.customTag.trim();
                            if (tag && tag.length > 1) {
                              const tagName = tag.startsWith('#') ? tag.slice(1) : tag;
                              if (tagName && !newThread.tags.includes(tagName)) {
                                setNewThread({ 
                                  ...newThread, 
                                  tags: [...newThread.tags, tagName],
                                  customTag: ''
                                });
                              }
                            }
                          }}
                          style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
                        >
                          追加
                        </button>
                      </div>
                      {newThread.tags.length > 0 && (
                        <div>
                          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>選択中のタグ:</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {newThread.tags.map((tag, idx) => (
                              <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "6px", fontSize: "13px" }}>
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => setNewThread({ ...newThread, tags: newThread.tags.filter((t) => t !== tag) })}
                                  style={{ background: "none", border: "none", color: "#1e40af", cursor: "pointer", padding: "0", fontSize: "18px", lineHeight: "1", fontWeight: "bold" }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={createThread} style={{ width: "100%", backgroundColor: "#2563eb", color: "white", padding: "12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" }}>
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
                        {selectedThread.status === "closed" && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '14px' }}>
                            <CheckCircle size={16} />
                            解決済み
                          </span>
                        )}
                      </div>
                      {selectedThread.status === 'open' && selectedThread.authorId === profile?.userid && (
                        <button 
                          onClick={closeThreadDirectly}
                          style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                          <Lock size={16} /> 解決済みにする
                        </button>
                      )}
                    </div>
                    <button onClick={() => setSelectedThread(null)} style={{ padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                      <X size={24} />
                    </button>
                  </div>

                  <div style={{ backgroundColor: '#f9fafb', borderLeft: '4px solid #2563eb', padding: '16px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                      名前: {selectedThread.authorNickname}
                      {selectedThread.authorDepartment && (
                        <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                          ({selectedThread.authorDepartment} {selectedThread.authorYear})
                        </span>
                      )}
                    </p>
                    <p style={{ color: '#1f2937', whiteSpace: 'pre-wrap' }}>{selectedThread.content}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                      {selectedThread.tags && selectedThread.tags.map((tag, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontSize: '12px' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedThread.responses && selectedThread.responses.map((response, idx) => (
                    <div key={response.id} style={{ borderLeft: '4px solid #d1d5db', backgroundColor: '#f9fafb', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                      <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>
                        {idx + 1}: {response.authorNickname}
                        {response.authorDepartment && (
                          <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                            ({response.authorDepartment} {response.authorYear})
                          </span>
                        )}
                      </p>
                      <p style={{ whiteSpace: 'pre-wrap', color: '#1f2937', marginBottom: '8px' }}>{response.content}</p>
                      {response.authorId === profile?.userid && (
                        <button
                          onClick={() => deleteReply(response.id)}
                          style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}

                  {selectedThread.status !== "closed" && (
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <textarea 
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '8px' }}
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

                  {selectedThread.status === "closed" && (
                    <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '6px', textAlign: 'center', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Lock size={20} />
                      このスレッドは解決済みです。
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* プロフィール設定モーダル */}
            {showProfile && (
              <div style={modalOverlayStyle} onClick={profile ? () => setShowProfile(false) : null}>
                <div style={{...modalContentStyle, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>プロフィール設定</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile?.accounttype && (
                      <div style={{ padding: '12px', backgroundColor: profile.accounttype === 'professor' ? '#f3e8ff' : '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: profile.accounttype === 'professor' ? '#7c3aed' : '#2563eb', fontWeight: '600' }}>
                          {profile.accounttype === 'professor' ? '👨‍🏫 教員アカウント' : '🎓 学生アカウント'}
                        </p>
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        ニックネーム <span style={{ color: '#dc2626' }}>*必須</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.nickname}
                        onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                    
                    {/* スキルタグのチェックボックス */}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        スキルタグ
                      </label>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {availableSkills.map((skill) => (
                          <label 
                            key={skill} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s',
                              backgroundColor: profileForm.skills.includes(skill) ? '#dbeafe' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={profileForm.skills.includes(skill)}
                              onChange={() => handleSkillToggle(skill)}
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                cursor: 'pointer',
                                accentColor: '#2563eb'
                              }}
                            />
                            <span style={{ 
                              fontSize: '14px',
                              fontWeight: profileForm.skills.includes(skill) ? '500' : '400',
                              color: profileForm.skills.includes(skill) ? '#1e40af' : '#4b5563'
                            }}>
                              {skill}
                            </span>
                          </label>
                        ))}
                      </div>
                      {profileForm.skills.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                            選択中: {profileForm.skills.length}個
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {profileForm.skills.map((skill, idx) => (
                              <span 
                                key={idx} 
                                style={{ 
                                  padding: '4px 10px', 
                                  backgroundColor: '#2563eb', 
                                  color: 'white', 
                                  borderRadius: '6px', 
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {profile?.accounttype !== 'professor' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>学科</label>
                          <select 
                            value={profileForm.department}
                            onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>学年</label>
                          <select 
                            value={profileForm.year}
                            onChange={(e) => setProfileForm({...profileForm, year: e.target.value})}
                            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                          >
                            <option value="">選択してください</option>
                            <option value="1年">1年</option>
                            <option value="2年">2年</option>
                            <option value="3年">3年</option>
                            <option value="4年">4年</option>
                            <option value="修士1年">修士1年</option>
                            <option value="修士2年">修士2年</option>
                            <option value="その他">その他</option>
                          </select>
                        </div>
                      </>
                    )}
                    <button 
                      onClick={handleProfileSubmit}
                      disabled={!profileForm.nickname.trim()}
                      style={{ width: '100%', backgroundColor: profileForm.nickname.trim() ? '#2563eb' : '#9ca3af', color: 'white', padding: '8px', borderRadius: '6px', border: 'none', cursor: profileForm.nickname.trim() ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s' }}
                    >
                      保存する
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    );
};

export default SkillSharePlatform;