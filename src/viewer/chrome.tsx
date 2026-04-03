import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { framePromptDelta, titleCase, type ViewMode } from "./model";

export const PANEL_CLASS = "rounded-[28px] border border-line bg-paper/95 backdrop-blur-sm";
export const RAIL_CLASS = "rounded-[24px] border border-line bg-white/72 backdrop-blur-sm";
export const FIELD_CLASS =
  "h-11 rounded-2xl border border-line bg-white px-3 text-sm text-stone-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition-[border-color,box-shadow,background-color] focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(22,61,52,0.08)]";
export const BUTTON_CLASS =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-white px-3 py-2 text-sm text-stone-700 transition-[transform,background-color,border-color,color] hover:border-accent/30 hover:bg-accent-soft/40 hover:text-stone-900 active:scale-[0.96]";
export const SMALL_BUTTON_CLASS =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-stone-700 transition-[transform,background-color,border-color,color] hover:border-accent/30 hover:bg-accent-soft/40 hover:text-stone-900 active:scale-[0.97]";
const TAB_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-[transform,background-color,border-color,color] active:scale-[0.96]";
const POPOVER_GAP = 10;
const POPOVER_VIEWPORT_GUTTER = 12;

export function InlineMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-line bg-white/72 px-2.5 py-1">
      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </span>
      <span className="text-[13px] font-medium tabular-nums text-stone-900">{value}</span>
    </div>
  );
}

