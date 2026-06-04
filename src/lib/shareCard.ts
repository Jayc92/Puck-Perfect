import { getPlayerById, getPlayerSeasonLabel, round } from "./utils";
import type { Coach, LineupAssignment, Player, SeasonResult } from "../types";

const CARD_WIDTH = 1080;
const HEADER_HEIGHT = 212;
const ROW_HEIGHT = 110;
const FOOTER_HEIGHT = 104;
const SIDE_PADDING = 36;

const SLOT_COLORS: Record<string, string> = {
  LW: "#ff8a5c",
  C: "#9fe8ff",
  RW: "#ffb15d",
  D1: "#6fd3ff",
  D2: "#8dd8ff",
  G: "#5df0d0",
};

const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) {
    return "#6df3c9";
  }
  if (grade.startsWith("B")) {
    return "#9fe8ff";
  }
  if (grade.startsWith("C")) {
    return "#ffd66e";
  }
  return "#ff8a5c";
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export const buildShareCardSvg = (
  result: SeasonResult,
  lineup: LineupAssignment,
  players: Player[],
  coach: Coach | null,
) => {
  const lineupEntries = Object.entries(lineup)
    .map(([slot, playerId]) => ({
      slot,
      player: getPlayerById(players, playerId),
    }))
    .filter((entry): entry is { slot: string; player: Player } => Boolean(entry.player));

  const coachRowHeight = coach ? ROW_HEIGHT : 0;
  const cardHeight =
    HEADER_HEIGHT + lineupEntries.length * ROW_HEIGHT + coachRowHeight + FOOTER_HEIGHT;
  const gradeColor = getGradeColor(result.grade);
  const totalOvr = Math.round(result.teamRating * 1.1);

  const rows = lineupEntries.map(({ slot, player }, index) => {
    const y = HEADER_HEIGHT + index * ROW_HEIGHT;
    const color = SLOT_COLORS[slot] ?? "#9fe8ff";
    const seasonLabel = truncate(getPlayerSeasonLabel(player), 30);

    return `
      <g transform="translate(${SIDE_PADDING}, ${y})">
        <rect x="0" y="0" width="${CARD_WIDTH - SIDE_PADDING * 2}" height="92" rx="22" fill="rgba(17,26,45,0.96)" stroke="rgba(255,255,255,0.07)" />
        <rect x="0" y="0" width="8" height="92" rx="8" fill="${color}" />
        <rect x="22" y="16" width="58" height="58" rx="16" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-opacity="0.28" />
        <text x="51" y="52" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#ffffff">${escapeXml(slot)}</text>
        <text x="104" y="40" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="22" font-weight="700" fill="#ffffff">${escapeXml(truncate(player.name, 28))}</text>
        <text x="104" y="68" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="16" letter-spacing="1.5" fill="${color}" fill-opacity="0.92">${escapeXml(seasonLabel)}</text>
      </g>
    `;
  }).join("");

  const coachRow = coach
    ? `
      <g transform="translate(${SIDE_PADDING}, ${HEADER_HEIGHT + lineupEntries.length * ROW_HEIGHT})">
        <rect x="0" y="0" width="${CARD_WIDTH - SIDE_PADDING * 2}" height="92" rx="22" fill="rgba(17,26,45,0.96)" stroke="rgba(255,255,255,0.07)" />
        <rect x="0" y="0" width="8" height="92" rx="8" fill="#7cf0da" />
        <rect x="22" y="16" width="58" height="58" rx="16" fill="#7cf0da" fill-opacity="0.2" stroke="#7cf0da" stroke-opacity="0.28" />
        <text x="51" y="52" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="#ffffff">HC</text>
        <text x="104" y="40" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="22" font-weight="700" fill="#ffffff">${escapeXml(truncate(coach.name, 28))}</text>
        <text x="104" y="68" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="16" letter-spacing="1.5" fill="#7cf0da" fill-opacity="0.92">${escapeXml(truncate(coach.roleTag, 30))}</text>
      </g>
    `
    : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${cardHeight}" viewBox="0 0 ${CARD_WIDTH} ${cardHeight}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#101a2d" />
          <stop offset="55%" stop-color="#0d1424" />
          <stop offset="100%" stop-color="#0a1020" />
        </linearGradient>
        <linearGradient id="iceGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#9fe8ff" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#7cf0da" stop-opacity="0.1" />
        </linearGradient>
      </defs>

      <rect width="${CARD_WIDTH}" height="${cardHeight}" fill="url(#bg)" />
      <rect x="0" y="0" width="${CARD_WIDTH}" height="96" fill="url(#iceGlow)" />

      <text x="${SIDE_PADDING}" y="50" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="18" letter-spacing="6" fill="rgba(159,232,255,0.72)">PROJECTED RECORD</text>
      <text x="${SIDE_PADDING}" y="142" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="92" font-weight="700" fill="#ffffff">${result.wins}-${result.losses}</text>
      <text x="${SIDE_PADDING + 325}" y="142" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="74" font-weight="700" fill="${gradeColor}">${escapeXml(result.grade)}</text>

      <text x="${CARD_WIDTH - 215}" y="50" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="18" letter-spacing="5" fill="rgba(225,232,242,0.72)">TEAM OVR</text>
      <text x="${CARD_WIDTH - 215}" y="138" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="72" font-weight="700" fill="#ffffff">${totalOvr}</text>
      <text x="${CARD_WIDTH - 215}" y="176" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="22" fill="rgba(225,232,242,0.8)">${escapeXml(round(result.teamRating, 1).toFixed(1))} rating</text>

      <line x1="${SIDE_PADDING}" x2="${CARD_WIDTH - SIDE_PADDING}" y1="${HEADER_HEIGHT - 20}" y2="${HEADER_HEIGHT - 20}" stroke="rgba(255,255,255,0.08)" />

      ${rows}
      ${coachRow}

      <line x1="${SIDE_PADDING}" x2="${CARD_WIDTH - SIDE_PADDING}" y1="${cardHeight - FOOTER_HEIGHT + 8}" y2="${cardHeight - FOOTER_HEIGHT + 8}" stroke="rgba(255,255,255,0.08)" />
      <text x="${SIDE_PADDING}" y="${cardHeight - 40}" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" font-weight="700" fill="#ffffff">Can you go ${result.seasonGames}-0?</text>
      <text x="${CARD_WIDTH - SIDE_PADDING}" y="${cardHeight - 40}" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" font-weight="700" text-anchor="end" fill="#7db3ff">Puck Perfect</text>
    </svg>
  `.trim();
};

const svgToPngBlob = async (svg: string) => {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();

  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to render share card image."));
  });

  image.src = svgUrl;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH * 2;
  canvas.height = image.height * 2;
  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(svgUrl);
    throw new Error("Canvas rendering is unavailable.");
  }

  context.scale(2, 2);
  context.drawImage(image, 0, 0);

  const pngBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );

  URL.revokeObjectURL(svgUrl);

  if (!pngBlob) {
    throw new Error("PNG export failed.");
  }

  return pngBlob;
};

export const downloadShareCard = async (
  result: SeasonResult,
  lineup: LineupAssignment,
  players: Player[],
  coach: Coach | null,
) => {
  const svg = buildShareCardSvg(result, lineup, players, coach);
  const blob = await svgToPngBlob(svg);
  const file = new File([blob], "puck-perfect-share-card.png", {
    type: "image/png",
  });

  const sharePayload = {
    files: [file],
    title: "Puck Perfect",
    text: `Puck Perfect: ${result.wins}-${result.losses}`,
  };

  if (
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    "canShare" in navigator &&
    navigator.canShare?.(sharePayload)
  ) {
    await navigator.share(sharePayload);
    return "shared" as const;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "puck-perfect-share-card.png";
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded" as const;
};
