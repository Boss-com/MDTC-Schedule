from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import logging
from dotenv import load_dotenv
import gspread
from google.oauth2.service_account import Credentials

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Google Sheets Filter API",
    description="API for filtering Google Sheets data by ID/Name with time assignment",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class FilterRequest(BaseModel):
    ids: List[str]

class SheetRow(BaseModel):
    row_number: int
    data: List[str]
    assigned_time: Optional[str] = None

class FilterResponse(BaseModel):
    query_ids: List[str]
    results: List[Dict[str, Any]]
    total_matches: int

class AssignTimeRequest(BaseModel):
    row_id: str
    time_slot: str

# Google Sheets Service
class GoogleSheetsService:
    def __init__(self):
        self.spreadsheet_id = os.getenv("SPREADSHEET_ID")
        self.credentials_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
        self.scopes = [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
        self._client = None
        self._worksheet = None
        
    def _get_client(self):
        """Initialize and return gspread client with service account credentials"""
        if not self._client:
            try:
                credentials_dict = json.loads(self.credentials_json)
                credentials = Credentials.from_service_account_info(
                    credentials_dict, 
                    scopes=self.scopes
                )
                self._client = gspread.authorize(credentials)
                logger.info("Successfully authenticated with Google Sheets API")
            except Exception as e:
                logger.error(f"Failed to authenticate with Google Sheets API: {str(e)}")
                raise HTTPException(status_code=500, detail="Authentication failed")
        return self._client
    
    def _get_worksheet(self, sheet_name: str = None):
        """Get worksheet by name or default to first sheet"""
        try:
            client = self._get_client()
            spreadsheet = client.open_by_key(self.spreadsheet_id)
            if sheet_name:
                worksheet = spreadsheet.worksheet(sheet_name)
            else:
                worksheet = spreadsheet.sheet1
            logger.info(f"Successfully accessed worksheet: {worksheet.title}")
            return worksheet
        except Exception as e:
            logger.error(f"Failed to access worksheet: {str(e)}")
            raise HTTPException(status_code=404, detail="Worksheet not found")
    
    def filter_rows_by_ids(self, target_ids: List[str], sheet_name: str = None) -> List[Dict[str, Any]]:
        """Filter rows by multiple IDs in column A and return entire matching rows"""
        try:
            worksheet = self._get_worksheet(sheet_name)
            all_values = worksheet.get_all_values()
            
            if not all_values:
                logger.warning("No data found in spreadsheet")
                return []
            
            # Normalize target IDs for comparison
            normalized_target_ids = [str(id).strip().lower() for id in target_ids]
            
            # Find matching rows
            results = []
            for target_id in target_ids:
                normalized_target = str(target_id).strip().lower()
                matching_rows = []
                
                for row_index, row in enumerate(all_values):
                    if row and str(row[0]).strip().lower() == normalized_target:
                        matching_rows.append({
                            'row_number': row_index + 1,
                            'data': row,
                            'assigned_time': None
                        })
                
                results.append({
                    'query_id': target_id,
                    'matches': matching_rows,
                    'count': len(matching_rows)
                })
            
            logger.info(f"Filtered {len(target_ids)} IDs, found total matches")
            return results
            
        except Exception as e:
            logger.error(f"Failed to filter rows: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to filter data")

# Initialize the service
sheets_service = GoogleSheetsService()

# Store for time assignments (in production, use database)
time_assignments = {}

@app.post("/api/filter", response_model=FilterResponse)
async def filter_rows_by_ids(request: FilterRequest):
    """
    Filter spreadsheet rows by multiple IDs in column A
    """
    try:
        logger.info(f"Filtering rows by IDs: {request.ids}")
        
        results = sheets_service.filter_rows_by_ids(request.ids)
        
        # Calculate total matches
        total_matches = sum(result['count'] for result in results)
        
        response = FilterResponse(
            query_ids=request.ids,
            results=results,
            total_matches=total_matches
        )
        
        logger.info(f"Successfully processed filter request for {len(request.ids)} IDs")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in filter endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/assign-time")
async def assign_time(request: AssignTimeRequest):
    """
    Assign time slot to a specific row
    """
    try:
        time_assignments[request.row_id] = request.time_slot
        logger.info(f"Assigned time {request.time_slot} to row {request.row_id}")
        return {"success": True, "message": "Time assigned successfully"}
    except Exception as e:
        logger.error(f"Failed to assign time: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to assign time")

@app.get("/api/time-assignments")
async def get_time_assignments():
    """
    Get all time assignments
    """
    return time_assignments

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Test Google Sheets connectivity
        client = sheets_service._get_client()
        
        return {
            "status": "healthy",
            "services": {
                "google_sheets_api": "connected",
                "authentication": "valid"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "services": {
                "google_sheets_api": "disconnected",
                "authentication": "failed"
            },
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)