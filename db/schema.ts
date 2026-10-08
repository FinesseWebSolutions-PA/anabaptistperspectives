import { sqliteTable,text,integer,index } from 'drizzle-orm/sqlite-core';
export const posts=sqliteTable('posts',{id:text('id').primaryKey(),payload:text('payload').notNull(),livePayload:text('live_payload'),version:integer('version').notNull().default(1),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()},t=>[index('posts_updated_idx').on(t.updatedAt)]);
export const media=sqliteTable('media',{id:text('id').primaryKey(),filename:text('filename').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),createdAt:text('created_at').notNull()});
