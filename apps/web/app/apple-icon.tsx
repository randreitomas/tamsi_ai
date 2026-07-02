import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 36,
          background: "linear-gradient(135deg, #0e6b2e 0%, #1e8a4c 100%)",
          color: "#ffffff",
          fontSize: 108,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.04em"
        }}
      >
        T
      </div>
    ),
    size
  );
}
