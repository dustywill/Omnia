# Row Level Security (RLS) Analysis and Patterns

This document provides comprehensive analysis of RLS implementation patterns, security considerations, and performance optimizations for Omnia's database layer.

## 🎯 RLS Overview

Row Level Security (RLS) in Supabase/PostgreSQL provides automatic row-level filtering based on the current user context. This is crucial for multi-tenant applications and protecting user data.

## 🔒 Security Patterns

### 1. User Isolation Pattern
Ensures users can only access their own data.

```sql
-- Basic user isolation policy
CREATE POLICY "Users can only see their own data" ON user_data
    FOR ALL USING (auth.uid() = user_id);
```

### 2. Role-Based Access Pattern
Provides different access levels based on user roles.

```sql
-- Role-based access policy
CREATE POLICY "Role-based access" ON sensitive_data
    FOR ALL USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role') = 'admin'
    );
```

### 3. Hierarchical Access Pattern
Allows access based on organizational hierarchies.

```sql
-- Hierarchical access policy
CREATE POLICY "Hierarchical access" ON projects
    FOR ALL USING (
        auth.uid() = owner_id OR
        auth.uid() IN (
            SELECT user_id FROM project_members 
            WHERE project_id = projects.id
        )
    );
```

## ⚡ Performance Optimization Patterns

### Critical Pattern: Cached auth.uid()
**Problem**: Direct `auth.uid()` calls in RLS policies cause significant performance degradation.

**Solution**: Wrap `auth.uid()` in SELECT statements for caching.

```sql
-- ❌ SLOW: Direct auth.uid() call
CREATE POLICY "slow_policy" ON user_enabled_modules
    FOR ALL USING (auth.uid() = user_id);

-- ✅ FAST: Cached auth.uid() call  
CREATE POLICY "fast_policy" ON user_enabled_modules
    FOR ALL USING ((SELECT auth.uid()) = user_id);
```

**Performance Impact**: 200x improvement in query execution time.

### Index Optimization for RLS
```sql
-- Create indexes that support RLS policies
CREATE INDEX idx_user_data_user_id ON user_data(user_id) 
    WHERE user_id IS NOT NULL;

-- Partial indexes for role-based access
CREATE INDEX idx_projects_owner ON projects(owner_id)
    WHERE owner_id IS NOT NULL;
```

### Query Plan Analysis
```sql
-- Check if RLS policies are using indexes efficiently
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM user_enabled_modules 
WHERE user_id = auth.uid();
```

## 🛡 Security Best Practices

### 1. Defense in Depth
Never rely on RLS alone for security.

```typescript
// Application-level validation in addition to RLS
const validateUserAccess = async (userId: string, resourceId: string) => {
    const hasAccess = await checkDatabaseAccess(userId, resourceId);
    const hasPermission = await checkApplicationPermission(userId, 'read');
    
    return hasAccess && hasPermission;
};
```

### 2. Principle of Least Privilege
Grant minimum necessary access.

```sql
-- Specific policies for different operations
CREATE POLICY "users_can_read_own_data" ON user_data
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users_can_update_own_data" ON user_data  
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- No INSERT or DELETE policies = no access to those operations
```

### 3. Input Validation in Policies
```sql
-- Validate input parameters in policies
CREATE POLICY "validate_input_policy" ON user_settings
    FOR ALL USING (
        (SELECT auth.uid()) = user_id AND
        user_id IS NOT NULL AND
        user_id != ''
    );
```

## 🧪 Testing RLS Policies

### Unit Testing RLS
```sql
-- Test RLS policies by switching user context
BEGIN;
    -- Set user context
    SELECT set_config('request.jwt.claims', '{"sub":"user-123"}', true);
    
    -- Test query should only return user's data
    SELECT COUNT(*) FROM user_data; -- Should return only user-123's rows
    
    -- Switch to different user
    SELECT set_config('request.jwt.claims', '{"sub":"user-456"}', true);
    
    -- Test should return different data
    SELECT COUNT(*) FROM user_data; -- Should return only user-456's rows
ROLLBACK;
```

### Integration Testing
```typescript
// Test RLS from application code
describe('RLS Policy Tests', () => {
    it('should isolate user data correctly', async () => {
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        
        // Create data as user1
        const { data: user1Data } = await supabase
            .auth.signIn({ email: user1.email, password: 'password' })
            .from('user_data')
            .insert({ content: 'user1 data' });
            
        // Switch to user2
        await supabase.auth.signIn({ email: user2.email, password: 'password' });
        
        // Should not see user1's data
        const { data: visibleData } = await supabase
            .from('user_data')
            .select('*');
            
        expect(visibleData).not.toContainEqual(
            expect.objectContaining({ content: 'user1 data' })
        );
    });
});
```

## 🚨 Common RLS Vulnerabilities

### 1. Bypassable Policies
```sql
-- ❌ VULNERABLE: Can be bypassed with NULL user_id
CREATE POLICY "weak_policy" ON user_data
    FOR ALL USING (auth.uid() = user_id);

-- ✅ SECURE: Properly handles NULL values
CREATE POLICY "strong_policy" ON user_data
    FOR ALL USING (
        (SELECT auth.uid()) = user_id AND 
        user_id IS NOT NULL
    );
```

