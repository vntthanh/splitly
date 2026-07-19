export const options = [
  { value: 'equal', label: 'Chia đều' },
  { value: 'by-person', label: 'Theo người' },
  { value: 'by-item', label: 'Theo món' },
]

export const categoryOptions = [
  { value: 'food', label: 'Ăn uống' },
  { value: 'entertainment', label: 'Giải trí' },
  { value: 'transportation', label: 'Di chuyển' },
  { value: 'shopping', label: 'Mua sắm' },
  { value: 'utilities', label: 'Tiện ích' },
  { value: 'other', label: 'Khác' },
]

// Vite exposes only variables prefixed with VITE_. Configure VITE_API_ROOT in
// deployments; local development keeps the local API fallback.
const apiRoot = import.meta.env.VITE_API_ROOT ||
  (import.meta.env.DEV ? 'http://localhost:8017' : 'https://splitly.be.khangdev.me')

export const FIELD_REQUIRED_MESSAGE = 'This field is required.'
export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12
export const API_ROOT = apiRoot