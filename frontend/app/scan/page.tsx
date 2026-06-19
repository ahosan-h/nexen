"use client";

import dynamic from "next/dynamic";

const BarScanner = dynamic(() => import("@/components/BarScanner"), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <BarScanner />
    </main>
  );
}
