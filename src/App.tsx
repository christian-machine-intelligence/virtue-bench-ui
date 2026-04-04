import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  buildRouteHref,
  DEFAULT_VIRTUE,
  DEFAULT_MODEL_RESULT,
  DEFAULT_PRESET,
  filterItems,
  formatGeneratedAt,
  frameSort,
  getAvailableModels,
  getDetailFrames,
  getDetailModels,
  getSelectedItem,
  PRESETS,
  readRouteFromLocation,
  resolveAppUrl,
  VIRTUE_ORDER,
  type OverviewPayload,
  type Preset,
  type RouteState,
  type ShowcaseSelection,
  type Summary,
  type VirtuePayload,
} from "./viewer/model";
import {
  getDatasetSelectedItem,
  getModelQueueItems,
  normalizeViewerDataset,
} from "./viewer/dataset";
import { PANEL_CLASS, PageTabs, VirtueTabs } from "./viewer/chrome";
import { SummaryView } from "./viewer/OverviewView";
import { MethodView } from "./viewer/MethodView";
import { ScoresView } from "./viewer/ScoresView";
import { InspectView } from "./viewer/InspectView";
import { ModelView } from "./viewer/ModelView";

async function fetchJson<T>(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center text-stone-600">
      <div className="space-y-3">
        <h1 className="font-display text-4xl text-stone-900">VirtueBench</h1>
        <p>Loading front-door data…</p>
      </div>
    </main>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.63 2.29 6.71 5.47 7.79.4.08.55-.18.55-.39 0-.19-.01-.83-.01-1.5-2.01.38-2.53-.5-2.69-.95-.09-.24-.48-.99-.82-1.19-.28-.15-.68-.54-.01-.55.63-.01 1.08.59 1.23.84.72 1.24 1.87.89 2.33.68.07-.54.28-.89.5-1.09-1.78-.21-3.64-.92-3.64-4.07 0-.9.31-1.64.82-2.22-.08-.21-.36-1.05.08-2.19 0 0 .67-.22 2.2.85a7.38 7.38 0 0 1 4 0c1.53-1.07 2.2-.85 2.2-.85.44 1.14.16 1.98.08 2.19.51.58.82 1.31.82 2.22 0 3.16-1.87 3.86-3.65 4.07.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.47.55.39A8.22 8.22 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z" />
    </svg>
  );
}

