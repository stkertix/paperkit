<script setup lang="ts">
import type { PdfAppError } from '@/services/errors/pdfErrors'

defineProps<{
  error: PdfAppError | string | null
}>()

const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <v-alert
    v-if="error"
    type="error"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="emit('clear')"
  >
    {{ typeof error === 'string' ? error : error.message }}
  </v-alert>
</template>
