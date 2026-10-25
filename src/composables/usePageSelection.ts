import { computed, ref } from 'vue'

export function usePageSelection() {
  const selected = ref<Set<number>>(new Set())

  function toggle(page: number) {
    const next = new Set(selected.value)
    if (next.has(page)) next.delete(page)
    else next.add(page)
    selected.value = next
  }

  function selectMany(pages: number[]) {
    selected.value = new Set(pages)
  }

  function clear() {
    selected.value = new Set()
  }

  const range = computed(() => [...selected.value].sort((a, b) => a - b))

  return { selected, toggle, selectMany, clear, range }
}
