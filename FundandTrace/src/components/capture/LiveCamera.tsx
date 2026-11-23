import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./capture.module.scss";

export type CaptureMeta = {
  capturedAt: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  facingMode: "user" | "environment";
};

type Props = {
  mode: "photo" | "video";
  facing: "user" | "environment";
  code: string;
  /** Shown during the recording, one at a time. */
  prompts?: string[];
  instruction: string;
  maxSeconds?: number;
  minSeconds?: number;
  onCapture: (blob: Blob, meta: CaptureMeta) => void;
  onCancel?: () => void;
};

// Safari records MP4; Chrome/Firefox/Android record WebM.
const pickVideoType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
};

const cameraError = (err: unknown) => {
  const name = (err as { name?: string })?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow the camera (and microphone for videos) for this site in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera found on this device. Use your phone instead.";
  if (name === "NotReadableError") return "The camera is being used by another app. Close it and try again.";
  return "Couldn't start the camera. Try again, or use your phone instead.";
};

/**
 * Camera-only capture. There is deliberately no file picker: evidence must be
 * taken now, in the app, with the session's code visible (photos) or spoken
 * (videos), so old or edited files can't be submitted.
 */
export default function LiveCamera({ mode, facing, code, prompts = [], instruction, maxSeconds = 15, minSeconds = 3, onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const [state, setState] = useState<"idle" | "starting" | "live" | "recording" | "review">("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; meta: CaptureMeta } | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview.url) : undefined), [preview]);

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't use the camera. Open this page in Chrome or Safari, or use your phone.");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === "video",
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => undefined);
      }
      setState("live");
    } catch (err) {
      stopStream();
      setState("idle");
      setError(cameraError(err));
    }
  };

  const meta = (durationMs: number | null): CaptureMeta => ({
    capturedAt: new Date().toISOString(),
    width: videoRef.current?.videoWidth || null,
    height: videoRef.current?.videoHeight || null,
    durationMs,
    facingMode: facing,
  });

  const takePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    // Canvas JPEGs carry no EXIF, so no hidden GPS or device serials leak.
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("Couldn't take the photo. Try again.");
        const m = meta(null);
        stopStream();
        setPreview({ url: URL.createObjectURL(blob), blob, meta: m });
        setState("review");
        return undefined;
      },
      "image/jpeg",
      0.88
    );
  };

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickVideoType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 1_500_000 } : undefined);
    } catch {
      setError("This browser can't record video. Use Chrome or Safari, or your phone.");
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "video/webm" });
      const m = meta(durationMs);
      stopStream();
      setPreview({ url: URL.createObjectURL(blob), blob, meta: m });
      setState("review");
    };
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    recorder.start(500);
    setState("recording");
  };

  useEffect(() => {
    if (state !== "recording") return undefined;
    const t = window.setInterval(() => {
      const s = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(s);
      if (s >= maxSeconds) stopRecording();
    }, 200);
    return () => window.clearInterval(t);
  }, [state, maxSeconds, stopRecording]);

  const retake = () => {
    setPreview(null);
    start();
  };

  // Prompts are shown in turn while recording, so the reviewer can see them followed.
  const promptIndex = prompts.length ? Math.min(prompts.length - 1, Math.floor(elapsed / Math.max(2, maxSeconds / (prompts.length + 1)))) : -1;
  const remaining = Math.max(0, Math.ceil(maxSeconds - elapsed));

  return (
    <div className={styles.camera}>
      <p className={styles.instruction}>{instruction}</p>

      <div className={styles.viewport} data-facing={facing}>
        {state !== "review" && <video ref={videoRef} playsInline muted autoPlay className={styles.video} aria-label="Camera preview" />}
        {state === "review" && preview && (mode === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt="Your capture" className={styles.video} />
        ) : (
          <video src={preview.url} controls playsInline className={styles.video} aria-label="Your recording" />
        ))}

        {(state === "live" || state === "recording") && (
          <div className={styles.codeBadge} aria-live="polite">
            <span>Code</span>
            <strong>{code}</strong>
          </div>
        )}
        {state === "recording" && (
          <>
            <div className={styles.recDot}>
              <span aria-hidden="true" /> {remaining}s
            </div>
            <div className={styles.promptBar} aria-live="assertive">
              {elapsed < 2.5 || promptIndex < 0 ? `Say: “My code is ${code.split("").join(" ")}”` : prompts[promptIndex]}
            </div>
          </>
        )}
        {(state === "idle" || state === "starting") && (
          <div className={styles.placeholder}>{state === "starting" ? "Starting camera…" : "Camera is off"}</div>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {state === "idle" && (
          <button type="button" className="ft-btn ft-btn--primary ft-btn--lg" onClick={start}>
            Turn on camera
          </button>
        )}
        {state === "live" && mode === "photo" && (
          <button type="button" className="ft-btn ft-btn--primary ft-btn--lg" onClick={takePhoto}>
            Take photo
          </button>
        )}
        {state === "live" && mode === "video" && (
          <button type="button" className="ft-btn ft-btn--primary ft-btn--lg" onClick={startRecording}>
            Start recording
          </button>
        )}
        {state === "recording" && (
          <button type="button" className="ft-btn ft-btn--secondary ft-btn--lg" onClick={stopRecording} disabled={elapsed < minSeconds}>
            {elapsed < minSeconds ? `Keep going… ${Math.ceil(minSeconds - elapsed)}s` : "Stop"}
          </button>
        )}
        {state === "review" && preview && (
          <>
            <button type="button" className="ft-btn ft-btn--primary ft-btn--lg" onClick={() => onCapture(preview.blob, preview.meta)}>
              Use this {mode}
            </button>
            <button type="button" className="ft-btn ft-btn--ghost" onClick={retake}>
              Retake
            </button>
          </>
        )}
        {onCancel && state !== "recording" && (
          <button type="button" className="ft-btn ft-btn--link" onClick={() => {
              stopStream();
              onCancel();
            }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
