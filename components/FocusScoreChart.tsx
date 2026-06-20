"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StoredDailyStats = {
  focusScores?: unknown;
};

type FocusScoreDataPoint = {
  date: string;
  score: number;
  sortKey: string;
};

const studyStatsKeyPattern = /^studyStats-(\d{4})-(\d{2})-(\d{2})$/;

function formatDateLabel(dateKey: string) {
  const [, year, month, day] = dateKey.match(studyStatsKeyPattern) ?? [];

  if (!year || !month || !day) {
    return dateKey;
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getAverageFocusScore(focusScores: number[]) {
  return Math.round(
    focusScores.reduce((sum, score) => sum + score, 0) /
      focusScores.length
  );
}

function loadFocusScoreHistory() {
  const data: FocusScoreDataPoint[] = [];

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
      const focusScores = Array.isArray(parsedStats.focusScores)
        ? parsedStats.focusScores.filter(
            (score): score is number => typeof score === "number"
          )
        : [];

      if (focusScores.length === 0) {
        continue;
      }

      data.push({
        date: formatDateLabel(key),
        score: getAverageFocusScore(focusScores),
        sortKey: key,
      });
    } catch {
      continue;
    }
  }

  return data.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export default function FocusScoreChart() {
  const [chartData, setChartData] = useState<FocusScoreDataPoint[]>([]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setChartData(loadFocusScoreHistory());
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className="mt-6 bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-center text-gray-900 mb-4">
        Focus Score Trend
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
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="score"
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
