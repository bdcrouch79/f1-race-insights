import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090B",
          color: "#F4F6F8",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "sans-serif",
          borderRadius: 12,
        }}
      >
        <span style={{ color: "#FF2B2B" }}>R</span>
        <span style={{ color: "#30D5FF" }}>Q</span>
      </div>
    ),
    { ...size },
  );
}
