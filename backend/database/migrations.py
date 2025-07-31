"""
Enterprise Database Migration System for Sygnify
- Automated schema version control and migrations
- Safe rollback capabilities with transaction support
- Data preservation during schema changes
- Performance-optimized migration execution
- Compliance and audit logging for all changes
"""

import asyncio
import logging
import os
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
from sqlalchemy import text, inspect, MetaData
from sqlalchemy.exc import SQLAlchemyError
from .connection import get_database, get_db_session
from .schemas import Base, create_tables, drop_tables

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MigrationStep:
    """Individual migration step"""
    step_id: str
    description: str
    sql_up: str
    sql_down: str
    requires_data_migration: bool = False
    estimated_duration: int = 0  # seconds
    dependencies: List[str] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []

@dataclass
class Migration:
    """Database migration definition"""
    version: str
    name: str
    description: str
    author: str
    created_at: datetime
    steps: List[MigrationStep]
    rollback_safe: bool = True
    requires_downtime: bool = False
    estimated_duration: int = 0

class MigrationExecutor:
    """Execute database migrations safely with monitoring"""
    
    def __init__(self):
        self.db = get_database()
        self.migration_table = "schema_migrations"
        self.migration_log_table = "migration_logs"
        self._ensure_migration_tables()
    
    def _ensure_migration_tables(self):
        """Ensure migration tracking tables exist"""
        
        migration_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {self.migration_table} (
            version VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            author VARCHAR(100),
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            execution_time DECIMAL(8,3),
            checksum VARCHAR(64),
            rollback_safe BOOLEAN DEFAULT true
        );
        """
        
        migration_log_sql = f"""
        CREATE TABLE IF NOT EXISTS {self.migration_log_table} (
            id BIGSERIAL PRIMARY KEY,
            version VARCHAR(50) NOT NULL,
            step_id VARCHAR(100),
            action VARCHAR(20) NOT NULL, -- 'apply', 'rollback', 'verify'
            status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
            sql_executed TEXT,
            error_message TEXT,
            execution_time DECIMAL(8,3),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        try:
            with self.db.get_session() as session:
                session.execute(text(migration_table_sql))
                session.execute(text(migration_log_sql))
                session.commit()
            logger.info("Migration tracking tables ensured")
        except Exception as e:
            logger.error(f"Failed to create migration tables: {e}")
            raise
    
    def get_applied_migrations(self) -> List[str]:
        """Get list of applied migration versions"""
        
        query = f"SELECT version FROM {self.migration_table} ORDER BY applied_at"
        
        try:
            with self.db.get_session(read_only=True) as session:
                result = session.execute(text(query))
                return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.error(f"Failed to get applied migrations: {e}")
            return []
    
    def is_migration_applied(self, version: str) -> bool:
        """Check if a migration version is already applied"""
        
        query = f"SELECT 1 FROM {self.migration_table} WHERE version = :version"
        
        try:
            with self.db.get_session(read_only=True) as session:
                result = session.execute(text(query), {"version": version})
                return result.fetchone() is not None
        except Exception as e:
            logger.error(f"Failed to check migration status: {e}")
            return False
    
    def apply_migration(self, migration: Migration) -> bool:
        """Apply a migration with full transaction support"""
        
        if self.is_migration_applied(migration.version):
            logger.info(f"Migration {migration.version} already applied")
            return True
        
        logger.info(f"Applying migration {migration.version}: {migration.name}")
        start_time = datetime.utcnow()
        
        try:
            with self.db.get_session() as session:
                # Log migration start
                self._log_migration_action(
                    session, migration.version, None, "apply", "started"
                )
                
                # Execute migration steps
                for step in migration.steps:
                    step_start = datetime.utcnow()
                    
                    try:
                        logger.info(f"Executing step: {step.description}")
                        
                        # Log step start
                        self._log_migration_action(
                            session, migration.version, step.step_id, "apply", "started", step.sql_up
                        )
                        
                        # Execute the SQL
                        session.execute(text(step.sql_up))
                        
                        step_duration = (datetime.utcnow() - step_start).total_seconds()
                        
                        # Log step completion
                        self._log_migration_action(
                            session, migration.version, step.step_id, "apply", "completed", 
                            step.sql_up, None, step_duration
                        )
                        
                        logger.info(f"Step completed in {step_duration:.3f}s")
                        
                    except Exception as e:
                        step_duration = (datetime.utcnow() - step_start).total_seconds()
                        
                        # Log step failure
                        self._log_migration_action(
                            session, migration.version, step.step_id, "apply", "failed",
                            step.sql_up, str(e), step_duration
                        )
                        
                        logger.error(f"Migration step failed: {e}")
                        raise
                
                # Record successful migration
                total_duration = (datetime.utcnow() - start_time).total_seconds()
                
                record_sql = f"""
                INSERT INTO {self.migration_table} 
                (version, name, description, author, execution_time, rollback_safe)
                VALUES (:version, :name, :description, :author, :execution_time, :rollback_safe)
                """
                
                session.execute(text(record_sql), {
                    "version": migration.version,
                    "name": migration.name,
                    "description": migration.description,
                    "author": migration.author,
                    "execution_time": total_duration,
                    "rollback_safe": migration.rollback_safe
                })
                
                # Log migration completion
                self._log_migration_action(
                    session, migration.version, None, "apply", "completed", 
                    None, None, total_duration
                )
                
                session.commit()
                
                logger.info(f"Migration {migration.version} applied successfully in {total_duration:.3f}s")
                return True
                
        except Exception as e:
            logger.error(f"Migration {migration.version} failed: {e}")
            return False
    
    def rollback_migration(self, version: str) -> bool:
        """Rollback a migration if it's rollback safe"""
        
        if not self.is_migration_applied(version):
            logger.warning(f"Migration {version} is not applied")
            return False
        
        # Get migration info
        migration_info = self._get_migration_info(version)
        if not migration_info or not migration_info.get("rollback_safe", False):
            logger.error(f"Migration {version} is not rollback safe")
            return False
        
        logger.info(f"Rolling back migration {version}")
        start_time = datetime.utcnow()
        
        try:
            # Load migration definition for rollback steps
            migration = self._load_migration_definition(version)
            if not migration:
                logger.error(f"Could not load migration definition for {version}")
                return False
            
            with self.db.get_session() as session:
                # Log rollback start
                self._log_migration_action(
                    session, version, None, "rollback", "started"
                )
                
                # Execute rollback steps in reverse order
                for step in reversed(migration.steps):
                    step_start = datetime.utcnow()
                    
                    try:
                        logger.info(f"Rolling back step: {step.description}")
                        
                        # Log step start
                        self._log_migration_action(
                            session, version, step.step_id, "rollback", "started", step.sql_down
                        )
                        
                        # Execute rollback SQL
                        session.execute(text(step.sql_down))
                        
                        step_duration = (datetime.utcnow() - step_start).total_seconds()
                        
                        # Log step completion
                        self._log_migration_action(
                            session, version, step.step_id, "rollback", "completed",
                            step.sql_down, None, step_duration
                        )
                        
                    except Exception as e:
                        step_duration = (datetime.utcnow() - step_start).total_seconds()
                        
                        # Log step failure
                        self._log_migration_action(
                            session, version, step.step_id, "rollback", "failed",
                            step.sql_down, str(e), step_duration
                        )
                        
                        logger.error(f"Rollback step failed: {e}")
                        raise
                
                # Remove migration record
                delete_sql = f"DELETE FROM {self.migration_table} WHERE version = :version"
                session.execute(text(delete_sql), {"version": version})
                
                total_duration = (datetime.utcnow() - start_time).total_seconds()
                
                # Log rollback completion
                self._log_migration_action(
                    session, version, None, "rollback", "completed",
                    None, None, total_duration
                )
                
                session.commit()
                
                logger.info(f"Migration {version} rolled back successfully in {total_duration:.3f}s")
                return True
                
        except Exception as e:
            logger.error(f"Rollback of migration {version} failed: {e}")
            return False
    
    def _log_migration_action(self, session, version: str, step_id: Optional[str], 
                            action: str, status: str, sql: Optional[str] = None,
                            error: Optional[str] = None, duration: Optional[float] = None):
        """Log migration action to audit table"""
        
        log_sql = f"""
        INSERT INTO {self.migration_log_table}
        (version, step_id, action, status, sql_executed, error_message, execution_time)
        VALUES (:version, :step_id, :action, :status, :sql_executed, :error_message, :execution_time)
        """
        
        session.execute(text(log_sql), {
            "version": version,
            "step_id": step_id,
            "action": action,
            "status": status,
            "sql_executed": sql,
            "error_message": error,
            "execution_time": duration
        })
    
    def _get_migration_info(self, version: str) -> Optional[Dict]:
        """Get migration information from database"""
        
        query = f"""
        SELECT version, name, description, author, applied_at, execution_time, rollback_safe
        FROM {self.migration_table}
        WHERE version = :version
        """
        
        try:
            with self.db.get_session(read_only=True) as session:
                result = session.execute(text(query), {"version": version})
                row = result.fetchone()
                
                if row:
                    return {
                        "version": row[0],
                        "name": row[1],
                        "description": row[2],
                        "author": row[3],
                        "applied_at": row[4],
                        "execution_time": row[5],
                        "rollback_safe": row[6]
                    }
                return None
                
        except Exception as e:
            logger.error(f"Failed to get migration info: {e}")
            return None
    
    def _load_migration_definition(self, version: str) -> Optional[Migration]:
        """Load migration definition from file system (placeholder)"""
        # In a real implementation, this would load from migration files
        # For now, return None as we're focusing on the infrastructure
        return None
    
    def get_migration_status(self) -> Dict[str, Any]:
        """Get comprehensive migration status"""
        
        applied_migrations = self.get_applied_migrations()
        
        # Get recent migration logs
        log_query = f"""
        SELECT version, action, status, error_message, created_at
        FROM {self.migration_log_table}
        ORDER BY created_at DESC
        LIMIT 20
        """
        
        try:
            with self.db.get_session(read_only=True) as session:
                result = session.execute(text(log_query))
                recent_logs = [
                    {
                        "version": row[0],
                        "action": row[1],
                        "status": row[2],
                        "error": row[3],
                        "timestamp": row[4].isoformat() if row[4] else None
                    }
                    for row in result.fetchall()
                ]
        except Exception as e:
            logger.error(f"Failed to get migration logs: {e}")
            recent_logs = []
        
        return {
            "applied_migrations": applied_migrations,
            "total_applied": len(applied_migrations),
            "recent_logs": recent_logs,
            "database_health": self.db.check_health(),
            "last_updated": datetime.utcnow().isoformat()
        }

class SygnifyMigrations:
    """Sygnify-specific migration definitions"""
    
    @staticmethod
    def get_initial_schema_migration() -> Migration:
        """Initial schema creation migration"""
        
        steps = [
            MigrationStep(
                step_id="create_enums",
                description="Create PostgreSQL enums for consistent data types",
                sql_up="""
                DO $$
                BEGIN
                    -- User roles enum
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                        CREATE TYPE userrole AS ENUM ('super_admin', 'admin', 'manager', 'analyst', 'viewer');
                    END IF;
                    
                    -- User status enum
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userstatus') THEN
                        CREATE TYPE userstatus AS ENUM ('active', 'inactive', 'suspended', 'pending');
                    END IF;
                    
                    -- Data source type enum
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'datasourcetype') THEN
                        CREATE TYPE datasourcetype AS ENUM (
                            'csv_upload', 'postgresql', 'mysql', 'mssql', 'oracle', 
                            'mongodb', 'api_endpoint', 'file_system', 'cloud_storage'
                        );
                    END IF;
                    
                    -- Analysis status enum
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysisstatus') THEN
                        CREATE TYPE analysisstatus AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
                    END IF;
                    
                    -- Audit action enum
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auditaction') THEN
                        CREATE TYPE auditaction AS ENUM (
                            'login', 'logout', 'data_upload', 'analysis_run', 'report_generate',
                            'user_create', 'user_update', 'user_delete', 'settings_change', 'export_data'
                        );
                    END IF;
                END
                $$;
                """,
                sql_down="""
                DROP TYPE IF EXISTS auditaction CASCADE;
                DROP TYPE IF EXISTS analysisstatus CASCADE;
                DROP TYPE IF EXISTS datasourcetype CASCADE;
                DROP TYPE IF EXISTS userstatus CASCADE;
                DROP TYPE IF EXISTS userrole CASCADE;
                """,
                estimated_duration=5
            ),
            
            MigrationStep(
                step_id="create_core_tables",
                description="Create core application tables",
                sql_up="""
                -- Users table
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    role userrole NOT NULL DEFAULT 'viewer',
                    status userstatus NOT NULL DEFAULT 'pending',
                    department VARCHAR(100),
                    position VARCHAR(100),
                    phone VARCHAR(20),
                    last_login TIMESTAMP WITH TIME ZONE,
                    password_changed_at TIMESTAMP WITH TIME ZONE,
                    failed_login_attempts INTEGER DEFAULT 0,
                    is_locked BOOLEAN DEFAULT false,
                    locked_until TIMESTAMP WITH TIME ZONE,
                    preferences JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_by UUID REFERENCES users(id)
                );
                
                -- User sessions table
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    session_token VARCHAR(255) UNIQUE NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    is_active BOOLEAN DEFAULT true NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """,
                sql_down="""
                DROP TABLE IF EXISTS user_sessions CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
                """,
                estimated_duration=10
            ),
            
            MigrationStep(
                step_id="create_data_tables",
                description="Create data source and dataset tables",
                sql_up="""
                -- Data sources table
                CREATE TABLE IF NOT EXISTS data_sources (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    source_type datasourcetype NOT NULL,
                    connection_config JSONB,
                    owner_id UUID NOT NULL REFERENCES users(id),
                    is_active BOOLEAN DEFAULT true NOT NULL,
                    last_sync TIMESTAMP WITH TIME ZONE,
                    sync_frequency VARCHAR(50),
                    row_count BIGINT,
                    schema_info JSONB,
                    health_status VARCHAR(20) DEFAULT 'unknown',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                -- Datasets table
                CREATE TABLE IF NOT EXISTS datasets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    file_hash VARCHAR(64),
                    file_size BIGINT,
                    file_path VARCHAR(500),
                    row_count BIGINT,
                    column_count INTEGER,
                    schema_info JSONB,
                    data_quality_score DECIMAL(3,2),
                    processing_status VARCHAR(20) DEFAULT 'pending',
                    error_message TEXT,
                    metadata JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    processed_at TIMESTAMP WITH TIME ZONE
                );
                """,
                sql_down="""
                DROP TABLE IF EXISTS datasets CASCADE;
                DROP TABLE IF EXISTS data_sources CASCADE;
                """,
                estimated_duration=15
            ),
            
            MigrationStep(
                step_id="create_financial_tables",
                description="Create financial data and analysis tables",
                sql_up="""
                -- Financial records table (partitioned by date)
                CREATE TABLE IF NOT EXISTS financial_records (
                    id BIGSERIAL PRIMARY KEY,
                    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    record_date TIMESTAMP WITH TIME ZONE,
                    account_id VARCHAR(100),
                    transaction_id VARCHAR(100),
                    amount DECIMAL(15,2),
                    currency VARCHAR(3),
                    category VARCHAR(100),
                    subcategory VARCHAR(100),
                    description TEXT,
                    counterparty VARCHAR(255),
                    tags TEXT[],
                    raw_data JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                
                -- Analyses table
                CREATE TABLE IF NOT EXISTS analyses (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    created_by UUID NOT NULL REFERENCES users(id),
                    analysis_type VARCHAR(50) NOT NULL,
                    status analysisstatus NOT NULL DEFAULT 'pending',
                    parameters JSONB,
                    results JSONB,
                    execution_time DECIMAL(8,3),
                    memory_usage BIGINT,
                    error_message TEXT,
                    confidence_score DECIMAL(3,2),
                    insights_generated INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    started_at TIMESTAMP WITH TIME ZONE,
                    completed_at TIMESTAMP WITH TIME ZONE
                );
                
                -- Narratives table
                CREATE TABLE IF NOT EXISTS narratives (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
                    narrative_type VARCHAR(50) NOT NULL,
                    user_role VARCHAR(20) NOT NULL,
                    tone VARCHAR(20) NOT NULL,
                    length VARCHAR(20) NOT NULL,
                    headline VARCHAR(500),
                    executive_summary TEXT,
                    key_insights JSONB,
                    recommendations JSONB,
                    financial_metrics JSONB,
                    risk_assessment JSONB,
                    market_context JSONB,
                    compliance_notes JSONB,
                    confidence_score DECIMAL(3,2),
                    generation_time DECIMAL(6,3),
                    model_used VARCHAR(50),
                    cache_hit BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                """,
                sql_down="""
                DROP TABLE IF EXISTS narratives CASCADE;
                DROP TABLE IF EXISTS analyses CASCADE;
                DROP TABLE IF EXISTS financial_records CASCADE;
                """,
                estimated_duration=20
            ),
            
            MigrationStep(
                step_id="create_system_tables",
                description="Create system monitoring and audit tables",
                sql_up="""
                -- System metrics table
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id BIGSERIAL PRIMARY KEY,
                    metric_name VARCHAR(100) NOT NULL,
                    metric_value DECIMAL(15,6) NOT NULL,
                    metric_unit VARCHAR(20),
                    source_component VARCHAR(50) NOT NULL,
                    hostname VARCHAR(100),
                    metadata JSONB,
                    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                
                -- Audit logs table
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id BIGSERIAL PRIMARY KEY,
                    user_id UUID REFERENCES users(id),
                    session_id UUID REFERENCES user_sessions(id),
                    action auditaction NOT NULL,
                    resource_type VARCHAR(50),
                    resource_id VARCHAR(100),
                    details JSONB,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    request_id VARCHAR(100),
                    status_code INTEGER,
                    error_message TEXT,
                    execution_time DECIMAL(8,3),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                
                -- Cache entries table
                CREATE TABLE IF NOT EXISTS cache_entries (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    cache_key VARCHAR(255) UNIQUE NOT NULL,
                    cache_value JSONB NOT NULL,
                    cache_type VARCHAR(50) NOT NULL,
                    size_bytes INTEGER,
                    hit_count INTEGER DEFAULT 0,
                    expires_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                -- System configuration table
                CREATE TABLE IF NOT EXISTS system_configurations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    config_key VARCHAR(100) UNIQUE NOT NULL,
                    config_value JSONB NOT NULL,
                    config_type VARCHAR(50) NOT NULL,
                    description TEXT,
                    is_sensitive BOOLEAN DEFAULT false NOT NULL,
                    is_editable BOOLEAN DEFAULT true NOT NULL,
                    updated_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                -- Financial KPIs table
                CREATE TABLE IF NOT EXISTS financial_kpis (
                    id BIGSERIAL PRIMARY KEY,
                    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
                    kpi_name VARCHAR(100) NOT NULL,
                    kpi_value DECIMAL(15,6) NOT NULL,
                    kpi_unit VARCHAR(20),
                    calculation_method VARCHAR(100),
                    benchmark_value DECIMAL(15,6),
                    variance_pct DECIMAL(5,2),
                    trend_direction VARCHAR(20),
                    confidence_level DECIMAL(3,2),
                    period_start TIMESTAMP WITH TIME ZONE,
                    period_end TIMESTAMP WITH TIME ZONE,
                    metadata JSONB,
                    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                
                -- Data lineage table
                CREATE TABLE IF NOT EXISTS data_lineage (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    source_dataset_id UUID REFERENCES datasets(id),
                    target_dataset_id UUID REFERENCES datasets(id),
                    transformation_type VARCHAR(50) NOT NULL,
                    transformation_details JSONB,
                    columns_mapping JSONB,
                    quality_impact DECIMAL(3,2),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
                """,
                sql_down="""
                DROP TABLE IF EXISTS data_lineage CASCADE;
                DROP TABLE IF EXISTS financial_kpis CASCADE;
                DROP TABLE IF EXISTS system_configurations CASCADE;
                DROP TABLE IF EXISTS cache_entries CASCADE;
                DROP TABLE IF EXISTS audit_logs CASCADE;
                DROP TABLE IF EXISTS system_metrics CASCADE;
                """,
                estimated_duration=25
            )
        ]
        
        return Migration(
            version="1.0.0",
            name="Initial Schema Creation",
            description="Create all core tables and data structures for Sygnify Financial Analytics",
            author="Sygnify Development Team",
            created_at=datetime.utcnow(),
            steps=steps,
            rollback_safe=True,
            requires_downtime=False,
            estimated_duration=75
        )
    
    @staticmethod
    def get_performance_indexes_migration() -> Migration:
        """Performance optimization indexes migration"""
        
        steps = [
            MigrationStep(
                step_id="create_user_indexes",
                description="Create performance indexes for user tables",
                sql_up="""
                -- User table indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status ON users(role, status);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_department ON users(department);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
                
                -- User sessions indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, is_active);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_last_activity ON user_sessions(last_activity);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_hash ON user_sessions USING hash(session_token);
                """,
                sql_down="""
                DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_token_hash;
                DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_last_activity;
                DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_expires_at;
                DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_user_active;
                DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_lower;
                DROP INDEX CONCURRENTLY IF EXISTS idx_users_created_at;
                DROP INDEX CONCURRENTLY IF EXISTS idx_users_department;
                DROP INDEX CONCURRENTLY IF EXISTS idx_users_role_status;
                """,
                estimated_duration=30
            ),
            
            MigrationStep(
                step_id="create_financial_indexes",
                description="Create high-performance indexes for financial data",
                sql_up="""
                -- Financial records indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_dataset_date 
                    ON financial_records(dataset_id, record_date);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_amount_category 
                    ON financial_records(amount, category) WHERE amount IS NOT NULL;
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_account_date 
                    ON financial_records(account_id, record_date) WHERE account_id IS NOT NULL;
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_counterparty 
                    ON financial_records(counterparty) WHERE counterparty IS NOT NULL;
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_currency 
                    ON financial_records(currency) WHERE currency IS NOT NULL;
                
                -- BRIN indexes for large datasets
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_amount_brin 
                    ON financial_records USING BRIN(amount) WHERE amount IS NOT NULL;
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_date_brin 
                    ON financial_records USING BRIN(record_date) WHERE record_date IS NOT NULL;
                """,
                sql_down="""
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_date_brin;
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_amount_brin;
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_currency;
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_counterparty;
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_account_date;
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_amount_category;
                DROP INDEX CONCURRENTLY IF EXISTS idx_financial_records_dataset_date;
                """,
                estimated_duration=45
            ),
            
            MigrationStep(
                step_id="create_analytics_indexes",
                description="Create indexes for analytics and monitoring",
                sql_up="""
                -- Analysis indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyses_dataset_status 
                    ON analyses(dataset_id, status);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyses_user_created 
                    ON analyses(created_by, created_at);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyses_type_status 
                    ON analyses(analysis_type, status);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyses_completed_at 
                    ON analyses(completed_at) WHERE completed_at IS NOT NULL;
                
                -- Narrative indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_narratives_analysis_type 
                    ON narratives(analysis_id, narrative_type);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_narratives_role_created 
                    ON narratives(user_role, created_at);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_narratives_model_confidence 
                    ON narratives(model_used, confidence_score);
                
                -- System metrics indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_name_recorded 
                    ON system_metrics(metric_name, recorded_at DESC);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_component_recorded 
                    ON system_metrics(source_component, recorded_at DESC);
                
                -- Audit logs indexes
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action 
                    ON audit_logs(user_id, action);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_created 
                    ON audit_logs(action, created_at DESC);
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ip_created 
                    ON audit_logs(ip_address, created_at) WHERE ip_address IS NOT NULL;
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource 
                    ON audit_logs(resource_type, resource_id) WHERE resource_type IS NOT NULL;
                """,
                sql_down="""
                DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_resource;
                DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_ip_created;
                DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_action_created;
                DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_user_action;
                DROP INDEX CONCURRENTLY IF EXISTS idx_system_metrics_component_recorded;
                DROP INDEX CONCURRENTLY IF EXISTS idx_system_metrics_name_recorded;
                DROP INDEX CONCURRENTLY IF EXISTS idx_narratives_model_confidence;
                DROP INDEX CONCURRENTLY IF EXISTS idx_narratives_role_created;
                DROP INDEX CONCURRENTLY IF EXISTS idx_narratives_analysis_type;
                DROP INDEX CONCURRENTLY IF EXISTS idx_analyses_completed_at;
                DROP INDEX CONCURRENTLY IF EXISTS idx_analyses_type_status;
                DROP INDEX CONCURRENTLY IF EXISTS idx_analyses_user_created;
                DROP INDEX CONCURRENTLY IF EXISTS idx_analyses_dataset_status;
                """,
                estimated_duration=60
            )
        ]
        
        return Migration(
            version="1.1.0",
            name="Performance Indexes",
            description="Add comprehensive performance indexes for all core tables",
            author="Sygnify Development Team",
            created_at=datetime.utcnow(),
            steps=steps,
            rollback_safe=True,
            requires_downtime=False,
            estimated_duration=135
        )

def run_initial_migrations():
    """Run initial database setup migrations"""
    
    executor = MigrationExecutor()
    
    # Get defined migrations
    migrations = [
        SygnifyMigrations.get_initial_schema_migration(),
        SygnifyMigrations.get_performance_indexes_migration()
    ]
    
    logger.info("Starting database migration process")
    
    for migration in migrations:
        if not executor.is_migration_applied(migration.version):
            logger.info(f"Applying migration {migration.version}: {migration.name}")
            success = executor.apply_migration(migration)
            
            if not success:
                logger.error(f"Migration {migration.version} failed. Stopping migration process.")
                return False
        else:
            logger.info(f"Migration {migration.version} already applied, skipping")
    
    logger.info("All migrations completed successfully")
    return True

def get_migration_status() -> Dict[str, Any]:
    """Get current migration status"""
    
    try:
        executor = MigrationExecutor()
        return executor.get_migration_status()
    except Exception as e:
        logger.error(f"Failed to get migration status: {e}")
        return {
            "error": str(e),
            "applied_migrations": [],
            "total_applied": 0,
            "recent_logs": []
        }