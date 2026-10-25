<script setup lang="ts">
import { ref } from 'vue'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { inspectPdf, type InspectValue, type PdfInspection } from '@/services/pdf/pdfInspector'
import { fileToUint8Array, formatBytes } from '@/services/pdf/fileBytes'
import { PDF_ACCEPT } from '@/types/pdf'

const { files, error: fileError, addFiles, removeFile } = useFileDrop({
  ...PDF_ACCEPT,
  multiple: false,
})
const { isProcessing, error, run, clearError } = useProcessing()
const inspection = ref<PdfInspection | null>(null)

function clearAllErrors() {
  clearError()
  fileError.value = null
}

function display<T>(value: InspectValue<T>): string {
  if (value.status === 'unavailable') return 'Not available'
  if (typeof value.value === 'boolean') return value.value ? 'Yes' : 'No'
  if (Array.isArray(value.value)) return value.value.join(', ') || '—'
  return String(value.value)
}

function onRemove(id: string) {
  removeFile(id)
  inspection.value = null
}

async function onInspect() {
  const file = files.value[0]
  if (!file) return
  const result = await run(async () => {
    const data = await fileToUint8Array(file.file)
    return inspectPdf(data, { name: file.name, size: file.size })
  })
  inspection.value = result ?? null
}
</script>

<template>
  <ToolPage
    title="PDF Inspector"
    description="Inspect metadata and structure locally. Fields the browser cannot read reliably show as Not available."
  >
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="addFiles" />
    <FileList :files="files" @remove="onRemove" />
    <ProgressBar :active="isProcessing" label="Inspecting…" />
    <v-btn
      color="primary"
      class="mb-6"
      :disabled="!files.length || isProcessing"
      :loading="isProcessing"
      @click="onInspect"
    >
      Inspect
    </v-btn>

    <template v-if="inspection">
      <v-card variant="outlined" class="mb-4">
        <v-card-title>File</v-card-title>
        <v-card-text>
          <div>Name: {{ inspection.file.name }}</div>
          <div>Size: {{ formatBytes(inspection.file.size) }}</div>
          <div>Pages: {{ display(inspection.file.pages) }}</div>
          <div>Version: {{ display(inspection.file.version) }}</div>
        </v-card-text>
      </v-card>
      <v-card variant="outlined" class="mb-4">
        <v-card-title>Security</v-card-title>
        <v-card-text>
          <div>Encrypted: {{ display(inspection.security.encrypted) }}</div>
        </v-card-text>
      </v-card>
      <v-card variant="outlined" class="mb-4">
        <v-card-title>Document</v-card-title>
        <v-card-text>
          <div>Title: {{ display(inspection.document.title) }}</div>
          <div>Author: {{ display(inspection.document.author) }}</div>
          <div>Subject: {{ display(inspection.document.subject) }}</div>
          <div>Creator: {{ display(inspection.document.creator) }}</div>
          <div>Producer: {{ display(inspection.document.producer) }}</div>
        </v-card-text>
      </v-card>
      <v-card variant="outlined" class="mb-4">
        <v-card-title>Content</v-card-title>
        <v-card-text>
          <div>Fonts: {{ display(inspection.content.fonts) }}</div>
          <div>Images: {{ display(inspection.content.images) }}</div>
          <div>Annotations: {{ display(inspection.content.annotations) }}</div>
          <div>Forms: {{ display(inspection.content.forms) }}</div>
          <div>Embedded files: {{ display(inspection.content.embeddedFiles) }}</div>
        </v-card-text>
      </v-card>
      <v-card v-if="inspection.pages.status === 'ok'" variant="outlined">
        <v-card-title>Pages</v-card-title>
        <v-card-text>
          <div v-for="p in inspection.pages.value" :key="p.pageNumber">
            Page {{ p.pageNumber }}: {{ p.width.toFixed(1) }} × {{ p.height.toFixed(1) }} pt
          </div>
        </v-card-text>
      </v-card>
    </template>
  </ToolPage>
</template>
