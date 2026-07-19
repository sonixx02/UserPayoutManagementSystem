# Design Decisions

This document lists the main design decisions made while building the project.

For more implementation details, refer to `DESIGN.md`.

---

# Database

* Used SQLite because it is lightweight and requires no setup.
* Used better-sqlite3 to write plain SQL instead of using an ORM.
* Kept database operations synchronous since SQLite runs in the same process as the application.

---

# Money

* Stored all money in paise instead of decimal values.
* Used basis points to represent advance payout rates.
* Calculated the advance using integer arithmetic.
* Rounded the advance amount down to avoid paying more than expected.

---

# IDs

* Used UUIDs for sales, payouts and transactions.
* Kept the user ID as provided because it comes from the upstream system.

---

# Data Model

* Stored every balance change as a transaction instead of maintaining a balance column.
* Calculated the current balance from the transaction history.
* Prevented duplicate advance payouts using database constraints.
* Marked a sale before creating its advance payout to avoid duplicate processing.
* Stored brands in the database so payout rates can be updated without changing the code.
* Used an upsert while creating brands so existing brands can be updated.

---

# Business Rules

* Created one advance payout for each eligible pending sale.
* Treated an advance payout as successful only after receiving confirmation from the payment provider.
* Added only the remaining amount to the balance when a sale is approved.
* Deducted the advance amount when a sale is rejected.
* Reset failed advance payouts so they can be retried.
* Credited failed withdrawals back to the user's balance.
* Ignored failed withdrawals while checking the 24 hour withdrawal limit.
* Allowed negative balances so future earnings can recover pending deductions.

---

# Reliability

* Used database transactions for withdrawals and reconciliation.
* Returned appropriate HTTP status codes for expected errors.
* Returned a generic message for unexpected server errors.
* Added graceful shutdown to close the database safely before stopping the application.
