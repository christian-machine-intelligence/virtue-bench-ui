import { FrameInfoLabel, PANEL_CLASS } from "./chrome";
import { getScoreMatrixRows, type ViewerDataset } from "./dataset";
import { type Summary } from "./model";

type ScoresViewProps = {
  summary: Summary;
  dataset: ViewerDataset;
  onOpenModel: (modelId: string, frame: string | null) => void;
};

export function ScoresView({ summary, dataset, onOpenModel }: ScoresViewProps) {
  const rows = getScoreMatrixRows(dataset);

  return (
    <section className={[PANEL_CLASS, "overflow-hidden"].join(" ")}>
      <div className="border-b border-line px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="font-display text-3xl md:text-[2.35rem]">Scores</h2>
            <p className="text-sm text-ink-soft">
              Click a model or frame score to open item-level evidence.
            </p>
          </div>
          <div className="rounded-full border border-line bg-white/78 px-3 py-1.5 text-xs font-medium text-ink-soft">
            {rows.length} models
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-auto overscroll-contain max-h-[26rem] md:max-h-[32rem] xl:max-h-[calc(100vh-14rem)]">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                <th className="sticky left-0 top-0 z-30 min-w-[240px] border-b border-line bg-[#fbf8f2]/95 px-4 py-3 backdrop-blur">
                  Models ({rows.length})
                </th>
                {dataset.frameIds.map((frame, index) => (
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
                      align={index >= dataset.frameIds.length - 2 ? "right" : "left"}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ model, scores }) => (
                <tr key={model.id} className="text-stone-800">
                  <td className="sticky left-0 z-10 border-b border-line bg-[#fffdf9] px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onOpenModel(model.id, "actual")}
                      className="grid w-full gap-2 text-left transition-colors hover:text-accent focus:text-accent focus:outline-none"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{model.display}</span>
                        {model.featured ? (
                          <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                            Featured
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                        Open actual misses
                      </span>
                    </button>
                  </td>
                  {dataset.frameIds.map((frame) => (
                    <td key={frame} className="border-b border-line px-1 py-1 text-center">
                      {scores[frame] != null ? (
                        <button
                          type="button"
                          onClick={() => onOpenModel(model.id, frame)}
                          className="inline-flex min-h-11 min-w-[84px] items-center justify-center rounded-2xl px-3 py-2 font-medium tabular-nums text-stone-700 transition-[transform,background-color,color] hover:bg-accent-soft/38 hover:text-stone-900 active:scale-[0.98]"
                        >
                          {scores[frame].toFixed(2)}
                        </button>
                      ) : (
                        <span className="inline-flex min-h-11 min-w-[84px] items-center justify-center text-stone-400">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
