import { presetRemToPx } from '@unocss/preset-rem-to-px'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { presetScrollbar } from 'unocss-preset-scrollbar'

export default defineConfig({
  presets: [
    /* Core Presets */
    presetWind3(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        noto: ['Noto Sans', 'Noto Sans SC', 'Noto Sans JP'],
      },
    }),

    /* Community Presets */
    presetRemToPx(),
    presetScrollbar(),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  preflights: [
    {
      getCSS: () => `
        html,
        body {
          @apply font-noto;
        }
      `,
    },
  ],
})
