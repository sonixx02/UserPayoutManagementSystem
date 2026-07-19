# Validation and Edge Cases

This document lists the important validation rules and edge cases handled by the system.

| Scenario | Handling |
| --- | --- |
| Duplicate user ID | User creation is rejected because the ID already exists. |
| Unknown user | The request is rejected. |
| Unknown brand | The request is rejected. |
| Invalid earning amount | The sale is rejected if the earning is zero or negative. |
| Advance payout job runs multiple times | A sale receives only one advance payout. Duplicate payouts are prevented by the database. |
| Sale already reconciled | The request is rejected because a sale can only be reconciled once. |
| Reconciliation before advance confirmation | The request is rejected until the advance payout is completed. |
| Failed advance payout | The sale is reset so the next advance payout job can retry it. |
| Duplicate payout callback | Invalid or repeated status updates are ignored. |
| Withdrawal amount is zero or negative | The request is rejected. |
| Withdrawal amount is greater than available balance | The request is rejected. |
| Withdrawal within 24 hours | The request is rejected until the waiting period is over. |
| Failed withdrawal | The withdrawn amount is credited back to the user's balance. |
| Duplicate failed withdrawal callback | The refund is processed only once. |
| Multiple withdrawal requests at the same time | Database transactions prevent double spending. |
| Negative balance | The balance is allowed to become negative and future earnings reduce the outstanding amount. |
