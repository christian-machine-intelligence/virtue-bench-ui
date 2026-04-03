import {
  availableModelFrameOptions,
  getModelFrameResponse,
  getModelFrameSummary,
  statusChoiceLabel,
  statusLabel,
  statusTone,
  type DatasetFrameResponse,
  type DatasetItem,
  type ViewerDataset,
} from "./dataset";
import { BUTTON_CLASS, FIELD_CLASS, InlineMetric, PANEL_CLASS, RAIL_CLASS } from "./chrome";
import { titleCase, type ModelResultFilter } from "./model";

type ModelViewProps = {
  dataset: ViewerDataset;
  modelId: string;
  frame: string | null;
  result: ModelResultFilter;
  search: string;
  setSearch: (value: string) => void;
  filteredItems: DatasetItem[];
  selectedItem: DatasetItem | null;
  setModelId: (modelId: string) => void;
  setFrame: (frame: string | null) => void;
  setResult: (result: ModelResultFilter) => void;
  setSelectedItemId: (itemId: number | null) => void;
  onInspectItem: (itemId: number) => void;
};

function responseToneClasses(response: DatasetFrameResponse | null) {
  const tone = statusTone(response);
  if (tone === "correct") return "bg-ok-soft text-ok";
  if (tone === "wrong") return "bg-danger-soft text-danger";
  if (tone === "warning") return "bg-amber-50 text-amber-800";
  return "bg-stone-100 text-stone-500";
}

function responsePanelClasses(response: DatasetFrameResponse | null) {
  const tone = statusTone(response);
  if (tone === "correct") return "border-ok/30 bg-ok-soft/40";
  if (tone === "wrong") return "border-danger/20 bg-danger-soft/35";
  if (tone === "warning") return "border-amber-200 bg-amber-50/70";
  return "border-line bg-white/82";
}

function responseCopy(response: DatasetFrameResponse | null) {
  if (!response || response.parseStatus === "missing") {
    return "No response for this frame in the exported data.";
  }

  if (response.parseStatus === "malformed") {
    return "The exported output exists, but the parser did not recover a clean A/B answer.";
  }

  return response.rationale;
}

export function ModelView({
  dataset,
  modelId,
  frame,
  result,
  search,
  setSearch,
  filteredItems,
  selectedItem,
  setModelId,
  setFrame,
  setResult,
  setSelectedItemId,
  onInspectItem,
}: ModelViewProps) {
  const model = dataset.modelsById[modelId] ?? dataset.models[0];
  const frameOptions = availableModelFrameOptions(dataset, model.id);
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
  const scores = frameOptions.filter((entry) => model.scores[entry] != null);

  return (
    <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className={[RAIL_CLASS, "overflow-hidden xl:sticky xl:top-4 xl:self-start"].join(" ")}>
        <section className="px-5 py-4">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {titleCase(dataset.virtue)}
            </p>
            <h2 className="font-display text-3xl">Model</h2>
            <p className="text-sm leading-6 text-ink-soft">
              One model, one queue, all available frame outputs.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Model
              </span>
              <select
                value={model.id}
                onChange={(event) => setModelId(event.target.value)}
                className={FIELD_CLASS}
              >
                {dataset.models.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.display}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Frame
              </span>
              <select
                value={frame ?? "all"}
                onChange={(event) =>
                  setFrame(event.target.value === "all" ? null : event.target.value)
                }
                className={FIELD_CLASS}
              >
                <option value="all">All frames</option>
                {frameOptions.map((entry) => (
                  <option key={entry} value={entry}>
                    {dataset.frames[entry].label}
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

          <div className="mt-4 inline-flex rounded-full border border-line bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            {(
              [
                ["wrong", "Wrong"],
                ["correct", "Correct"],
                ["all", "All"],
              ] as const
            ).map(([value, label]) => {
              const active = result === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setResult(value)}
                  className={[
                    "inline-flex min-h-10 items-center justify-center rounded-full px-3 py-1.5 text-sm transition-[transform,background-color,color] active:scale-[0.97]",
                    active
                      ? "bg-accent text-white shadow-[0_8px_18px_rgba(22,61,52,0.16)]"
                      : "text-stone-700 hover:bg-accent-soft/40",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <InlineMetric label="Matches" value={filteredItems.length} />
            <InlineMetric label="Frames" value={scores.length} />
          </div>
        </section>

        <section className="border-t border-line/80 px-5 py-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">{model.display}</h3>
              <p className="text-xs text-ink-soft">
                {frame ? `${dataset.frames[frame].label} ${result}` : `${result} across all frames`}
              </p>
            </div>
            {model.featured ? (
              <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                Featured
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            {scores.map((entry) => (
              <span
                key={entry}
                className="rounded-full bg-white/82 px-2.5 py-1 text-ink-soft ring-1 ring-line"
              >
                {dataset.frames[entry].label} {model.scores[entry].toFixed(2)}
              </span>
            ))}
          </div>
        </section>

        <section className="border-t border-line/80 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">Items</h3>
              <p className="text-xs text-ink-soft">{selectedPositionLabel}</p>
            </div>
            <p className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium tabular-nums text-stone-700">
              {filteredItems.length}
            </p>
          </div>

          <div className="grid max-h-[32rem] gap-2 overflow-auto overscroll-contain md:max-h-[36rem] xl:max-h-[calc(100vh-24rem)]">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const selected = item.id === selectedItem?.id;
                const frameSummary = frame
                  ? [{ frame, response: getModelFrameResponse(item, model.id, frame) }]
                  : getModelFrameSummary(dataset, model.id, item);

                return (
                  <button
                    key={item.scopedId}
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
                      {frameSummary.map(({ frame: entry, response }) => (
                        <span
                          key={`${item.id}-${entry}`}
                          className={["rounded-full px-2 py-1", responseToneClasses(response)].join(
                            " ",
                          )}
                        >
                          {dataset.frames[entry].label} {statusChoiceLabel(response)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="grid place-items-center rounded-[18px] border border-dashed border-line bg-white/60 px-5 py-10 text-center text-sm text-ink-soft">
                No items match this model filter.
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
                <p>Pick an item from the rail to inspect this model’s frame-by-frame outputs.</p>
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
                  <button
                    type="button"
                    onClick={() => onInspectItem(selectedItem.id)}
                    className={BUTTON_CLASS}
                  >
                    Open inspect
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
                    <span className="text-xs text-ink-soft">{model.display}</span>
                  </div>
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
                  <h3 className="font-display text-2xl">Frames</h3>
                </div>

                <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
                  {getModelFrameSummary(dataset, model.id, selectedItem).map(
                    ({ frame, response }) => (
                      <article
                        key={`${selectedItem.id}-${frame}`}
                        className={[
                          "grid gap-3 rounded-[22px] border p-4",
                          responsePanelClasses(response),
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid gap-1">
                            <p className="text-sm font-semibold text-stone-900">
                              {dataset.frames[frame].label}
                            </p>
                            <p className="text-xs text-ink-soft">{dataset.frames[frame].kind}</p>
                          </div>
                          <div
                            className={[
                              "rounded-full px-3 py-1.5 text-xs font-semibold",
                              responseToneClasses(response),
                            ].join(" ")}
                          >
                            {statusChoiceLabel(response)} {statusLabel(response)}
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-stone-800">{responseCopy(response)}</p>

                        {response?.parseStatus === "malformed" ? (
                          <pre className="overflow-auto rounded-[16px] border border-amber-200 bg-white/75 px-3 py-3 text-xs leading-5 text-stone-700">
                            {response.rawOutput}
                          </pre>
                        ) : null}
                      </article>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </section>
    </section>
  );
}
