import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Lock, Trash2 } from 'lucide-react';

// ========================================================================
// APIのベースURL（バックエンドサーバーのアドレス）
// ========================================================================
const API_BASE = "";

// ========================================================================
// メインコンポーネント - 掲示板アプリの全体を管理
// ========================================================================
/**
 * このコンポーネントは以下の3つの重要な情報を親(App.jsx)から受け取ります:
 * @param {Function} onLogout - ログアウトボタンが押されたときに実行する関数
 * @param {Object} authUser - 現在ログインしているユーザーの情報（ID、ニックネームなど）
 * @param {Function} onProfileUpdate - プロフィール更新時に親に通知する関数
 */
const SkillSharePlatform = ({ onLogout, authUser, onProfileUpdate }) => {
    
    // ====================================================================
    // State（状態）の定義 - アプリの「記憶」を管理する変数たち
    // ====================================================================
    
    // スレッド（投稿）の一覧を保存する
    // 例: [{id: 1, title: "React質問", content: "..."},...]
    const [threads, setThreads] = useState([]);
    
    // 現在開いているスレッドの詳細情報（モーダルで表示中のスレッド）
    // 何も開いていないときは null
    const [selectedThread, setSelectedThread] = useState(null);
    
    // 新規スレッド作成モーダルの表示/非表示を管理
    // true = モーダル表示、false = 非表示
    const [showNewThread, setShowNewThread] = useState(false);
    
    // プロフィール設定モーダルの表示/非表示を管理
    const [showProfile, setShowProfile] = useState(false);
    
    // 検索ボックスに入力された文字列を保存
    const [searchTerm, setSearchTerm] = useState('');
    
    // スレッド詳細画面で入力中の返信内容
    const [reply, setReply] = useState('');
    
    // ログイン中のユーザーのプロフィール情報
    // 例: {userid: "abc123", nickname: "なおき", department: "情報計算科学科"}
    const [profile, setProfile] = useState(null);
    
    // 新規スレッド作成フォームの入力内容を保存
    const [newThread, setNewThread] = useState({
      title: '',        // スレッドのタイトル
      content: '',      // スレッドの本文
      tags: [],         // 選択されたタグの配列 例: ["数学", "プログラミング"]
      customTag: ''     // タグ追加用の入力欄の内容
    });

    // プロフィール編集フォームの入力内容を保存
    const [profileForm, setProfileForm] = useState({
      nickname: '',    // ニックネーム
      skills: '',      // スキルタグ（カンマ区切りの文字列）
      department: '',  // 学科
      year: ''         // 学年
    });

    // ====================================================================
    // useEffect - 画面が最初に表示されたときに実行される処理
    // ====================================================================
    /**
     * このuseEffectは以下の2つのタイミングで実行されます:
     * 1. コンポーネントが最初に画面に表示されたとき
     * 2. authUser（ログインユーザー情報）が変更されたとき
     */
    useEffect(() => {
        // authUserが存在する（ログイン済み）場合の処理
        if (authUser) {
          // 親から受け取ったユーザー情報をローカルのprofileに保存
          setProfile(authUser);
          
          // プロフィール編集フォームの各項目を初期化
          setProfileForm({
              nickname: authUser.nickname || "",  // ニックネームがない場合は空文字
              // skillsが配列の場合はカンマ区切りの文字列に変換
              // 例: ["React", "Node.js"] → "React, Node.js"
              skills: authUser.skills?.join(", ") || "",
              department: authUser.department || "",
              year: authUser.year || "",
          });
        }

        // サーバーからスレッド一覧を取得して画面に表示
        loadThreads();

    }, [authUser]); // authUserが変わったら再実行


    // ====================================================================
    // サーバーとの通信関数 - データの取得・送信を担当
    // ====================================================================

    /**
     * 【関数1】スレッド一覧をサーバーから取得
     * - サーバーに「全スレッドちょうだい」とリクエスト
     * - 受け取ったデータをthreads Stateに保存
     */
    const loadThreads = async () => {
      try {
        // GETリクエスト: サーバーの /api/threads エンドポイントにアクセス
        const res = await fetch(`${API_BASE}/api/threads`);
        
        // サーバーから返ってきたJSON形式のデータを変換
        const data = await res.json();
        
        // デバッグ用: ブラウザのコンソールにデータを表示
        console.log('📋 取得したスレッドデータ:', data);
        console.log('📋 最初のスレッド:', data[0]);
        
        // 取得したデータをStateに保存（画面が自動で更新される）
        setThreads(data);
      } catch (error) {
        console.error("スレッド読み込みエラー:", error);
      }
    };
    
    /**
     * 【関数2】特定のスレッドの返信一覧を取得
     * @param {string} threadId - 返信を取得したいスレッドのID
     * @returns {Array} 返信の配列
     */
    const loadReplies = async (threadId) => {
        try {
          // GETリクエスト: ?threadId=xxx というクエリパラメータ付きでリクエスト
          const res = await fetch(`${API_BASE}/api/replies?threadId=${threadId}`);
          
          // 返信データの配列を返す
          return await res.json();
        } catch (err) {
          console.error("返信読み込みエラー:", err);
          return []; // エラー時は空の配列を返す
        }
    };

    /**
     * 【関数3】プロフィールを更新してサーバーに保存
     * - フォームに入力された内容をサーバーに送信
     * - 成功したら画面のプロフィール表示も更新
     */
    const handleProfileSubmit = async () => {
        try {
          // ログイン情報がない場合はエラー
          if (!profile || !profile.userid) {
            alert("ログイン情報がありません。再ログインしてください。");
            return;
          }
      
          // サーバーに送信するデータを準備
          const updated = {
            nickname: profileForm.nickname,
            // skillsをカンマで分割して配列に変換
            // 例: "React, Node.js" → ["React", "Node.js"]
            skills: profileForm.skills.split(",").map(s => s.trim()).filter(s => s.length > 0),
            department: profileForm.department,
            year: profileForm.year
          };
      
          // 親コンポーネント(App.jsx)の更新関数を呼び出し
          // この関数がサーバーへのPUTリクエストを実行
          const result = await onProfileUpdate(updated);
          
          // サーバーからの応答が成功の場合
          if (result.success) {
            // 最新のユーザー情報でStateを更新
            setProfile(result.data);
            
            // フォームの内容も最新データで更新
            setProfileForm({
              nickname: result.data.nickname || "",
              skills: result.data.skills?.join(", ") || "",
              department: result.data.department || "",
              year: result.data.year || "",
            });
            
            // モーダルを閉じる
            setShowProfile(false);
            alert("プロフィールを更新しました！");
          } else {
            // エラーメッセージを表示
            alert("プロフィール更新エラー: " + result.error);
          }
      
        } catch (err) {
          console.error("プロフィール更新エラー:", err);
          alert("プロフィール更新エラー: " + err.message);
        }
    };


    /**
     * 【関数4】新しいスレッドを作成してサーバーに送信
     * - タイトルと内容が入力されているかチェック
     * - サーバーにPOSTリクエストを送信
     * - 成功したらスレッド一覧を再読み込み
     */
    const createThread = async () => {
        // 入力チェック: タイトルまたは内容が空の場合はエラー
        if (!newThread.title.trim() || !newThread.content.trim()) {
          alert('タイトルと内容を入力してください');
          return;
        }
    
        // ニックネームが設定されていない場合はエラー
        if (!profile || !profile.nickname) {
          alert('プロフィールでニックネームを設定してください');
          return;
        }
    
        try {
          // ローカルストレージから認証トークンを取得
          // このトークンでサーバーが「この人は誰か」を識別
          const token = localStorage.getItem("authToken");

          // デバッグ用ログ
          console.log('スレッド作成データ:', {
            authorId: profile.userid,
            authorNickname: profile.nickname,
            profile: profile
          });

          // POSTリクエスト: 新規スレッドデータをサーバーに送信
          const res = await fetch(`${API_BASE}/api/threads`, {
            method: "POST",  // POSTメソッド = データを送信する
            headers: {
              "Content-Type": "application/json",  // JSON形式で送信
              "Authorization": `Bearer ${token}`   // 認証トークンをヘッダーに含める
            },
            // 送信するデータをJSON文字列に変換
            body: JSON.stringify({
              title: newThread.title,
              content: newThread.content,
              authorId: profile.userid,           // 投稿者のID
              authorNickname: profile.nickname,   // 投稿者のニックネーム
              tags: newThread.tags.join(","),     // タグ配列をカンマ区切り文字列に変換
            })
          });
    
          // サーバーからの応答をJSON形式で取得
          const data = await res.json();
    
          // エラーレスポンスの場合は例外を投げる
          if (!res.ok) throw new Error(data.message || "スレッド作成に失敗");
    
          console.log('スレッド作成成功:', data);
    
          // フォームをリセット（空にする）
          setNewThread({ title: '', content: '', tags: [] });
          
          // モーダルを閉じる
          setShowNewThread(false);
          
          // スレッド一覧を再読み込みして最新状態に
          loadThreads();
    
        } catch (error) {
          console.error("投稿エラー:", error);
          alert("エラーが発生しました: " + error.message);
        }
    };


    /**
     * 【関数5】スレッドを削除する
     * @param {string} threadId - 削除するスレッドのID
     * @param {string} threadTitle - 削除するスレッドのタイトル（確認メッセージ用）
     */
    const deleteThread = async (threadId, threadTitle) => {
        // 確認ダイアログを表示（キャンセルされたら処理を中断）
        if (!window.confirm(`「${threadTitle}」を削除しますか？\n※この操作は取り消せません`)) return;
    
        try {
            // DELETEリクエスト: サーバーに削除を依頼
            await fetch(`${API_BASE}/api/delete-thread/${threadId}`, {
            method: "DELETE"
          });
    
          alert("スレッドを削除しました");
          
          // モーダルを閉じる
          setSelectedThread(null);
          
          // スレッド一覧を再読み込み
          loadThreads();
    
        } catch (error) {
          console.error("削除エラー:", error);
          alert("スレッドの削除に失敗しました");
        }
    };


    /**
     * 【関数6】スレッドを「解決済み」にする（クローズ）
     * - 投稿者本人のみが実行可能
     * - クローズ後は返信ができなくなる
     */
    const closeThreadDirectly = async () => {
        // 権限チェック: 自分が投稿したスレッド以外はクローズできない
        if (!selectedThread || selectedThread.authorId !== profile.userid) return;
    
        // 確認ダイアログ
        if (!window.confirm('このスレッドを解決済みにしますか？\n※この操作は取り消せません')) {
          return;
        }
    
        try {
          // POSTリクエスト: サーバーにクローズを依頼
          await fetch(`${API_BASE}/api/close-thread/${selectedThread.id}`, {
            method: "POST"
          });
    
          // 画面の表示を即座に更新（サーバーからの再取得を待たない）
          setSelectedThread({
            ...selectedThread,  // 既存のデータをコピー
            status: "closed"    // statusだけ変更
          });
    
          // スレッド一覧も再読み込み
          loadThreads();
    
        } catch (error) {
          console.error("スレッドクローズエラー:", error);
          alert("スレッドのクローズに失敗しました");
        }
    };


    /**
     * 【関数7】スレッドに返信を投稿する
     * - 現在開いているスレッドに対して返信を追加
     * - 投稿後は返信一覧を再読み込み
     */
    const addReply = async () => {
        // 空の返信は送信しない
        if (!reply.trim()) return;
        
        // プロフィールが未設定の場合はエラー
        if (!profile) {
          alert('プロフィールを設定してください');
          return;
        }
    
        try {
          // デバッグ用ログ
          console.log('📤 返信データ:', {
            threadId: selectedThread.id,
            authorId: profile.userid,
            authorNickname: profile.nickname,
            content: reply
          });

          // POSTリクエスト: 返信データをサーバーに送信
          const res = await fetch(`${API_BASE}/api/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId: selectedThread.id,        // どのスレッドへの返信か
              authorId: profile.userid,           // 返信者のID
              authorNickname: profile.nickname,   // 返信者のニックネーム
              content: reply                      // 返信の内容
            })
          });
    
          // サーバーからの応答を取得
          const data = await res.json();
          
          // エラーの場合
          if (!res.ok) {
            console.error('❌ 返信エラー:', data);
            throw new Error(data.message || data.error);
          }

          console.log('✅ 返信成功:', data);
    
          // 入力欄をクリア
          setReply('');
    
          // このスレッドの最新の返信一覧を取得
          const updatedReplies = await loadReplies(selectedThread.id);
    
          // 画面に表示中のスレッド情報を更新
          setSelectedThread({
            ...selectedThread,
            responses: updatedReplies  // 返信一覧を最新に
          });
    
        } catch (error) {
          console.error("返信エラー:", error);
          alert("返信の投稿に失敗しました: " + error.message);
        }
    };


    /**
     * 【関数8】返信を削除する
     * @param {string} replyId - 削除する返信のID
     */
    const deleteReply = async (replyId) => {
        // 確認ダイアログ
        if (!window.confirm("この返信を削除しますか？")) return;
      
        try {
          // DELETEリクエスト: サーバーに削除を依頼
          const res = await fetch(`${API_BASE}/api/delete-reply/${replyId}`, {
            method: "DELETE",
          });
      
          const data = await res.json();
      
          // エラーチェック
          if (!res.ok) {
            alert(data.error || "削除に失敗しました");
            return;
          }
      
          // 最新の返信一覧を取得
          const updatedReplies = await loadReplies(selectedThread.id);
      
          // 画面を更新
          setSelectedThread({
            ...selectedThread,
            responses: updatedReplies
          });
      
        } catch (err) {
          console.error("返信削除エラー:", err);
          alert("エラーが発生しました");
        }
    };


    // ====================================================================
    // ユーティリティ関数 - 補助的な処理
    // ====================================================================

    /**
     * スレッドの検索フィルタリング
     * - searchTermに入力された文字列でスレッドを絞り込む
     * - タイトルまたはタグが検索文字列を含むスレッドのみ表示
     */
    const filteredThreads = threads.filter(thread =>
        (thread.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.tags || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // モーダル（ポップアップ）のスタイル定義
    // 画面全体を覆う半透明の背景
    const modalOverlayStyle = {
      position: 'fixed',           // 画面に固定
      top: 0, left: 0,             // 画面の左上から
      right: 0, bottom: 0,         // 画面全体を覆う
      backgroundColor: 'rgba(0, 0, 0, 0.5)',  // 半透明の黒
      display: 'flex',             // フレックスボックスで中央配置
      alignItems: 'center',        // 縦方向中央
      justifyContent: 'center',    // 横方向中央
      zIndex: 9999                 // 最前面に表示
    };

    // モーダルの中身（白い箱）のスタイル
    const modalContentStyle = {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '700px',           // 最大幅
      width: '90%',                // 画面幅の90%
      maxHeight: '85vh',           // 画面の高さの85%
      overflowY: 'auto',           // 内容が多い場合はスクロール
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    };


    // ====================================================================
    // UI（見た目）のレンダリング - ここから画面の構造
    // ====================================================================

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
            
            {/* ========================================
                ヘッダー部分 - タイトル、検索、ボタンなど
                ======================================== */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
              
              {/* タイトルとユーザーアクション（プロフィール、ログアウト） */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                {/* サイトタイトル */}
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb', borderBottom: '4px solid #2563eb', paddingBottom: '8px' }}>
                  助け合いの極み
                </h1>

                {/* 右側のボタン群 */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* プロフィール設定ボタン */}
                  <button 
                    onClick={() => setShowProfile(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    <User size={20} />
                    {/* プロフィールがあればニックネーム表示、なければ「プロフィール設定」 */}
                    {profile ? profile.nickname : 'プロフィール設定'}
                  </button>

                  {/* ログアウトボタン */}
                  <button 
                    onClick={onLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  >
                    ログアウト
                  </button>
                </div>
              </div>

              {/* 検索ボックスと新規スレッドボタン */}
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* 検索ボックス */}
                <div style={{ flex: 1, position: 'relative' }}>
                  {/* 虫眼鏡アイコン */}
                  <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} size={20} />
                  {/* 検索入力欄 */}
                  <input
                    type="text"
                    placeholder="スレッドを検索..."
                    style={{ width: '250px', paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* 新規スレッド作成ボタン */}
                <button 
                  onClick={() => setShowNewThread(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={20} />
                  新規スレッド
                </button>
              </div>
            </div>

            {/* ========================================
                スレッド一覧表示エリア
                ======================================== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {/* filteredThreadsの各スレッドをカード形式で表示 */}
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
                    ':hover': { transform: 'translateY(-2px)' }
                  }}
                  // クリックでスレッド詳細を開く
                  onClick={async () => {
                    // このスレッドの返信を取得
                    const replies = await loadReplies(thread.id);

                    // スレッドデータに返信を追加
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
                    
                    {/* 削除ボタン */}
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
                        タグを追加（#で始めてください）
                      </label>
                      
                      {/* カスタムタグ入力 */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <input
                          type="text"
                          value={newThread.customTag}
                          onChange={(e) => {
                            let value = e.target.value;
                            // 自動的に#を追加
                            if (value && !value.startsWith('#')) {
                              value = '#' + value;
                            }
                            setNewThread({ ...newThread, customTag: value });
                          }}
                          onKeyPress={(e) => {
                            // Enterキーで追加
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
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const tag = newThread.customTag.trim();
                            if (tag && tag.length > 1) {
                              // #を除いたタグ名を取得
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
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}
                        >
                          追加
                        </button>
                      </div>

                      {/* 選択されたタグ一覧 */}
                      {newThread.tags.length > 0 && (
                        <div>
                          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>選択中のタグ:</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {newThread.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "6px 10px",
                                  backgroundColor: "#dbeafe",
                                  color: "#1e40af",
                                  borderRadius: "6px",
                                  fontSize: "13px"
                                }}
                              >
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewThread({
                                      ...newThread,
                                      tags: newThread.tags.filter((t) => t !== tag)
                                    });
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#1e40af",
                                    cursor: "pointer",
                                    padding: "0",
                                    fontSize: "18px",
                                    lineHeight: "1",
                                    fontWeight: "bold"
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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

            {/* スレッド詳細モーダル（省略 - 元のコードと同じ）*/}
            {selectedThread && (
              <div style={modalOverlayStyle} onClick={() => setSelectedThread(null)}>
                <div style={{...modalContentStyle, maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
                  
                  {/* ヘッダー部分は元のコードと同じなので省略 */}
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

                      {selectedThread.status === 'open' && selectedThread.authorId === profile?.userid && (
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
                      {selectedThread.authorDepartment && (
                        <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                          ({selectedThread.authorDepartment} {selectedThread.authorYear})
                        </span>
                      )}
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
                        {response.authorDepartment && (
                          <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                            ({response.authorDepartment} {response.authorYear})
                          </span>
                        )}
                      </p>

                      <p style={{ whiteSpace: 'pre-wrap', color: '#1f2937', marginBottom: '8px' }}>
                        {response.content}
                      </p>

                      {response.authorId === profile?.userid && (
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

            {/* プロフィール設定モーダル */}
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
                        width: '100%', backgroundColor: profileForm.nickname.trim() ? '#2563eb' : '#9ca3af',
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