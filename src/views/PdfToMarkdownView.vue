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
import { pdfToMarkdown, type MarkdownConversion } from '@/services/pdf/pdfToMarkdown'
import { fileToUint8Array, downloadBytes } from '@/services/pdf/fileBytes'
import { PDF_ACCEPT } from '@/types/pdf'

const { files, error: fileError, addFiles, removeFile } = useFileDrop({
  ...PDF_ACCEPT,
  multiple: false,
})
const { isProcessing, error, run, clearError } = useProcessing()
const result = ref<MarkdownConversion | null>(null)
const copied = ref(false)

function clearAllErrors() {
  clearError()
  fileError.value = null
}

function onRemove(id: string) {
  removeFile(id)
  result.value = null
}

async function onConvert() {
  const file = files.value[0]
  if (!file) return
  result.value = null
  const out = await run(async (signal) => {
    const data = await fileToUint8Array(file.file)
    return pdfToMarkdown(data, { signal })
  })
  result.value = out ?? null
}

function onDownload() {
  if (!result.value) return
  const bytes = new TextEncoder().encode(result.value.markdown)
  downloadBytes(bytes, 'document.md', 'text/markdown;charset=utf-8')
}

async function onCopy() {
  if (!result.value) return
  await navigator.clipboard.writeText(result.value.markdown)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <ToolPage
    title="PDF to Markdown"
    description="Best-effort text extraction to Markdown. Layout and tables may be imperfect."
  >
    <v-alert type="info" variant="tonal" class="mb-4">
      Best-effort conversion. Layout and tables may be imperfect.
    </v-alert>

    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="addFiles" />
    <FileList :files="files" @remove="onRemove" />

    <ProgressBar :active="isProcessing" label="Converting…" />
    <v-btn
      color="primary"
      class="mb-4"
      :disabled="!files.length || isProcessing"
      :loading="isProcessing"
      @click="onConvert"
    >
      Convert
    </v-btn>

    <template v-if="result">
      <v-alert
        v-for="(w, i) in result.warnings"
        :key="i"
        type="warning"
        variant="tonal"
        class="mb-2"
      >
        {{ w }}
      </v-alert>

      <v-textarea
        :model-value="result.markdown"
        readonly
        variant="outlined"
        rows="16"
        class="mb-4"
        hide-details
      />

      <div class="d-flex ga-2 flex-wrap">
        <PdfDownloadButton label="Download .md" @click="onDownload" />
        <v-btn variant="outlined" @click="onCopy">
          {{ copied ? 'Copied' : 'Copy' }}
        </v-btn>
      </div>
    </template>
  </ToolPage>
</template>
