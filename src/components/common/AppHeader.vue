<script setup lang="ts">
import ThemeToggle from '@/components/common/ThemeToggle.vue'
</script>

<template>
  <v-app-bar flat border color="surface" density="comfortable">
    <v-app-bar-title>
      <router-link to="/" class="brand text-decoration-none">PaperKit</router-link>
    </v-app-bar-title>
    <v-spacer />
    <v-btn variant="text" to="/privacy">Privacy</v-btn>
    <ThemeToggle />
  </v-app-bar>
</template>

<style scoped>
.brand {
  color: var(--pk-accent);
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
