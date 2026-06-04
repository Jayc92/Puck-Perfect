import { useEffect, useRef } from "react";

type PrivacyPolicyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function PrivacyPolicyModal({
  isOpen,
  onClose,
}: PrivacyPolicyModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-md"
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
        aria-labelledby="privacy-policy-title"
        className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-glow"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ice/70">Privacy Policy</p>
            <h2
              id="privacy-policy-title"
              className="mt-2 font-display text-3xl uppercase tracking-[0.15em] text-white"
            >
              MVP legal placeholder
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
            aria-label="Close privacy policy modal"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-6 text-slate-200">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            Puck Perfect is a frontend-only fan project. The current build stores game progress,
            tutorial preferences, and share-state helpers locally in your browser through
            `localStorage`. No account system or server-side user database is required for normal
            gameplay in this MVP.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-ice/70">
                Data we use
              </div>
              <p className="mt-2">
                Browser-local saved game state, season length preference, tutorial dismissal
                preference, and any information included in a shareable result link.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-ice/70">
                Data we do not ask for
              </div>
              <p className="mt-2">
                Names, email addresses, payment details, or private messages are not required by
                this build unless you later add third-party analytics, forms, or authentication.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-ice/70">
              Third-party services
            </div>
            <p className="mt-2">
              If you deploy this site on a host like Vercel or add analytics, those providers may
              collect technical request data such as IP address, browser type, or timestamp logs
              under their own terms. Review and customize this copy before public launch so it
              matches your actual hosting and analytics setup.
            </p>
          </div>

          <div className="rounded-2xl border border-ember/20 bg-ember/10 p-4">
            This privacy policy is a practical starter for testing, not legal advice. Before a
            wider launch, replace this placeholder with final language that matches your deployed
            stack, analytics, contact email, and jurisdiction.
          </div>
        </div>
      </div>
    </div>
  );
}
