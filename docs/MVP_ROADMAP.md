# EventPro MVP Roadmap

This document tracks the iteration roadmap, current status, and next steps.

---

## Iteration 1: Automated Risk & Payout Scaling

**Strategic focus:** Scale high-risk payout feature and improve platform professionalism.

| Focus Area | Features | Strategic Goal | Status |
|------------|----------|----------------|--------|
| **Risk Management** | Automated Risk Scoring: algorithm scoring organizers by history, ticket price, event type, KYC/documentation | Offer Early/Instant Payouts automatically to high-trust organizers (replace manual pilot) | 🔴 Not started |
| **Payout Expansion** | Tiered Early Payouts: 3 levels (e.g. 25% upfront, 50% upfront, 100% upfront) tied to risk score | Increase adoption of key differentiator while managing chargeback liability | 🔴 Not started |
| **Customization** | Basic Theming: pre-set templates + embed promotional video/YouTube link on event page | Improve event page quality and conversion | 🔴 Not started |
| **Data Utility** | Basic Organizer CRM: email ticket holders from the platform (not just export) | Keep data in ecosystem, reduce reliance on raw exports | 🔴 Not started |

### Iteration 1 – Suggested implementation order

1. **Basic Theming (Customization)** – Fastest impact on conversion; no payment/risk dependency.  
   - Add event page templates (e.g. 2–3 presets).  
   - Add “Promotional video” field (URL) to event model and display embed on event detail page.

2. **Basic Organizer CRM (Data Utility)** – Builds on existing “attendees”/ticket-holder data.  
   - Organizer “Email attendees” from event/attendees view: compose email, send via platform (e.g. SendGrid/SES) or “mailto” with BCC list from export.

3. **Automated Risk Scoring (Risk Management)** – Foundation for payouts.  
   - Define schema: organizer risk score (and inputs: history, ticket price band, event type, KYC status).  
   - Implement scoring job/API; store score and tier on organizer or event.

4. **Tiered Early Payouts (Payout Expansion)** – Depends on risk scoring.  
   - Map risk score → payout tier (25% / 50% / 100% upfront).  
   - Integrate with existing payout/payment flow to release funds by tier.

---

## Iteration 2: White-Label & Vertical Expansion

**Strategic focus:** Recurring revenue and high-value community organizations.

| Focus Area | Features | Strategic Goal | Status |
|------------|----------|----------------|--------|
| **White-Label SaaS** | Custom Domain Mapping (e.g. `tickets.churchname.org`) | Launch Pro/Subscription tier; predictable non-transactional revenue | 🔴 Not started |
| **Vertical Expansion** | Add-Ons & Fundraising: in-checkout upsells (merchandise, food, donations/fundraising) | Expand beyond tickets; capture more LTV from community orgs | 🟢 In progress |
| **Data Integration** | API Access (Beta) for Enterprise: sync sales data to client systems | Attract large community anchors with enterprise integration | 🔴 Not started |

### Current alignment with roadmap

- **Add-Ons & Fundraising (Iteration 2 – Vertical Expansion)**  
  - **Done (MVP):** Event add-ons (merchandise, add-on, upgrade) per event; organizer CRUD; checkout “Enhance Your Experience” loaded from API; image proxy for event images.  
  - **Next:** Add a **donation/fundraising** add-on type or a dedicated “Donate” option at checkout to fully cover “donation/fundraising” in the roadmap.

---

## Summary: Where to focus next

**Iteration 1 (next priorities):**

1. **Basic Theming** – Event templates + promotional video URL on event page.  
2. **Basic Organizer CRM** – Email ticket holders from the platform.  
3. **Risk Scoring** – Model + algorithm + storage for organizer risk score.  
4. **Tiered Payouts** – Payout tiers (25/50/100%) driven by risk score.

**Iteration 2 (already in motion):**

- Add-ons/upsells: core built; consider adding **donation/fundraising** and Pro tier (custom domain) when moving to Iteration 2.

Use this doc as the single source of truth for MVP scope; update the **Status** column as work completes (e.g. 🟢 In progress → ✅ Done).
