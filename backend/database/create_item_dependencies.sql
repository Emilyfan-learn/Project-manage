-- Create item_dependencies table for managing dependencies between WBS items
CREATE TABLE IF NOT EXISTS item_dependencies (
    dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Dependency relationship
    predecessor_id TEXT NOT NULL,              -- The item that must complete first (被依賴的)
    successor_id TEXT NOT NULL,                -- The item that depends on predecessor (依賴別人的)

    -- Dependency type
    dependency_type TEXT DEFAULT 'FS',         -- 'FS' / 'SS' / 'FF' / 'SF'
    /*
        FS (Finish-to-Start): Predecessor must finish before Successor can start
        SS (Start-to-Start): Predecessor must start before Successor can start
        FF (Finish-to-Finish): Predecessor must finish before Successor can finish
        SF (Start-to-Finish): Predecessor must start before Successor can finish
    */

    lag_days INTEGER DEFAULT 0,                -- Lag/Lead time in days (positive=lag, negative=lead)

    -- Impact assessment
    impact_level TEXT DEFAULT 'Medium',        -- 'Critical' / 'High' / 'Medium' / 'Low'
    impact_description TEXT,                   -- Description of impact

    -- Status
    is_active BOOLEAN DEFAULT 1,               -- Whether this dependency is active

    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (predecessor_id) REFERENCES tracking_items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (successor_id) REFERENCES tracking_items(item_id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_dependencies_predecessor ON item_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_successor ON item_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_active ON item_dependencies(is_active);
