# Google Sheets Filter Tool - Next.js Migration Guide

## Current App Features to Recreate

### Core Functionality
1. **Google Sheets Integration**
   - Service Account Authentication
   - Filter by multiple IDs in Column A
   - Return entire matching rows

2. **Frontend Features**
   - Search interface with comma-separated input
   - Time assignment dropdown (30min intervals 07:00AM-11:00PM)
   - Individual and bulk copy functionality
   - Dark/Light mode toggle
   - Sequential numbering (1, 2, 3...)
   - Results display with plain text format

3. **Backend API Endpoints**
   - POST /api/filter - Filter multiple IDs
   - POST /api/assign-time - Assign time to results
   - GET /api/time-assignments - Get all time assignments
   - GET /api/health - Health check

## Next.js Project Structure

```
my-sheets-app/
├── pages/
│   ├── api/
│   │   ├── filter.js
│   │   ├── assign-time.js
│   │   ├── time-assignments.js
│   │   └── health.js
│   ├── _app.js
│   └── index.js
├── components/
│   ├── SearchForm.js
│   ├── ResultsDisplay.js
│   ├── ThemeToggle.js
│   └── CopyButtons.js
├── lib/
│   ├── googleSheets.js
│   └── mongodb.js
├── styles/
│   └── globals.css
└── public/
```

## Environment Variables (.env.local)
```
GOOGLE_CREDENTIALS_JSON={"your":"service_account_json"}
SPREADSHEET_ID=1LqEuNuu1YTy0INXFmJRsMk2kUYINmgV-Z-ycfPLpuOs
MONGODB_URI=mongodb://localhost:27017/sheets_app
```

## Dependencies to Install
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "google-auth-library": "^9.0.0",
    "googleapis": "^128.0.0",
    "mongodb": "^6.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

## Key Code Components

### 1. Google Sheets Service (lib/googleSheets.js)
- Service account authentication
- Spreadsheet data fetching
- Row filtering by ID

### 2. API Routes (pages/api/)
- Convert FastAPI endpoints to Next.js API routes
- Handle CORS and error responses
- Maintain same request/response format

### 3. Main Page Component (pages/index.js)
- Search form with multiple ID input
- Results display with numbering
- Time assignment dropdowns
- Copy functionality
- Dark/light theme

### 4. Styling (Tailwind CSS)
- Responsive design
- Dark mode support
- Animation classes
- Custom components

## Time Slots Array
```javascript
const timeSlots = [
  "07:00AM - 08:00AM", "07:30AM - 08:30AM",
  "08:00AM - 09:00AM", "08:30AM - 09:30AM",
  // ... continue with all time slots
  "10:00PM - 11:00PM"
];
```

## Migration Checklist

### Phase 1: Setup
- [ ] Create new Next.js project
- [ ] Install dependencies
- [ ] Setup Tailwind CSS
- [ ] Configure environment variables

### Phase 2: Backend (API Routes)
- [ ] Create Google Sheets service
- [ ] Implement /api/filter endpoint
- [ ] Implement /api/assign-time endpoint
- [ ] Implement /api/time-assignments endpoint
- [ ] Add error handling and CORS

### Phase 3: Frontend Components
- [ ] Create main page layout
- [ ] Build search form component
- [ ] Create results display component
- [ ] Add theme toggle functionality
- [ ] Implement copy functionality
- [ ] Add numbering system

### Phase 4: Styling & Polish
- [ ] Apply Tailwind CSS styles
- [ ] Implement dark mode
- [ ] Add responsive design
- [ ] Test copy functionality
- [ ] Add loading states

### Phase 5: Testing & Deployment
- [ ] Test all functionality
- [ ] Verify Google Sheets integration
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain

## Notes for New Task

When starting your new Next.js task, tell the AI:

"I want to recreate my Google Sheets Filter Tool in Next.js. Here are the requirements:

1. Google Sheets integration with service account authentication
2. Filter multiple IDs from Column A of a specific spreadsheet
3. Time assignment with dropdown (07:00AM-11:00PM in 30min intervals)
4. Copy functionality for individual and all results
5. Sequential numbering (1, 2, 3...)
6. Dark/light mode toggle
7. Responsive design with Tailwind CSS

My Google Sheet ID: 1LqEuNuu1YTy0INXFmJRsMk2kUYINmgV-Z-ycfPLpuOs
Service Account Email: mdtcsheet@sheet-integration-471217.iam.gserviceaccount.com

Please start with the project setup and then we'll implement each feature step by step."