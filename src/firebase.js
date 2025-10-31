// Firebase設定ファイル
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// あなたのFirebase設定情報
const firebaseConfig = {
  apiKey: "AIzaSyBmcqX-c76yKzlIoMw2o7KfUjgBDovzUBo",
  authDomain: "tasukeai-9db3e.firebaseapp.com",
  projectId: "tasukeai-9db3e",
  storageBucket: "tasukeai-9db3e.firebasestorage.app",
  messagingSenderId: "1026668151270",
  appId: "1:1026668151270:web:51a966d198b008aaecd627",
  measurementId: "G-8WP4HRBR5R"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Firestoreデータベースを取得
export const db = getFirestore(app);