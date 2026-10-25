# PaperKit — Agent Execution Plan

## 1. Project Goal

Build **PaperKit**: a modern, privacy-first, frontend-only PDF toolkit that runs entirely in the browser and deploys to GitHub Pages.

Core principle:

> PDF files must never be uploaded to a backend server.

All PDF processing must happen locally in the user's browser.

PaperKit should be:

- Frontend-only
- Deployable to GitHub Pages
- PWA-ready
- Responsive
- Privacy-focused
- Fast for common PDF operations
- Open-source friendly
- Modular so additional PDF tools can be added easily

Product positioning (see §32):

> A privacy-first PDF toolkit that runs entirely in your browser.

Secondary:

> No uploads. No server. No account required.

Do not position PaperKit merely as “another PDF converter.”

---

## 2. Recommended Stack (Locked Defaults)

Use these defaults. Do not invent alternatives unless a technical blocker forces a documented change.

| Concern             | Decision                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager     | **npm**                                                                                                                                                          |
| Framework           | Vue 3 + TypeScript                                                                                                                                               |
| Build               | Vite                                                                                                                                                             |
| UI                  | Vuetify 3                                                                                                                                                        |
| Routing             | Vue Router with **`createWebHashHistory`** (GitHub Pages–safe; no server rewrites)                                                                               |
| Vite `base`         | `'/paperkit/'` when the repo is served as `username.github.io/paperkit` (constant in `vite.config.ts`; document override for user/org pages root if ever needed) |
| Path alias          | `@/` → `src/`                                                                                                                                                    |
| State               | **Composables only** for MVP — no Pinia unless a later phase proves shared cross-route state is required                                                         |
| PDF mutate          | `pdf-lib`                                                                                                                                                        |
| PDF render / text   | `pdfjs-dist`                                                                                                                                                     |
| Multi-file download | `JSZip`                                                                                                                                                          |
| OCR                 | `Tesseract.js` **only** when Phase 15 is implemented                                                                                                             |
| Unit tests          | Vitest                                                                                                                                                           |
| E2E                 | Playwright                                                                                                                                                       |
| PWA                 | `vite-plugin-pwa` (or equivalent Vite-native approach)                                                                                                           |

Do NOT introduce a backend.

Avoid unnecessary dependencies.

### Brand theme (Vuetify + CSS variables)

Define a simple **ink / paper** palette — not purple-on-white, not cream+terracotta broadsheet clichés.

Suggested CSS variables (adjust in implementation, keep the direction):

```css
:root {
  --pk-ink: #1a1f24;
  --pk-paper: #f7f5f2;
  --pk-accent: #0d6e6e; /* teal ink, not purple */
  --pk-muted: #5c6570;
  --pk-danger: #b42318;
}
```

Support light and dark themes via Vuetify theme + these tokens.

---

## 3. Application Structure

Create the application around reusable PDF-processing modules.

Keep PDF processing logic outside Vue components. Vue components handle UI/state; services own algorithms; workers own CPU-heavy jobs.

Recommended structure (create folders when the owning phase starts; do not stub every late-phase view in Phase 0):

```text
src/
├── assets/
│   └── icons/
├── components/
│   ├── pdf/
│   │   ├── PdfDropzone.vue
│   │   ├── PdfPreview.vue
│   │   ├── PdfPageGrid.vue
│   │   ├── PdfPageCard.vue
│   │   ├── PdfToolbar.vue
│   │   └── PdfDownloadButton.vue
│   │
│   └── common/
│       ├── AppHeader.vue
│       ├── AppFooter.vue
│       ├── FileDropzone.vue
│       ├── ProgressBar.vue
│       ├── ErrorAlert.vue
│       └── ThemeToggle.vue
│
├── views/
│   ├── HomeView.vue
│   ├── MergePdfView.vue
│   ├── SplitPdfView.vue
│   ├── CompressPdfView.vue
│   ├── PdfToImageView.vue
│   ├── ImageToPdfView.vue
│   ├── PdfInspectorView.vue
│   ├── PrivacyView.vue
│   ├── PdfDiffView.vue          # Phase 13
│   ├── PdfToMarkdownView.vue    # Phase 14
│   └── OcrView.vue              # Phase 15
│
├── services/
│   ├── pdf/
│   │   ├── pdfMerge.ts
│   │   ├── pdfSplit.ts
│   │   ├── pageOps.ts           # shared page engine (Phase 6)
│   │   ├── pdfRotate.ts         # thin wrappers ok if they call pageOps
│   │   ├── pdfDeletePages.ts
│   │   ├── pdfExtractPages.ts
│   │   ├── pdfCompress.ts
│   │   ├── pdfToImage.ts
│   │   ├── imageToPdf.ts
│   │   ├── pdfInspector.ts
│   │   ├── pdfDiff.ts           # Phase 13
│   │   ├── pdfToMarkdown.ts     # Phase 14
│   │   └── pdfOcr.ts            # Phase 15
│   │
│   ├── errors/
│   │   └── pdfErrors.ts
│   │
│   └── storage/
│       └── localStorage.ts      # theme prefs only — never PDF bytes
│
├── composables/
│   ├── usePdf.ts
│   ├── useFileDrop.ts
│   ├── useProcessing.ts
│   ├── usePageSelection.ts
│   └── useTheme.ts
│
├── workers/
│   ├── pdfWorker.ts
│   ├── compressWorker.ts
│   └── ocrWorker.ts             # Phase 15
│
├── styles/
│   ├── tokens.css
│   └── main.css
│
├── types/
│   └── pdf.ts
│
├── router/
│   └── index.ts
│
├── App.vue
└── main.ts

public/
├── favicon.svg
├── icons/                       # PWA icons
└── offline.html                 # optional offline fallback

tests/
├── fixtures/
│   ├── pdf/
│   └── images/
├── unit/
└── e2e/
```

