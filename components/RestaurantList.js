import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { addBookmark, removeBookmark, subscribeBookmarks } from '../services/bookmark';
import { auth } from '../firebase';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = (width * 0.9) / 2 - CARD_MARGIN * 2;

const RestaurantList = ({ restaurants, onSelect }) => {
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    // Firebase Auth → 북마크 구독
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) {
        setBookmarks({});
        return;
      }
      const unsubscribeBm = subscribeBookmarks(user.uid, data => {
        setBookmarks({ ...data });
      });
      return unsubscribeBm;
    });
    return () => unsubscribeAuth();
  }, []);

  const toggleBookmark = async (id, item) => {
    const user = auth.currentUser;
    if (!user) return;
    const bid = String(id);
    try {
      if (bookmarks[bid]) {
        await removeBookmark(user.uid, bid);
      } else {
        await addBookmark(user.uid, { ...item, id: bid });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }) => {
    const bid = String(item.id);
    const isBookmarked = !!bookmarks[bid];

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.card, isBookmarked && styles.bookmarked]}
          onPress={() => onSelect(item)}
        >
          {/* 북마크 ★ 버튼 */}
          <TouchableOpacity
            style={[styles.starBtn, isBookmarked && styles.starActive]}
            onPress={e => {
              e.stopPropagation?.();
              toggleBookmark(item.id, item);
            }}
          >
            <Text style={[styles.star, isBookmarked && { color: '#fff' }]}>★</Text>
          </TouchableOpacity>

          {/* 가게 이름 */}
          <Text style={styles.title}>{item.place_name}</Text>

          {/* 메타 정보 */}
          <Text style={styles.meta}>{item.road_address_name || item.address_name}</Text>
          <Text style={styles.meta}>{item.category_name}</Text>
          {item.phone && <Text style={styles.meta}>전화: {item.phone}</Text>}
          {item.distance != null && <Text style={styles.meta}>거리: {item.distance}m</Text>}

          {/* 상세보기 */}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => Linking.openURL(item.place_url)}
          >
            <Text style={styles.detailText}>상세보기</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
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
      keyExtractor={item => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: CARD_MARGIN,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    margin: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 22,
    // iOS 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android
    elevation: 4,
    position: 'relative',
  },
  bookmarked: {
    borderWidth: 2,
    borderColor: '#FFD600', // 노란 테두리 유지
  },
  starBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  starActive: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },
  star: {
    fontSize: 16,
    color: '#222',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  meta: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 4,
  },
  detailBtn: {
    marginTop: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignSelf: 'flex-end',
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});

export default RestaurantList;
