# User Payout Management System

## System Design

This document gives an overview of the system. It explains how the application is organized, how money flows through the system, and how the different modules work together.

For more details, refer to the following documents in this folder:

* `DATABASE.md` – Database schema and ER diagram
* `WORKFLOWS.md` – Sequence diagrams
* `EDGE_CASES.md` – Validation and edge cases
* `DECISIONS.md` – Design decisions

---

# Problem Statement

The system manages payouts for affiliate sales.

Every sale starts in the **Pending** state. Users receive a **10% advance payout** for eligible pending sales.

Later, an admin reviews each sale and marks it as **Approved** or **Rejected**.

* Approved sales add the remaining amount to the user's balance.
* Rejected sales deduct the advance amount.

Users can withdraw their available balance once every 24 hours. If a payout fails, the amount is automatically credited back so it can be withdrawn again.

---

# System Overview

The application is divided into small modules, with each module handling one responsibility.

* User Management
* Brand Management
* Sales Management
* Advance Payout
* Reconciliation
* Withdrawals
* Failed Payout Recovery
* Transaction History

This keeps the business logic simple and easier to maintain.

---

# Main Components

## User

Represents an affiliate user. A user can have multiple sales, payouts and transactions.

---

## Brand

Stores the advance payout rate. Different brands can have different advance percentages.

---

## Sale

Represents one affiliate sale.

Each sale stores:
* User
* Brand
* Earnings
* Advance Amount
* Status

A sale follows this lifecycle:

```text
Pending
   │
   ├──► Approved
   │
   └──► Rejected
```

---

## Payout

Represents money sent to the user.

There are two payout types:
* Advance Payout
* Withdrawal

Each payout has its own status until it is completed.

---

## Transaction

Every balance update is stored as a transaction.
Instead of updating a balance directly, the current balance is calculated from all transactions.

---

# Money Flow

Money moves through the system in two stages.

### Stage 1

When a pending sale is created, the system calculates the advance amount and creates an advance payout.
This amount is sent directly to the user but is not added to the withdrawable balance.

### Stage 2

When the sale is reconciled:
* Approved → Remaining amount is credited to the balance.
* Rejected → Advance amount is deducted.

After reconciliation, the user can withdraw the available balance.

---

# Domain Model

```text
                User
             /    |    \
            /     |     \
        Sales  Payouts  Transactions
           |
           |
        Brand
```

The complete ER diagram is available in `DATABASE.md`.

---

# Architecture

The project follows a layered architecture.

```text
                Client
                   │
                   ▼
            Express Routes
                   │
                   ▼
               Services
                   │
                   ▼
            Repositories
                   │
                   ▼
                SQLite
```

---

# Services

| Service               | Responsibility                                           |
| --------------------- | -------------------------------------------------------- |
| AdvanceService        | Creates advance payouts for eligible sales               |
| ReconciliationService | Approves or rejects sales and updates the balance        |
| WithdrawalService     | Handles withdrawals and checks the 24 hour rule          |
| PayoutService         | Updates payout status and handles failed payout recovery |

---

# Assignment Example

Three pending sales worth **₹40** each.

Advance paid:
* Sale 1 → ₹4
* Sale 2 → ₹4
* Sale 3 → ₹4

After reconciliation:

| Sale | Status   | Balance Change |
| ---- | -------- | -------------: |
| 1    | Rejected |            -₹4 |
| 2    | Approved |           +₹36 |
| 3    | Approved |           +₹36 |

Final Balance:
```text
-4 + 36 + 36 = ₹68
```
