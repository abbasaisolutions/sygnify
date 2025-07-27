"""
Database Models
- Financial data tables
- User and authentication models
- Audit logging models
- Time-series optimized tables
- Partitioning strategies
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class User(Base):
    """User and authentication model."""
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Add more fields as needed

class FinancialRecord(Base):
    """Financial data model."""
    __tablename__ = 'financial_records'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    amount = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    category = Column(String)
    user = relationship('User')
    # Add more fields as needed

class AuditLog(Base):
    """Audit logging model."""
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship('User')
    # Add more fields as needed 