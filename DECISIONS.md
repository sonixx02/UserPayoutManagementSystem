# design decisions

simple explanations for engineering choices made in this repository

---

## why sqlite and better sqlite3

sqlite needs zero external setup making it easy to clone run and test instantly
better sqlite3 allows plain sql so constraints are clear in database schema

---

## why integer paise

floats introduce rounding errors in financial math
storing values as integer paise ensures exact calculations where 1 rupee equals 100 paise

---

## why append only ledger

derived balance from ledger entries ensures full auditability
reversals and adjustments become new entries without overwriting existing data

---

## why database unique constraints for advance

app level checks can race under concurrent execution
unique database constraints physically prevent duplicate advance payouts per sale

---

## why 24 hour withdrawal rule ignores failed withdrawals

if a withdrawal fails the user should be allowed to try withdrawing again immediately
only non failed withdrawals count toward the 24 hour limit

---

## why negative balances are allowed

if clawbacks exceed earned balance the negative balance is carried forward
future approved earnings naturally offset the negative balance until positive
