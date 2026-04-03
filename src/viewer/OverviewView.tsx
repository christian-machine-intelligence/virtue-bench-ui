import { useEffect, useState } from "react";

import {
  FRAME_ORDER,
  buildPromptText,
  type ExampleKind,
  type FrameResponse,
  type ShowcaseDeck,
  type Summary,
  type SummaryVirtue,
  type VirtueItem,
} from "./model";
import { InfoPopover, PANEL_CLASS, SMALL_BUTTON_CLASS } from "./chrome";

const VIRTUE_PRIMER = [
  {
    name: "Prudence",
    summary: "sees clearly before acting",
    mean: "between impulsiveness and drift",
  },
  {
    name: "Justice",
    summary: "gives others what is due",
    mean: "between partiality and neglect",
  },
  {
    name: "Courage",
    summary: "stands firm under threat",
    mean: "between cowardice and recklessness",
  },
  {
    name: "Temperance",
    summary: "orders appetite and desire",
    mean: "between indulgence and numb severity",
  },
] as const;

type SummaryViewProps = {
  virtue: string;
  summary: Summary;
  virtueSummary: SummaryVirtue;
  showcaseDecks: ShowcaseDeck[];
  onInspectItem: (itemId: number) => void;
  onSelectVirtue: (virtue: string) => void;
};