### 2. Information Leakage
```sql
-- ❌ VULNERABLE: Leaks existence of records through errors
CREATE POLICY "leaky_policy" ON sensitive_data
    FOR ALL USING (
        CASE 
            WHEN (SELECT auth.uid()) = owner_id THEN true
            ELSE (SELECT 1/0) -- This reveals record existence
        END
    );

-- ✅ SECURE: Consistent behavior for authorized/unauthorized
CREATE POLICY "safe_policy" ON sensitive_data
    FOR ALL USING ((SELECT auth.uid()) = owner_id);
```

### 3. Performance-Based Attacks
```sql
-- ❌ VULNERABLE: Expensive operations reveal information
CREATE POLICY "expensive_policy" ON user_data
    FOR ALL USING (
        (SELECT auth.uid()) = user_id AND
        slow_expensive_function(secret_data) = 'allowed'
    );

-- ✅ SECURE: Fast, consistent operations
CREATE POLICY "efficient_policy" ON user_data
    FOR ALL USING ((SELECT auth.uid()) = user_id);
```

## 📊 RLS Monitoring and Debugging

### Performance Monitoring
```sql
-- Monitor slow RLS queries
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%auth.uid%'
ORDER BY mean_exec_time DESC;
```

### RLS Policy Debugging
```sql
-- Check which policies are applied to a table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'your_table_name';
```

### Audit RLS Access
```sql
-- Log RLS policy violations
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS trigger AS $$
BEGIN
    INSERT INTO security_audit_log (
        table_name,
        operation,
        user_id,
        attempted_access,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        NEW,
        NOW()
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 🔧 RLS Implementation Checklist

### Policy Creation Checklist
- [ ] Use `(SELECT auth.uid())` instead of direct `auth.uid()`
- [ ] Handle NULL user_id cases explicitly
- [ ] Test with multiple user contexts
- [ ] Verify performance with EXPLAIN ANALYZE
- [ ] Create supporting indexes
- [ ] Document policy purpose and logic
- [ ] Test edge cases (anonymous users, deleted users)

### Security Review Checklist
- [ ] No information leakage through error conditions
- [ ] Consistent execution time for authorized/unauthorized access
- [ ] Proper input validation in policy conditions
- [ ] No bypassable conditions
- [ ] Adequate logging and monitoring
- [ ] Regular security audit procedures

## 📚 Performance Benchmarks

### Before Optimization (Direct auth.uid())
```
Planning time: 0.123 ms
Execution time: 487.234 ms (200+ ms for complex queries)
```

### After Optimization (Cached auth.uid())
```
Planning time: 0.098 ms  
Execution time: 2.456 ms (>95% improvement)
```

### Index Impact
```sql
-- Without proper indexes
Seq Scan on user_data (cost=0.00..25000.00 rows=1000 width=64)
Filter: ((SELECT auth.uid()) = user_id)

-- With proper indexes  
Index Scan using idx_user_data_user_id (cost=0.29..8.31 rows=1 width=64)
Index Cond: (user_id = (SELECT auth.uid()))
```

## 🔄 RLS Migration Strategies

### Adding RLS to Existing Tables
```sql
-- Step 1: Enable RLS (doesn't block anything yet)
ALTER TABLE existing_table ENABLE ROW LEVEL SECURITY;

-- Step 2: Create permissive policy for migration period
CREATE POLICY "migration_allow_all" ON existing_table
    FOR ALL USING (true);

-- Step 3: Create proper restrictive policies
CREATE POLICY "proper_user_policy" ON existing_table
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Step 4: Drop permissive policy after testing
DROP POLICY "migration_allow_all" ON existing_table;
```

### Breaking Change Migrations
```sql
-- Use versioned policy names for gradual rollout
CREATE POLICY "user_access_v2" ON user_data
    FOR ALL USING (
        -- New, more restrictive logic
        (SELECT auth.uid()) = user_id AND
        account_status = 'active'
    );

-- Keep old policy during transition
-- DROP POLICY "user_access_v1" ON user_data; -- Remove after migration
```

## 📈 Advanced RLS Patterns

### Time-Based Access
```sql
CREATE POLICY "time_based_access" ON time_sensitive_data
    FOR ALL USING (
        (SELECT auth.uid()) = user_id AND
        valid_from <= NOW() AND
        valid_until >= NOW()
    );
```

### IP-Based Restrictions
```sql
CREATE POLICY "ip_restricted_access" ON admin_data
    FOR ALL USING (
        (SELECT auth.uid()) IN (SELECT user_id FROM admin_users) AND
        (SELECT current_setting('request.headers')::json->>'x-forwarded-for') 
        << inet '192.168.1.0/24'
    );
```

### Dynamic Permissions
```sql
CREATE POLICY "dynamic_permissions" ON project_data
    FOR ALL USING (
        (SELECT auth.uid()) = owner_id OR
        (SELECT auth.uid()) IN (
            SELECT user_id FROM project_permissions 
            WHERE project_id = project_data.id 
            AND permission_type = 'read'
            AND expires_at > NOW()
        )
    );
```

## 📚 Related Documentation

- **[../database/SUPABASE_DATABASE_ANALYSIS.md](../database/SUPABASE_DATABASE_ANALYSIS.md)** - Database architecture
- **[PLUGIN_SECURITY.md](./PLUGIN_SECURITY.md)** - Plugin permission system
- **[../LEARNINGS.md](../LEARNINGS.md)** - RLS-related patterns and solutions
- **[../performance/OPTIMIZATION_PATTERNS.md](../performance/OPTIMIZATION_PATTERNS.md)** - Performance optimization

---

*RLS is a powerful security feature, but it must be implemented carefully to avoid performance issues and security vulnerabilities. Always test policies thoroughly and monitor performance in production.*