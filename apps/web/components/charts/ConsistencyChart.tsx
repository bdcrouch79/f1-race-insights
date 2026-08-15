"use client";

import ReactECharts from "echarts-for-react";

import { colorForIndex } from "@/lib/colors";
import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import type { ConsistencyRow } from "@/lib/schema";

export function ConsistencyChart({ consistency, drivers }: { consistency: ConsistencyRow[]; drivers: DriverInfo }) {
  if (consistency.length === 0) {
    return <p className="py-10 text-center text-sm text-riq-gray">Consistency data is not available for this session.</p>;
  }

  const rows = [...consistency].sort((a, b) => b.stdDevSeconds - a.stdDevSeconds);
  const colorIndexByDriver = new Map(consistency.map((row) => [row.driver, row.rank - 1]));

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: "#F4F6F8", fontFamily: "var(--font-sans)" },
    grid: { left: 110, right: 32, top: 16, bottom: 24 },
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
        return [
          `<strong>${driver ? driverLabel(driver) : row.driver}</strong>`,
          `Std dev: ${row.stdDevSeconds.toFixed(3)}s`,
          `Sample: ${row.sampleSize} quick laps`,
          "Lower is steadier.",
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "value",
      name: "Lap time std dev (s)",
      nameTextStyle: { color: "#8C949F" },
      axisLabel: { color: "#8C949F" },
      splitLine: { lineStyle: { color: "#8C949F22" } },
    },
    yAxis: {
      type: "category",
      data: rows.map((row) => drivers[row.driver]?.code ?? row.driver),
      axisLabel: { color: "#F4F6F8" },
      axisLine: { lineStyle: { color: "#8C949F44" } },
    },
    series: [
      {
        type: "bar",
        data: rows.map((row) => ({
          value: row.stdDevSeconds,
          itemStyle: {
            color: colorForIndex(colorIndexByDriver.get(row.driver) ?? 0),
            borderRadius: [0, 4, 4, 0],
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
      aria-label="Driver consistency (lap-time standard deviation)"
    />
  );
}
