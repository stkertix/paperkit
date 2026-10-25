<script setup lang="ts">
import type { PdfFile } from '@/types/pdf'
import { formatBytes } from '@/services/pdf/fileBytes'

defineProps<{
  files: PdfFile[]
  reorderable?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
  move: [from: number, to: number]
}>()
</script>

<template>
  <v-list v-if="files.length" lines="two" class="file-list mb-4">
    <v-list-item v-for="(file, index) in files" :key="file.id">
      <template #prepend>
        <v-icon>mdi-file-pdf-box</v-icon>
      </template>
      <v-list-item-title>{{ file.name }}</v-list-item-title>
      <v-list-item-subtitle>{{ formatBytes(file.size) }}</v-list-item-subtitle>
      <template #append>
        <div class="actions">
          <v-btn
            v-if="reorderable"
            icon="mdi-arrow-up"
            variant="text"
            size="small"
            :disabled="index === 0"
            @click="emit('move', index, index - 1)"
          />
          <v-btn
            v-if="reorderable"
            icon="mdi-arrow-down"
            variant="text"
            size="small"
            :disabled="index === files.length - 1"
            @click="emit('move', index, index + 1)"
          />
          <v-btn icon="mdi-close" variant="text" size="small" @click="emit('remove', file.id)" />
        </div>
      </template>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.actions {
  display: flex;
  align-items: center;
}
.file-list {
  border: 1px solid color-mix(in srgb, var(--pk-muted) 25%, transparent);
  border-radius: 8px;
}
</style>
