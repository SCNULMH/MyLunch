// App.js

import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import ExploreScreen from './screens/ExploreScreen';
import SavedScreen from './screens/SavedScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthModal from './components/AuthModal';
import {
  subscribeBookmarks,
  addBookmark,
  removeBookmark
} from './services/bookmark';
import { styles as commonStyles } from './styles/styles_native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };
  const openSignup = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };
  const closeAuth = () => setAuthModalOpen(false);

  // 1) Auth 상태 구독 (로그인/로그아웃 감지)
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
    });
  }, []);

  // 2) 북마크 구독 (사용자 uid가 변경되면 재구독)
  useEffect(() => {
    if (!user) {
      setBookmarks({});
      return;
    }
    const unsubscribe = subscribeBookmarks(user.uid, data => {
      setBookmarks(data || {});
    });
    return unsubscribe;
  }, [user]);

  // 3) 즐겨찾기 토글 함수
  const toggleBookmark = useCallback(
    async (id, item) => {
      if (!user) {
        Alert.alert('로그인이 필요합니다.');
        return;
      }
      if (bookmarks[id]) {
        await removeBookmark(user.uid, id);
      } else {
        // Firestore에 id는 문자열로 저장하는 것을 권장
        await addBookmark(user.uid, { ...item, id: String(item.id) });
      }
    },
    [user, bookmarks]
  );

  // ExploreScreen 전용 상태값
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [restaurants, setRestaurants] = useState([]);
  const [count, setCount] = useState(5);
  const [excludedCategory, setExcludedCategory] = useState('');
  const [includedCategory, setIncludedCategory] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [noMessage, setNoMessage] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: 37.5665,
    lng: 126.9780
  });

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              if (route.name === 'Explore')
                return <Ionicons name="search" size={size} color={color} />;
              if (route.name === 'Saved')
                return <Ionicons name="bookmark" size={size} color={color} />;
              if (route.name === 'Profile')
                return <Ionicons name="person" size={size} color={color} />;
            },
            tabBarActiveTintColor: '#388E3C',
            tabBarInactiveTintColor: '#888',
            headerShown: false
          })}
        >
          <Tab.Screen name="Explore">
            {() => (
              <ExploreScreen
                user={user}
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                openLogin={openLogin}
                openSignup={openSignup}
                mapCenter={mapCenter}
                setMapCenter={setMapCenter}
                myPosition={myPosition}
                setMyPosition={setMyPosition}
                restaurants={restaurants}
                setRestaurants={setRestaurants}
                radius={radius}
                setRadius={setRadius}
                count={count}
                setCount={setCount}
                excludedCategory={excludedCategory}
                setExcludedCategory={setExcludedCategory}
                includedCategory={includedCategory}
                setIncludedCategory={setIncludedCategory}
                searchResults={searchResults}
                setSearchResults={setSearchResults}
                noMessage={noMessage}
                setNoMessage={setNoMessage}
                showBookmarks={showBookmarks}
                setShowBookmarks={setShowBookmarks}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Saved">
            {() => (
              <SavedScreen
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {() => (
              <ProfileScreen
                user={user}
                openLogin={openLogin}
                openSignup={openSignup}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      <AuthModal mode={authMode} open={authModalOpen} onClose={closeAuth} />
    </>
  );
}
