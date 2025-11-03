export type OptionColorKey = 'gray' | 'blue' | 'red' | 'yellow' | 'green'

export const OPTION_COLOR_CHOICES: Array<{ value: 'none' | OptionColorKey; label: string }> = [
  { value: 'none', label: 'No color' },
  { value: 'gray', label: 'Gray' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
]

export const OPTION_COLOR_CONFIG: Record<
  OptionColorKey,
  {
    containerBase: string
    containerSelected: string
    badge: string
    chip: string
    hex: string
  }
> = {
  gray: {
    containerBase: 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300',
    containerSelected: 'border-gray-500 bg-gray-200 text-gray-900',
    badge: 'border border-gray-300 bg-gray-100 text-gray-700',
    chip: 'bg-gray-200 text-gray-800',
    hex: '#9ca3af',
  },
  blue: {
    containerBase: 'border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200',
    containerSelected: 'border-blue-500 bg-blue-500 text-white',
    badge: 'border border-blue-200 bg-blue-100 text-blue-700',
    chip: 'bg-blue-500 text-white',
    hex: '#3b82f6',
  },
  red: {
    containerBase: 'border-red-100 bg-red-50 text-red-700 hover:border-red-200',
    containerSelected: 'border-red-500 bg-red-500 text-white',
    badge: 'border border-red-200 bg-red-100 text-red-700',
    chip: 'bg-red-500 text-white',
    hex: '#ef4444',
  },
  yellow: {
    containerBase: 'border-yellow-100 bg-yellow-50 text-yellow-700 hover:border-yellow-200',
    containerSelected: 'border-yellow-500 bg-yellow-500 text-white',
    badge: 'border border-yellow-200 bg-yellow-100 text-yellow-700',
    chip: 'bg-yellow-500 text-white',
    hex: '#facc15',
  },
  green: {
    containerBase: 'border-green-100 bg-green-50 text-green-700 hover:border-green-200',
    containerSelected: 'border-green-500 bg-green-500 text-white',
    badge: 'border border-green-200 bg-green-100 text-green-700',
    chip: 'bg-green-500 text-white',
    hex: '#22c55e',
  },
}

export const DEFAULT_OPTION_CONTAINER_BASE =
  'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
export const DEFAULT_OPTION_CONTAINER_SELECTED =
  'border-primary/80 bg-primary/10 text-primary'
export const DEFAULT_OPTION_BADGE = 'border border-slate-200 bg-slate-100 text-slate-700'
export const DEFAULT_OPTION_CHIP = 'bg-slate-500 text-white'
export const DEFAULT_OPTION_HEX = '#6366f1'

export const OPTION_COLOR_HEX: Record<OptionColorKey, string> = Object.fromEntries(
  Object.entries(OPTION_COLOR_CONFIG).map(([color, config]) => [color, config.hex])
) as Record<OptionColorKey, string>

export function getOptionColorConfig(color?: OptionColorKey) {
  if (!color) {
    return {
      containerBase: DEFAULT_OPTION_CONTAINER_BASE,
      containerSelected: DEFAULT_OPTION_CONTAINER_SELECTED,
      badge: DEFAULT_OPTION_BADGE,
      chip: DEFAULT_OPTION_CHIP,
      hex: DEFAULT_OPTION_HEX,
    }
  }
  return OPTION_COLOR_CONFIG[color]
}
