'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, XIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogImage,
  MorphingDialogTrigger,
} from '@/components/motion-primitives/morphing-dialog';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue;
    return values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get());
    queries.forEach(q => matchMedia(q).addEventListener('change', handler));
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler));
  }, [queries]);

  return value;
};

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

interface Item {
  id: string;
  img: string;
  url: string;
  height: number;
  alt?: string;
}

function MasonryPhoto({
  item,
  loading,
}: {
  item: Item;
  loading: 'lazy' | 'eager';
}) {
  const alt = item.alt ?? '';

  return (
    <>
      <MorphingDialog
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
      >
        <MorphingDialogTrigger className="absolute inset-0 block overflow-hidden border-0 bg-transparent p-0">
          <MorphingDialogImage
            src={item.img}
            alt={alt}
            loading={loading}
            className="block h-full w-full object-cover"
          />
        </MorphingDialogTrigger>
        <MorphingDialogContainer>
          <MorphingDialogContent className="relative">
            <MorphingDialogImage
              src={item.img}
              alt={alt}
              className="h-auto w-full max-w-[90vw] object-cover lg:h-[90vh]"
            />
          </MorphingDialogContent>
          <MorphingDialogClose
            className="fixed top-6 right-6 h-fit w-fit rounded-full bg-white p-1"
            variants={{
              initial: { opacity: 0 },
              animate: {
                opacity: 1,
                transition: { delay: 0.3, duration: 0.1 },
              },
              exit: { opacity: 0, transition: { duration: 0 } },
            }}
          >
            <XIcon className="h-5 w-5 text-zinc-500" />
          </MorphingDialogClose>
        </MorphingDialogContainer>
      </MorphingDialog>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent to-50% opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
      />
      <Maximize2
        aria-hidden
        className="pointer-events-none absolute right-3 bottom-3 size-5 text-white opacity-0 drop-shadow-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
      />
    </>
  );
}

interface GridItem extends Item {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MasonryProps {
  items: Item[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false
}) => {
  const columns = useMedia(
    ['(min-width:1024px)', '(min-width:768px)'],
    [4, 3],
    2
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const hasMounted = useRef(false);
  const revealSetup = useRef(false);

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return [];
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const height = child.height / 2;
      const y = colHeights[col];

      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  useLayoutEffect(() => {
    if (!grid.length) return;

    grid.forEach(item => {
      const props = { left: item.x, top: item.y, width: item.w, height: item.h };
      if (hasMounted.current) {
        gsap.to(`[data-key="${item.id}"]`, {
          ...props,
          duration,
          ease,
          overwrite: 'auto'
        });
      } else {
        gsap.set(`[data-key="${item.id}"]`, props);
      }
    });

    hasMounted.current = true;
    ScrollTrigger.refresh();
  }, [grid, duration, ease]);

  const layoutReady = width > 0 && grid.length > 0;

  useLayoutEffect(() => {
    if (!layoutReady || revealSetup.current || !containerRef.current) return;
    revealSetup.current = true;

    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        gsap.set(reveals, { opacity: 1, y: 0, filter: 'blur(0px)' });
        return;
      }

      gsap.set(reveals, {
        opacity: 0,
        y: 48,
        ...(blurToFocus && { filter: 'blur(8px)' })
      });

      ScrollTrigger.batch(reveals, {
        start: 'top 90%',
        once: true,
        interval: 0.1,
        batchMax: 4,
        onEnter: batch => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            ...(blurToFocus && { filter: 'blur(0px)' }),
            duration: 0.75,
            ease: 'power3.out',
            stagger: 0.08,
            overwrite: 'auto'
          });
        }
      });
    }, containerRef);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      revealSetup.current = false;
      ctx.revert();
    };
  }, [layoutReady, blurToFocus]);

  const handleMouseEnter = (_id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      const inner = element.querySelector('[data-hover-scale]');
      if (inner) {
        gsap.to(inner, {
          scale: hoverScale,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay') as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
    }
  };

  const handleMouseLeave = (_id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      const inner = element.querySelector('[data-hover-scale]');
      if (inner) {
        gsap.to(inner, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay') as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
    }
  };

  const containerHeight = useMemo(() => {
    if (!grid.length) return 0;
    return Math.max(...grid.map(item => item.y + item.h));
  }, [grid]);

  const eagerCount = columns * 2;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: containerHeight || undefined }}>
      {grid.map((item, index) => (
        <div
          key={item.id}
          data-key={item.id}
          className="absolute box-content"
          style={{ willChange: 'width, height, opacity' }}
          onMouseEnter={e => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={e => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div data-reveal className="h-full w-full opacity-0 will-change-transform">
            <div
              data-hover-scale
              className="group relative h-full w-full overflow-hidden bg-charcoal/5 shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)]"
            >
              <MasonryPhoto
                item={item}
                loading={index < eagerCount ? 'eager' : 'lazy'}
              />
              {colorShiftOnHover && (
                <div className="color-overlay pointer-events-none absolute inset-0 bg-linear-to-tr from-pink-500/50 to-sky-500/50 opacity-0" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Masonry;
