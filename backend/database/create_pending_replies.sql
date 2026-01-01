-- Create pending_replies table for tracking multiple replies
CREATE TABLE IF NOT EXISTS pending_replies (
    reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pending_id INTEGER NOT NULL,
    reply_date DATE NOT NULL,
    reply_content TEXT,
    replied_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pending_id) REFERENCES pending_items(pending_id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_replies_pending_id ON pending_replies(pending_id);
CREATE INDEX IF NOT EXISTS idx_pending_replies_reply_date ON pending_replies(reply_date);
