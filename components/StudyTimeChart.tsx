"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StoredDailyStats = {
  totalStudyTime?: unknown;
};

type StudyTimeDataPoint = {
  date: string;
  minutes: number;
  sortKey: string;
};

const studyStatsKeyPattern = /^studyStats-(\d{4})-(\d{2})-(\d{2})$/;

function formatDateLabel(dateKey: string) {
  const [, year, month, day] = dateKey.match(studyStatsKeyPattern) ?? [];

  if (!year || !month || !day) {
    return dateKey;
  }

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function loadStudyTimeHistory() {
  const data: StudyTimeDataPoint[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || !studyStatsKeyPattern.test(key)) {
      continue;
    }

    const savedStats = window.localStorage.getItem(key);

    if (!savedStats) {
      continue;
    }

    try {
      const parsedStats = JSON.parse(savedStats) as StoredDailyStats;
      const totalStudyTime = parsedStats.totalStudyTime;

      if (typeof totalStudyTime !== "number" || totalStudyTime <= 0) {
        continue;
      }

      data.push({
        date: formatDateLabel(key),
        minutes: Math.floor(totalStudyTime / 60),
        sortKey: key,
      });
    } catch {
      continue;
    }
  }

  return data.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export default function StudyTimeChart() {
  const [chartData, setChartData] = useState<StudyTimeDataPoint[]>([]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setChartData(loadStudyTimeHistory());
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className="mt-6 bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-center text-gray-900 mb-4">
        Study Time Trend
      </h2>

      {chartData.length < 2 ? (
        <p className="text-center text-sm text-gray-500">
          Not enough study history yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="minutes"
              stroke="#111827"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
