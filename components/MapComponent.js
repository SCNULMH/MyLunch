// 이 컴포넌트는 카카오 맵을 표시하고, 마커와 원을 추가하는 기능을 포함합니다.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';  // Expo Managed: 환경변수는 expoConfig.extra에 주입됨

const RED_MARKER_IMG =
  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
const BLUE_MARKER_IMG =
  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
const SPOT_MARKER_IMG =
  'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png';

const MapComponent = ({
  mapCenter,
  restaurants,
  radius,
  myPosition,
  bookmarks,
  style,
}) => {
  const { lat, lng } = mapCenter;
  // EAS/EAS Update 환경에서는 expoConfig를, Expo Go(개발 중)에서는 manifest를 사용
  const extra = Constants.expoConfig?.extra;
  // ?? Constants.manifest?.extra;
  // if (!extra) {
  //   console.warn('⚠️ Expo Constants extra is null! Check app.config.js and .env settings.');
  // }
  const jsKey = extra?.KAKAO_JS_KEY;

  const htmlContent = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&libraries=services"></script>
    <style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
    </head><body><div id="map"></div><script>
      const map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(${lat}, ${lng}),
        level: 4
      });
      ${myPosition?.lat && myPosition?.lng ? `
        const myMarker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${myPosition.lat}, ${myPosition.lng}),
          image: new kakao.maps.MarkerImage(
            '${SPOT_MARKER_IMG}',
            new kakao.maps.Size(24,35),
            { offset: new kakao.maps.Point(12,35) }
          )
        });
        myMarker.setMap(map);
        new kakao.maps.InfoWindow({
          content: '<div style="padding:5px;color:#d32f2f;">내 위치</div>'
        }).open(map, myMarker);
      ` : ''}
      ${restaurants
        .map(
          (r) => `
        const marker_${r.id} = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${r.y}, ${r.x}),
          title: '${r.place_name}',
          image: new kakao.maps.MarkerImage(
            '${bookmarks[r.id] ? BLUE_MARKER_IMG : RED_MARKER_IMG}',
            new kakao.maps.Size(64,69),
            { offset: new kakao.maps.Point(27,69) }
          )
        });
        marker_${r.id}.setMap(map);
      `
        )
        .join('')}
      new kakao.maps.Circle({
        map: map,
        center: new kakao.maps.LatLng(${lat}, ${lng}),
        radius: ${radius},
        strokeWeight: 2,
        strokeColor: '#75B8FA',
        strokeOpacity: 0.7,
        fillColor: '#CFE7FF',
        fillOpacity: 0.5
      });
    </script></body></html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

export default MapComponent;
