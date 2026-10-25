<script setup lang="ts">
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import PdfDownloadButton from '@/components/pdf/PdfDownloadButton.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { mergePdfs } from '@/services/pdf/pdfMerge'
import { downloadBytes } from '@/services/pdf/fileBytes'

const { files, error: fileError, addFiles, removeFile, clear, reorder } = useFileDrop()
const { isProcessing, progress, error, run, clearError, cancel } = useProcessing()

function clearAllErrors() {
  clearError()
  fileError.value = null
}

async function onMerge() {
  const result = await run(async (signal) => {
    return mergePdfs([...files.value], {
      signal,
      onProgress: (p) => {
        progress.value = p.current / p.total
      },
    })
  })
  if (result) downloadBytes(result, 'merged.pdf')
}
</script>

<template>
  <ToolPage title="Merge PDF" description="Combine multiple PDFs into one file. Processing stays in your browser.">
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone class="mb-4" @files="addFiles" />
    <FileList :files="files" reorderable @remove="removeFile" @move="reorder" />
    <ProgressBar :active="isProcessing" :progress="progress" label="Merging…" />
    <div class="d-flex ga-2 flex-wrap">
      <PdfDownloadButton
        label="Merge & download"
        :disabled="files.length < 2 || isProcessing"
        :loading="isProcessing"
        @click="onMerge"
      />
      <v-btn v-if="isProcessing" variant="outlined" @click="cancel">Cancel</v-btn>
      <v-btn variant="text" :disabled="!files.length" @click="clear">Clear</v-btn>
    </div>
  </ToolPage>
</template>
