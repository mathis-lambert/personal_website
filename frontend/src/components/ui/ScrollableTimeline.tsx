import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

export type TimelineData = {
  title: string;
  company: string;
  date: string;
  description: string;
};

export type ClassNames = {
  root?: string;
  gradientTop?: string;
  gradientBottom?: string;
  motionDiv?: string;
  itemContainer?: string;
  line?: string;
  item?: string;
  dotContainerWrapper?: string;
  dotWrapper?: string;
  dotOuter?: string;
  dotInner?: string;
  dotConnector?: string;
  contentWrapper?: string;
  title?: string;
  company?: string;
  date?: string;
  description?: string;
  scrollHintContainer?: string;
  scrollHint?: string;
  scrollHintIcon?: string;
};

export type ScrollableTimelineProps<T extends Record<string, unknown>> = {
  data: T[];
  keyMappings?: Partial<Record<keyof TimelineData, keyof T>>;
  mobileBreakpoint?: number;
  scrollSpeed?: number;
  wheelSensitivity?: number;
  accentColor?: string;
  showScrollHint?: boolean;
  showGradients?: boolean;
  classNames?: ClassNames;
};

const defaultClassNames: Required<ClassNames> = {
  root:
    'relative h-full w-full overflow-hidden group select-none overscroll-none',
  gradientTop:
    'absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/95 dark:from-slate-950/95 to-transparent z-10 pointer-events-none',
  gradientBottom:
    'absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/95 dark:from-slate-950/95 to-transparent z-10 pointer-events-none',
  motionDiv:
    'relative left-0 top-0 h-full w-full overflow-y-auto overscroll-contain will-change-scroll touch-none',
  itemContainer: 'relative flex flex-col',
  line:
    'absolute left-6 top-0 h-full w-px bg-gradient-to-b from-slate-200 via-[var(--accent-color)] to-slate-200 dark:from-slate-700 dark:via-[var(--accent-color)] dark:to-slate-700 opacity-70',
  item: 'relative w-full py-4 pl-14 pr-4 group/item',
  dotContainerWrapper:
    'absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2',
  dotWrapper: 'relative h-3 w-3',
  dotOuter:
    'absolute inset-0 rounded-full bg-[var(--accent-color)] opacity-30 blur-[0.5px] group-hover/item:scale-[2.2] transition-transform duration-300',
  dotInner:
    'relative h-3 w-3 rounded-full bg-[var(--accent-color)] ring-2 ring-white dark:ring-slate-900 group-hover/item:scale-110 transition-transform duration-300',
  dotConnector:
    'absolute left-8 top-1/2 w-6 h-0.5 bg-gradient-to-r from-[var(--accent-color)] to-transparent opacity-0 group-hover/item:opacity-60 transition-opacity duration-300',
  contentWrapper:
    'text-left rounded-xl p-4 -ml-3 transition-all duration-300 backdrop-blur-sm bg-white/40 dark:bg-slate-900/20 ring-1 ring-slate-900/5 dark:ring-white/10 group-hover/item:shadow-xl group-hover/item:shadow-[var(--accent-color)]/20 group-hover/item:translate-x-0.5',
  title:
    'text-base font-bold text-slate-800 dark:text-slate-100 group-hover/item:text-[var(--accent-color)] transition-colors duration-300',
  company: 'text-sm font-semibold text-slate-600 dark:text-slate-400',
  date: 'mt-1 text-xs text-slate-400 dark:text-slate-500',
  description:
    'mt-2 text-xs text-slate-600 dark:text-slate-400 opacity-0 max-h-0 group-hover/item:opacity-100 group-hover/item:max-h-24 transition-all duration-300 overflow-hidden',
  scrollHintContainer:
    'absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  scrollHint:
    'flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500',
  scrollHintIcon: 'w-4 h-4',
};

