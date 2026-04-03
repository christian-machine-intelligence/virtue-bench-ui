import {
  FRAME_ORDER,
  frameSort,
  type Summary,
  type SummaryFrame,
  type VirtuePayload,
} from "./model";

export type ModelResultFilter = "wrong" | "correct" | "all";

export type DatasetFrameResponse = {
  answer: string | null;
  rawOutput: string;
  rationale: string;
  parseStatus: "ok" | "malformed" | "missing";
  correctness: "correct" | "wrong" | "unknown";
};

export type DatasetItemResponse = {
  modelId: string;
  display: string;
  frames: Record<string, DatasetFrameResponse>;
};

export type DatasetItem = {
  id: number;
  scopedId: string;
  virtue: string;
  source: string;
  target: string;
  prompt?: string;
  optionA: string;
  optionB: string;
  flags: {
    featuredSharedFlip: boolean;
    featuredStableFailure: boolean;
  };
  responsesByModel: Record<string, DatasetItemResponse>;
};

export type DatasetModel = {
  id: string;
  display: string;
  featured: boolean;
  virtues: string[];
  frames: string[];
  scores: Record<string, number>;
};

export type ViewerDataset = {
  schemaVersion: string;
  benchmarkId: string;
  runId: string;
  generatedAt: string;
  files: string[];
  virtue: string;
  frames: Record<string, SummaryFrame>;
  frameIds: string[];
  featuredModelIds: string[];
  models: DatasetModel[];
  modelsById: Record<string, DatasetModel>;
  items: DatasetItem[];
  itemsById: Record<number, DatasetItem>;
};

type TransportFrameResponse = {
  answer: string | null;
  correct: boolean;
  rationale: string;
};

function normalizeFrameResponse(response: TransportFrameResponse): DatasetFrameResponse {
  const rawOutput = response.rationale?.trim() ?? "";
  const parseStatus = response.answer ? "ok" : rawOutput ? "malformed" : "missing";

  return {
    answer: response.answer,
    rawOutput,
    rationale: rawOutput,
    parseStatus,
    correctness: parseStatus === "ok" ? (response.correct ? "correct" : "wrong") : "unknown",
  };
}

function buildScopedItemId(virtue: string, id: number) {
  return `virtuebench-v1:${virtue}:${id}`;
}

function itemMatchesSearch(item: DatasetItem, searchParts: string[]) {
  if (!searchParts.length) return true;

  const haystack = [String(item.id), item.source, item.optionA, item.optionB]
    .join(" ")
    .toLowerCase();

  return searchParts.every((part) => haystack.includes(part));
}

function responseMatchesResult(response: DatasetFrameResponse | null, result: ModelResultFilter) {
  if (result === "all") return true;
  if (!response) return false;
  if (result === "correct") return response.correctness === "correct";
  return response.correctness === "wrong" || response.parseStatus === "malformed";
}

export function normalizeViewerDataset(
  summary: Summary,
  virtuePayload: VirtuePayload,
): ViewerDataset {
  const virtueSummary = summary.virtues[virtuePayload.virtue];
  const modelMetaByDisplay = Object.fromEntries(
    summary.models
      .filter((model) => model.virtues.includes(virtuePayload.virtue))
      .map((model) => [model.display, model]),
  );
  const models = summary.models
    .filter((model) => model.virtues.includes(virtuePayload.virtue))
    .map((model) => ({
      id: model.rawId,
      display: model.display,
      featured: model.featured,
      virtues: model.virtues,
      frames: model.frames,
      scores: virtueSummary.scores[model.display] ?? {},
    }));

  const modelsById = Object.fromEntries(models.map((model) => [model.id, model]));
  const frameIds = Object.keys(summary.frames).sort(frameSort);

  const items = virtuePayload.items.map((item) => {
    const responsesByModel = Object.fromEntries(
      Object.entries(item.responses).map(([display, response]) => {
        const modelMeta = modelMetaByDisplay[display];
        const modelId = modelMeta?.rawId ?? display;

        return [
          modelId,
          {
            modelId,
            display,
            frames: Object.fromEntries(
              Object.entries(response.frames).map(([frame, frameResponse]) => [
                frame,
                normalizeFrameResponse(frameResponse),
              ]),
            ),
          },
        ];
      }),
    );

    return {
      id: item.id,
      scopedId: buildScopedItemId(virtuePayload.virtue, item.id),
      virtue: virtuePayload.virtue,
      source: item.source,
      target: item.target,
      prompt: item.prompt,
      optionA: item.optionA,
      optionB: item.optionB,
      flags: item.flags,
      responsesByModel,
    } satisfies DatasetItem;
  });

  return {
    schemaVersion: "viewer.adapter.v1",
    benchmarkId: "virtuebench-v1",
    runId: summary.generatedAt,
    generatedAt: summary.generatedAt,
    files: summary.files,
    virtue: virtuePayload.virtue,
    frames: summary.frames,
    frameIds,
    featuredModelIds: summary.featuredModels
      .map((display) => models.find((model) => model.display === display)?.id ?? null)
      .filter((value): value is string => Boolean(value)),
    models,
    modelsById,
    items,
    itemsById: Object.fromEntries(items.map((item) => [item.id, item])),
  };
}

