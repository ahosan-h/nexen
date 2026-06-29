"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";
import { toast } from "sonner";

type Props = {
  onScan: (barcode: string) => void;
};

export default function BarScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const hints = new Map();

    // Support ONLY barcodes
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
    ]);

    readerRef.current = new BrowserMultiFormatReader(hints);

    return () => {
      readerRef.current?.reset();

      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const startCamera = async () => {
    setCameraError("");

    if (!readerRef.current) return;

    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (devices.length === 0) {
        setCameraError("No camera found.");
        return;
      }

      setCameraStarted(true);

      readerRef.current.decodeFromVideoDevice(
        devices[0].deviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            onScan(result.getText());

            readerRef.current?.reset();
            setCameraStarted(false);
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error(error);
          }
        },
      );
    } catch {
      setCameraError("No camera found.");
    }
  };

  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !readerRef.current) return;

    onScan("");

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    try {
      const img = new Image();
      img.src = imageUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const result = await readerRef.current.decodeFromImageElement(img);

      onScan(result.getText());

      e.target.value = "";
    } catch {
      toast.error(
        "No supported barcode found.\n\nOnly EAN, UPC, Code128, Code39, Codabar and ITF are supported.",
      );
    }
  };

  return (
    <div className="flex flex-col max-w-xl gap-6">
      {/* Camera */}
      <div className="border rounded-lg p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Scan Using Camera</h2>

        {!cameraStarted && (
          <button
            type="button"
            onClick={startCamera}
            className="px-2 py-1 rounded bg-blue-600 text-white"
          >
            Start Camera
          </button>
        )}

        {cameraError && <p className="mt-4 text-red-500">{cameraError}</p>}

        {cameraStarted && (
          <video ref={videoRef} className="mt-4 w-full rounded border" />
        )}
      </div>

      {/* Upload */}
      <div className="border rounded-lg p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Scan From Image</h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageScan}
          className="block w-full border rounded p-2"
        />

        {preview && (
          <div className="mt-4 flex justify-center">
            <img
              src={preview}
              alt="Preview"
              className="w-64 h-64 object-contain rounded border bg-white"
            />
          </div>
        )}

        <p className="mt-3 text-sm text-gray-500">
          Only barcode images are supported.
        </p>
      </div>
    </div>
  );
}
