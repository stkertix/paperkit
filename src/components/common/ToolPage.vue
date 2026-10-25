<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="tool-page">
    <div class="mb-6">
      <v-btn variant="text" to="/" prepend-icon="mdi-arrow-left" class="mb-2 px-0">All tools</v-btn>
      <h1 class="text-h4 font-weight-bold mb-2">{{ title }}</h1>
      <p class="text-medium-emphasis">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.tool-page {
  width: min(900px, 100%);
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
</style>
