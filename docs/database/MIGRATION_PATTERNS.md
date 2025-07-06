# Database Migration Patterns

This document outlines patterns and best practices for safely evolving the database schema in Omnia.

## 🎯 Migration Philosophy

Database migrations should be:
- **Reversible** - Always provide a way to roll back
- **Zero-downtime** - Don't break the running application  
- **Incremental** - Small, focused changes
- **Tested** - Verify in staging before production

## 📋 Migration Structure

### Migration File Template
```sql
-- Migration: YYYYMMDD_NNN_description.sql
-- Description: Brief description of changes
-- Author: Name
-- Date: YYYY-MM-DD

BEGIN;

-- Pre-migration validation
DO $$
BEGIN
    -- Check preconditions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'required_table') THEN
        RAISE EXCEPTION 'Required table does not exist';
    END IF;
END
$$;

-- Migration steps
-- [Migration implementation here]

-- Post-migration validation  
DO $$
BEGIN
    -- Verify migration success
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'new_table' AND column_name = 'new_column') THEN
        RAISE EXCEPTION 'Migration validation failed';
    END IF;
END
$$;

-- Record migration
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('YYYYMMDD_NNN', 'Description of changes', NOW());

COMMIT;
```

## 🔄 Safe Migration Patterns

### 1. Adding Columns (Safe)
```sql
-- Add column with default value
ALTER TABLE user_enabled_modules 
ADD COLUMN priority INTEGER DEFAULT 0 NOT NULL;

-- Add index if needed
CREATE INDEX idx_user_enabled_modules_priority 
ON user_enabled_modules(priority) 
WHERE priority > 0;
```

### 2. Removing Columns (Two-Phase)
```sql
-- Phase 1: Stop using column in application
-- (Deploy application changes first)

-- Phase 2: Drop column after application deployment
ALTER TABLE user_enabled_modules 
DROP COLUMN IF EXISTS old_column;
```

### 3. Renaming Columns (Multi-Phase)
```sql
-- Phase 1: Add new column
ALTER TABLE user_data 
ADD COLUMN new_name TEXT;

-- Phase 2: Populate new column
UPDATE user_data 
SET new_name = old_name 
WHERE new_name IS NULL;

-- Phase 3: Update application to use new column
-- (Deploy application changes)

-- Phase 4: Drop old column
ALTER TABLE user_data 
DROP COLUMN old_name;
```

### 4. Adding Tables (Safe)
```sql
-- Safe to add new tables
CREATE TABLE new_feature_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE new_feature_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_feature_isolation" ON new_feature_data
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Add indexes
CREATE INDEX idx_new_feature_data_user_id 
ON new_feature_data(user_id) 
WHERE user_id IS NOT NULL;
```

## ⚠️ Dangerous Migration Patterns

### 1. Changing Column Types
```sql
-- ❌ DANGEROUS: Can cause data loss or app breakage
ALTER TABLE user_settings 
ALTER COLUMN setting_value TYPE INTEGER USING setting_value::INTEGER;

-- ✅ SAFE: Multi-phase approach
-- Phase 1: Add new column
ALTER TABLE user_settings 
ADD COLUMN setting_value_int INTEGER;

-- Phase 2: Populate and validate
UPDATE user_settings 
SET setting_value_int = setting_value::INTEGER 
WHERE setting_value ~ '^[0-9]+$';

-- Phase 3: Update application to use new column
-- Phase 4: Drop old column and rename new one
```

### 2. Adding NOT NULL Constraints
```sql
-- ❌ DANGEROUS: Will fail if existing NULLs
ALTER TABLE user_data 
ALTER COLUMN email SET NOT NULL;

-- ✅ SAFE: Clean data first
-- Phase 1: Clean existing data
UPDATE user_data 
SET email = 'unknown@example.com' 
WHERE email IS NULL;

-- Phase 2: Add constraint
ALTER TABLE user_data 
ALTER COLUMN email SET NOT NULL;
```

## 🧪 Migration Testing

### Pre-Migration Testing
```sql
-- Test migration on copy of production data
CREATE TABLE user_data_backup AS SELECT * FROM user_data;

-- Run migration on test table
-- ... migration steps ...

-- Validate results
SELECT COUNT(*) FROM user_data_backup; -- Should match original
SELECT * FROM user_data_backup WHERE problematic_condition; -- Should be empty
```

