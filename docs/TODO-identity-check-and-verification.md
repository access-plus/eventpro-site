# TODO: Complete Identity Check & Verification

This document tracks remaining work to make the KYC (Know Your Customer) / Complete Identity Check workflow **fully functional** end-to-end. The current implementation collects legal entity + address and submits to the backend; the items below are still required for production-ready verification and payouts.

---

## 1. ID Document Verification (Stripe Identity / Persona)

**Status:** Not started  
**Priority:** High

- [ ] Integrate **Stripe Identity** or **Persona** so users capture a photo of a government-issued ID (driver's license or passport) in-app.
- [ ] Frontend: Add flow to launch the provider's verification (redirect or embedded component) and obtain a **session/verification ID**.
- [ ] Pass that ID in `idSessionId` (and set `idProvider`) when calling `POST /api/v1/organizer/verification`.
- [ ] Backend: Optionally call the provider's API to confirm the session succeeded before marking verification as complete or in progress.

**Notes:** Step 3 of the Identity Check modal is currently a placeholder with an optional "Verification session ID" field. Until this is done, identity is not actually verified—only address and entity type are collected.

---

## 2. Backend Risk Scoring & Processing

**Status:** Not started  
**Priority:** High

- [ ] When a KYC submission is created, set user `verification_status` to **IN_PROGRESS** when processing starts (e.g. via background job or async handler).
- [ ] Implement **OFAC (or other watchlist) check** on name/DOB/address (and ID data when available).
- [ ] Implement **ID verification result** check from Stripe/Persona (if integrated in §1).
- [ ] Store risk-check results (e.g. `watchlist_checked_at`, `watchlist_result`, `id_verification_result`) for audit and to drive VERIFIED/REJECTED decision.
- [ ] Optionally compute or update `user.risk_level` (LOW/MEDIUM/HIGH) based on check results.

**Notes:** Currently the backend only creates a row in `organizer_kyc_submissions` and sets `verification_status = PENDING`. No automated checks run after that.

---

## 3. Approval / Rejection Flow

**Status:** Not started  
**Priority:** High

- [ ] Add **admin (or internal) API** to list pending/in-progress KYC submissions (e.g. `GET /api/v1/admin/verification-pending`).
- [ ] Add **approve** action: set submission status to VERIFIED, set `user.verification_status = 'VERIFIED'`, set `user.is_verified = true` (and optionally set `user.risk_level`).
- [ ] Add **reject** action: set submission status to REJECTED, set `user.verification_status = 'REJECTED'`, set `rejection_reason` on the submission.
- [ ] Optionally: automated approval path when risk checks (§2) pass; automated rejection when they fail.
- [ ] Optionally: notify the user (email/in-app) when verified or rejected.

**Notes:** Without this, no one can ever become Verified and "Manage Payouts" will never unlock.

---

## 4. Bank Account & Payout Readiness

**Status:** Not started  
**Priority:** High (for real payouts)

- [ ] **Collect payout bank account** (e.g. when user first uses "Manage Payouts" or in Organizer dashboard): account holder name, routing number, account number (and optionally bank name).
- [ ] **Name matching:** Compare bank account holder name to KYC/ID name; reject or flag mismatches.
- [ ] **Secure storage** of bank details (e.g. Stripe Connect, or encrypted storage) and link to organizer for payouts.
- [ ] Expose **available payout balance** from real payout service (currently `OrganizerSummary.availableBalance` is a placeholder).

**Notes:** The design doc calls out verifying "name matches the bank account provided for payouts." Until this exists, payouts cannot be safely executed even when the user is Verified.

---

## 5. Frontend: Rejection & Resubmit UX

**Status:** Not started  
**Priority:** Medium

- [ ] When `verification_status === 'REJECTED'`, show a clear **"Verification declined"** state on the Profile (badge or message).
- [ ] Add **"Resubmit"** or **"Complete Identity Check again"** button that reopens the Identity Check modal (API already allows resubmit when REJECTED via `canResubmit`).
- [ ] If backend returns a **rejection reason** (from admin or risk checks), display a user-friendly message (e.g. "We couldn't verify your ID. Please try again with a different document.").

---

## 6. Optional Enhancements

**Status:** Backlog  
**Priority:** Low

- [ ] Email/in-app notification when verification status changes (PENDING → IN_PROGRESS, VERIFIED, REJECTED).
- [ ] Admin UI to review and approve/reject submissions with rejection reason.
- [ ] Retry/backoff for external ID or watchlist provider failures.
- [ ] Audit log for all verification status changes and admin actions.

---

## Reference: Current Implementation

| Component | Location |
|-----------|----------|
| Identity Check modal (steps 1–3 + submit) | `eventpro-frontend/src/components/IdentityCheckModal.tsx` |
| Profile badge + "Complete Identity Check" button | `eventpro-frontend/src/pages/Profile.tsx` |
| Submit API | `POST /api/v1/organizer/verification` |
| Status API | `GET /api/v1/organizer/verification-status` |
| Backend service | `VerificationServiceImpl` (submit + get status) |
| KYC table | `organizer_kyc_submissions` (migration V14) |
| User fields | `users.verification_status`, `users.is_verified`, `users.risk_level` |

---

*Last updated: 2025*
