import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../admin/custom',
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, 'src/index.tsx'),
            output: {
                entryFileNames: 'index.js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
    },
    base: './',
});
