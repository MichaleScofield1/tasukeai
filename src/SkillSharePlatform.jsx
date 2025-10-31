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

      // ベストアンサー選択後に解決済み確認ダイアログを表示
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-blue-600 border-b-4 border-blue-600 pb-2">
              Skill Share Platform
            </h1>
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              <User size={20} />
              {profile ? profile.nickname : 'プロフィール設定'}
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="スレッドを検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowNewThread(true)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              新規スレッド
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredThreads.map(thread => (
            <div 
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-pointer border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{thread.title}</h3>
                    {thread.status === 'closed' && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle size={14} />
                        解決済み
                      </span>
                    )}
                    {thread.author === profile?.nickname && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        あなたの投稿
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    投稿者: {thread.author} @{thread.authorId?.substring(0, 4)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {thread.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  返信: {thread.responses?.length || 0}件
                </span>
              </div>
            </div>
          ))}
        </div>

        {showNewThread && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">新規スレッド作成</h2>
                <button 
                  onClick={() => setShowNewThread(false)}
                  className="hover:bg-gray-100 rounded p-2"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="タイトル"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                />
                
                <textarea
                  placeholder="内容"
                  className="w-full p-3 border border-gray-300 rounded h-40 focus:outline-none focus:border-blue-500"
                  value={newThread.content}
                  onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                />
                
                <div>
                  <label className="block text-sm font-medium mb-2">カテゴリータグ</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          const tags = newThread.tags.includes(cat)
                            ? newThread.tags.filter(t => t !== cat)
                            : [...newThread.tags, cat];
                          setNewThread({...newThread, tags});
                        }}
                        className={`px-3 py-1 rounded ${
                          newThread.tags.includes(cat)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={createThread}
                  className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium"
                >
                  投稿する
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedThread && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{selectedThread.title}</h2>
                    {selectedThread.status === 'closed' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                        <CheckCircle size={16} />
                        解決済み
                      </span>
                    )}
                  </div>
                  {selectedThread.status === 'open' && selectedThread.author === profile?.nickname && (
                    <button 
                      onClick={closeThreadDirectly}
                      className="mt-2 flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      <Lock size={16} />
                      解決済みにする
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedThread(null)}
                  className="hover:bg-gray-100 rounded p-2"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">1: 名前: {selectedThread.author}</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedThread.content}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedThread.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedThread.responses && selectedThread.responses.map((response, idx) => (
                  <div key={response.id} className={`border-l-4 p-4 mb-4 ${
                    response.isBest 
                      ? 'bg-yellow-50 border-yellow-500' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-600">{idx + 2}: 名前: {response.author}</p>
                      {!response.isBest && selectedThread.status === 'open' && selectedThread.author === profile?.nickname && (
                        <button 
                          onClick={() => selectBestAnswer(response.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          <CheckCircle size={14} />
                          ベストアンサー
                        </button>
                      )}
                      {response.isBest && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded text-xs">
                          <CheckCircle size={14} />
                          ベストアンサー
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
                    <p className="text-gray-600 flex items-center justify-center gap-2">
                      <Lock size={20} />
                      このスレッドは解決済みです
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCloseConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">ベストアンサーを選択しました</h3>
              <p className="text-gray-600 mb-6">
                このスレッドを解決済みにしますか？
                <br />
                <span className="text-sm text-red-600">※この操作は取り消せません</span>
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => closeThread(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  いいえ、まだ開いておく
                </button>
                <button 
                  onClick={() => closeThread(true)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  はい、解決済みにする
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">プロフィール設定</h2>
              {!profile && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">⚠️ 初回起動です。ニックネームを設定してください。</p>
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      ニックネーム <span className="text-red-500">*必須</span>
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      required
                      defaultValue={profile?.nickname}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="例: 山田太郎"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">スキルタグ</label>
                    <input
                      type="text"
                      name="skills"
                      defaultValue={profile?.skills?.join(', ')}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="例: JavaScript, React, デザイン"
                    />
                    <p className="text-xs text-gray-500 mt-1">カンマ区切りで入力</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">学科</label>
                    <select 
                      name="department"
                      defaultValue={profile?.department || ''}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      <option value="情報工学科">情報計算科学科</option>
                      <option value="数理科学科">数理科学科</option>
                      <option value="先端物理学科">先端物理学科</option>
                      <option value="生命生物科学科">生命生物科学科</option>
                    　<option value="先端科学科">先端科学科</option>
                      <option value="電気電子情報工学科">電気電子情報工学科</option>
                      <option value="機械工学科">機械工学科</option>
                      <option value="デザイン学科">デザイン学科</option>
                      <option value="建築学科">建築学科</option>
                      <option value="経営システム工学科">経営システム工学科</option>
                      <option value="機械航空宇宙工学科">機械航空宇宙工学科</option>
                      <option value="社会基盤工学科">社会基盤工学科</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">学年</label>
                    <select 
                      name="year"
                      defaultValue={profile?.year || ''}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
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