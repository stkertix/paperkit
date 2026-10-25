<template>
  <v-footer class="footer px-4 py-6" color="transparent">
    <div class="footer-inner">
      <p class="mb-1">
        <strong>PaperKit</strong> — privacy-first PDF tools. Your files never leave your device.
      </p>
      <div class="links">
        <router-link to="/privacy">Privacy</router-link>
        <a
          href="https://github.com/stkertix/paperkit"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  </v-footer>
</template>

<style scoped>
.footer-inner {
  width: min(960px, 100%);
  margin: 0 auto;
  color: var(--pk-muted);
  font-size: 0.9rem;
}
.links {
  display: flex;
  gap: 1rem;
}
.links a {
  color: var(--pk-accent);
  text-decoration: none;
}
</style>
