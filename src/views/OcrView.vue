<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import PdfDownloadButton from '@/components/pdf/PdfDownloadButton.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { OCR_LANG_LABELS, ocrPdf, type OcrLang } from '@/services/pdf/pdfOcr'
import { terminateOcrWorker } from '@/workers/ocrWorker'
import { fileToUint8Array, downloadBytes } from '@/services/pdf/fileBytes'
import { PDF_ACCEPT } from '@/types/pdf'

const { files, error: fileError, addFiles, removeFile } = useFileDrop({
  ...PDF_ACCEPT,
  multiple: false,
})
const { isProcessing, progress, error, run, clearError, cancel } = useProcessing()
const lang = ref<OcrLang>('eng')
const text = ref('')

const langItems = (Object.keys(OCR_LANG_LABELS) as OcrLang[]).map((value) => ({
  title: OCR_LANG_LABELS[value],
  value,
}))

function clearAllErrors() {
  clearError()
  fileError.value = null
}

function onRemove(id: string) {
  removeFile(id)
  text.value = ''
}

async function onOcr() {
  const file = files.value[0]
  if (!file) return
  text.value = ''
  const out = await run(async (signal) => {
    const data = await fileToUint8Array(file.file)
    return ocrPdf(data, {
      lang: lang.value,
      signal,
      onProgress: (p) => {
        progress.value = p
      },
    })
  })
  text.value = out?.text ?? ''
}

function onDownload() {
  if (!text.value) return
  const bytes = new TextEncoder().encode(text.value)
  downloadBytes(bytes, 'ocr.txt', 'text/plain;charset=utf-8')
}

onUnmounted(() => {
  void terminateOcrWorker()
})
</script>

<template>
  <ToolPage
    title="OCR"
    description="Recognize text from scanned PDFs in your browser. Language data loads on demand."
  >
    <v-alert type="info" variant="tonal" class="mb-4">
      Searchable PDF export is not offered yet — results download as plain text. Language packs
      require a network fetch the first time each language is used.
    </v-alert>

    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="addFiles" />
    <FileList :files="files" @remove="onRemove" />

    <v-select
      v-model="lang"
      :items="langItems"
      label="Language"
      variant="outlined"
      class="mb-4"
      hide-details
    />

    <ProgressBar :active="isProcessing" :progress="progress" label="Running OCR…" />

    <div class="d-flex ga-2 flex-wrap mb-4">
      <v-btn
        color="primary"
        :disabled="!files.length || isProcessing"
        :loading="isProcessing"
        @click="onOcr"
      >
        Run OCR
      </v-btn>
      <v-btn v-if="isProcessing" variant="outlined" @click="cancel">Cancel</v-btn>
      <PdfDownloadButton label="Download .txt" :disabled="!text" @click="onDownload" />
    </div>

    <v-textarea
      v-if="text"
      :model-value="text"
      readonly
      variant="outlined"
      rows="16"
      hide-details
    />
  </ToolPage>
</template>
