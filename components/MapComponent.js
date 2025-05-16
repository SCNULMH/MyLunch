import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

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
  style,            // 외부에서 높이·너비 등을 받기 위해 추가
}) => {
  const { lat, lng } = mapCenter;

  const htmlContent = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=51120fdc1dd2ae273ccd643e7a301c77"></script>
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
    width: '100%',
    overflow: 'hidden',  // 자식(WebView)이 부모 밖으로 나가지 않도록
  },
  webview: {
    flex: 1,             // 부모 높이에 딱 맞춰 채우기
  },
});

export default MapComponent;
