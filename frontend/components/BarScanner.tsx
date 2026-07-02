"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Scan, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

type Props = {
  onScan: (barcode: string) => void;
};

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

const SUPPORTED_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "itf",
  // "qr_code",
  // "pdf417",
  // "data_matrix",
  // "aztec",
];

export default function BarScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const scanningRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // ─── Init Detector ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if ("BarcodeDetector" in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const formats = SUPPORTED_FORMATS.filter((f) =>
            supported.includes(f),
          );
          detectorRef.current = new window.BarcodeDetector({
            formats: formats.length ? formats : SUPPORTED_FORMATS,
          });
          setScannerReady(true);
          return;
        } catch {
          console.warn("BarcodeDetector init failed, falling back to zbar");
        }
      }

      try {
        const { scanImageData } = await import("@undecaf/zbar-wasm");
        detectorRef.current = { _zbar: true, scanImageData };
        setScannerReady(true);
      } catch (err) {
        console.error("Failed to load zbar-wasm:", err);
      }
    };

    init();
  }, []);

  // ─── Detect Barcode ────────────────────────────────────────────────────────
  // const detectBarcode = useCallback(
  //   async (imageData: ImageData): Promise<string | null> => {
  //     const detector = detectorRef.current;
  //     if (!detector) return null;

  //     try {
  //       if (!detector._zbar) {
  //         const canvas = document.createElement("canvas");
  //         canvas.width = imageData.width;
  //         canvas.height = imageData.height;
  //         const ctx = canvas.getContext("2d")!;
  //         ctx.putImageData(imageData, 0, 0);
  //         const bitmap = await createImageBitmap(canvas);
  //         const results = await detector.detect(bitmap);
  //         bitmap.close();
  //         return results?.[0]?.rawValue ?? null;
  //       }

  //       const results = await detector.scanImageData(imageData);
  //       return results?.[0]?.decode() ?? null;
  //     } catch {
  //       return null;
  //     }
  //   },
  //   [],
  // );

  // ─── Detect Barcode ────────────────────────────────────────────────────────
  const detectBarcode = useCallback(
    async (imageData: ImageData): Promise<string | null> => {
      const detector = detectorRef.current;
      if (!detector) return null;

      // Allowed zbar barcode type names (1D only)
      const ALLOWED_ZBAR_TYPES = [
        "EAN-13",
        "EAN-8",
        "UPC-A",
        "UPC-E",
        "CODE-128",
        "CODE-39",
        "CODE-93",
        "CODABAR",
        "I2/5", // Interleaved 2 of 5 (ITF)
      ];

      try {
        // Native BarcodeDetector (already limited by formats config)
        if (!detector._zbar) {
          const canvas = document.createElement("canvas");
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          const ctx = canvas.getContext("2d")!;
          ctx.putImageData(imageData, 0, 0);
          const bitmap = await createImageBitmap(canvas);
          const results = await detector.detect(bitmap);
          bitmap.close();
          return results?.[0]?.rawValue ?? null;
        }

        // zbar-wasm fallback — filter out QR / DataMatrix
        const results = await detector.scanImageData(imageData);
        const barcodeOnly = results?.find((r: any) =>
          ALLOWED_ZBAR_TYPES.includes(r.typeName),
        );
        return barcodeOnly?.decode() ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ─── Stop Camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    scanningRef.current = false;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const closeScanner = useCallback(() => {
    stopCamera();
    setScannerOpen(false);
    setCameraError("");
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [stopCamera]);

  // ─── Scan Loop ─────────────────────────────────────────────────────────────
  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
    ) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (scanningRef.current) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    scanningRef.current = true;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const barcode = await detectBarcode(imageData);

      if (barcode) {
        stopCamera();
        setScannerOpen(false);
        onScan(barcode);
        return;
      }
    }

    scanningRef.current = false;
    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [detectBarcode, onScan, stopCamera]);

  // ─── Open Scanner (Full-Screen) ────────────────────────────────────────────
  // ─── Open Scanner (Full-Screen) ────────────────────────────────────────────
  const openScanner = async () => {
    if (!scannerReady) {
      toast.error("Scanner not ready yet, please wait.");
      return;
    }

    // Check if browser supports camera API
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera is not supported on this device.");
      return;
    }

    setCameraError("");
    setScannerOpen(true);

    // Wait for modal DOM to mount
    await new Promise((r) => setTimeout(r, 50));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
      });

      await new Promise((r) => setTimeout(r, 300));

      scanningRef.current = false;
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      //Close scanner and show clean toast
      setScannerOpen(false);
      stopCamera();

      const errorName = (err as { name?: string })?.name;

      switch (errorName) {
        case "NotFoundError":
        case "DevicesNotFoundError":
          toast.error("No camera found on this device.");
          break;

        case "NotAllowedError":
        case "PermissionDeniedError":
          toast.error(
            "Camera permission denied. Please allow camera access in your browser settings.",
          );
          break;

        case "NotReadableError":
        case "TrackStartError":
          toast.error("Camera is already in use by another application.");
          break;

        case "OverconstrainedError":
        case "ConstraintNotSatisfiedError":
          toast.error("Camera does not meet the required settings.");
          break;

        case "SecurityError":
          toast.error("Camera access is blocked due to security settings.");
          break;

        case "AbortError":
          toast.error("Camera access was aborted.");
          break;

        default:
          toast.error("Unable to access camera. Please try again.");
          break;
      }
    }
  };

  // ─── Image Scan (from gallery inside scanner OR upload card) ──────────────
  const handleImageScan = async (
    e: React.ChangeEvent<HTMLInputElement>,
    closeAfter = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const imageUrl = URL.createObjectURL(file);
    previewUrlRef.current = imageUrl;

    if (!closeAfter) setPreview(imageUrl);

    try {
      const img = new Image();
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas error");

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const barcode = await detectBarcode(imageData);

      if (barcode) {
        if (closeAfter) closeScanner();
        onScan(barcode);
        e.target.value = "";
        return;
      }

      throw new Error("No barcode found");
    } catch {
      toast.error("No barcode found. Make sure the code is clear.");
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full max-w-4xl gap-6">
        {/* Scan Barcode Card (Trigger) */}
        <Card
          className="cursor-pointer w-full sm:max-w-sm md:max-w-xl rounded-xl border shadow-sm transition hover:border-primary hover:shadow-md"
          onClick={openScanner}
        >
          <CardContent className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Scan size={20} />
              </div>
              <h2 className="text-lg font-semibold">Scan Barcode</h2>
            </div>

            <div className="flex h-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40">
              <p className="font-medium">
                {scannerReady
                  ? "Tap to open scanner"
                  : "Initializing scanner..."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Image Card */}
        <Card
          className="cursor-pointer w-full sm:max-w-sm md:max-w-xl rounded-xl border shadow-sm transition hover:border-primary hover:shadow-md"
          onClick={() => uploadInputRef.current?.click()}
        >
          <CardContent className="px-6 py-4">
            <h2 className="text-lg font-semibold mb-4">Scan From Image</h2>

            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <p className="font-medium">Click to choose an image</p>
                  <p className="text-sm text-muted-foreground">
                    Supports EAN, UPC, QR Code and more
                  </p>
                </div>
              )}
            </div>

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageScan(e, false)}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── FULL-SCREEN SCANNER MODAL ─────────────────────────────────────── */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Video Layer */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Dark overlay with cutout window */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top mask */}
            <div className="absolute inset-x-0 top-0 bg-black/60 h-[30%]" />
            {/* Bottom mask */}
            <div className="absolute inset-x-0 bottom-0 bg-black/60 h-[40%]" />
            {/* Left mask */}
            <div className="absolute left-0 top-[30%] bottom-[40%] w-[calc(50%-140px)] bg-black/60" />
            {/* Right mask */}
            <div className="absolute right-0 top-[30%] bottom-[40%] w-[calc(50%-140px)] bg-black/60" />
          </div>

          {/* Scan Frame (centered window) */}

          {/* Instruction text */}
          <p className="absolute top-[calc(30%+25%+24px)] left-1/2 -translate-x-1/2 text-white text-base font-medium mt-10">
            Place the code inside the frame
          </p>

          {/* Close button */}
          <button
            onClick={closeScanner}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/40 backdrop-blur p-2.5 text-white hover:bg-black/60"
          >
            <X size={22} />
          </button>

          {/* Bottom Controls */}
          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
            {/* Gallery button */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-black/30 text-white backdrop-blur hover:bg-black/50 transition"
            >
              <ImageIcon size={24} />
            </button>
            <p className="text-white/80 text-xs">Choose from gallery</p>
          </div>

          {/* Error toast inside scanner */}
          {cameraError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 rounded-lg bg-red-500/90 backdrop-blur px-4 py-2 text-sm text-white shadow-lg">
              {cameraError}
            </div>
          )}

          {/* Hidden gallery input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageScan(e, true)}
          />
        </div>
      )}
    </>
  );
}
