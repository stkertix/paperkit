<template>
  <div class="privacy">
    <v-btn variant="text" to="/" prepend-icon="mdi-arrow-left" class="mb-2 px-0">Home</v-btn>
    <h1 class="text-h4 font-weight-bold mb-4">Privacy</h1>

    <p class="mb-4">
      <strong>Your files are processed locally.</strong> PDF files are not uploaded to our server.
      Processing happens inside your browser.
    </p>

    <h2 class="text-h6 mb-2">What PaperKit does</h2>
    <ul class="mb-4">
      <li>Runs entirely as a static frontend (including on GitHub Pages)</li>
      <li>Reads files you select with the browser File API</li>
      <li>Processes PDFs in memory with libraries such as pdf-lib and PDF.js</li>
      <li>Lets you download results from your device</li>
    </ul>

    <h2 class="text-h6 mb-2">What PaperKit does not do</h2>
    <ul class="mb-4">
      <li>No upload API for your documents</li>
      <li>No server-side PDF processing</li>
      <li>No external PDF processing APIs</li>
      <li>No analytics that send document content or filenames</li>
      <li>No storing PDF bytes in localStorage</li>
    </ul>

    <h2 class="text-h6 mb-2">Preferences</h2>
    <p class="mb-4">
      Theme preference may be stored in <code>localStorage</code> under
      <code>paperkit.theme</code>. That key never contains document data.
    </p>

    <p class="text-medium-emphasis">
      If analytics are ever considered in the future, file contents and filenames must never be sent.
    </p>
  </div>
</template>

<style scoped>
.privacy {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
ul {
  color: var(--pk-muted);
}
</style>