---

## Phase subsection template

Every phase below uses this shape:

1. Goal
2. Files to create/change
3. Public APIs / types
4. UI flow
5. Edge cases & errors
6. Tests
7. Acceptance criteria
8. Out of scope for this phase

Global Definition of Done (§29) always applies.

---

## 4. Phase 0 — Project Initialization

### Goal

Scaffold a working Vue 3 + Vite + TypeScript + Vuetify app with lint, format, unit/e2e harness, GitHub Actions deploy to Pages, MIT license, and README skeleton. No PDF tools yet.

### Files to create/change

```text
package.json
vite.config.ts
tsconfig.json / tsconfig.app.json / tsconfig.node.json
index.html
src/main.ts
src/App.vue
src/styles/tokens.css
src/styles/main.css
eslint.config.js (or .eslintrc.cjs)
.prettierrc
vitest.config.ts
playwright.config.ts
.gitignore
LICENSE          # MIT
README.md
.github/workflows/deploy.yml
```

### Public APIs / types

N/A beyond empty `src/types/pdf.ts` placeholder if useful.

### npm scripts (must exist)

```text
npm run dev
npm run build
npm run preview
npm run test          # Vitest
npm run test:e2e      # Playwright
npm run lint
npm run format
```

### UI flow

N/A — default Vite/Vue shell is enough; replace with PaperKit shell in Phase 1.

### Edge cases & errors

- CI must use a pinned Node LTS (document in workflow, e.g. Node 22).
- `base: '/paperkit/'` must not break local `npm run dev` (Vite handles base in dev).

### Tests

- At least one Vitest smoke test (`true`/mount App if trivial).
- Playwright config present; one smoke e2e that loads `/` (hash-aware) may wait until Phase 1.

### Acceptance criteria

- [ ] `npm run dev` starts
- [ ] `npm run build` succeeds
- [ ] `npm run test` succeeds
- [ ] `npm run lint` succeeds
- [ ] GitHub Actions workflow exists and deploys `dist` to GitHub Pages on `main`
- [ ] MIT LICENSE + README skeleton present
- [ ] No backend, no upload API

### Out of scope

- PDF libraries wiring beyond installing deps if preferred early
- Tool pages, PWA, real e2e PDF flows

### Deploy workflow outline

```text
.github/workflows/deploy.yml

on: push to main
jobs:
  build-and-deploy:
    - checkout
    - setup-node (LTS, npm cache)
    - npm ci
    - npm run lint
    - npm run test
    - npm run build
    - upload pages artifact (dist)
    - deploy to GitHub Pages
```

Deployment must fail if lint or tests fail. Use a concurrency group so overlapping deploys cancel in-progress runs.

---

## 5. Phase 1 — Application Shell

### Goal

Ship the PaperKit chrome: home, navigation, tool cards, theme toggle, footer, privacy link. No complex PDF processing.

### Files to create/change

```text
src/views/HomeView.vue
src/components/common/AppHeader.vue
src/components/common/AppFooter.vue
src/components/common/ThemeToggle.vue
src/composables/useTheme.ts
src/services/storage/localStorage.ts
src/router/index.ts
src/App.vue
```

Optional stub routes for tools that redirect to “Coming soon” **or** empty views — prefer listing only tools that will be implemented next; avoid fake completed tools.

### Public APIs / types

```typescript
interface ToolCard {
  id: string;
  title: string;
  description: string;
  to: string; // hash route path, e.g. '/merge'
  icon?: string;
}
```

Theme persistence key: `paperkit.theme` → `'light' | 'dark' | 'system'`.

### Route table (hash history)

| Path               | View                                     | Phase |
| ------------------ | ---------------------------------------- | ----- |
| `/`                | HomeView                                 | 1     |
| `/merge`           | MergePdfView                             | 4     |
| `/split`           | SplitPdfView                             | 5     |
| `/organize`        | (page ops UI; name in UI “Organize PDF”) | 6     |
| `/pdf-to-image`    | PdfToImageView                           | 7     |
| `/image-to-pdf`    | ImageToPdfView                           | 8     |
| `/inspector`       | PdfInspectorView                         | 9     |
| `/compress`        | CompressPdfView                          | 10    |
| `/privacy`         | PrivacyView                              | 11    |
| `/diff`            | PdfDiffView                              | 13    |
| `/pdf-to-markdown` | PdfToMarkdownView                        | 14    |
| `/ocr`             | OcrView                                  | 15    |

Use `createWebHashHistory(import.meta.env.BASE_URL)`.

### UI flow

```text
PaperKit

Private PDF tools that run entirely in your browser.

Your files never leave your device.

[ Merge PDF ]
[ Split PDF ]
[ Compress PDF ]
[ PDF to Image ]
[ PDF Inspector ]
```

Requirements:

- Responsive desktop/mobile layout
- Clean modern UI (ink/paper tokens)
- Dark/light theme support
- Navigation + tool cards
- Footer with GitHub repo link + Privacy statement link
- Do not implement complex PDF processing yet

### Edge cases & errors

- Unknown routes → redirect home or a simple Not Found view
- Theme preference missing → system preference

### Tests

- Unit: theme read/write helpers
- E2E: home loads; navigate to a stub/tool route via hash URL e.g. `/#/privacy` when available

### Acceptance criteria

