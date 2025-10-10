import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeAssignments, setTimeAssignments] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Time slots as shown in the user's image
  const timeSlots = [
    "07:00AM - 08:00AM",
    "07:30AM - 08:30AM", 
    "08:00AM - 09:00AM",
    "08:30AM - 09:30AM",
    "09:00AM - 10:00AM",
    "09:30AM - 10:30AM",
    "10:00AM - 11:00AM",
    "10:30AM - 11:30AM",
    "11:00AM - 12:00PM",
    "11:30AM - 12:30PM",
    "12:00PM - 01:00PM",
    "12:30PM - 01:30PM",
    "01:00PM - 02:00PM",
    "01:30PM - 02:30PM",
    "02:00PM - 03:00PM",
    "02:30PM - 03:30PM",
    "03:00PM - 04:00PM",
    "03:30PM - 04:30PM",
    "04:00PM - 05:00PM",
    "04:30PM - 05:30PM",
    "05:00PM - 06:00PM",
    "05:30PM - 06:30PM",
    "06:00PM - 07:00PM",
    "06:30PM - 07:30PM",
    "07:00PM - 08:00PM",
    "07:30PM - 08:30PM",
    "08:00PM - 09:00PM",
    "08:30PM - 09:30PM",
    "09:00PM - 10:00PM",
    "09:30PM - 10:30PM",
    "10:00PM - 11:00PM"
  ];

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      alert('Please enter at least one ID');
      return;
    }

    setLoading(true);
    try {
      // Split by comma and clean up the IDs
      const ids = searchInput.split(',').map(id => id.trim()).filter(id => id);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filter`, {
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

  const handleTimeAssignment = async (rowId, timeSlot) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/assign-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          row_id: rowId, 
          time_slot: timeSlot 
        }),
      });

      if (response.ok) {
        setTimeAssignments(prev => ({ ...prev, [rowId]: timeSlot }));
      }
    } catch (error) {
      console.error('Error assigning time:', error);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSearchInput('');
    setTimeAssignments({});
  };

  const formatRowData = (data) => {
    return data.filter(cell => cell.trim() !== '').join(' | ');
  };

  const copyToClipboard = async (text, type = 'result') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${type} copied to clipboard!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyFeedback('Failed to copy to clipboard');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const copyIndividualResult = (match, rowId) => {
    const rowData = formatRowData(match.data);
    const timeAssignment = timeAssignments[rowId];
    const fullResult = timeAssignment ? `${rowData} | Time: ${timeAssignment}` : rowData;
    copyToClipboard(fullResult, 'Result');
  };

  const copyAllResults = () => {
    let allResults = [];
    results.forEach(result => {
      if (result.matches && result.matches.length > 0) {
        result.matches.forEach(match => {
          const rowId = `${result.query_id}-${match.row_number}`;
          const rowData = formatRowData(match.data);
          const timeAssignment = timeAssignments[rowId];
          const fullResult = timeAssignment ? `${rowData} | Time: ${timeAssignment}` : rowData;
          allResults.push(fullResult);
        });
      }
    });
    
    const combinedResults = allResults.join('\n');
    copyToClipboard(combinedResults, 'All results');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen py-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div></div> {/* Spacer */}
            <div className="flex-1">
              <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Google Sheets Filter Tool
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Filter multiple IDs from your Google Sheet and assign time slots
              </p>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </span>
              <button
                onClick={toggleDarkMode}
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
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>
          </div>
          
          {/* Copy Feedback */}
          {copyFeedback && (
            <div className={`mb-4 p-2 rounded-lg text-sm font-medium ${
              isDarkMode 
                ? 'bg-green-800 text-green-200 border border-green-700' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              ✅ {copyFeedback}
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="search" className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Enter IDs (comma-separated)
              </label>
              <div className="flex space-x-3">
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g., ID001, ID002, Name1"
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
                {results.length > 0 && (
                  <>
                    <button
                      onClick={copyAllResults}
                      className={`px-6 py-3 font-semibold rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${
                        isDarkMode 
                          ? 'bg-green-700 text-white hover:bg-green-600' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      📋 Copy All
                    </button>
                    <button
                      onClick={clearResults}
                      className={`px-6 py-3 font-semibold rounded-lg focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 text-white hover:bg-gray-500' 
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>💡 Tip: Enter multiple IDs separated by commas to filter multiple rows at once</p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, resultIndex) => (
              <div key={resultIndex} className={`rounded-xl shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
              }`}>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h3 className="text-xl font-semibold text-white">
                    Search ID: "{result.query_id}" 
                    <span className="ml-3 text-blue-200 text-sm">
                      ({result.count} {result.count === 1 ? 'match' : 'matches'} found)
                    </span>
                  </h3>
                </div>

                {result.matches.length > 0 ? (
                  <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {result.matches.map((match, matchIndex) => {
                      const rowId = `${result.query_id}-${match.row_number}`;
                      return (
                        <div key={matchIndex} className={`p-6 transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* Combined Row Info and Result Display */}
                            <div className="lg:col-span-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className={`text-sm font-medium ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Row #{match.row_number} - Complete Result
                                </p>
                                <button
                                  onClick={() => copyIndividualResult(match, rowId)}
                                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                    isDarkMode 
                                      ? 'bg-blue-700 text-blue-200 hover:bg-blue-600' 
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                  title="Copy this result"
                                >
                                  📋 Copy
                                </button>
                              </div>
                              <div className={`rounded-lg p-4 border-l-4 border-blue-500 ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <div className="space-y-2">
                                  <p className={`font-mono text-sm break-all ${
                                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                    {formatRowData(match.data)}
                                  </p>
                                  {timeAssignments[rowId] && (
                                    <div className={`mt-3 pt-3 border-t ${
                                      isDarkMode ? 'border-gray-600' : 'border-gray-300'
                                    }`}>
                                      <p className={`font-semibold text-sm ${
                                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                                      }`}>
                                        🕒 Assigned Time: {timeAssignments[rowId]}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Combined Plain Text Result */}
                              {timeAssignments[rowId] && (
                                <div className={`mt-4 border rounded-lg p-3 ${
                                  isDarkMode 
                                    ? 'bg-blue-900 border-blue-700' 
                                    : 'bg-blue-50 border-blue-200'
                                }`}>
                                  <p className={`text-xs font-medium mb-1 ${
                                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                  }`}>
                                    Plain Text Result:
                                  </p>
                                  <p className={`font-mono text-sm ${
                                    isDarkMode ? 'text-blue-200' : 'text-blue-800'
                                  }`}>
                                    {formatRowData(match.data)} | Time: {timeAssignments[rowId]}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Time Selection */}
                            <div className="lg:col-span-1">
                              <label className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {timeAssignments[rowId] ? 'Change Time Slot' : 'Assign Time Slot'}
                              </label>
                              <select
                                value={timeAssignments[rowId] || ''}
                                onChange={(e) => handleTimeAssignment(rowId, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                  isDarkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              >
                                <option value="">Select Time Range</option>
                                {timeSlots.map((slot, index) => (
                                  <option key={index} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                              
                              {timeAssignments[rowId] && (
                                <div className={`mt-3 p-3 border rounded-lg ${
                                  isDarkMode 
                                    ? 'bg-green-900 border-green-700' 
                                    : 'bg-green-50 border-green-200'
                                }`}>
                                  <p className={`font-medium text-sm ${
                                    isDarkMode ? 'text-green-300' : 'text-green-800'
                                  }`}>
                                    ✅ Time Successfully Assigned
                                  </p>
                                  <p className={`text-xs mt-1 ${
                                    isDarkMode ? 'text-green-400' : 'text-green-700'
                                  }`}>
                                    This result now includes the time slot
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className={`mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.005-5.971-2.572M15 3H9a6 6 0 00-6 6v9a2 2 0 002 2h10a2 2 0 002-2V9a6 6 0 00-6-6z" />
                      </svg>
                    </div>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      No matches found for this ID
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className={`rounded-xl border p-6 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
                : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
            }`}>
              <h4 className={`font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Search Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                  <p className="text-2xl font-bold text-blue-600">
                    {results.reduce((sum, result) => sum + result.count, 0)}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Total Matches</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.keys(timeAssignments).length}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Time Assigned</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                  <p className="text-2xl font-bold text-purple-600">
                    {results.length}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>IDs Searched</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`text-center mt-8 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>Google Sheets Integration • Filter by ID/Name • Time Assignment Tool</p>
        </div>
      </div>
    </div>
  );
}

export default App;