// components/QrScanner.jsx
"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function BarScanner() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false,
    );

    const onScanSuccess = (decodedText: string, decodedResult: string) => {
      console.log("Code matched =", decodedText, decodedResult);

      // Optional: stop scanning after successful scan
      scanner.clear().catch(console.error);
    };

    const onScanFailure = (error) => {
      // Usually ignore scan failures
      console.warn("Code scan error =", error);
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  return <div id="reader" />;
}