export function SummaryView({
  virtue,
  summary,
  virtueSummary,
  showcaseDecks,
  onInspectItem,
  onSelectVirtue,
}: SummaryViewProps) {
  const [activeShowcaseKind, setActiveShowcaseKind] = useState<ExampleKind>("benchmark");
  const [showcaseIndices, setShowcaseIndices] = useState<Record<ExampleKind, number>>({
    benchmark: 0,
    sharedFlip: 0,
    stableFailure: 0,
  });

  useEffect(() => {
    setActiveShowcaseKind(showcaseDecks[0]?.kind ?? "benchmark");
    setShowcaseIndices({ benchmark: 0, sharedFlip: 0, stableFailure: 0 });
  }, [virtue]);

  const activeDeck =
    showcaseDecks.find((deck) => deck.kind === activeShowcaseKind) ?? showcaseDecks[0] ?? null;
  const activeIndex = activeDeck ? showcaseIndices[activeDeck.kind] % activeDeck.entries.length : 0;
  const activeEntry = activeDeck ? activeDeck.entries[activeIndex] : null;
  const totalItemCount = Object.values(summary.virtues).reduce(
    (count, current) => count + current.itemCount,
    0,
  );

  const advanceShowcase = () => {
    if (!activeDeck || activeDeck.entries.length < 2) return;

    setShowcaseIndices((current) => ({
      ...current,
      [activeDeck.kind]: (current[activeDeck.kind] + 1) % activeDeck.entries.length,
    }));
  };

  const retreatShowcase = () => {
    if (!activeDeck || activeDeck.entries.length < 2) return;

    setShowcaseIndices((current) => ({
      ...current,
      [activeDeck.kind]:
        (current[activeDeck.kind] - 1 + activeDeck.entries.length) % activeDeck.entries.length,
    }));
  };

  return (
    <section className="mx-auto grid w-full max-w-[1380px] gap-8">
      <section className="grid gap-8 px-2 pt-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)] xl:items-start">
        <div className="grid gap-4">
          <h2 className="max-w-[13ch] text-balance font-display text-[3rem] leading-[0.96] md:text-[4rem] xl:text-[4.5rem]">
            Can a model choose virtue under pressure?
          </h2>
          <div className="grid max-w-[62ch] gap-4 text-[17px] leading-8 text-stone-800">
            <p>
              VirtueBench is not about catching overt evil. Labs already optimize heavily for that.
              It asks whether a model still chooses the good when comfort, safety, and
              self-preservation pull the other way.
            </p>
            <p>
              It contains {totalItemCount} paired scenarios across Prudence, Justice, Courage, and
              Temperance, drawing on Ambrose, Augustine, and Aquinas.
            </p>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 text-[14px] leading-6 text-stone-800 sm:grid-cols-2 xl:grid-cols-1">
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Role
            </p>
            <p className="mt-1">
              The model answers as the decision-maker, not as an outside judge describing what is
              good in theory.
            </p>
          </div>
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Stakes
            </p>
            <p className="mt-1">
              The virtuous option can carry real costs: money, reputation, safety, comfort, or
              future opportunity.
            </p>
          </div>
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Output
            </p>
            <p className="mt-1">
              The model must make an{" "}
              <span className="inline-flex items-center gap-1 align-baseline">
                <span>A/B choice</span>
                <InfoPopover
                  label="Explain answer randomization"
                  widthClass="w-[min(18rem,calc(100vw-3rem))]"
                  align="left"
                >
                  The export randomizes whether the virtuous answer appears as A or B, so scores are
                  not driven by answer position.
                </InfoPopover>
              </span>{" "}
              and give one sentence explaining why.
            </p>
          </div>
          <div className="border-t border-line/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Temptation
            </p>
            <p className="mt-1">
              The tempting answer is written to sound prudent, responsible, and self-protective, not
              openly vicious.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-2">
        <div className="grid max-w-[66ch] gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            The Four Virtues
          </p>
          <p className="text-[15px] leading-7 text-stone-800">
            Virtue is a golden mean: not too little, not too much, but rightly ordered character
            over time.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
          {VIRTUE_PRIMER.map((entry) => {
            const active = entry.name.toLowerCase() === virtue;
            const entryVirtue = entry.name.toLowerCase();

            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => onSelectVirtue(entryVirtue)}
                className={[
                  "min-h-24 border-t pt-3 text-left transition-[transform,color,background-color,border-color] hover:bg-white/35 active:scale-[0.99]",
                  active ? "border-accent/45" : "border-line/70",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <p
                    className={[
                      "text-[11px] font-semibold uppercase tracking-[0.12em]",
                      active ? "text-accent" : "text-ink-soft",
                    ].join(" ")}
                  >
                    {entry.name}
                  </p>
                  {active ? (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[15px] font-medium leading-6 text-stone-900">
                  {entry.summary}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-700">{entry.mean}</p>
              </button>
            );
          })}
        </div>
      </section>

      <ShowcaseBrowser
        summary={summary}
        virtueSummary={virtueSummary}
        decks={showcaseDecks}
        activeDeck={activeDeck}
        activeEntry={activeEntry}
        activeIndex={activeIndex}
        activeShowcaseKind={activeShowcaseKind}
        setActiveShowcaseKind={setActiveShowcaseKind}
        retreatShowcase={retreatShowcase}
        advanceShowcase={advanceShowcase}
        onInspectItem={onInspectItem}
      />
    </section>
  );
}

function getBenchmarkResponse(frames: Record<string, FrameResponse>) {
  const order = Array.from(new Set(["resist", "actual", ...FRAME_ORDER]));

  for (const frame of order) {
    const response = frames[frame];
    if (response?.answer && response.rationale) {
      return [{ frame, label: "Sample answer", response }];
    }
  }

  return null;
}

function getShowcaseModelOptions(item: VirtueItem, kind: ExampleKind) {
  return Object.entries(item.responses)
    .map(([model, payload]) => {
      if (kind === "benchmark") {
        const responses = getBenchmarkResponse(payload.frames);
        return responses ? { model, responses } : null;
      }

      const actual = payload.frames.actual;
      const resist = payload.frames.resist;
      if (!actual || !resist) return null;

      if (kind === "sharedFlip" && (actual.correct || !resist.correct)) return null;
      if (kind === "stableFailure" && resist.correct) return null;

      return {
        model,
        responses: [
          { frame: "actual", label: "Actual", response: actual },
          { frame: "resist", label: "Resist", response: resist },
        ],
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        model: string;
        responses: { frame: string; label: string; response: FrameResponse }[];
      } => Boolean(entry),
    );
}

function ShowcaseBrowser({
  summary,
  virtueSummary,
  decks,
  activeDeck,
  activeEntry,
  activeIndex,
  activeShowcaseKind,
  setActiveShowcaseKind,
  retreatShowcase,
  advanceShowcase,
  onInspectItem,
}: {
  summary: Summary;
  virtueSummary: SummaryVirtue;
  decks: ShowcaseDeck[];
  activeDeck: ShowcaseDeck | null;
  activeEntry: ShowcaseDeck["entries"][number] | null;
  activeIndex: number;
  activeShowcaseKind: ExampleKind;
  setActiveShowcaseKind: (kind: ExampleKind) => void;
  retreatShowcase: () => void;
  advanceShowcase: () => void;
  onInspectItem: (itemId: number) => void;
}) {
  if (!activeDeck || !activeEntry) {
    return (
      <section className="border-t border-line/80 px-5 py-4">
        <div className="text-sm text-ink-soft">No inline examples available.</div>
      </section>
    );
  }

  const { item, model, responses } = activeEntry;
  const modelOptions = getShowcaseModelOptions(item, activeShowcaseKind);
  const [selectedModel, setSelectedModel] = useState(model);

  useEffect(() => {
    const fallbackModel =
      modelOptions.find((entry) => entry.model === model)?.model ?? modelOptions[0]?.model ?? model;
    setSelectedModel(fallbackModel);
  }, [activeShowcaseKind, item.id, model]);

  const activeModelEntry =
    modelOptions.find((entry) => entry.model === selectedModel) ??
    modelOptions.find((entry) => entry.model === model) ??
    null;
  const displayResponses = activeModelEntry?.responses ?? responses;
  const options = [
    { key: "A", text: item.optionA, virtuous: item.target === "A" },
    { key: "B", text: item.optionB, virtuous: item.target === "B" },
  ];

  return (
    <article className={[PANEL_CLASS, "overflow-hidden"].join(" ")}>
      <section className="mx-auto max-w-[1160px] px-5 py-5 md:px-7 md:py-6">
        <div className="grid gap-4 border-b border-line/70 pb-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="grid gap-3">
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="inline-flex min-w-max rounded-[22px] border border-line bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                {decks.map((deck) => {
                  const active = deck.kind === activeShowcaseKind;
                  const count =
                    deck.kind === "sharedFlip"
                      ? virtueSummary.featuredSharedFlipCount
                      : deck.kind === "stableFailure"
                        ? virtueSummary.featuredStableFailureCount
                        : null;
                  return (
                    <button
                      key={deck.kind}
                      type="button"
                      onClick={() => setActiveShowcaseKind(deck.kind)}
                      className={[
                        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-[13px] whitespace-nowrap transition-[transform,background-color,color] active:scale-[0.98]",
                        active
                          ? "bg-accent text-white shadow-[0_8px_18px_rgba(22,61,52,0.16)]"
                          : "text-stone-700 hover:bg-accent-soft/35",
                      ].join(" ")}
                    >
                      <span>{deck.label}</span>
                      {count != null ? (
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                            active
                              ? "bg-white/18 text-white"
                              : "bg-white/82 text-ink-soft ring-1 ring-line",
                          ].join(" ")}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid min-h-[4.75rem] gap-1 md:min-h-[5.25rem]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                <span>Item {item.id}</span>
                <span className="rounded-full bg-white/82 px-2 py-0.5 text-[10px] tabular-nums text-ink-soft ring-1 ring-line">
                  {activeIndex + 1} of {activeDeck.entries.length}
                </span>
                <InfoPopover
                  label={`Show raw prompt for item ${item.id}`}
                  widthClass="w-[min(24rem,calc(100vw-3rem))]"
                  align="left"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    Raw prompt
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-stone-800">
                    {buildPromptText(item)}
                  </pre>
                </InfoPopover>
              </div>
              <h3 className="max-w-[32rem] text-balance text-[1.35rem] font-medium leading-8 text-stone-900 md:text-[1.55rem]">
                {item.source}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 md:pt-1">
            {activeDeck.entries.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={retreatShowcase}
                  aria-label="Previous example"
                  title="Previous example"
                  className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-white text-stone-700 transition-[transform,background-color,border-color,color] hover:border-accent/30 hover:bg-accent-soft/40 hover:text-stone-900 active:scale-[0.97]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15.5 10h-10" />
                    <path d="m9.5 6-4 4 4 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={advanceShowcase}
                  aria-label="Next example"
                  title="Next example"
                  className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-white text-stone-700 transition-[transform,background-color,border-color,color] hover:border-accent/30 hover:bg-accent-soft/40 hover:text-stone-900 active:scale-[0.97]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4.5 10h10" />
                    <path d="m10.5 6 4 4-4 4" />
                  </svg>
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => onInspectItem(item.id)}
              className={SMALL_BUTTON_CLASS}
            >
              Inspect
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:items-stretch">
          <section className="overflow-hidden rounded-[22px] border border-line/80 bg-white/74 xl:grid xl:min-h-[20.5rem] xl:grid-rows-[auto_minmax(0,1fr)]">
            <div className="border-b border-line/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Scenario
              </p>
            </div>
            <div className="min-h-0 xl:overflow-auto">
              {options.map((option) => (
                <div
                  key={option.key}
                  className={[
                    "flex gap-3 px-4 py-3 first:border-t-0",
                    option.key === "B" ? "border-t border-line/70" : "",
                    option.virtuous ? "bg-ok-soft/30" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      option.virtuous
                        ? "bg-ok text-white"
                        : "border border-line bg-white text-stone-700",
                    ].join(" ")}
                  >
                    {option.key}
                  </span>
                  <div className="grid max-w-[46ch] gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
                      {option.virtuous ? "Virtuous choice" : "Tempting choice"}
                    </span>
                    <p className="text-sm leading-6 text-stone-800">{option.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-line/70 pt-4 xl:grid xl:min-h-[20.5rem] xl:grid-rows-[auto_minmax(0,1fr)] xl:border-t-0 xl:border-l xl:pl-5">
            <div className="flex flex-wrap items-center gap-2">
              {modelOptions.length > 1 ? (
                <select
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  aria-label="Choose model for example answer"
                  className="h-8 max-w-[12rem] rounded-full border border-line bg-white px-3 text-[13px] font-medium text-stone-900 outline-none transition-[border-color,box-shadow] focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(22,61,52,0.08)]"
                >
                  {modelOptions.map((entry) => (
                    <option key={entry.model} value={entry.model}>
                      {entry.model}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-stone-900">
                  {activeModelEntry?.model ?? model}
                </p>
              )}
            </div>

            <div className="mt-4 min-h-0 xl:overflow-auto xl:pr-1">
              <div className="grid gap-3 content-start">
                {displayResponses.map(({ frame, response }, index) => (
                  <div
                    key={`${selectedModel}-${frame}-${response.answer ?? "none"}`}
                    className={[index ? "border-t border-line/70 pt-3" : "", "pb-3 last:pb-0"].join(
                      " ",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-line bg-white px-3 py-1.5 font-medium text-stone-700">
                        {summary.frames[frame].label}
                      </span>
                      <span
                        className={[
                          "rounded-full px-3 py-1.5 font-semibold",
                          response.correct ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger",
                        ].join(" ")}
                      >
                        {response.answer} {response.correct ? "correct" : "wrong"}
                      </span>
                    </div>

                    <p className="mt-3 max-w-[32ch] text-sm leading-7 text-stone-800">
                      {response.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </article>
  );
}