export function getModelQueueItems(
  dataset: ViewerDataset,
  modelId: string,
  frame: string | null,
  result: ModelResultFilter,
  searchParts: string[],
) {
  return dataset.items.filter((item) => {
    if (!itemMatchesSearch(item, searchParts)) return false;
    if (result === "all" && frame == null) return true;

    const frames = item.responsesByModel[modelId]?.frames ?? {};
    if (frame) {
      return responseMatchesResult(frames[frame] ?? null, result);
    }

    const relevant = Object.values(frames);
    if (!relevant.length) return result === "all";
    return relevant.some((response) => responseMatchesResult(response, result));
  });
}

export function getDatasetSelectedItem(
  allItems: DatasetItem[],
  filteredItems: DatasetItem[],
  selectedItemId: number | null,
) {
  return (
    (selectedItemId != null ? allItems.find((item) => item.id === selectedItemId) : null) ??
    filteredItems[0] ??
    null
  );
}

export function getModelFrameList(
  dataset: ViewerDataset,
  modelId: string,
  item: DatasetItem | null,
) {
  if (!item) return [];

  const available = item.responsesByModel[modelId]?.frames ?? {};
  return dataset.frameIds.filter((frame) => frame in available).sort(frameSort);
}

export function getModelFrameResponse(
  item: DatasetItem | null,
  modelId: string,
  frame: string,
): DatasetFrameResponse | null {
  if (!item) return null;
  return item.responsesByModel[modelId]?.frames[frame] ?? null;
}

export function getModelStatusCount(
  dataset: ViewerDataset,
  modelId: string,
  frame: string | null,
  result: ModelResultFilter,
) {
  if (!dataset.items.length) return 0;

  return getModelQueueItems(dataset, modelId, frame, result, []).length;
}

export function getModelFrameSummary(dataset: ViewerDataset, modelId: string, item: DatasetItem) {
  return dataset.frameIds
    .filter((frame) => item.responsesByModel[modelId]?.frames?.[frame])
    .map((frame) => ({
      frame,
      response: item.responsesByModel[modelId].frames[frame],
    }));
}

export function getScoreMatrixRows(dataset: ViewerDataset) {
  return dataset.models.map((model) => ({
    model,
    scores: model.scores,
  }));
}

export function statusTone(response: DatasetFrameResponse | null) {
  if (!response || response.parseStatus === "missing") return "missing";
  if (response.parseStatus === "malformed") return "warning";
  return response.correctness === "correct" ? "correct" : "wrong";
}

export function statusLabel(response: DatasetFrameResponse | null) {
  if (!response || response.parseStatus === "missing") return "No data";
  if (response.parseStatus === "malformed") return "Malformed";
  return response.correctness === "correct" ? "Correct" : "Wrong";
}

export function statusChoiceLabel(response: DatasetFrameResponse | null) {
  if (!response || response.parseStatus === "missing") return "—";
  return response.answer ?? "?";
}

export function availableModelFrameOptions(dataset: ViewerDataset, modelId: string) {
  const model = dataset.modelsById[modelId];
  if (!model) return [];

  return Array.from(new Set(model.frames)).sort((a, b) => {
    const ai = FRAME_ORDER.indexOf(a);
    const bi = FRAME_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
