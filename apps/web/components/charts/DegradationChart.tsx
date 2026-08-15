"use client";

import ReactECharts from "echarts-for-react";

import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import type { DegradationRow } from "@/lib/schema";

export function DegradationChart({ degradation, drivers }: { degradation: DegradationRow[]; drivers: DriverInfo }) {
  if (degradation.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-riq-gray">
        Degradation data is not available for this session.
      </p>
    );
  }

  // Diverging around zero: a driver who lost time late (positive delta)
  // renders as an orange bar to the right, a driver who gained time late
  // (negative delta) as a cyan bar to the left. This reads far more
  // clearly than plotting the near-identical absolute opening/closing
  // lap times side by side.
  const rows = [...degradation].sort((a, b) => a.deltaSeconds - b.deltaSeconds);
  const categories = rows.map((row) => drivers[row.driver]?.code ?? row.driver);

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: "#F4F6F8", fontFamily: "var(--font-sans)" },
    grid: { left: 110, right: 48, top: 16, bottom: 24 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#1A1E24",
      borderColor: "#8C949F33",
      textStyle: { color: "#F4F6F8" },
      formatter: (params: { dataIndex: number }[]) => {
        const dataIndex = params[0]?.dataIndex;
        const row = dataIndex === undefined ? undefined : rows[dataIndex];
        if (!row) return "";
        const driver = drivers[row.driver];
        const sign = row.deltaSeconds > 0 ? "+" : "";
        return [
          `<strong>${driver ? driverLabel(driver) : row.driver}</strong>`,
          `Opening avg: ${row.openingAverageSeconds.toFixed(3)}s (first ${row.sampleSize} quick laps)`,
          `Closing avg: ${row.closingAverageSeconds.toFixed(3)}s (last ${row.sampleSize} quick laps)`,
          `Delta: ${sign}${row.deltaSeconds.toFixed(3)}s`,
          "Heuristic, not a stint-aware tire model.",
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "value",
      name: "Closing − opening average (s)",
      nameTextStyle: { color: "#8C949F" },
      axisLabel: { color: "#8C949F" },
      splitLine: { lineStyle: { color: "#8C949F22" } },
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLabel: { color: "#F4F6F8" },
      axisLine: { lineStyle: { color: "#8C949F44" } },
    },
    series: [
      {
        type: "bar",
        data: rows.map((row) => ({
          value: row.deltaSeconds,
          itemStyle: {
            color: row.deltaSeconds > 0 ? "#FF6B00" : "#30D5FF",
            borderRadius: row.deltaSeconds > 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
          },
          label: {
            show: true,
            color: "#8C949F",
            position: row.deltaSeconds >= 0 ? "right" : "left",
            formatter: () => `${row.deltaSeconds > 0 ? "+" : ""}${row.deltaSeconds.toFixed(3)}s`,
          },
        })),
        barMaxWidth: 22,
      },
    ],
    animationDuration: 400,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(220, rows.length * 34) }}
      aria-label="Opening versus closing average pace delta by driver"
    />
  );
}
