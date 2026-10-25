<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { openPdfDocument, renderPageThumbnail } from '@/services/pdf/pdfDocument'

const props = defineProps<{
  pdfData: Uint8Array
  pageNumber: number
  signatureUrl: string | null
  widthNorm: number
  xNorm: number
  yNorm: number
  aspect: number
}>()

const emit = defineEmits<{
  'update:xNorm': [value: number]
  'update:yNorm': [value: number]
  'update:widthNorm': [value: number]
  pageSize: [size: { widthPt: number; heightPt: number }]
  pageCount: [count: number]
}>()

const stageRef = ref<HTMLElement | null>(null)
const pageUrl = ref<string | null>(null)
const loading = ref(false)
const pageWidthPt = ref(612)
const pageHeightPt = ref(792)
const dragging = ref(false)
const resizing = ref(false)

const aspect = computed(() => (props.aspect > 0 ? props.aspect : 0.35))

const stageStyle = computed(() => ({
  aspectRatio: `${pageWidthPt.value} / ${pageHeightPt.value}`,
}))

const overlayStyle = computed(() => {
  const w = props.widthNorm * 100
  const h = props.widthNorm * aspect.value * 100
  const left = props.xNorm * 100
  const top = (1 - props.yNorm - props.widthNorm * aspect.value) * 100
  return {
    width: `${w}%`,
    height: `${h}%`,
    left: `${left}%`,
    top: `${top}%`,
  }
})

async function renderPage() {
  loading.value = true
  try {
    const pdf = await openPdfDocument(props.pdfData)
    emit('pageCount', pdf.numPages)
    const page = await pdf.getPage(props.pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    pageWidthPt.value = viewport.width
    pageHeightPt.value = viewport.height
    emit('pageSize', { widthPt: viewport.width, heightPt: viewport.height })
    pageUrl.value = await renderPageThumbnail(pdf, props.pageNumber, 720)
    await pdf.cleanup()
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.pdfData, props.pageNumber] as const,
  () => {
    void renderPage()
  },
)

onMounted(() => {
  void renderPage()
})

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function clientToCss(clientX: number, clientY: number) {
  const el = stageRef.value
  if (!el) return { xCss: 0, yCss: 0 }
  const rect = el.getBoundingClientRect()
  return {
    xCss: (clientX - rect.left) / rect.width,
    yCss: (clientY - rect.top) / rect.height,
  }
}

let dragOffsetX = 0
let dragOffsetY = 0

function onSigPointerDown(e: PointerEvent) {
  if (!props.signatureUrl) return
  const target = e.target as HTMLElement
  if (target.classList.contains('resize-handle')) {
    resizing.value = true
  } else {
    dragging.value = true
    const { xCss, yCss } = clientToCss(e.clientX, e.clientY)
    const left = props.xNorm
    const top = 1 - props.yNorm - props.widthNorm * aspect.value
    dragOffsetX = xCss - left
    dragOffsetY = yCss - top
  }
  stageRef.value?.setPointerCapture(e.pointerId)
  e.preventDefault()
  e.stopPropagation()
}

function onStagePointerMove(e: PointerEvent) {
  if (!dragging.value && !resizing.value) return
  const { xCss, yCss } = clientToCss(e.clientX, e.clientY)

  if (resizing.value) {
    const left = props.xNorm
    const newWidth = clamp(xCss - left, 0.08, 0.9)
    const maxW = 1 - left
    const bottom = props.yNorm
    const topEdge = bottom + props.widthNorm * aspect.value
    const maxH = topEdge
    const widthByHeight = maxH / aspect.value
    emit('update:widthNorm', clamp(newWidth, 0.08, Math.min(maxW, widthByHeight, 0.9)))
    return
  }

  const w = props.widthNorm
  const h = w * aspect.value
  const left = clamp(xCss - dragOffsetX, 0, 1 - w)
  const top = clamp(yCss - dragOffsetY, 0, 1 - h)
  emit('update:xNorm', left)
  emit('update:yNorm', 1 - top - h)
}

function onStagePointerUp(e: PointerEvent) {
  dragging.value = false
  resizing.value = false
  try {
    stageRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    /* already released */
  }
}

onUnmounted(() => {
  pageUrl.value = null
})
</script>

<template>
  <div class="placement">
    <p class="hint text-caption mb-2">
      Drag the signature to place it. Use the corner handle to resize.
    </p>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />
    <div
      ref="stageRef"
      class="stage"
      :class="{ active: dragging || resizing }"
      :style="stageStyle"
      @pointermove="onStagePointerMove"
      @pointerup="onStagePointerUp"
      @pointercancel="onStagePointerUp"
    >
      <img v-if="pageUrl" class="page" :src="pageUrl" alt="PDF page preview" draggable="false" />
      <div
        v-if="signatureUrl"
        class="signature"
        :style="overlayStyle"
        @pointerdown="onSigPointerDown"
      >
        <img :src="signatureUrl" alt="Signature" draggable="false" />
        <span class="resize-handle" title="Resize" />
      </div>
      <div v-else class="empty-sig text-caption">Add a signature image to place it here</div>
    </div>
  </div>
</template>

<style scoped>
.hint {
  color: var(--pk-muted);
}
.stage {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
  border: 1px solid color-mix(in srgb, var(--pk-muted) 30%, transparent);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  touch-action: none;
  user-select: none;
}
.stage.active {
  cursor: grabbing;
}
.page {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}
.signature {
  position: absolute;
  box-sizing: border-box;
  border: 2px dashed var(--pk-accent);
  border-radius: 4px;
  cursor: grab;
  background: color-mix(in srgb, var(--pk-accent) 8%, transparent);
}
.signature:active {
  cursor: grabbing;
}
.signature img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  display: block;
}
.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: var(--pk-accent);
  cursor: nwse-resize;
  touch-action: none;
}
.empty-sig {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--pk-muted);
  pointer-events: none;
}
</style>
