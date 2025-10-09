.PHONY: build up down logs dev dev-down dev-logs backup restore clean health

# Production commands
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

# Production-specific commands
prod-deploy: build up
	@echo "Production deployment started..."
	@echo "Waiting for services to be healthy..."
	@sleep 30
	@make health

prod-update:
	docker compose pull
	docker compose up -d --build
	@make health

# Optimized production build with cleanup
prod-build-clean:
	@echo "Starting optimized production build with cleanup..."
	@echo "Checking system resources..."
	@free -h || echo "Memory check not available"
	@df -h || echo "Disk check not available"
	@echo "Cleaning Docker resources..."
	docker compose down --remove-orphans
	docker system prune -f
	docker image prune -f
	docker compose -f docker-compose.yml down --rmi all
	@echo "Building with memory optimization..."
	@echo "Building backend first (uses less memory)..."
	docker compose build --no-cache backend mongodb
	@echo "Building frontend with memory constraints..."
	docker compose build --no-cache --memory=2g --memory-swap=4g frontend
	@echo "Production build completed!"

# Full production deployment with cleanup
prod-deploy-clean: prod-build-clean up
	@echo "Production deployment with cleanup completed!"
	@echo "Waiting for services to be healthy..."
	@sleep 30
	@make health

# Alternative build for low-memory VPS (build services separately)
prod-build-low-memory:
	@echo "Starting low-memory build strategy..."
	@echo "This builds one service at a time to minimize memory usage"
	@echo "Checking system resources..."
	@free -h || echo "Memory check not available"
	@df -h || echo "Disk check not available"
	@echo "Cleaning Docker resources..."
	docker compose down --remove-orphans
	docker system prune -f
	docker image prune -f
	@echo "Step 1/3: Building MongoDB..."
	docker compose build --no-cache mongodb
	@echo "Step 2/3: Building Backend..."
	docker compose build --no-cache backend
	@echo "Step 3/3: Building Frontend with constraints..."
	docker compose build --no-cache --memory=2g --memory-swap=4g frontend || \
	(echo "ERROR: Frontend build failed due to memory constraints" && \
	 echo "Please use one of these alternatives:" && \
	 echo "1. Build locally using: build-production-local.bat" && \
	 echo "2. Add swap memory: sudo fallocate -l 4G /swapfile && sudo swapon /swapfile" && \
	 echo "3. Use pre-built dist: docker compose -f docker-compose.prebuilt.yml up -d" && \
	 exit 1)
	@echo "All services built successfully!"

health:
	@echo "Checking service health..."
	@curl -f http://localhost:8080/health || echo "Frontend health check failed"
	@curl -f http://localhost:5000/health || echo "Backend health check failed"

backup-prod:
	@echo "Creating production backup..."
	docker exec plt-mongodb mongodump --host localhost --port 27017 --username $(MONGO_ROOT_USERNAME) --password $(MONGO_ROOT_PASSWORD) --authenticationDatabase admin --db $(MONGO_DATABASE) --out /data/backup
	docker cp plt-mongodb:/data/backup ./mongodb-backup-prod-$$(date +%Y%m%d_%H%M%S)
	@echo "Backup completed: mongodb-backup-prod-$$(date +%Y%m%d_%H%M%S)"

restart:
	docker compose restart

# Development commands (Vite)
dev:
	docker compose -f docker-compose.dev.yml up -d --build

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-ps:
	docker compose -f docker-compose.dev.yml ps

# Database commands
backup:
	docker exec plt-mongodb-dev mongodump --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin --db plt_database --out /data/backup
	docker cp plt-mongodb-dev:/data/backup ./mongodb-backup-$$(date +%Y%m%d_%H%M%S)

restore:
	@read -p "Enter the backup folder name (e.g., mongodb-backup-YYYYMMDD_HHMMSS): " backup_folder; \
	if [ -d "$$backup_folder" ]; then \
		echo "Copying backup to container..."; \
		docker cp $$backup_folder plt-mongodb-dev:/data/restore; \
		echo "Restoring database..."; \
		docker exec plt-mongodb-dev mongorestore --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin --drop --db plt_database /data/restore/$$backup_folder/plt_database; \
		echo "Cleaning up temporary files..."; \
		docker exec plt-mongodb-dev rm -rf /data/restore/$$backup_folder; \
	else \
		echo "Error: Folder '$$backup_folder' does not exist."; \
	fi

restore-alt:
	@read -p "Enter the backup folder name (e.g., mongodb-backup-YYYYMMDD_HHMMSS): " backup_folder; \
	if [ -d "$$backup_folder" ]; then \
		echo "Copying backup contents to container..."; \
		docker cp $$backup_folder/plt_database plt-mongodb-dev:/data/restore/; \
		echo "Restoring database..."; \
		docker exec plt-mongodb-dev mongorestore --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin --drop --db plt_database /data/restore/plt_database; \
		echo "Cleaning up temporary files..."; \
		docker exec plt-mongodb-dev rm -rf /data/restore/plt_database; \
	else \
		echo "Error: Folder '$$backup_folder' does not exist."; \
	fi

# Method tốt nhất - copy trực tiếp folder plt_database
restore-direct:
	@read -p "Enter the backup folder name (e.g., mongodb-backup-YYYYMMDD_HHMMSS): " backup_folder; \
	if [ -d "$$backup_folder/plt_database" ]; then \
		echo "Copying plt_database folder to container..."; \
		docker cp $$backup_folder/plt_database/. plt-mongodb-dev:/data/restore/; \
		echo "Restoring database..."; \
		docker exec plt-mongodb-dev mongorestore --host localhost --port 27017 --username admin --password password123 --authenticationDatabase admin --drop --db plt_database /data/restore; \
		echo "Cleaning up temporary files..."; \
		docker exec plt-mongodb-dev rm -rf /data/restore/*; \
		echo "Database restored successfully!"; \
	else \
		echo "Error: Folder '$$backup_folder/plt_database' does not exist."; \
	fi

# Cleanup commands
clean:
	docker compose down -v
	docker compose -f docker-compose.dev.yml down -v
	docker system prune -f

clean-all:
	docker compose down -v
	docker compose -f docker-compose.dev.yml down -v
	docker system prune -af
	docker volume prune -f