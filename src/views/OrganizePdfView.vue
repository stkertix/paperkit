<script setup lang="ts">
import { ref } from 'vue'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import PdfPageGrid from '@/components/pdf/PdfPageGrid.vue'
import PdfDownloadButton from '@/components/pdf/PdfDownloadButton.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { usePageSelection } from '@/composables/usePageSelection'
import { pageOps } from '@/services/pdf/pageOps'
import { fileToUint8Array, downloadBytes } from '@/services/pdf/fileBytes'
import { PDF_ACCEPT } from '@/types/pdf'
import { createPdfError } from '@/services/errors/pdfErrors'

const {
  files,
  error: fileError,
  addFiles,
  clear: clearFiles,
} = useFileDrop({ ...PDF_ACCEPT, multiple: false })
const { isProcessing, error, run, clearError } = useProcessing()
const { selected, toggle, clear: clearSelection, range } = usePageSelection()
const pdfBytes = ref<Uint8Array | null>(null)
const pageCount = ref(0)
const order = ref<number[]>([])

function clearAllErrors() {
  clearError()
  fileError.value = null
}

async function onFiles(list: File[]) {
  clearFiles()
  addFiles(list)
  clearSelection()
  if (files.value[0]) {
    pdfBytes.value = await fileToUint8Array(files.value[0].file)
  } else {
    pdfBytes.value = null
  }
}

function onRemove() {
  clearFiles()
  pdfBytes.value = null
}

function onLoaded(n: number) {
  pageCount.value = n
  order.value = Array.from({ length: n }, (_, i) => i + 1)
}

async function applyOp(kind: 'rotate' | 'delete' | 'duplicate' | 'extract' | 'reorder') {
  if (!pdfBytes.value) return
  const out = await run(async () => {
    const pages = range.value
    if (kind === 'reorder') {
      return pageOps.reorder(pdfBytes.value!, order.value)
    }
    if (!pages.length) throw createPdfError('EMPTY_INPUT')
    if (kind === 'rotate') return pageOps.rotate(pdfBytes.value!, pages, 90)
    if (kind === 'delete') return pageOps.delete(pdfBytes.value!, pages)
    if (kind === 'duplicate') return pageOps.duplicate(pdfBytes.value!, pages)
    return pageOps.extract(pdfBytes.value!, pages)
  })
  if (out) {
    pdfBytes.value = out
    clearSelection()
    if (kind === 'extract') downloadBytes(out, 'extract.pdf')
  }
}

function moveSelected(dir: -1 | 1) {
  if (!order.value.length || !range.value.length) return
  const next = [...order.value]
  for (const page of range.value) {
    const idx = next.indexOf(page)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= next.length) continue
    ;[next[idx], next[target]] = [next[target], next[idx]]
  }
  order.value = next
}

async function downloadCurrent() {
  if (!pdfBytes.value) return
  const identity = Array.from({ length: pageCount.value }, (_, i) => i + 1).join(',')
  const bytes =
    order.value.length && order.value.join(',') !== identity
      ? await pageOps.reorder(pdfBytes.value, order.value)
      : pdfBytes.value
  downloadBytes(bytes, 'organized.pdf')
}
</script>

<template>
  <ToolPage
    title="Organize PDF"
    description="Rotate, delete, reorder, duplicate, or extract pages. All processing is local."
  >
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="onFiles" />
    <FileList :files="files" @remove="onRemove" />

    <div v-if="pdfBytes" class="mb-4 d-flex ga-2 flex-wrap">
      <v-btn variant="outlined" @click="applyOp('rotate')">Rotate 90°</v-btn>
      <v-btn variant="outlined" @click="applyOp('delete')">Delete</v-btn>
      <v-btn variant="outlined" @click="applyOp('duplicate')">Duplicate</v-btn>
      <v-btn variant="outlined" @click="applyOp('extract')">Extract</v-btn>
      <v-btn variant="outlined" @click="moveSelected(-1)">Move up</v-btn>
      <v-btn variant="outlined" @click="moveSelected(1)">Move down</v-btn>
      <v-btn variant="outlined" @click="applyOp('reorder')">Apply order</v-btn>
    </div>

    <PdfPageGrid
      v-if="pdfBytes"
      :data="pdfBytes"
      :selected="selected"
      selectable
      class="mb-4"
      @toggle="toggle"
      @loaded="onLoaded"
    />

    <ProgressBar :active="isProcessing" />
    <PdfDownloadButton
      label="Download PDF"
      :disabled="!pdfBytes || isProcessing"
      :loading="isProcessing"
      @click="downloadCurrent"
    />
  </ToolPage>
</template>
