# Frontend Build Configuration

## Build Optimization for Large-Scale Applications

This frontend application has been optimized for large-scale production builds with 4,753+ modules.

### Quick Start

#### Production Build
```bash
# Recommended: Use the automated build script
./build-production.sh

# Or use Docker Compose directly
DOCKER_BUILDKIT=1 docker compose build --no-cache
docker compose up -d
```

#### Development
```bash
# Start development server
docker compose -f docker-compose.dev.yml up -d

# Or run locally
cd frontend-plt
npm install
npm run dev
```

### Build Configuration

#### Memory Requirements
- **Minimum**: 12 GB RAM
- **Recommended**: 16 GB RAM
- **Docker Memory Limit**: Set to 12-16 GB in Docker Desktop

#### Node.js Options
The build is configured with:
```bash
NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=512"
```

This allocates:
- 8 GB heap space for the build process
- 512 MB semi-space for optimized garbage collection

#### Vite Build Optimization

The `vite.config.js` includes:
1. **Manual Chunking**: Splits vendor libraries into logical groups
   - vendor-react: React core libraries
   - vendor-antd: Ant Design UI components
   - vendor-state: State management libraries
   - vendor-utils: Utility libraries
   - vendor-i18n: Internationalization
   - vendor-other: Remaining dependencies

2. **Terser Optimization**: Single-pass minification for reduced memory usage
3. **Code Splitting**: CSS and JS split for optimal loading
4. **Source Maps**: Disabled in production to save memory

### Build Performance

#### Expected Build Times
- **Development mode**: 5-10 seconds (HMR)
- **Production build**: 2-4 minutes
- **Cold build** (no cache): 3-5 minutes

#### Output Structure
```
dist/
├── index.html
├── assets/
│   ├── js/
│   │   ├── index-[hash].js          # Main application
│   │   ├── vendor-react-[hash].js   # React libraries
│   │   ├── vendor-antd-[hash].js    # Ant Design
│   │   ├── vendor-state-[hash].js   # State management
│   │   ├── vendor-utils-[hash].js   # Utilities
│   │   ├── vendor-i18n-[hash].js    # i18n libraries
│   │   └── vendor-other-[hash].js   # Other dependencies
│   └── css/
│       └── index-[hash].css         # Styles
└── ...
```

### Troubleshooting

#### Build Fails with SIGKILL
This indicates out-of-memory error. Solutions:
1. Check available memory: `free -h`
2. Increase Docker memory limit to 16 GB
3. Close other applications to free memory
4. See `TROUBLESHOOTING.md` for detailed help

#### Build Takes Too Long
If build exceeds 5 minutes:
1. Check system resources
2. Clear Docker cache: `docker system prune -af`
3. Ensure BuildKit is enabled
4. Check for background processes consuming resources

#### Chunk Size Warnings
The chunk size limit is set to 1000kb, appropriate for this application size.
If warnings appear, review the manual chunking configuration.

### Development

#### Local Development
```bash
cd frontend-plt
npm install
npm run dev
```

The dev server will start on `http://localhost:5173`

#### Testing
```bash
npm run test           # Run tests
npm run test:coverage  # Run with coverage
npm run test:ui        # Run with UI
```

#### Linting
```bash
npm run lint
```

### Docker Configuration

#### Build Stage
The Dockerfile uses a multi-stage build:
1. **Build stage** (node:18-alpine):
   - Installs dependencies
   - Builds the application with Vite
   - Requires 8-12 GB memory

2. **Production stage** (nginx:alpine):
   - Serves static files
   - Requires 256-512 MB memory

#### Resource Limits
```yaml
# Build time (docker-compose.yml)
shm_size: '2gb'                  # Shared memory for build

# Runtime
mem_limit: 512m                  # Max runtime memory
mem_reservation: 256m            # Guaranteed memory
```

### Environment Variables

Required for production:
```bash
VITE_VERCEL_BASE_URL=http://localhost:8080
VITE_VERCEL_SERVER_URL=http://localhost:5000
```

See `.env.example` for complete list.

### CI/CD Integration

#### GitHub Actions Example
```yaml
- name: Build Frontend
  env:
    DOCKER_BUILDKIT: 1
    NODE_OPTIONS: "--max-old-space-size=8192"
  run: |
    docker compose build --no-cache frontend
```

#### Resource Requirements for CI
- **Runner**: ubuntu-latest-4-cores or larger
- **Memory**: 16 GB recommended
- **Timeout**: 10 minutes

### Monitoring

#### Check Build Status
```bash
# During build
docker stats

# Build logs
docker compose logs frontend

# Image size
docker images | grep plt-frontend
```

#### Success Indicators
- ✅ Build completes in 2-4 minutes
- ✅ No SIGKILL or OOM errors
- ✅ All vendor chunks created
- ✅ Total dist size reasonable (~5-10 MB)

### Additional Documentation

- **Full Optimization Guide**: `DOCKER_BUILD_OPTIMIZATION.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Change Summary**: `CHANGES.md`

### Support

For build issues:
1. Check `TROUBLESHOOTING.md`
2. Review build logs
3. Verify system resources
4. Contact DevOps team

---

**Build System Version**: 1.0
**Last Updated**: 2024
**Node Version**: 18.x
**Vite Version**: 6.2.0
