// screens/SavedScreen.js
// 북마크탭에 북마크된 식당 목록을 표시하고, 북마크 추가/삭제 기능을 구현합니다.

import React from 'react';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as commonStyles } from '../styles/styles_native';

function SavedScreen({ bookmarks, toggleBookmark }) {
  const displayData = Object.values(bookmarks);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={displayData}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        ListHeaderComponent={() => (
          <View style={commonStyles.header}>
            <Text style={commonStyles.headerTitle}>북마크</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={commonStyles.cardContainer}>
            <View style={[commonStyles.card, commonStyles.bookmarked]}>
              <TouchableOpacity
                style={[commonStyles.starBtn, commonStyles.starActive]}
                onPress={() => toggleBookmark(item.id, item)}
              >
                <Ionicons name="star" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={commonStyles.restaurantTitle}>{item.place_name}</Text>
              <Text style={commonStyles.restaurantMeta}>
                {item.road_address_name || item.address_name}
              </Text>
              <Text style={commonStyles.restaurantMeta}>{item.category_name}</Text>
              {item.phone && (
                <Text style={commonStyles.restaurantMeta}>전화: {item.phone}</Text>
              )}
              <TouchableOpacity
                style={commonStyles.detailBtn}
                onPress={() => Linking.openURL(item.place_url)}
              >
                <Text style={commonStyles.detailText}>상세보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={commonStyles.resultMessage}>북마크한 식당이 없습니다.</Text>
        )}
      />
    </SafeAreaView>
  );
}

export default SavedScreen;
