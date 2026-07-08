interface AnalyticsData {
  studyTime: number;
  completedSessions: number;
  focusScore: number;
  averageFocusScore: number;
  effectivenessScore: number;
  contextSwitches: number;
  faceAbsences: number;
}

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData;
}

export default function AnalyticsDashboard({
  analyticsData,
}: AnalyticsDashboardProps) {

  console.log(analyticsData.focusScore);
  const cards = [
    {
      label: "Study Time Today",
      value: `${analyticsData.studyTime} min`,
    },
    {
      label: "Completed Sessions",
      value: analyticsData.completedSessions,
    },
    {
      label: "Current Focus Score",
      value: `${analyticsData.focusScore}/100`,
    },
    {
      label: "Today's Average Focus Score",
      value: `${analyticsData.averageFocusScore}/100`,
    },
    {
      label: "Session Effectiveness",
      value: `${analyticsData.effectivenessScore}/100`,
    },
    {
      label: "Context Switches",
      value: analyticsData.contextSwitches,
    },
    {
      label: "Face Absences",
      value: analyticsData.faceAbsences,
    },
  ];

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-center text-gray-900 mb-4">
        Analytics
      </h2>

      <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.label}
            className="flex min-h-28 h-full flex-col items-center justify-center rounded-lg border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="text-sm font-medium text-gray-600">
              {card.label}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {card.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
