type FocusSummaryProps = {
  focusRatio: number;
  distractionScore: number;
  quality: string;
};

export default function FocusSummary({
  focusRatio,
  distractionScore,
  quality,
}: FocusSummaryProps) {
  const percentage = Math.max(
    0,
    Math.min(100, focusRatio * 100)
  );

  // Dynamic color logic
  let barColor = "bg-green-500";
  let accentText = "text-green-600";
  let insightMessage = "Excellent consistency. Keep this momentum.";

  if (percentage < 50) {
    barColor = "bg-red-500";
    accentText = "text-red-600";
    insightMessage =
      "Frequent interruptions detected. Try shorter sessions.";
  } else if (percentage < 80) {
    barColor = "bg-yellow-500";
    accentText = "text-yellow-600";
    insightMessage =
      "Some distractions occurred. You're improving.";
  }

  return (
    <div className="mb-4 p-5 rounded-xl bg-white shadow-md border border-gray-200 text-center transition-all duration-300">
      <p className={`font-semibold text-lg mb-3 ${accentText}`}>
        {quality}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Metrics */}
      <p className="text-sm text-gray-700 mb-1">
        Focus Ratio:{" "}
        <span className="font-medium">
          {percentage.toFixed(1)}%
        </span>
      </p>

      <p className="text-sm text-gray-700 mb-3">
        Distraction Score:{" "}
        <span className="font-medium">
          {distractionScore}
        </span>
      </p>

      {/* Insight */}
      <p className="text-xs text-gray-500 italic">
        {insightMessage}
      </p>
    </div>
  );
}
