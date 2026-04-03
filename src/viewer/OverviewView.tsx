import { useEffect, useMemo, useState } from "react";

import {
  buildPromptText,
  framePromptDelta,
  type ExampleKind,
  type OverviewDeck,
  type OverviewVirtue,
  type ShowcaseResponse,
  type Summary,
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
  overviewVirtue: OverviewVirtue;
  onInspectItem: (itemId: number) => void;
  onSelectVirtue: (virtue: string) => void;
  onOpenMethod: () => void;
};

export function SummaryView({
  virtue,
  summary,
  overviewVirtue,
  onInspectItem,
  onSelectVirtue,
  onOpenMethod,
}: SummaryViewProps) {
  const benchmarkDeck = overviewVirtue.decks.find((deck) => deck.kind === "benchmark") ?? null;
  const totalItemCount = Object.values(summary.virtues).reduce(
    (count, current) => count + current.itemCount,
    0,
  );
  const methodBlurb =
    "See how framing changes answers, when models flip, and when they fail either way.";

  return (
    <section className="mx-auto grid w-full max-w-[1380px] gap-8">
      <section className="grid gap-6 px-2 pt-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)] xl:items-start">
        <div className="grid gap-4">
          <h2 className="max-w-[14ch] text-balance font-display text-[3rem] leading-[0.96] md:text-[4rem] xl:text-[4.1rem]">
            Can a model choose virtue under pressure?
          </h2>
          <div className="grid max-w-[62ch] gap-4 text-[16px] leading-7 text-stone-800 md:text-[17px] md:leading-8">
            <p>
              VirtueBench is not about catching overt vice. Labs already optimize heavily for{" "}
              <span className="inline-flex items-center gap-1 align-baseline">
                <span>that</span>
                <InfoPopover
                  label="Show alignment references"
                  widthClass="w-[min(24rem,calc(100vw-3rem))]"
                  align="left"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    References
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-800">
                    Main alignment pipelines already train for harmlessness, reduced toxic output,
                    and instruction-following. VirtueBench looks at a different case: whether models
                    still choose the good under pressure, and how framing changes that choice.
                  </p>
                  <div className="mt-3 grid gap-2 text-sm leading-6">
                    <a
                      href="https://doi.org/10.48550/arxiv.2203.02155"
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-900 underline decoration-line-strong/80 underline-offset-3 transition-colors hover:text-accent"
                    >
                      Ouyang et al. (InstructGPT, 2022)
                    </a>
                    <a
                      href="https://doi.org/10.48550/arxiv.2204.05862"
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-900 underline decoration-line-strong/80 underline-offset-3 transition-colors hover:text-accent"
                    >
                      Bai et al. (Helpful and Harmless, 2022)
                    </a>
                  </div>
                </InfoPopover>
              </span>
              . We ask whether a model still chooses the good when comfort, safety, and
              self-preservation are at stake.
            </p>
            <p>
              We test {totalItemCount} paired scenarios across the four virtues, drawing on Ambrose,
              Augustine, and Aquinas.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-x-6 gap-y-4 text-[14px] leading-6 text-stone-800 sm:grid-cols-2">
            <div className="border-t border-line/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Role
              </p>
              <p className="mt-1">
                The model answers in the first person, not as an outside judge.
              </p>
            </div>
            <div className="border-t border-line/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Output
              </p>
              <p className="mt-1">
                It must make an{" "}
                <span className="inline-flex items-center gap-1 align-baseline">
                  <span>A/B choice</span>
                  <InfoPopover
                    label="Explain answer randomization"
                    widthClass="w-[min(18rem,calc(100vw-3rem))]"
                    align="left"
                  >
                    The export randomizes whether the virtuous answer appears as A or B, so scores
                    are not driven by answer position.
                  </InfoPopover>
                </span>
                . One sentence tells us why.
              </p>
            </div>
            <div className="border-t border-line/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Cost
              </p>
              <p className="mt-1">
                The good option can cost safety, comfort, reputation, money, or future advantage.
              </p>
            </div>
            <div className="border-t border-line/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Temptation
              </p>
              <p className="mt-1">
                The tempting option is not openly evil. It is written to sound plausible,
                responsible, and self-protective.
              </p>
            </div>
          </div>

          <div className="border-t border-line/70 pt-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="grid gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                  Method
                </p>
                <p className="max-w-[32ch] text-sm leading-6 text-stone-800">{methodBlurb}</p>
              </div>
              <button type="button" onClick={onOpenMethod} className={SMALL_BUTTON_CLASS}>
                Open method
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-2">
        <div className="grid gap-5 border-t border-line/70 pt-5 md:pt-6 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:items-stretch xl:gap-8">
          <div className="grid max-w-[32ch] gap-2.5 xl:content-center">
            <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-accent md:text-[15px]">
              The Four Virtues
            </p>
            <p className="text-[15px] leading-7 text-stone-800">
              Virtue is a golden mean: not too little, not too much, but rightly ordered over time.
            </p>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
            {VIRTUE_PRIMER.map((entry) => {
              const active = entry.name.toLowerCase() === virtue;
              const entryVirtue = entry.name.toLowerCase();

              return (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => onSelectVirtue(entryVirtue)}
                  className={[
                    "h-full min-h-[6.75rem] rounded-[18px] px-4 py-3 text-left transition-[transform,background-color,border-color,color] active:scale-[0.99]",
                    active
                      ? "border border-line/80 bg-white/48"
                      : "border border-transparent bg-white/12 hover:border-line/60 hover:bg-white/24",
                  ].join(" ")}
                >
                  <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
                    <div className="flex min-h-5 items-start gap-2">
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

                    <div className={["h-px w-14", active ? "bg-accent/35" : "bg-line"].join(" ")} />

                    <div className="grid content-start gap-1">
                      <p className="text-[15px] font-medium leading-6 text-stone-900">
                        {entry.summary}
                      </p>
                      <p className="min-h-[3rem] text-sm leading-6 text-stone-700">
                        {entry.mean}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {benchmarkDeck ? (
        <ShowcaseBrowser
          summary={summary}
          decks={[benchmarkDeck]}
          onInspectItem={onInspectItem}
          variant="summary"
        />
      ) : null}
    </section>
  );
}

type ShowcaseBrowserProps = {
  summary: Summary;
  decks: OverviewDeck[];
  onInspectItem: (itemId: number) => void;
  variant: "summary" | "method";
};

export function ShowcaseBrowser({ summary, decks, onInspectItem, variant }: ShowcaseBrowserProps) {
  const deckSignature = useMemo(() => decks.map((deck) => deck.kind).join("|"), [decks]);
  const [activeShowcaseKind, setActiveShowcaseKind] = useState<ExampleKind>(
    decks[0]?.kind ?? "benchmark",
  );
  const [showcaseIndices, setShowcaseIndices] = useState<Record<ExampleKind, number>>({
    benchmark: 0,
    sharedFlip: 0,
    stableFailure: 0,
  });

  useEffect(() => {
    setActiveShowcaseKind(decks[0]?.kind ?? "benchmark");
    setShowcaseIndices({ benchmark: 0, sharedFlip: 0, stableFailure: 0 });
  }, [deckSignature, decks]);

  const activeDeck = decks.find((deck) => deck.kind === activeShowcaseKind) ?? decks[0] ?? null;
  const activeIndex = activeDeck ? showcaseIndices[activeDeck.kind] % activeDeck.entries.length : 0;
  const activeEntry = activeDeck ? activeDeck.entries[activeIndex] : null;

  if (!activeDeck || !activeEntry) {
    return (
      <section className="border-t border-line/80 px-5 py-4">
        <div className="text-sm text-ink-soft">No inline examples available.</div>
      </section>
    );
  }

  const { item, model, modelOptions } = activeEntry;
  const [selectedModel, setSelectedModel] = useState(model);

  useEffect(() => {
    const fallbackModel =
      modelOptions.find((entry) => entry.model === model)?.model ?? modelOptions[0]?.model ?? model;
    setSelectedModel(fallbackModel);
  }, [activeShowcaseKind, item.id, model, modelOptions]);

  const activeModelEntry =
    modelOptions.find((entry) => entry.model === selectedModel) ?? modelOptions[0] ?? null;
  const displayResponses = activeModelEntry?.responses ?? [];
  const showDeckTabs = decks.length > 1;
  const showSingleDeckLabel = !showDeckTabs && variant === "method";
  const options = [
    { key: "A", text: item.optionA, virtuous: item.target === "A" },
    { key: "B", text: item.optionB, virtuous: item.target === "B" },
  ];

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
    <article className={[PANEL_CLASS, "overflow-hidden"].join(" ")}>
      <section className="mx-auto max-w-[1160px] px-5 py-5 md:px-7 md:py-6">
        <div className="grid gap-4 border-b border-line/70 pb-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="grid gap-3">
            {showDeckTabs ? (
              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="inline-flex min-w-max rounded-[22px] border border-line bg-white/70 p-1">
                  {decks.map((deck) => {
                    const active = deck.kind === activeShowcaseKind;
                    const count = deck.kind === "benchmark" ? null : deck.entries.length;

                    return (
                      <button
                        key={deck.kind}
                        type="button"
                        onClick={() => setActiveShowcaseKind(deck.kind)}
                        className={[
                          "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-[13px] whitespace-nowrap transition-[transform,background-color,color] active:scale-[0.98]",
                          active
                            ? "bg-accent text-white"
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
            ) : showSingleDeckLabel ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">
                  {activeDeck.label}
                </span>
                <span>{activeDeck.description}</span>
              </div>
            ) : null}

            <div className="grid min-h-[4.75rem] gap-1 md:min-h-[5.25rem]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                <span>
                  Scenario{" "}
                  {activeDeck.entries.length > 1
                    ? `${activeIndex + 1} of ${activeDeck.entries.length}`
                    : item.id}
                </span>
                <InfoPopover
                  label={`Show raw prompt for scenario ${item.id}`}
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

        {variant === "method" ? (
          <FrameShiftPanel summary={summary} responses={displayResponses} />
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:items-stretch xl:gap-0">
          <section className="xl:grid xl:min-h-[20.5rem] xl:pr-5">
            <div className="min-h-0 xl:overflow-auto">
              <div className="grid divide-y divide-line/70">
                {options.map((option) => (
                  <div
                    key={option.key}
                    className={[
                      "flex gap-3 px-1 py-3 first:pt-1 last:pb-1",
                      option.virtuous ? "bg-ok-soft/18" : "",
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
                  <ShowcaseResponseCard
                    key={`${selectedModel}-${frame}-${response.answer ?? "none"}`}
                    summary={summary}
                    frame={frame}
                    response={response}
                    variant={variant}
                    separated={index > 0}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </article>
  );
}

function ShowcaseResponseCard({
  summary,
  frame,
  response,
  variant,
  separated,
}: {
  summary: Summary;
  frame: string;
  response: ShowcaseResponse["response"];
  variant: "summary" | "method";
  separated: boolean;
}) {
  const hasAnswer = Boolean(response.answer);
  const answerLabel = response.answer ?? "—";
  const rationale = formatShowcaseRationale(response.answer, response.rationale);
  const outcomeLabel = !hasAnswer
    ? "No clear answer"
    : response.correct
      ? "Virtuous choice"
      : "Tempting choice";

  if (variant === "summary") {
    const tone = !hasAnswer
      ? {
          panel: "border-line bg-white/84",
          answer: "border border-line bg-white text-stone-700",
          outcome: "bg-white/90 text-stone-700 ring-1 ring-line/80",
          divider: "border-line/70",
        }
      : response.correct
        ? {
            panel: "border-ok/18 bg-ok-soft/22",
            answer: "bg-ok text-white",
            outcome: "bg-white/90 text-ok ring-1 ring-ok/12",
            divider: "border-ok/12",
          }
        : {
            panel: "border-danger/18 bg-danger-soft/20",
            answer: "bg-danger text-white",
            outcome: "bg-white/90 text-danger ring-1 ring-danger/12",
            divider: "border-danger/12",
          };

    return (
      <article className={["rounded-[22px] border px-4 py-4 md:px-5", tone.panel].join(" ")}>
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={[
              "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              tone.answer,
            ].join(" ")}
          >
            {answerLabel}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid gap-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Model answer
                </p>
                <p className="text-[15px] font-medium leading-6 text-stone-900">
                  {hasAnswer ? `Chose ${answerLabel}` : "No parse"}
                </p>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
                  tone.outcome,
                ].join(" ")}
              >
                {outcomeLabel}
              </span>
            </div>

            <div className={["mt-4 border-t pt-4", tone.divider].join(" ")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Why
              </p>
              <p className="mt-2 max-w-[32ch] text-[15px] leading-7 text-stone-800">
                {rationale}
              </p>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className={[separated ? "border-t border-line/70 pt-3" : "", "pb-3 last:pb-0"].join(" ")}>
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

      <p className="mt-3 max-w-[32ch] text-sm leading-7 text-stone-800">{rationale}</p>
    </div>
  );
}

function formatShowcaseRationale(answer: string | null, rationale: string) {
  const trimmed = rationale.trim();
  if (!trimmed || !answer) return trimmed;

  return trimmed.replace(new RegExp(`^${answer}\\s*[—–:-]\\s*`, "i"), "");
}

function FrameShiftPanel({
  summary,
  responses,
}: {
  summary: Summary;
  responses: ShowcaseResponse[];
}) {
  const outcomeLine =
    responses.length > 1
      ? responses
          .map(({ frame, response }) => {
            const answer = response.answer ?? "—";
            const result = response.correct ? "correct" : "wrong";
            return `${summary.frames[frame].label} ${answer} ${result}`;
          })
          .join(" -> ")
      : null;

  return (
    <section className="mt-5 grid gap-3 border-t border-line/70 pt-4">
      <div className="grid gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Frame Shift
        </p>
        <p className="text-sm leading-6 text-stone-800">
          The scenario stays fixed. The frame text changes what the model is told to foreground.
        </p>
        {outcomeLine ? (
          <p className="text-[13px] font-medium text-stone-900">{outcomeLine}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {responses.map(({ frame }) => {
          const meta = summary.frames[frame];
          const prompt = framePromptDelta(frame);

          return (
            <article
              key={frame}
              className="grid gap-3 border-t border-line/70 px-1 pt-3 first:border-t-0 first:pt-0 md:border-t-0 md:border-l md:px-0 md:pt-0 md:pl-4 md:first:border-l-0 md:first:pl-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900 ring-1 ring-line">
                  {meta.label}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                  {meta.kind}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700">{meta.blurb}</p>
              <p className="mt-3 text-sm leading-6 text-stone-900">{prompt.diff}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
