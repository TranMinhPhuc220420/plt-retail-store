# Quick Troubleshooting Guide - Docker Build Issues

## Common Build Failures and Solutions

### 1. SIGKILL / OOM (Out of Memory) Error

**Symptoms:**
- Build process killed unexpectedly
- Error message: "Killed" or exit code 137
- Logs show: "The command '/bin/sh -c npm run build' returned a non-zero code: 137"

**Immediate Solutions:**
```bash
# Check system memory
free -h

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory → Set to 12-16GB

# Increase Node.js heap size (already configured to 8GB)
# See frontend-plt/Dockerfile line 16-17

# Use the optimized build script
./build-production.sh
```

**Root Cause:** Large-scale application (4,753+ modules) requires more memory during bundling.

---

### 2. Build Hangs or Timeout

**Symptoms:**
- Build appears to freeze at "Building for production..."
- No progress for 5+ minutes

**Solutions:**
```bash
# Kill stuck build
docker compose down --remove-orphans

# Clean Docker cache
docker system prune -af

# Rebuild with progress output
docker compose build --no-cache --progress=plain

# Enable BuildKit for better performance
DOCKER_BUILDKIT=1 docker compose build --no-cache
```

---

### 3. Chunk Size Warnings

**Symptoms:**
- Warning: "Some chunks are larger than 500kb"
- Build completes but with warnings

**Status:** ✅ **RESOLVED** 
- Vite config now uses manual chunking
- Chunk size limit increased to 1000kb
- Large libraries split into separate chunks

---

### 4. npm ci Failures

**Symptoms:**
- Error during `npm ci` command
- "package-lock.json out of sync"

**Solutions:**
```bash
# Regenerate package-lock.json
cd frontend-plt
npm install
git add package-lock.json
git commit -m "Update package-lock.json"

# Or use npm install in Dockerfile instead
RUN npm install && npm cache clean --force
```

---

### 5. Disk Space Issues

**Symptoms:**
- "No space left on device"
- Build fails with disk write errors

**Solutions:**
```bash
# Check disk space
df -h

# Clean Docker system
docker system prune -af --volumes

# Remove old images
docker image prune -af

# Remove unused volumes
docker volume prune -f
```

---

## Resource Requirements Checklist

### Minimum Requirements
- ❌ **RAM:** 8GB → Build will likely fail
- ✅ **RAM:** 12GB → Should work with optimizations
- ✅ **RAM:** 16GB+ → Recommended for reliable builds

### Docker Desktop Settings
- **Memory:** 12-16GB (Settings → Resources)
- **CPU:** 4+ cores recommended
- **Disk:** 20GB+ free space

---

## Quick Command Reference

### Check System Resources
```bash
# Linux/Mac
free -h
df -h
docker system df

# Windows
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize
wmic logicaldisk get freespace
```

### Build Commands
```bash
# Recommended: Use build script
./build-production.sh

# Manual build with optimizations
DOCKER_BUILDKIT=1 docker compose build --no-cache

# Build with monitoring
docker stats &
docker compose build --no-cache
```

### Clean and Rebuild
```bash
# Full cleanup
docker compose down --rmi all --volumes
docker system prune -af
docker volume prune -f

# Rebuild
./build-production.sh
```

### View Logs
```bash
# Frontend build logs
docker compose logs frontend

# All services
docker compose logs

# Follow logs in real-time
docker compose logs -f frontend
```

---

## Memory Profiling

### Check if OOM Killer was triggered
```bash
# Linux
dmesg | grep -i kill
dmesg | grep -i "out of memory"

# Docker logs
docker inspect $(docker ps -aq) --format='{{.State.OOMKilled}}'
```

### Monitor Build Process
```bash
# Terminal 1: Start build
docker compose build --no-cache

# Terminal 2: Monitor resources
watch -n 1 'docker stats --no-stream'
```

---

## Performance Tips

### Speed Up Builds
1. ✅ Enable BuildKit (already configured)
2. ✅ Use npm ci instead of npm install
3. ✅ Disable source maps in production
4. ✅ Use manual chunking (implemented)
5. Consider: Use build cache layers

### Reduce Memory Usage
1. ✅ Split vendor chunks (implemented)
2. ✅ Single-pass terser (implemented)
3. ✅ Disable reportCompressedSize (implemented)
4. Consider: Build on dedicated server
5. Consider: Use SWC instead of Babel

---

## When to Escalate

Contact team lead or DevOps if:
- ❌ Build fails even with 16GB RAM
- ❌ Build takes longer than 10 minutes
- ❌ System crashes during build
- ❌ Corrupted Docker installation suspected

---

## Success Criteria

A successful build should:
- ✅ Complete in 2-4 minutes
- ✅ Create dist folder with chunked assets
- ✅ No SIGKILL or OOM errors
- ✅ Docker image size < 50MB (nginx stage)
- ✅ All services start and pass health checks

---

## Additional Resources

- **Full Guide:** `DOCKER_BUILD_OPTIMIZATION.md`
- **Vite Config:** `frontend-plt/vite.config.js`
- **Dockerfile:** `frontend-plt/Dockerfile`
- **Build Script:** `build-production.sh`

---

**Last Updated:** 2024
**Quick Help:** Run `./build-production.sh` for automated build with monitoring
