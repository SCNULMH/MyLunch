// assets/utils/calcDistance.js
// 앱에서는 사용자(내위치)와 식당 위치 간 거리를 계산하여 화면에 “○○m” 형태로 표시하거나, 
// 북마크 모드를 켰을 때 “반경 내 북마크 필터링” 용도로 사용됩니다.



/**
 * 위도(lat1, lon1)에서 위도(lat2, lon2)까지의 거리를 미터(m) 단위로 계산해 반환
 * @param {number} lat1 시작점 위도
 * @param {number} lon1 시작점 경도
 * @param {number} lat2 도착점 위도
 * @param {number} lon2 도착점 경도
 * @returns {number} 두 지점 간의 거리(m)
 */
export function calcDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000; // 지구 반지름 (m)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
