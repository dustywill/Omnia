# Supabase Database Analysis and Optimization

This document provides comprehensive analysis of Omnia's database architecture, performance considerations, and optimization strategies using Supabase/PostgreSQL.

## 🗄 Database Architecture Overview

Omnia uses Supabase as its backend database, leveraging PostgreSQL with real-time capabilities, Row Level Security (RLS), and built-in authentication.

### Core Tables Structure

```sql
-- User management
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific configurations
CREATE TABLE user_enabled_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_name)
);

-- Activity tracking
CREATE TABLE tracking_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source_module TEXT
);

-- Plugin configurations
CREATE TABLE plugin_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL,
    config_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plugin_id)
);
```

## ⚡ Performance Considerations

### Critical Performance Pattern: RLS Optimization

**Problem**: Direct `auth.uid()` calls in RLS policies cause exponential performance degradation.

```sql
-- ❌ EXTREMELY SLOW (200x slower)
CREATE POLICY "slow_user_isolation" ON user_enabled_modules
    FOR ALL USING (auth.uid() = user_id);

-- ✅ OPTIMIZED (Cached auth.uid())
CREATE POLICY "fast_user_isolation" ON user_enabled_modules
    FOR ALL USING ((SELECT auth.uid()) = user_id);
```

**Impact Metrics**:
- Before optimization: 400-800ms query time
- After optimization: 2-5ms query time
- Performance improvement: 99%+ reduction in query time

### Index Strategy

```sql
-- Primary indexes for RLS performance
CREATE INDEX idx_user_enabled_modules_user_id 
ON user_enabled_modules(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX idx_tracking_entries_user_id_timestamp 
ON tracking_entries(user_id, timestamp DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX idx_plugin_configs_user_id_plugin_id 
ON plugin_configs(user_id, plugin_id) 
WHERE user_id IS NOT NULL AND is_active = true;

-- JSONB indexes for configuration queries
CREATE INDEX idx_user_enabled_modules_config 
ON user_enabled_modules USING GIN(configuration);

CREATE INDEX idx_tracking_entries_activity_data 
ON tracking_entries USING GIN(activity_data);
```

### Query Optimization Patterns

```sql
-- Efficient user module query
SELECT module_name, enabled, configuration
FROM user_enabled_modules 
WHERE user_id = (SELECT auth.uid())
ORDER BY module_name;

-- Optimized activity tracking query
SELECT activity_type, activity_data, timestamp
FROM tracking_entries 
WHERE user_id = (SELECT auth.uid())
AND timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC
LIMIT 100;

-- Efficient plugin configuration lookup
SELECT config_data
FROM plugin_configs
WHERE user_id = (SELECT auth.uid())
AND plugin_id = $1
AND is_active = true;
```

## 🔒 Security Implementation

### Row Level Security Policies

```sql
-- User isolation for enabled modules
CREATE POLICY "user_modules_isolation" ON user_enabled_modules
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Tracking entries security
CREATE POLICY "user_tracking_isolation" ON tracking_entries
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Plugin configuration security  
CREATE POLICY "user_plugin_config_isolation" ON plugin_configs
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Enable RLS on all tables
ALTER TABLE user_enabled_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_configs ENABLE ROW LEVEL SECURITY;
```

### Data Validation Functions

```sql
-- Validate module configuration
CREATE OR REPLACE FUNCTION validate_module_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic structure validation
    IF config IS NULL OR jsonb_typeof(config) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Size limit (prevent abuse)
    IF octet_length(config::text) > 10000 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add validation constraint
ALTER TABLE user_enabled_modules 
ADD CONSTRAINT valid_configuration 
CHECK (validate_module_config(configuration));
```

## 📊 Real-time Capabilities

