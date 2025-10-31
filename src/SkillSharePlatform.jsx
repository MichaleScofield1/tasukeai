import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle } from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  deleteDoc,
  arrayUnion,
  increment,
  serverTimestamp 
} from 'firebase/firestore';

const SkillSharePlatform = () => {
  const [selectedThread, setSelectedThread] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ユニークなユーザーIDを追加
  const [profile, setProfile] = useState(() => {
    // localStorageから読み込み
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      return JSON.parse(saved);
    }
    // 初回はユニークIDを生成
    return {
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname: '',
      skills: ['JavaScript', 'React', 'デザイン'],
      department: '情報工学科',
      year: '3年'
    };
  });

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [reply, setReply] = useState('');

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (!profile.nickname.trim()) {
    setShowProfile(true);
  }
}, [profile.nickname, setShowProfile]);

useEffect(() => {
  loadThreads();
}, []);

  const loadThreads = async () => {
    try {
      const threadsCollection = collection(db, 'threads');
      const snapshot = await getDocs(threadsCollection);
      const threadsData = snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      }));
      setThreads(threadsData);
      setLoading(false);
    } catch (error) {
      console.error('データの読み込みエラー:', error);
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }

    if (!profile.nickname.trim()) {
      alert('プロフィールでニックネームを設定してください');
      setShowProfile(true);
      return;
    }

    try {
      const tags = generateTags(newThread.title + ' ' + newThread.content);
      
      await addDoc(collection(db, 'threads'), {
        title: newThread.title,
        author: profile.nickname,
        authorId: profile.userId, // ユーザーIDを保存
        replies: 0,
        tags: tags,
        content: newThread.content,
        status: 'open',
        responses: [],
        createdAt: serverTimestamp()
      });

      await loadThreads();
      
      setNewThread({ title: '', content: '' });
      setShowNewThread(false);
      alert('スレッドを作成しました！');
    } catch (error) {
      console.error('スレッド作成エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  const deleteThread = async (threadId) => {
    if (!window.confirm('本当にこのスレッドを削除しますか?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'threads', threadId));
      await loadThreads();
      setSelectedThread(null);
      alert('スレッドを削除しました！');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  const generateTags = (text) => {
    const keywords = {
      'React': ['react', 'hooks', 'usestate', 'useeffect', 'jsx'],
      'JavaScript': ['javascript', 'js', '関数', '変数'],
      'Python': ['python', 'pandas', 'numpy'],
      'デザイン': ['デザイン', 'ui', 'ux', '配色', 'レイアウト'],
      'データ分析': ['データ', '分析', '統計'],
      '機械学習': ['機械学習', 'ai', 'ml'],
      'フロントエンド': ['フロントエンド', 'html', 'css'],
      'バックエンド': ['バックエンド', 'サーバー', 'api', 'データベース']
    };

    const lowerText = text.toLowerCase();
    const tags = [];

    for (const [tag, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        tags.push(tag);
      }
    }

    return tags.length > 0 ? tags : ['その他'];
  };

  const addReply = async () => {
    if (!reply.trim()) {
      alert('返信内容を入力してください');
      return;
    }

    if (!profile.nickname.trim()) {
      alert('プロフィールでニックネームを設定してください');
      setShowProfile(true);
      return;
    }

    try {
      const threadRef = doc(db, 'threads', selectedThread.firebaseId);
      
      const newResponse = {
        id: Date.now(),
        author: profile.nickname,
        authorId: profile.userId, // ユーザーIDを保存
        content: reply,
        isBest: false
      };

      await updateDoc(threadRef, {
        responses: arrayUnion(newResponse),
        replies: increment(1)
      });

      await loadThreads();
      
      const updatedThread = threads.find(t => t.firebaseId === selectedThread.firebaseId);
      setSelectedThread(updatedThread);
      
      setReply('');
      alert('返信を投稿しました！');
    } catch (error) {
      console.error('返信エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  const selectBestAnswer = async (responseId) => {
    // 投稿者のみが選択できるように確認
    if (selectedThread.authorId !== profile.userId) {
      alert('ベストアンサーはスレッド投稿者のみが選択できます');
      return;
    }

    try {
      const threadRef = doc(db, 'threads', selectedThread.firebaseId);
      
      const updatedResponses = selectedThread.responses.map(response => ({
        ...response,
        isBest: response.id === responseId
      }));

      await updateDoc(threadRef, {
        responses: updatedResponses,
        status: 'closed'
      });

      await loadThreads();
      
      const updatedThread = threads.find(t => t.firebaseId === selectedThread.firebaseId);
      setSelectedThread(updatedThread);
      
      alert('ベストアンサーを選択しました！');
    } catch (error) {
      console.error('ベストアンサー選択エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  // ニックネームをID付きで表示する関数（Twitter風）
  const getDisplayName = (author, authorId) => {
  if (!authorId) return author;
  const shortId = authorId.slice(-4);
  return `${author} @${shortId}`;
  };

  const saveProfile = () => {
    if (!profile.nickname.trim()) {
      alert('ニックネームを入力してください');
      return;
    }
    
    // localStorageに保存
    localStorage.setItem('userProfile', JSON.stringify(profile));
    alert('プロフィールを保存しました！');
    setShowProfile(false);
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      if (!profile.skills.includes(e.target.value.trim())) {
        setProfile({
          ...profile,
          skills: [...profile.skills, e.target.value.trim()]
        });
      }
      e.target.value = '';
    }
  };
  
  const removeSkill = (skillToRemove) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(query) ||
      thread.content.toLowerCase().includes(query) ||
      thread.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md border-b-2 border-blue-500">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Skill Share Platform</h1>
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <User size={20} />
              {profile.nickname || 'プロフィール設定'}
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="スレッドを検索..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button 
              onClick={() => setShowNewThread(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus size={20} />
              新規スレッド
            </button>
          </div>

          <div className="grid gap-4">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? '検索結果が見つかりませんでした' : 'まだスレッドがありません'}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div 
                  key={thread.firebaseId}
                  onClick={() => setSelectedThread(thread)}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-800">{thread.title}</h3>
                      {thread.authorId === profile.userId && (
                        <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                          あなたの投稿
                        </span>
                      )}
                    </div>
                    {thread.status === 'closed' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        解決済み
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">投稿者: {getDisplayName(thread.author, thread.authorId)}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {thread.tags && thread.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    返信: {thread.replies}件
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* スレッド詳細モーダル */}
      {selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedThread.title}</h2>
                  {selectedThread.authorId === profile.userId && (
                    <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                      あなたの投稿
                    </span>
                  )}
                </div>
                {selectedThread.status === 'closed' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    解決済み
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {selectedThread.authorId === profile.userId && (
                  <button 
                    onClick={() => deleteThread(selectedThread.firebaseId)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                  >
                    🗑️ 削除
                  </button>
                )}
                
                <button 
                  onClick={() => setSelectedThread(null)}
                  className="hover:bg-gray-100 rounded p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-gray-600">1: 名前: {getDisplayName(selectedThread.author, selectedThread.authorId)}</p>
                  {selectedThread.authorId === profile.userId && (
                    <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                      あなた
                    </span>
                  )}
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedThread.content}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {selectedThread.tags && selectedThread.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {selectedThread.responses && selectedThread.responses.map((response, idx) => (
                <div key={response.id} className={`border-l-4 p-4 mb-4 ${
                  response.isBest ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">{idx + 2}: 名前: {getDisplayName(response.author, response.authorId)}</p>
                      {response.authorId === profile.userId && (
                        <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                          あなた
                        </span>
                      )}
                    </div>
                    
                    {/* ベストアンサーボタン（スレッド投稿者のみ表示） */}
                    {!response.isBest && 
                      selectedThread.status === 'open' && 
                      selectedThread.authorId === profile.userId && (
                      <button 
                        onClick={() => selectBestAnswer(response.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        <CheckCircle size={14} />
                        ベストアンサー
                      </button>
                    )}
                    
                    {response.isBest && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500 rounded text-xs">
                        <CheckCircle size={14} className="text-white" />
                        <span className="text-red-600 font-bold">ベストアンサー</span>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{response.content}</p>
                </div>
              ))}

              {selectedThread.status === 'open' && (
                <div className="mt-6 p-4 bg-white border-2 border-gray-200 rounded">
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded mb-2 focus:outline-none focus:border-blue-500"
                    rows="4"
                    placeholder="返信を書く..."
                  />
                  <button 
                    onClick={addReply}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    返信する
                  </button>
                </div>
              )}

              {selectedThread.status === 'closed' && (
                <div className="mt-6 p-4 bg-gray-100 border-2 border-gray-300 rounded text-center">
                  <p className="text-gray-600">このスレッドは解決済みのためクローズされました</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* プロフィール編集モーダル */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">プロフィール設定</h2>
              {profile.nickname && (
                <button onClick={() => setShowProfile(false)} className="hover:bg-gray-100 rounded p-2">
                  <X size={24} />
                </button>
              )}
            </div>
            
            {!profile.nickname && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ 初回起動です。ニックネームを設定してください。
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ニックネーム <span className="text-red-500">*必須</span>
                </label>
                <input 
                  type="text" 
                  value={profile.nickname}
                  onChange={(e) => setProfile({...profile, nickname: e.target.value})}
                  placeholder="あなたの名前を入力"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">スキルタグ</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button 
                        onClick={() => removeSkill(skill)}
                        className="hover:bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  onKeyDown={addSkill}
                  placeholder="スキルを追加（Enterで追加）"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">学科</label>
                <select 
                  value={profile.department}
                  onChange={(e) => setProfile({...profile, department: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option>情報工学科</option>
                  <option>電気電子工学科</option>
                  <option>機械工学科</option>
                  <option>デザイン学科</option>
                  <option>建築学科</option>
                  <option>経営学科</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">学年</label>
                <select 
                  value={profile.year}
                  onChange={(e) => setProfile({...profile, year: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option>1年</option>
                  <option>2年</option>
                  <option>3年</option>
                  <option>4年</option>
                  <option>修士1年</option>
                  <option>修士2年</option>
                </select>
              </div>
              
              <button 
                onClick={saveProfile}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規スレッド作成モーダル */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">新規スレッド作成</h2>
              <button onClick={() => setShowNewThread(false)} className="hover:bg-gray-100 rounded p-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">タイトル</label>
                <input 
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                  placeholder="質問や依頼のタイトルを入力"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">内容</label>
                <textarea 
                  rows="6"
                  value={newThread.content}
                  onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                  placeholder="詳細な内容を記載してください。AIが自動的にタグを生成します。"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              {(newThread.title || newThread.content) && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800 font-semibold mb-2">
                    AI自動生成タグ:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generateTags(newThread.title + ' ' + newThread.content).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                onClick={createThread}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700"
              >
                スレッドを立てる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SkillSharePlatform;
