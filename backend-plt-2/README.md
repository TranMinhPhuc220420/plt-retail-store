# My Express App

Express.js application with MongoDB integration.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file and configure environment variables:
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/my-express-app
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── controllers/    # Request handlers
├── models/        # Mongoose schemas
├── routes/        # Route definitions
├── middlewares/   # Custom middleware
├── services/      # Business logic
├── utils/         # Helper functions
├── config/        # Configuration files
└── app.js         # Main application file
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
```
