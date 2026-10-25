import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/merge', name: 'merge', component: () => import('@/views/MergePdfView.vue') },
    { path: '/split', name: 'split', component: () => import('@/views/SplitPdfView.vue') },
    { path: '/organize', name: 'organize', component: () => import('@/views/OrganizePdfView.vue') },
    {
      path: '/pdf-to-image',
      name: 'pdf-to-image',
      component: () => import('@/views/PdfToImageView.vue'),
    },
    {
      path: '/image-to-pdf',
      name: 'image-to-pdf',
      component: () => import('@/views/ImageToPdfView.vue'),
    },
    { path: '/sign', name: 'sign', component: () => import('@/views/SignPdfView.vue') },
    {
      path: '/inspector',
      name: 'inspector',
      component: () => import('@/views/PdfInspectorView.vue'),
    },
    { path: '/compress', name: 'compress', component: () => import('@/views/CompressPdfView.vue') },
    { path: '/diff', name: 'diff', component: () => import('@/views/PdfDiffView.vue') },
    {
      path: '/pdf-to-markdown',
      name: 'pdf-to-markdown',
      component: () => import('@/views/PdfToMarkdownView.vue'),
    },
    { path: '/ocr', name: 'ocr', component: () => import('@/views/OcrView.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('@/views/PrivacyView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
