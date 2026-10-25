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
import { imagesToPdf } from '@/services/pdf/imageToPdf'
import { fileToUint8Array, downloadBytes } from '@/services/pdf/fileBytes'
import type { FitMode, Orientation, PagePreset } from '@/types/pdf'
import { IMAGE_ACCEPT } from '@/types/pdf'

const { files, error: fileError, addFiles, removeFile, reorder } = useFileDrop(IMAGE_ACCEPT)
const { isProcessing, error, run, clearError } = useProcessing()
const preset = ref<PagePreset>('a4')
const orientation = ref<Orientation>('portrait')
const fit = ref<FitMode>('contain')
const marginPt = ref(36)

function clearAllErrors() {
  clearError()
  fileError.value = null
}

async function onCreate() {
  await run(async (signal) => {
    const images = []
    for (const f of files.value) {
      images.push({
        name: f.name,
        bytes: await fileToUint8Array(f.file),
        mime: f.file.type || 'image/png',
      })
    }
    const out = await imagesToPdf(images, {
      preset: preset.value,
      orientation: orientation.value,
      marginPt: marginPt.value,
      fit: fit.value,
      signal,
    })
    downloadBytes(out, 'images.pdf')
  })
}
</script>

<template>
  <ToolPage
    title="Image to PDF"
    description="Create a PDF from JPG, PNG, or WEBP. Some photos may need manual rotation if EXIF orientation is ignored."
  >
    <ErrorAlert :error="fileError || error" @clear="clearAllErrors" />
    <PdfDropzone
      class="mb-4"
      :options="IMAGE_ACCEPT"
      label="Drop images here or click to browse"
      @files="addFiles"
    />
    <FileList :files="files" reorderable @remove="removeFile" @move="reorder" />

    <v-select
      v-model="preset"
      :items="[
        { title: 'A4', value: 'a4' },
        { title: 'Letter', value: 'letter' },
        { title: 'Original size', value: 'original' },
      ]"
      label="Page size"
      variant="outlined"
      class="mb-3"
    />
    <v-select
      v-model="orientation"
      :items="[
        { title: 'Portrait', value: 'portrait' },
        { title: 'Landscape', value: 'landscape' },
      ]"
      label="Orientation"
      variant="outlined"
      class="mb-3"
    />
    <v-select
      v-model="fit"
      :items="[
        { title: 'Fit (contain)', value: 'contain' },
        { title: 'Cover', value: 'cover' },
        { title: 'Stretch', value: 'stretch' },
      ]"
      label="Fit mode"
      variant="outlined"
      class="mb-3"
    />
    <v-slider v-model="marginPt" :min="0" :max="72" :step="1" label="Margin (pt)" class="mb-4" />

    <ProgressBar :active="isProcessing" />
    <PdfDownloadButton
      label="Create PDF"
      :disabled="!files.length || isProcessing"
      :loading="isProcessing"
      @click="onCreate"
    />
  </ToolPage>
</template>