export function InfoPopover({
  label,
  children,
  widthClass = "w-[min(20rem,calc(100vw-3rem))]",
  align = "center",
  buttonClassName,
  iconClassName = "size-3",
  panelClassName,
}: {
  label: string;
  children: ReactNode;
  widthClass?: string;
  align?: "left" | "center" | "right";
  buttonClassName?: string;
  iconClassName?: string;
  panelClassName?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{
    top: number;
    left: number;
    transformOrigin: string;
  } | null>(null);
  const open = hovered || pinned;

  const clearCloseTimer = () => {
    if (closeTimerRef.current == null || typeof window === "undefined") return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const openPopover = () => {
    clearCloseTimer();
    setHovered(true);
  };

  const closePopover = () => {
    clearCloseTimer();
    setHovered(false);
    setPinned(false);
  };

  const scheduleClose = () => {
    if (pinned) return;
    clearCloseTimer();
    if (typeof window === "undefined") return;
    closeTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      closeTimerRef.current = null;
    }, 90);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closePopover();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopover();
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

      let left =
        align === "left"
          ? triggerRect.left
          : align === "right"
            ? triggerRect.right - panelRect.width
            : triggerRect.left + triggerRect.width / 2 - panelRect.width / 2;

      left = Math.min(
        Math.max(left, POPOVER_VIEWPORT_GUTTER),
        viewportWidth - panelRect.width - POPOVER_VIEWPORT_GUTTER,
      );

      let top = triggerRect.bottom + POPOVER_GAP;
      let verticalOrigin = "top";
      const topFallback = triggerRect.top - POPOVER_GAP - panelRect.height;

      if (
        top + panelRect.height > viewportHeight - POPOVER_VIEWPORT_GUTTER &&
        topFallback >= POPOVER_VIEWPORT_GUTTER
      ) {
        top = topFallback;
        verticalOrigin = "bottom";
      } else if (top + panelRect.height > viewportHeight - POPOVER_VIEWPORT_GUTTER) {
        top = Math.max(
          POPOVER_VIEWPORT_GUTTER,
          viewportHeight - panelRect.height - POPOVER_VIEWPORT_GUTTER,
        );
      }

      setPanelStyle({
        top,
        left,
        transformOrigin: `${align === "right" ? "right" : align === "left" ? "left" : "center"} ${verticalOrigin}`,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align]);

  const trigger = (
    <span className="inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        ref={triggerRef}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        onFocus={openPopover}
        onBlur={scheduleClose}
        onClick={() => {
          clearCloseTimer();
          setHovered(false);
          setPinned((current) => !current);
        }}
        className={
          buttonClassName ??
          "inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-line bg-white/90 text-ink-soft transition-colors hover:border-accent/30 hover:text-accent focus:border-accent/30 focus:text-accent focus:outline-none"
        }
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={iconClassName}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 8.1V13.1" />
          <path d="M10 5.9h.01" />
        </svg>
      </button>
    </span>
  );

  if (!open || typeof document === "undefined") {
    return trigger;
  }

  return (
    <>
      {trigger}
      {createPortal(
        <div
          ref={panelRef}
          role="tooltip"
          onMouseEnter={openPopover}
          onMouseLeave={scheduleClose}
          onFocus={openPopover}
          onBlur={scheduleClose}
          style={
            panelStyle
              ? {
                  position: "fixed",
                  top: panelStyle.top,
                  left: panelStyle.left,
                  transformOrigin: panelStyle.transformOrigin,
                }
              : {
                  position: "fixed",
                  top: -9999,
                  left: -9999,
                  visibility: "hidden",
                }
          }
          className={[
            "z-[90] max-h-[min(72vh,34rem)] overflow-auto rounded-[16px] border border-line bg-[#fffdf9]/98 px-3 py-3 text-left text-[12px] leading-5 text-stone-700 shadow-[0_18px_40px_rgba(28,24,20,0.14)]",
            widthClass,
            panelClassName ?? "",
          ].join(" ")}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}

export function MetaPill({ children, info }: { children: ReactNode; info?: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/76 px-2.5 py-1 text-[13px] text-stone-800">
      <span>{children}</span>
      {info ? <InfoPopover label="Explain benchmark detail">{info}</InfoPopover> : null}
    </div>
  );
}

export function PageTabs({
  activeView,
  setViewMode,
}: {
  activeView: "summary" | "method" | "scores" | "inspect";
  setViewMode: (view: Extract<ViewMode, "summary" | "method" | "scores" | "inspect">) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white/70 p-1">
      {[
        ["summary", "Summary"],
        ["method", "Method"],
        ["scores", "Scores"],
        ["inspect", "Inspect"],
      ].map(([value, label]) => {
        const active = value === activeView;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setViewMode(value as "summary" | "method" | "scores" | "inspect")}
            className={[
              TAB_CLASS,
              active
                ? "border-accent/20 bg-accent text-white"
                : "border-transparent bg-transparent text-stone-700 hover:bg-accent-soft/45",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function VirtueTabs({
  virtue,
  setVirtue,
  options,
}: {
  virtue: string;
  setVirtue: (virtue: string) => void;
  options: string[];
}) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-line bg-white/70 p-1">
      {options.map((entry) => {
        const active = entry === virtue;
        return (
          <button
            key={entry}
            type="button"
            onClick={() => setVirtue(entry)}
            className={[
              "inline-flex min-h-10 items-center justify-center rounded-full px-3 py-1.5 text-sm transition-[transform,background-color,border-color,color] active:scale-[0.97]",
              active ? "bg-accent text-white" : "text-stone-700 hover:bg-accent-soft/40",
            ].join(" ")}
          >
            {titleCase(entry)}
          </button>
        );
      })}
    </div>
  );
}

export function FrameInfoLabel({
  frame,
  label,
  kind,
  blurb,
  compact = false,
  align = "left",
}: {
  frame: string;
  label: string;
  kind: string;
  blurb: string;
  compact?: boolean;
  align?: "left" | "right";
}) {
  const { diff, shared } = framePromptDelta(frame);

  return (
    <div className="inline-flex max-w-full items-start gap-1.5">
      <div
        className={[
          compact ? "grid gap-0.5 text-left" : "grid gap-1 text-left",
          "normal-case tracking-normal",
        ].join(" ")}
      >
        <div className="font-medium text-stone-900">{label}</div>
        <div className="text-[10px] font-medium text-ink-soft/80">{kind}</div>
      </div>

      <InfoPopover
        label={`Explain ${label} frame`}
        widthClass="w-[min(23rem,calc(100vw-3rem))]"
        align={align}
        buttonClassName="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-white/88 text-ink-soft transition-colors hover:border-accent/30 hover:text-accent focus:border-accent/30 focus:text-accent focus:outline-none"
        iconClassName="size-3.5"
        panelClassName="rounded-[18px] p-4 text-left normal-case tracking-normal"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[15px] font-medium text-stone-900">{label}</div>
          <span className="rounded-full bg-accent-soft/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
            {kind}
          </span>
        </div>

        <p className="mt-2 text-[14px] leading-6 text-stone-700">{blurb}</p>

        <div className="mt-3 border-t border-line/70 pt-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
            Prompt steer
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-6 text-stone-800">{diff}</p>
        </div>

        <div className="mt-3 border-t border-line/60 pt-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
            Shared format
          </div>
          <p className="mt-1.5 text-[14px] leading-6 text-stone-700">{shared}</p>
        </div>
      </InfoPopover>
    </div>
  );
}