- [ ] Home shows PaperKit brand as primary signal
- [ ] Tool cards navigate via hash routes
- [ ] Theme toggle persists across reload
- [ ] Footer links to GitHub + Privacy
- [ ] Responsive layout works on mobile viewport
- [ ] Production build succeeds with `base: '/paperkit/'`

### Out of scope

- File dropzone, PDF.js, any processing

---

## 6. Phase 2 — File Handling Infrastructure

### Goal

Reusable PDF (and later image) intake: drag/drop, picker, validation, list management — never upload.

### Files to create/change

```text
src/components/pdf/PdfDropzone.vue
src/components/common/FileDropzone.vue
src/composables/useFileDrop.ts
src/types/pdf.ts
```

### Public APIs / types

```typescript
interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  lastModified: number;
  /** Optional object URL for previews; must be revoked on remove */
  objectUrl?: string;
}

interface FileValidationOptions {
  acceptMime: string[]; // default ['application/pdf']
  acceptExt: string[]; // default ['.pdf']
  maxBytes: number; // default 100 * 1024 * 1024 (100MB)
  multiple: boolean;
}

type DuplicateKey = string; // `${name}::${size}::${lastModified}`
```

### UI flow

Drag & drop zone + file picker → validated list → remove/clear → loading/error states.

### Edge cases & errors

| Case                 | Behavior                        |
| -------------------- | ------------------------------- |
| Wrong MIME/extension | Reject with clear message       |
| Over max size        | Reject; show limit              |
| Duplicate (same key) | Skip or warn; do not double-add |
| Remove file          | Revoke `objectUrl` if any       |
| Empty drop           | No-op                           |

Error codes: `UNSUPPORTED`, `EMPTY_INPUT` (when used by tools).

### Tests

- Unit: validation accept/reject; duplicate key; size limit
- Component: dropzone emits accepted files only

### Acceptance criteria

- [ ] Drag/drop and picker work
- [ ] MIME + extension + size validation
- [ ] Multiple selection + remove/clear
- [ ] Duplicate detection
- [ ] Loading and error states
- [ ] No network upload of file bytes

### Out of scope

- PDF rendering, merge/split

---

## 7. Phase 3 — PDF Preview System

### Goal

Integrate PDF.js for page thumbnails/preview; foundation for Merge/Split/PageOps.

### Files to create/change

```text
src/components/pdf/PdfPreview.vue
src/components/pdf/PdfPageGrid.vue
src/components/pdf/PdfPageCard.vue
src/composables/usePdf.ts
src/composables/usePageSelection.ts
src/workers/pdfWorker.ts          # optional early; required when main-thread jank appears
```

### Public APIs / types

```typescript
interface PdfPageMeta {
  pageNumber: number; // 1-based
  width: number;
  height: number;
  rotation: number;
}

interface PageSelection {
  selected: Set<number>;
  toggle(page: number): void;
  selectMany(pages: number[]): void;
  clear(): void;
  range: number[]; // sorted selected pages
}

/** Thumbnail target CSS width in px; keep modest for memory */
const THUMBNAIL_WIDTH = 160;
```

PDF.js worker: configure `GlobalWorkerOptions.workerSrc` to the bundled `pdf.worker` asset (Vite-friendly import). Do not load the worker from a third-party CDN that could change privacy posture.

### UI flow

Open PDF → show page grid thumbnails → page numbers → selection → optional zoom on single-page preview.

For large PDFs:

- Do not render every page at full resolution
- Thumbnails only in grid
- Lazy-render pages in a window around the viewport

### Edge cases & errors

| Case                 | Behavior                           |
| -------------------- | ---------------------------------- |
| Corrupt PDF          | `CORRUPT_PDF` user message         |
| Encrypted / password | `ENCRYPTED_PDF`; do not crash      |
| Huge page count      | Lazy window; progress/skeleton     |
| Unmount              | Abort pending renders; revoke URLs |

### Tests

- Unit: selection model
- Component/integration: render first page thumbnail from fixture (if runnable in Vitest/canvas)

### Acceptance criteria

- [ ] Pages render as thumbnails
- [ ] Page numbers visible
- [ ] Loading indicator
- [ ] Selection API usable by later tools
- [ ] Large PDFs do not freeze the tab unreasonably
- [ ] PDF.js worker loads from first-party bundle

### Out of scope

- Merge/split/mutate operations

---

## 8. Phase 4 — Merge PDF

### Goal

Merge multiple PDFs client-side with reorder, preview, progress, and download.

### Files to create/change

```text
src/views/MergePdfView.vue
src/services/pdf/pdfMerge.ts
src/components/pdf/PdfToolbar.vue
src/components/pdf/PdfDownloadButton.vue
src/composables/useProcessing.ts
```

### Public APIs / types

```typescript
interface MergeProgress {
  phase: "read" | "merge" | "done";
  current: number;
  total: number;
}

function mergePdfs(
  files: PdfFile[],
  options?: {
    signal?: AbortSignal;
    onProgress?: (p: MergeProgress) => void;
  },
): Promise<Uint8Array>;
```

Order of `files` array = merge order.

### UI flow

```text
Drop PDF files
  → reorder (1)(2)(3)
  → [ Merge PDF ]
  → Download merged.pdf
```

### Edge cases & errors

| Case                 | Error / behavior                               |
| -------------------- | ---------------------------------------------- |
| < 2 files            | Disable merge or `EMPTY_INPUT`                 |
| Corrupt file         | `CORRUPT_PDF`; identify which file if possible |
| Encrypted            | `ENCRYPTED_PDF`                                |
| Cancel               | `CANCELLED`; abort in-flight work              |
| Different page sizes | Preserve each page’s dimensions (pdf-lib)      |

