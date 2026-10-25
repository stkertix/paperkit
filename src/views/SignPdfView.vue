<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import FileList from '@/components/pdf/FileList.vue'
import PdfPageGrid from '@/components/pdf/PdfPageGrid.vue'
import SignaturePlacement from '@/components/pdf/SignaturePlacement.vue'
import PdfDownloadButton from '@/components/pdf/PdfDownloadButton.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import { usePageSelection } from '@/composables/usePageSelection'
import {
  anchorToPlacement,
  stampSignature,
  type SignatureAnchor,
} from '@/services/pdf/pdfSign'
import { fileToUint8Array, downloadBytes } from '@/services/pdf/fileBytes'
import { IMAGE_ACCEPT, PDF_ACCEPT } from '@/types/pdf'
import { createPdfError } from '@/services/errors/pdfErrors'

const pdfDrop = useFileDrop({ ...PDF_ACCEPT, multiple: false })
const sigDrop = useFileDrop({ ...IMAGE_ACCEPT, multiple: false })
const { isProcessing, error, run, clearError } = useProcessing()
const { selected, toggle, clear: clearSelection, range, selectMany } = usePageSelection()

const pdfBytes = ref<Uint8Array | null>(null)
const pageCount = ref(0)
const targetMode = ref<'last' | 'all' | 'selected'>('last')
const placementPage = ref(1)
const xNorm = ref(0.62)
const yNorm = ref(0.06)
const widthNorm = ref(0.28)
const aspect = ref(0.35)
const pageWidthPt = ref(612)
const pageHeightPt = ref(792)

const sigPreview = computed(() => sigDrop.files.value[0]?.objectUrl ?? null)

const presetItems: { title: string; value: SignatureAnchor }[] = [
  { title: 'Snap: bottom right', value: 'bottom-right' },
  { title: 'Snap: bottom left', value: 'bottom-left' },
  { title: 'Snap: bottom center', value: 'bottom-center' },
  { title: 'Snap: top right', value: 'top-right' },
  { title: 'Snap: center', value: 'center' },
]

watch(pageCount, (n) => {
  if (targetMode.value === 'last' && n > 0) placementPage.value = n
})

watch(targetMode, (mode) => {
  if (mode === 'last' && pageCount.value > 0) placementPage.value = pageCount.value
  if (mode === 'all' && pageCount.value > 0) placementPage.value = 1
})

watch(sigPreview, async (url) => {
  if (!url) return
  const img = new Image()
  img.src = url
  await img.decode().catch(() => undefined)
  if (img.naturalWidth > 0) {
    aspect.value = img.naturalHeight / img.naturalWidth
  }
})

function clearAllErrors() {
  clearError()
  pdfDrop.error.value = null
  sigDrop.error.value = null
}

async function onPdfFiles(list: File[]) {
  pdfDrop.clear()
  pdfDrop.addFiles(list)
  clearSelection()
  if (pdfDrop.files.value[0]) {
    pdfBytes.value = await fileToUint8Array(pdfDrop.files.value[0].file)
  } else {
    pdfBytes.value = null
    pageCount.value = 0
  }
}

function onPdfRemove() {
  pdfDrop.clear()
  pdfBytes.value = null
  pageCount.value = 0
  clearSelection()
}

function onSigFiles(list: File[]) {
  sigDrop.clear()
  sigDrop.addFiles(list)
}

function onPageCount(n: number) {
  pageCount.value = n
  if (targetMode.value === 'last') placementPage.value = n
}

function snapTo(anchor: SignatureAnchor) {
  const next = anchorToPlacement(
    anchor,
    pageWidthPt.value,
    pageHeightPt.value,
    widthNorm.value * pageWidthPt.value,
    aspect.value,
    36,
  )
  xNorm.value = next.xNorm
  yNorm.value = next.yNorm
  widthNorm.value = next.widthNorm
}

function resolvePages(): number[] | undefined {
  if (targetMode.value === 'last') return undefined
  if (targetMode.value === 'all') {
    return Array.from({ length: pageCount.value }, (_, i) => i + 1)
  }
  return range.value
}