function RouteLoadingPanel({ virtue }: { virtue: string }) {
  return (
    <section
      className={[PANEL_CLASS, "grid min-h-[28rem] place-items-center px-6 py-10"].join(" ")}
    >
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{virtue}</p>
        <h2 className="font-display text-3xl text-stone-900">Loading evidence</h2>
        <p className="text-sm text-ink-soft">Fetching full item-level results for this virtue.</p>
      </div>
    </section>
  );
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => readRouteFromLocation());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [summaryVirtue, setSummaryVirtue] = useState(DEFAULT_VIRTUE);
  const [summaryShowcase, setSummaryShowcaseState] = useState<ShowcaseSelection>({
    kind: "benchmark",
    itemId: null,
    modelId: null,
  });
  const [virtueDataByVirtue, setVirtueDataByVirtue] = useState<Record<string, VirtuePayload>>({});
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const virtueRequestsRef = useRef<Record<string, Promise<VirtuePayload>>>({});
  const activeVirtue = route.viewMode === "summary" ? summaryVirtue : route.virtue;
  const routeVirtue = route.viewMode === "summary" ? null : route.virtue;
  const overviewVirtue = overview?.virtues[activeVirtue] ?? null;
  const virtueOptions = summary ? VIRTUE_ORDER.filter((entry) => entry in summary.virtues) : [];
  const virtueData = routeVirtue ? (virtueDataByVirtue[routeVirtue] ?? null) : null;
  const dataset = useMemo(
    () => (summary && virtueData ? normalizeViewerDataset(summary, virtueData) : null),
    [summary, virtueData],
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchJson<Summary>(resolveAppUrl("data/summary.json")),
      fetchJson<OverviewPayload>(resolveAppUrl("data/overview.json")),
    ])
      .then(([summaryData, overviewData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setOverview(overviewData);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!summary || summaryVirtue in summary.virtues) return;
    setSummaryVirtue(VIRTUE_ORDER.find((entry) => entry in summary.virtues) ?? DEFAULT_VIRTUE);
  }, [summary, summaryVirtue]);

  useEffect(() => {
    if (route.viewMode === "summary" || route.viewMode === "method" || !routeVirtue) return;
    if (virtueDataByVirtue[routeVirtue]) return;

    let cancelled = false;
    const existing = virtueRequestsRef.current[routeVirtue];
    const request =
      existing ?? fetchJson<VirtuePayload>(resolveAppUrl(`data/virtues/${routeVirtue}.json`));
    virtueRequestsRef.current[routeVirtue] = request;

    request
      .then((data) => {
        if (cancelled) return;

        setVirtueDataByVirtue((current) =>
          current[data.virtue]
            ? current
            : {
                ...current,
                [data.virtue]: data,
              },
        );
      })
      .catch((error) => {
        delete virtueRequestsRef.current[routeVirtue];
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [route.viewMode, routeVirtue, virtueDataByVirtue]);

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = "VirtueBench";
  }, []);

  const navigate = (nextRoute: RouteState) => {
    startTransition(() => {
      setRoute((current) => {
        const currentHref = buildRouteHref(current);
        const nextHref = buildRouteHref(nextRoute);
        if (currentHref === nextHref) return current;

        if (typeof window !== "undefined" && window.location.pathname !== nextHref) {
          window.history.pushState(null, "", nextHref);
        }

        return nextRoute;
      });
    });
  };

  const setRoutedViewMode = (viewMode: "summary" | "method" | "scores" | "inspect") => {
    if (viewMode === "summary") {
      if (route.viewMode !== "summary") {
        setSummaryVirtue(route.virtue);
      }
      navigate({ viewMode: "summary" });
      return;
    }

    if (viewMode === "method") {
      if (route.viewMode === "summary") {
        navigate({
          viewMode: "method",
          virtue: summaryVirtue,
          kind: "benchmark",
          itemId: summaryShowcase.itemId,
          modelId: summaryShowcase.modelId,
        });
      } else {
        navigate({
          viewMode: "method",
          virtue: route.virtue,
          kind: route.viewMode === "method" ? route.kind : "benchmark",
          itemId: route.viewMode === "method" ? route.itemId : null,
          modelId: route.viewMode === "method" ? route.modelId : null,
        });
      }
      return;
    }

    if (viewMode === "inspect") {
      navigate({
        viewMode: "inspect",
        virtue: route.viewMode === "summary" ? summaryVirtue : route.virtue,
        preset: route.viewMode === "inspect" ? route.preset : DEFAULT_PRESET,
        itemId: route.viewMode === "inspect" ? route.itemId : null,
      });
      return;
    }

    navigate({
      viewMode,
      virtue: route.viewMode === "summary" ? summaryVirtue : route.virtue,
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

    if (route.viewMode === "summary") {
      setSummaryVirtue(virtue);
      setSummaryShowcaseState((current) => ({
        ...current,
        kind: "benchmark",
        itemId: null,
      }));
      return;
    }

    if (route.viewMode === "method") {
      navigate({
        viewMode: "method",
        virtue,
        kind: route.kind,
        itemId: null,
        modelId: null,
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

  const setSummaryShowcase = (showcase: ShowcaseSelection) => {
    setSummaryShowcaseState(showcase);
  };

  const setMethodShowcase = (showcase: ShowcaseSelection) => {
    if (route.viewMode !== "method") return;

    navigate({
      viewMode: "method",
      virtue: route.virtue,
      kind: showcase.kind,
      itemId: showcase.itemId,
      modelId: showcase.modelId,
    });
  };

  const setRoutedPreset = (preset: Preset) => {
    if (route.viewMode !== "inspect") return;

    navigate({
      viewMode: "inspect",
      virtue: route.virtue,
      preset,
      itemId: route.itemId,
    });
  };

  const setRoutedSelectedItemId = (itemId: number | null) => {
    if (route.viewMode !== "inspect") return;

    navigate({
      viewMode: "inspect",
      virtue: route.virtue,
      preset: route.preset,
      itemId,
    });
  };

  const inspectItem = (itemId: number) => {
    setSearch("");
    navigate({
      viewMode: "inspect",
      virtue: route.viewMode === "summary" ? summaryVirtue : route.virtue,
      itemId,
      preset: "all",
    });
  };

  const openModel = (modelId: string, frame: string | null) => {
    if (route.viewMode === "summary") return;

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

  if (!summary || !overview) {
    return <LoadingScreen />;
  }

  if (!overviewVirtue) {
    return <LoadingScreen />;
  }

  const methodShowcase: ShowcaseSelection =
    route.viewMode === "method"
      ? {
          kind: route.kind,
          itemId: route.itemId,
          modelId: route.modelId,
        }
      : {
          kind: "benchmark",
          itemId: null,
          modelId: null,
        };

  let content = (
    <SummaryView
      virtue={summaryVirtue}
      summary={summary}
      overviewVirtue={overviewVirtue}
      showcase={summaryShowcase}
      onInspectItem={inspectItem}
      onSetShowcase={setSummaryShowcase}
      onSelectVirtue={setRoutedVirtue}
      onOpenMethod={() =>
        navigate({
          viewMode: "method",
          virtue: summaryVirtue,
          kind: "benchmark",
          itemId: summaryShowcase.itemId,
          modelId: summaryShowcase.modelId,
        })
      }
    />
  );

  if (route.viewMode === "method") {
    content = (
      <MethodView
        virtue={route.virtue}
        summary={summary}
        overviewVirtue={overviewVirtue}
        showcase={methodShowcase}
        onInspectItem={inspectItem}
        onSetShowcase={setMethodShowcase}
      />
    );
  } else if (route.viewMode !== "summary") {
    if (!virtueData || !dataset) {
      content = <RouteLoadingPanel virtue={route.virtue} />;
    } else if (route.viewMode === "scores") {
      content = <ScoresView summary={summary} dataset={dataset} onOpenModel={openModel} />;
    } else {
      const searchParts = deferredSearch ? deferredSearch.split(/\s+/).filter(Boolean) : [];
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

      if (route.viewMode === "inspect") {
        const presetMeta = PRESETS.find((entry) => entry.value === route.preset) ?? PRESETS[0];
        const filteredItems = filterItems(
          virtueData.items,
          visibleModels,
          route.preset,
          searchParts,
        );
        const selectedItem = getSelectedItem(virtueData.items, filteredItems, route.itemId);
        const frames = Object.keys(summary.frames).sort(frameSort);
        const detailFrames = getDetailFrames(frames, selectedItem, visibleModels);
        const detailModels = getDetailModels(selectedItem, visibleModels);

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

        content = (
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
        );
      } else {
        const activeModelId = dataset.modelsById[route.modelId]
          ? route.modelId
          : (dataset.models[0]?.id ?? "");
        const filteredItems = activeModelId
          ? getModelQueueItems(dataset, activeModelId, route.frame, route.result, searchParts)
          : [];
        const selectedItem = getDatasetSelectedItem(dataset.items, filteredItems, route.itemId);

        content = (
          <ModelView
            dataset={dataset}
            modelId={activeModelId}
            frame={route.frame}
            result={route.result}
            search={search}
            setSearch={setSearch}
            filteredItems={filteredItems}
            selectedItem={selectedItem}
            setModelId={setModelId}
            setFrame={setModelFrame}
            setResult={setModelResult}
            setSelectedItemId={setModelSelectedItemId}
            onInspectItem={inspectItem}
          />
        );
      }
    }
  }

  return (
    <main className="min-h-screen px-4 py-4 text-stone-900 md:px-6 xl:py-5">
      <div className="mx-auto max-w-[1760px] space-y-4">
        <header className="px-2 pt-1">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap xl:gap-4">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="pr-2">
                <h1 className="font-display text-[2rem] leading-none text-stone-900 md:text-[2.2rem]">
                  VirtueBench
                </h1>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft/80">
                  <span>by</span>
                  <a
                    href="https://github.com/christian-machine-intelligence/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-accent"
                  >
                    Christian Machine Intelligence
                  </a>
                </div>
              </div>
              <PageTabs
                activeView={route.viewMode === "model" ? "scores" : route.viewMode}
                setViewMode={setRoutedViewMode}
              />
            </div>

            {route.viewMode === "summary" ? null : (
              <div className="ml-auto">
                <VirtueTabs
                  virtue={route.virtue}
                  setVirtue={setRoutedVirtue}
                  options={virtueOptions}
                />
              </div>
            )}
          </div>
        </header>

        {content}

        <footer className="px-2 pt-1 text-[11px] text-ink-soft/80">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
            <a
              href="https://github.com/christian-machine-intelligence/virtue-bench"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-stone-700 underline decoration-line-strong/80 underline-offset-3 transition-colors hover:text-accent"
            >
              <GitHubMark />
              <span>Benchmark repo</span>
            </a>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <a
              href="https://github.com/christian-machine-intelligence/virtue-bench-ui"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-stone-700 underline decoration-line-strong/80 underline-offset-3 transition-colors hover:text-accent"
            >
              <GitHubMark />
              <span>UI repo</span>
            </a>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <span>Exported {formatGeneratedAt(summary.generatedAt)}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
