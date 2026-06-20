"use client";

type StudyTimerProps = {
  status: string;
  timeLeft: number;
  breakTime: number;
};

export default function StudyTimer({
  status,
  timeLeft,
  breakTime,
}: StudyTimerProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-5xl font-mono text-center mb-6">
      {status === "break"
        ? formatTime(breakTime)
        : formatTime(timeLeft)}
    </div>
  );
}
