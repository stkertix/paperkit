<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark, toggle } = useTheme()
</script>

<template>
  <v-btn
    :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
    variant="text"
    aria-label="Toggle theme"
    @click="toggle"
  />
</template>
