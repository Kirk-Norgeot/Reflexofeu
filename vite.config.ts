import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { versionPlugin } from './vite-plugin-version';

function copyHtaccessPlugin() {
  return {
    name: 'copy-htaccess',
    closeBundle() {
      const src = path.resolve(__dirname, 'public/.htaccess');
      const dest = path.resolve(__dirname, 'dist/.htaccess');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('.htaccess copied to dist/');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), versionPlugin(), copyHtaccessPlugin()],
  // GitHub Pages sert le site sous /<repo>/ (ex: /Reflexofeu/)
  // Si tu renommes le repo, adapte cette valeur.
  base: '/Reflexofeu/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
    },
  },
  server: {
    port: 3000,
  },
});
