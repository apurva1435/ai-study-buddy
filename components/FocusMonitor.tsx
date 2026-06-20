"use client";

import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

type FocusMonitorProps = {
  onFaceAbsence: () => void;
  onContextSwitch: () => void;
};

export default function FocusMonitor({
  onFaceAbsence,
  onContextSwitch,
}: FocusMonitorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const leftAtRef = useRef<number | null>(null);
  const faceMissingSinceRef = useRef<number | null>(null);
  const absenceCountedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [focusStatus, setFocusStatus] = useState("Initializing...");
  const [faceStatus, setFaceStatus] = useState("Initializing...");
  const [error, setError] = useState("");
  const [contextSwitchCount, setContextSwitchCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream;
    let faceDetectionInterval: NodeJS.Timeout;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraActive(true);
        setFocusStatus("Focused");
      } catch {
        setError("Camera access denied or not available.");
        setCameraActive(false);
      }
    }

    async function initializeFaceDetector() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        const detector = await FaceDetector.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
            },
            runningMode: "VIDEO",
          }
        );

        faceDetectionInterval = setInterval(() => {
          if (!videoRef.current) return;

          const video = videoRef.current;

          if (video.readyState < 2) return;

          const result = detector.detectForVideo(
            video,
            performance.now()
          );

          const faceDetected = result.detections.length > 0;

          if (faceDetected) {
            setFaceStatus("Face Detected");

            if (faceMissingSinceRef.current) {
              const absenceDuration =
                (Date.now() - faceMissingSinceRef.current) / 1000;

              if (
                absenceDuration >= 60 &&
                !absenceCountedRef.current
              ) {
                onFaceAbsence();
                absenceCountedRef.current = true;
              }

              faceMissingSinceRef.current = null;
              absenceCountedRef.current = false;
            }
          } else {
            setFaceStatus("No Face Detected");

            if (!faceMissingSinceRef.current) {
              faceMissingSinceRef.current = Date.now();
            }
          }
        }, 1000);
      } catch (error) {
        console.error(error);
        setFaceStatus("Detection Failed");
      }
    }

    startCamera();
    initializeFaceDetector();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leftAtRef.current = Date.now();
      } else {
        if (leftAtRef.current) {
          const secondsAway =
            (Date.now() - leftAtRef.current) / 1000;

          if (secondsAway >= 30) {
            setContextSwitchCount((prev) => prev + 1);
            onContextSwitch();
          }

          setFocusStatus("Focused");
          leftAtRef.current = null;
        }
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    const interval = setInterval(() => {
      if (!videoRef.current) return;

      const video = videoRef.current;

      if (video.readyState < 3) {
        setFocusStatus("No Video Feed");
      } else {
        setFocusStatus("Focused");
      }
    }, 2000);

    return () => {
      clearInterval(interval);

      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onContextSwitch, onFaceAbsence]);

  return (
    <div className="mt-6">
      <div className="text-center text-sm mb-2 font-medium">
        {cameraActive
          ? focusStatus
          : error || "Starting Camera..."}
      </div>

      <div className="text-center text-xs text-gray-500 mb-2">
        Context Switches: {contextSwitchCount}
      </div>

      <div className="text-center text-xs text-blue-600 mb-2">
        Face Status: {faceStatus}
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-lg border"
      />
    </div>
  );
}