### Tests

- Merge 2 PDFs
- Merge multiple PDFs
- Different page sizes
- Empty input
- Corrupt PDF fixture expectation

### Acceptance criteria

- [ ] Multiple PDFs, reorder, remove
- [ ] Preview where practical
- [ ] Merge via pdf-lib only in-browser
- [ ] Progress indicator
- [ ] Download result
- [ ] No server communication

### Out of scope

- Split, page delete, compression

---

## 9. Phase 5 — Split PDF

### Goal

Extract selected pages or split every page; ZIP when multiple outputs.

### Files to create/change

```text
src/views/SplitPdfView.vue
src/services/pdf/pdfSplit.ts
```

### Public APIs / types

```typescript
type SplitMode = "extract" | "every-page";

/** Parse "1,3-5,8" → [1,3,4,5,8] (1-based, unique, sorted) */
function parsePageRanges(input: string, pageCount: number): number[];

function extractPages(
  data: Uint8Array,
  pages: number[],
  options?: { signal?: AbortSignal },
): Promise<Uint8Array>;

function splitEveryPage(
  data: Uint8Array,
  options?: {
    signal?: AbortSignal;
    onProgress?: (c: number, t: number) => void;
  },
): Promise<{ name: string; data: Uint8Array }[]>;
```

ZIP naming: `page-001.pdf`, `page-002.pdf`, … or `extract.pdf` for single extract output.

### UI flow

**Extract selected pages**

```text
Pages: [1] [2] [3] [4] [5]
Selected: 2, 4, 5
[ Extract ]
```

**Split every page** → many PDFs → Download ZIP via JSZip.

### Edge cases & errors

| Case                      | Behavior                         |
| ------------------------- | -------------------------------- |
| Empty selection (extract) | `EMPTY_INPUT`                    |
| Out-of-range pages        | Reject parse / clamp with error  |
| Invalid range string      | Clear validation message         |
| Single page “every page”  | One file download (ZIP optional) |

### Tests

- Extract one page / multiple / first / last
- Range parser unit tests
- Invalid selection
- Large document progress path (mocked ok)

### Acceptance criteria

- [ ] Both modes work
- [ ] Range parser correct
- [ ] ZIP for multiple outputs
- [ ] Errors are user-friendly

### Out of scope

- Reorder/rotate/delete UI (Phase 6)

---

## 10. Phase 6 — Page Operations

### Goal

Reusable page manipulation engine + Organize UI: delete, rotate, reorder, duplicate, extract.

### Files to create/change

```text
src/services/pdf/pageOps.ts
src/services/pdf/pdfRotate.ts
src/services/pdf/pdfDeletePages.ts
src/services/pdf/pdfExtractPages.ts
src/views/… Organize view (route `/organize`)
src/components/pdf/PdfPageGrid.vue (enhance)
src/composables/usePageSelection.ts
```

### Public APIs / types

```typescript
interface PageOpDocument {
  bytes: Uint8Array;
}

type RotateDegrees = 90 | 180 | 270;

interface PageOps {
  rotate(pages: number[], degrees: RotateDegrees): Promise<Uint8Array>;
  delete(pages: number[]): Promise<Uint8Array>;
  reorder(order: number[]): Promise<Uint8Array>; // permutation of all pages
  duplicate(pages: number[]): Promise<Uint8Array>;
  extract(pages: number[]): Promise<Uint8Array>;
}
```

Thin service files may wrap `pageOps` for clarity; **do not** duplicate pdf-lib logic in three places.

Drag-reorder contract: grid emits new `order: number[]` (1-based page indices in display order); apply on explicit Save/Apply or live-apply — pick one UX and stick to it (prefer explicit Apply for safety).

### UI flow

```text
┌──────┐
│ PDF  │
│  1   │
│ ↻ 🗑 │
└──────┘
```

- Drag & drop reorder
- Multi-select
- Rotate 90°
- Delete
- Duplicate
- Extract selection

### Edge cases & errors

| Case                        | Behavior                          |
| --------------------------- | --------------------------------- |
| Delete all pages            | Forbid; require ≥1 page remaining |
| Empty selection for op      | `EMPTY_INPUT`                     |
| Invalid reorder permutation | Throw / `UNSUPPORTED`             |

### Tests

- Rotate, delete, reorder, duplicate, extract unit tests on fixtures

### Acceptance criteria

- [ ] Single engine backs all page ops
- [ ] Multi-select + drag reorder
- [ ] Download/export result
- [ ] Responsive UI

### Out of scope

- Compression, OCR, diff

---

## 11. Phase 7 — PDF to Image

### Goal

Render pages to PNG/JPG at selectable DPI; ZIP for multiple pages; release memory aggressively.

### Files to create/change

```text
src/views/PdfToImageView.vue
src/services/pdf/pdfToImage.ts
```

### Public APIs / types

```typescript
type ImageFormat = "png" | "jpg";

interface PdfToImageOptions {
  format: ImageFormat;
  quality?: number; // 0–1 for jpg
  dpi: 72 | 150 | 300;
  pages?: number[]; // default all
  signal?: AbortSignal;
  onProgress?: (current: number, total: number) => void;
}

/** scale = dpi / 72 */
function pdfPagesToImages(
  data: Uint8Array,
  options: PdfToImageOptions,
): Promise<{ pageNumber: number; blob: Blob }[]>;
```

### UI flow

```text
Format: ○ PNG ○ JPG
Quality: [----●----]
Resolution: 72 / 150 / 300 DPI
→ Download (single) or ZIP (multiple)
```

### Edge cases & errors

