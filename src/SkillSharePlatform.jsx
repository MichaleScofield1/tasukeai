import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle } from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  arrayUnion,
  increment,
  serverTimestamp 
} from 'firebase/firestore';

//掲示板のメイン画面を構成する部分
const SkillSharePlatform = () => {
  const [selectedThread, setSelectedThread] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  //現在ログインしているユーザーのプロフィール情報
  const [profile, setProfile] = useState({
    nickname: '山田太郎',
    skills: ['JavaScript', 'React', 'デザイン'],
    department: '情報工学科',
    year: '3年'
  });
　
  //掲示板に表示されるスレッド一覧を管理
  // Firebaseからスレッドを読み込む
const [threads, setThreads] = useState([]);
const [loading, setLoading] = useState(true);

// 初回読み込み
useEffect(() => {
  loadThreads();
}, []);

// Firebaseからデータを読み込む関数
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
  
  //新しく作るスレッドを維持的に保存するための状態
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  //返信フォームに入力された内容を保存するための状態
  const [reply, setReply] = useState('');

  //スレッドを新規作成する関数
  // スレッド作成（Firebaseに保存）
const createThread = async () => {
  if (!newThread.title.trim() || !newThread.content.trim()) {
    alert('タイトルと内容を入力してください');
    return;
  }

  try {
    const tags = generateTags(newThread.title + ' ' + newThread.content);
    
    // Firebaseに保存
    await addDoc(collection(db, 'threads'), {
      title: newThread.title,
      author: profile.nickname,
      replies: 0,
      tags: tags,
      content: newThread.content,
      status: 'open',
      responses: [],
      createdAt: serverTimestamp()
    });

    // 画面を更新
    await loadThreads();
    
    setNewThread({ title: '', content: '' });
    setShowNewThread(false);
    alert('スレッドを作成しました！');
  } catch (error) {
    console.error('スレッド作成エラー:', error);
    alert('エラーが発生しました: ' + error.message);
  }
};
　
  //どんな単語が含まれていたらどのタグにするか
  //文章の中に「react」「hooks」「api」などの単語が含まれていたら、自動的に「React」「バックエンド」などのタグがつくようになっている。
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
　　
    //構文を全て小文字にして判定しやすくする
    const lowerText = text.toLowerCase();
    const tags = [];
　　
    //各キーワード群をチェックし、含まれていればタグを追加
    for (const [tag, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        tags.push(tag);
      }
    }
　　
    //一致するタグがなければ、その他とする
    return tags.length > 0 ? tags : ['その他'];
  };
　
  //返信を投稿するための関数
  // 返信追加（Firebaseに保存）
const addReply = async () => {
  if (!reply.trim()) {
    alert('返信内容を入力してください');
    return;
  }

  try {
    const threadRef = doc(db, 'threads', selectedThread.firebaseId);
    
    const newResponse = {
      id: Date.now(),
      author: profile.nickname,
      content: reply,
      isBest: false
    };

    // Firebaseを更新
    await updateDoc(threadRef, {
      responses: arrayUnion(newResponse),
      replies: increment(1)
    });

    // 画面を更新
    await loadThreads();
    
    // モーダルの内容も更新
    const updatedThread = threads.find(t => t.firebaseId === selectedThread.firebaseId);
    setSelectedThread(updatedThread);
    
    setReply('');
    alert('返信を投稿しました！');
  } catch (error) {
    console.error('返信エラー:', error);
    alert('エラーが発生しました: ' + error.message);
  }
};
　
  //スレッド内のベストアンサーを選ぶ関数
  // ベストアンサー選択（Firebaseに保存）
