import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const RED_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
const BLUE_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
const SPOT_MARKER_IMG = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png';

const MapComponent = ({ mapCenter, restaurants, radius, myPosition, bookmarks }) => {
  const { lat, lng } = mapCenter;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=51120fdc1dd2ae273ccd643e7a301c77"></script>
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
          const map = new kakao.maps.Map(document.getElementById('map'), {
            center: new kakao.maps.LatLng(${lat}, ${lng}),
            level: 4
          });

          // 내 위치 마커
          ${myPosition?.lat && myPosition?.lng ? `
            const myMarker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(${myPosition.lat}, ${myPosition.lng}),
              image: new kakao.maps.MarkerImage('${SPOT_MARKER_IMG}', new kakao.maps.Size(24, 35), { offset: new kakao.maps.Point(12, 35) }),
              title: '내 위치'
            });
            myMarker.setMap(map);
            new kakao.maps.InfoWindow({
              content: '<div style="padding:5px; color:#d32f2f;">내 위치</div>'
            }).open(map, myMarker);
          ` : ''}

          // 식당 마커 추가
          ${restaurants.map(restaurant => `
            const marker_${restaurant.id} = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(${restaurant.y}, ${restaurant.x}),
              title: '${restaurant.place_name}',
              image: new kakao.maps.MarkerImage(
                '${bookmarks[restaurant.id] ? BLUE_MARKER_IMG : RED_MARKER_IMG}',
                new kakao.maps.Size(64, 69),
                { offset: new kakao.maps.Point(27, 69) }
              )
            });
            marker_${restaurant.id}.setMap(map);
          `).join('\n')}

          // 반경 원 추가
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
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: '100%',
    marginVertical: 10,
  },
});

export default MapComponent;
