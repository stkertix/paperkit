# PaperKit

**PaperKit** is a privacy-first PDF toolkit that runs entirely in your browser.

> No uploads. No server. No account required.

All PDF processing happens locally on your device. Files are never sent to a backend.

## Features

- Merge PDF
- Split PDF (extract pages or every page)
- Organize PDF (rotate, delete, reorder, duplicate, extract)
- PDF → Image (PNG/JPG)
- Image → PDF (JPG/PNG/WEBP)
- Add Signature (stamp PNG/JPG/WEBP onto pages)
- PDF Inspector
- Compress PDF (best-effort; no promised ratio)
- PDF Diff (text / visual)
- PDF → Markdown (best-effort)
- OCR (Tesseract.js, on-demand languages)
- Dark/light theme
- PWA installable app shell
- Deployable to GitHub Pages

## Privacy

All PDF processing happens locally in your browser. Your files are never uploaded to a server.

Theme preference may be stored in `localStorage` (`paperkit.theme`). Document bytes are never stored there.

## Tech stack

- Vue 3 + TypeScript + Vite
- Vuetify 3
- pdf-lib, PDF.js, JSZip, Tesseract.js
- Vitest + Playwright
- vite-plugin-pwa

## Local development

```bash
npm install
npm run dev
```

App base path is `/paperkit/` (GitHub Pages project site). Vite serves this correctly in development.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## GitHub Pages

1. Enable GitHub Pages with **GitHub Actions** as the source.
2. Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys `dist`.
3. Open `https://stkertix.github.io/paperkit/` (hash routes, e.g. `/#/merge`).

Source: [github.com/stkertix/paperkit](https://github.com/stkertix/paperkit)

Routing uses `createWebHashHistory` so no server rewrite rules are required.

## Architecture

- UI: Vue views/components
- PDF algorithms: `src/services/pdf/*`
- Shared errors: `src/services/errors/pdfErrors.ts`
- State: composables only (no Pinia in MVP)

## Supported browsers

Latest two major versions of Chrome, Firefox, Safari, and Edge. Very large PDFs may hit memory limits on mobile.

## Limitations

- Compression is not Ghostscript-class; some files barely shrink.
- Encrypted PDFs are often blocked or inspect-only.
- Image EXIF orientation may need a manual fix.
- Markdown and OCR are best-effort; OCR language packs download on first use.
- Searchable PDF from OCR is not generated (plain text download only).

## Contributing

Prefer one plan phase per focused PR. Keep PDF logic out of Vue components. Never introduce a backend or upload API.

## License

MIT
