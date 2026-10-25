<script setup lang="ts">
import { ref } from 'vue'
import type { FileValidationOptions } from '@/types/pdf'
import { PDF_ACCEPT } from '@/types/pdf'

withDefaults(
  defineProps<{
    multiple?: boolean
    options?: FileValidationOptions
    label?: string
  }>(),
  {
    multiple: true,
    options: () => PDF_ACCEPT,
    label: 'Drop PDF files here or click to browse',
  },
)

const emit = defineEmits<{ files: [File[]] }>()
const dragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function onFiles(list: FileList | null) {
  if (!list?.length) return
  emit('files', Array.from(list))
}

function openPicker() {
  inputRef.value?.click()
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ dragging }"
    role="button"
    tabindex="0"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="
      dragging = false;
      onFiles(($event as DragEvent).dataTransfer?.files ?? null)
    "
  >
    <v-icon size="40" color="primary" class="mb-2">mdi-file-upload-outline</v-icon>
    <div>{{ label }}</div>
    <div class="text-caption text-medium-emphasis mt-1">
      Max {{ (options.maxBytes / (1024 * 1024)).toFixed(0) }} MB ·
      {{ options.acceptExt.join(', ') }}
    </div>
    <input
      ref="inputRef"
      type="file"
      class="hidden-input"
      :accept="[...options.acceptMime, ...options.acceptExt].join(',')"
      :multiple="multiple"
      @change="onFiles(($event.target as HTMLInputElement).files); ($event.target as HTMLInputElement).value = ''"
    />
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed color-mix(in srgb, var(--pk-accent) 45%, transparent);
  border-radius: 12px;
  padding: 2rem 1.25rem;
  text-align: center;
  cursor: pointer;
  background: color-mix(in srgb, var(--pk-accent) 6%, transparent);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.dropzone.dragging,
.dropzone:hover {
  border-color: var(--pk-accent);
  background: color-mix(in srgb, var(--pk-accent) 12%, transparent);
}
.hidden-input {
  display: none;
}
</style>