const DEFAULT_SCROLL_SPEED = 4;
const DEFAULT_WHEEL_SENSITIVITY = 2;
const DEFAULT_MOBILE_BREAKPOINT = 768;
const DEFAULT_ACCENT_COLOR = 'oklch(68.5% 0.169 237.323)';
// Nombre de répétitions du dataset pour créer un ruban continu
const REPEAT_COUNT = 5;
const CENTER_INDEX = Math.floor(REPEAT_COUNT / 2);

export function ScrollableTimeline<T extends Record<string, unknown>>({
  data,
  keyMappings = {
    title: 'title',
    company: 'company',
    date: 'date',
    description: 'description',
  },
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  scrollSpeed = DEFAULT_SCROLL_SPEED,
  wheelSensitivity = DEFAULT_WHEEL_SENSITIVITY,
  accentColor = DEFAULT_ACCENT_COLOR,
  showScrollHint = true,
  showGradients = true,
  classNames = {},
}: ScrollableTimelineProps<T>) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const firstHalfRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const contentHeightRef = useRef<number>(0);
  const virtualTopRef = useRef<number>(0);

  const finalClassNames = { ...defaultClassNames, ...classNames };

  useEffect(() => {
    const checkScreenSize = () =>
      setIsMobile(window.innerWidth < mobileBreakpoint);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [mobileBreakpoint]);

  const updateContentHeight = useCallback(() => {
    if (!firstHalfRef.current) return 0;
    const height = firstHalfRef.current.scrollHeight;
    contentHeightRef.current = height;
    return height;
  }, []);

  // Recentrage doux pour rester dans la zone centrale (évite tout saut visible)
  const recenter = useCallback(
    (top: number) => {
      const setHeight = contentHeightRef.current || updateContentHeight();
      if (setHeight <= 0) return top;
      // On garde le scroll dans [setHeight, (REPEAT_COUNT-1)*setHeight]
      const min = setHeight;
      const max = setHeight * (REPEAT_COUNT - 1);
      if (top < min) return top + setHeight;
      if (top >= max) return top - setHeight;
      return top;
    },
    [updateContentHeight]
  );

  const centerScrollPosition = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const setHeight = contentHeightRef.current || updateContentHeight();
    if (setHeight <= 0) return;
    const target = setHeight * CENTER_INDEX;
    virtualTopRef.current = target;
    scroller.scrollTop = target;
  }, [updateContentHeight]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  const startAnimation = useCallback(() => {
    stopAnimation();
    if (isHovered || isInteracting) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const contentHeight = contentHeightRef.current || updateContentHeight();
    if (contentHeight <= 0) return;

    // Vitesse minimale plus basse pour que le défilement soit perceptible même à faible scrollSpeed
    const speedPxPerSec = Math.max(2, 16 * scrollSpeed);
    // Synchronise la position virtuelle au scroll réel au démarrage
    if (virtualTopRef.current === 0) {
      // Première initialisation: centre la position
      centerScrollPosition();
    } else {
      virtualTopRef.current = scroller.scrollTop;
    }

    const tick = (ts: number) => {
      if (isHovered || isInteracting) {
        rafRef.current = null;
        lastTimestampRef.current = null;
        return;
      }
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = ts;
      }
      const dt = (ts - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = ts;
      // Accumule en flottant, puis recentre si besoin sans coupure visuelle
      let newTop = virtualTopRef.current + speedPxPerSec * dt;
      newTop = recenter(newTop);
      virtualTopRef.current = newTop;
      scroller.scrollTop = Math.floor(newTop);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [centerScrollPosition, isHovered, isInteracting, recenter, scrollSpeed, stopAnimation, updateContentHeight]);

  useEffect(() => {
    const handle = () => {
      updateContentHeight();
      centerScrollPosition();
      startAnimation();
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [centerScrollPosition, startAnimation, updateContentHeight]);

  // Relance l'animation au chargement initial des données et à chaque changement de données/mappage
  useEffect(() => {
    // Si pas de données, on stoppe l'animation et on attend la prochaine mise à jour
    if (!data || data.length === 0) {
      stopAnimation();
      return;
    }

    // Attendre un frame pour s'assurer que le DOM a été rendu avec les nouvelles données
    const rafId = requestAnimationFrame(() => {
      updateContentHeight();
      centerScrollPosition();
      startAnimation();
    });

    return () => cancelAnimationFrame(rafId);
  }, [centerScrollPosition, data, keyMappings, startAnimation, stopAnimation, updateContentHeight]);

  useEffect(() => {
    startAnimation();
    return () => {
      stopAnimation();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isHovered, isInteracting, startAnimation, stopAnimation]);

  // Prévention du scroll de page: gérée localement dans les handlers wheel/touch.

  // Handle mouse events
  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    stopAnimation();
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      startAnimation();
    }, 120);
  };

  // Handle smooth wheel scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    e.preventDefault();
    stopAnimation();
    const setHeight = contentHeightRef.current || updateContentHeight();
    if (setHeight <= 0) return;
    let newTop = scroller.scrollTop + e.deltaY * wheelSensitivity;
    newTop = recenter(newTop);
    virtualTopRef.current = newTop;
    scroller.scrollTop = Math.floor(newTop);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      startAnimation();
    }, 150);
  };

  // Touch scrolling without page scroll
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsInteracting(true);
    stopAnimation();
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const startY = touchStartYRef.current;
    if (startY == null) return;
    e.preventDefault();
    const currentY = e.touches[0]?.clientY ?? startY;
    const delta = startY - currentY; // positive when moving up -> scroll down
    const setHeight = contentHeightRef.current || updateContentHeight();
    if (setHeight <= 0) return;
    let newTop = scroller.scrollTop + delta;
    newTop = recenter(newTop);
    virtualTopRef.current = newTop;
    scroller.scrollTop = Math.floor(newTop);
    touchStartYRef.current = currentY;
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
    setIsInteracting(false);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      startAnimation();
    }, 150);
  };

  // Map data with provided key mappings
  const mappedData = data.map((item) => ({
    title: String(item[keyMappings.title ?? 'title'] ?? ''),
    company: String(item[keyMappings.company ?? 'company'] ?? ''),
    date: String(item[keyMappings.date ?? 'date'] ?? ''),
    description: String(item[keyMappings.description ?? 'description'] ?? ''),
  }));

  // On rend plusieurs copies pour créer un ruban continu sans couture visible

  return (
    <div
      className={finalClassNames.root}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheelCapture={handleWheel}
      style={{ '--accent-color': accentColor } as CSSProperties}
    >
      {showGradients && (
        <>
          <div className={finalClassNames.gradientTop} />
          <div className={finalClassNames.gradientBottom} />
        </>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      <div
        ref={scrollerRef}
        className={finalClassNames.motionDiv + ' no-scrollbar'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={finalClassNames.itemContainer}>
          <div className={finalClassNames.line} />

          {Array.from({ length: REPEAT_COUNT }).map((_, copyIndex) => (
            <div key={`copy-${copyIndex}`} ref={copyIndex === 0 ? firstHalfRef : undefined}>
              {mappedData.map((exp, index) => (
                <div key={`copy-${copyIndex}-${exp.title}-${index}`} className={finalClassNames.item}>
                  <div className={finalClassNames.dotContainerWrapper}>
                    <div className={finalClassNames.dotWrapper}>
                      <div className={finalClassNames.dotOuter} />
                      <div className={finalClassNames.dotInner} />
                    </div>
                  </div>

                  <div className={finalClassNames.dotConnector} />

                  <div className={finalClassNames.contentWrapper}>
                    <h3 className={finalClassNames.title}>{exp.title}</h3>
                    <p className={finalClassNames.company}>{exp.company}</p>
                    <p className={finalClassNames.date}>{exp.date}</p>
                    <p className={finalClassNames.description}>{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!isMobile && showScrollHint && (
        <div className={finalClassNames.scrollHintContainer}>
          <div className={finalClassNames.scrollHint}>
            <svg
              className={finalClassNames.scrollHintIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13l-3 3m0 0l-3-3m3 3V8"
              />
            </svg>
            <span>Scroll</span>
          </div>
        </div>
      )}
    </div>
  );
}
