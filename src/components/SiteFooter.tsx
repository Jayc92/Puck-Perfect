type SiteFooterProps = {
  onOpenHowToPlay: () => void;
  onOpenPrivacyPolicy: () => void;
};

export function SiteFooter({
  onOpenHowToPlay,
  onOpenPrivacyPolicy,
}: SiteFooterProps) {
  return (
    <footer className="mt-8 rounded-[1.75rem] border border-white/10 bg-slate-950/45 px-5 py-5 text-center shadow-glow">
      <p className="text-sm leading-6 text-slate-300">
        Puck Perfect is an independent hockey draft game and is not affiliated with or endorsed by
        the NHL or its teams.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenHowToPlay}
          className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.12]"
        >
          How To Play
        </button>
        <button
          type="button"
          onClick={onOpenPrivacyPolicy}
          className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.12]"
        >
          Privacy Policy
        </button>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
        Customize the privacy copy before public launch if you add analytics, forms, or accounts.
      </p>
    </footer>
  );
}
