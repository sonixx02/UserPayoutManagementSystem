# user payout management system

backend service built for managing affiliate sales payouts handling 10% advance payments reconciliation 24 hour withdrawal limits and failed payout recovery

---

## quick start

clone the repo install dependencies and run tests or demo

```bash
npm install
npm test      # runs unit tests
npm run demo  # runs the 68 rupee assignment walkthrough
npm start     # starts local server on http://localhost:3000
```

---

## interactive api docs

when the server is running open the swagger ui in your browser

```
http://localhost:3000/docs
```

openapi json spec is also available at `/openapi.json`

---

## how it works

- **integer paise**: all money is handled as integer paise to avoid float precision issues
- **append only ledger**: user balance is calculated from the sum of ledger transaction entries
- **database enforced idempotency**: advance payouts and refund reversals are prevented from duplicating by unique database constraints
- **two phase advance**: advance payout is initiated then confirmed by webhook before reconciliation nets it
- **failed payout recovery**: if a withdrawal or advance payout fails money is safely credited back to user balance

---

## documentation links

- [DESIGN.md](DESIGN.md) for database schema domain model and workflow details
- [DECISIONS.md](DECISIONS.md) for architectural trade offs and why choices were made
