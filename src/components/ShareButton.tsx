import { useState } from "react";
import { downloadShareCard } from "../lib/shareCard";
import type { Coach, LineupAssignment, Player, SeasonResult } from "../types";

type ShareButtonProps = {
  summary: string;
  shareUrl: string;
  result: SeasonResult;
  lineup: LineupAssignment;
  players: Player[];
  coach: Coach | null;
};

export function ShareButton({
  summary,
  shareUrl,
  result,
  lineup,
  players,
  coach,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharedCard, setSharedCard] = useState(false);

  const handleCopy = async () => {
    const payload = `${summary}\nPlay it here: ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShareCard = async () => {
    setSharing(true);
    try {
      await downloadShareCard(result, lineup, players, coach);
      setSharedCard(true);
      window.setTimeout(() => setSharedCard(false), 2200);
    } catch {
      setSharedCard(false);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleShareCard}
        disabled={sharing}
        className="rounded-full border border-ice/20 bg-ice/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-ice transition duration-200 motion-safe:hover:-translate-y-0.5 hover:bg-ice hover:text-ink hover:shadow-[0_12px_24px_rgba(159,232,255,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Share or download result card image"
      >
        {sharing ? "Preparing Card..." : sharedCard ? "Card Ready!" : "Share Card"}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition duration-200 motion-safe:hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_12px_24px_rgba(8,19,35,0.24)]"
        aria-label="Copy result summary and share link"
      >
        {copied ? "Copied!" : "Copy Text"}
      </button>
    </div>
  );
}
