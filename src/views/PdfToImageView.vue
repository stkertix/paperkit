<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import PdfDownloadButton from '@/components/pdf/PdfDownloadButton.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { pdfPagesToImages } from '@/services/pdf/pdfToImage'
import { fileToUint8Array, downloadBlob } from '@/services/pdf/fileBytes'
import type { ImageFormat } from '@/types/pdf'
import { PDF_ACCEPT } from '@/types/pdf'

const { files, error: fileError, addFiles, removeFile } = useFileDrop({
  ...PDF_ACCEPT,
  multiple: false,
})
const { isProcessing, progress, error, run, clearError } = useProcessing()
const format = ref<ImageFormat>('png')
const dpi = ref<72 | 150 | 300>(150)
const quality = ref(0.92)

function clearAllErrors() {
  clearError()
  fileError.value = null
}

async function onConvert() {
  const file = files.value[0]
  if (!file) return
  await run(async (signal) => {
    const data = await fileToUint8Array(file.file)
    const images = await pdfPagesToImages(data, {
      format: format.value,
      dpi: dpi.value,
      quality: quality.value,
      signal,
      onProgress: (c, t) => {
        progress.value = c / t
      },
    })
    if (images.length === 1) {
      downloadBlob(images[0].blob, `page-001.${format.value === 'jpg' ? 'jpg' : 'png'}`)
      return
    }
    const zip = new JSZip()
    for (const img of images) {
      const ext = format.value === 'jpg' ? 'jpg' : 'png'
      zip.file(`page-${String(img.pageNumber).padStart(3, '0')}.${ext}`, img.blob)
    }
    downloadBlob(await zip.generateAsync({ type: 'blob' }), 'pages.zip')
  })
}
</script>

<template>
  <ToolPage title="PDF to Image" description="Export PDF pages as PNG or JPG. High DPI uses more memory.">
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone :multiple="false" class="mb-4" @files="addFiles" />
    <FileList :files="files" @remove="removeFile" />

    <v-radio-group v-model="format" inline label="Format">
      <v-radio label="PNG" value="png" />
      <v-radio label="JPG" value="jpg" />
    </v-radio-group>

    <v-slider
      v-if="format === 'jpg'"
      v-model="quality"
      :min="0.4"
      :max="1"
      :step="0.01"
      label="Quality"
      class="mb-2"
    />

    <v-btn-toggle v-model="dpi" mandatory color="primary" class="mb-4">
      <v-btn :value="72">72 DPI</v-btn>
      <v-btn :value="150">150 DPI</v-btn>
      <v-btn :value="300">300 DPI</v-btn>
    </v-btn-toggle>

    <ProgressBar :active="isProcessing" :progress="progress" />
    <PdfDownloadButton
      label="Convert & download"
      :disabled="!files.length || isProcessing"
      :loading="isProcessing"
      @click="onConvert"
    />
  </ToolPage>
</template>
