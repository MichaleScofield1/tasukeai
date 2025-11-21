import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Lock, Trash2 } from 'lucide-react';

// ========================================================================
// 1. 定数
// ========================================================================
const API_BASE = "https://tasukeai-auth-server-1.onrender.com";
const categories = ['機械学習', 'ウェブ開発', 'データ分析', 'デザイン', 'その他'];

// ========================================================================
// 2. メインコンポーネント
// ========================================================================
const SkillSharePlatform = () => {
    // --------------------------------------------------------------------
    // 2-1. State管理
    // --------------------------------------------------------------------
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [showNewThread, setShowNewThread] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [reply, setReply] = useState('');
    const [profile, setProfile] = useState(null);
    // const [showCloseConfirm, setShowCloseConfirm] = useState(false); // 未使用のためコメントアウト
    
    // スレッド投稿用フォームState
    const [newThread, setNewThread] = useState({
      title: '',
      content: '',
      tags: []
    });

    // プロフィール編集用フォームState
    const [profileForm, setProfileForm] = useState({
      nickname: '',
      skills: '',
      department: '',
      year: ''
    });

    // --------------------------------------------------------------------
    // 2-2. 初期化と認証ロジック (useEffect)
    // --------------------------------------------------------------------

    // 🔥 初期ロード時の認証チェックとデータ取得
    useEffect(() => {
        const authUser = localStorage.getItem("authUser");
        
        if (!authUser) {
          // ログイン情報がない場合はリダイレクト
          alert("ログイン情報がありません。再ログインしてください。");
          window.location.href = "http://localhost:3000/login.html";
          return;
        }
        
        const parsedUser = JSON.parse(authUser);
        setProfile(parsedUser);

        // プロフィール編集用フォームの初期化（localStorageのデータから）
        setProfileForm({
            nickname: parsedUser.nickname || "",
            skills: parsedUser.skills?.join(", ") || "",
            department: parsedUser.department || "",
            year: parsedUser.year || "",
        });

        // スレッド一覧のロード
        loadThreads();
        
        // サーバーから最新のプロフィール情報を取得（非同期）
        fetchProfileFromServer();

    }, []);


    // --------------------------------------------------------------------
    // 2-3. API通信ロジック (関数)
    // --------------------------------------------------------------------

    // スレッド一覧の読み込み
    const loadThreads = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/threads`);
        const data = await res.json();
        setThreads(data);
      } catch (error) {
        console.error("スレッド読み込みエラー:", error);
        // alert("スレッドの読み込みに失敗しました"); // 読み込み失敗時はアラートを出さない方がUXが良い場合もあるが、元のコードを維持
      }
    };
    
    // 特定スレッドの返信を読み込む
    const loadReplies = async (threadId) => {
        try {
          const res = await fetch(`${API_BASE}/api/replies?threadId=${threadId}`);
          return await res.json();
        } catch (err) {
          console.error("返信読み込みエラー:", err);
          return [];
        }
    };

    // サーバーから最新のプロフィールを取得
    const fetchProfileFromServer = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
      
        try {
          // JWTトークンをデコードしてuserIdを取得
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentUserId = payload.userId;
          if (!currentUserId) return;
      
          const res = await fetch(`${API_BASE}/api/profile/${currentUserId}`);
          const data = await res.json();
      
          if (res.ok) {
            setProfile(data);
      
            // プロフィール編集用フォームへ反映
            setProfileForm({
              nickname: data.nickname || "",
              skills: data.skills?.join(", ") || "",
              department: data.department || "",
              year: data.year || "",
            });
          }
        } catch (err) {
          console.error("プロフィール取得エラー:", err);
        }
    };

    // プロフィールをDBに保存/更新
    const handleProfileSubmit = async () => {
        try {
          // プロフィール情報が存在しない場合、ローカルストレージから取得を試みる
          let currentUser = profile;
      
          if (!currentUser) {
            const saved = localStorage.getItem("authUser");
            if (!saved) {
              alert("ログイン情報がありません。再ログインしてください。");
              return;
            }
            currentUser = JSON.parse(saved);
            setProfile(currentUser);
          }
      
          const currentUserId = currentUser.userId;
          if (!currentUserId) {
            alert("ユーザーIDが取得できません。再ログインしてください。");
            return;
          }
      
          // DB に送るデータを作成
          const updated = {
            nickname: profileForm.nickname,
            // スキル文字列を配列に変換して送信
            skills: profileForm.skills.split(",").map(s => s.trim()).filter(s => s.length > 0),
            department: profileForm.department,
            year: profileForm.year
          };
      
          // 更新リクエスト
          const res = await fetch(`${API_BASE}/api/profile/${currentUserId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          });
      
          const data = await res.json();
      
          if (!res.ok) throw new Error(data.error || "更新失敗");
      
          setProfile(data);      // React state 更新
          setShowProfile(false); // モーダル閉じる
      
        } catch (err) {
          console.error("プロフィール更新エラー:", err);
          alert("プロフィール更新エラー: " + err.message);
        }
    };


    // 新規スレッドの作成
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
          const res = await fetch(`${API_BASE}/api/threads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newThread.title,
              content: newThread.content,
              authorId: profile.userId,
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


    // スレッドの削除
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


    // スレッドのクローズ（解決済みにする）
    const closeThreadDirectly = async () => {
        if (!selectedThread || selectedThread.authorId !== profile.userId) return; // 投稿者のみクローズ可能
    
        if (!window.confirm('このスレッドを解決済みにしますか？\n※この操作は取り消せません')) {
          return;
        }
    
        try {
          await fetch(`${API_BASE}/api/close-thread/${selectedThread.id}`, {
            method: "POST"
          });
    
          // UIを即時更新
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


    // 返信の追加
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
              authorId: profile.userId,
              authorNickname: profile.nickname,
              content: reply
            })
          });
    
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
    
          setReply('');
    
          // 最新の返信を再取得してスレッド詳細を更新
          const updatedReplies = await loadReplies(selectedThread.id);
    
          setSelectedThread({
            ...selectedThread,
            responses: updatedReplies
          });
    
        } catch (error) {
          console.error("返信エラー:", error);
          alert("返信の投稿に失敗しました");
        }
    };


    // 返信の削除
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
      
          // 最新の返信を再取得
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


    // --------------------------------------------------------------------
    // 2-4. ユーティリティ/ハンドラー
    // --------------------------------------------------------------------

    // ログアウト処理
    const handleLogout = () => {
        if (window.confirm('ログアウトしますか？')) {
          // localStorageの認証情報をクリアするロジックはバックエンド依存のため、ここではリダイレクトのみ
          window.location.href = '/login.html';
        }
    };

    // スレッド検索のフィルタリング
    const filteredThreads = threads.filter(thread =>
        (thread.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.tags || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // モーダル用スタイル定義 (Tailwind CSS風のインラインスタイル)
    const modalOverlayStyle = {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // bg-black/50
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    };

    const modalContentStyle = {
      backgroundColor: 'white', borderRadius: '12px', // rounded-xl
      padding: '24px', // p-6
      maxWidth: '700px', width: '90%', maxHeight: '85vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' // shadow-xl
    };


    // --------------------------------------------------------------------
    // 2-5. レンダリング (UI)
    // --------------------------------------------------------------------

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}> {/* min-h-screen bg-gray-50 */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}> {/* max-w-7xl mx-auto p-4 */}
            
            {/* ヘッダーとコントロールパネル */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}> {/* bg-white rounded-lg shadow-md p-6 mb-6 */}
              
              {/* タイトルとユーザーアクション */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}> {/* flex justify-between items-center mb-4 */}
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb', borderBottom: '4px solid #2563eb', paddingBottom: '8px' }}>
                  助け合いの極み
                </h1>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}> {/* flex gap-2 items-center */}
                  <button 
                    onClick={() => setShowProfile(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: 'none', cursor: 'pointer' }} // flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md
                  >
                    <User size={20} />
                    {profile ? profile.nickname : 'プロフィール設定'}
                  </button>

                  <button 
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }} // flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md
                  >
                    ログアウト
                  </button>
                </div>
              </div>

              {/* 検索と新規スレッドボタン */}
              <div style={{ display: 'flex', gap: '16px' }}> {/* flex gap-4 */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} size={20} /> {/* absolute left-3 top-3 text-gray-400 */}
                  <input
                    type="text"
                    placeholder="スレッドを検索..."
                    style={{ width: '250px', paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }} // w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button 
                  onClick={() => setShowNewThread(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }} // flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                >
                  <Plus size={20} />
                  新規スレッド
                </button>
              </div>
            </div>

            {/* スレッド一覧 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}> {/* grid grid-cols-1 gap-4 */}
              {filteredThreads.map(thread => (
                <div 
                  key={thread.id}
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                    borderLeft: '4px solid #2563eb', // border-l-4 border-blue-600
                    transition: 'transform 0.1s',
                    ':hover': { transform: 'translateY(-2px)' }
                  }} // bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-transform
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}> {/* flex justify-between items-start */}
                    
                    <div style={{ flex: 1, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}> {/* flex items-center gap-2 mb-2 */}
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{thread.title}</h3> {/* text-lg font-semibold */}

                        {thread.status === 'closed' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', fontSize: '12px' }}> {/* flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs */}
                            <CheckCircle size={14} />
                            解決済み
                          </span>
                        )}

                        {thread.authorId === profile?.userId && (
                          <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '12px' }}> {/* px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs */}
                            あなたの投稿
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}> {/* text-sm text-gray-600 mb-2 */}
                        投稿者: {thread.authorNickname}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}> {/* flex flex-wrap gap-1 */}
                        {(thread.tags || "").split(",").filter(t => t).map((tag, idx) => (
                          <span key={idx} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '9999px', fontSize: '12px' }}> {/* px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs */}
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* 削除ボタン */}
                    {thread.authorId === profile?.userId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id, thread.title);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }} // flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-md
                      >
                        <Trash2 size={14} />
                        削除
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>

            {/* -------------------------------------------------------------------- */}
            {/* 新規スレッド作成モーダル */}
            {/* -------------------------------------------------------------------- */}
            {showNewThread && (
              <div style={modalOverlayStyle} onClick={() => setShowNewThread(false)}>
                <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>新規スレッド作成</h2>
                    <button
                      onClick={() => setShowNewThread(false)}
                      style={{ padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: "transparent" }}
                    >
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
                        カテゴリータグ
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              const tags = newThread.tags.includes(cat)
                                ? newThread.tags.filter((t) => t !== cat)
                                : [...newThread.tags, cat];
                              setNewThread({ ...newThread, tags });
                            }}
                            style={{
                              padding: "4px 12px",
                              borderRadius: "6px",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: newThread.tags.includes(cat) ? "#2563eb" : "#e5e7eb", // bg-blue-600 vs bg-gray-200
                              color: newThread.tags.includes(cat) ? "white" : "#374151", // text-white vs text-gray-700
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={createThread}
                      style={{
                        width: "100%", backgroundColor: "#2563eb",
                        color: "white", padding: "12px",
                        borderRadius: "6px", border: "none",
                        cursor: "pointer", fontWeight: "500",
                      }}
                    >
                      投稿する
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------------- */}
            {/* スレッド詳細モーダル */}
            {/* -------------------------------------------------------------------- */}
            {selectedThread && (
              <div style={modalOverlayStyle} onClick={() => setSelectedThread(null)}>
                <div style={{...modalContentStyle, maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
                  
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '16px',
                    paddingBottom: '16px', borderBottom: '1px solid #e5e7eb'
                  }}>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {selectedThread.title}
                        </h2>

                        {selectedThread.status === "closed" && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '14px' }}>
                            <CheckCircle size={16} />
                            解決済み
                          </span>
                        )}
                      </div>

                      {/* スレッド投稿者のみに表示されるクローズボタン */}
                      {selectedThread.status === 'open' && selectedThread.authorId === profile?.userId && (
                        <button 
                          onClick={closeThreadDirectly}
                          style={{
                            marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '8px 16px', backgroundColor: '#10b981', color: 'white',
                            borderRadius: '6px', border: 'none', cursor: 'pointer'
                          }}
                        >
                          <Lock size={16} /> 解決済みにする
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

                  {/* スレッド本文 */}
                  <div style={{ backgroundColor: '#f9fafb', borderLeft: '4px solid #2563eb', padding: '16px', marginBottom: '16px' }}>
                    
                    <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                      名前: {selectedThread.authorNickname}
                    </p>

                    <p style={{ color: '#1f2937', whiteSpace: 'pre-wrap' }}>
                      {selectedThread.content}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                      {selectedThread.tags && selectedThread.tags.map((tag, idx) => (
                        <span key={idx} style={{ padding: '2px 8px',
                          backgroundColor: '#dbeafe', color: '#1e40af',
                          borderRadius: '9999px', fontSize: '12px' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 返信一覧 */}
                  {selectedThread.responses && selectedThread.responses.map((response, idx) => (
                    <div key={response.id} style={{
                      borderLeft: '4px solid #d1d5db',
                      backgroundColor: '#f9fafb', padding: '16px',
                      marginBottom: '16px', position: 'relative'
                    }}>
                      <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>
                        {idx + 1}: {response.authorNickname}
                      </p>

                      <p style={{ whiteSpace: 'pre-wrap', color: '#1f2937', marginBottom: '8px' }}>
                        {response.content}
                      </p>

                      {/* 自分の返信だけ削除ボタンを表示 */}
                      {response.authorId === profile?.userId && (
                        <button
                          onClick={() => deleteReply(response.id)}
                          style={{
                            position: 'absolute', top: '12px', right: '12px',
                            backgroundColor: '#ef4444', color: 'white', border: 'none',
                            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}

                  {/* 返信フォーム */}
                  {selectedThread.status !== "closed" && (
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <textarea 
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        style={{
                          width: '100%', padding: '12px',
                          border: '1px solid #d1d5db', borderRadius: '6px',
                          marginBottom: '8px'
                        }}
                        rows="3"
                        placeholder="返信を書く..."
                      />

                      <button 
                        onClick={addReply}
                        style={{
                          width: '100%', backgroundColor: '#2563eb',
                          color: 'white', padding: '8px 24px', borderRadius: '6px',
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        返信する
                      </button>
                    </div>
                  )}

                  {/* 解決済みメッセージ */}
                  {selectedThread.status === "closed" && (
                    <div style={{
                      marginTop: '24px', padding: '16px',
                      backgroundColor: '#f3f4f6', borderRadius: '6px',
                      textAlign: 'center', color: '#4b5563',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <Lock size={20} />
                      このスレッドは解決済みです。
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------------- */}
            {/* プロフィール設定モーダル */}
            {/* -------------------------------------------------------------------- */}
            {showProfile && (
              <div style={modalOverlayStyle} onClick={profile ? () => setShowProfile(false) : null}>
                <div style={{...modalContentStyle, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                    プロフィール設定
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* ニックネーム */}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        ニックネーム <span style={{ color: '#dc2626' }}>*必須</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.nickname}
                        onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                        style={{
                          width: '100%', padding: '8px',
                          border: '1px solid #d1d5db', borderRadius: '6px'
                        }}
                      />
                    </div>

                    {/* スキルタグ */}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        スキルタグ
                      </label>
                      <input
                        type="text"
                        value={profileForm.skills}
                        onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                        style={{
                          width: '100%', padding: '8px',
                          border: '1px solid #d1d5db', borderRadius: '6px'
                        }}
                        placeholder="例: JavaScript, React, デザイン (カンマ区切り)"
                      />
                    </div>

                    {/* 学科 */}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        学科
                      </label>
                      <select 
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                        style={{
                          width: '100%', padding: '8px',
                          border: '1px solid #d1d5db', borderRadius: '6px'
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

                    {/* 学年 */}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        学年
                      </label>
                      <select 
                        value={profileForm.year}
                        onChange={(e) => setProfileForm({...profileForm, year: e.target.value})}
                        style={{
                          width: '100%', padding: '8px',
                          border: '1px solid #d1d5db', borderRadius: '6px'
                        }}
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
                      onClick={handleProfileSubmit}
                      disabled={!profileForm.nickname.trim()}
                      style={{
                        width: '100%', backgroundColor: profileForm.nickname.trim() ? '#2563eb' : '#9ca3af', // ニックネームが空の場合はグレーアウト
                        color: 'white', padding: '8px',
                        borderRadius: '6px', border: 'none',
                        cursor: profileForm.nickname.trim() ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s'
                      }}
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