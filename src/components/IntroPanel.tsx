type IntroPanelProps = {
  seasonGames: 82 | 84;
  onStart: (seasonGames?: 82 | 84) => void;
  onOpenHowToPlay: () => void;
};

export function IntroPanel({
  seasonGames,
  onStart,
  onOpenHowToPlay,
}: IntroPanelProps) {
  return (
    <section className="mx-auto max-w-5xl rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-5 shadow-glow sm:p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.34em] text-ice/70">Choose Your Chase</p>
        <h2 className="mt-4 font-display text-4xl uppercase tracking-[0.08em] text-white sm:text-5xl">
          Build a perfect season
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
          Start by hiring a head coach, then draft one all-time hockey legend at a time from randomized franchise-era pools and see if your roster can survive a full regular season without a single loss.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ModeCard
          eyebrow="Classic Run"
          title="82-game pursuit"
          description="The standard challenge. Build a lineup aimed at the modern perfect regular season benchmark."
          accent="from-ice/30 via-aurora/12 to-transparent"
          buttonLabel="Start 82-Game Draft"
          onClick={() => onStart(82)}
          active={seasonGames === 82}
        />
        <ModeCard
          eyebrow="Marathon Run"
          title="84-game pursuit"
          description="A longer chase for players who want a slightly harsher path and a more demanding perfect record."
          accent="from-ember/28 via-ember/10 to-transparent"
          buttonLabel="Start 84-Game Draft"
          onClick={() => onStart(84)}
          active={seasonGames === 84}
        />
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[1.6rem] border border-white/10 bg-slate-950/40 px-5 py-4 sm:flex-row">
        <div>
          <div className="text-xs uppercase tracking-[0.26em] text-ice/70">Draft Format</div>
          <div className="mt-2 text-sm leading-6 text-slate-200">
            Seven rounds. No duplicates. The first round locks in a head coach, then the next six spins build out your starting lineup. Once a franchise-era prompt lands, you must draft from that pool. Wingers can flex across both sides, and some centers can slide to wing.
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenHowToPlay}
          className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
        >
          Review How To Play
        </button>
      </div>
    </section>
  );
}

type ModeCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  buttonLabel: string;
  onClick: () => void;
  active: boolean;
};

function ModeCard({
  eyebrow,
  title,
  description,
  accent,
  buttonLabel,
  onClick,
  active,
}: ModeCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[1.9rem] border p-6 ${
        active
          ? "border-ice/30 bg-white/[0.08]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative flex h-full flex-col">
        <div className="inline-flex w-fit rounded-full border border-white/10 bg-slate-950/65 px-3 py-1 text-xs uppercase tracking-[0.24em] text-ice/80">
          {eyebrow}
        </div>
        <h3 className="mt-5 font-display text-3xl uppercase tracking-[0.06em] text-white">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-200">
          {description}
        </p>
        <div className="mt-8 flex-1" />
        <button
          type="button"
          onClick={onClick}
          className="rounded-[1.1rem] bg-gradient-to-r from-ember to-[#ff9c47] px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-ink transition hover:brightness-110"
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
