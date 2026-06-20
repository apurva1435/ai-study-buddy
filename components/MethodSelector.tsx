type StudyMethod = {
  name: string;
  studyDuration: number;
  breakDuration: number;
};

type MethodSelectorProps = {
  methods: StudyMethod[];
  selectedMethod: StudyMethod;
  onSelect: (method: StudyMethod) => void;
};

export default function MethodSelector({
  methods,
  selectedMethod,
  onSelect,
}: MethodSelectorProps) {
  return (
    <div className="mb-4">
      <select
        value={selectedMethod.name}
        onChange={(e) => {
          const method = methods.find(
            (m) => m.name === e.target.value
          );
          if (method) onSelect(method);
        }}
        className="w-full border p-2 rounded-lg"
      >
        {methods.map((method) => (
          <option key={method.name} value={method.name}>
            {method.name}
          </option>
        ))}
      </select>
    </div>
  );
}
