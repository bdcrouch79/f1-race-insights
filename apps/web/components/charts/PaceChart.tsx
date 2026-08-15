"use client";

import ReactECharts from "echarts-for-react";

import { colorForIndex } from "@/lib/colors";
import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import type { PaceRankingRow } from "@/lib/schema";

export function PaceChart({ pace, drivers }: { pace: PaceRankingRow[]; drivers: DriverInfo }) {
  if (pace.length === 0) {
    return <p className="py-10 text-center text-sm text-riq-gray">Average pace data is not available for this session.</p>;
  }

  // Fastest first in the underlying data (rank 1 = fastest); reversed for
  // display so the fastest driver renders at the top of the horizontal bars.
  const rows = [...pace].sort((a, b) => b.averageLapTimeSeconds - a.averageLapTimeSeconds);
  const colorIndexByDriver = new Map(pace.map((row) => [row.driver, row.rank - 1]));

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
          `Average lap: ${row.averageLapTimeSeconds.toFixed(3)}s`,
          `Gap to fastest: +${row.gapToFastestSeconds.toFixed(3)}s`,
          `Sample: ${row.sampleSize} quick laps`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "value",
      name: "Gap to fastest average (s)",
      nameTextStyle: { color: "#8C949F" },
      axisLabel: { color: "#8C949F", formatter: (value: number) => (value === 0 ? "Fastest" : `+${value}`) },
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
        // Plotted as gap-to-fastest rather than absolute lap time: the
        // useful signal is the spread between drivers, which absolute
        // lap times (all ~90s+) compress into visually identical bars.
        data: rows.map((row) => ({
          value: row.gapToFastestSeconds,
          itemStyle: {
            color: colorForIndex(colorIndexByDriver.get(row.driver) ?? 0),
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barMaxWidth: 22,
        label: {
          show: true,
          position: "right",
          color: "#8C949F",
          formatter: (p: { dataIndex: number }) =>
            rows[p.dataIndex]?.gapToFastestSeconds === 0 ? "" : `+${rows[p.dataIndex]?.gapToFastestSeconds.toFixed(3)}s`,
        },
      },
    ],
    animationDuration: 400,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(220, rows.length * 34) }}
      aria-label="Average race pace by driver"
    />
  );
}
