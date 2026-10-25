const THEME_KEY = 'paperkit.theme'

export type ThemePreference = 'light' | 'dark' | 'system'

export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* private mode */
  }
  return 'system'
}

export function setThemePreference(value: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, value)
  } catch {
    /* ignore */
  }
}

/** Never store PDF bytes or blobs in localStorage. */
export function assertNotDocumentStorage(_key: string): void {
  // Guardrail for future contributors — prefs only.
}
