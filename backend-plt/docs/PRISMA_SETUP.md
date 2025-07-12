# Prisma Configuration for PLT Retail Store Backend

This document explains the Prisma setup for the PLT Retail Store backend application.

## Setup Overview

The project uses Prisma as the ORM (Object-Relational Mapping) tool with PostgreSQL database. The configuration includes:

- **Database**: PostgreSQL with Prisma Accelerate
- **Schema**: Located in `prisma/schema.prisma`
- **Generated Client**: Located in `generated/prisma/`
- **Service**: `PrismaService` in `src/database/prisma.service.ts`

## Database Schema

The schema includes the following models for a retail store:

- **User**: Customer and admin users with authentication
- **Category**: Product categories
- **Product**: Store products with inventory
- **Order**: Customer orders
- **OrderItem**: Individual items in orders
- **CartItem**: Shopping cart functionality
- **Review**: Product reviews and ratings
- **Address**: Customer shipping/billing addresses

## Available Scripts

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply database migrations
npm run db:migrate

# Push schema changes to database (for development)
npm run db:push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database browser)
npm run db:studio

# Reset database and apply all migrations
npm run db:reset
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="your_database_connection_string"
PORT=3000
NODE_ENV=development
```

## Usage in NestJS

The `PrismaService` is configured as a global service that can be injected into any controller or service:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany();
  }
}
```

## Initial Setup Steps

1. **Install dependencies** (already done):
   ```bash
   npm install prisma @prisma/client bcrypt
   npm install -D @types/bcrypt
   ```

2. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

3. **Apply database migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Seed the database**:
   ```bash
   npm run db:seed
   ```

## Database Connection

Currently configured to use Prisma Accelerate. For local development, you can change the `DATABASE_URL` in your `.env` file to point to a local PostgreSQL instance:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/plt_retail_store"
```

## Prisma Studio

To browse and edit your data, run:

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can view and manage your database.

## API Endpoints

Example endpoints are available:

- `GET /products` - Get all products with categories
- `GET /products/categories` - Get all categories with products

## Security Notes

- The seed file creates default users with simple passwords for development
- In production, ensure strong passwords and proper authentication
- Keep your `DATABASE_URL` secure and never commit it to version control
