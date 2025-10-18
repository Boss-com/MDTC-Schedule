# Next.js Code Snippets for Migration

## 1. Google Sheets Service (lib/googleSheets.js)

```javascript
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.SPREADSHEET_ID;
    this.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  }

  async getAuthenticatedSheets() {
    const auth = new GoogleAuth({
      credentials: this.credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  }

  async filterRowsByIds(targetIds) {
    try {
      const sheets = await this.getAuthenticatedSheets();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:Z', // Get all columns
      });

      const rows = response.data.values || [];
      const results = [];

      targetIds.forEach(targetId => {
        const matches = [];
        rows.forEach((row, index) => {
          if (row[0] && row[0].toString().trim() === targetId.toString().trim()) {
            matches.push({
              row_number: index + 1,
              data: row,
              assigned_time: null
            });
          }
        });
        
        results.push({
          query_id: targetId,
          matches: matches,
          count: matches.length
        });
      });

      return results;
    } catch (error) {
      throw new Error(`Failed to filter data: ${error.message}`);
    }
  }
}

export default GoogleSheetsService;
```

## 2. Filter API Route (pages/api/filter.js)

```javascript
import GoogleSheetsService from '../../lib/googleSheets';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const sheetsService = new GoogleSheetsService();
    const results = await sheetsService.filterRowsByIds(ids);

    const totalMatches = results.reduce((sum, result) => sum + result.count, 0);

    res.status(200).json({
      query_ids: ids,
      results: results,
      total_matches: totalMatches
    });

  } catch (error) {
    console.error('Filter API Error:', error);
    res.status(500).json({ detail: 'Failed to filter data' });
  }
}
```

## 3. Main Page Component (pages/index.js)

```javascript
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeAssignments, setTimeAssignments] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const timeSlots = [
    "07:00AM - 08:00AM", "07:30AM - 08:30AM",
    "08:00AM - 09:00AM", "08:30AM - 09:30AM",
    "09:00AM - 10:00AM", "09:30AM - 10:30AM",
    "10:00AM - 11:00AM", "10:30AM - 11:30AM",
    "11:00AM - 12:00PM", "11:30AM - 12:30PM",
    "12:00PM - 01:00PM", "12:30PM - 01:30PM",
    "01:00PM - 02:00PM", "01:30PM - 02:30PM",
    "02:00PM - 03:00PM", "02:30PM - 03:30PM",
    "03:00PM - 04:00PM", "03:30PM - 04:30PM",
    "04:00PM - 05:00PM", "04:30PM - 05:30PM",
    "05:00PM - 06:00PM", "05:30PM - 06:30PM",
    "06:00PM - 07:00PM", "06:30PM - 07:30PM",
    "07:00PM - 08:00PM", "07:30PM - 08:30PM",
    "08:00PM - 09:00PM", "08:30PM - 09:30PM",
    "09:00PM - 10:00PM", "09:30PM - 10:30PM",
    "10:00PM - 11:00PM"
  ];

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      alert('Please enter at least one ID');
      return;
    }

    setLoading(true);
    try {
      const ids = searchInput.split(',').map(id => id.trim()).filter(id => id);
      
      const response = await fetch('/api/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error:', error);
      alert('Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatRowData = (data) => {
    return data.filter(cell => cell && cell.trim() !== '').join(' | ');
  };

  const copyToClipboard = (text, type = 'result') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopyFeedback(`✅ ${type} copied to clipboard!`);
          setTimeout(() => setCopyFeedback(''), 3000);
        })
        .catch(() => {
          fallbackCopy(text, type);
        });
    } else {
      fallbackCopy(text, type);
    }
  };

  const fallbackCopy = (text, type) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopyFeedback(`✅ ${type} copied to clipboard!`);
        setTimeout(() => setCopyFeedback(''), 3000);
      } else {
        throw new Error('Copy failed');
      }
    } catch (err) {
      document.body.removeChild(textArea);
      alert(`Copy failed. Please manually copy this text:\n\n${text}`);
    }
  };

  return (
    <div className={`min-h-screen py-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <Head>
        <title>Google Sheets Filter Tool</title>
        <meta name="description" content="Filter multiple IDs from Google Sheets" />
      </Head>

      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div></div>
            <div className="flex-1">
              <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Google Sheets Filter Tool
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Filter multiple IDs from your Google Sheet and assign time slots
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {/* Copy Feedback */}
          {copyFeedback && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              isDarkMode 
                ? 'bg-green-800 text-green-200 border border-green-700' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {copyFeedback}
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-col space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Enter IDs (comma-separated)
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g., 1441, 1442, 1443"
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results will be rendered here */}
        {/* Add your results display component */}
      </div>
    </div>
  );
}
```

## 4. Tailwind CSS Configuration (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
```

## 5. Package.json

```json
{
  "name": "google-sheets-filter-nextjs",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.3",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "google-auth-library": "^9.2.0",
    "googleapis": "^128.0.0",
    "mongodb": "^6.3.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.0.3",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  }
}
```