import {
  compactAccuracy,
  PRESETS,
  statCount,
  titleCase,
  type Preset,
  type Summary,
  type SummaryModel,
  type VirtueItem,
} from "./model";
import {
  BUTTON_CLASS,
  FIELD_CLASS,
  FrameInfoLabel,
  InlineMetric,
  PANEL_CLASS,
  RAIL_CLASS,
} from "./chrome";

type InspectViewProps = {
  virtue: string;
  summary: Summary;
  preset: Preset;
  presetMeta: (typeof PRESETS)[number];
  search: string;
  setSearch: (value: string) => void;
  visibleModels: string[];
  availableModels: SummaryModel[];
  featuredVisibleModels: string[];
  filteredItems: VirtueItem[];
  selectedItem: VirtueItem | null;
  detailFrames: string[];
  detailModels: string[];
  toggleModel: (model: string) => void;
  setSelectedModels: (models: string[]) => void;
  setSelectedItemId: (id: number | null) => void;
  setPreset: (preset: Preset) => void;
};

export function InspectView({
  virtue,
  summary,
  preset,
  presetMeta,
  search,
  setSearch,
  visibleModels,
  availableModels,
  featuredVisibleModels,
  filteredItems,
  selectedItem,
  detailFrames,
  detailModels,
  toggleModel,
  setSelectedModels,
  setSelectedItemId,
  setPreset,
}: InspectViewProps) {
  const selectedIndex = selectedItem
    ? filteredItems.findIndex((item) => item.id === selectedItem.id)
    : -1;
  const selectedPositionLabel =
    selectedIndex >= 0
      ? `${selectedIndex + 1} of ${filteredItems.length} in view`
      : filteredItems.length
        ? "Outside current filter"
        : "No items in view";
  const previousItem = selectedIndex > 0 ? filteredItems[selectedIndex - 1] : null;
  const nextItem =
    selectedIndex >= 0 && selectedIndex < filteredItems.length - 1
      ? filteredItems[selectedIndex + 1]
      : null;

  return (
    <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className={[RAIL_CLASS, "overflow-hidden xl:sticky xl:top-4 xl:self-start"].join(" ")}>
        <section className="px-5 py-4">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {titleCase(virtue)}
            </p>
            <h2 className="font-display text-3xl">Inspect</h2>
            <p className="text-sm leading-6 text-ink-soft">
              Filter items, then compare answers across frames.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Preset
              </span>
              <select
                value={preset}
                onChange={(event) => setPreset(event.target.value as Preset)}
                className={FIELD_CLASS}
              >
                {PRESETS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Source, option text, item id"
                className={FIELD_CLASS}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <InlineMetric label="Matches" value={filteredItems.length} />
            <InlineMetric label="Models in view" value={visibleModels.length} />
          </div>
        </section>

        <section className="border-t border-line/80 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">Models</h3>
              <p className="text-xs text-ink-soft">Selection drives the evidence table.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedModels(
                    featuredVisibleModels.length
                      ? featuredVisibleModels
                      : availableModels.map((model) => model.display),
                  )
                }
                className={BUTTON_CLASS}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => setSelectedModels(availableModels.map((model) => model.display))}
                className={BUTTON_CLASS}
              >
                All
              </button>
            </div>
          </div>

          <div className="grid max-h-[22rem] gap-2 overflow-auto overscroll-contain md:max-h-[24rem] xl:max-h-[18rem]">
            {availableModels.map((model) => {
              const checked = visibleModels.includes(model.display);
              return (
                <label
                  key={model.display}
                  className={[
                    "grid gap-2 rounded-[18px] border px-4 py-3 transition-[transform,background-color,border-color] active:scale-[0.99]",
                    checked ? "border-accent/25 bg-accent-soft/42" : "border-line/80 bg-white/82",
                  ].join(" ")}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModel(model.display)}
                      className="mt-1 size-4 accent-accent"
                    />
                    <span className="grid gap-1">
                      <span className="text-sm font-medium leading-5">{model.display}</span>
                      <span className="text-xs text-ink-soft">{model.frames.join(" · ")}</span>
                    </span>
                  </span>
                  {model.featured ? (
                    <span className="inline-flex w-fit rounded-full bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                      Featured set
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </section>

        <section className="border-t border-line/80 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">Items</h3>
              <p className="text-xs text-ink-soft">
                {presetMeta.label} across {visibleModels.length} model
                {visibleModels.length === 1 ? "" : "s"}
              </p>
            </div>
            <p className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium tabular-nums text-stone-700">
              {filteredItems.length}
            </p>
          </div>

          <div className="grid max-h-[32rem] gap-2 overflow-auto overscroll-contain md:max-h-[36rem] xl:max-h-[calc(100vh-24rem)]">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const selected = item.id === selectedItem?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={[
                      "grid gap-3 rounded-[18px] border px-4 py-3 text-left transition-[transform,background-color,border-color,box-shadow] active:scale-[0.99]",
                      selected
                        ? "border-accent/25 bg-accent-soft/55 shadow-[0_8px_24px_rgba(22,61,52,0.08)]"
                        : "border-line/80 bg-white/82 hover:border-line-strong",
                    ].join(" ")}
                  >
                    <div className="grid gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                        Item {item.id}
                      </div>
                      <div className="line-clamp-2 text-sm leading-5">{item.source}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                      {(["actual", "bare", "preserve", "resist"] as const).map((frame) => {
                        const count = statCount(item, frame, visibleModels);
                        return count.available ? (
                          <span
                            key={frame}
                            className="rounded-full bg-stone-100 px-2 py-1 text-ink-soft"
                          >
                            {summary.frames[frame].label} {compactAccuracy(count)}
                          </span>
                        ) : null;
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                      {item.flags.featuredSharedFlip ? (
                        <span className="rounded-full bg-accent-soft px-2 py-1 text-accent">
                          Shared flip
                        </span>
                      ) : null}
                      {item.flags.featuredStableFailure ? (
                        <span className="rounded-full bg-danger-soft px-2 py-1 text-danger">
                          Stable failure
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="grid place-items-center rounded-[18px] border border-dashed border-line bg-white/60 px-5 py-10 text-center text-sm text-ink-soft">
                No items match this filter set.
              </div>
            )}
          </div>
        </section>
      </aside>

      <section className="grid gap-4">
        <section className={[PANEL_CLASS, "p-5 md:p-6"].join(" ")}>
          {!selectedItem ? (
            <div className="grid min-h-[420px] place-items-center text-center text-ink-soft">
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-stone-900">No item selected</h2>
                <p>Pick an item from the rail to compare answers frame by frame.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 pb-4">
                <div className="grid gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Item {selectedItem.id}
                  </p>
                  <p className="text-xs leading-5 text-ink-soft">{selectedPositionLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => previousItem && setSelectedItemId(previousItem.id)}
                    disabled={!previousItem}
                    className={[
                      BUTTON_CLASS,
                      previousItem ? "" : "cursor-not-allowed opacity-45 hover:bg-white",
                    ].join(" ")}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => nextItem && setSelectedItemId(nextItem.id)}
                    disabled={!nextItem}
                    className={[
                      BUTTON_CLASS,
                      nextItem ? "" : "cursor-not-allowed opacity-45 hover:bg-white",
                    ].join(" ")}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="grid gap-4 xl:max-h-[24rem] xl:overflow-auto xl:overscroll-contain xl:pr-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <h2 className="max-w-[18ch] text-balance font-display text-3xl md:text-[2.6rem]">
                      {selectedItem.source}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      {selectedItem.flags.featuredSharedFlip ? (
                        <span className="rounded-full bg-accent-soft px-3 py-1.5 text-accent">
                          Featured shared flip
                        </span>
                      ) : null}
                      {selectedItem.flags.featuredStableFailure ? (
                        <span className="rounded-full bg-danger-soft px-3 py-1.5 text-danger">
                          Featured stable failure
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 text-right">
                    <span className="rounded-full bg-ok-soft px-3 py-2 text-sm font-semibold text-ok">
                      Virtuous {selectedItem.target}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {detailModels.length} model
                      {detailModels.length === 1 ? "" : "s"} with responses
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink-soft">
                  {detailFrames.map((frame) => {
                    const count = statCount(selectedItem, frame, visibleModels);
                    return count.available ? (
                      <span
                        key={frame}
                        className="rounded-full bg-white/85 px-3 py-1.5 ring-1 ring-line"
                      >
                        {summary.frames[frame].label} {compactAccuracy(count)}
                      </span>
                    ) : null;
                  })}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <article
                    className={[
                      "rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                      selectedItem.target === "A"
                        ? "border-ok/30 bg-ok-soft/55"
                        : "border-line bg-white/80",
                    ].join(" ")}
                  >
                    <strong className="mb-3 block text-sm uppercase tracking-[0.08em] text-ink-soft">
                      Option A
                    </strong>
                    <p className="text-sm leading-6 text-stone-800">{selectedItem.optionA}</p>
                  </article>
                  <article
                    className={[
                      "rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                      selectedItem.target === "B"
                        ? "border-ok/30 bg-ok-soft/55"
                        : "border-line bg-white/80",
                    ].join(" ")}
                  >
                    <strong className="mb-3 block text-sm uppercase tracking-[0.08em] text-ink-soft">
                      Option B
                    </strong>
                    <p className="text-sm leading-6 text-stone-800">{selectedItem.optionB}</p>
                  </article>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-line bg-white/82">
                <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
                  <h3 className="font-display text-2xl">Responses</h3>
                </div>

                <div className="min-h-[26rem] overflow-auto md:max-h-[68vh]">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                        <th className="sticky left-0 top-0 z-30 min-w-[220px] border-b border-line bg-[#fbf8f2]/95 px-4 py-3 backdrop-blur">
                          Model
                        </th>
                        {detailFrames.map((frame, index) => (
                          <th
                            key={frame}
                            className="sticky top-0 z-20 min-w-[280px] border-b border-line bg-[#fbf8f2]/95 px-4 py-3 backdrop-blur"
                          >
                            <FrameInfoLabel
                              frame={frame}
                              label={summary.frames[frame].label}
                              kind={summary.frames[frame].kind}
                              blurb={summary.frames[frame].blurb}
                              align={index >= detailFrames.length - 2 ? "right" : "left"}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailModels.map((model) => (
                        <tr key={model} className="align-top">
                          <td className="sticky left-0 z-10 border-b border-line bg-[#fffdf9] px-4 py-4 font-medium whitespace-nowrap">
                            {model}
                          </td>
                          {detailFrames.map((frame) => {
                            const response = selectedItem.responses[model].frames[frame];
                            return (
                              <td
                                key={frame}
                                className="min-w-[280px] border-b border-line px-4 py-4"
                              >
                                {response ? (
                                  <div className="grid gap-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
                                      <span
                                        className={[
                                          "inline-flex size-8 items-center justify-center rounded-full",
                                          response.correct
                                            ? "bg-ok-soft text-ok"
                                            : "bg-danger-soft text-danger",
                                        ].join(" ")}
                                      >
                                        {response.answer ?? "?"}
                                      </span>
                                      <span
                                        className={response.correct ? "text-ok" : "text-danger"}
                                      >
                                        {response.correct ? "Correct" : "Wrong"}
                                      </span>
                                    </div>
                                    <p className="text-sm leading-6 text-stone-800">
                                      {response.rationale}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs uppercase tracking-[0.12em] text-ink-soft">
                                    No data
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </section>
    </section>
  );
}
