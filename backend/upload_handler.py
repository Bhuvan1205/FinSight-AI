"""
CSV Upload Handler
Handles file upload, parsing, validation, and staging
"""
from typing import List, Dict, Optional, Tuple
import pandas as pd
from datetime import datetime
import hashlib
import os
from fastapi import UploadFile, HTTPException
import re

class CSVUploadHandler:
    """Handle CSV file uploads and parsing"""
    
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        
        # Column name mappings
        self.column_mappings = {
            'date': ['date', 'transaction date', 'txn date', 'transaction_date', 'txn_date', 'datetime'],
            'description': ['description', 'desc', 'details', 'transaction details', 'particulars'],
            'amount': ['amount', 'value', 'transaction amount', 'txn amount'],
            'category': ['category', 'type', 'transaction type', 'txn type'],
            'vendor': ['vendor', 'merchant', 'payee', 'supplier'],
            'notes': ['notes', 'memo', 'remarks', 'comments']
        }
    
    async def save_upload(self, file: UploadFile) -> str:
        """Save uploaded file and return file path"""
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)
        filename = f"{timestamp}_{safe_filename}"
        filepath = os.path.join(self.upload_dir, filename)
        
        # Save file
        content = await file.read()
        
        # Validate file size (max 10MB)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        with open(filepath, 'wb') as f:
            f.write(content)
        
        return filepath
    
    def parse_csv(self, filepath: str) -> Tuple[pd.DataFrame, Dict]:
        """Parse CSV file and return DataFrame with metadata"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(filepath, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                raise HTTPException(status_code=400, detail="Unable to decode CSV file")
            
            # Map columns
            column_map = self._detect_columns(df.columns.tolist())
            df = df.rename(columns=column_map)
            
            # Validate required columns
            required = ['date', 'description', 'amount']
            missing = [col for col in required if col not in df.columns]
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {', '.join(missing)}"
                )
            
            # Parse and validate data
            df = self._clean_data(df)
            
            metadata = {
                'total_rows': len(df),
                'columns': df.columns.tolist(),
                'date_range': {
                    'start': df['date'].min().isoformat() if not df.empty else None,
                    'end': df['date'].max().isoformat() if not df.empty else None
                },
                'column_mapping': column_map
            }
            
            return df, metadata
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
    
    def _detect_columns(self, columns: List[str]) -> Dict[str, str]:
        """Auto-detect column mappings"""
        column_map = {}
        columns_lower = [col.lower().strip() for col in columns]
        
        for standard_name, variations in self.column_mappings.items():
            for col, col_lower in zip(columns, columns_lower):
                if col_lower in variations:
                    column_map[col] = standard_name
                    break
        
        return column_map
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate transaction data"""
        # Parse dates
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        # Remove rows with invalid dates
        df = df.dropna(subset=['date'])
        
        # Parse amounts
        if df['amount'].dtype == 'object':
            # Remove currency symbols and commas
            df['amount'] = df['amount'].astype(str).str.replace(r'[₹$,]', '', regex=True)
        
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        
        # Remove rows with invalid amounts
        df = df.dropna(subset=['amount'])
        
        # Handle debit/credit columns if present
        if 'debit' in df.columns and 'credit' in df.columns:
            df['amount'] = df.apply(
                lambda row: -abs(row['debit']) if pd.notna(row['debit']) else abs(row['credit']),
                axis=1
            )
        
        # Clean description
        df['description'] = df['description'].astype(str).str.strip()
        
        # Fill optional columns
        if 'category' not in df.columns:
            df['category'] = None
        if 'vendor' not in df.columns:
            df['vendor'] = None
        if 'notes' not in df.columns:
            df['notes'] = None
        
        # Remove duplicates
        df = df.drop_duplicates(subset=['date', 'description', 'amount'])
        
        return df
    
    def transactions_to_dict(self, df: pd.DataFrame) -> List[Dict]:
        """Convert DataFrame to list of transaction dicts"""
        transactions = []
        
        for idx, row in df.iterrows():
            txn = {
                'id': idx,  # Temporary ID
                'date': row['date'].isoformat(),
                'description': row['description'],
                'amount': float(row['amount']),
                'category': row['category'] if pd.notna(row['category']) else None,
                'vendor': row['vendor'] if pd.notna(row['vendor']) else None,
                'notes': row['notes'] if pd.notna(row['notes']) else None
            }
            transactions.append(txn)
        
        return transactions
    
    def cleanup_file(self, filepath: str):
        """Delete uploaded file"""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error cleaning up file {filepath}: {e}")
