// screens/ProfileScreen.js
// 프로필 화면을 구현하여 사용자 정보를 표시하고, 로그인/회원가입 버튼을 제공합니다.

import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function ProfileScreen({ user, openLogin, openSignup }) {
  return (
    <SafeAreaView style={styles.container}>
      {user ? (
        <>
          <Text style={styles.username}>{user.displayName}님</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => signOut(auth)}
          >
            <Text style={{ color: '#fff' }}>로그아웃</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={styles.authButton}
            onPress={openLogin}
          >
            <Text style={{ color: '#fff' }}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authButton}
            onPress={openSignup}
          >
            <Text style={{ color: '#fff' }}>회원가입</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  username: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  authButton: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
});
