'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HOW_IT_WORKS_SLIDES } from '@/lib/how-it-works-slides'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function HowItWorksSlideshow() {
  const slides = useMemo(() => HOW_IT_WORKS_SLIDES, [])
  const [index, setIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)

  const count = slides.length
  const current = slides[index]

  const go = useCallback(
    (nextIndex: number) => {
      const normalized = ((nextIndex % count) + count) % count
      setIndex(normalized)
    },
    [count]
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') prev()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const preloadAll = () => {
      slides.forEach((slide) => {
        const img = new window.Image()
        img.src = slide.src
      })
    }
    const requestIdle = (window as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    const cancelIdle = (window as { cancelIdleCallback?: (id: number) => void })
      .cancelIdleCallback
    if (requestIdle) {
      const handle = requestIdle(preloadAll)
      return () => cancelIdle?.(handle)
    }
    const timeout = window.setTimeout(preloadAll, 200)
    return () => window.clearTimeout(timeout)
  }, [slides])

  useEffect(() => {
    if (typeof window === 'undefined' || count < 2) return
    const preload = (src: string) => {
      const img = new window.Image()
      img.src = src
    }
    const nextIndex = (index + 1) % count
    const prevIndex = (index - 1 + count) % count
    preload(slides[nextIndex].src)
    preload(slides[prevIndex].src)
  }, [count, index, slides])

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartXRef.current
    touchStartXRef.current = null
    if (startX == null) return
    const endX = event.changedTouches[0]?.clientX
    if (endX == null) return
    const deltaX = endX - startX
    const threshold = 50
    if (Math.abs(deltaX) < threshold) return
    if (deltaX > 0) prev()
    else next()
  }

  if (!current) return null

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-xl backdrop-blur">
        <div
          className="group relative aspect-video w-full bg-white outline-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            priority={index === 0}
            unoptimized
            sizes="(max-width: 1024px) 100vw, 896px"
            className="pointer-events-none object-contain"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 sm:px-3">
            <div className="pointer-events-auto">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Previous screenshot"
                className="h-24 w-14 rounded-md bg-gray-100/85 text-gray-700 shadow-sm backdrop-blur transition-opacity hover:bg-gray-100 opacity-100 sm:h-28 sm:w-16 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronLeft className="h-7 w-7" />
              </Button>
            </div>
            <div className="pointer-events-auto">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  next()
                }}
                aria-label="Next screenshot"
                className="h-24 w-14 rounded-md bg-gray-100/85 text-gray-700 shadow-sm backdrop-blur transition-opacity hover:bg-gray-100 opacity-100 sm:h-28 sm:w-16 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronRight className="h-7 w-7" />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
            {index + 1} / {count}
          </div>
        </div>
      </div>

    </>
  )
}
