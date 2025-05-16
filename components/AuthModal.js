import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

const AuthModal = ({ mode, open, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = async () => {
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: nickname });
        Alert.alert('회원가입 성공! 🎉');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('로그인 성공! 😊');
      }
      onClose();
    } catch (error) {
      let message = '';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = '이미 가입된 이메일입니다.'; break;
        case 'auth/user-not-found':
          message = '가입되지 않은 이메일입니다.'; break;
        case 'auth/wrong-password':
          message = '비밀번호가 일치하지 않습니다.'; break;
        case 'auth/weak-password':
          message = '비밀번호는 6자 이상이어야 합니다.'; break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          message = '이메일 또는 비밀번호가 올바르지 않습니다.'; break;
        default:
          message = `오류: ${error.message}`;
      }
      Alert.alert('오류', message);
    }
  };

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{mode === 'login' ? '로그인' : '회원가입'}</Text>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="닉네임"
              value={nickname}
              onChangeText={setNickname}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="이메일"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.buttonGroup}>
            <Button title={mode === 'login' ? '로그인' : '가입하기'} onPress={handleSubmit} />
            <Button title="취소" onPress={onClose} color="#888" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    width: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 10,
  }
});

export default AuthModal;