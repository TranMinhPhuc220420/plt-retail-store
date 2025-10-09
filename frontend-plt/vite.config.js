import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    // Increase chunk size warning limit to 1000kb for large apps
    chunkSizeWarningLimit: 1000,
    
    // Optimize output with manual chunking strategy
    rollupOptions: {
      output: {
        // Manual chunk splitting for better code splitting and reduced memory usage
        manualChunks: (id) => {
          // Vendor chunks - separate large dependencies
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Ant Design and charts - heavy UI library
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd';
            }
            // State management
            if (id.includes('zustand') || id.includes('@reduxjs')) {
              return 'vendor-state';
            }
            // Utilities and other libraries
            if (id.includes('axios') || id.includes('moment') || id.includes('xlsx') || id.includes('firebase')) {
              return 'vendor-utils';
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // Everything else
            return 'vendor-other';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Minification settings optimized for memory
    minify: 'terser',
    terserOptions: {
      compress: {
        // Reduce memory usage during compression
        passes: 1,
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    
    // Source map configuration
    sourcemap: false, // Disable source maps in production to save memory
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed size (can be disabled to speed up build)
    reportCompressedSize: false,
  },
})