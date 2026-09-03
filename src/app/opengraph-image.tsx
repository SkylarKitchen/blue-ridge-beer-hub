import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Blue Ridge Beer Hub — Waynesville, NC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card in the flyer system: badge on navy over the amber dot-grid.
 * The badge is embedded from public/logo.jpg so no network is needed.
 */
export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo.jpg"));
  const logoSrc = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 72,
        padding: "0 88px",
        backgroundColor: "#1b3560",
        backgroundImage:
          "radial-gradient(circle, rgba(235, 169, 61, 0.25) 3px, transparent 4px)",
        backgroundSize: "44px 44px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        width={360}
        height={360}
        alt=""
        style={{ borderRadius: 9999, transform: "rotate(3deg)" }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -2,
            textTransform: "uppercase",
            color: "#faf9f5",
          }}
        >
          Blue Ridge Beer Hub
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            fontWeight: 700,
            color: "#eba93d",
          }}
        >
          Waynesville’s community taproom &amp; bottle shop
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 26,
            color: "rgba(250, 249, 245, 0.75)",
          }}
        >
          21 East St · Downtown Waynesville, NC
        </div>
      </div>
    </div>,
    size,
  );
}