| Case                  | Behavior                                                |
| --------------------- | ------------------------------------------------------- |
| Huge DPI × page count | Warn; allow cancel; `OUT_OF_MEMORY` if allocation fails |
| JPG quality missing   | Default 0.92                                            |
| After export          | Release canvases / revoke URLs                          |

### Tests

- DPI→scale helper
- Single page PNG blob non-empty
- Multi-page ZIP entry count

### Acceptance criteria

- [ ] PNG and JPG work
- [ ] DPI options work
- [ ] ZIP for N>1
- [ ] Memory released after download where possible

### Out of scope

- Image → PDF (Phase 8)

---

## 12. Phase 8 — Image to PDF

### Goal

Build a PDF from JPG/PNG/WEBP with page size and fit options.

### Files to create/change

```text
src/views/ImageToPdfView.vue
src/services/pdf/imageToPdf.ts
```

### Public APIs / types

```typescript
type PagePreset = "a4" | "letter" | "original";
type Orientation = "portrait" | "landscape";
type FitMode = "contain" | "cover" | "stretch";

interface ImageToPdfOptions {
  preset: PagePreset;
  orientation: Orientation;
  marginPt: number;
  fit: FitMode;
  signal?: AbortSignal;
}

function imagesToPdf(
  images: { name: string; bytes: Uint8Array; mime: string }[],
  options: ImageToPdfOptions,
): Promise<Uint8Array>;
```

**EXIF orientation:** Prefer apply orientation when readable with a small helper; if not reliable cross-browser without a heavy dependency, document in UI: “Some photos may appear rotated; rotate before upload” — do not silently corrupt layout.

### UI flow

```text
Drop images → reorder → options → [ Create PDF ] → download
```

Accept: JPG, PNG, WEBP.

### Edge cases & errors

| Case                          | Behavior                                               |
| ----------------------------- | ------------------------------------------------------ |
| No images                     | `EMPTY_INPUT`                                          |
| Unsupported type              | `UNSUPPORTED`                                          |
| Mixed sizes + original preset | One page per image at image pixel size (pdf-lib units) |

### Tests

- Single PNG → 1-page PDF
- Reorder affects page order
- Margin/fit smoke tests

### Acceptance criteria

- [ ] JPG/PNG/WEBP → PDF
- [ ] A4 / Letter / Original + orientation + margin + fit
- [ ] Reorder works
- [ ] EXIF limitation documented if not fully handled

### Out of scope

- OCR on images

---

## 13. Phase 9 — PDF Inspector

### Goal

Signature feature: show reliable PDF metadata and structure; never invent values.

### Files to create/change

```text
src/views/PdfInspectorView.vue
src/services/pdf/pdfInspector.ts
```

### Public APIs / types

```typescript
type InspectValue<T> = { status: "ok"; value: T } | { status: "unavailable" };

interface PdfInspection {
  file: {
    name: string;
    size: number;
    pages: InspectValue<number>;
    version: InspectValue<string>;
  };
  security: {
    encrypted: InspectValue<boolean>;
    // password presence: only if library can detect without decrypting
  };
  document: {
    title: InspectValue<string>;
    author: InspectValue<string>;
    subject: InspectValue<string>;
    creator: InspectValue<string>;
    producer: InspectValue<string>;
  };
  content: {
    fonts: InspectValue<string[]>;
    images: InspectValue<number>;
    annotations: InspectValue<number>;
    forms: InspectValue<boolean>;
    embeddedFiles: InspectValue<number>;
  };
  pages: InspectValue<{ pageNumber: number; width: number; height: number }[]>;
}
```

UI shows **Not available** when `status === 'unavailable'`. Never guess.

### UI flow

```text
PDF Inspector
File / Security / Document / Content sections
```

### Edge cases & errors

| Case           | Behavior                                                                              |
| -------------- | ------------------------------------------------------------------------------------- |
| Encrypted      | Show encrypted=yes; other fields unavailable as needed; `ENCRYPTED_PDF` if open fails |
| Partial parse  | Fill what is reliable only                                                            |
| Library limits | Mark unavailable — do not fake fonts/images counts                                    |

### Tests

- Fixture with known page count/metadata
- Encrypted fixture → clear UX
- Unavailable fields render “Not available”

### Acceptance criteria

- [ ] Reliable fields display correctly
- [ ] No fabricated data
- [ ] Encrypted UX is clear
- [ ] Page dimensions listed when available

### Out of scope

- Editing metadata

---

## 14. Phase 10 — Compress PDF

### Goal

Best-effort client-side compression with honest UX — no promised ratios.

### Files to create/change

```text
src/views/CompressPdfView.vue
src/services/pdf/pdfCompress.ts
src/workers/compressWorker.ts
```

### Public APIs / types

```typescript
type CompressLevel = "low" | "medium" | "high";

interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  resultSize: number;
  reductionRatio: number; // (original - result) / original; may be ≤ 0
  usedOriginal: boolean; // true if result ≥ original and original kept
  warning?: string;
}

function compressPdf(
  data: Uint8Array,
  level: CompressLevel,
  options?: { signal?: AbortSignal; onProgress?: (m: string) => void },
): Promise<CompressResult>;
```

**Strategy ladder (ordered):**

1. Strip unnecessary metadata where safe
2. Downsample embedded images per level
3. Re-encode images where safe (e.g. JPEG quality by level)
4. Optimize objects only if supported without breaking the file

If result ≥ original size → keep original bytes, set `usedOriginal: true`, warn user.

### UI flow

```text
○ Low ○ Medium ○ High
Original: 8.4 MB → Processing… → Result: 4.1 MB (+ reduction %)
```

