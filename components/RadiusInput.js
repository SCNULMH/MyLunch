import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const RadiusInput = ({ setRadius }) => {
  const [inputValue, setInputValue] = useState('2000'); // 기본값 문자열로

  const handleSubmit = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setRadius(value);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={inputValue}
        onChangeText={setInputValue}
        placeholder="반경 (m)"
      />
      <Button title="설정" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 4
  }
});

export default RadiusInput;