# Docker Build Optimization Guide for PLT Retail Store

## Problem Overview

The PLT Retail Store frontend is a large-scale React application with:
- **4,753+ modules** being bundled
- **43,000+ lines of code** across 182 source files
- Complex dependencies including React, Ant Design, charts, state management, and more

This resulted in **SIGKILL errors** during Docker builds due to memory exhaustion during the Vite bundling phase.

## Root Cause Analysis

### Memory Exhaustion Pattern
1. ✅ **Module transformation phase** completes successfully (4,753 modules)
2. ❌ **Bundling/minification phase** fails with SIGKILL
3. **Reason**: Process terminated by Docker/Linux OOM (Out of Memory) killer

### Why 4GB Was Insufficient
- Vite/Rollup loads entire module graph into memory
- Terser minification creates additional memory pressure
- Large dependency trees (React, Ant Design, Charts) multiply memory usage
- Build process peaks can be 2-3x the base memory requirement

## Implemented Solutions

### 1. Vite Configuration Optimization (`vite.config.js`)

#### A. Manual Chunking Strategy
```javascript
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    // Split by logical groups to reduce individual chunk size
    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
      return 'vendor-react';
    }
    if (id.includes('antd') || id.includes('@ant-design')) {
      return 'vendor-antd';
    }
    // ... more chunks
  }
}
```

**Benefits:**
- Reduces peak memory usage during bundling
- Parallel processing of smaller chunks
- Better browser caching strategy
- Faster incremental builds

#### B. Terser Optimization
```javascript
terserOptions: {
  compress: {
    passes: 1,  // Single pass reduces memory usage
    drop_console: true,
    drop_debugger: true,
  }
}
```

**Benefits:**
- Reduces minification memory overhead
- Removes debug code automatically
- Faster compression with single pass

#### C. Build Performance Settings
```javascript
sourcemap: false,              // Saves ~30-40% memory
reportCompressedSize: false,   // Speeds up build
cssCodeSplit: true,            // Splits CSS into chunks
chunkSizeWarningLimit: 1000,   // Appropriate for large apps
```

### 2. Dockerfile Optimization

#### A. Increased Memory Allocation
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=512"
```

**Memory Settings Explained:**
- `--max-old-space-size=8192`: 8GB heap (doubled from 4GB)
  - Sufficient for 4,753+ modules
  - Headroom for future growth
- `--max-semi-space-size=512`: 512MB young generation
  - Optimizes garbage collection for large builds
  - Reduces GC pauses during bundling

#### B. Clean Build Process
```dockerfile
RUN npm ci && npm cache clean --force
```

**Benefits:**
- Clean dependency installation
- Removes npm cache artifacts
- Predictable build environment

### 3. Docker Compose Configuration

#### A. Build-Time Resources
```yaml
build:
  shm_size: '2gb'  # Shared memory for build process
```

**Purpose:**
- Provides shared memory for concurrent operations
- Prevents /dev/shm exhaustion during parallel builds

#### B. Runtime Resource Limits
```yaml
mem_limit: 512m        # Maximum runtime memory
mem_reservation: 256m  # Guaranteed memory
```

**Benefits:**
- Production container runs efficiently
- Build requires more, runtime requires less
- Prevents runaway memory usage

## Memory Requirements Summary

| Phase | Memory Required | Notes |
|-------|----------------|-------|
| **Dependency Installation** | ~1-2 GB | npm ci with 50+ packages |
| **Module Transformation** | ~2-3 GB | Vite/Rollup processing 4,753 modules |
| **Bundling & Minification** | ~4-6 GB | Peak memory usage |
| **Production Runtime** | ~256-512 MB | Nginx serving static files |

**Recommended Build Host:** 
- Minimum: 12 GB RAM
- Recommended: 16 GB RAM (for safe margin)

## Build Performance Optimization

### Expected Build Times
- **Development mode**: 5-10 seconds (HMR)
- **Production build**: 2-3 minutes (optimized)
- **Cold build** (no cache): 3-4 minutes

### Optimization Checklist
- ✅ Use `npm ci` instead of `npm install`
- ✅ Enable Docker BuildKit for better caching
- ✅ Use multi-stage builds (build → production)
- ✅ Minimize layers in Dockerfile
- ✅ Leverage build cache where possible

## Monitoring and Validation

### During Build
```bash
# Monitor memory usage during Docker build
docker stats

