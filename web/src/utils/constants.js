export const options = [
  { value: 'equal', label: 'Chia đều' },
  { value: 'by-person', label: 'Theo người' },
  { value: 'by-item', label: 'Theo món' },
]

// Vite exposes only variables prefixed with VITE_. Set VITE_API_ROOT in the
// hosting provider's build environment; local development keeps this fallback.
const apiRoot = import.meta.env.VITE_API_ROOT || 'http://localhost:8017'
export const FIELD_REQUIRED_MESSAGE = 'This field is required.'

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

export const API_ROOT = apiRoot
