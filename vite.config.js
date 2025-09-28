export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,              // ✅ แนะนำเสริม
    proxy: {
      '/api':    { target: 'http://localhost:3001', changeOrigin: true },
      '/images': { target: 'http://localhost:3001', changeOrigin: true },
    }
  }
})
