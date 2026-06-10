import type { ImageResponseOptions } from "next/server";

const GOOGLE_FONTS_CSS =
  "https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Source+Sans+3:wght@400&display=swap";

const FONT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

export type ShareCardFontConfig = {
  displayFamily: string;
  bodyFamily: string;
  imageResponseFonts?: NonNullable<ImageResponseOptions["fonts"]>;
};

function parseFontUrl(css: string, family: string): string | null {
  const block = css.match(
    new RegExp(`font-family:\\s*['"]${family.replace(/ /g, "\\s")}['"][\\s\\S]*?url\\(([^)]+)\\)`),
  );
  if (!block) return null;
  return block[1].replace(/^['"]|['"]$/g, "");
}

function isValidFontBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const header = new TextDecoder().decode(buffer.slice(0, 4));
  if (header.startsWith("<!") || header.startsWith("<htm")) return false;
  return true;
}

async function fetchFontBuffer(url: string): Promise<ArrayBuffer | null> {
  const response = await fetch(url, {
    headers: { "User-Agent": FONT_USER_AGENT },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) return null;

  const buffer = await response.arrayBuffer();
  return isValidFontBuffer(buffer) ? buffer : null;
}

export async function loadShareCardFonts(): Promise<ShareCardFontConfig> {
  const fallback: ShareCardFontConfig = {
    displayFamily: "Georgia",
    bodyFamily: "system-ui, sans-serif",
  };

  try {
    const cssResponse = await fetch(GOOGLE_FONTS_CSS, {
      headers: { "User-Agent": FONT_USER_AGENT },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!cssResponse.ok) return fallback;

    const css = await cssResponse.text();
    const displayUrl = parseFontUrl(css, "Fraunces");
    const bodyUrl = parseFontUrl(css, "Source Sans 3");
    if (!displayUrl || !bodyUrl) return fallback;

    const [display, body] = await Promise.all([
      fetchFontBuffer(displayUrl),
      fetchFontBuffer(bodyUrl),
    ]);
    if (!display || !body) return fallback;

    return {
      displayFamily: "Fraunces",
      bodyFamily: "Source Sans 3",
      imageResponseFonts: [
        { name: "Fraunces", data: display, weight: 700, style: "normal" },
        { name: "Source Sans 3", data: body, weight: 400, style: "normal" },
      ],
    };
  } catch {
    return fallback;
  }
}
