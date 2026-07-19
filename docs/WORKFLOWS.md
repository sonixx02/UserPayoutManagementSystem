# Workflows

This document explains the main workflows of the system.

---

# 1. Advance Payout

The advance payout job checks all eligible pending sales and creates advance payouts.

```mermaid
sequenceDiagram
    participant Job as Advance Job
    participant Service as AdvanceService
    participant DB as Database
    participant PSP as Payment Provider

    Job->>Service: Run advance payout job
    Service->>DB: Find eligible pending sales

    loop For each sale
        Service->>DB: Mark advance as initiated
        Service->>DB: Create advance payout
    end

    PSP-->>Service: Payout status callback

    alt Success
        Service->>DB: Mark advance as paid
    else Failed
        Service->>DB: Reset advance status
    end
```

---

# 2. Sale Reconciliation

An admin reviews every sale and marks it as Approved or Rejected.

```mermaid
sequenceDiagram
    participant Admin
    participant Service as ReconciliationService
    participant DB as Database

    Admin->>Service: Reconcile sale

    Service->>DB: Validate sale

    alt Approved
        Service->>DB: Credit remaining amount
    else Rejected
        Service->>DB: Deduct advance amount
    end

    Service->>DB: Mark sale as reconciled
```

---

# 3. Withdrawal

Users can withdraw their available balance once every 24 hours.

```mermaid
sequenceDiagram
    participant User
    participant Service as WithdrawalService
    participant DB as Database
    participant PSP as Payment Provider

    User->>Service: Request withdrawal

    Service->>DB: Check available balance
    Service->>DB: Check last withdrawal

    alt Request allowed
        Service->>DB: Create withdrawal payout
        Service->>DB: Debit balance
        Service-->>PSP: Send payout
    else Request rejected
        Service-->>User: Return error
    end
```

---

# 4. Failed Payout Recovery

If a withdrawal fails, the money is returned to the user's balance.

```mermaid
sequenceDiagram
    participant PSP as Payment Provider
    participant Service as PayoutService
    participant DB as Database

    PSP->>Service: Failed payout callback

    Service->>DB: Update payout status
    Service->>DB: Credit balance
    Service->>DB: Create refund transaction
```