const selectBestAnswer = async (responseId) => {
  try {
    const threadRef = doc(db, 'threads', selectedThread.firebaseId);
    
    // 全ての返信を取得して、ベストアンサーを更新
    const updatedResponses = selectedThread.responses.map(response => ({
      ...response,
      isBest: response.id === responseId
    }));

    // Firebaseを更新
    await updateDoc(threadRef, {
      responses: updatedResponses,
      status: 'closed'
    });

    // 画面を更新
    await loadThreads();
    
    const updatedThread = threads.find(t => t.firebaseId === selectedThread.firebaseId);
    setSelectedThread(updatedThread);
    
    alert('ベストアンサーを選択しました！');
  } catch (error) {
    console.error('ベストアンサー選択エラー:', error);
    alert('エラーが発生しました: ' + error.message);
  }
};
　
  //プロフィール編集を保存する関数
  const saveProfile = () => {
    alert('プロフィールを保存しました！');
    setShowProfile(false);
  };
　
  //スキルを追加する関数
  //例：入力欄に「C言語」と打ってEnter → skillsリストに "C言語" が追加される。
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
  
  //スキルを削除する関数
  //例：skills = [“JavaScript”, “React”, “Python”]→ removeSkill(“React”) 実行後→ [“JavaScript”, “Python”]
  const removeSkill = (skillToRemove) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };


  //ここから掲示板サイトの画面（UI）を作成している
  //検索バーの文字（searchQuery）に合うスレッドだけを抽出して表示。
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = searchQuery === '' || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });
　
  //1つのスレッドの表示の仕方を決める部分
const ThreadCard = ({ thread }) => {
  const hasMatchingSkill = thread.tags.some(tag => profile.skills.includes(tag));
  
  return (
    <div 
      className={`bg-white border-4 border-red-500 rounded-lg shadow-lg border-l-8 ${hasMatchingSkill ? 'border-l-green-500' : 'border-l-blue-500'} p-4 mb-3 cursor-pointer hover:bg-gray-50 hover:shadow-md transition`}
      onClick={() => setSelectedThread(thread)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800" style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '4px', display: 'inline-block' }}>
          件名：{thread.title}
          </h3>
        </div>
        <span className={`px-2 py-1 rounded text-xs ml-2 ${
          thread.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {thread.status === 'open' ? '募集中' : '解決済'}
        </span>
      </div>
      {hasMatchingSkill && (
        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs mb-2">
          あなたのスキルにマッチ
        </span>
      )}
      <p className="text-sm text-gray-600 mb-2">名前: {thread.author}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {thread.tags.map((tag, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            #{tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-500">レス数: {thread.replies}</p>
    </div>
  );
};

  //ユーザーが見るページの全体
  return (
      <>
    {/* ローディング表示 */}
    {loading && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )}

    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">助け合いの極み</h1>
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
          >
            <User size={20} />
            {profile.nickname}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="スレッドを検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <button 
              onClick={() => setShowNewThread(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
            >
              <Plus size={15} />
              新規スレッド
            </button>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">あなたのスキル</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  #{skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          {filteredThreads.length}件のスレッド
        </div>

        <div className="space-y-2">
          {filteredThreads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      </div>
　　　
      {/*スレッドをクリックしたときに表示される画面*/}
      {selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center z-10">
              <h2 className="font-bold text-lg">{selectedThread.title}</h2>
              <button onClick={() => setSelectedThread(null)} className="hover:bg-blue-700 rounded p-1">
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
              
              {/*返信リストの表示部分*/}
              {selectedThread.responses.map((response, idx) => (
                <div key={response.id} className={`border-l-4 p-4 mb-4 ${
                  response.isBest ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-600">{idx + 2}: 名前: {response.author}</p>
                    {!response.isBest && selectedThread.status === 'open' && selectedThread.author === profile.nickname && (
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

              {/*解決済みのスレッド表示部分*/}
              {selectedThread.status === 'closed' && (
                <div className="mt-6 p-4 bg-gray-100 border-2 border-gray-300 rounded text-center">
                  <p className="text-gray-600">このスレッドは解決済みのためクローズされました</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/*プロフィール編集画面にあたる部分*/}
      {/*ユーザーが自分のニックネーム・スキル・学科・学年を変更できる設定画面を表示している。*/}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">プロフィール設定</h2>
              <button onClick={() => setShowProfile(false)} className="hover:bg-gray-100 rounded p-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ニックネーム</label>
                <input 
                  type="text" 
                  value={profile.nickname}
                  onChange={(e) => setProfile({...profile, nickname: e.target.value})}
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

      {/*新規スレッド作成画面*/}
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
    </div>
    </> 
  );
};

export default SkillSharePlatform;