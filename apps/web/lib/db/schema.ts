import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  brandVoiceGuidance: text('brand_voice_guidance'),
  contactChannel: varchar('contact_channel', { length: 255 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// ReplyGenie Tables
export const rcConnections = pgTable('rc_connections', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  provider: varchar('provider', { length: 50 }).notNull().default('google'),
  accessToken: text('access_token'), // Encrypted
  refreshToken: text('refresh_token'), // Encrypted
  tokenExpiresAt: timestamp('token_expires_at'),
  scope: text('scope'),
  connectedBy: integer('connected_by')
    .notNull()
    .references(() => users.id),
  connectedAt: timestamp('connected_at').notNull().defaultNow(),
  lastSyncAt: timestamp('last_sync_at'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
});

export const rcLocations = pgTable('rc_locations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  connectionId: integer('connection_id')
    .notNull()
    .references(() => rcConnections.id),
  googleLocationId: varchar('google_location_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phoneNumber: varchar('phone_number', { length: 50 }),
  websiteUrl: text('website_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  syncCursor: timestamp('sync_cursor'), // For incremental sync
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  googleLocationIdIdx: index('rc_locations_google_location_id_idx').on(table.googleLocationId),
  teamIdIdx: index('rc_locations_team_id_idx').on(table.teamId),
}));

export const rcReviews = pgTable('rc_reviews', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  locationId: integer('location_id')
    .notNull()
    .references(() => rcLocations.id),
  googleReviewId: varchar('google_review_id', { length: 255 }).notNull().unique(),
  reviewerName: varchar('reviewer_name', { length: 255 }),
  reviewerProfilePhotoUrl: text('reviewer_profile_photo_url'),
  starRating: integer('star_rating').notNull(),
  comment: text('comment'),
  reviewCreateTime: timestamp('review_create_time').notNull(),
  reviewUpdateTime: timestamp('review_update_time'),
  replied: boolean('replied').notNull().default(false),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, drafted, posted
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  locationIdCreateTimeIdx: index('rc_reviews_location_id_create_time_idx').on(table.locationId, table.reviewCreateTime),
  googleReviewIdIdx: index('rc_reviews_google_review_id_idx').on(table.googleReviewId),
  teamIdIdx: index('rc_reviews_team_id_idx').on(table.teamId),
}));

export const rcDrafts = pgTable('rc_drafts', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id')
    .notNull()
    .references(() => rcReviews.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  draftText: text('draft_text').notNull(),
  wordCount: integer('word_count').notNull(),
  charCount: integer('char_count').notNull(),
  riskFlags: jsonb('risk_flags'), // { hasUrl: boolean, hasProfanity: boolean, tooLong: boolean }
  generatedBy: varchar('generated_by', { length: 50 }).notNull().default('ai'), // ai, user
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  editedBy: integer('edited_by').references(() => users.id),
  editedAt: timestamp('edited_at'),
});

export const rcReplies = pgTable('rc_replies', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id')
    .notNull()
    .references(() => rcReviews.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  replyText: text('reply_text').notNull(),
  postedBy: integer('posted_by')
    .notNull()
    .references(() => users.id),
  postedAt: timestamp('posted_at').notNull().defaultNow(),
  googleReplyId: varchar('google_reply_id', { length: 255 }),
  googleUpdateTime: timestamp('google_update_time'),
}, (table) => ({
  reviewIdUnique: unique('rc_replies_review_id_unique').on(table.reviewId),
}));

export const rcUsage = pgTable('rc_usage', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  postsCount: integer('posts_count').notNull().default(0),
  draftsCount: integer('drafts_count').notNull().default(0),
  quotaLimit: integer('quota_limit').notNull().default(50),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  teamIdMonthUnique: unique('rc_usage_team_id_month_unique').on(table.teamId, table.month),
}));

export const rcAuditLogs = pgTable('rc_audit_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // DRAFT_GENERATED, REPLY_POSTED, LOCATION_SYNCED, etc.
  entityType: varchar('entity_type', { length: 50 }).notNull(), // review, draft, reply, location, connection
  entityId: integer('entity_id'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  teamIdTimestampIdx: index('rc_audit_logs_team_id_timestamp_idx').on(table.teamId, table.timestamp),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// ReplyGenie Types
export type RcConnection = typeof rcConnections.$inferSelect;
export type NewRcConnection = typeof rcConnections.$inferInsert;
export type RcLocation = typeof rcLocations.$inferSelect;
export type NewRcLocation = typeof rcLocations.$inferInsert;
export type RcReview = typeof rcReviews.$inferSelect;
export type NewRcReview = typeof rcReviews.$inferInsert;
export type RcDraft = typeof rcDrafts.$inferSelect;
export type NewRcDraft = typeof rcDrafts.$inferInsert;
export type RcReply = typeof rcReplies.$inferSelect;
export type NewRcReply = typeof rcReplies.$inferInsert;
export type RcUsage = typeof rcUsage.$inferSelect;
export type NewRcUsage = typeof rcUsage.$inferInsert;
export type RcAuditLog = typeof rcAuditLogs.$inferSelect;
export type NewRcAuditLog = typeof rcAuditLogs.$inferInsert;