### Edge cases & errors

| Case                     | Behavior                                                       |
| ------------------------ | -------------------------------------------------------------- |
| Already minimal PDF      | Warn; keep original                                            |
| Image-heavy vs text-only | Text-only may barely shrink — say so                           |
| Failure mid-way          | `CORRUPT_PDF` / generic failure; do not download partial trash |

### Tests

- Result structure fields
- `usedOriginal` when artificially larger
- Level parameter accepted

### Acceptance criteria

- [ ] Three levels exposed
- [ ] Sizes + reduction % shown
- [ ] No specific ratio promised in copy
- [ ] Larger result → keep original + warn
- [ ] Heavy work prefers worker

### Out of scope

- Ghostscript-class optimization claims
- Server-side compress APIs

---

## 15. Phase 11 — Privacy Architecture

### Goal

Dedicated Privacy page + technical audit that PaperKit never uploads PDF content.

### Files to create/change

```text
src/views/PrivacyView.vue
README.md (Privacy section)
```

### Public APIs / types

N/A. Audit checklist (manual + grep in CI optional):

- [ ] No upload API / FormData to remote for PDFs
- [ ] No analytics that send document content or filenames unnecessarily
- [ ] No server-side PDF processing
- [ ] No external PDF processing APIs
- [ ] `localStorage` only for prefs (theme), never PDF bytes

### UI flow

```text
Your files are processed locally.
PDF files are not uploaded to our server.
Processing happens inside your browser.
```

Link from footer (Phase 1) must resolve here.

### Edge cases & errors

If a future analytics SDK is proposed, reject unless it cannot receive file contents — document in this page.

### Tests

- E2E: `/#/privacy` loads key statements
- Optional: unit test that storage helpers refuse ArrayBuffer/Blob keys

### Acceptance criteria

- [ ] Privacy page live
- [ ] Copy matches technical reality
- [ ] Audit checklist satisfied
- [ ] README Privacy section mirrors page

### Out of scope

- Legal counsel review (keep clear plain language)

---

## 16. Phase 12 — PWA

### Goal

Installable offline app shell; PDF tools work offline when assets are cached. Never cache user PDFs in the service worker.

### Files to create/change

```text
vite.config.ts          # vite-plugin-pwa
public/icons/*
src/views or public offline fallback
manifest (generated)
```

### Public APIs / types

Manifest name/short_name: **PaperKit**.

Precache: app shell (JS/CSS/HTML/icons/fonts).  
Do **not** precache or runtime-cache user document blobs.

### UI flow

Install prompt where browser supports; offline fallback page if navigation fails while offline.

### Edge cases & errors

| Case                | Behavior                                                         |
| ------------------- | ---------------------------------------------------------------- |
| First visit offline | Limited; show offline page                                       |
| OCR lang packs      | Fetch on demand when online; if offline and missing, clear error |

### Tests

- E2E smoke: service worker registers in production preview if feasible
- Manual: installability on Chromium

### Acceptance criteria

- [ ] Web app manifest
- [ ] Service worker
- [ ] Offline shell
- [ ] Installable + icons
- [ ] User PDFs not stored by SW
- [ ] Processing works offline when APIs + cached assets allow

### Out of scope

- Background sync of documents
- Push notifications

---

## 17. Phase 13 — PDF Diff

### Goal

After core tools are stable: text diff and visual page compare for developers/business users.

### Files to create/change

```text
src/views/PdfDiffView.vue
src/services/pdf/pdfDiff.ts
```

### Public APIs / types

```typescript
type DiffMode = "text" | "visual";

interface TextDiffResult {
  pageNumber: number;
  hunks: { left: string; right: string }[];
}

function extractPageText(data: Uint8Array, pageNumber: number): Promise<string>;
function visualComparePages(
  a: Uint8Array,
  b: Uint8Array,
  pageNumber: number,
): Promise<{ leftUrl: string; rightUrl: string }>; // revoke later
```

### UI flow

**Text Diff** — side-by-side line/page text.  
**Visual Diff** — same page rendered from A and B; Previous/Next page sync.

Large-doc warning: comparing very large PDFs may be slow; process page-at-a-time.

### Edge cases & errors

| Case                  | Behavior                                     |
| --------------------- | -------------------------------------------- |
| Different page counts | Allow nav up to min; note mismatch           |
| Scanned/no text       | Text mode empty → suggest visual / OCR later |
| Memory                | Revoke object URLs on page change            |

### Tests

- Text extract on fixture
- Page count mismatch handling

### Acceptance criteria

- [ ] Text and visual modes
- [ ] Synced page navigation
- [ ] Large-doc warning
- [ ] Marketed as local/dev-friendly, privacy-safe

### Out of scope

- Pixel-diff heatmap unless trivial; side-by-side is enough for v1

---

## 18. Phase 14 — PDF → Markdown

### Goal

Best-effort structured extraction; clearly labeled imperfect.

### Files to create/change

```text
src/views/PdfToMarkdownView.vue
src/services/pdf/pdfToMarkdown.ts
```

### Public APIs / types

```typescript
interface MarkdownConversion {
  markdown: string;
  warnings: string[];
}

function pdfToMarkdown(
  data: Uint8Array,
  options?: { signal?: AbortSignal },
): Promise<MarkdownConversion>;
```

Pipeline:

```text
PDF → PDF.js → text extraction → layout heuristics → Markdown
```

### UI flow

Banner:

> Best-effort conversion. Layout and tables may be imperfect.

Download `.md` or copy to clipboard.

### Edge cases & errors

