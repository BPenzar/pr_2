export type HowItWorksSlide = {
  src: string
  thumbSrc: string
  alt: string
}

export const HOW_IT_WORKS_SLIDES: HowItWorksSlide[] = Array.from(
  { length: 23 },
  (_, index) => {
    const slideNumber = index + 1
    const padded = String(slideNumber).padStart(3, '0')
    return {
      src: `/how-it-works/slide-${padded}.webp`,
      thumbSrc: `/how-it-works/thumb-${padded}.webp`,
      alt: `BSP Feedback screenshot ${slideNumber}`,
    }
  }
)
