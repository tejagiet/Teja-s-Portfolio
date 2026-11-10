import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Teja Manikanta").slice(0, 110);
  const subtitle = (
    searchParams.get("subtitle") || "Full-Stack Developer · Software Engineer"
  ).slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111114",
          padding: "70px",
          color: "#faf9f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "14px",
              background: "#faf9f6",
              color: "#111114",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            TM
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "22px", fontWeight: 600 }}>Teja Manikanta</span>
            <span style={{ fontSize: "15px", color: "#a1a1aa" }}>tejamanikanta.dev</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "58px",
              lineHeight: 1.1,
              fontWeight: 650,
              letterSpacing: "-0.04em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "24px", color: "#a1a1aa" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: "120px", height: "4px", background: "#6366f1", borderRadius: "999px" }} />
          <span style={{ fontSize: "16px", color: "#71717a" }}>Portfolio · Projects · Resume</span>
        </div>
      </div>
    ),
    size,
  );
}
