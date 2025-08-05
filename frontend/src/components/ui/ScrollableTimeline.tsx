import { animate, motion, type PanInfo, useMotionValue } from 'framer-motion';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

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

export type ScrollableTimelineProps<T extends Record<string, any>> = {
  data: T[];
  keyMappings?: Partial<Record<keyof TimelineData, keyof T>>;
  mobileBreakpoint?: number;
  scrollSpeed?: number;
  wheelSensitivity?: number;
  accentColor?: string;
  showScrollHint?: boolean;
  showGradients?: boolean;
  blockPageScroll?: boolean;
  classNames?: ClassNames;
};

const defaultClassNames: Required<ClassNames> = {
  root: 'relative h-full w-full overflow-hidden group',
  gradientTop:
    'absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white dark:from-slate-950 to-transparent z-10 pointer-events-none',
  gradientBottom:
    'absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-slate-950 to-transparent z-10 pointer-events-none',
  motionDiv: 'absolute left-0 top-0 w-full',
  itemContainer: 'relative flex flex-col',
  line: 'absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-slate-200 via-[var(--accent-color)] to-slate-200 dark:from-slate-700 dark:via-[var(--accent-color)] dark:to-slate-700 opacity-50',
  item: 'relative w-full py-3 pl-12 pr-4 group/item',
  dotContainerWrapper: 'absolute left-[18px] top-1/2 -translate-y-1/2',
  dotWrapper: 'relative',
  dotOuter:
    'absolute inset-0 h-3 w-3 rounded-full bg-[var(--accent-color)] opacity-20 group-hover/item:scale-[2.5] transition-transform duration-300',
  dotInner:
    'relative h-3 w-3 rounded-full bg-[var(--accent-color)] border-2 border-white dark:border-slate-900 group-hover/item:scale-110 transition-transform duration-300',
  dotConnector:
    'absolute left-8 top-1/2 w-4 h-0.5 bg-gradient-to-r from-[var(--accent-color)] to-transparent opacity-0 group-hover/item:opacity-50 transition-opacity duration-300',
  contentWrapper:
    'text-left rounded-lg p-3 -ml-3 transition-all duration-300 group-hover/item:bg-slate-50 dark:group-hover/item:bg-slate-800/50 group-hover/item:shadow-lg group-hover/item:shadow-[var(--accent-color)]/10',
  title:
    'text-base font-bold text-slate-800 dark:text-slate-100 group-hover/item:text-[var(--accent-color)] transition-colors duration-300',
  company: 'text-sm font-semibold text-slate-600 dark:text-slate-400',
  date: 'mt-1 text-xs text-slate-400 dark:text-slate-500',
  description:
    'mt-2 text-xs text-slate-500 dark:text-slate-400 opacity-0 max-h-0 group-hover/item:opacity-100 group-hover/item:max-h-20 transition-all duration-300 overflow-hidden',
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

export function ScrollableTimeline<T extends Record<string, any>>({
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
  blockPageScroll = true,
  classNames = {},
}: ScrollableTimelineProps<T>) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const motionDivRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const animationRef = useRef<any>(null);
  const contentHeightRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const finalClassNames = { ...defaultClassNames, ...classNames };

  // Determine if we're on mobile
  useEffect(() => {
    const checkScreenSize = () =>
      setIsMobile(window.innerWidth < mobileBreakpoint);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [mobileBreakpoint]);

  // Calculate content height and update ref
  const updateContentHeight = () => {
    if (!motionDivRef.current) return 0;
    const height = motionDivRef.current.scrollHeight / 2;
    contentHeightRef.current = height;
    return height;
  };

  // Stop any ongoing animation
  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  // Reset animation with consistent speed
  const resetAnimation = (newY: number) => {
    stopAnimation();
    if (isMobile || isHovered || isDragging || !motionDivRef.current) return;

    const contentHeight = contentHeightRef.current || updateContentHeight();
    if (contentHeight <= 0) return;

    // Calculate remaining distance and duration for consistent speed
    const remainingDistance = contentHeight - Math.abs(newY % contentHeight);
    const duration =
      (remainingDistance / contentHeight) * data.length * scrollSpeed;

    animationRef.current = animate(y, newY - contentHeight, {
      duration,
      ease: 'linear',
      onComplete: () => {
        y.set(newY);
        resetAnimation(newY);
      },
    });
  };

  // Start the infinite scroll animation
  const startAnimation = () => {
    stopAnimation();
    if (isMobile || isHovered || isDragging || !motionDivRef.current) return;

    const contentHeight = contentHeightRef.current || updateContentHeight();
    if (contentHeight <= 0) return;

    const currentY = y.get();
    const progress = Math.abs(currentY % contentHeight) / contentHeight;
    const duration = data.length * scrollSpeed * (1 - progress);

    animationRef.current = animate(
      y,
      currentY - contentHeight * (1 - progress),
      {
        duration,
        ease: 'linear',
        onComplete: () => {
          y.set(currentY - contentHeight * (1 - progress));
          resetAnimation(y.get());
        },
      },
    );
  };

  // Handle automatic scrolling
  useEffect(() => {
    startAnimation();
    return () => {
      stopAnimation();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isHovered, isDragging, isMobile, data.length, scrollSpeed, y]);

  // Handle blocking page scroll
  useEffect(() => {
    if (isHovered && !isMobile && blockPageScroll) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';

      const preventDefault = (e: Event) => {
        e.preventDefault();
      };

      const events: Array<[string, EventListener, { passive: boolean }?]> = [
        ['wheel', preventDefault, { passive: false }],
        ['touchmove', preventDefault, { passive: false }],
        ['scroll', () => window.scrollTo(0, scrollY)],
      ];

      events.forEach(([event, listener, options]) =>
        window.addEventListener(
          event,
          listener,
          options as AddEventListenerOptions,
        ),
      );

      return () => {
        document.body.style.overflow = '';
        events.forEach(([event, listener]) =>
          window.removeEventListener(event, listener),
        );
        window.scrollTo(0, scrollY);
      };
    }
  }, [isHovered, isMobile, blockPageScroll]);

  // Handle mouse events
  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    stopAnimation();
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    // Debounce animation restart to prevent conflicts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      startAnimation();
    }, 100);
  };

  // Handle smooth wheel scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isMobile || !isHovered) return;

    stopAnimation();

    const currentY = y.get();
    let newY = currentY - e.deltaY * wheelSensitivity;
    const contentHeight = contentHeightRef.current || updateContentHeight();

    if (contentHeight <= 0) return;

    // Smooth wrapping without jumps
    newY = newY % (contentHeight * 2);
    if (newY > 0) newY -= contentHeight * 2;
    if (newY < -contentHeight * 2) newY += contentHeight * 2;

    y.set(newY);

    // Restart animation after scrolling stops
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      if (!isDragging) startAnimation();
    }, 150);
  };

  // Handle drag scrolling
  const handleDragStart = () => {
    setIsDragging(true);
    stopAnimation();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Normalize position after drag
    const currentY = y.get();
    const contentHeight = contentHeightRef.current || updateContentHeight();
    if (contentHeight > 0) {
      const normalizedY =
        ((currentY % (contentHeight * 2)) + contentHeight * 2) %
        (contentHeight * 2);
      y.set(
        normalizedY > contentHeight
          ? normalizedY - contentHeight * 2
          : normalizedY,
      );
    }
    // Restart animation after drag stops
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      startAnimation();
    }, 150);
  };

  const handleDrag = (_event: any, info: PanInfo) => {
    if (isMobile) return;

    const currentY = y.get();
    const newY = currentY + info.delta.y;
    const contentHeight = contentHeightRef.current || updateContentHeight();

    if (contentHeight <= 0) return;

    // Smooth wrapping during drag
    y.set(newY % (contentHeight * 2));
  };

  // Map data with provided key mappings
  const mappedData = data.map((item) => ({
    title: item[keyMappings.title ?? 'title'],
    company: item[keyMappings.company ?? 'company'],
    date: item[keyMappings.date ?? 'date'],
    description: item[keyMappings.description ?? 'description'],
  }));

  // Duplicate data for seamless looping
  const duplicatedData = [...mappedData, ...mappedData];

  return (
    <div
      className={finalClassNames.root}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{ '--accent-color': accentColor } as CSSProperties}
    >
      {showGradients && (
        <>
          <div className={finalClassNames.gradientTop} />
          <div className={finalClassNames.gradientBottom} />
        </>
      )}

      <motion.div
        ref={motionDivRef}
        className={finalClassNames.motionDiv}
        style={{ y }}
        drag={isHovered && !isMobile ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
      >
        <div className={finalClassNames.itemContainer}>
          <div className={finalClassNames.line} />

          {duplicatedData.map((exp, index) => (
            <div key={`${exp.title}-${index}`} className={finalClassNames.item}>
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
      </motion.div>

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
