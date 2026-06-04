import { useState } from "react";
import { downloadShareCard } from "../lib/shareCard";
import type { LineupAssignment, Player, SeasonResult } from "../types";

type ShareButtonProps = {
  summary: string;
  shareUrl: string;
  result: SeasonResult;
  lineup: LineupAssignment;
  players: Player[];
};

export function ShareButton({ summary, shareUrl, result, lineup, players }: ShareButtonProps) {
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
      await downloadShareCard(result, lineup, players);
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
        className="rounded-full border border-ice/20 bg-ice/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-ice transition hover:bg-ice hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Share or download result card image"
      >
        {sharing ? "Preparing Card..." : sharedCard ? "Card Ready!" : "Share Card"}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
        aria-label="Copy result summary and share link"
      >
        {copied ? "Copied!" : "Copy Text"}
      </button>
    </div>
  );
}
