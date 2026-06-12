import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BootstrapSearchBundle',
      formats: ['es', 'iife', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'bootstrap-search.es.js';
        if (format === 'iife') return 'bootstrap-search.js';
        return 'bootstrap-search.umd.cjs';
      }
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src'],
      rollupTypes: true
    }),
    {
      name: 'bootstrap-search-cdn-aliases',
      generateBundle(_, bundle) {
        const iife = bundle['bootstrap-search.js'];
        if (iife?.type === 'chunk') {
          this.emitFile({
            type: 'asset',
            fileName: 'bootstrap-search.min.js',
            source: iife.code
          });
          this.emitFile({
            type: 'asset',
            fileName: 'bootstrap-search.iife.js',
            source: iife.code
          });
        }
      }
    }
  ]
});
