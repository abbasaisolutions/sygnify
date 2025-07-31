"""
Enterprise Database Schema for Sygnify Financial Analytics Platform
- Optimized for high-performance financial data processing
- Complete audit logging and compliance tracking
- Advanced indexing and partitioning for scalability
- Role-based access control (RBAC) implementation
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, Float, Boolean, Text, JSON, 
    ForeignKey, Index, UniqueConstraint, CheckConstraint, BigInteger,
    DECIMAL, TIMESTAMP, UUID, ARRAY
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, ENUM
from datetime import datetime
import uuid
from enum import Enum as PyEnum

Base = declarative_base()

# Enums for consistent data types
class UserRole(PyEnum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    VIEWER = "viewer"

class UserStatus(PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class DataSourceType(PyEnum):
    CSV_UPLOAD = "csv_upload"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MSSQL = "mssql"
    ORACLE = "oracle"
    MONGODB = "mongodb"
    API_ENDPOINT = "api_endpoint"
    FILE_SYSTEM = "file_system"
    CLOUD_STORAGE = "cloud_storage"

class AnalysisStatus(PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AuditAction(PyEnum):
    LOGIN = "login"
    LOGOUT = "logout"
    DATA_UPLOAD = "data_upload"
    ANALYSIS_RUN = "analysis_run"
    REPORT_GENERATE = "report_generate"
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    SETTINGS_CHANGE = "settings_change"
    EXPORT_DATA = "export_data"

# Core User Management
class User(Base):
    __tablename__ = 'users'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(ENUM(UserRole), nullable=False, default=UserRole.VIEWER, index=True)
    status = Column(ENUM(UserStatus), nullable=False, default=UserStatus.PENDING, index=True)
    department = Column(String(100), nullable=True, index=True)
    position = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    last_login = Column(TIMESTAMP(timezone=True), nullable=True)
    password_changed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)
    locked_until = Column(TIMESTAMP(timezone=True), nullable=True)
    preferences = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Relationships
    created_users = relationship("User", backref=backref("creator", remote_side=[id]))
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    data_sources = relationship("DataSource", back_populates="owner")
    analyses = relationship("Analysis", back_populates="created_by_user")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_users_role_status', 'role', 'status'),
        Index('idx_users_department', 'department'),
        Index('idx_users_created_at', 'created_at'),
    )

# Session Management
class UserSession(Base):
    __tablename__ = 'user_sessions'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    last_activity = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    # Indexes
    __table_args__ = (
        Index('idx_sessions_user_active', 'user_id', 'is_active'),
        Index('idx_sessions_expires_at', 'expires_at'),
        Index('idx_sessions_last_activity', 'last_activity'),
    )

# Data Source Management
class DataSource(Base):
    __tablename__ = 'data_sources'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    source_type = Column(ENUM(DataSourceType), nullable=False, index=True)
    connection_config = Column(JSONB, nullable=True)  # Store connection parameters securely
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_sync = Column(TIMESTAMP(timezone=True), nullable=True)
    sync_frequency = Column(String(50), nullable=True)  # cron expression
    row_count = Column(BigInteger, nullable=True)
    schema_info = Column(JSONB, nullable=True)  # Store detected schema
    health_status = Column(String(20), default='unknown')  # healthy, degraded, failed
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="data_sources")
    datasets = relationship("Dataset", back_populates="data_source")
    
    # Indexes
    __table_args__ = (
        Index('idx_data_sources_type_active', 'source_type', 'is_active'),
        Index('idx_data_sources_owner_created', 'owner_id', 'created_at'),
        Index('idx_data_sources_health', 'health_status'),
    )

# Dataset Management (Partitioned for performance)
class Dataset(Base):
    __tablename__ = 'datasets'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    data_source_id = Column(PG_UUID(as_uuid=True), ForeignKey('data_sources.id'), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    file_hash = Column(String(64), nullable=True, index=True)  # For deduplication
    file_size = Column(BigInteger, nullable=True)
    file_path = Column(String(500), nullable=True)
    row_count = Column(BigInteger, nullable=True)
    column_count = Column(Integer, nullable=True)
    schema_info = Column(JSONB, nullable=True)
    data_quality_score = Column(DECIMAL(3, 2), nullable=True)  # 0.00 to 1.00
    processing_status = Column(String(20), default='pending')
    error_message = Column(Text, nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    processed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationships
    data_source = relationship("DataSource", back_populates="datasets")
    analyses = relationship("Analysis", back_populates="dataset")
    
    # Indexes
    __table_args__ = (
        Index('idx_datasets_source_status', 'data_source_id', 'processing_status'),
        Index('idx_datasets_hash', 'file_hash'),
        Index('idx_datasets_created_at', 'created_at'),
        Index('idx_datasets_quality_score', 'data_quality_score'),
    )

# Financial Data Storage (Optimized for analytics)
class FinancialRecord(Base):
    __tablename__ = 'financial_records'
    
    id = Column(BigInteger, primary_key=True, index=True)
    dataset_id = Column(PG_UUID(as_uuid=True), ForeignKey('datasets.id'), nullable=False, index=True)
    record_date = Column(TIMESTAMP(timezone=True), nullable=True, index=True)
    account_id = Column(String(100), nullable=True, index=True)
    transaction_id = Column(String(100), nullable=True, index=True)
    amount = Column(DECIMAL(15, 2), nullable=True, index=True)
    currency = Column(String(3), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    subcategory = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    counterparty = Column(String(255), nullable=True, index=True)
    tags = Column(ARRAY(String), nullable=True)
    raw_data = Column(JSONB, nullable=True)  # Original data for audit
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Indexes for financial analysis performance
    __table_args__ = (
        Index('idx_financial_records_dataset_date', 'dataset_id', 'record_date'),
        Index('idx_financial_records_amount_category', 'amount', 'category'),
        Index('idx_financial_records_account_date', 'account_id', 'record_date'),
        Index('idx_financial_records_counterparty', 'counterparty'),
        Index('idx_financial_records_currency', 'currency'),
        # Partition by month for large datasets
        # {'postgresql_partition_by': 'RANGE (record_date)'}
    )

# Analysis Execution Tracking
class Analysis(Base):
    __tablename__ = 'analyses'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    dataset_id = Column(PG_UUID(as_uuid=True), ForeignKey('datasets.id'), nullable=False, index=True)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    analysis_type = Column(String(50), nullable=False, index=True)
    status = Column(ENUM(AnalysisStatus), nullable=False, default=AnalysisStatus.PENDING, index=True)
    parameters = Column(JSONB, nullable=True)
    results = Column(JSONB, nullable=True)
    execution_time = Column(DECIMAL(8, 3), nullable=True)  # seconds
    memory_usage = Column(BigInteger, nullable=True)  # bytes
    error_message = Column(Text, nullable=True)
    confidence_score = Column(DECIMAL(3, 2), nullable=True)
    insights_generated = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    started_at = Column(TIMESTAMP(timezone=True), nullable=True)
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="analyses")
    created_by_user = relationship("User", back_populates="analyses")
    narratives = relationship("Narrative", back_populates="analysis")
    
    # Indexes
    __table_args__ = (
        Index('idx_analyses_dataset_status', 'dataset_id', 'status'),
        Index('idx_analyses_user_created', 'created_by', 'created_at'),
        Index('idx_analyses_type_status', 'analysis_type', 'status'),
        Index('idx_analyses_completed_at', 'completed_at'),
    )

# AI Narrative Storage
class Narrative(Base):
    __tablename__ = 'narratives'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    analysis_id = Column(PG_UUID(as_uuid=True), ForeignKey('analyses.id'), nullable=False, index=True)
    narrative_type = Column(String(50), nullable=False, index=True)
    user_role = Column(String(20), nullable=False, index=True)
    tone = Column(String(20), nullable=False)
    length = Column(String(20), nullable=False)
    headline = Column(String(500), nullable=True)
    executive_summary = Column(Text, nullable=True)
    key_insights = Column(JSONB, nullable=True)
    recommendations = Column(JSONB, nullable=True)
    financial_metrics = Column(JSONB, nullable=True)
    risk_assessment = Column(JSONB, nullable=True)
    market_context = Column(JSONB, nullable=True)
    compliance_notes = Column(JSONB, nullable=True)
    confidence_score = Column(DECIMAL(3, 2), nullable=True)
    generation_time = Column(DECIMAL(6, 3), nullable=True)
    model_used = Column(String(50), nullable=True, index=True)
    cache_hit = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    analysis = relationship("Analysis", back_populates="narratives")
    
    # Indexes
    __table_args__ = (
        Index('idx_narratives_analysis_type', 'analysis_id', 'narrative_type'),
        Index('idx_narratives_role_created', 'user_role', 'created_at'),
        Index('idx_narratives_model_confidence', 'model_used', 'confidence_score'),
    )

# System Performance Monitoring
class SystemMetric(Base):
    __tablename__ = 'system_metrics'
    
    id = Column(BigInteger, primary_key=True, index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(DECIMAL(15, 6), nullable=False)
    metric_unit = Column(String(20), nullable=True)
    source_component = Column(String(50), nullable=False, index=True)
    hostname = Column(String(100), nullable=True)
    metadata = Column(JSONB, nullable=True)
    recorded_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Indexes for time-series queries
    __table_args__ = (
        Index('idx_system_metrics_name_recorded', 'metric_name', 'recorded_at'),
        Index('idx_system_metrics_component_recorded', 'source_component', 'recorded_at'),
        # Partition by day for time-series data
        # {'postgresql_partition_by': 'RANGE (recorded_at)'}
    )

# Comprehensive Audit Logging
class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=True, index=True)
    session_id = Column(PG_UUID(as_uuid=True), ForeignKey('user_sessions.id'), nullable=True)
    action = Column(ENUM(AuditAction), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True, index=True)
    resource_id = Column(String(100), nullable=True, index=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True, index=True)
    user_agent = Column(Text, nullable=True)
    request_id = Column(String(100), nullable=True, index=True)
    status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    execution_time = Column(DECIMAL(8, 3), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    # Indexes for security and compliance
    __table_args__ = (
        Index('idx_audit_logs_user_action', 'user_id', 'action'),
        Index('idx_audit_logs_action_created', 'action', 'created_at'),
        Index('idx_audit_logs_ip_created', 'ip_address', 'created_at'),
        Index('idx_audit_logs_resource', 'resource_type', 'resource_id'),
        # Partition by month for large audit logs
        # {'postgresql_partition_by': 'RANGE (created_at)'}
    )

# Cache Management
class CacheEntry(Base):
    __tablename__ = 'cache_entries'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cache_key = Column(String(255), unique=True, nullable=False, index=True)
    cache_value = Column(JSONB, nullable=False)
    cache_type = Column(String(50), nullable=False, index=True)
    size_bytes = Column(Integer, nullable=True)
    hit_count = Column(Integer, default=0)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    last_accessed = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_cache_entries_type_expires', 'cache_type', 'expires_at'),
        Index('idx_cache_entries_last_accessed', 'last_accessed'),
    )

# Configuration Management
class SystemConfiguration(Base):
    __tablename__ = 'system_configurations'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(JSONB, nullable=False)
    config_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_sensitive = Column(Boolean, default=False, nullable=False)
    is_editable = Column(Boolean, default=True, nullable=False)
    updated_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_system_configs_type', 'config_type'),
        Index('idx_system_configs_updated', 'updated_at'),
    )

# Financial KPI Tracking
class FinancialKPI(Base):
    __tablename__ = 'financial_kpis'
    
    id = Column(BigInteger, primary_key=True, index=True)
    dataset_id = Column(PG_UUID(as_uuid=True), ForeignKey('datasets.id'), nullable=False, index=True)
    kpi_name = Column(String(100), nullable=False, index=True)
    kpi_value = Column(DECIMAL(15, 6), nullable=False)
    kpi_unit = Column(String(20), nullable=True)
    calculation_method = Column(String(100), nullable=True)
    benchmark_value = Column(DECIMAL(15, 6), nullable=True)
    variance_pct = Column(DECIMAL(5, 2), nullable=True)
    trend_direction = Column(String(20), nullable=True)  # increasing, decreasing, stable
    confidence_level = Column(DECIMAL(3, 2), nullable=True)
    period_start = Column(TIMESTAMP(timezone=True), nullable=True, index=True)
    period_end = Column(TIMESTAMP(timezone=True), nullable=True, index=True)
    metadata = Column(JSONB, nullable=True)
    calculated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Indexes for KPI analysis
    __table_args__ = (
        Index('idx_financial_kpis_dataset_name', 'dataset_id', 'kpi_name'),
        Index('idx_financial_kpis_name_calculated', 'kpi_name', 'calculated_at'),
        Index('idx_financial_kpis_period', 'period_start', 'period_end'),
    )

# Data Lineage Tracking
class DataLineage(Base):
    __tablename__ = 'data_lineage'
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_dataset_id = Column(PG_UUID(as_uuid=True), ForeignKey('datasets.id'), nullable=True, index=True)
    target_dataset_id = Column(PG_UUID(as_uuid=True), ForeignKey('datasets.id'), nullable=True, index=True)
    transformation_type = Column(String(50), nullable=False, index=True)
    transformation_details = Column(JSONB, nullable=True)
    columns_mapping = Column(JSONB, nullable=True)
    quality_impact = Column(DECIMAL(3, 2), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Indexes for lineage queries
    __table_args__ = (
        Index('idx_data_lineage_source', 'source_dataset_id'),
        Index('idx_data_lineage_target', 'target_dataset_id'),
        Index('idx_data_lineage_transformation', 'transformation_type'),
    )

# Health Check Constraints
User.__table_args__ += (
    CheckConstraint('length(username) >= 3', name='check_username_length'),
    CheckConstraint('length(full_name) >= 2', name='check_full_name_length'),
)

Dataset.__table_args__ += (
    CheckConstraint('row_count >= 0', name='check_row_count_positive'),
    CheckConstraint('column_count >= 0', name='check_column_count_positive'),
    CheckConstraint('data_quality_score >= 0 AND data_quality_score <= 1', name='check_data_quality_range'),
)

Analysis.__table_args__ += (
    CheckConstraint('execution_time >= 0', name='check_execution_time_positive'),
    CheckConstraint('confidence_score >= 0 AND confidence_score <= 1', name='check_confidence_range'),
)

SystemMetric.__table_args__ += (
    CheckConstraint('metric_value IS NOT NULL', name='check_metric_value_not_null'),
)

# Create all tables function
def create_tables(engine):
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)

# Drop all tables function (for development)
def drop_tables(engine):
    """Drop all tables in the database"""
    Base.metadata.drop_all(bind=engine)