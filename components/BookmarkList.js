// components/BookmarkList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Button, TouchableOpacity,
  Linking, ScrollView, StyleSheet, Alert
} from 'react-native';
import { auth } from '../firebase';
import { subscribeBookmarks, addBookmark, removeBookmark } from '../services/bookmark';

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState({});
  const [recommend, setRecommend] = useState(null);

  // Firebase에서 내 북마크 실시간 구독
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubscribe = subscribeBookmarks(user.uid, data => {
      setBookmarks(data || {});
    });
    return unsubscribe;
  }, []);

  // 좋아요(heart) 토글
  const toggleLike = useCallback(id => {
    const item = bookmarks[id];
    if (!item) return;
    const updated = {
      ...item,
      like: !item.like
    };
    addBookmark(auth.currentUser.uid, updated);
  }, [bookmarks]);

  // 전체 북마크 중 무작위 추천
  const recommendAll = () => {
    const arr = Object.values(bookmarks);
    if (arr.length === 0) {
      Alert.alert('북마크된 식당이 없습니다.');
      setRecommend(null);
      return;
    }
    setRecommend(arr[Math.floor(Math.random() * arr.length)]);
  };

  // 좋아요 표시된 것만 무작위 추천
  const recommendLiked = () => {
    const arr = Object.values(bookmarks).filter(item => item.like);
    if (arr.length === 0) {
      Alert.alert('좋아요한 식당이 없습니다.');
      setRecommend(null);
      return;
    }
    setRecommend(arr[Math.floor(Math.random() * arr.length)]);
  };

  // 전체 북마크 삭제
  const clearAll = () => {
    Alert.alert(
      '북마크 초기화',
      '모든 북마크를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Object.keys(bookmarks).forEach(id =>
              removeBookmark(auth.currentUser.uid, id)
            );
            setRecommend(null);
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>내 북마크</Text>

      <View style={styles.buttonRow}>
        <Button title="전체에서 추천"      onPress={recommendAll}  />
        <Button title="좋아요만 추천"      onPress={recommendLiked}/>
        <Button title="전체 초기화" color="#E53935" onPress={clearAll}/>
      </View>

      {recommend && (
        <View style={styles.recommendCard}>
          <Text style={styles.recommendText}>✨ 추천!</Text>
          <Text style={styles.title}>{recommend.place_name}</Text>
          <Text>{recommend.road_address_name || recommend.address_name}</Text>
          <Text>{recommend.category_name}</Text>
          {recommend.phone && <Text>☎ {recommend.phone}</Text>}
          <Button title="상세보기" onPress={() => Linking.openURL(recommend.place_url)} />
        </View>
      )}

      {Object.values(bookmarks).length === 0 ? (
        <Text style={styles.empty}>북마크한 식당이 없습니다.</Text>
      ) : (
        Object.values(bookmarks).map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => toggleLike(item.id)}>
                <Text style={[styles.icon, { color: item.like ? '#E53935' : '#bbb' }]}>
                  ♥
                </Text>
              </TouchableOpacity>
              <Text style={styles.title}>{item.place_name}</Text>
            </View>
            <Text>{item.road_address_name || item.address_name}</Text>
            <Text>{item.category_name}</Text>
            {item.phone && <Text>☎ {item.phone}</Text>}
            <Button title="상세보기" onPress={() => Linking.openURL(item.place_url)} />
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:     { padding: 16 },
  heading:       { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  buttonRow:     { flexDirection: 'column', gap: 10, marginBottom: 16 },
  recommendCard: { padding: 12, backgroundColor: '#e0f7fa', marginBottom: 16, borderRadius: 6 },
  recommendText: { fontWeight: 'bold', marginBottom: 6 },
  empty:         { color: '#888', paddingVertical: 24, textAlign: 'center' },
  card:          { padding: 16, marginBottom: 12, borderRadius: 8, backgroundColor: '#fff', elevation: 2 },
  row:           { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  icon:          { fontSize: 18 },
  title:         { fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});

export default BookmarkList;
