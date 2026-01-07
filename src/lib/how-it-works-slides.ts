export type HowItWorksSlide = {
  src: string
  thumbSrc: string
  alt: string
}

const HOW_IT_WORKS_START = 4
const HOW_IT_WORKS_END = 23

export const HOW_IT_WORKS_SLIDES: HowItWorksSlide[] = Array.from(
  { length: HOW_IT_WORKS_END - HOW_IT_WORKS_START + 1 },
  (_, index) => {
    const slideNumber = HOW_IT_WORKS_START + index
    const padded = String(slideNumber).padStart(3, '0')
    return {
      src: `/how-it-works/slide-${padded}.webp`,
      thumbSrc: `/how-it-works/thumb-${padded}.webp`,
      alt: `Feedback Collector screenshot ${slideNumber}`,
    }
  }
)
