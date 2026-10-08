CREATE TABLE `post_revisions` (
	`post_id` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`live_payload` text,
	`action` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`post_id`, `version`)
);
--> statement-breakpoint
CREATE TRIGGER post_revision_insert AFTER INSERT ON posts BEGIN
  INSERT OR IGNORE INTO post_revisions (post_id,version,payload,live_payload,action,created_at)
  VALUES (NEW.id,NEW.version,NEW.payload,NEW.live_payload,
    CASE WHEN NEW.live_payload=NEW.payload THEN 'Published' ELSE 'Draft saved' END,NEW.updated_at);
END;
--> statement-breakpoint
CREATE TRIGGER post_revision_update AFTER UPDATE OF payload,live_payload,version ON posts BEGIN
  INSERT OR IGNORE INTO post_revisions (post_id,version,payload,live_payload,action,created_at)
  VALUES (OLD.id,OLD.version,OLD.payload,OLD.live_payload,'Previous saved version',OLD.updated_at);
  INSERT OR IGNORE INTO post_revisions (post_id,version,payload,live_payload,action,created_at)
  VALUES (NEW.id,NEW.version,NEW.payload,NEW.live_payload,
    CASE WHEN NEW.live_payload IS NULL AND OLD.live_payload IS NOT NULL THEN 'Unpublished'
         WHEN NEW.live_payload=NEW.payload THEN 'Published' ELSE 'Draft saved' END,NEW.updated_at);
END;
