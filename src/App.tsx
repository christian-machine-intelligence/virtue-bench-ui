import { useDeferredValue, useEffect, useState } from "react";

import {
  buildRouteSearch,
  buildShowcaseDecks,
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
  type ViewMode,
} from "./viewer/model";
import { PageTabs, VirtueTabs } from "./viewer/chrome";
import { OverviewView } from "./viewer/OverviewView";
import { InspectView } from "./viewer/InspectView";

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

  const pushRoute = (next: Partial<RouteState>) => {
    setRoute((current) => {
      const candidate = { ...current, ...next };
      const unchanged =
        candidate.viewMode === current.viewMode &&
        candidate.virtue === current.virtue &&
        candidate.itemId === current.itemId &&
        candidate.preset === current.preset;

      if (unchanged) return current;

      if (typeof window !== "undefined") {
        const search = buildRouteSearch(candidate);
        if (window.location.search !== search) {
          window.history.pushState(null, "", `${window.location.pathname}${search}`);
        }
      }

      return candidate;
    });
  };

  const setRoutedViewMode = (viewMode: ViewMode) => {
    pushRoute({ viewMode });
  };

  const setRoutedVirtue = (virtue: string) => {
    setSearch("");
    setSelectedModels([]);
    pushRoute({ virtue, itemId: null });
  };

  const setRoutedPreset = (preset: Preset) => {
    pushRoute({ viewMode: "inspect", preset });
  };

  const setRoutedSelectedItemId = (itemId: number | null) => {
    pushRoute({ viewMode: "inspect", itemId });
  };

  const inspectItem = (itemId: number) => {
    setSearch("");
    pushRoute({ viewMode: "inspect", itemId, preset: "all" });
  };

  if (!summary || !virtueData || virtueData.virtue !== route.virtue) {
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
  const virtueSummary = summary.virtues[route.virtue];
  const frames = Object.keys(summary.frames).sort(frameSort);
  const presetMeta = PRESETS.find((entry) => entry.value === route.preset) ?? PRESETS[0];
  const virtueOptions = VIRTUE_ORDER.filter((entry) => entry in summary.virtues);
  const searchParts = deferredSearch ? deferredSearch.split(/\s+/).filter(Boolean) : [];
  const filteredItems = filterItems(virtueData.items, visibleModels, route.preset, searchParts);
  const selectedItem = getSelectedItem(virtueData.items, filteredItems, route.itemId);
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
              <PageTabs viewMode={route.viewMode} setViewMode={setRoutedViewMode} />
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

        {route.viewMode === "overview" ? (
          <OverviewView
            virtue={route.virtue}
            summary={summary}
            virtueSummary={virtueSummary}
            availableModels={availableModels}
            frames={frames}
            showcaseDecks={showcaseDecks}
            sharedFlipItems={sharedFlipItems}
            stableFailureItems={stableFailureItems}
            onInspectItem={inspectItem}
          />
        ) : (
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
        )}

        <footer className="px-2 pt-1 text-center text-[11px] text-ink-soft/80">
          Exported {formatGeneratedAt(summary.generatedAt)}
        </footer>
      </div>
    </main>
  );
}
