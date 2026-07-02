"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Scan,
  X,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "./ui/card";

type Props = {
  onScan: (barcode: string) => void;
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
  boundingBox?: DOMRectReadOnly;
}

interface NativeBarcodeDetector {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
  _zbar?: false;
}

interface ZbarSymbol {
  typeName: string;
  decode: () => string;
}

interface ZbarDetector {
  _zbar: true;
  scanImageData: (imageData: ImageData) => Promise<ZbarSymbol[]>;
}

type Detector = NativeBarcodeDetector | ZbarDetector;

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector;
  getSupportedFormats: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
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
];

const ALLOWED_ZBAR_TYPES = [
  "EAN-13",
  "EAN-8",
  "UPC-A",
  "UPC-E",
  "CODE-128",
  "CODE-39",
  "CODE-93",
  "CODABAR",
  "I2/5",
];

export default function BarScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const scanningRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // ─── Init Detector ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined" && window.BarcodeDetector) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const formats = SUPPORTED_FORMATS.filter((f) =>
            supported.includes(f),
          );
          const instance = new window.BarcodeDetector({
            formats: formats.length ? formats : SUPPORTED_FORMATS,
          });
          detectorRef.current = instance;
          setScannerReady(true);
          return;
        } catch {
          console.warn("BarcodeDetector init failed, falling back to zbar");
        }
      }

      try {
        const { scanImageData } = await import("@undecaf/zbar-wasm");
        detectorRef.current = {
          _zbar: true,
          scanImageData: scanImageData as ZbarDetector["scanImageData"],
        };
        setScannerReady(true);
      } catch (err) {
        console.error("Failed to load zbar-wasm:", err);
      }
    };

    init();
  }, []);

  // ─── Detect Barcode ────────────────────────────────────────────────────────
  const detectBarcode = useCallback(
    async (source: ImageData | ImageBitmapSource): Promise<string | null> => {
      const detector = detectorRef.current;
      if (!detector) return null;

      try {
        if (!detector._zbar) {
          const bitmap =
            source instanceof ImageData
              ? await createImageBitmap(source)
              : await createImageBitmap(source as ImageBitmapSource);
          const results = await detector.detect(bitmap);
          bitmap.close();
          return results?.[0]?.rawValue ?? null;
        }

        let imageData: ImageData;

        if (source instanceof ImageData) {
          imageData = source;
        } else {
          const bitmap = await createImageBitmap(source as ImageBitmapSource);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        const results = await detector.scanImageData(imageData);
        const barcodeOnly = results?.find((r) =>
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
  const scanFrameRef = useRef<() => void>(() => {});

  useEffect(() => {
    scanFrameRef.current = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        !video ||
        !canvas ||
        video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        animFrameRef.current = requestAnimationFrame(() =>
          scanFrameRef.current(),
        );
        return;
      }

      if (scanningRef.current) {
        animFrameRef.current = requestAnimationFrame(() =>
          scanFrameRef.current(),
        );
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
      animFrameRef.current = requestAnimationFrame(() =>
        scanFrameRef.current(),
      );
    };
  }, [detectBarcode, onScan, stopCamera]);

  // ─── Open Scanner ──────────────────────────────────────────────────────────
  const openScanner = async () => {
    if (!scannerReady) {
      toast.error("Scanner not ready yet, please wait.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera is not supported on this device.");
      return;
    }

    setCameraError("");
    setScannerOpen(true);

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
        video.onerror = () => reject(new Error("Video error"));
      });

      await new Promise((r) => setTimeout(r, 300));

      scanningRef.current = false;
      animFrameRef.current = requestAnimationFrame(() =>
        scanFrameRef.current(),
      );
    } catch (err: unknown) {
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
          toast.error("Camera permission denied. Please allow camera access.");
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

  // ─── Process Image File ────────────────────────────────────────────────────
  const processImageFile = async (file: File, closeAfter = false) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const imageUrl = URL.createObjectURL(file);
    previewUrlRef.current = imageUrl;

    if (!closeAfter) {
      setPreview(imageUrl);
      setFileName(file.name);
      setLastResult(null);
    }

    setIsProcessing(true);

    try {
      const detector = detectorRef.current;
      if (!detector) throw new Error("No detector available");

      const img = new window.Image();
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      let barcode: string | null = null;

      if (!detector._zbar) {
        try {
          const results = await detector.detect(img);
          barcode = results?.[0]?.rawValue ?? null;
        } catch {
          const results = await detector.detect(file);
          barcode = results?.[0]?.rawValue ?? null;
        }
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const results = await detector.scanImageData(imageData);
        if (results && results.length > 0) {
          const barcodeOnly = results.find((r) =>
            ALLOWED_ZBAR_TYPES.includes(r.typeName),
          );
          barcode = barcodeOnly?.decode() ?? results[0]?.decode() ?? null;
        }
      }

      if (barcode) {
        setLastResult(barcode);
        if (closeAfter) closeScanner();
        onScan(barcode);
        toast.success(`Barcode detected: ${barcode}`);
        return;
      }

      throw new Error("No barcode found");
    } catch {
      toast.error("No barcode found. Make sure the code is clear.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageScan = async (
    e: React.ChangeEvent<HTMLInputElement>,
    closeAfter = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file, closeAfter);
    e.target.value = "";
  };

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) await processImageFile(file, false);
  };

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
    setFileName(null);
    setLastResult(null);
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full max-w-4xl gap-6">
        {/* ─── Scan Barcode Card ─── */}
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

        {/* ─── Upload Image Card ─── */}
        <Card className="w-full sm:max-w-sm md:max-w-xl rounded-xl border shadow-sm">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Upload size={20} />
                </div>
                <h2 className="text-lg font-semibold">Scan From Image</h2>
              </div>
              {preview && (
                <button
                  onClick={clearPreview}
                  className="text-xs text-muted-foreground hover:text-destructive transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Upload Zone */}
            <div
              onClick={() => !isProcessing && uploadInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative flex flex-col items-center justify-center
                min-h-[220px] rounded-xl border-2 border-dashed
                transition-all duration-200 overflow-hidden group
                ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-muted-foreground/30 bg-muted/40 hover:border-primary/50 hover:bg-muted/60"
                }
                ${isProcessing ? "cursor-wait" : "cursor-pointer"}
              `}
            >
              {preview ? (
                <>
                  {/* Preview Image */}
                  <div className="relative w-full h-[220px]">
                    <Image
                      src={preview}
                      alt="Barcode preview"
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>

                  {/* Loading Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-sm font-medium">Scanning...</p>
                      </div>
                    </div>
                  )}

                  {/* Success Badge */}
                  {lastResult && !isProcessing && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-green-500/90 backdrop-blur px-3 py-1 text-xs font-medium text-white shadow-lg">
                      <CheckCircle2 size={14} />
                      Detected
                    </div>
                  )}

                  {/* Hover overlay for re-upload */}
                  {!isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-black shadow-lg">
                        <Upload size={16} />
                        Change image
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div
                    className={`
                      rounded-full p-4 transition-all
                      ${
                        isDragging
                          ? "bg-primary/20 scale-110"
                          : "bg-muted-foreground/10 group-hover:bg-primary/10 group-hover:scale-105"
                      }
                    `}
                  >
                    <ImageIcon
                      className={`transition-colors ${
                        isDragging
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      }`}
                      size={28}
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold text-base">
                      {isDragging
                        ? "Drop image here"
                        : "Click or drag image here"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports EAN, UPC, Code 128, and more
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted-foreground/10 text-muted-foreground font-medium">
                      PNG
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted-foreground/10 text-muted-foreground font-medium">
                      JPG
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted-foreground/10 text-muted-foreground font-medium">
                      WEBP
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* File Info Footer */}
            {(fileName || lastResult) && (
              <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
                {fileName && (
                  <div className="flex items-center gap-2 text-xs">
                    <ImageIcon
                      size={12}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="truncate font-medium">{fileName}</span>
                  </div>
                )}
                {lastResult && (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2
                      size={12}
                      className="text-green-500 shrink-0"
                    />
                    <span className="font-mono text-green-600 dark:text-green-400 truncate">
                      {lastResult}
                    </span>
                  </div>
                )}
              </div>
            )}

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
            <div className="absolute inset-x-0 top-0 bg-black/60 h-[30%]" />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 h-[40%]" />
            <div className="absolute left-0 top-[30%] bottom-[40%] w-[calc(50%-140px)] bg-black/60" />
            <div className="absolute right-0 top-[30%] bottom-[40%] w-[calc(50%-140px)] bg-black/60" />
          </div>

          <p className="absolute top-[calc(30%+25%+24px)] left-1/2 -translate-x-1/2 text-white text-base font-medium mt-10">
            Place the code inside the frame
          </p>

          <button
            onClick={closeScanner}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/40 backdrop-blur p-2.5 text-white hover:bg-black/60"
          >
            <X size={22} />
          </button>

          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-black/30 text-white backdrop-blur hover:bg-black/50 transition"
            >
              <ImageIcon size={24} />
            </button>
            <p className="text-white/80 text-xs">Choose from gallery</p>
          </div>

          {cameraError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 rounded-lg bg-red-500/90 backdrop-blur px-4 py-2 text-sm text-white shadow-lg">
              {cameraError}
            </div>
          )}

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
