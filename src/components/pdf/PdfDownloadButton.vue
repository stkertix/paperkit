<script setup lang="ts">
defineProps<{
  disabled?: boolean
  label?: string
  loading?: boolean
}>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <v-btn
    color="primary"
    :disabled="disabled"
    :loading="loading"
    prepend-icon="mdi-download"
    @click="emit('click')"
  >
    {{ label ?? 'Download' }}
  </v-btn>
</template>
