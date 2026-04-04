import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  buildPromptText,
  framePromptDelta,
  type OverviewDeck,
  type OverviewVirtue,
  type ShowcaseSelection,
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
const MODEL_PICKER_GAP = 10;
const MODEL_PICKER_VIEWPORT_GUTTER = 12;

type SummaryViewProps = {
  virtue: string;
  summary: Summary;
  overviewVirtue: OverviewVirtue;
  showcase: ShowcaseSelection;
  onInspectItem: (itemId: number) => void;
  onSetShowcase: (next: ShowcaseSelection) => void;
  onSelectVirtue: (virtue: string) => void;
  onOpenMethod: () => void;
};

export function SummaryView({
  virtue,
  summary,
  overviewVirtue,
  showcase,
  onInspectItem,
  onSetShowcase,
  onSelectVirtue,
  onOpenMethod,
}: SummaryViewProps) {
  const benchmarkDeck = overviewVirtue.decks.find((deck) => deck.kind === "benchmark") ?? null;
  const totalItemCount = Object.values(summary.virtues).reduce(
    (count, current) => count + current.itemCount,
    0,
  );
  const methodBlurb = "Same scenario, different frame: see when models flip, and what stays wrong.";

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
                The good option can cost something real: safety, comfort, reputation, money, or
                future advantage.
              </p>
            </div>
            <div className="border-t border-line/70 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Temptation
              </p>
              <p className="mt-1">
                The tempting option is usually safer, easier, and easier to justify.
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
                      <p className="min-h-[3rem] text-sm leading-6 text-stone-700">{entry.mean}</p>
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
          selection={showcase}
          onInspectItem={onInspectItem}
          onSelectionChange={onSetShowcase}
          variant="summary"
        />
      ) : null}
    </section>
  );
}

type ShowcaseBrowserProps = {
  summary: Summary;
  decks: OverviewDeck[];
  selection: ShowcaseSelection;
  onInspectItem: (itemId: number) => void;
  onSelectionChange: (next: ShowcaseSelection) => void;
  variant: "summary" | "method";
};