async function onStamp() {
  await run(async (signal) => {
    const pdfFile = pdfDrop.files.value[0]
    const sigFile = sigDrop.files.value[0]
    if (!pdfFile || !sigFile || !pdfBytes.value) throw createPdfError('EMPTY_INPUT')
    if (targetMode.value === 'selected' && !range.value.length) {
      throw createPdfError('EMPTY_INPUT')
    }
    const out = await stampSignature(
      pdfBytes.value,
      {
        bytes: await fileToUint8Array(sigFile.file),
        mime: sigFile.file.type || 'image/png',
      },
      {
        pages: resolvePages(),
        placement: {
          xNorm: xNorm.value,
          yNorm: yNorm.value,
          widthNorm: widthNorm.value,
        },
        signal,
      },
    )
    downloadBytes(out, 'signed.pdf')
  })
}
</script>

<template>
  <ToolPage
    title="Add Signature"
    description="Drag the signature onto the page preview to place it. Prefer a PNG with a transparent background."
  >
    <ErrorAlert
      :error="pdfDrop.error.value || sigDrop.error.value || error"
      @clear="clearAllErrors"
    />

    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <div class="text-subtitle-2 mb-2">PDF document</div>
        <PdfDropzone :multiple="false" label="Drop PDF here" @files="onPdfFiles" />
        <FileList :files="pdfDrop.files.value" class="mt-2" @remove="onPdfRemove" />
      </v-col>
      <v-col cols="12" md="6">
        <div class="text-subtitle-2 mb-2">Signature image</div>
        <PdfDropzone
          :multiple="false"
          :options="IMAGE_ACCEPT"
          label="Drop signature (PNG / JPG / WEBP)"
          @files="onSigFiles"
        />
        <FileList
          :files="sigDrop.files.value"
          class="mt-2"
          @remove="sigDrop.removeFile"
        />
      </v-col>
    </v-row>

    <v-radio-group v-model="targetMode" inline label="Apply placement to" class="mb-2">
      <v-radio label="Last page" value="last" />
      <v-radio label="All pages" value="all" />
      <v-radio label="Selected pages" value="selected" />
    </v-radio-group>

    <PdfPageGrid
      v-if="pdfBytes && targetMode === 'selected'"
      :data="pdfBytes"
      :selected="selected"
      selectable
      class="mb-4"
      @toggle="toggle"
      @loaded="onPageCount"
    />

    <div v-if="pdfBytes && pageCount" class="mb-3 d-flex ga-2 flex-wrap align-center">
      <v-btn
        v-if="pageCount > 1"
        variant="outlined"
        size="small"
        :disabled="placementPage <= 1"
        @click="placementPage--"
      >
        Prev page
      </v-btn>
      <span class="text-body-2">Placement preview: page {{ placementPage }} / {{ pageCount }}</span>
      <v-btn
        v-if="pageCount > 1"
        variant="outlined"
        size="small"
        :disabled="placementPage >= pageCount"
        @click="placementPage++"
      >
        Next page
      </v-btn>
      <v-btn
        v-if="targetMode === 'selected'"
        variant="text"
        size="small"
        @click="selectMany([placementPage])"
      >
        Select this page
      </v-btn>
    </div>

    <SignaturePlacement
      v-if="pdfBytes"
      :pdf-data="pdfBytes"
      :page-number="Math.min(placementPage, Math.max(pageCount, 1))"
      :signature-url="sigPreview"
      :aspect="aspect"
      :x-norm="xNorm"
      :y-norm="yNorm"
      :width-norm="widthNorm"
      class="mb-4"
      @update:x-norm="(v) => (xNorm = v)"
      @update:y-norm="(v) => (yNorm = v)"
      @update:width-norm="(v) => (widthNorm = v)"
      @page-size="
        (s) => {
          pageWidthPt = s.widthPt
          pageHeightPt = s.heightPt
        }
      "
      @page-count="onPageCount"
    />

    <div class="mb-3 d-flex ga-2 flex-wrap">
      <v-btn
        v-for="item in presetItems"
        :key="item.value"
        size="small"
        variant="outlined"
        @click="snapTo(item.value)"
      >
        {{ item.title }}
      </v-btn>
    </div>

    <v-slider
      :model-value="Math.round(widthNorm * 100)"
      :min="8"
      :max="60"
      :step="1"
      label="Signature width (% of page)"
      thumb-label
      class="mb-4"
      @update:model-value="(v) => (widthNorm = Number(v) / 100)"
    />

    <ProgressBar :active="isProcessing" label="Stamping signature…" />
    <PdfDownloadButton
      label="Stamp & download"
      :disabled="!pdfDrop.files.value.length || !sigDrop.files.value.length || isProcessing"
      :loading="isProcessing"
      @click="onStamp"
    />
  </ToolPage>
</template>
