-- Row-Level Security (RLS) Policies for ReplyGenie
-- Ensures tenant isolation: users can only access data for their team

-- Enable RLS on all ReplyGenie tables
ALTER TABLE rc_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current team_id from session variable
-- This will be set by the application middleware on each request
CREATE OR REPLACE FUNCTION current_team_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.team_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RC_CONNECTIONS Policies
-- ============================================================================

-- SELECT: Users can view connections for their team
CREATE POLICY "Users can view their team's connections"
  ON rc_connections
  FOR SELECT
  USING (team_id = current_team_id());

-- INSERT: Users can create connections for their team
CREATE POLICY "Users can create connections for their team"
  ON rc_connections
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

-- UPDATE: Users can update their team's connections
CREATE POLICY "Users can update their team's connections"
  ON rc_connections
  FOR UPDATE
  USING (team_id = current_team_id())
  WITH CHECK (team_id = current_team_id());

-- DELETE: Users can delete their team's connections
CREATE POLICY "Users can delete their team's connections"
  ON rc_connections
  FOR DELETE
  USING (team_id = current_team_id());

-- ============================================================================
-- RC_LOCATIONS Policies
-- ============================================================================

CREATE POLICY "Users can view their team's locations"
  ON rc_locations
  FOR SELECT
  USING (team_id = current_team_id());

CREATE POLICY "Users can create locations for their team"
  ON rc_locations
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can update their team's locations"
  ON rc_locations
  FOR UPDATE
  USING (team_id = current_team_id())
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can delete their team's locations"
  ON rc_locations
  FOR DELETE
  USING (team_id = current_team_id());

-- ============================================================================
-- RC_REVIEWS Policies
-- ============================================================================

CREATE POLICY "Users can view their team's reviews"
  ON rc_reviews
  FOR SELECT
  USING (team_id = current_team_id());

CREATE POLICY "Users can create reviews for their team"
  ON rc_reviews
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can update their team's reviews"
  ON rc_reviews
  FOR UPDATE
  USING (team_id = current_team_id())
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can delete their team's reviews"
  ON rc_reviews
  FOR DELETE
  USING (team_id = current_team_id());

-- ============================================================================
-- RC_DRAFTS Policies
-- ============================================================================

CREATE POLICY "Users can view their team's drafts"
  ON rc_drafts
  FOR SELECT
  USING (team_id = current_team_id());

CREATE POLICY "Users can create drafts for their team"
  ON rc_drafts
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can update their team's drafts"
  ON rc_drafts
  FOR UPDATE
  USING (team_id = current_team_id())
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can delete their team's drafts"
  ON rc_drafts
  FOR DELETE
  USING (team_id = current_team_id());

-- ============================================================================
-- RC_REPLIES Policies
-- ============================================================================

CREATE POLICY "Users can view their team's replies"
  ON rc_replies
  FOR SELECT
  USING (team_id = current_team_id());

CREATE POLICY "Users can create replies for their team"
  ON rc_replies
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can update their team's replies"
  ON rc_replies
  FOR UPDATE
  USING (team_id = current_team_id())
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can delete their team's replies"
  ON rc_replies
  FOR DELETE
  USING (team_id = current_team_id());

-- ============================================================================
-- RC_USAGE Policies
-- ============================================================================

CREATE POLICY "Users can view their team's usage"
  ON rc_usage
  FOR SELECT
  USING (team_id = current_team_id());

CREATE POLICY "Users can create usage records for their team"
  ON rc_usage
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can update their team's usage"
  ON rc_usage
  FOR UPDATE
  USING (team_id = current_team_id())
  WITH CHECK (team_id = current_team_id());

CREATE POLICY "Users can delete their team's usage"
  ON rc_usage
  FOR DELETE
  USING (team_id = current_team_id());

-- ============================================================================
-- RC_AUDIT_LOGS Policies
-- ============================================================================

CREATE POLICY "Users can view their team's audit logs"
  ON rc_audit_logs
  FOR SELECT
  USING (team_id = current_team_id());

CREATE POLICY "Users can create audit logs for their team"
  ON rc_audit_logs
  FOR INSERT
  WITH CHECK (team_id = current_team_id());

-- Note: Audit logs should not be updated or deleted (immutable)
-- If needed, add UPDATE/DELETE policies with strict conditions

-- ============================================================================
-- Testing RLS Policies
-- ============================================================================

-- To test RLS policies:
-- 1. Set session variable: SET app.team_id = 1;
-- 2. Query tables: SELECT * FROM rc_locations;
-- 3. Should only return records for team_id = 1
-- 4. Try with different team_id or without setting it
-- 5. Should return no records or error

-- Example test queries:
-- SET app.team_id = 1;
-- SELECT * FROM rc_locations; -- Should return team 1's locations
-- SET app.team_id = 2;
-- SELECT * FROM rc_locations; -- Should return team 2's locations
-- RESET app.team_id;
-- SELECT * FROM rc_locations; -- Should return no records

-- ============================================================================
-- Notes
-- ============================================================================

-- 1. The app.team_id session variable must be set by the application
--    middleware on every request before any database queries.
--
-- 2. RLS policies are enforced at the database level, providing defense
--    in depth even if application logic has bugs.
--
-- 3. For superuser/admin access, you may need to bypass RLS using:
--    SET ROLE postgres; -- or similar superuser role
--
-- 4. Performance: RLS policies add a WHERE clause to every query.
--    Ensure proper indexes exist on team_id columns.
--
-- 5. All indexes on team_id already exist from previous migrations.
