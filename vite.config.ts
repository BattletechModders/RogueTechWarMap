import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: mode === 'development' ? '/' : env.VITE_BASE_URL,
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/konva') || id.includes('/react-konva')) {
              return 'vendor-konva';
            }
            if (id.includes('/@material-tailwind/')) {
              return 'vendor-material';
            }
            if (id.includes('/react-select') || id.includes('/lucide-react')) {
              return 'vendor-ui';
            }
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router')
            ) {
              return 'vendor-core';
            }
          },
        },
      },
    },
  };
});
