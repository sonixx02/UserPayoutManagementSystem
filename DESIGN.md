# low level design

low level design for affiliate payout engine handling advance payments reconciliation 24h withdrawals and failure recovery

---

## 1. core concept

affiliate users make sales which start in pending status
the system pays an advance of 10 percent on pending sales
later an admin reconciles each sale to approved or rejected
approved sales get the remaining earning minus advance
rejected sales claw back the advance
users can withdraw balance at most once per 24 hours
if a payout fails money is credited back so the user can try again

---

## 2. design principles

- **ledger based balance**: balance is the sum of ledger transactions rather than a mutable column
- **database unique constraints**: idempotency is guaranteed by database constraints instead of application level checks
- **integer paise**: money values are stored as integers in paise to eliminate floating point issues
- **guarded state transitions**: status changes are restricted to valid transitions to prevent duplicate processing

---

## 3. domain entities

- **users**: affiliate user owning sales payouts and transactions
- **brands**: merchant brand configuration defining advance rate in basis points
- **sales**: affiliate sales tracking status pending approved or rejected earning and advance status
- **payouts**: bank transfers marked as advance or withdrawal with status lifecycle
- **transactions**: immutable ledger entries for earning credits clawbacks debits and reversals

---

## 4. database schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY
);

CREATE TABLE brands (
    name TEXT PRIMARY KEY,
    advance_rate_bps INTEGER NOT NULL DEFAULT 1000 CHECK (advance_rate_bps BETWEEN 0 AND 10000)
);

CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    brand TEXT NOT NULL REFERENCES brands(name),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    earning_paise INTEGER NOT NULL CHECK (earning_paise >= 0),
    advance_paise INTEGER NOT NULL DEFAULT 0,
    advance_rate_bps INTEGER,
    advance_status TEXT NOT NULL DEFAULT 'none' CHECK (advance_status IN ('none','initiated','paid')),
    reconciled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    sale_id TEXT REFERENCES sales(id),
    type TEXT NOT NULL CHECK (type IN ('ADVANCE','WITHDRAWAL')),
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','processing','success','failed','cancelled','rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX uniq_advance_per_sale ON payouts(sale_id) WHERE type = 'ADVANCE';

CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('EARNING_CREDIT','CLAWBACK','WITHDRAWAL_DEBIT','REVERSAL')),
    amount_paise INTEGER NOT NULL,
    sale_id TEXT REFERENCES sales(id),
    payout_id TEXT REFERENCES payouts(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX uniq_reversal_per_payout ON transactions(payout_id) WHERE type = 'REVERSAL';
```

---

## 5. workflows

### advance job
1. finds pending sales with advance status none
2. creates advance payout entry with status initiated
3. confirms advance payout when webhook arrives setting advance status to paid

### reconciliation
1. checks if sale status is pending
2. updates sale status to approved or rejected
3. if approved credits earning minus advance
4. if rejected debits advance as clawback

### withdrawal
1. reads current ledger balance
2. checks if last non failed withdrawal was more than 24 hours ago
3. creates withdrawal payout and deducts amount from ledger

### failed payout recovery
1. webhook receives failed cancelled or rejected payout status
2. updates payout status
3. adds reversal transaction to ledger returning money to user balance
