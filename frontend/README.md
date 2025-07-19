# Engagement Dashboard Frontend

React TypeScript frontend for the engagement analytics dashboard with Tailwind CSS styling.

## Features

- **Interactive Dashboard** with real-time filtering
- **Dark/Light Mode** toggle
- **CSV Upload** with drag-and-drop support
- **Analytics Visualization** with charts and metrics
- **Responsive Design** optimized for all devices
- **TypeScript** for type safety
- **Tailwind CSS** for modern styling

## Components

### Dashboard
- Main dashboard with engagement metrics
- Real-time data filtering
- Analytics summary cards

### CSV Upload
- Drag-and-drop file upload
- Progress tracking
- Error handling

### Theme Toggle
- Light/dark mode switching
- Persistent theme selection
- Smooth transitions

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

Opens the app in development mode at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Testing

```bash
npm test
```

Runs the test suite in interactive watch mode.

## Dependencies

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Icons** - Icon library
- **date-fns** - Date utilities

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api/` for:
- Engagement data retrieval
- CSV file uploads
- Analytics summaries

## Architecture

```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context for state management
├── services/       # API service layer
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Styling

Uses Tailwind CSS with custom configuration for:
- Dark mode support
- Custom color palette
- Responsive breakpoints
- Animation utilities 