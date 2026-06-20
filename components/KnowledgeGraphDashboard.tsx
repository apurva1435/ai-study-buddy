type KnowledgeNode = {
  id: string;
  mastery: number;
  position: {
    left: string;
    top: string;
  };
};

const nodes: KnowledgeNode[] = [
  { id: "DSA", mastery: 80, position: { left: "12%", top: "16%" } },
  { id: "React", mastery: 65, position: { left: "62%", top: "10%" } },
  { id: "DBMS", mastery: 45, position: { left: "18%", top: "63%" } },
  { id: "OOP", mastery: 90, position: { left: "62%", top: "62%" } },
];

function getMasteryColor(mastery: number) {
  if (mastery <= 50) {
    return "bg-red-500 border-red-600";
  }

  if (mastery <= 75) {
    return "bg-yellow-400 border-yellow-500";
  }

  return "bg-green-500 border-green-600";
}

export default function KnowledgeGraphDashboard() {
  return (
    <section className="mt-6 bg-white rounded-lg shadow-sm p-4">
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Knowledge Graph Preview
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            0-50
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            51-75
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            76-100
          </span>
        </div>
      </div>

      <div className="relative h-72 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line x1="12" y1="16" x2="62" y2="10" stroke="#9ca3af" strokeWidth="0.7" />
          <line x1="12" y1="16" x2="18" y2="63" stroke="#9ca3af" strokeWidth="0.7" />
          <line x1="62" y1="10" x2="62" y2="62" stroke="#9ca3af" strokeWidth="0.7" />
          <line x1="18" y1="63" x2="62" y2="62" stroke="#9ca3af" strokeWidth="0.7" />
          <line x1="12" y1="16" x2="62" y2="62" stroke="#d1d5db" strokeWidth="0.5" />
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-center text-xs font-semibold text-white shadow-sm ${getMasteryColor(node.mastery)}`}
            style={node.position}
          >
            <span>
              {node.id}
              <br />
              {node.mastery}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
