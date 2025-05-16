import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, Linking, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const loadBookmarks = async () => {
  try {
    const data = await AsyncStorage.getItem('bookmarks');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveBookmarks = async (bookmarks) => {
  try {
    await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  } catch (e) {
    console.error('북마크 저장 실패:', e);
  }
};

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState({});
  const [recommend, setRecommend] = useState(null);

  useEffect(() => {
    loadBookmarks().then(setBookmarks);
  }, []);

  const toggleLike = (id) => {
    const updated = { ...bookmarks };
    if (!updated[id]) return;
    updated[id].like = updated[id].like === true ? undefined : true;
    updated[id].dislike = undefined;
    setBookmarks({ ...updated });
    saveBookmarks(updated);
  };

  const toggleDislike = (id) => {
    const updated = { ...bookmarks };
    if (!updated[id]) return;
    updated[id].dislike = updated[id].dislike === true ? undefined : true;
    updated[id].like = undefined;
    setBookmarks({ ...updated });
    saveBookmarks(updated);
  };

  const recommendRandom = (type = 'all') => {
    const arr = Object.values(bookmarks).filter(item => {
      if (type === 'like') return item.like;
      if (type === 'notDislike') return !item.dislike;
      return true;
    });
    if (arr.length === 0) {
      setRecommend(null);
      return;
    }
    const randomItem = arr[Math.floor(Math.random() * arr.length)];
    setRecommend(randomItem);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>북마크한 식당</Text>

      <View style={styles.buttonRow}>
        <Button title="전체에서 돌리기" onPress={() => recommendRandom('all')} />
        <Button title="좋아요만 돌리기" onPress={() => recommendRandom('like')} />
        <Button title="싫어요 제외하고 돌리기" onPress={() => recommendRandom('notDislike')} />
      </View>

      {recommend && (
        <View style={styles.recommendCard}>
          <Text style={styles.recommendText}>추천!</Text>
          <Text>{recommend.place_name}</Text>
          <Text>{recommend.road_address_name || recommend.address_name}</Text>
          <Text>{recommend.category_name}</Text>
        </View>
      )}

      {Object.values(bookmarks).length === 0 ? (
        <Text style={styles.empty}>북마크한 식당이 없습니다.</Text>
      ) : (
        Object.values(bookmarks).map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => toggleLike(item.id)}>
                <Text style={[styles.icon, { color: item.like ? '#E53935' : '#bbb' }]}>♥</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleDislike(item.id)}>
                <Text style={[styles.icon, { color: item.dislike ? '#1976D2' : '#bbb' }]}>✖</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{item.place_name}</Text>
            </View>
            <Text>{item.road_address_name || item.address_name}</Text>
            <Text>{item.category_name}</Text>
            {item.phone && <Text>전화: {item.phone}</Text>}
            <Button title="상세보기" onPress={() => Linking.openURL(item.place_url)} />
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  recommendCard: {
    padding: 12,
    backgroundColor: '#e0f7fa',
    marginBottom: 16,
    borderRadius: 6,
  },
  recommendText: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  empty: {
    color: '#888',
    paddingVertical: 24,
    textAlign: 'center'
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default BookmarkList;