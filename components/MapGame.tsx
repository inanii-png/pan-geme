'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import initialBakeries from '../data/bakeries.json';

// 地図の中心を現在地にスムーズに移動させるためのヘルパーコンポーネント
function MapRecenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

// 可愛いパンアイコンの定義（未訪問：ピンクのクロワッサン / 訪問済：キャラメル色の王冠）
const createCuteBakeryIcon = (isConquered: boolean) => {
  return L.divIcon({
    className: 'custom-bakery-icon',
    html: `<div style="
      background-color: ${isConquered ? '#f59e0b' : '#fb7185'};
      color: #fff;
      border: 3px solid #fff;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    ">${isConquered ? '👑' : '🥐'}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

// プレイヤーの現在地アイコン（冒険者・武将風）
const myPositionIcon = L.divIcon({
  className: 'custom-my-icon',
  html: `<div style="
    background-color: #3b82f6;
    color: #fff;
    border: 3px solid #fff;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
    animation: pulse 2s infinite;
  ">🛡️</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function MapGame() {
  const [conqueredIds, setConqueredIds] = useState<string[]>([]);
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
  const [isFirstLocate, setIsFirstLocate] = useState(false);

  // 初回読み込み時にlocalStorageから攻略データを復元
  useEffect(() => {
    const saved = localStorage.getItem('pan_conquered_ids');
    if (saved) {
      setConqueredIds(JSON.parse(saved));
    }
  }, []);

  // GPSによる現在地リアルタイム追跡
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watcher = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMyPosition([latitude, longitude]);
        },
        (error) => {
          console.error('位置情報が取得できませんでした', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watcher);
    }
  }, []);

  const toggleConquer = (id: string) => {
    const updated = conqueredIds.includes(id)
      ? conqueredIds.filter((item) => item !== id)
      : [...conqueredIds, id];

    setConqueredIds(updated);
    localStorage.setItem('pan_conquered_ids', JSON.stringify(updated));
  };

  const getCuteRank = (count: number) => {
    if (count === 0) return '🌱 パン見習い';
    if (count === 1) return '🥖 街のパン屋さん';
    return '🎂 伝説のパンマスター！';
  };

  // 初期表示の中心座標（現在地があれば現在地、なければ大阪中心）
  const defaultCenter: [number, number] = myPosition || [34.6937, 135.5023];

  return (
    <div className="relative w-full h-screen bg-[#fdf8f5] text-[#5c4033] font-sans">
      {/* 上部ステータスバー（カフェ看板風UI） */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm border-2 border-[#f3d5b5] px-6 py-3 rounded-full shadow-lg flex items-center gap-6">
        <div>
          <p className="text-[11px] text-[#d97706] font-bold tracking-wide">今のランク</p>
          <p className="text-base font-extrabold text-[#5c4033]">
            {getCuteRank(conqueredIds.length)}
          </p>
        </div>
        <div className="border-l-2 border-[#faedcd] pl-6">
          <p className="text-[11px] text-[#9c6644] font-bold">めぐったお店</p>
          <p className="text-lg font-extrabold text-[#fb7185]">
            {conqueredIds.length}{' '}
            <span className="text-xs text-[#5c4033] font-bold">/ {initialBakeries.length} 軒</span>
          </p>
        </div>
      </div>

      {/* 現在地へジャンプするボタン */}
      {myPosition && (
        <button
          onClick={() => setIsFirstLocate(!isFirstLocate)}
          className="absolute bottom-6 right-6 z-[1000] bg-white border-2 border-[#f3d5b5] text-[#5c4033] font-bold px-4 py-3 rounded-full shadow-lg hover:bg-[#faedcd] transition flex items-center gap-2 cursor-pointer"
        >
          📍 現在地に移動
        </button>
      )}

      {/* 地図本体（cute-bakery-mapクラスでパステルフィルター適用） */}
      <MapContainer
        center={defaultCenter}
        zoom={14}
        className="w-full h-full z-0 cute-bakery-map"
      >
        {/* 無料のOpenStreetMap標準タイル */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* 現在地にカメラを合わせるためのコンポーネント */}
        {myPosition && <MapRecenter center={myPosition} />}

        {/* プレイヤーの現在地マーカー */}
        {myPosition && (
          <Marker position={myPosition} icon={myPositionIcon}>
            <Popup>
              <div className="text-center font-bold text-slate-800">
                🛡️ あなたの現在地（本陣）
              </div>
            </Popup>
          </Marker>
        )}

        {/* パン屋さんたちの描画 */}
        {initialBakeries.map((bakery) => {
          const isConquered = conqueredIds.includes(bakery.id);

          return (
            <div key={bakery.id}>
              {/* 訪問済みの場合、周囲にハッピーパンエリア（点線の円）を描画 */}
              {isConquered && (
                <Circle
                  center={[bakery.lat, bakery.lng]}
                  radius={500}
                  pathOptions={{
                    color: '#f59e0b',
                    weight: 2,
                    dashArray: '6, 6',
                    fillColor: '#fcd34d',
                    fillOpacity: 0.3,
                  }}
                />
              )}

              {/* パン屋マーカー */}
              <Marker
                position={[bakery.lat, bakery.lng]}
                icon={createCuteBakeryIcon(isConquered)}
              >
                <Popup>
                  <div className="text-[#5c4033] p-1 min-w-[170px] text-center">
                    <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#faedcd] text-[#9c6644]">
                      {bakery.area}
                    </span>
                    <h3 className="font-extrabold text-base mt-1.5">{bakery.name}</h3>
                    <p className="text-xs text-[#7f5539] my-2">
                      {isConquered ? '✨ もう行ったよ！（制覇）' : 'まだ行ってないお店'}
                    </p>
                    <button
                      onClick={() => toggleConquer(bakery.id)}
                      className={`w-full py-2 px-3 rounded-full font-bold text-white text-xs shadow-sm transition cursor-pointer ${
                        isConquered
                          ? 'bg-[#d4a373] hover:bg-[#bc8a5f]'
                          : 'bg-[#fb7185] hover:bg-[#f43f5e]'
                      }`}
                    >
                      {isConquered ? '記録を取り消す' : '🥐 行ったよ！スタンプを押す'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}