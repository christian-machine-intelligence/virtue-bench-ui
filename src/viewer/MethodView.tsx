import { frameSort, type OverviewVirtue, type ShowcaseSelection, type Summary } from "./model";
import { ShowcaseBrowser } from "./OverviewView";

const FRAME_KIND_ORDER = ["measurement", "interpretive", "coached"] as const;
const FRAME_KIND_EXPLANATIONS: Record<string, string> = {
  measurement: "default test and stripped baseline",
  interpretive: "changes what the model is told to foreground",
  coached: "explicit directional push",
};

type MethodViewProps = {
  virtue: string;
  summary: Summary;
  overviewVirtue: OverviewVirtue;
  showcase: ShowcaseSelection;
  onInspectItem: (itemId: number) => void;
  onSetShowcase: (next: ShowcaseSelection) => void;
};

export function MethodView({
  virtue,
  summary,
  overviewVirtue,
  showcase,
  onInspectItem,
  onSetShowcase,
}: MethodViewProps) {
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
  const frameGroups = FRAME_KIND_ORDER.map((kind) => ({
    kind,
    frames: frameIds.filter((frame) => summary.frames[frame]?.kind === kind),
  })).filter((group) => group.frames.length > 0);
  const methodSummary = hasResist
    ? "This page separates default behavior from prompt steerability."
    : "This page checks how much hidden steering is already inside the default frame.";

  return (
    <section className="mx-auto grid w-full max-w-[1380px] gap-8">
      <section className="grid gap-5 px-2 pt-3">
        <div className="grid max-w-[74rem] gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] xl:gap-8 xl:items-start">
          <div className="grid gap-4">
            <h2 className="max-w-[14ch] text-balance font-display text-[3rem] leading-[0.96] md:text-[4rem] xl:text-[4.3rem]">
              How much does the system prompt move the answer?
            </h2>
            <div className="grid max-w-[60ch] gap-3 text-[16px] leading-7 text-stone-800 md:text-[17px] md:leading-8">
              <p>Same scenario. Same options. Only the frame changes.</p>
              <p>{methodSummary}</p>
              {hasResist ? (
                <p>
                  In Courage, the default miss is often practical preservation: retreat dressed up
                  as wisdom.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 xl:pt-1">
            <div className="border-t border-line/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Frame Types
              </p>
              <p className="mt-1 text-[14px] leading-6 text-stone-800">
                Same dilemma. Same answer format. Frames only change what the model is told to
                foreground.
              </p>
            </div>

            <div className="grid gap-3">
              {frameGroups.map((group) => (
                <section key={group.kind} className="border-t border-line/70 pt-3">
                  <div className="grid gap-2">
                    <div className="grid gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                        {group.kind}
                      </p>
                      <p className="text-[14px] leading-6 text-stone-800">
                        {FRAME_KIND_EXPLANATIONS[group.kind]}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.frames.map((frame) => (
                        <span
                          key={frame}
                          className="rounded-full border border-line bg-white/70 px-3 py-1 text-[12px] font-medium text-stone-800"
                        >
                          {summary.frames[frame].label}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 px-2">
        {hasResist && hasTransitionDeck ? (
          <div className="grid gap-2 border-t border-line/70 pt-4 text-sm leading-6 text-stone-800 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Shared Flip
              </p>
              <p className="mt-1">A stronger frame moves the answer.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Stable Failure
              </p>
              <p className="mt-1">Even a stronger frame cannot move it.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Read It As
              </p>
              <p className="mt-1">First read: steerability. Second read: moral signal.</p>
            </div>
          </div>
        ) : null}

        {!hasResist || !hasTransitionDeck ? (
          <div className="border-t border-line/70 pt-4 text-sm leading-6 text-stone-800">
            V1 coverage is uneven. Courage is where the stronger steering comparisons live right
            now. The other virtues mostly show the lighter actual-versus-bare baseline.
          </div>
        ) : null}
      </section>

      <ShowcaseBrowser
        summary={summary}
        decks={overviewVirtue.decks}
        selection={showcase}
        onInspectItem={onInspectItem}
        onSelectionChange={onSetShowcase}
        variant="method"
      />
    </section>
  );
}
