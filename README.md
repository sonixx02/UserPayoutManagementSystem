````md
# User Payout Management System

A backend application that manages payouts for affiliate sales.

Every sale starts as **pending**. Users can receive a **10% advance payout** on pending sales. Later, an admin approves or rejects each sale, and the system calculates the final payout.

The system also makes sure that:

- Each sale receives the advance payout only once.
- Users can withdraw only once every 24 hours.
- Failed payouts are automatically credited back to the user's balance.

Built using **Node.js**, **Express**, and **SQLite**.

## Project Documents

- `DESIGN.md` – Complete low level design
- `DECISIONS.md` – Design decisions and trade offs

---

# Run the project

Clone the repository and install the dependencies.

```bash
git clone <repo-url>
cd user-payout-management-system
npm install
```

Run the assignment example.

```bash
npm run demo
```

Start the server.

```bash
npm start
```

The API will be available at:

```
http://localhost:3000
```

Run the tests.

```bash
npm test
```

---

# How it works

- Money is stored in **paise** instead of decimal values.
- Every balance update is stored as a transaction.
- The current balance is calculated from these transactions.
- Every pending sale can receive its advance payout only once.
- When a sale is approved, the remaining amount is added to the balance.
- When a sale is rejected, the advance amount is deducted.
- If a payout fails, the amount is automatically credited back.

---

# Assignment example

Three pending sales worth **₹40** each.

Advance paid:

- Sale 1 → ₹4
- Sale 2 → ₹4
- Sale 3 → ₹4

After reconciliation:

| Sale | Status | Balance Change |
|------|--------|---------------:|
| 1 | Rejected | -₹4 |
| 2 | Approved | +₹36 |
| 3 | Approved | +₹36 |

Final balance

```
-4 + 36 + 36 = ₹68
```

Running

```bash
npm run demo
```

produces the same result.

---

# API Endpoints

| Method | Endpoint |
|---------|----------|
| POST | /users |
| GET | /users |
| POST | /brands |
| GET | /brands |
| POST | /sales |
| POST | /jobs/advance-payout |
| POST | /sales/:id/reconcile |
| GET | /users/:id/balance |
| POST | /users/:id/withdrawals |
| POST | /payouts/:id/status |
| GET | /users/:id/transactions |
| GET | /users/:id/payouts |
| GET | /users/:id/sales |

---

# Finding IDs

Some endpoints need IDs returned by earlier requests.

- **userId** – Create a user using `POST /users`, or get it from `GET /users`.
- **saleId** – Returned by `POST /sales`. You can also find it using `GET /users/{userId}/sales`.
- **advancePayoutId** – After running the advance payout job, call `GET /users/{userId}/payouts` and copy the advance payout `id`.
- **withdrawalPayoutId** – Returned by `POST /users/{userId}/withdrawals`. You can also find it using `GET /users/{userId}/payouts`.

---

# Using Swagger

If you're testing the API from **/docs**, follow this order.

### 1. Create a user

```
POST /users
```

```json
{
  "id": "john_doe"
}
```

---

### 2. Create a sale

```
POST /sales
```

```json
{
  "userId": "john_doe",
  "brand": "brand_1",
  "earning": 40
}
```

Save the returned **saleId**.

---

### 3. Run the advance payout job

```
POST /jobs/advance-payout
```

---

### 4. Get the advance payout ID

```
GET /users/john_doe/payouts
```

Save the returned **advancePayoutId**.

---

### 5. Mark the advance payout as successful

```
POST /payouts/{advancePayoutId}/status
```

```json
{
  "status": "success"
}
```

---

### 6. Reconcile the sale

```
POST /sales/{saleId}/reconcile
```

```json
{
  "status": "approved"
}
```

---

### 7. Check the balance

```
GET /users/john_doe/balance
```

The balance should now be **₹36**.

---

### 8. Withdraw the balance

```
POST /users/john_doe/withdrawals
```

```json
{
  "amount": 36
}
```

Save the returned **withdrawalPayoutId**.

---

### 9. Simulate a failed payout

```
POST /payouts/{withdrawalPayoutId}/status
```

```json
{
  "status": "failed"
}
```

Now call

```
GET /users/john_doe/balance
```

The withdrawn amount will be credited back automatically.

---

# Example using curl

```bash
# Create a user
curl -X POST localhost:3000/users \
-H "Content-Type: application/json" \
-d '{"id":"john_doe"}'

# Create a sale
curl -X POST localhost:3000/sales \
-H "Content-Type: application/json" \
-d '{"userId":"john_doe","brand":"brand_1","earning":40}'

# Run the advance payout job
curl -X POST localhost:3000/jobs/advance-payout \
-H "Content-Type: application/json" \
-d '{"userId":"john_doe"}'

# Get the advance payout ID
curl localhost:3000/users/john_doe/payouts

# Mark the advance payout as successful
curl -X POST localhost:3000/payouts/<advancePayoutId>/status \
-H "Content-Type: application/json" \
-d '{"status":"success"}'

# Reconcile the sale
curl -X POST localhost:3000/sales/<saleId>/reconcile \
-H "Content-Type: application/json" \
-d '{"status":"approved"}'

# Check the balance
curl localhost:3000/users/john_doe/balance

# Withdraw money
curl -X POST localhost:3000/users/john_doe/withdrawals \
-H "Content-Type: application/json" \
-d '{"amount":36}'

# Simulate a failed payout
curl -X POST localhost:3000/payouts/<withdrawalPayoutId>/status \
-H "Content-Type: application/json" \
-d '{"status":"failed"}'
```

---

# Seed data

When the server starts, it creates a few brands and a demo user.

Brands:

- brand_1 (10%)
- brand_2 (5%)
- brand_3 (2%)

A sample user called **demo_user** is also created with a few pending sales.

Try:

```bash
curl localhost:3000/users/demo_user/sales
```

---

# Project Structure

```
src
├── db
├── repositories
├── routes
├── services
├── app.js
├── container.js
├── money.js
└── server.js

scripts
└── demo.js

test
```

---



# Future improvements

These features were left out to keep the project focused on the assignment.

- Authentication and authorization.
- Webhook signature verification.
- API idempotency keys for retrying requests safely.
- Retry or timeout handling for payouts that never receive a callback.
- Handling chargebacks after a successful payout.
- Better support for running multiple server instances.
- Background workers for payment processing.


## Documentation

More details about the design are available in the `docs` folder:

- `docs/DESIGN.md` – System overview and architecture
- `docs/DATABASE.md` – Database schema and ER diagram
- `docs/WORKFLOWS.md` – Sequence diagrams
- `docs/EDGE_CASES.md` – Edge cases and validations
- `docs/DECISIONS.md` – Design decisions



