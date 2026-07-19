-- users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY
);

-- stores each brand and its advance rate
-- basis points are used instead of decimals
-- 1000 means 10 percent
CREATE TABLE IF NOT EXISTS brands (
    name TEXT PRIMARY KEY,
    advance_rate_bps INTEGER NOT NULL DEFAULT 1000
        CHECK (advance_rate_bps BETWEEN 0 AND 10000)
);

-- stores affiliate sale
-- sale starts as pending and later becomes approved or rejected
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    brand TEXT NOT NULL REFERENCES brands(name),

    -- current status of the sale
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),

    -- total earning from the sale
    earning_paise INTEGER NOT NULL CHECK (earning_paise >= 0),

    -- advance amount for this sale
    advance_paise INTEGER NOT NULL DEFAULT 0,

    -- advance rate used for this sale
    advance_rate_bps INTEGER,

    -- advance lifecycle can be none initiated or paid
    advance_status TEXT NOT NULL DEFAULT 'none'
        CHECK (advance_status IN ('none', 'initiated', 'paid')),

    -- set when the sale is reconciled
    reconciled_at TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);

-- helps in finding pending sales of a user faster
CREATE INDEX IF NOT EXISTS idx_sales_user_status
ON sales(user_id, status);

-- stores all payouts made to users
-- advance is automatic
-- withdrawal is requested by the user
CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    sale_id TEXT REFERENCES sales(id),

    type TEXT NOT NULL
        CHECK (type IN ('ADVANCE', 'WITHDRAWAL')),

    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),

    -- current payout status
    status TEXT NOT NULL DEFAULT 'initiated'
        CHECK (status IN ('initiated', 'processing', 'success',
                          'failed', 'cancelled', 'rejected')),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);

-- at most one live advance per sale
-- a failed advance drops out so it can be retried with a new payout
CREATE UNIQUE INDEX IF NOT EXISTS uniq_advance_per_sale
ON payouts(sale_id)
WHERE type = 'ADVANCE' AND status NOT IN ('failed', 'cancelled', 'rejected');

-- get payout history of a user
CREATE INDEX IF NOT EXISTS idx_payouts_user_type
ON payouts(user_id, type, created_at);

-- stores every balance change
-- balance is calculated from transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),

    -- types of balance change
    type TEXT NOT NULL
        CHECK (type IN (
            'EARNING_CREDIT',
            'CLAWBACK',
            'WITHDRAWAL_DEBIT',
            'REVERSAL'
        )),

    -- credit is positive and debit is negative
    amount_paise INTEGER NOT NULL,

    sale_id TEXT REFERENCES sales(id),
    payout_id TEXT REFERENCES payouts(id),

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);

-- helps in getting transactions of a user
CREATE INDEX IF NOT EXISTS idx_tx_user
ON transactions(user_id);

-- one payout gets only one reversal
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reversal_per_payout
ON transactions(payout_id)
WHERE type = 'REVERSAL';
