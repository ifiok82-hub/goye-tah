# GOYE TRADE ASSURANCE HUB — Security Specification

## 1. Data Invariants
- A contract cannot have modified `docHash` or `createdAt` fields once signed and finalized.
- A user cannot set their own role to `isAdmin: true` during profile registration.
- A trade deal room cannot have its milestone list modified after completion or terminal status resolution.
- Disputes are system-locked and cannot be modified or cleared by normal users.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Admin Escalation Profile**: User registration containing `isAdmin: true` to hijack referee privileges.
2. **Contract Hash Spoof**: Altering a signed contract document's SHA-256 hash post-signing to invalidate legal compliance.
3. **Ghost Value Injection**: Adding undocumented fields (`isVerified`, `freeFunds`) to skip trade validation steps.
4. **Deal Amount Poisoning**: Modifying a finished transaction's total amount from `$10,000` to `$1`.
5. **Orphaned Dispute Submission**: Inserting a dispute document with a non-existent or foreign `dealId`.
6. **Denial of Wallet String Injection**: Bombarding ID paths with 1MB random characters to inflate Cloud Firestore operational costs.
7. **Identity Spoofing on Signatures**: Signing a contract with a third party's unauthorized verified email string.
8. **Negative Ledger Values**: Submitting negative values in items or subtotal amounts to manipulate payments.
9. **Fake Verification Registration**: Creating a duplicate verification entry using a previously verified hash.
10. **State Shortcut Manipulation**: Manually updating deal status from `Awaiting Payment` directly to `Completed` without verifying payment confirmations.
11. **PII Blanket Scraping**: Direct query lookups attempting to scrape all user profiles without filtering by ownership.
12. **Audit Trail Deletion**: Attempting to execute `deleteDoc` on immutable server-side operational audit logs.

## 3. Security Rules Verification State
All security rules block these payloads by enforcing:
- Default catch-all denials (`match /{document=**} { allow read, write: if false; }`).
- Strict schema validators requiring specific structure matches.
- Client write blocks on administrative or immutable elements.
