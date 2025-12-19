'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HOW_IT_WORKS_SLIDES } from '@/lib/how-it-works-slides'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function HowItWorksSlideshow() {
  const slides = useMemo(() => HOW_IT_WORKS_SLIDES, [])
  const [index, setIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const lastActiveElementRef = useRef<HTMLElement | null>(null)

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
      if (event.key === 'Escape') {
        setIsOpen(false)
        return
      }
      if (event.key === 'ArrowLeft') prev()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null
      return
    }
    lastActiveElementRef.current?.focus?.()
    lastActiveElementRef.current = null
  }, [isOpen])

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
          className="group relative aspect-video w-full cursor-zoom-in bg-white outline-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="Open screenshot gallery"
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setIsOpen(true)
            }
          }}
        >
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            priority={index === 0}
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

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="How it works screenshots"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="mx-auto flex h-full max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end pb-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className="relative flex-1 overflow-hidden rounded-2xl bg-black/40"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <Image
                key={`modal:${current.src}`}
                src={current.src}
                alt={current.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-contain"
              />

              <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={prev}
                  aria-label="Previous screenshot"
                  className="h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  aria-label="Next screenshot"
                  className="h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-sm text-white">
                {index + 1} / {count}
              </div>
            </div>

            <div className="pt-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => go(slideIndex)}
                    className={`relative h-14 w-24 flex-none overflow-hidden rounded-lg border transition ${
                      slideIndex === index
                        ? 'border-white/80 ring-2 ring-white/40'
                        : 'border-white/10 opacity-80 hover:opacity-100'
                    }`}
                    aria-label={`Open screenshot ${slideIndex + 1}`}
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
