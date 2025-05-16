import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const SignupModal = ({ open, onClose, onSignup }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }
    onSignup(form);
    onClose();
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
          <Text style={styles.title}>회원가입</Text>

          <TextInput
            style={styles.input}
            placeholder="이름"
            value={form.name}
            onChangeText={(text) => handleChange('name', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="이메일"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(text) => handleChange('email', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            secureTextEntry
            value={form.password}
            onChangeText={(text) => handleChange('password', text)}
          />

          <View style={styles.buttonGroup}>
            <Button title="회원가입" onPress={handleSubmit} />
            <Button title="닫기" onPress={onClose} color="#888" />
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
    textAlign: 'center',
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
  },
});

export default SignupModal;