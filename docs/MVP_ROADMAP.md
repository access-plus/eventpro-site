# EventPro MVP Roadmap

Implementation must align with **what each price tier promises on the Pricing page**. This doc ties the roadmap to those tiers and tracks status.

---

## Pricing tiers (source of truth)

These match `eventpro-frontend/src/pages/Pricing.tsx`. All implementation and gating must respect them.

| Feature / capability | Basic | Pro | Enterprise |
|----------------------|-------|-----|------------|
| **Ticketing** | | | |
| Event creation | ✅ | ✅ | ✅ |
| Multiple ticket tiers | Up to 3 | Unlimited | Unlimited |
| QR code tickets | ✅ | ✅ | ✅ |
| Guest checkout | ✅ | ✅ | ✅ |
| Reserved seating | ❌ | ✅ | ✅ |
| **Payouts** | | | |
| Standard payout (T+2 after event) | ✅ | ✅ | ✅ |
| 50% early payout | ❌ | ✅ | ✅ |
| 100% instant payout | ❌ | ❌ | ✅ |
| **Customization** | | | |
| Logo & basic colors / basic color theming | ✅ | ✅ | ✅ |
| Branded event pages | ✅ | ✅ | ✅ |
| Custom domain mapping | ❌ | ✅ | ✅ |
| Full HTML/CSS customization | ❌ | ✅ | ✅ |
| White-label (no Access Plus branding) | ❌ | ❌ | ✅ |
| **Revenue tools** | | | |
| Merchandise & add-on sales | ❌ | ✅ | ✅ |
| Donations & fundraising / fundraising thermometers | ❌ | ✅ | ✅ |
| Dynamic pricing | ❌ | ❌ | ✅ |
| **Data & marketing** | | | |
| Attendee data export (CSV) | ✅ | ✅ | ✅ |
| Email ticket holders from platform | (see CRM) | ✅ | ✅ |
| Automated marketing segments | ❌ | ✅ | ✅ |
| **Support** | | | |
| Email support | ✅ | ✅ | ✅ |
| Priority email & chat support | ❌ | ✅ | ✅ |
| Dedicated account manager | ❌ | ❌ | ✅ |
| **Pro / Enterprise only** | | | |
| Advanced analytics dashboard | ❌ | ✅ | ✅ |
| API access for integrations | ❌ | ❌ | ✅ |
| 1099-K tax compliance reports | ❌ | ❌ | ✅ |
| SLA guarantee (99.9% uptime) | ❌ | ❌ | ✅ |
| On-premise hosting option | ❌ | ❌ | ✅ |
| Multi-currency support | ❌ | ❌ | ✅ |
| Custom feature development | ❌ | ❌ | ✅ |

**Implementation rule:** Any feature listed above must be **gated by plan** (Basic / Pro / Enterprise) in code and config. Do not ship a capability to a tier that doesn’t have it on the pricing page.

---

## Iteration 1: Automated Risk & Payout Scaling

**Goal:** Scale early payouts and improve event page quality, in line with pricing tiers.

| Focus area | Pricing-page alignment | Features to implement | Status |
|------------|------------------------|------------------------|--------|
| **Risk management** | Enables Pro (50% early) and Enterprise (100% instant) | Automated risk scoring: score organizers by history, ticket price, event type, KYC. Used to offer / limit early payouts. | 🔴 Not started |
| **Payout expansion** | Basic: T+2 only. Pro: 50% early. Enterprise: 100% instant. | Tiered payouts: 50% early (Pro), 100% instant (Enterprise only). Tie to risk score for automation. | 🔴 Not started |
| **Customization** | Basic: “Basic color theming”. Pro: “Full HTML/CSS” + custom domain. | **Basic (all tiers):** Pre-set event templates + promotional video/YouTube embed on event page. **Pro+:** Custom domain + full HTML/CSS (Iteration 2). | 🔴 Not started |
| **Data utility** | Pro/Enterprise: “Email ticket holders” / marketing. | Basic Organizer CRM: organizers can email their ticket holders from the platform (Pro/Enterprise). Basic keeps export only. | 🔴 Not started |

### Iteration 1 – Implementation order (tier-aware)

