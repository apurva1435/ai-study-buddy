"use client";

import ChatInterface from "@/components/ChatInterface";
import FocusMonitor from "@/components/FocusMonitor";
import MethodSelector from "@/components/MethodSelector";
import StudyTimer from "@/components/StudyTimer";
import DecisionPanel from "@/components/DecisionPanel";
import FocusSummary from "@/components/FocusSummary";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import FocusScoreChart from "@/components/FocusScoreChart";
import StudyTimeChart from "@/components/StudyTimeChart";
import KnowledgeGraphDashboard from "@/components/KnowledgeGraphDashboard";
import { useCallback, useState, useEffect, useRef } from "react";
import { useFocusTracker } from "@/hooks/useFocusTracker";
const API_URL = "http://127.0.0.1:8000";

async function saveSession(
  duration: number,
  focusScore: number
) {
  try {
    await fetch(`${API_URL}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: "Pomodoro Session",
        duration: duration,
        focus_score: focusScore,
      }),
    });
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

function getStudyDayKey() {
  const now = new Date();

  if (now.getHours() < 3) {
    now.setDate(now.getDate() - 1);
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `studyStats-${year}-${month}-${day}`;
}

const studyMethods = [
  { name: "Pomodoro (25/5)", studyDuration: 10, breakDuration: 5},
  { name: "Deep Work (90 min)", studyDuration: 90 * 60, breakDuration: 0 },
];

type DailyStats = {
  completedSessions: number;
  totalStudyTime: number;
  focusScores: number[];
};

export default function Home() {
  const [selectedMethod, setSelectedMethod] = useState(studyMethods[0]);

  const [timeLeft, setTimeLeft] = useState(
    studyMethods[0].studyDuration
  );
  const [breakTime, setBreakTime] = useState(
    studyMethods[0].breakDuration
  );

  const [status, setStatus] = useState<
    "idle" | "studying" | "paused" | "break" | "decision"
  >("idle");

  const [dailyStats, setDailyStats] = useState<DailyStats>({
    completedSessions: 0,
    totalStudyTime: 0,
    focusScores: [],
  });

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [liveFocused, setLiveFocused] = useState(true);
  const [faceAbsencesSession, setFaceAbsencesSession] = useState(0);
  const [contextSwitchesSession, setContextSwitchesSession] = useState(0);

  const [focusSummary, setFocusSummary] = useState<{
    focusRatio: number;
    distractionScore: number;
    quality: string;
  } | null>(null);

  const [backendAnalytics, setBackendAnalytics] = useState({
  total_sessions: 0,
  total_duration: 0,
  average_focus_score: 0,
});

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const statsLoadedRef = useRef(false);

  const {
    totalHiddenTime,
    distractionScore,
    resetFocusTracking,
  } = useFocusTracker(isSessionActive);

  const { completedSessions, totalStudyTime, focusScores } = dailyStats;

  const focusScore = focusSummary
  ? Math.round(focusSummary.focusRatio * 100)
  : liveFocused
    ? Math.max(0, 100 - distractionScore * 10)
    : Math.max(0, 95 - distractionScore * 10);

  const averageFocusScore =
    focusScores.length > 0
      ? Math.round(
          focusScores.reduce(
            (sum, score) => sum + score,
            0
          ) / focusScores.length
        )
      : 0;

  const effectivenessScore = Math.max(
    0,
    Math.round(
      focusScore * 0.8 +
        (100 - contextSwitchesSession * 5) * 0.1 +
        (100 - faceAbsencesSession * 10) * 0.1
    )
  );


console.log({
  liveFocused,
  focusScore,
});


const analyticsData = {
  studyTime: Math.floor(
    backendAnalytics.total_duration / 60
  ),

  completedSessions:
    backendAnalytics.total_sessions,

  focusScore,

  averageFocusScore:
    Math.round(
      backendAnalytics.average_focus_score
    ),

  effectivenessScore,

  contextSwitches: contextSwitchesSession,

  faceAbsences: faceAbsencesSession,
};

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const savedStats = window.localStorage.getItem(getStudyDayKey());
      if (!savedStats) {
        statsLoadedRef.current = true;
        return;
      }

      try {
        const saved = JSON.parse(savedStats) as Partial<DailyStats>;
        setDailyStats({
          completedSessions: saved.completedSessions ?? 0,
          totalStudyTime: saved.totalStudyTime ?? 0,
          focusScores: Array.isArray(saved.focusScores)
            ? saved.focusScores.filter(
                (score): score is number => typeof score === "number"
              )
            : [],
        });
      } catch {
        window.localStorage.removeItem(getStudyDayKey());
      }

      statsLoadedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!statsLoadedRef.current) return;

    window.localStorage.setItem(getStudyDayKey(), JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
  async function fetchAnalytics() {
    try {
      const res = await fetch(`${API_URL}/analytics`);
      const data = await res.json();

      setBackendAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  }

  fetchAnalytics();
}, [dailyStats]);

  // Accurate timer engine
  useEffect(() => {
    if (status !== "studying" && status !== "break") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!endTimeRef.current) {
      const duration =
        status === "studying"
          ? timeLeft
          : breakTime;

      endTimeRef.current = Date.now() + duration * 1000;
    }

    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;

      const remainingMs =
        endTimeRef.current - Date.now();

      const remainingSeconds = Math.max(
        0,
        Math.ceil(remainingMs / 1000)
      );

      if (status === "studying") {
        setTimeLeft(remainingSeconds);
      } else {
        setBreakTime(remainingSeconds);
      }

      if (remainingSeconds <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        endTimeRef.current = null;

        if (status === "studying") {
          setIsSessionActive(false);

          const sessionDuration =
            selectedMethod.studyDuration * 1000;

          const focusRatio =
            (sessionDuration - totalHiddenTime) /
            sessionDuration;

          let quality = "Strong Focus";
          if (focusRatio < 0.5) {
            quality = "Low Focus Stability";
          } else if (focusRatio < 0.8) {
            quality = "Moderate Focus";
          }

          const sessionFocusScore = Math.max(
            0,
            Math.min(100, Math.round(focusRatio * 100))
          );

          saveSession(
            selectedMethod.studyDuration,
            sessionFocusScore
          );

          setFocusSummary({
            focusRatio,
            distractionScore,
            quality,
          });

          resetFocusTracking();

          setDailyStats((prev) => ({
            completedSessions: prev.completedSessions + 1,
            totalStudyTime:
              prev.totalStudyTime + selectedMethod.studyDuration,
            focusScores: [
              ...(prev.focusScores || []),
              sessionFocusScore,
            ],
          }));
          
          setStatus("decision");
        } else {
          setTimeLeft(selectedMethod.studyDuration);
          setBreakTime(selectedMethod.breakDuration);
          setFocusSummary(null);
          setStatus("idle");
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    status,
    selectedMethod,
    timeLeft,
    breakTime,
    totalHiddenTime,
    distractionScore,
    resetFocusTracking,
  ]);

  const startStudySession = () => {
    setTimeLeft(selectedMethod.studyDuration);
    setBreakTime(selectedMethod.breakDuration);
    setFocusSummary(null);
    setFaceAbsencesSession(0);
    setContextSwitchesSession(0);
    endTimeRef.current = null;
    resetFocusTracking();
    setStatus("studying");
    setIsSessionActive(true);
  };

  const selectStudyMethod = (method: typeof studyMethods[number]) => {
    setSelectedMethod(method);
    setTimeLeft(method.studyDuration);
    setBreakTime(method.breakDuration);
    setStatus("idle");
    setIsSessionActive(false);
    setFocusSummary(null);
    setShowCamera(false);
    setFaceAbsencesSession(0);
    setContextSwitchesSession(0);
    endTimeRef.current = null;
    resetFocusTracking();
  };

  const startBreak = () => {
    setBreakTime(selectedMethod.breakDuration);
    setTimeLeft(selectedMethod.studyDuration);
    setFocusSummary(null);
    endTimeRef.current = null;
    setIsSessionActive(false);
    setShowCamera(false);
    setStatus("break");
  };

  const finishForToday = () => {
    setTimeLeft(selectedMethod.studyDuration);
    setBreakTime(selectedMethod.breakDuration);
    setFocusSummary(null);
    endTimeRef.current = null;
    setIsSessionActive(false);
    setShowCamera(false);
    setStatus("idle");
  };

const handleFaceAbsence = useCallback(() => {
  console.log("Face Absence Counted");

  setFaceAbsencesSession((prev) => {
    console.log("Previous Face Absences:", prev);
    return prev + 1;
  });
}, []);

  const handleContextSwitch = useCallback(() => {
    setContextSwitchesSession((prev) => prev + 1);
  }, []);

  console.log({
  status,
  liveFocused,
  focusSummary,
  focusScore,
});

  return (
    <main className="min-h-screen flex bg-gray-100">

      {/* LEFT PANEL — STUDY */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
            AI Study Buddy
          </h1>

          <MethodSelector
            methods={studyMethods}
            selectedMethod={selectedMethod}
            onSelect={selectStudyMethod}
          />

          <StudyTimer
            status={status}
            timeLeft={timeLeft}
            breakTime={breakTime}
          />

          <AnalyticsDashboard analyticsData={analyticsData} />

          <FocusScoreChart refreshTrigger={dailyStats.completedSessions} />

          <StudyTimeChart refreshTrigger ={dailyStats.completedSessions} />

          <KnowledgeGraphDashboard />

          {/* Camera Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowCamera((prev) => !prev)}
              className="px-4 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {showCamera ? "Hide Camera" : "Show Camera"}
            </button>
          </div>

          {/* Camera View */}
          {showCamera && (
            <div className="mt-4 flex flex-col gap-4">
              <FocusMonitor
                onContextSwitch={handleContextSwitch}
                onFaceAbsence={handleFaceAbsence}
                onFocusChange={setLiveFocused}
              />
            </div>
          )}

          {status === "decision" && focusSummary && (
            <>
              <FocusSummary
                focusRatio={focusSummary.focusRatio}
                distractionScore={focusSummary.distractionScore}
                quality={focusSummary.quality}
              />

              <DecisionPanel
                breakDuration={selectedMethod.breakDuration}
                onBreak={
                  selectedMethod.breakDuration > 0 ? startBreak : undefined
                }
                onContinue={startStudySession}
                onDone={finishForToday}
              />
            </>
          )}

          {status !== "decision" && (
            <button
              onClick={() => {
                if (status === "idle") {
                  startStudySession();
                } else if (status === "studying") {
                  if (endTimeRef.current) {
                    const remainingMs =
                      endTimeRef.current - Date.now();

                    const remainingSeconds = Math.max(
                      0,
                      Math.ceil(remainingMs / 1000)
                    );

                    setTimeLeft(remainingSeconds);
                  }

                  endTimeRef.current = null;
                  setIsSessionActive(false);
                  setStatus("paused");
                } else if (status === "paused") {
                  endTimeRef.current =
                    Date.now() + timeLeft * 1000;

                  setIsSessionActive(true);
                  setStatus("studying");
                } else if (status === "break") {
                  finishForToday();
                }
              }}
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition mt-6"
            >
              {status === "idle" && "Start Session"}
              {status === "studying" && "Pause Session"}
              {status === "paused" && "Resume Session"}
              {status === "break" && "End Break"}
            </button>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — CHAT */}
      <div className="w-[420px] h-screen border-l border-gray-200 bg-white">
        <ChatInterface
          sessionStatus={status}
          focusRatio={focusSummary?.focusRatio ?? null}
          distractionScore={focusSummary?.distractionScore ?? null}
        />
      </div>

    </main>
  );
}