### Post-Migration Validation
```sql
-- Verify data integrity
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE created_at IS NULL) as missing_timestamps
FROM user_enabled_modules;

-- Check constraints
SELECT 
    constraint_name,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_enabled_modules';
```

## 🔙 Rollback Procedures

### Automatic Rollback Template
```sql
-- Rollback: YYYYMMDD_NNN_rollback_description.sql

BEGIN;

-- Reverse migration steps in opposite order
DROP INDEX IF EXISTS idx_new_column;
ALTER TABLE user_data DROP COLUMN IF EXISTS new_column;

-- Remove migration record
DELETE FROM schema_migrations 
WHERE version = 'YYYYMMDD_NNN';

COMMIT;
```

### Complex Rollback with Data Preservation
```sql
-- For migrations that modify data
BEGIN;

-- Restore from backup if available
INSERT INTO user_data 
SELECT * FROM user_data_backup_YYYYMMDD
WHERE id NOT IN (SELECT id FROM user_data);

-- Or reverse transformation
UPDATE user_data 
SET old_format_column = reverse_transform(new_format_column)
WHERE old_format_column IS NULL;

-- Remove new structures
DROP TABLE IF EXISTS new_feature_table;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = 'YYYYMMDD_NNN';

COMMIT;
```

## 📊 Migration Monitoring

### Performance Impact Monitoring
```sql
-- Monitor migration performance
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE last_autoanalyze > NOW() - INTERVAL '1 hour';
```

### Lock Monitoring
```sql
-- Check for blocking locks during migration
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity 
    ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
WHERE NOT blocked_locks.granted;
```

## 🚀 Migration Deployment Strategy

### Blue-Green Migration
```bash
# 1. Deploy new version to green environment
# 2. Run migration on green database
# 3. Verify migration success
# 4. Switch traffic to green environment
# 5. Keep blue environment as fallback
```

### Rolling Migration
```bash
# 1. Ensure migration is backward compatible
# 2. Run migration on production database
# 3. Deploy new application version gradually
# 4. Monitor for issues at each step
```

## 📋 Migration Checklist

### Pre-Migration
- [ ] Migration tested on production-like data
- [ ] Rollback procedure prepared and tested
- [ ] Application compatibility verified
- [ ] Performance impact assessed
- [ ] Backup created if needed
- [ ] Maintenance window scheduled if required

### During Migration
- [ ] Monitor system performance
- [ ] Check for blocking locks
- [ ] Verify migration progress
- [ ] Monitor application logs for errors
- [ ] Have rollback ready if needed

### Post-Migration
- [ ] Validate data integrity
- [ ] Check application functionality
- [ ] Monitor performance metrics
- [ ] Update documentation
- [ ] Clean up temporary structures
- [ ] Update schema diagrams

## 🔧 Migration Tools and Scripts

### Migration Runner Script
```typescript
// run-migration.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const runMigration = async (migrationFile: string) => {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) throw error;
        
        console.log(`Migration ${migrationFile} completed successfully`);
    } catch (error) {
        console.error(`Migration ${migrationFile} failed:`, error);
        throw error;
    }
};
```

### Schema Validation Script
```typescript
// validate-schema.ts
const validateSchema = async () => {
    const requiredTables = [
        'user_enabled_modules',
        'tracking_entries', 
        'plugin_configs'
    ];
    
    for (const table of requiredTables) {
        const { data, error } = await supabase
            .from(table)
            .select('count')
            .limit(1);
            
        if (error) {
            throw new Error(`Table ${table} validation failed: ${error.message}`);
        }
    }
    
    console.log('Schema validation passed');
};
```

## 📚 Related Documentation

- **[SUPABASE_DATABASE_ANALYSIS.md](./SUPABASE_DATABASE_ANALYSIS.md)** - Database architecture
- **[../security/RLS_SECURITY_ANALYSIS.md](../security/RLS_SECURITY_ANALYSIS.md)** - RLS patterns
- **[../LEARNINGS.md](../LEARNINGS.md)** - Migration-related patterns
- **[../development/DEBUGGING.md](../development/DEBUGGING.md)** - Troubleshooting migrations

---

*Safe migrations are the foundation of reliable database evolution. Always plan for rollback and test thoroughly.*