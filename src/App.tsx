import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  buildRouteSearch,
  buildShowcaseDecks,
  DEFAULT_MODEL_RESULT,
  DEFAULT_PRESET,
  filterItems,
  formatGeneratedAt,
  frameSort,
  getAvailableModels,
  getDetailFrames,
  getDetailModels,
  getFeaturedModelsForVirtue,
  getSelectedItem,
  getSharedFlipItems,
  getStableFailureItems,
  PRESETS,
  readRouteFromLocation,
  VIRTUE_ORDER,
  type Preset,
  type RouteState,
  type Summary,
  type VirtuePayload,
} from "./viewer/model";
import {
  getDatasetSelectedItem,
  getModelQueueItems,
  normalizeViewerDataset,
} from "./viewer/dataset";
import { PageTabs, VirtueTabs } from "./viewer/chrome";
import { SummaryView } from "./viewer/OverviewView";
import { ScoresView } from "./viewer/ScoresView";
import { InspectView } from "./viewer/InspectView";
import { ModelView } from "./viewer/ModelView";

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center text-stone-600">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">VirtueBench</p>
        <h1 className="font-display text-4xl text-stone-900">Viewer</h1>
        <p>Loading normalized result data…</p>
      </div>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => readRouteFromLocation());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [virtueData, setVirtueData] = useState<VirtuePayload | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    let cancelled = false;

    fetch("./data/summary.json")
      .then((res) => res.json())
      .then((data: Summary) => {
        if (!cancelled) setSummary(data);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setVirtueData(null);

    fetch(`./data/virtues/${route.virtue}.json`)
      .then((res) => res.json())
      .then((data: VirtuePayload) => {
        if (!cancelled) setVirtueData(data);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, [route.virtue]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setRoute(readRouteFromLocation());
      setSearch("");
      setSelectedModels([]);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextRoute: RouteState) => {
    setRoute((current) => {
      const currentSearch = buildRouteSearch(current);
      const nextSearch = buildRouteSearch(nextRoute);
      if (currentSearch === nextSearch) return current;

      if (typeof window !== "undefined" && window.location.search !== nextSearch) {
        window.history.pushState(null, "", `${window.location.pathname}${nextSearch}`);
      }

      return nextRoute;
    });
  };

  const setRoutedViewMode = (viewMode: "summary" | "scores" | "inspect") => {
    if (viewMode === "inspect") {
      navigate({
        viewMode: "inspect",
        virtue: route.virtue,
        preset: route.viewMode === "inspect" ? route.preset : DEFAULT_PRESET,
        itemId: route.viewMode === "inspect" ? route.itemId : null,
      });
      return;
    }

    navigate({
      viewMode,
      virtue: route.virtue,
    });
  };

  const setRoutedVirtue = (virtue: string) => {
    setSearch("");
    setSelectedModels([]);

    if (route.viewMode === "inspect") {
      navigate({
        viewMode: "inspect",
        virtue,
        preset: DEFAULT_PRESET,
        itemId: null,
      });
      return;
    }

    if (route.viewMode === "model") {
      const modelStillExists = summary?.models.some(
        (model) => model.rawId === route.modelId && model.virtues.includes(virtue),
      );

      if (modelStillExists) {
        navigate({
          viewMode: "model",
          virtue,
          modelId: route.modelId,
          frame: route.frame,
          result: route.result,
          itemId: null,
        });
      } else {
        navigate({ viewMode: "scores", virtue });
      }
      return;
    }

    navigate({
      viewMode: route.viewMode,
      virtue,
    });
  };

  const setRoutedPreset = (preset: Preset) => {
    navigate({
      viewMode: "inspect",
      virtue: route.virtue,
      preset,
      itemId: route.viewMode === "inspect" ? route.itemId : null,
    });
  };

  const setRoutedSelectedItemId = (itemId: number | null) => {
    navigate({
      viewMode: "inspect",
      virtue: route.virtue,
      preset: route.viewMode === "inspect" ? route.preset : DEFAULT_PRESET,
      itemId,
    });
  };

  const inspectItem = (itemId: number) => {
    setSearch("");
    navigate({
      viewMode: "inspect",
      virtue: route.virtue,
      itemId,
      preset: "all",
    });
  };

  const dataset = useMemo(() => {
    if (!summary || !virtueData || virtueData.virtue !== route.virtue) return null;
    return normalizeViewerDataset(summary, virtueData);
  }, [summary, virtueData, route.virtue]);

  if (!summary || !virtueData || virtueData.virtue !== route.virtue || !dataset) {
    return <LoadingScreen />;
  }

  const availableModels = getAvailableModels(summary, route.virtue);
  const availableModelNames = availableModels.map((model) => model.display);
  const featuredVisibleModels = summary.featuredModels.filter((model) =>
    availableModelNames.includes(model),
  );
  const defaultVisibleModels = featuredVisibleModels.length
    ? featuredVisibleModels
    : availableModelNames;
  const visibleModels = selectedModels.length
    ? availableModelNames.filter((model) => selectedModels.includes(model))
    : defaultVisibleModels;
  const inspectPreset = route.viewMode === "inspect" ? route.preset : DEFAULT_PRESET;
  const inspectItemId = route.viewMode === "inspect" ? route.itemId : null;
  const virtueSummary = summary.virtues[route.virtue];
  const frames = Object.keys(summary.frames).sort(frameSort);
  const presetMeta = PRESETS.find((entry) => entry.value === inspectPreset) ?? PRESETS[0];
  const virtueOptions = VIRTUE_ORDER.filter((entry) => entry in summary.virtues);
  const searchParts = deferredSearch ? deferredSearch.split(/\s+/).filter(Boolean) : [];
  const filteredItems = filterItems(virtueData.items, visibleModels, inspectPreset, searchParts);
  const selectedItem = getSelectedItem(virtueData.items, filteredItems, inspectItemId);
  const detailFrames = getDetailFrames(frames, selectedItem, visibleModels);
  const detailModels = getDetailModels(selectedItem, visibleModels);
  const sharedFlipItems = getSharedFlipItems(virtueData.items);
  const stableFailureItems = getStableFailureItems(virtueData.items);
  const showcaseDecks = buildShowcaseDecks(
    route.virtue,
    virtueData.items,
    getFeaturedModelsForVirtue(summary, route.virtue),
    availableModelNames,
  );
  const activeModelId =
    route.viewMode === "model" && dataset.modelsById[route.modelId]
      ? route.modelId
      : (dataset.models[0]?.id ?? "");
  const modelFilteredItems =
    route.viewMode === "model" && activeModelId
      ? getModelQueueItems(dataset, activeModelId, route.frame, route.result, searchParts)
      : [];
  const modelSelectedItem =
    route.viewMode === "model"
      ? getDatasetSelectedItem(dataset.items, modelFilteredItems, route.itemId)
      : null;

  const toggleModel = (model: string) => {
    setSelectedModels((current) => {
      const baseSelection = current.length ? current : defaultVisibleModels;

      if (baseSelection.includes(model)) {
        return baseSelection.length === 1
          ? baseSelection
          : baseSelection.filter((entry) => entry !== model);
      }

      return availableModelNames.filter(
        (entry) => baseSelection.includes(entry) || entry === model,
      );
    });
  };

  const openModel = (modelId: string, frame: string | null) => {
    setSearch("");
    navigate({
      viewMode: "model",
      virtue: route.virtue,
      modelId,
      frame,
      result: DEFAULT_MODEL_RESULT,
      itemId: null,
    });
  };

  const setModelFrame = (frame: string | null) => {
    if (route.viewMode !== "model") return;

    navigate({
      ...route,
      frame,
      itemId: null,
    });
  };

  const setModelResult = (result: "wrong" | "correct" | "all") => {
    if (route.viewMode !== "model") return;

    navigate({
      ...route,
      result,
      itemId: null,
    });
  };

  const setModelId = (modelId: string) => {
    if (route.viewMode !== "model") return;

    navigate({
      ...route,
      modelId,
      itemId: null,
    });
  };

  const setModelSelectedItemId = (itemId: number | null) => {
    if (route.viewMode !== "model") return;

    navigate({
      ...route,
      itemId,
    });
  };

  return (
    <main className="min-h-screen px-4 py-4 text-stone-900 md:px-6 xl:py-5">
      <div className="mx-auto max-w-[1760px] space-y-4">
        <header className="px-2 pt-1">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap xl:gap-4">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="pr-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  VirtueBench
                </p>
                <h1 className="font-display text-[1.9rem] leading-none md:text-[2.15rem]">
                  Viewer
                </h1>
              </div>
              <PageTabs
                activeView={route.viewMode === "model" ? "scores" : route.viewMode}
                setViewMode={setRoutedViewMode}
              />
            </div>

            <div className="ml-auto">
              <VirtueTabs
                virtue={route.virtue}
                setVirtue={setRoutedVirtue}
                options={virtueOptions}
              />
            </div>
          </div>
        </header>

        {route.viewMode === "summary" ? (
          <SummaryView
            virtue={route.virtue}
            summary={summary}
            virtueSummary={virtueSummary}
            showcaseDecks={showcaseDecks}
            sharedFlipItems={sharedFlipItems}
            stableFailureItems={stableFailureItems}
            onInspectItem={inspectItem}
          />
        ) : route.viewMode === "scores" ? (
          <ScoresView summary={summary} dataset={dataset} onOpenModel={openModel} />
        ) : route.viewMode === "inspect" ? (
          <InspectView
            virtue={route.virtue}
            summary={summary}
            preset={route.preset}
            presetMeta={presetMeta}
            search={search}
            setSearch={setSearch}
            visibleModels={visibleModels}
            availableModels={availableModels}
            featuredVisibleModels={featuredVisibleModels}
            filteredItems={filteredItems}
            selectedItem={selectedItem}
            detailFrames={detailFrames}
            detailModels={detailModels}
            toggleModel={toggleModel}
            setSelectedModels={setSelectedModels}
            setSelectedItemId={setRoutedSelectedItemId}
            setPreset={setRoutedPreset}
          />
        ) : (
          <ModelView
            dataset={dataset}
            modelId={activeModelId}
            frame={route.frame}
            result={route.result}
            search={search}
            setSearch={setSearch}
            filteredItems={modelFilteredItems}
            selectedItem={modelSelectedItem}
            setModelId={setModelId}
            setFrame={setModelFrame}
            setResult={setModelResult}
            setSelectedItemId={setModelSelectedItemId}
            onInspectItem={inspectItem}
          />
        )}

        <footer className="px-2 pt-1 text-center text-[11px] text-ink-soft/80">
          Exported {formatGeneratedAt(summary.generatedAt)}
        </footer>
      </div>
    </main>
  );
}
