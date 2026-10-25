<script setup lang="ts">
import { TOOLS } from '@/data/tools'
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="eyebrow">No uploads · No server · No account</p>
      <h1>PaperKit</h1>
      <p class="lede">
        Private PDF tools that run entirely in your browser. Your files never leave your device.
      </p>
    </section>

    <section class="tools" aria-label="PDF tools">
      <v-row>
        <v-col v-for="tool in TOOLS" :key="tool.id" cols="12" sm="6" md="4">
          <v-card :to="tool.to" variant="outlined" class="tool-card h-100" hover>
            <v-card-item>
              <template #prepend>
                <v-icon :icon="tool.icon" color="primary" size="28" />
              </template>
              <v-card-title>{{ tool.title }}</v-card-title>
              <v-card-subtitle>{{ tool.description }}</v-card-subtitle>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </div>
</template>

<style scoped>
.home {
  width: min(960px, 100%);
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}
.hero {
  padding: 2.5rem 0 2rem;
}
.eyebrow {
  color: var(--pk-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  margin: 0 0 0.75rem;
}
.hero h1 {
  font-size: clamp(2.75rem, 8vw, 4.5rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin: 0 0 0.75rem;
  color: var(--pk-accent);
}
.lede {
  max-width: 36rem;
  font-size: 1.15rem;
  color: var(--pk-muted);
  margin: 0;
}
.tool-card {
  border-color: color-mix(in srgb, var(--pk-muted) 25%, transparent) !important;
}
</style>
