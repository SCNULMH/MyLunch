import { db } from '../firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';

// 북마크 추가/수정
export const addBookmark = async (userId, bookmarkData) => {
  const docId = String(bookmarkData.id); // ID 강제 문자열 변환
  await setDoc(doc(db, 'users', userId, 'bookmarks', docId), bookmarkData, { merge: true });
};

// 북마크 삭제
export const removeBookmark = async (userId, bookmarkId) => {
  const docId = String(bookmarkId); // ID 강제 문자열 변환
  await deleteDoc(doc(db, 'users', userId, 'bookmarks', docId));
};

// 북마크 실시간 구독 (에러 핸들링 추가)
export const subscribeBookmarks = (userId, callback) => {
  return onSnapshot(
    collection(db, 'users', userId, 'bookmarks'),
    (snapshot) => {
      const bookmarks = {};
      snapshot.forEach(doc => {
        bookmarks[doc.id] = doc.data();
      });
      callback(bookmarks);
    },
    (error) => { // 에러 핸들링 추가
      console.error("북마크 구독 오류:", error);
    }
  );
};