| Case                 | Behavior                       |
| -------------------- | ------------------------------ |
| Scanned PDF          | Warn; suggest OCR phase        |
| Complex multi-column | Heuristic only; warning pushed |

### Tests

- Simple text PDF → contains expected headings/paragraphs loosely
- Empty text → warning

### Acceptance criteria

- [ ] Pipeline implemented
- [ ] Best-effort banner visible
- [ ] No claim of perfect reconstruction
- [ ] Download/copy works

### Out of scope

- Perfect table reconstruction SLA

---

## 19. Phase 15 — OCR

### Goal

Only after core is stable: Tesseract.js OCR with on-demand languages; searchable PDF only if reliable, else text download.

### Files to create/change

```text
src/views/OcrView.vue
src/services/pdf/pdfOcr.ts
src/workers/ocrWorker.ts
```

### Public APIs / types

```typescript
type OcrLang = "eng" | "ind" | "jpn" | "chi_sim";

interface OcrOptions {
  lang: OcrLang;
  signal?: AbortSignal;
  onProgress?: (p: number) => void; // 0–1
}

interface OcrResult {
  text: string;
  /** Present only if searchable PDF generation is reliable */
  searchablePdf?: Uint8Array;
}
```

Do not load all language models by default — fetch on demand.

### UI flow

Select language → progress → show text → download `.txt` and searchable PDF if available.

### Edge cases & errors

| Case                      | Behavior                            |
| ------------------------- | ----------------------------------- |
| Lang pack offline missing | Clear error                         |
| Long doc                  | Page-at-a-time progress             |
| Searchable PDF unreliable | Omit; ship text only; explain in UI |

### Tests

- Progress callback invoked (mock worker)
- Lang default eng
- Do not bundle all langs in main chunk (build assert / manual check)

### Acceptance criteria

- [ ] Image/scanned PDF OCR path
- [ ] Language selection eng/id/ja/zh
- [ ] Progress indicator
- [ ] On-demand lang data
- [ ] Worker used for OCR
- [ ] Honest output options

### Out of scope

- Training custom models
- Guaranteeing perfect searchable PDFs

---

## 20. Performance Requirements

Avoid freezing the browser.

### When to use Web Workers

| Task                      | Worker                                                            |
| ------------------------- | ----------------------------------------------------------------- |
| Large merge/split/pageOps | Prefer `pdfWorker` when payloads are large or UI janks            |
| Compression               | `compressWorker`                                                  |
| OCR                       | `ocrWorker`                                                       |
| PDF.js render             | PDF.js own worker; thumbnail queue on main with concurrency limit |

### Patterns

- Prefer **transferables** (`postMessage` with `ArrayBuffer`) to avoid structured-clone copies
- Show progress for long jobs
- Avoid unnecessary `Uint8Array` copies
- **ObjectURL lifecycle:** create on demand; revoke on remove, route leave, and after download
- Do not keep both original and processed documents longer than needed
- `useProcessing` exposes:

```typescript
interface ProcessingHandle {
  isProcessing: Ref<boolean>;
  progress: Ref<number | null>;
  error: Ref<PdfAppError | null>;
  cancel: () => void; // aborts via AbortSignal
}
```

Cancellation must set error code `CANCELLED` or clear state without a scary error — pick one UX (prefer calm “Cancelled”).

---

## 21. Error Handling

Shared module: `src/services/errors/pdfErrors.ts`.

```typescript
type PdfErrorCode =
  | "CORRUPT_PDF"
  | "ENCRYPTED_PDF"
  | "UNSUPPORTED"
  | "EMPTY_INPUT"
  | "CANCELLED"
  | "OUT_OF_MEMORY";

interface PdfAppError {
  code: PdfErrorCode;
  message: string; // user-facing
  cause?: unknown; // dev only
}
```

User copy examples:

| Code            | Message                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| `CORRUPT_PDF`   | Unable to open PDF. The file may be corrupted or unsupported.                       |
| `ENCRYPTED_PDF` | This PDF is encrypted or password-protected and cannot be processed in the browser. |
| `UNSUPPORTED`   | This file type or operation is not supported.                                       |
| `EMPTY_INPUT`   | Add at least one valid file (or select pages) to continue.                          |
| `CANCELLED`     | Cancelled.                                                                          |
| `OUT_OF_MEMORY` | The browser ran out of memory. Try fewer pages or a lower resolution.               |

Never expose raw stack traces to users. Log `cause` only in development.

Every tool must render errors via `ErrorAlert.vue`.

---

## 22. Testing Strategy

### Fixtures (`tests/fixtures/`)

```text
pdf/
  two-page.pdf
  multi-size-pages.pdf
  encrypted.pdf          # expect ENCRYPTED_PDF / inspect-only
  simple-text.pdf        # for markdown / text diff
images/
  sample.png
  sample.jpg
```

Generate fixtures in Phase 0/2 with a small script or commit minimal binary fixtures.

### Unit tests

- PDF merge, split, page extraction/deletion/rotation
- image conversion helpers
- metadata inspection
- page range parser
- validation / duplicate keys
- error mapping

### E2E tests (Playwright)

```text
Open application (/#/ or base+/index.html#/)
  → Open Merge PDF (/#/merge)
  → Upload fixture PDFs
  → Merge
  → Download result (assert download event)
```

Also:

- Hash router deep link works under `/paperkit/` base
- Mobile viewport smoke
- Offline PWA shell (Phase 12+)
- Privacy page copy

### GitHub Pages routing

Assert paths like `https://example.github.io/paperkit/#/merge` pattern in docs and e2e baseURL config.

---

## 23. GitHub Actions

