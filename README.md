# Engagement Analytics Dashboard

A full-stack web application for analyzing user engagement data, built with React + Vite and Express.js.

## Project Structure

```
engagement-analytics-dashboard/
├── backend/           # Express.js API server
│   ├── server.js      # Main server file
│   ├── package.json   # Backend dependencies
│   ├── uploads/       # CSV upload directory
│   └── README.md      # Backend documentation
├── frontend/          # React + Vite frontend
│   ├── src/           # React source code
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx    # Main App component
│   │   └── main.tsx   # Entry point
│   ├── public/        # Static assets (also contains vanilla JS version)
│   ├── package.json   # Frontend dependencies
│   ├── vite.config.ts # Vite configuration
│   └── tsconfig.json  # TypeScript configuration
└── README.md         # This file
```

## 🚀 Quick Start

### Option 1: Development Mode (Recommended)
```bash
cd frontend
npm run dev
```
This will automatically:
1. Start the backend server on port 3000
2. Start the React frontend on port 8000 (with Vite)
3. Set up API proxy from frontend to backend

### Option 2: Manual Start
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run frontend-only
```

## 📦 Installation

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 🌐 Access URLs

- **Frontend (React)**: http://localhost:8000
- **Backend API**: http://localhost:3000
- **Static Version**: http://localhost:8000/public/ (vanilla JS version)

## 🎯 Features

### Core Requirements
- **Interactive Dashboard** with real-time filtering and analytics
- **CSV Upload** for data cleanup and processing
- **Light/Dark Mode** toggle with persistent theme
- **Team Integration** with Sam's engagement API

### Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js with CORS and file upload
- **Styling**: CSS Variables for theme support
- **Development**: Hot reload with Vite dev server

## 🔧 Development Scripts

### Frontend Scripts
```bash
npm run dev          # Start both backend and frontend
npm run frontend     # Start frontend only (waits for backend)
npm run backend      # Start backend only
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Scripts
```bash
npm run dev          # Start with nodemon
npm start           # Start production server
```

## 🏗️ Architecture

### Frontend (React + Vite)
- **React Components**: Modular UI components
- **TypeScript**: Type safety throughout
- **Vite**: Fast development server with HMR
- **CSS Variables**: Theme system support
- **API Integration**: Axios with proxy configuration

### Backend (Express.js)
- **RESTful API**: `/api/engagement`, `/api/analytics/summary`
- **File Upload**: CSV processing with multer
- **CORS**: Configured for frontend integration
- **Error Handling**: Comprehensive error responses

## 🔄 API Endpoints

- `GET /api/engagement` - Retrieve engagement data with filtering
- `GET /api/analytics/summary` - Get analytics summary
- `POST /api/engagement/upload` - Upload CSV files

## 🎨 Theme Support

The application supports both light and dark themes:
- Toggle button in header
- Persistent theme storage
- CSS variable-based theming
- Smooth transitions

## 📱 Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend can be tested with:
cd backend
curl http://localhost:3000/api/engagement
```

## 🚀 Production Build

```bash
cd frontend
npm run build
```
The build files will be in `frontend/dist/`

## 🔧 Configuration

### Vite Configuration
- Port: 8000
- API Proxy: Forwards `/api/*` to backend
- Hot Module Replacement enabled
- TypeScript support

### Backend Configuration
- Port: 3000
- CORS enabled for frontend
- File upload directory: `uploads/`
- Mock data fallback when external API unavailable

## 📖 Development Notes

### Team Integration
- **Sam's API**: Integrated with graceful fallback
- **Neha's UI**: Extended card toggle patterns
- **Role**: Integration specialist

### Client Requirements
- ✅ "More interactivity" - Real-time filtering
- ✅ "Easier reporting" - CSV upload/analytics
- ✅ "Light mode support" - Complete theme toggle
- ✅ "Analytics data cleanup" - CSV processing

---

**Tech Stack**: React 18, TypeScript, Vite, Express.js, Node.js  
**Development**: Hot reload, TypeScript, Modern ES modules  
**Production**: Optimized builds, static file serving 