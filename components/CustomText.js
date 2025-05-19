import React from 'react';
import { Text } from 'react-native';

export default function CustomText(props) {
  return (
    <Text {...props} style={[{ fontFamily: 'Ownglyph_corncorn-Rg.ttf' }, props.style]}>
      {props.children}
    </Text>
  );
}
