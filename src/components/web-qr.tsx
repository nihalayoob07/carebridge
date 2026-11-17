// Web-only QR scanning. Safari can't detect barcodes through expo-camera, so we read frames from the
// in-page video ourselves and decode them with jsQR: continuously, and on demand with the shutter button.
import jsQR from "jsqr";
import { createElement, useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { C } from "@/lib/theme";
import { Icon } from "./icon";
import { T } from "./ui";

function decodeFrame(src: CanvasImageSource, w: number, h: number, thorough = false) {
  const scale = Math.min(1, (thorough ? 1400 : 900) / Math.max(w, h));
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, cw, ch);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  return jsQR(data, cw, ch, { inversionAttempts: thorough ? "attemptBoth" : "dontInvert" })?.data ?? null;
}

/** Live in-page camera with a viewfinder and a shutter button that captures the current frame. */
export function WebQrScanner({ onResult }: { onResult: (text: string) => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState("Starting camera…");
  const [ready, setReady] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;
  const found = useRef(false);

  const hit = (text: string) => {
    if (found.current) return;
    found.current = true;
    setStatus("QR code found");
    onResult(text);
  };

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
        });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        setReady(true);
        setStatus("Point at the QR code, or tap the shutter");
        const tick = () => {
          if (stopped || found.current) return;
          if (v.videoWidth) {
            const text = decodeFrame(v, v.videoWidth, v.videoHeight);
            if (text) return hit(text);
          }
          timer = setTimeout(tick, 300);
        };
        tick();
      } catch {
        setStatus("Camera blocked. Allow camera access, or paste the link below.");
      }
    })();
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const capture = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 350, useNativeDriver: false }).start();
    const text = decodeFrame(v, v.videoWidth, v.videoHeight, true);
    if (text) hit(text);
    else setStatus("No QR code in that shot. Fill the frame and try again.");
  };

  return (
    <View style={{ borderRadius: 24, overflow: "hidden", height: 420, backgroundColor: C.ink }}>
      {createElement("video", {
        ref: video, playsInline: true, muted: true, autoPlay: true,
        style: { width: "100%", height: "100%", objectFit: "cover" },
      })}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 60, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 220, height: 220, borderRadius: 28, borderWidth: 3, borderColor: "rgba(247,248,238,0.9)" }} />
      </View>
      <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", opacity: flash }} />
      <View pointerEvents="none" style={{ position: "absolute", top: 12, left: 12, right: 12, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "rgba(31,45,29,0.72)", alignItems: "center" }}>
        <T v="small" color={C.paper} style={{ fontSize: 13, textAlign: "center" }}>{status}</T>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 18, alignItems: "center" }}>
        <Pressable onPress={capture} disabled={!ready} accessibilityRole="button" accessibilityLabel="Capture and read QR code"
          style={(st: any) => ({ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: C.paper, alignItems: "center", justifyContent: "center",
            opacity: ready ? 1 : 0.5, transform: [{ scale: st.pressed ? 0.92 : 1 }] })}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.paper, alignItems: "center", justifyContent: "center" }}>
            <Icon name="qr" size={26} color={C.deep} weight="regular" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
