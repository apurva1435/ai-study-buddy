type DecisionPanelProps = {
  breakDuration: number;
  onBreak?: () => void;
  onContinue: () => void;
  onDone: () => void;
};

export default function DecisionPanel({
  breakDuration,
  onBreak,
  onContinue,
  onDone,
}: DecisionPanelProps) {
  const breakMinutes = Math.max(1, Math.round(breakDuration / 60));

  return (
    <div className="flex flex-col gap-3 mt-4">
      {breakDuration > 0 && onBreak && (
        <button
          onClick={onBreak}
          className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Take a {breakMinutes} Minute Break
        </button>
      )}

      <button
        onClick={onContinue}
        className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
      >
        Start Another Session
      </button>

      <button
        onClick={onDone}
        className="bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
      >
        Done for Today
      </button>
    </div>
  );
}
