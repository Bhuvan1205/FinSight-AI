"""
ML-based Transaction Analyzer
Provides auto-categorization, anomaly detection, and vendor extraction
"""
from typing import List, Dict, Tuple
import re
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest
import pandas as pd

class TransactionAnalyzer:
    """ML-powered transaction analysis"""
    
    def __init__(self):
        self.categorizer = None
        self.vectorizer = None
        self.categories = [
            "Salaries", "Cloud Services", "Software", "Marketing", 
            "Office", "Professional Services", "HR", "Contractors",
            "Operations", "Revenue"
        ]
        
    def train_categorizer(self, transactions: List[Dict]):
        """Train categorization model on existing transactions"""
        if not transactions or len(transactions) < 10:
            return False
            
        descriptions = [t['description'] for t in transactions]
        categories = [t['category'] for t in transactions]
        
        # Create TF-IDF features
        self.vectorizer = TfidfVectorizer(max_features=100, ngram_range=(1, 2))
        X = self.vectorizer.fit_transform(descriptions)
        
        # Train classifier
        self.categorizer = LogisticRegression(max_iter=1000, random_state=42)
        self.categorizer.fit(X, categories)
        
        return True
    
    def predict_category(self, description: str) -> Tuple[str, float]:
        """Predict category for a transaction description"""
        if not self.categorizer or not self.vectorizer:
            # Fallback to keyword matching
            return self._keyword_categorize(description), 0.5
        
        X = self.vectorizer.transform([description])
        category = self.categorizer.predict(X)[0]
        confidence = max(self.categorizer.predict_proba(X)[0])
        
        return category, confidence
    
    def _keyword_categorize(self, description: str) -> str:
        """Fallback keyword-based categorization"""
        desc_lower = description.lower()
        
        keywords = {
            "Salaries": ["salary", "payroll", "wages", "compensation"],
            "Cloud Services": ["aws", "azure", "google cloud", "gcp", "digitalocean", "heroku", "cloud"],
            "Software": ["github", "slack", "figma", "notion", "zoom", "subscription", "saas"],
            "Marketing": ["ads", "advertising", "marketing", "campaign", "seo", "social media"],
            "Office": ["rent", "office", "utilities", "electricity", "internet", "cleaning"],
            "Professional Services": ["legal", "accounting", "consultant", "lawyer", "ca"],
            "HR": ["recruitment", "training", "team building", "hr", "hiring"],
            "Contractors": ["freelance", "contractor", "consultant"],
            "Revenue": ["payment", "revenue", "income", "subscription", "client"]
        }
        
        for category, words in keywords.items():
            if any(word in desc_lower for word in words):
                return category
        
        return "Operations"  # Default category
    
    def detect_anomalies(self, transactions: List[Dict]) -> List[Dict]:
        """Detect anomalous transactions using statistical methods"""
        if len(transactions) < 5:
            return []
        
        df = pd.DataFrame(transactions)
        anomalies = []
        
        # Amount-based anomalies (using Z-score)
        amounts = df['amount'].abs()
        mean_amount = amounts.mean()
        std_amount = amounts.std()
        
        if std_amount > 0:
            z_scores = np.abs((amounts - mean_amount) / std_amount)
            amount_anomalies = df[z_scores > 3].to_dict('records')
            
            for txn in amount_anomalies:
                anomalies.append({
                    **txn,
                    'anomaly_type': 'unusual_amount',
                    'reason': f'Amount is {z_scores[txn["id"]]:.1f} standard deviations from mean'
                })
        
        # Category-based anomalies (unusual category for amount)
        category_stats = df.groupby('category')['amount'].agg(['mean', 'std']).to_dict('index')
        
        for idx, row in df.iterrows():
            if row['category'] in category_stats:
                cat_mean = category_stats[row['category']]['mean']
                cat_std = category_stats[row['category']]['std']
                
                if cat_std > 0:
                    z = abs((row['amount'] - cat_mean) / cat_std)
                    if z > 2.5:
                        anomalies.append({
                            **row.to_dict(),
                            'anomaly_type': 'unusual_for_category',
                            'reason': f'Unusual amount for {row["category"]} category'
                        })
        
        return anomalies
    
    def extract_vendor(self, description: str) -> str:
        """Extract vendor name from transaction description"""
        # Common patterns
        patterns = [
            r'^([A-Z][A-Za-z\s&]+?)(?:\s*-|\s+\d|\s+Monthly|\s+Bill|$)',  # "AWS - Monthly Bill"
            r'(?:Payment to|From)\s+([A-Z][A-Za-z\s&]+)',  # "Payment to Acme Corp"
            r'^([A-Z][A-Za-z\s&]+?)\s+(?:Subscription|Plan|Service)',  # "Slack Subscription"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description)
            if match:
                vendor = match.group(1).strip()
                # Clean up
                vendor = re.sub(r'\s+', ' ', vendor)
                if len(vendor) > 3:
                    return vendor
        
        # Fallback: take first few words
        words = description.split()
        if len(words) >= 2:
            return ' '.join(words[:2])
        
        return description[:30]
    
    def detect_duplicates(self, new_transactions: List[Dict], existing_transactions: List[Dict]) -> List[Dict]:
        """Detect potential duplicate transactions"""
        duplicates = []
        
        for new_txn in new_transactions:
            for existing_txn in existing_transactions:
                # Check if same date, amount, and similar description
                if (new_txn['date'] == existing_txn['date'] and
                    abs(new_txn['amount'] - existing_txn['amount']) < 0.01):
                    
                    # Check description similarity
                    desc_similarity = self._similarity(
                        new_txn['description'].lower(),
                        existing_txn['description'].lower()
                    )
                    
                    if desc_similarity > 0.7:
                        duplicates.append({
                            **new_txn,
                            'duplicate_of': existing_txn['id'],
                            'similarity': desc_similarity
                        })
                        break
        
        return duplicates
    
    def _similarity(self, s1: str, s2: str) -> float:
        """Calculate simple string similarity"""
        words1 = set(s1.split())
        words2 = set(s2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    def analyze_upload(self, transactions: List[Dict], existing_transactions: List[Dict] = None) -> Dict:
        """Comprehensive analysis of uploaded transactions"""
        if existing_transactions:
            # Train on existing data
            self.train_categorizer(existing_transactions)
        
        results = {
            'total_transactions': len(transactions),
            'categorization': [],
            'anomalies': [],
            'duplicates': [],
            'vendor_extraction': [],
            'summary': {}
        }
        
        # Categorize transactions
        for txn in transactions:
            if not txn.get('category'):
                category, confidence = self.predict_category(txn['description'])
                results['categorization'].append({
                    'transaction_id': txn.get('id'),
                    'description': txn['description'],
                    'suggested_category': category,
                    'confidence': confidence
                })
                txn['category'] = category
        
        # Extract vendors
        for txn in transactions:
            if not txn.get('vendor'):
                vendor = self.extract_vendor(txn['description'])
                results['vendor_extraction'].append({
                    'transaction_id': txn.get('id'),
                    'description': txn['description'],
                    'extracted_vendor': vendor
                })
                txn['vendor'] = vendor
        
        # Detect anomalies
        results['anomalies'] = self.detect_anomalies(transactions)
        
        # Detect duplicates
        if existing_transactions:
            results['duplicates'] = self.detect_duplicates(transactions, existing_transactions)
        
        # Generate summary
        df = pd.DataFrame(transactions)
        results['summary'] = {
            'total_amount': float(df['amount'].sum()),
            'total_expenses': float(df[df['amount'] < 0]['amount'].sum()),
            'total_revenue': float(df[df['amount'] > 0]['amount'].sum()),
            'categories': df['category'].value_counts().to_dict(),
            'date_range': {
                'start': df['date'].min(),
                'end': df['date'].max()
            }
        }
        
        return results
