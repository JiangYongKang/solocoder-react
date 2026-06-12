export const STORAGE_KEY = 'json-to-ts-history'
export const MAX_HISTORY_ITEMS = 30
export const DEBOUNCE_DELAY = 300
export const DEFAULT_ROOT_NAME = 'RootType'
export const MAX_RECURSION_DEPTH = 50

export const SAMPLE_JSON = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "isActive": true,
  "score": 98.5,
  "avatar": null,
  "tags": ["developer", "typescript"],
  "address": {
    "city": "Beijing",
    "country": "China",
    "zipCode": "100000"
  },
  // @optional
  "metadata": {
    "lastLogin": "2024-01-01T00:00:00Z"
  }
}`
