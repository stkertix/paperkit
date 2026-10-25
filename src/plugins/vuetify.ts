import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'paperkitLight',
    themes: {
      paperkitLight: {
        dark: false,
        colors: {
          background: '#f7f5f2',
          surface: '#ffffff',
          primary: '#0d6e6e',
          secondary: '#5c6570',
          error: '#b42318',
          info: '#0d6e6e',
          success: '#0d6e6e',
          warning: '#b54708',
        },
      },
      paperkitDark: {
        dark: true,
        colors: {
          background: '#12161a',
          surface: '#1a1f24',
          primary: '#3d9a9a',
          secondary: '#9aa3ad',
          error: '#f97066',
          info: '#3d9a9a',
          success: '#3d9a9a',
          warning: '#fdb022',
        },
      },
    },
  },
})