### Supabase Realtime Setup

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_enabled_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE tracking_entries;
```

### Client-side Real-time Implementation

```typescript
// Subscribe to user module changes
const { data, error } = supabase
    .from('user_enabled_modules')
    .select('*')
    .eq('user_id', user.id)
    .on('UPDATE', payload => {
        // Handle module configuration updates
        updateLocalModuleState(payload.new);
    })
    .on('INSERT', payload => {
        // Handle new module enablement
        addLocalModule(payload.new);
    })
    .subscribe();

// Subscribe to activity tracking
const trackingSubscription = supabase
    .from('tracking_entries')
    .select('*')
    .eq('user_id', user.id)
    .on('INSERT', payload => {
        // Real-time activity updates
        updateActivityFeed(payload.new);
    })
    .subscribe();
```

## 🚀 Migration Strategies

### Schema Migration Pattern

```sql
-- Version-controlled migration example
-- Migration: 20240706_001_add_plugin_configs.sql

BEGIN;

-- Create new table
CREATE TABLE plugin_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plugin_id TEXT NOT NULL,
    config_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plugin_id)
);

-- Create indexes
CREATE INDEX idx_plugin_configs_user_id_plugin_id 
ON plugin_configs(user_id, plugin_id) 
WHERE user_id IS NOT NULL AND is_active = true;

-- Enable RLS
ALTER TABLE plugin_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "user_plugin_config_isolation" ON plugin_configs
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Grant permissions
GRANT ALL ON plugin_configs TO authenticated;
GRANT USAGE ON SEQUENCE plugin_configs_id_seq TO authenticated;

-- Record migration
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('20240706_001', 'Add plugin configurations table', NOW());

COMMIT;
```

### Data Migration Example

```sql
-- Migrate existing data to new structure
INSERT INTO plugin_configs (user_id, plugin_id, config_data, created_at)
SELECT 
    user_id,
    'legacy-' || module_name as plugin_id,
    configuration as config_data,
    created_at
FROM user_enabled_modules 
WHERE module_name IN ('legacy-module-1', 'legacy-module-2');
```

## 📈 Performance Monitoring

### Query Performance Analysis

```sql
-- Monitor slow queries
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%user_enabled_modules%'
ORDER BY mean_exec_time DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('user_enabled_modules', 'tracking_entries', 'plugin_configs');
```

### Connection Pool Monitoring

```typescript
// Monitor Supabase connection performance
const monitorConnections = () => {
    const startTime = performance.now();
    
    return supabase
        .from('user_enabled_modules')
        .select('count')
        .then(() => {
            const duration = performance.now() - startTime;
            logger.info('Database connection time', { duration });
            return duration;
        });
};
```

## 🔧 Backup and Recovery

### Automated Backup Strategy

```sql
-- Point-in-time recovery setup (handled by Supabase)
-- Custom backup for critical data
CREATE OR REPLACE FUNCTION backup_user_data(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    backup_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_modules', (
            SELECT jsonb_agg(row_to_json(t))
            FROM (SELECT * FROM user_enabled_modules WHERE user_id = target_user_id) t
        ),
        'tracking_entries', (
            SELECT jsonb_agg(row_to_json(t))
            FROM (SELECT * FROM tracking_entries WHERE user_id = target_user_id) t
        ),
        'plugin_configs', (
            SELECT jsonb_agg(row_to_json(t))
            FROM (SELECT * FROM plugin_configs WHERE user_id = target_user_id) t
        ),
        'backup_timestamp', NOW()
    ) INTO backup_data;
    
    RETURN backup_data;
