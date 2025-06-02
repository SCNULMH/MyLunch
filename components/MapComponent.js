// components/MapComponent.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants'; // expoConfig.extra 사용

const RED_MARKER_IMG =
  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
const BLUE_MARKER_IMG =
  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
const SPOT_MARKER_IMG =
  'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png';

export default function MapComponent({
  mapCenter,    // { lat: number, lng: number }
  restaurants,  // Array<{ id, place_name, x, y, ... }>
  radius,       // number
  myPosition,   // { lat: number, lng: number } | null
  bookmarks,    // { [id]: true } 형태의 객체
  zoomLevel,    // number (1~14 정도의 정수, 낮을수록 확대)
  style,
}) {
  const { lat, lng } = mapCenter || {};
  const extra = Constants.expoConfig?.extra;
  const jsKey = extra?.KAKAO_JS_KEY || '';

  // HTML을 mapCenter, restaurants, myPosition, bookmarks, radius, zoomLevel이 바뀔 때마다 다시 생성
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&libraries=services"></script>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // 지도 생성 (zoomLevel이 없으면 기본 4)
          const map = new kakao.maps.Map(
            document.getElementById('map'),
            {
              center: new kakao.maps.LatLng(${lat || 37.5665}, ${lng || 126.9780}),
              level: ${zoomLevel != null ? zoomLevel : 4}
            }
          );

          // 내 위치 마커
          ${
            myPosition && myPosition.lat != null && myPosition.lng != null
              ? `
          const myMarker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(${myPosition.lat}, ${myPosition.lng}),
            image: new kakao.maps.MarkerImage(
              '${SPOT_MARKER_IMG}',
              new kakao.maps.Size(24, 35),
              { offset: new kakao.maps.Point(12, 35) }
            )
          });
          myMarker.setMap(map);
          new kakao.maps.InfoWindow({
            content: '<div style="padding:5px;color:#d32f2f;">내 위치</div>'
          }).open(map, myMarker);
          `
              : ''
          }

          // 식당/북마크용 마커
          ${
            Array.isArray(restaurants) && restaurants.length
              ? restaurants
                  .map((r) => {
                    // 북마크 여부에 따라 색상 분기
                    const markerColor = bookmarks && bookmarks[r.id] ? BLUE_MARKER_IMG : RED_MARKER_IMG;
                    return `
            const marker_${r.id} = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(${parseFloat(r.y)}, ${parseFloat(r.x)}),
              title: '${(r.place_name || '').replace(/'/g, "\\'")}',
              image: new kakao.maps.MarkerImage(
                '${markerColor}',
                new kakao.maps.Size(64, 69),
                { offset: new kakao.maps.Point(27, 69) }
              )
            });
            marker_${r.id}.setMap(map);
            `;
                  })
                  .join('')
              : ''
          }

          // 반경(Circle)
          ${
            typeof radius === 'number'
              ? `
          new kakao.maps.Circle({
            map: map,
            center: new kakao.maps.LatLng(${lat || 37.5665}, ${lng || 126.9780}),
            radius: ${radius},
            strokeWeight: 2,
            strokeColor: '#75B8FA',
            strokeOpacity: 0.7,
            fillColor: '#CFE7FF',
            fillOpacity: 0.5
          });
          `
              : ''
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        // mapCenter(lat/lng), restaurants.length, radius, myPosition, zoomLevel이 바뀔 때마다 key가 바뀌어 재로드
        key={`${lat}-${lng}-${restaurants?.length || 0}-${radius}-${myPosition?.lat || ''}-${zoomLevel}`}
      />
    </View>
  );
}

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
