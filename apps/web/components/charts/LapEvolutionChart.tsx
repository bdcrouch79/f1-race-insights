"use client";

import ReactECharts from "echarts-for-react";

import { colorForIndex } from "@/lib/colors";
import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import type { LapTrendSeries } from "@/lib/schema";

export function LapEvolutionChart({ lapTrends, drivers }: { lapTrends: LapTrendSeries[]; drivers: DriverInfo }) {
  if (lapTrends.length === 0) {
    return <p className="py-10 text-center text-sm text-riq-gray">Lap trend data is not available for this session.</p>;
  }

  const maxLap = Math.max(1, ...lapTrends.flatMap((series) => series.laps.map((lap) => lap.lapNumber)));
  const lapNumbers = Array.from({ length: maxLap }, (_, i) => i + 1);

  const series = lapTrends.map((driverSeries, index) => {
    const byLap = new Map(driverSeries.laps.map((lap) => [lap.lapNumber, lap.lapTimeSeconds]));
    const driver = drivers[driverSeries.driver];
    return {
      name: driver ? driverLabel(driver) : driverSeries.driver,
      type: "line" as const,
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2, color: colorForIndex(index) },
      itemStyle: { color: colorForIndex(index) },
      data: lapNumbers.map((lap) => byLap.get(lap) ?? null),
    };
  });

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: "#F4F6F8", fontFamily: "var(--font-sans)" },
    grid: { left: 56, right: 24, top: 48, bottom: 72 },
    legend: {
      top: 0,
      textStyle: { color: "#8C949F" },
      selectedMode: true,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1A1E24",
      borderColor: "#8C949F33",
      textStyle: { color: "#F4F6F8" },
      valueFormatter: (value: number | string) => (typeof value === "number" ? `${value.toFixed(3)}s` : "no lap"),
    },
    xAxis: {
      type: "category",
      name: "Lap",
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: "#8C949F" },
      data: lapNumbers,
      axisLabel: { color: "#8C949F" },
      axisLine: { lineStyle: { color: "#8C949F44" } },
    },
    yAxis: {
      type: "value",
      name: "Lap time (s)",
      nameTextStyle: { color: "#8C949F" },
      // Zoomed to the actual pace band rather than starting at zero:
      // lap times cluster tightly (typically within a few seconds), so a
      // zero-based axis would flatten every line into a near-straight
      // band and hide the rhythm this chart exists to show.
      min: (value: { min: number }) => Math.floor(value.min - 0.5),
      max: (value: { max: number }) => Math.ceil(value.max + 0.5),
      axisLabel: { color: "#8C949F" },
      splitLine: { lineStyle: { color: "#8C949F22" } },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { type: "slider", start: 0, end: 100, height: 18, bottom: 12, textStyle: { color: "#8C949F" } },
    ],
    series,
    animationDuration: 400,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 380 }}
      aria-label="Lap-by-lap pace for the top drivers by average pace"
    />
  );
}
