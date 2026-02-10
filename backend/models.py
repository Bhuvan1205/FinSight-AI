from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    cash_on_hand = Column(Float, default=7500000.0)  # Default 75 lakhs
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(String(50), unique=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    vendor = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., "LOGIN", "ADD_EXPENSE", "RUN_SIMULATION"
    details = Column(Text, nullable=True)  # JSON string with additional details
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")

class Upload(Base):
    __tablename__ = "uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, analyzing, completed, failed
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_transactions = Column(Integer, default=0)
    imported_count = Column(Integer, default=0)
    analysis_results = Column(Text, nullable=True)  # JSON string
    
    # Relationship
    user = relationship("User")
    staged_transactions = relationship("UploadTransaction", back_populates="upload", cascade="all, delete-orphan")

class UploadTransaction(Base):
    __tablename__ = "upload_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    transaction_id = Column(String(100), nullable=False)
    date = Column(DateTime, nullable=False)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=True)
    vendor = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    suggested_category = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    is_duplicate = Column(Boolean, default=False)
    
    # Relationship
    upload = relationship("Upload", back_populates="staged_transactions")
