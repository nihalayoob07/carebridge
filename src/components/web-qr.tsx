// Web-only QR scanning. Safari can't detect barcodes through expo-camera, so we read video frames
// ourselves and decode them with jsQR. Also decodes a captured photo for the "Take Photo" fallback.
import jsQR from "jsqr";
import { createElement, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { C } from "@/lib/theme";
import { T } from "./ui";

function decodeCanvas(src: CanvasImageSource, w: number, h: number) {
  const scale = Math.min(1, 1000 / Math.max(w, h));
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, cw, ch);
  return jsQR(ctx.getImageData(0, 0, cw, ch).data, cw, ch)?.data ?? null;
}

/** Decode a QR code from an image URI (data:, blob: or http). Returns null if none found. */
export function decodeImageUri(uri: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(decodeCanvas(img, img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

/** Live camera preview that keeps decoding frames until it finds a QR code. */
export function WebQrScanner({ onResult }: { onResult: (text: string) => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState("Starting camera…");

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        setStatus("Point the camera at the QR code");
        const tick = () => {
          if (stopped) return;
          if (v.videoWidth) {
            const text = decodeCanvas(v, v.videoWidth, v.videoHeight);
            if (text) { setStatus("Found it"); onResult(text); return; }
          }
          timer = setTimeout(tick, 250);
        };
        tick();
      } catch {
        setStatus("Camera unavailable. Use Take Photo or paste the link below.");
      }
    })();
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <View style={{ borderRadius: 24, overflow: "hidden", height: 360, backgroundColor: C.ink }}>
      {createElement("video", {
        ref: video, playsInline: true, muted: true, autoPlay: true,
        style: { width: "100%", height: "100%", objectFit: "cover" },
      })}
      {/* viewfinder */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 210, height: 210, borderRadius: 28, borderWidth: 3, borderColor: "rgba(247,248,238,0.9)" }} />
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: 12, right: 12, bottom: 12, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "rgba(31,45,29,0.7)", alignItems: "center" }}>
        <T v="small" color={C.paper} style={{ fontSize: 13 }}>{status}</T>
      </View>
    </View>
  );
}
