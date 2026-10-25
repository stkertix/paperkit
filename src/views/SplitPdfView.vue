<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
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
import { extractPages, parsePageRanges, splitEveryPage } from '@/services/pdf/pdfSplit'
import { fileToUint8Array, downloadBytes, downloadBlob } from '@/services/pdf/fileBytes'
import { PDF_ACCEPT } from '@/types/pdf'
import { createPdfError } from '@/services/errors/pdfErrors'

const {
  files,
  error: fileError,
  addFiles,
  clear: clearFiles,
} = useFileDrop({ ...PDF_ACCEPT, multiple: false })
const { isProcessing, progress, error, run, clearError } = useProcessing()
const { selected, toggle, clear: clearSelection, range } = usePageSelection()
const mode = ref<'extract' | 'every-page'>('extract')
const rangeText = ref('')
const pdfBytes = ref<Uint8Array | null>(null)
const pageCount = ref(0)

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

async function onSplit() {
  if (!pdfBytes.value) return
  await run(async (signal) => {
    if (mode.value === 'every-page') {
      const parts = await splitEveryPage(pdfBytes.value!, {
        signal,
        onProgress: (c, t) => {
          progress.value = c / t
        },
      })
      if (parts.length === 1) {
        downloadBytes(parts[0].data, parts[0].name)
        return
      }
      const zip = new JSZip()
      for (const part of parts) zip.file(part.name, part.data)
      downloadBlob(await zip.generateAsync({ type: 'blob' }), 'split-pages.zip')
      return
    }
    let pages = range.value
    if (rangeText.value.trim()) {
      pages = parsePageRanges(rangeText.value, pageCount.value)
    }
    if (!pages.length) throw createPdfError('EMPTY_INPUT')
    const out = await extractPages(pdfBytes.value!, pages, { signal })
    downloadBytes(out, 'extract.pdf')
  })
}
</script>

<template>
  <ToolPage title="Split PDF" description="Extract selected pages or split every page into separate files.">
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="onFiles" />
    <FileList :files="files" @remove="onRemove" />

    <v-radio-group v-model="mode" inline class="mb-2">
      <v-radio label="Extract selected pages" value="extract" />
      <v-radio label="Split every page" value="every-page" />
    </v-radio-group>

    <template v-if="pdfBytes && mode === 'extract'">
      <v-text-field
        v-model="rangeText"
        label="Page ranges (optional, e.g. 1,3-5)"
        variant="outlined"
        density="comfortable"
        class="mb-4"
        hide-details="auto"
      />
      <PdfPageGrid
        :data="pdfBytes"
        :selected="selected"
        selectable
        class="mb-4"
        @toggle="toggle"
        @loaded="(n) => (pageCount = n)"
      />
    </template>

    <ProgressBar :active="isProcessing" :progress="progress" />
    <PdfDownloadButton
      :label="mode === 'every-page' ? 'Split & download' : 'Extract & download'"
      :disabled="!pdfBytes || isProcessing"
      :loading="isProcessing"
      @click="onSplit"
    />
  </ToolPage>
</template>
