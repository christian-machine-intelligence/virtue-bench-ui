import { FrameInfoLabel } from "./chrome";
import { frameSort, type OverviewVirtue, type Summary } from "./model";
import { ShowcaseBrowser } from "./OverviewView";

type MethodViewProps = {
  virtue: string;
  summary: Summary;
  overviewVirtue: OverviewVirtue;
  onInspectItem: (itemId: number) => void;
};

export function MethodView({ virtue, summary, overviewVirtue, onInspectItem }: MethodViewProps) {
  const frameIds = Array.from(
    new Set(
      summary.models
        .filter((model) => model.virtues.includes(virtue))
        .flatMap((model) => model.frames),
    ),
  ).sort(frameSort);
  const hasResist = frameIds.includes("resist");
  const hasTransitionDeck =
    overviewVirtue.decks.some((deck) => deck.kind === "sharedFlip") ||
    overviewVirtue.decks.some((deck) => deck.kind === "stableFailure");

  return (
    <section className="mx-auto grid w-full max-w-[1380px] gap-8">
      <section className="grid gap-8 px-2 pt-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)] xl:items-start">
        <div className="grid gap-4">
          <h2 className="max-w-[14ch] text-balance font-display text-[3rem] leading-[0.96] md:text-[4rem] xl:text-[4.5rem]">
            How the prompt framing moves the result
          </h2>
          <div className="grid max-w-[64ch] gap-4 text-[17px] leading-8 text-stone-800">
            <p>
              Summary asks the headline question. Method slows the instrument down: same dilemma,
              different prompt steer, then the resulting answer and rationale.
            </p>
            <p>
              Courage carries the richest frame set in v1 because the break is clearest there: when
              the good gets costly, models often call retreat stewardship. Read the direct actual
              case first, then compare shared flips and stable failures under resist framing.
            </p>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 text-[14px] leading-6 text-stone-800 sm:grid-cols-2 xl:grid-cols-1">
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Actual
            </p>
            <p className="mt-1">
              The default decision frame. This is the clean baseline for the homepage example.
            </p>
          </div>
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Shared flip
            </p>
            <p className="mt-1">Same item, same model. Actual misses. Resist recovers.</p>
          </div>
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Stable failure
            </p>
            <p className="mt-1">Even with the resist steer, the tempting answer still wins.</p>
          </div>
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Read It
            </p>
            <p className="mt-1">
              Watch what changed in the prompt, then check whether the answer and rationale moved
              with it.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-2">
        <div className="grid max-w-[66ch] gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Frame Lenses
          </p>
          <p className="text-[15px] leading-7 text-stone-800">
            These are the prompt steers exported for this virtue. Actual is the anchor. Resist is
            the stress test.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {frameIds.map((frame, index) => (
            <article
              key={frame}
              className="rounded-[22px] border border-line/80 bg-white/72 px-4 py-4"
            >
              <FrameInfoLabel
                frame={frame}
                label={summary.frames[frame].label}
                kind={summary.frames[frame].kind}
                blurb={summary.frames[frame].blurb}
                align={index % 3 === 2 ? "right" : "left"}
              />
            </article>
          ))}
        </div>

        {!hasResist || !hasTransitionDeck ? (
          <div className="rounded-[22px] border border-line/80 bg-white/66 px-4 py-4 text-sm leading-6 text-stone-800">
            This virtue currently has less frame coverage in the export. Courage shows the clearest
            actual-versus-resist transitions in v1.
          </div>
        ) : null}
      </section>

      <ShowcaseBrowser
        summary={summary}
        decks={overviewVirtue.decks}
        onInspectItem={onInspectItem}
        variant="method"
      />
    </section>
  );
}
