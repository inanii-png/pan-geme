'use client';

import dynamic from 'next/dynamic';

// SSRを無効化してMapGameコンポーネントを読み込む
const MapGame = dynamic(() => import('../components/MapGame'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-xl">
      戦国パンマップを展開中...
    </div>
  ),
});

export default function Home() {
  return (
    <main>
      <MapGame />
    </main>
  );
}