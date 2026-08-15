export function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(3).padStart(6, "0")}`;
}

export function formatDelta(seconds: number, digits = 3): string {
  const sign = seconds > 0 ? "+" : seconds < 0 ? "−" : "";
  return `${sign}${Math.abs(seconds).toFixed(digits)}s`;
}

export function formatSeconds(seconds: number, digits = 3): string {
  return `${seconds.toFixed(digits)}s`;
}

export function driverLabel(driver: { code: string; fullName: string }): string {
  return driver.fullName && driver.fullName !== driver.code ? `${driver.fullName} (${driver.code})` : driver.code;
}
