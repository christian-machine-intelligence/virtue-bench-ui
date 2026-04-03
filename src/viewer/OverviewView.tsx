import { useEffect, useState } from "react";

import {
  FRAME_ORDER,
  buildPromptText,
  titleCase,
  type ExampleKind,
  type FrameResponse,
  type ShowcaseDeck,
  type Summary,
  type SummaryVirtue,
  type VirtueItem,
} from "./model";
import { InfoPopover, PANEL_CLASS, SMALL_BUTTON_CLASS } from "./chrome";

type SummaryViewProps = {
  virtue: string;
  summary: Summary;
  virtueSummary: SummaryVirtue;
  showcaseDecks: ShowcaseDeck[];
  sharedFlipItems: VirtueItem[];
  stableFailureItems: VirtueItem[];
  onInspectItem: (itemId: number) => void;
};

export function SummaryView({
  virtue,
  summary,
  virtueSummary,
  showcaseDecks,
  sharedFlipItems,
  stableFailureItems,
  onInspectItem,
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
    <section className="mx-auto grid w-full max-w-[1200px] gap-5">
      <article className={[PANEL_CLASS, "overflow-hidden"].join(" ")}>
        <section className="px-6 py-6 md:px-8 md:py-7">
          <div className="grid gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Benchmark
            </p>
            <h2 className="max-w-[20ch] text-balance font-display text-[2.4rem] leading-none md:text-[3.05rem]">
              What VirtueBench asks
            </h2>
            <p className="max-w-[70ch] text-[15px] leading-7 text-stone-800">
              {virtueSummary.itemCount} questions for {titleCase(virtue)}. Each item forces an{" "}
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
              between the costly virtuous act and the tempting alternative already stocked with
              practical excuses. The model answers what it would actually do, then gives one
              sentence explaining why.
            </p>
          </div>
        </section>

        <ShowcaseBrowser
          summary={summary}
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
      </article>

      <section className="grid gap-3 px-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900">
            Flagged Items
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <QuickList
            title="Shared flips"
            count={virtueSummary.featuredSharedFlipCount}
            subtitle="Featured set misses under actual, recovers under resist."
            items={sharedFlipItems}
            onInspectItem={onInspectItem}
          />

          <QuickList
            title="Stable failures"
            count={virtueSummary.featuredStableFailureCount}
            subtitle="Featured set still misses under resist."
            items={stableFailureItems}
            onInspectItem={onInspectItem}
          />
        </div>
      </section>
    </section>
  );
}

function QuickList({
  title,
  count,
  subtitle,
  items,
  onInspectItem,
}: {
  title: string;
  count: number;
  subtitle: string;
  items: VirtueItem[];
  onInspectItem: (itemId: number) => void;
}) {
  return (
    <section className="grid gap-2 rounded-[20px] border border-line/80 bg-white/55 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900">
            {title}
          </h3>
          <p className="text-xs leading-5 text-ink-soft">{subtitle}</p>
        </div>
        <div className="rounded-full border border-line bg-white/80 px-2.5 py-1 text-[12px] font-medium tabular-nums text-stone-700">
          {count}
        </div>
      </div>

      <div className="grid">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onInspectItem(item.id)}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t border-line/70 py-2.5 text-left transition-colors first:border-t-0 hover:text-stone-900"
            >
              <div className="rounded-full bg-[#f3eee4] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-soft">
                {item.id}
              </div>
              <div className="line-clamp-1 pt-0.5 text-sm leading-5 text-stone-900">
                {item.source}
              </div>
              <div className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                Open
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-line bg-white/60 px-4 py-5 text-sm text-ink-soft">
            Nothing flagged here.
          </div>
        )}
      </div>
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
    <section className="border-t border-line/80 px-5 py-4">
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-[22px] border border-line bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          {decks.map((deck) => {
            const active = deck.kind === activeShowcaseKind;
            return (
              <button
                key={deck.kind}
                type="button"
                onClick={() => setActiveShowcaseKind(deck.kind)}
                className={[
                  "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-1.5 text-[13px] whitespace-nowrap transition-[transform,background-color,color] active:scale-[0.98]",
                  active
                    ? "bg-accent text-white shadow-[0_8px_18px_rgba(22,61,52,0.16)]"
                    : "text-stone-700 hover:bg-accent-soft/35",
                ].join(" ")}
              >
                {deck.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-3">
          <div className="grid gap-1">
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
            <h3 className="max-w-[34rem] text-balance text-lg font-medium leading-7 text-stone-900">
              {item.source}
            </h3>
          </div>

          <div className="flex items-center gap-2">
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

        <section className="overflow-hidden rounded-[20px] border border-line/80 bg-white/78">
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
              <div className="grid max-w-[72ch] gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
                  {option.virtuous ? "Virtuous choice" : "Tempting choice"}
                </span>
                <p className="text-sm leading-6 text-stone-800">{option.text}</p>
              </div>
            </div>
          ))}

          <div className="border-t border-line/70 px-4 py-3">
            <div className="mt-3 grid">
              {displayResponses.map(({ frame, response }, index) => (
                <div
                  key={`${selectedModel}-${frame}-${response.answer ?? "none"}`}
                  className={[index ? "border-t border-line/70 pt-3" : "", "pb-3 last:pb-0"].join(
                    " ",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 ? (
                      modelOptions.length > 1 ? (
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
                      )
                    ) : null}

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
                  </div>

                  <p className="mt-2 max-w-[72ch] text-sm leading-6 text-stone-800">
                    {response.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