export function ShowcaseBrowser({
  summary,
  decks,
  selection,
  onInspectItem,
  onSelectionChange,
  variant,
}: ShowcaseBrowserProps) {
  const activeDeck = decks.find((deck) => deck.kind === selection.kind) ?? decks[0] ?? null;
  const activeIndex = activeDeck
    ? Math.max(
        activeDeck.entries.findIndex((entry) => entry.item.id === selection.itemId),
        0,
      )
    : 0;
  const activeEntry = activeDeck ? activeDeck.entries[activeIndex] : null;

  if (!activeDeck || !activeEntry) {
    return (
      <section className="border-t border-line/80 px-5 py-4">
        <div className="text-sm text-ink-soft">No inline examples available.</div>
      </section>
    );
  }

  const { item, model, modelOptions } = activeEntry;
  const fallbackModel =
    modelOptions.find((entry) => entry.model === model)?.model ?? modelOptions[0]?.model ?? model;
  const selectedModel =
    modelOptions.find((entry) => entry.model === selection.modelId)?.model ?? fallbackModel;
  const setSelectedModel = (nextModel: string) => {
    onSelectionChange({
      kind: activeDeck.kind,
      itemId: activeEntry.item.id,
      modelId: nextModel,
    });
  };

  const activeModelEntry =
    modelOptions.find((entry) => entry.model === selectedModel) ?? modelOptions[0] ?? null;
  const displayResponses = activeModelEntry?.responses ?? [];
  const showDeckTabs = decks.length > 1;
  const showSingleDeckLabel = !showDeckTabs && variant === "method";
  const bodyMinHeightClass = variant === "summary" ? "xl:min-h-[16.5rem]" : "xl:min-h-[20.5rem]";
  const shellPaddingClass =
    variant === "summary" ? "px-5 py-4 md:px-7 md:py-5" : "px-5 py-5 md:px-7 md:py-6";
  const headingMinHeightClass =
    variant === "summary"
      ? "min-h-[4.1rem] md:min-h-[4.5rem]"
      : "min-h-[4.75rem] md:min-h-[5.25rem]";
  const options = [
    { key: "A", text: item.optionA, virtuous: item.target === "A" },
    { key: "B", text: item.optionB, virtuous: item.target === "B" },
  ];

  const advanceShowcase = () => {
    if (!activeDeck || activeDeck.entries.length < 2) return;

    const nextIndex = (activeIndex + 1) % activeDeck.entries.length;
    onSelectionChange({
      kind: activeDeck.kind,
      itemId: activeDeck.entries[nextIndex]?.item.id ?? null,
      modelId: selection.modelId,
    });
  };

  const retreatShowcase = () => {
    if (!activeDeck || activeDeck.entries.length < 2) return;

    const nextIndex = (activeIndex - 1 + activeDeck.entries.length) % activeDeck.entries.length;
    onSelectionChange({
      kind: activeDeck.kind,
      itemId: activeDeck.entries[nextIndex]?.item.id ?? null,
      modelId: selection.modelId,
    });
  };

  return (
    <article className={[PANEL_CLASS, "overflow-hidden"].join(" ")}>
      <section className={["mx-auto max-w-[1160px]", shellPaddingClass].join(" ")}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="grid gap-3">
            {showDeckTabs ? (
              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="inline-flex min-w-max rounded-[22px] border border-line bg-white/70 p-1">
                  {decks.map((deck) => {
                    const active = deck.kind === activeDeck.kind;
                    const count = deck.kind === "benchmark" ? null : deck.entries.length;

                    return (
                      <button
                        key={deck.kind}
                        type="button"
                        onClick={() =>
                          onSelectionChange({
                            kind: deck.kind,
                            itemId: null,
                            modelId: null,
                          })
                        }
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

            <div className={["grid gap-1", headingMinHeightClass].join(" ")}>
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

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:items-start xl:gap-8">
          <section className={["xl:grid xl:pr-4", bodyMinHeightClass].join(" ")}>
            <div className="min-h-0 xl:overflow-auto">
              <div className="grid gap-3">
                {options.map((option) => (
                  <div
                    key={option.key}
                    className={[
                      "flex gap-3 rounded-[20px] px-4 py-3.5",
                      option.virtuous ? "bg-ok-soft/18" : "bg-white/28",
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

          <section
            className={["xl:grid xl:grid-rows-[auto_minmax(0,1fr)]", bodyMinHeightClass].join(" ")}
          >
            <div className="flex flex-wrap items-center gap-2">
              <ShowcaseModelPicker
                value={selectedModel}
                options={modelOptions.map((entry) => entry.model)}
                variant={variant}
                onChange={setSelectedModel}
              />
            </div>

            <div className="mt-4 min-h-0 xl:overflow-auto xl:pr-1">
              <div className="grid gap-3 content-start">
                {displayResponses.map(({ frame, response }, index) => (
                  <ShowcaseResponseBlock
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

function ShowcaseModelPicker({
  value,
  options,
  variant,
  onChange,
}: {
  value: string;
  options: string[];
  variant: "summary" | "method";
  onChange: (value: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const selectedValue = options.includes(value) ? value : (options[0] ?? value);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || typeof window === "undefined") return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.max(
        triggerRect.width,
        Math.min(304, viewportWidth - MODEL_PICKER_VIEWPORT_GUTTER * 2),
      );

      let left = triggerRect.left;
      if (left + width > viewportWidth - MODEL_PICKER_VIEWPORT_GUTTER) {
        left = viewportWidth - width - MODEL_PICKER_VIEWPORT_GUTTER;
      }
      left = Math.max(left, MODEL_PICKER_VIEWPORT_GUTTER);

      let top = triggerRect.bottom + MODEL_PICKER_GAP;
      const maxTop = Math.max(
        MODEL_PICKER_VIEWPORT_GUTTER,
        viewportHeight - panelRect.height - MODEL_PICKER_VIEWPORT_GUTTER,
      );
      const fallbackTop = triggerRect.top - panelRect.height - MODEL_PICKER_GAP;

      if (top > maxTop && fallbackTop >= MODEL_PICKER_VIEWPORT_GUTTER) {
        top = fallbackTop;
      } else {
        top = Math.min(top, maxTop);
      }

      setPanelStyle({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  if (options.length <= 1) {
    return (
      <p className="text-sm font-medium text-stone-900">
        {formatShowcaseModelLabel(selectedValue, variant)}
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-10 w-full min-w-[15rem] max-w-[18rem] items-center justify-between gap-3 rounded-full border border-line bg-white/92 px-3.5 py-2 text-left text-[13px] font-medium text-stone-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_24px_rgba(28,24,20,0.05)] outline-none transition-[transform,background-color,border-color,box-shadow] hover:border-accent/30 hover:bg-white focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(22,61,52,0.08)] active:scale-[0.98]"
      >
        <span className="truncate">{formatShowcaseModelLabel(selectedValue, variant)}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={[
            "size-4 shrink-0 text-ink-soft transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5.5 7.5 4.5 5 4.5-5" />
        </svg>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              aria-label="Choose model for example answer"
              style={
                panelStyle
                  ? {
                      position: "fixed",
                      top: panelStyle.top,
                      left: panelStyle.left,
                      width: panelStyle.width,
                    }
                  : {
                      position: "fixed",
                      top: -9999,
                      left: -9999,
                      visibility: "hidden",
                    }
              }
              className="z-[95] max-h-[min(70vh,28rem)] overflow-auto rounded-[22px] border border-line bg-[#fffdf9]/98 p-2 shadow-[0_22px_56px_rgba(28,24,20,0.16)] backdrop-blur-sm"
            >
              <div className="px-2.5 pb-2 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Choose model
                </p>
              </div>

              <div className="grid gap-1">
                {options.map((option) => {
                  const selected = option === selectedValue;

                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-[16px] px-3 py-2.5 text-left transition-[background-color,color]",
                        selected
                          ? "bg-accent-soft/70 text-stone-900"
                          : "text-stone-700 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="grid gap-0.5">
                        <span className="text-[13px] font-medium leading-5 text-inherit">
                          {option}
                        </span>
                        {selected ? (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                            Current
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={[
                          "inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                          selected
                            ? "border-accent bg-accent text-white"
                            : "border-line bg-white text-transparent",
                        ].join(" ")}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          className="size-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m4.5 10 3.5 3.5 7.5-7.5" />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ShowcaseResponseBlock({
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
          answer: "border border-line bg-white text-stone-700",
          outcome: "text-ink-soft",
        }
      : response.correct
        ? {
            answer: "bg-ok text-white",
            outcome: "text-ok",
          }
        : {
            answer: "bg-danger text-white",
            outcome: "text-danger",
          };

    return (
      <div className={[separated ? "border-t border-line/60 pt-4" : "", "grid gap-4"].join(" ")}>
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={[
              "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              tone.answer,
            ].join(" ")}
          >
            {answerLabel}
          </span>

          <div className="min-w-0 flex-1 pt-1">
            <p
              className={[
                "text-[11px] font-semibold uppercase tracking-[0.12em]",
                tone.outcome,
              ].join(" ")}
            >
              {outcomeLabel}
            </p>
            <p className="mt-3 max-w-[32ch] text-[15px] leading-8 text-stone-800">{rationale}</p>
          </div>
        </div>
      </div>
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

function formatShowcaseModelLabel(model: string, variant: "summary" | "method") {
  return variant === "summary" ? `${model} answer` : model;
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