# Check build logs for memory warnings
docker compose build --no-cache 2>&1 | tee build.log
```

### Build Success Indicators
1. ✅ All 4,753 modules transformed
2. ✅ Assets generated in `/dist` directory
3. ✅ No SIGKILL or OOM errors
4. ✅ Build completes in 2-4 minutes

### Troubleshooting

#### If Build Still Fails
1. **Check available memory**: `free -h`
2. **Increase swap space** (if RAM < 16GB)
3. **Use `NODE_OPTIONS="--max-old-space-size=10240"` for 10GB
4. **Enable BuildKit**: `DOCKER_BUILDKIT=1 docker compose build`
5. **Build without cache**: `docker compose build --no-cache`

#### Memory Profiling
```bash
# Profile Node.js memory during build
NODE_OPTIONS="--max-old-space-size=8192 --prof" npm run build

# Analyze profile
node --prof-process isolate-*.log > processed.txt
```

## CI/CD Recommendations

### GitHub Actions / GitLab CI
```yaml
# Increase runner resources for builds
runs-on: ubuntu-latest-4-cores  # 16GB RAM recommended

env:
  NODE_OPTIONS: "--max-old-space-size=8192"
```

### Docker Build Command
```bash
# Recommended build command
DOCKER_BUILDKIT=1 docker compose build --no-cache --parallel

# With resource monitoring
docker system prune -f && \
free -h && \
docker compose build && \
docker compose up -d
```

## Best Practices for Large-Scale Applications

### 1. Code Splitting
- ✅ Implement route-based code splitting
- ✅ Lazy load heavy components
- ✅ Use dynamic imports for large libraries

### 2. Dependency Management
- Review and remove unused dependencies
- Use tree-shaking friendly imports
- Consider lighter alternatives for heavy libraries

### 3. Build Optimization
- Enable production mode optimizations
- Disable source maps in production
- Use CDN for common libraries (optional)

### 4. Monitoring
- Track bundle sizes over time
- Set up bundle size alerts
- Monitor build times in CI/CD

## Scaling Considerations

### When to Increase Memory Further
- Adding 1,000+ more modules: +2GB
- Adding heavy charting libraries: +1-2GB
- Complex SSR/SSG setups: +2-4GB

### Alternative Approaches
1. **Build Server**: Dedicated build machine with 32GB+ RAM
2. **Cloud Builds**: Use AWS/GCP/Azure with auto-scaling
3. **Build Cache**: Implement distributed build cache
4. **Micro-frontends**: Split into smaller, independent apps

## Validation Checklist

After implementing optimizations:
- [ ] Build completes without SIGKILL
- [ ] Build time: 2-4 minutes
- [ ] Dist folder size: Reasonable (<10MB per chunk)
- [ ] No console warnings about chunk sizes
- [ ] Production deployment works correctly
- [ ] Browser loads app without errors

## References

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Docker Memory Limits](https://docs.docker.com/config/containers/resource_constraints/)
- [Rollup Manual Chunks](https://rollupjs.org/guide/en/#outputmanualchunks)

## Support

If builds continue to fail:
1. Check system logs: `dmesg | grep -i kill`
2. Review Docker logs: `docker compose logs frontend`
3. Verify memory availability: `free -h`
4. Consider increasing to 10-12GB heap size

---

**Last Updated**: 2024
**Maintainer**: PLT Retail Store Team
