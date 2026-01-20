import type { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

export function versionPlugin(): Plugin {
  return {
    name: 'version-plugin',
    closeBundle() {
      const version = {
        buildTime: Date.now(),
        version: process.env.npm_package_version || '1.0.0'
      };

      const versionPath = resolve(__dirname, 'dist', 'version.json');
      writeFileSync(versionPath, JSON.stringify(version, null, 2));
      console.log('Version file generated:', version);
    }
  };
}
