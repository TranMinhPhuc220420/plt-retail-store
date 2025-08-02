# PLT Retail Store

## Project Description
PLT Retail Store is a comprehensive retail management system designed to streamline store operations, inventory management, and sales tracking. It is developed by PLT Solutions to provide an efficient and user-friendly experience for retail businesses.

## ⚡ Recent Updates - Unit Simplification
**Important**: The system has been simplified to use only **kg** and **liter** for all measurements, eliminating complexity from multiple units (g, ml, piece, etc.). See [Unit Simplification Guide](UNIT_SIMPLIFICATION_GUIDE.md) for details.

## Features
- Real-time inventory tracking and management with simplified kg/liter units
- Sales analytics and revenue forecasting
- Employee shift scheduling and optimization
- Multi-store management with detailed reporting
- Integration with external systems for data import/export
- **Simplified unit system**: Only kg (weight) and l (volume) for consistency

## Prerequisites
- Node.js v18+.
- Docker (optional for containerized deployment).
- MongoDB (for backend database).

## Installation

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend-plt
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend-plt-2
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/plt-retail-store
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Using Docker
1. Build and run the frontend:
   ```bash
   docker build -t plt-frontend ./frontend-plt
   docker run -p 5173:5173 plt-frontend
   ```
2. Build and run the backend:
   ```bash
   docker build -t plt-backend ./backend-plt-2
   docker run -p 3000:3000 plt-backend
   ```

## Folder Structure
```
plt-retail-store/
├── frontend-plt/   # React-based frontend
│   ├── src/        # Source code
│   ├── public/     # Static assets
│   └── ...
├── backend-plt-2/  # Express.js backend
│   ├── src/        # Source code
│   ├── config/     # Configuration files
│   └── ...
└── README.MD       # Project documentation
```

## Contributing
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License
This project is licensed under the MIT License.

## Contact
For questions or support, contact PLT Solutions at [support@plt-solutions.com].
