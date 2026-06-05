import { useEffect, useMemo, useRef } from "react";

type HowToPlayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPreferenceChange: (hideInFuture: boolean) => void;
  hideInFuture: boolean;
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function HowToPlayModal({
  isOpen,
  onClose,
  onPreferenceChange,
  hideInFuture,
}: HowToPlayModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const steps = useMemo(
      () => [
        "Spin first for a franchise and decade, then hire one eligible head coach from that revealed pool.",
        "After your bench boss is locked in, keep spinning for player pools and place each pick into one of the highlighted open slots they can actually play.",
        "Fill LW, C, RW, D1, D2, and G to trigger the season sim and see if your coach-led build can hit 84-0 in the classic chase or under the salary cap.",
      ],
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocus.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const nodes = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
        (node) => !node.hasAttribute("disabled"),
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-3 py-3 backdrop-blur-md sm:px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-glow"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-ice/70">How To Play</p>
            <h2 id="how-to-play-title" className="mt-2 font-display text-3xl uppercase tracking-[0.15em] text-white">
              Build an all-time lineup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
            aria-label="Close how to play modal"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
              >
                <div className="font-display text-2xl text-ice">{index + 1}</div>
                <p className="mt-2 leading-6">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-ember/20 bg-ember/10 p-4 text-sm text-slate-100">
            Ratings are on a 0-100 scale. Skaters now start from decade points bands, then separate further with points per game, games played, a slight goals-over-assists edge, and tiny MVP or Stanley Cup trophy bumps. Role tags like Sniper and Playmaker are still descriptive only, not hidden chemistry buffs.
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
            Imported franchise-era pools currently run from the 1970s through the 2020s. Player cards now use decade-specific stat slices, so a player's 1980s version can rate very differently from that same player's 1990s version. Forward eligibility is loosened carefully so left and right wings can swap, while only stronger long-career centers can flex to the wing. In cap mode, player cost is based on decade scoring output and the full roster must stay under $20.
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/90 px-5 py-4 sm:px-6">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={hideInFuture}
              onChange={(event) => onPreferenceChange(event.target.checked)}
              className="h-4 w-4 accent-[#9fe8ff]"
            />
            Don&apos;t show this tutorial again
          </label>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ice/20 bg-ice/10 px-5 py-3 text-sm uppercase tracking-[0.18em] text-ice transition hover:bg-ice hover:text-ink"
            >
              Start Testing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
