import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { addBookmark, removeBookmark, subscribeBookmarks } from '../services/bookmark';
import { auth } from '../firebase';

const RestaurantList = ({ restaurants, onSelect }) => {
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) {
        setBookmarks({});
        return;
      }

      const unsubscribeBookmark = subscribeBookmarks(user.uid, (data) => {
        setBookmarks({ ...data });
      });

      return unsubscribeBookmark;
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const toggleBookmark = async (id, item) => {
    const user = auth.currentUser;
    if (!user) return;

    const bookmarkId = String(id);
    try {
      if (bookmarks[bookmarkId]) {
        await removeBookmark(user.uid, bookmarkId);
      } else {
        await addBookmark(user.uid, { ...item, id: bookmarkId });
      }
    } catch (error) {
      console.error("북마크 토글 실패:", error);
    }
  };

  const renderItem = ({ item }) => {
    const bookmarkId = String(item.id);
    const isBookmarked = !!bookmarks[bookmarkId];

    return (
      <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
        <TouchableOpacity
          style={[styles.bookmarkBtn, isBookmarked && styles.bookmarked]}
          onPress={(e) => {
            e.stopPropagation?.();
            toggleBookmark(item.id, item);
          }}
        >
          <Text style={styles.star}>★</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{item.place_name}</Text>
        <Text style={styles.meta}>{item.road_address_name || item.address_name}</Text>
        <Text style={styles.meta}>{item.category_name}</Text>
        {item.phone && <Text style={styles.meta}>전화: {item.phone}</Text>}
        {item.distance && <Text style={styles.meta}>거리: {item.distance}m</Text>}
        <TouchableOpacity
          onPress={() => Linking.openURL(item.place_url)}
          style={styles.detailBtn}
        >
          <Text style={styles.detailText}>상세보기</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (restaurants.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={restaurants}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    marginHorizontal: 10,
  },
  bookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookmarked: {
    backgroundColor: '#FFD600',
  },
  star: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  detailBtn: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center'
  },
  emptyText: {
    color: '#888',
  },
});

export default RestaurantList;