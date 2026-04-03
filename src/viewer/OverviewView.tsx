import { useEffect, useState } from "react";

import {
  FRAME_ORDER,
  buildPromptText,
  titleCase,
  type ExampleKind,
  type FrameResponse,
  type ShowcaseDeck,
  type Summary,
  type SummaryModel,
  type SummaryVirtue,
  type VirtueItem,
} from "./model";
import { FrameInfoLabel, InfoPopover, PANEL_CLASS } from "./chrome";

type OverviewViewProps = {
  virtue: string;
  summary: Summary;
  virtueSummary: SummaryVirtue;
  availableModels: SummaryModel[];
  frames: string[];
  showcaseDecks: ShowcaseDeck[];
  sharedFlipItems: VirtueItem[];
  stableFailureItems: VirtueItem[];
  onInspectItem: (itemId: number) => void;
};

export function OverviewView({
  virtue,
  summary,
  virtueSummary,
  availableModels,
  frames,
  showcaseDecks,
  sharedFlipItems,
  stableFailureItems,
  onInspectItem,
}: OverviewViewProps) {
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
  const activeEntry = activeDeck
    ? activeDeck.entries[showcaseIndices[activeDeck.kind] % activeDeck.entries.length]
    : null;

  const advanceShowcase = () => {
    if (!activeDeck || activeDeck.entries.length < 2) return;

    setShowcaseIndices((current) => ({
      ...current,
      [activeDeck.kind]: (current[activeDeck.kind] + 1) % activeDeck.entries.length,
    }));
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
      <aside
        className={[PANEL_CLASS, "overflow-hidden xl:sticky xl:top-4 xl:self-start"].join(" ")}
      >
        <section className="px-5 py-5">
          <div className="grid gap-2">
            <h2 className="font-display text-[2.1rem] leading-none">What VirtueBench asks</h2>
            <p className="text-sm leading-6 text-stone-800">
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
          activeShowcaseKind={activeShowcaseKind}
          setActiveShowcaseKind={setActiveShowcaseKind}
          advanceShowcase={advanceShowcase}
          onInspectItem={onInspectItem}
        />
      </aside>

      <div className="grid content-start gap-4 xl:self-start">
        <section className={[PANEL_CLASS, "overflow-hidden"].join(" ")}>
          <div className="border-b border-line px-5 py-4 md:px-6">
            <h2 className="font-display text-3xl md:text-[2.35rem]">Scores</h2>
          </div>

          <div className="relative">
            <div className="overflow-auto overscroll-contain max-h-[22rem] md:max-h-[24rem] xl:max-h-[26rem]">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                    <th className="sticky left-0 top-0 z-30 min-w-[220px] border-b border-line bg-[#fbf8f2]/95 px-4 py-3 backdrop-blur">
                      Models ({availableModels.length})
                    </th>
                    {frames.map((frame, index) => (
                      <th
                        key={frame}
                        className="sticky top-0 z-20 min-w-[112px] border-b border-line bg-[#fbf8f2]/95 px-4 py-3 text-center backdrop-blur"
                      >
                        <FrameInfoLabel
                          frame={frame}
                          label={summary.frames[frame].label}
                          kind={summary.frames[frame].kind}
                          blurb={summary.frames[frame].blurb}
                          compact
                          align={index >= frames.length - 2 ? "right" : "left"}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availableModels.map((model) => {
                    const scores = virtueSummary.scores[model.display] ?? {};
                    return (
                      <tr key={model.display} className="text-stone-800">
                        <td className="sticky left-0 z-10 border-b border-line bg-[#fffdf9] px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.display}</span>
                            {model.featured ? (
                              <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </td>
                        {frames.map((frame) => (
                          <td
                            key={frame}
                            className="border-b border-line px-4 py-3 text-center tabular-nums text-stone-700"
                          >
                            {scores[frame] != null ? scores[frame].toFixed(2) : "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {availableModels.length > 8 ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-[#fbf8f2] via-[#fbf8f2]/90 to-transparent px-4 pb-3 pt-10">
                <div className="rounded-full border border-line/80 bg-white/88 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                  More below
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className={[PANEL_CLASS, "px-5 py-4 md:px-6"].join(" ")}>
          <div className="grid gap-5 lg:grid-cols-2">
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
      </div>
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
    <section className="grid gap-3">
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
  activeShowcaseKind,
  setActiveShowcaseKind,
  advanceShowcase,
  onInspectItem,
}: {
  summary: Summary;
  decks: ShowcaseDeck[];
  activeDeck: ShowcaseDeck | null;
  activeEntry: ShowcaseDeck["entries"][number] | null;
  activeShowcaseKind: ExampleKind;
  setActiveShowcaseKind: (kind: ExampleKind) => void;
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
      <div className="inline-flex w-full rounded-full border border-line bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        {decks.map((deck) => {
          const active = deck.kind === activeShowcaseKind;
          return (
            <button
              key={deck.kind}
              type="button"
              onClick={() => setActiveShowcaseKind(deck.kind)}
              className={[
                "inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-3 py-1.5 text-[13px] transition-[transform,background-color,color] active:scale-[0.98]",
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

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
              <button
                type="button"
                onClick={() => onInspectItem(item.id)}
                className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-left transition-colors hover:text-accent focus:text-accent focus:outline-none"
              >
                <span>Item {item.id}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 5.5h7.5V13" />
                  <path d="M14.5 5.5 6 14" />
                  <path d="M5.5 8.5V14.5H11.5" />
                </svg>
              </button>
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

            {activeDeck.entries.length > 1 ? (
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
            ) : null}
          </div>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-line/80 bg-white/78">
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              Scenario source
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-900">{item.source}</p>
          </div>

          {options.map((option) => (
            <div
              key={option.key}
              className={[
                "flex gap-3 border-t border-line/70 px-4 py-3",
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
              <div className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
                  {option.virtuous ? "Virtuous choice" : "Tempting choice"}
                </span>
                <p className="text-sm leading-6 text-stone-800">{option.text}</p>
              </div>
            </div>
          ))}

          <div className="border-t border-line/70 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
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

            <div className="mt-3 grid">
              {displayResponses.map(({ frame, response }, index) => (
                <div
                  key={`${selectedModel}-${frame}-${response.answer ?? "none"}`}
                  className={[index ? "border-t border-line/70 pt-3" : "", "pb-3 last:pb-0"].join(
                    " ",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
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

                  <p className="mt-2 text-sm leading-6 text-stone-800">{response.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
