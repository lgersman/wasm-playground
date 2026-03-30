import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import ptyPlugin from './vite-plugin-pty';

export default defineConfig({
  plugins: [react(), ptyPlugin()],
});
