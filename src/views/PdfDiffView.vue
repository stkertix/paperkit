<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import ToolPage from '@/components/common/ToolPage.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import PdfDropzone from '@/components/pdf/PdfDropzone.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { useProcessing } from '@/composables/useProcessing'
import {
  getPageCount,
  textDiffPage,
  visualComparePages,
  type DiffMode,
  type TextDiffResult,
} from '@/services/pdf/pdfDiff'
import { fileToUint8Array } from '@/services/pdf/fileBytes'
import { PDF_ACCEPT } from '@/types/pdf'
import { createPdfError } from '@/services/errors/pdfErrors'

const leftDrop = useFileDrop({ ...PDF_ACCEPT, multiple: false })
const rightDrop = useFileDrop({ ...PDF_ACCEPT, multiple: false })
const { isProcessing, error, run, clearError } = useProcessing()
const mode = ref<DiffMode>('text')
const page = ref(1)
const pageCountA = ref(0)
const pageCountB = ref(0)
const bytesA = ref<Uint8Array | null>(null)
const bytesB = ref<Uint8Array | null>(null)
const textResult = ref<TextDiffResult | null>(null)
const visual = ref<{ leftUrl: string; rightUrl: string } | null>(null)
const nameA = ref('')
const nameB = ref('')

const maxPage = computed(() => {
  if (!pageCountA.value || !pageCountB.value) return 0
  return Math.min(pageCountA.value, pageCountB.value)
})

const pageMismatch = computed(
  () =>
    pageCountA.value > 0 &&
    pageCountB.value > 0 &&
    pageCountA.value !== pageCountB.value,
)

const largeDoc = computed(() => Math.max(pageCountA.value, pageCountB.value) > 50)

function clearAllErrors() {
  clearError()
  leftDrop.error.value = null
  rightDrop.error.value = null
}

async function loadSide(side: 'a' | 'b', list: File[]) {
  const drop = side === 'a' ? leftDrop : rightDrop
  drop.clear()
  drop.addFiles(list)
  const file = drop.files.value[0]
  if (!file) {
    if (side === 'a') {
      bytesA.value = null
      pageCountA.value = 0
      nameA.value = ''
    } else {
      bytesB.value = null
      pageCountB.value = 0
      nameB.value = ''
    }
    return
  }
  const data = await fileToUint8Array(file.file)
  const count = await getPageCount(data)
  if (side === 'a') {
    bytesA.value = data
    pageCountA.value = count
    nameA.value = file.name
  } else {
    bytesB.value = data
    pageCountB.value = count
    nameB.value = file.name
  }
  page.value = 1
}

async function compare() {
  await run(async () => {
    if (!bytesA.value || !bytesB.value || !maxPage.value) throw createPdfError('EMPTY_INPUT')
    if (mode.value === 'text') {
      visual.value = null
      textResult.value = await textDiffPage(bytesA.value, bytesB.value, page.value)
    } else {
      textResult.value = null
      visual.value = await visualComparePages(bytesA.value, bytesB.value, page.value)
    }
  })
}

watch([page, mode], () => {
  if (bytesA.value && bytesB.value) void compare()
})

onUnmounted(() => {
  visual.value = null
  textResult.value = null
})
</script>

<template>
  <ToolPage
    title="PDF Diff"
    description="Compare two PDFs locally — text or visual, page by page. Nothing is uploaded."
  >
    <ErrorAlert
      :error="leftDrop.error.value || rightDrop.error.value || error"
      @clear="clearAllErrors"
    />

    <v-alert v-if="largeDoc" type="warning" variant="tonal" class="mb-4">
      Large documents may be slow. Comparison runs one page at a time.
    </v-alert>
    <v-alert v-if="pageMismatch" type="info" variant="tonal" class="mb-4">
      Page counts differ ({{ pageCountA }} vs {{ pageCountB }}). Navigation is limited to
      {{ maxPage }} pages.
    </v-alert>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <div class="text-subtitle-2 mb-2">Document A</div>
        <PdfDropzone :multiple="false" label="Drop PDF A" @files="(f) => loadSide('a', f)" />
        <div v-if="nameA" class="text-caption mt-1">{{ nameA }}</div>
      </v-col>
      <v-col cols="12" md="6">
        <div class="text-subtitle-2 mb-2">Document B</div>
        <PdfDropzone :multiple="false" label="Drop PDF B" @files="(f) => loadSide('b', f)" />
        <div v-if="nameB" class="text-caption mt-1">{{ nameB }}</div>
      </v-col>
    </v-row>

    <v-radio-group v-model="mode" inline class="mb-2">
      <v-radio label="Text diff" value="text" />
      <v-radio label="Visual diff" value="visual" />
    </v-radio-group>

    <div v-if="maxPage" class="d-flex align-center ga-2 mb-4 flex-wrap">
      <v-btn variant="outlined" :disabled="page <= 1 || isProcessing" @click="page--">Previous</v-btn>
      <span>Page {{ page }} / {{ maxPage }}</span>
      <v-btn
        variant="outlined"
        :disabled="page >= maxPage || isProcessing"
        @click="page++"
      >
        Next
      </v-btn>
      <v-btn color="primary" :disabled="isProcessing" :loading="isProcessing" @click="compare">
        Compare
      </v-btn>
    </div>

    <ProgressBar :active="isProcessing" label="Comparing…" />

    <v-alert
      v-if="textResult && (textResult.leftEmpty || textResult.rightEmpty)"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Little or no text on this page. Try visual diff, or OCR for scanned pages.
    </v-alert>

    <div v-if="textResult" class="diff-grid mb-4">
      <div v-for="(h, i) in textResult.hunks" :key="i" class="diff-row">
        <div class="pane left">{{ h.left }}</div>
        <div class="pane right">{{ h.right }}</div>
      </div>
    </div>

    <div v-if="visual" class="diff-grid">
      <div class="pane">
        <div class="text-caption mb-1">A</div>
        <img :src="visual.leftUrl" alt="Page A" />
      </div>
      <div class="pane">
        <div class="text-caption mb-1">B</div>
        <img :src="visual.rightUrl" alt="Page B" />
      </div>
    </div>
  </ToolPage>
</template>

<style scoped>
.diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.diff-row {
  display: contents;
}
.pane {
  border: 1px solid color-mix(in srgb, var(--pk-muted) 25%, transparent);
  border-radius: 8px;
  padding: 0.75rem;
  background: var(--pk-surface);
  font-size: 0.9rem;
  word-break: break-word;
}
.pane img {
  width: 100%;
  height: auto;
  display: block;
}
.left {
  border-left: 3px solid #b54708;
}
.right {
  border-left: 3px solid var(--pk-accent);
}
@media (max-width: 700px) {
  .diff-grid {
    grid-template-columns: 1fr;
  }
}
</style>