```text
.github/workflows/deploy.yml
```

Pipeline:

```text
push main
  → npm ci
  → npm run lint
  → npm run test
  → npm run build
  → deploy GitHub Pages (dist artifact)
```

Rules:

- Fail deploy if lint or tests fail
- Pin Node LTS
- Concurrency group `pages` with `cancel-in-progress: true`
- Permissions: `pages: write`, `id-token: write` as required by Actions Pages

Optional later: `test:e2e` in CI with Playwright browsers cached (may be Phase 4+ once stable).

---

## 24. Security Rules

Never:

- Upload PDF files to a server
- Send PDF content to third-party APIs
- Store PDF contents in `localStorage` / `indexedDB` unless a future explicit offline-draft feature is designed (MVP: **do not**)
- Log document contents
- Send filenames unnecessarily to external services
- Load PDF.js worker from an untrusted CDN

Use browser memory for processing.

Clear references after processing/download.

If analytics is ever added: file contents and filenames must never be sent.

---

## 25. Browser Support & Device Limits

Supported: latest **two** major versions of Chrome, Firefox, Safari, Edge.

Notes:

- Mobile browsers have tighter memory limits — warn on large files / high DPI
- Safari quirks around canvas and download; verify PDF download UX
- Web Workers and `OffscreenCanvas` availability may vary; feature-detect and fall back

---

## 26. Documentation

README must include:

- Project description (PaperKit)
- Features
- Screenshots (when available)
- Architecture
- Tech stack
- Local development
- Build
- GitHub Pages deployment (`base`, hash routes)
- Privacy architecture
- Supported browsers
- Limitations (§31)
- Contributing
- License

Privacy section:

```text
Privacy

All PDF processing happens locally in your browser.
Your files are never uploaded to a server.
```

Update the README feature list when each phase completes.

---

## 27. Development Order

Do NOT implement everything at once.

```text
Phase 0  Project setup
   ↓
Phase 1  Application shell
   ↓
Phase 2  File handling
   ↓
Phase 3  PDF preview
   ↓
Phase 4  Merge
   ↓
Phase 5  Split
   ↓
Phase 6  Page operations
   ↓
Phase 7  PDF → Image
   ↓
Phase 8  Image → PDF
   ↓
Phase 9  PDF Inspector
   ↓
Phase 10 Compression
   ↓
Phase 11 Privacy
   ↓
Phase 12 PWA
   ↓
Phase 13 PDF Diff
   ↓
Phase 14 PDF → Markdown
   ↓
Phase 15 OCR
```

Prefer **one phase per PR-sized chunk**.

---

## 28. Non-Goals (MVP)

Do not add in MVP scope:

- New tools beyond the phases above (watermark, unlock/encrypt, sign, batch queues as a product)
- Backend, accounts, cloud sync
- Full i18n framework (OCR language packs only in Phase 15)
- Pinia/global store (composables first)

---

## 29. Definition of Done

A phase is complete only when:

1. Feature works.
2. UI is responsive.
3. Errors are handled with shared error codes.
4. Unit tests exist where applicable.
5. No backend is required.
6. No PDF data leaves the browser.
7. Production build succeeds.
8. Existing features still work.
9. README is updated where appropriate.
10. Hash routes work with GitHub Pages `base: '/paperkit/'`.
11. No new backend or upload dependencies introduced.

Do not move to the next phase if the current phase breaks existing functionality.

---

## 30. Agent Working Rules

The coding agent should:

1. Inspect the existing project before modifying anything.
2. Make small, logically separated changes (one phase per chunk).
3. Avoid unnecessary rewrites.
4. Prefer existing dependencies over adding new dependencies.
5. Keep business logic separate from UI.
6. Write tests for core PDF operations.
7. Run tests after each major change.
8. Run production build before completing a phase.
9. Never introduce a backend.
10. Never upload PDF contents.
11. Never silently ignore processing errors.
12. Document important architectural decisions.
13. Update README features when a phase completes.

When encountering a technical limitation, do not create a fake implementation.

Instead:

```text
1. Explain the limitation.
2. Find a browser-compatible alternative.
3. Implement the best reliable solution.
4. Clearly communicate limitations in the UI.
```

---

## 31. Limitations Appendix

Be honest in UI and README:

| Area            | Limitation                                                           |
| --------------- | -------------------------------------------------------------------- |
| Compression     | Not Ghostscript-class; some PDFs barely shrink                       |
| Markdown        | Best-effort; tables/columns imperfect                                |
| OCR             | Quality depends on scan/lang pack; searchable PDF may be unavailable |
| Encrypted PDFs  | Often blocked or inspect-only with a clear message                   |
| Very large PDFs | May hit mobile memory limits                                         |
| EXIF photos     | Orientation may need manual fix if auto-orient is incomplete         |

---

## 32. MVP Success Criteria

The first public release should contain:

- Merge PDF
- Split PDF
- Delete / reorder / rotate / extract / duplicate pages
- PDF → Image
- Image → PDF
- PDF Inspector
- Basic compression
- Responsive UI
- PWA
- GitHub Pages deployment
- Privacy-first architecture (Privacy page + no uploads)

The MVP must work completely without a backend.

Post-MVP in this plan: PDF Diff, PDF → Markdown, OCR (Phases 13–15).

---

## 33. Product Positioning

Do not position PaperKit merely as:

> Another PDF converter.

Position it as:

> **PaperKit — a privacy-first PDF toolkit that runs entirely in your browser.**

Secondary:

> No uploads. No server. No account required.

Future developer-oriented line:

> PDF tools for developers — inspect, compare, transform, and process PDFs locally.
