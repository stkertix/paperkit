import { computed, ref, watch } from 'vue'
import { useTheme as useVuetifyTheme } from 'vuetify'
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '@/services/storage/localStorage'

const preference = ref<ThemePreference>(getThemePreference())

function resolveDark(pref: ThemePreference): boolean {
  if (pref === 'dark') return true
  if (pref === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const theme = useVuetifyTheme()

  const isDark = computed(() => resolveDark(preference.value))

  function apply() {
    theme.global.name.value = isDark.value ? 'paperkitDark' : 'paperkitLight'
  }

  function setPreference(value: ThemePreference) {
    preference.value = value
    setThemePreference(value)
    apply()
  }

  function toggle() {
    setPreference(isDark.value ? 'light' : 'dark')
  }

  watch(preference, apply, { immediate: true })

  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (preference.value === 'system') apply()
    })
  }

  return { preference, isDark, setPreference, toggle, apply }
}