1. **Basic theming (all tiers)**  
   - Pre-set event page templates (e.g. 2–3).  
   - Promotional video URL (e.g. YouTube) on event model + embed on event detail page.  
   - **Gating:** Available to all plans (Basic + Pro + Enterprise).

2. **Organizer CRM – email attendees (Pro + Enterprise)**  
   - “Email attendees” from organizer event/attendees view; send via platform (e.g. SendGrid/SES).  
   - **Gating:** Only for Pro and Enterprise; hide or disable for Basic.

3. **Risk scoring (backend for payouts)**  
   - Schema: organizer risk score + inputs (history, ticket price band, event type, KYC).  
   - Scoring job/API; store score (and optionally tier) on organizer/account.  
   - **Gating:** Drives who gets 50% vs 100% early payout; no UI tier purchase yet.

4. **Tiered early payouts**  
   - **Pro:** 50% early payout option (subject to risk).  
   - **Enterprise:** 100% instant payouts.  
   - **Basic:** Standard T+2 only.  
   - Wire payout flow to plan + risk score; enforce in backend.

---

## Iteration 2: White-Label & Vertical Expansion

**Goal:** Pro/Enterprise differentiation and revenue tools as on the pricing page.

| Focus area | Pricing-page alignment | Features to implement | Status |
|------------|------------------------|------------------------|--------|
| **White-label / Pro** | Pro: “Custom domain mapping”. Enterprise: “Full white-label branding”. | Custom domain mapping (e.g. `tickets.churchname.org`) for Pro and Enterprise. | 🔴 Not started |
| **Vertical expansion** | Pro/Enterprise: “Merchandise & add-on sales”, “Donations & fundraising”. | Add-ons (merchandise, etc.) + donations/fundraising at checkout. **Gating:** Pro and Enterprise only; Basic cannot use add-ons or fundraising. | 🟢 Add-ons in progress |
| **Data integration** | Enterprise: “API access for integrations”. | API access (beta) for Enterprise: sync sales/order data to client systems. **Gating:** Enterprise only. | 🔴 Not started |

### Current implementation vs pricing

- **Merchandise & add-ons**  
  - **Done (MVP):** Event add-ons (merchandise, add-on, upgrade); organizer CRUD; checkout “Enhance Your Experience” from API.  
  - **TODO:**  
    - **Gate by plan:** Only Pro and Enterprise organizers can create add-ons or see add-ons at checkout; Basic organizers see no add-on UI and checkout shows no add-ons.  
    - **Donations & fundraising:** Add donation/fundraising option (e.g. add-on type or dedicated “Donate” at checkout) and gate to Pro + Enterprise.

- **Custom domain**  
  - Not started. Implement for Pro (and Enterprise) when launching subscription/Pro tier.

- **API access**  
  - Not started. Implement for Enterprise only; gate by plan and API key / scope.

---

## Tier gating checklist (implementation)

Before release, ensure:

- [ ] **Basic:** No custom domain, no add-ons, no fundraising, no early payouts, no “email attendees”, no reserved seating (if we add it), no full HTML/CSS.
- [ ] **Pro:** Add-ons + fundraising allowed; 50% early payout allowed; custom domain allowed; email attendees allowed; reserved seating allowed; no 100% instant payout, no API access, no white-label.
- [ ] **Enterprise:** Everything in Pro + 100% instant payout, API access, white-label, and other Enterprise-only features from the pricing page.
- [ ] **Risk scoring:** Used only to decide eligibility for 50% / 100% early payout within Pro/Enterprise; not a separate “tier” on the pricing page.

---

## Summary: Where to focus

**Iteration 1 (tier-aligned):**

1. Basic theming (templates + video) for **all tiers**.  
2. Organizer CRM (email attendees) for **Pro + Enterprise** only.  
3. Risk scoring (backend) to support 50% / 100% payout automation.  
4. Tiered payouts: **Basic = T+2**, **Pro = 50% early option**, **Enterprise = 100% instant**.

**Iteration 2 (tier-aligned):**

1. **Gate add-ons and fundraising** to Pro + Enterprise; add donation/fundraising flow.  
2. **Custom domain** for Pro (and Enterprise).  
3. **API access (beta)** for Enterprise only.

Use this doc as the single source of truth; keep the **Status** column and checklist updated as work completes.
