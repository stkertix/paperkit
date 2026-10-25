<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { openPdfDocument, renderPageThumbnail } from '@/services/pdf/pdfDocument'
import type { PDFDocumentProxy } from 'pdfjs-dist'

const props = defineProps<{
  data: Uint8Array | null
  selected?: Set<number>
  selectable?: boolean
}>()

const emit = defineEmits<{
  toggle: [page: number]
  loaded: [pageCount: number]
}>()

const thumbs = ref<{ page: number; url: string }[]>([])
const loading = ref(false)
let pdf: PDFDocumentProxy | null = null

async function load() {
  cleanup()
  if (!props.data) return
  loading.value = true
  try {
    pdf = await openPdfDocument(props.data)
    emit('loaded', pdf.numPages)
    const items: { page: number; url: string }[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const url = await renderPageThumbnail(pdf, i)
      items.push({ page: i, url })
      thumbs.value = [...items]
    }
  } finally {
    loading.value = false
  }
}

function cleanup() {
  thumbs.value = []
  void pdf?.cleanup()
  pdf = null
}

watch(
  () => props.data,
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})

onUnmounted(cleanup)
</script>

<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
    <div class="grid">
      <button
        v-for="item in thumbs"
        :key="item.page"
        type="button"
        class="card"
        :class="{ selected: selected?.has(item.page) }"
        :disabled="!selectable"
        @click="selectable && emit('toggle', item.page)"
      >
        <img :src="item.url" :alt="`Page ${item.page}`" />
        <span class="num">{{ item.page }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}
.card {
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  background: var(--pk-surface);
  padding: 0;
  cursor: pointer;
}
.card:disabled {
  cursor: default;
}
.card.selected {
  border-color: var(--pk-accent);
}
.card img {
  display: block;
  width: 100%;
  height: auto;
}
.num {
  position: absolute;
  left: 6px;
  bottom: 6px;
  background: color-mix(in srgb, var(--pk-ink) 75%, transparent);
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
