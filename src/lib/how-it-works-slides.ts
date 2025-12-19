export type HowItWorksSlide = {
  src: string
  alt: string
}

export const HOW_IT_WORKS_SLIDES: HowItWorksSlide[] = Array.from(
  { length: 23 },
  (_, index) => {
    const slideNumber = index + 1
    const padded = String(slideNumber).padStart(3, '0')
    return {
      src: `/how-it-works/slide-${padded}.webp`,
      alt: `BSP Feedback screenshot ${slideNumber}`,
    }
  }
)
