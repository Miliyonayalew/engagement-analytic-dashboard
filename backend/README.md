# Engagement Dashboard Backend

Express.js API server for the engagement analytics dashboard.

## Features

- **RESTful API** for engagement data
- **CSV file upload** and processing
- **Analytics summary** endpoints
- **Integration** with Sam's engagement API
- **CORS enabled** for frontend communication

## API Endpoints

### GET /api/engagement
Returns engagement data with optional query parameters:
- `timeframe`: Filter by time period
- `segment`: Filter by user segment
- `platform`: Filter by platform

### POST /api/engagement/upload
Upload CSV file with engagement data

### GET /api/analytics/summary
Returns analytics summary including:
- Total engagements
- Average engagement score
- Platform breakdown
- Top segments

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

The server runs on port 3000 by default.

## Configuration

The server attempts to connect to Sam's engagement API at `http://localhost:3001/engagement`. If unavailable, it falls back to mock data.

## Data Format

Engagement data structure:
```json
{
  "id": "string",
  "timestamp": "ISO string",
  "user_id": "string",
  "engagement_type": "string",
  "platform": "string",
  "segment": "string",
  "score": "number"
}
``` 