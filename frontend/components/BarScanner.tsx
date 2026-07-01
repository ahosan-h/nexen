"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";
import { toast } from "sonner";
import { Scan } from "lucide-react";
import { Card, CardContent } from "./ui/card";

type Props = {
  onScan: (barcode: string) => void;
};

export default function BarScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col items-center justify-center w-full max-w-4xl gap-6">
      {/* Camera */}
      <Card
        onClick={!cameraStarted ? startCamera : undefined}
        className={`rounded-xl w-full sm:max-w-sm md:max-w-xl border shadow-sm transition cursor-pointer ${
          !cameraStarted
            ? "hover:border-primary hover:shadow-md"
            : "cursor-default"
        }`}
      >
        <CardContent className="px-6 py-2 ">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Scan size={20} />
            </div>

            <h2 className="text-lg font-semibold m-b">Scan Barcode</h2>
          </div>

          {!cameraStarted ? (
            <div className="flex h-10 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 mb-2 bg-muted/40">
              <div className="text-center">
                <p className="font-medium">Tap to start scanning</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <video
                ref={videoRef}
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          {cameraError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {cameraError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload */}
      <Card
        className="cursor-pointer w-full sm:max-w-sm md:max-w-xl rounded-xl border shadow-sm transition hover:border-primary hover:shadow-md"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="px-6 py-2">
          <h2 className="text-lg font-semibold mb-4">Scan From Image</h2>

          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full rounded-lg object-contain"
              />
            ) : (
              <div className="text-center">
                <p className="font-medium">Click to choose an image</p>
                <p className="text-sm text-muted-foreground">
                  Supports barcode images only.
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageScan}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
}
