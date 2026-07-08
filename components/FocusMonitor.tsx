"use client";

import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

type FocusMonitorProps = {
  onFaceAbsence: () => void;
  onContextSwitch: () => void;
  onFocusChange: (focused: boolean) => void;
};

export default function FocusMonitor({
  onFaceAbsence,
  onContextSwitch,
  onFocusChange,
}: FocusMonitorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const leftAtRef = useRef<number | null>(null);
  const faceMissingSinceRef = useRef<number | null>(null);
  const absenceCountedRef = useRef(false);
  const lookingAwaySinceRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [focusStatus, setFocusStatus] = useState("Initializing...");
  const [faceStatus, setFaceStatus] = useState("Initializing...");
  const [eyeStatus, setEyeStatus] = useState("Looking...");
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
      } catch (err) {
      console.error(err);

      setError(String(err));

      setCameraActive(false);
    }
    }

    async function initializeFaceDetector() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        const detector =
    await FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
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

          const faceDetected =
            result.faceLandmarks.length > 0;

          if (faceDetected) {

  const landmarks = result.faceLandmarks[0];

  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const nose = landmarks[1];

  const eyeCenterX =
    (leftEye.x + rightEye.x) / 2;

  const offset =
    nose.x - eyeCenterX;
    
if (Math.abs(offset) < 0.03) {

    lookingAwaySinceRef.current = null;

    setEyeStatus("👀 Looking at Screen");
    setFocusStatus("Focused");

    onFocusChange(true);

} else {

    setEyeStatus("👀 Looking Away");

    if (!lookingAwaySinceRef.current) {
        lookingAwaySinceRef.current = Date.now();
    }

    const secondsAway =
        (Date.now() - lookingAwaySinceRef.current) / 1000;

    if (secondsAway >= 3) {
        setFocusStatus("Distracted");
        onFocusChange(false);
    }

}

}

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
        console.log("User Left");
        leftAtRef.current = Date.now();
      } else {
        console.log("User Returned");
        if (leftAtRef.current) {
          
          const secondsAway =
            (Date.now() - leftAtRef.current) / 1000;

          console.log(secondsAway);

          if (secondsAway >= 30) {
            console.log("Context Switch Counted");
            setContextSwitchCount((prev) => prev + 1);
            onContextSwitch();
          }

          
          leftAtRef.current = null;
        }
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    const handleBlur = () => {
      console.log("Window Blur");
      leftAtRef.current=Date.now();

};

const handleFocus = () => {
  console.log("Window Focus");

  if (leftAtRef.current) {

    const secondsAway =
      (Date.now() - leftAtRef.current) / 1000;

    console.log(secondsAway);

    if (secondsAway >= 30) {   // change back to 30 later

      console.log("Context Switch Counted");

      setContextSwitchCount((prev) => prev + 1);

      onContextSwitch();

    }

    leftAtRef.current = null;
  }
};

window.addEventListener("blur", handleBlur);
window.addEventListener("focus", handleFocus);

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
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);

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
        <div className="text-center text-xs text-green-600 mb-2">
  Eye Status: {eyeStatus}
</div>
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
