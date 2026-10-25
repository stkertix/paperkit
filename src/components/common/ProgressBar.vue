<script setup lang="ts">
defineProps<{
  active: boolean
  progress?: number | null
  label?: string
}>()
</script>

<template>
  <div v-if="active" class="mb-4">
    <div v-if="label" class="text-caption mb-1">{{ label }}</div>
    <v-progress-linear
      :indeterminate="progress == null"
      :model-value="progress != null ? progress * 100 : undefined"
      color="primary"
      height="6"
      rounded
    />
  </div>
</template>