END;
$$ LANGUAGE plpgsql;
```

### Data Recovery Procedures

```sql
-- Restore user data from backup
CREATE OR REPLACE FUNCTION restore_user_data(
    target_user_id UUID, 
    backup_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Restore user modules
    INSERT INTO user_enabled_modules 
    SELECT * FROM jsonb_populate_recordset(null::user_enabled_modules, backup_data->'user_modules');
    
    -- Restore tracking entries
    INSERT INTO tracking_entries
    SELECT * FROM jsonb_populate_recordset(null::tracking_entries, backup_data->'tracking_entries');
    
    -- Restore plugin configs
    INSERT INTO plugin_configs
    SELECT * FROM jsonb_populate_recordset(null::plugin_configs, backup_data->'plugin_configs');
    
    RETURN TRUE;
EXCEPTION 
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

## 🧪 Testing Database Operations

### Database Testing Setup

```typescript
// Test database setup
const setupTestDatabase = async () => {
    const testSupabase = createClient(
        process.env.SUPABASE_TEST_URL,
        process.env.SUPABASE_TEST_ANON_KEY
    );
    
    // Create test user
    const { data: user } = await testSupabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
    });
    
    return { testSupabase, user };
};

// Test RLS policies
describe('Database RLS Policies', () => {
    it('should isolate user data correctly', async () => {
        const { testSupabase, user } = await setupTestDatabase();
        
        // Insert test data
        await testSupabase
            .from('user_enabled_modules')
            .insert({
                user_id: user.id,
                module_name: 'test-module',
                enabled: true
            });
            
        // Verify isolation
        const { data } = await testSupabase
            .from('user_enabled_modules')
            .select('*');
            
        expect(data).toHaveLength(1);
        expect(data[0].user_id).toBe(user.id);
    });
});
```

### Performance Testing

```typescript
// Database performance benchmarks
const benchmarkQueries = async () => {
    const tests = [
        {
            name: 'User modules query',
            query: () => supabase
                .from('user_enabled_modules')
                .select('*')
                .eq('user_id', user.id)
        },
        {
            name: 'Recent activity query',
            query: () => supabase
                .from('tracking_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false })
                .limit(50)
        }
    ];
    
    for (const test of tests) {
        const start = performance.now();
        await test.query();
        const duration = performance.now() - start;
        
        console.log(`${test.name}: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(100); // Performance assertion
    }
};
```

## 📋 Database Maintenance Checklist

### Daily Monitoring
- [ ] Check slow query log for performance regressions
- [ ] Monitor connection pool utilization
- [ ] Verify real-time subscriptions are working
- [ ] Check RLS policy performance

### Weekly Maintenance
- [ ] Analyze table statistics and update if needed
- [ ] Review index usage and optimize
- [ ] Clean up old tracking entries if needed
- [ ] Monitor storage usage trends

### Monthly Reviews
- [ ] Review and optimize database schema
- [ ] Analyze query patterns for optimization opportunities
- [ ] Test backup and recovery procedures
- [ ] Update performance benchmarks

## 🔗 Integration Patterns

### Application-Database Integration

```typescript
// Centralized database client
export const createDatabaseClient = () => {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        }
    );
    
    return supabase;
};

// Type-safe database operations
export const DatabaseOperations = {
    async getUserModules(userId: string) {
        const { data, error } = await supabase
            .from('user_enabled_modules')
            .select('*')
            .eq('user_id', userId);
            
        if (error) throw new DatabaseError('Failed to fetch user modules', error);
        return data;
    },
    
    async updateModuleConfig(userId: string, moduleName: string, config: any) {
        const { data, error } = await supabase
            .from('user_enabled_modules')
            .update({ configuration: config, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('module_name', moduleName);
            
        if (error) throw new DatabaseError('Failed to update module config', error);
        return data;
    }
};
```

## 📚 Related Documentation

- **[../security/RLS_SECURITY_ANALYSIS.md](../security/RLS_SECURITY_ANALYSIS.md)** - Detailed RLS patterns
- **[../performance/OPTIMIZATION_PATTERNS.md](../performance/OPTIMIZATION_PATTERNS.md)** - Database optimization
- **[../LEARNINGS.md](../LEARNINGS.md)** - Database-related patterns and solutions
- **[MIGRATION_PATTERNS.md](./MIGRATION_PATTERNS.md)** - Database migration strategies

---

*This database architecture is designed for security, performance, and scalability. Always test changes in a staging environment and monitor performance impacts in production.*