.PHONY: build up down logs dev dev-down dev-logs backup restore clean

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