<script setup lang="ts">
import { ref } from 'vue'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import PdfDownloadButton from '@/components/pdf/PdfDownloadButton.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { compressPdf, type CompressResult } from '@/services/pdf/pdfCompress'
import { fileToUint8Array, downloadBytes, formatBytes } from '@/services/pdf/fileBytes'
import type { CompressLevel } from '@/types/pdf'
import { PDF_ACCEPT } from '@/types/pdf'

const { files, error: fileError, addFiles, removeFile } = useFileDrop({
  ...PDF_ACCEPT,
  multiple: false,
})
const { isProcessing, error, run, clearError } = useProcessing()
const level = ref<CompressLevel>('medium')
const result = ref<CompressResult | null>(null)
const status = ref('')

function clearAllErrors() {
  clearError()
  fileError.value = null
}

function onRemove(id: string) {
  removeFile(id)
  result.value = null
}

async function onCompress() {
  const file = files.value[0]
  if (!file) return
  result.value = null
  const out = await run(async (signal) => {
    const data = await fileToUint8Array(file.file)
    return compressPdf(data, level.value, {
      signal,
      onProgress: (m) => {
        status.value = m
      },
    })
  })
  result.value = out ?? null
}

function onDownload() {
  if (!result.value) return
  downloadBytes(result.value.bytes, 'compressed.pdf')
}
</script>

<template>
  <ToolPage
    title="Compress PDF"
    description="Best-effort compression in your browser. No specific reduction ratio is promised."
  >
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="addFiles" />
    <FileList :files="files" @remove="onRemove" />

    <v-radio-group v-model="level" inline label="Compression">
      <v-radio label="Low" value="low" />
      <v-radio label="Medium" value="medium" />
      <v-radio label="High" value="high" />
    </v-radio-group>

    <ProgressBar :active="isProcessing" :label="status || 'Compressing…'" />

    <v-alert v-if="result?.warning" type="warning" variant="tonal" class="mb-4">
      {{ result.warning }}
    </v-alert>

    <v-card v-if="result" variant="outlined" class="mb-4">
      <v-card-text>
        <div>Original: {{ formatBytes(result.originalSize) }}</div>
        <div>Result: {{ formatBytes(result.resultSize) }}</div>
        <div>
          Reduction:
          {{ result.usedOriginal ? '0%' : `${Math.round(result.reductionRatio * 100)}%` }}
        </div>
      </v-card-text>
    </v-card>

    <div class="d-flex ga-2 flex-wrap">
      <v-btn
        color="primary"
        :disabled="!files.length || isProcessing"
        :loading="isProcessing"
        @click="onCompress"
      >
        Compress
      </v-btn>
      <PdfDownloadButton label="Download" :disabled="!result" @click="onDownload" />
    </div>
  </ToolPage>
</template>
