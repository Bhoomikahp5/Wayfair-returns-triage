# Wayfair Returns Triage Agent

> **Boston Tech Week · Beat-The-Clock Agent Hack · Track 3 — FinOps & Customer Service**
> Built on **Subconscious TIM-Qwen3.6** + Vercel AI SDK + Next.js.

A returns-triage agent that reads a customer's complaint, **looks at the damage photo they attached**, checks Wayfair's return policy, scores the customer for return-abuse fraud risk, decides the resolution, and drafts the customer-facing reply — in one autonomous loop, with every tool call visible in the UI.

**The differentiator:** the agent doesn't trust customers on words alone. If the complaint says "torn cushion" but the photo shows a pristine sofa, the agent flags the mismatch and escalates instead of issuing the refund. Multimodal verification via Subconscious's vision capability.

## Why this matters

Wayfair runs ~$12B in revenue and serves ~22M customers a year. Returns are the single largest cost center in furniture e-commerce: large items, freight, damage claims, and a long tail of "is this fraud or a legit complaint?" decisions that today need a human specialist. This agent handles the obvious ~70% — and **escalates the rest** — so specialists only see the cases that actually need judgment.

## What the agent does (autonomously)

```
Customer complaint  ─►  lookupOrder           ─►  getCustomerHistory
+ damage photo      ─►  getReturnsPolicy      ─►  assessFraudRisk
                    ─►  verifyDamageEvidence  (multimodal — looks at the photo)
                    ─►  decideResolution      ─►  draftCustomerReply
                    ─►  Operator summary (decision + dollar + reply)
```

Seven tools. One loop. Every step streams into the UI so a Wayfair specialist can audit the reasoning before sending.

## The five demo scenarios

| Scenario | Expected outcome |
|---|---|
| **WF-88421** — Damaged velvet sofa + photo confirming damage | `APPROVE_REFUND` — $1,289 |
| **WF-88421 (mismatch)** — Same complaint but attached photo shows pristine sofa | `ESCALATE_TO_HUMAN` — photo doesn't match words |
| **WF-77310** — Bent chandelier arm, ordered 85 days ago, no insurance | `DENY` / `ESCALATE` — outside window, cosmetic |
| **WF-90222** — Mattress refund demand, 12-day-old account, 4 refunds in 90d, chargeback | `ESCALATE_TO_HUMAN` — fraud risk HIGH |
| **WF-65109** — Standing desk wobbles above 38" | `APPROVE_REPLACEMENT` — functional defect, in-window |

Two differentiators vs. a naive return chatbot:
1. **Fraud-risk scorer** catches the serial returner with a clean-looking complaint.
2. **Multimodal damage verification** catches the dishonest customer whose words say "destroyed" but whose photo shows nothing wrong.

## Stack

- **Subconscious TIM-Qwen3.6-27b** — agent reasoning + tool calls (OpenAI-compatible API)
- **Vercel AI SDK `ToolLoopAgent`** — multi-step tool loop, streaming UI
- **Next.js 16** — App Router, React Server Components, Tailwind
- **Mock data layer** — `lib/data/mock-data.ts` holds 4 orders, 4 customer histories, full returns policy. Swap for SQL/order-API at production.

## Run it

```bash
npm install
cp .env.local.example .env.local
# put your SUBCONSCIOUS_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000, click any scenario card, watch the agent work.

## Files that matter

| File | What it is |
|---|---|
| `lib/data/mock-data.ts` | Orders, customers, returns policy, demo scenarios |
| `lib/tools/triage-tools.ts` | Seven agent tools: lookupOrder, getCustomerHistory, getReturnsPolicy, assessFraudRisk, **verifyDamageEvidence** (multimodal), decideResolution, draftCustomerReply |
| `lib/agents/index.ts` | System prompt + ToolLoopAgent setup |
| `app/api/chat/route.ts` | Streaming API endpoint |
| `components/chat-app.tsx` | UI with scenario cards + tool-call transparency |

## How to extend (the 10-min upgrade path)

- Swap `mock-data.ts` for a real Wayfair OMS query
- Add a `notifyCustomer` tool that actually sends the drafted email (SendGrid)
- Add a `pickupSchedule` tool for large-furniture freight returns
- Plug in a **Reducto** tool to OCR damage photos and verify the customer's claim
- Move the agent to a **Cloudflare Workers** edge runtime for sub-200ms latency

## Credits

Built solo at the Wayfair × Subconscious × Baseten × Cloudflare hackathon, Boston Tech Week 2026.
