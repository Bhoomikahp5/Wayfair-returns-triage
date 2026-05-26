import { tool } from "ai";
import { z } from "zod";
import {
  ORDERS,
  CUSTOMERS,
  RETURNS_POLICY,
} from "@/lib/data/mock-data";

export const lookupOrder = tool({
  description:
    "Look up a Wayfair order by its order ID (format: WF-XXXXX). Returns product, price, delivery date, days since delivery, carrier, and insurance status.",
  inputSchema: z.object({
    orderId: z
      .string()
      .describe("The Wayfair order ID, e.g. WF-88421"),
  }),
  execute: async ({ orderId }) => {
    const order = ORDERS[orderId.toUpperCase()];
    if (!order) {
      return {
        found: false,
        message: `No order found with ID ${orderId}.`,
      };
    }
    return { found: true, order };
  },
});

export const getCustomerHistory = tool({
  description:
    "Pull the customer's account history: account age, lifetime orders, lifetime returns, recent refunds, chargebacks. Use this to judge return-abuse risk.",
  inputSchema: z.object({
    customerId: z
      .string()
      .describe("Customer ID, e.g. C-1042 (get this from lookupOrder)"),
  }),
  execute: async ({ customerId }) => {
    const customer = CUSTOMERS[customerId.toUpperCase()];
    if (!customer) {
      return {
        found: false,
        message: `No customer history found for ${customerId}.`,
      };
    }
    return { found: true, customer };
  },
});

export const getReturnsPolicy = tool({
  description:
    "Read the current Wayfair returns policy: standard window, mattress trial, large-furniture damage rule, lighting rule, high-value threshold, customer-satisfaction guarantee, and auto-approval exclusions.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        "Optional product category, e.g. 'Large Furniture', 'Mattress', 'Lighting'.",
      ),
  }),
  execute: async ({ category }) => {
    return {
      category: category ?? "ALL",
      policy: RETURNS_POLICY,
    };
  },
});

export const assessFraudRisk = tool({
  description:
    "Score return-abuse risk for a customer 0-100 with a short reason. Use AFTER you have looked up the customer history. Flags serial returners, brand-new accounts with big refund totals, and accounts with chargebacks.",
  inputSchema: z.object({
    customerId: z.string(),
  }),
  execute: async ({ customerId }) => {
    const c = CUSTOMERS[customerId.toUpperCase()];
    if (!c) return { score: 0, level: "unknown", reasons: ["Customer not found"] };

    let score = 0;
    const reasons: string[] = [];

    if (c.refundsLast90Days >= 3) {
      score += 40;
      reasons.push(`${c.refundsLast90Days} refunds in last 90 days`);
    } else if (c.refundsLast90Days >= 2) {
      score += 20;
      reasons.push(`${c.refundsLast90Days} refunds in last 90 days`);
    }

    if (c.refundDollarsLast90Days > 2000) {
      score += 25;
      reasons.push(`$${c.refundDollarsLast90Days} refunded in last 90 days`);
    }

    if (c.chargebacks > 0) {
      score += 30;
      reasons.push(`${c.chargebacks} chargeback(s) on file`);
    }

    if (c.accountAgeDays < 30 && c.refundDollarsLast90Days > 500) {
      score += 25;
      reasons.push(
        `Account is only ${c.accountAgeDays} days old with $${c.refundDollarsLast90Days} of refunds`,
      );
    }

    if (c.flagged) {
      score += 15;
      reasons.push("Account previously flagged by fraud team");
    }

    score = Math.min(score, 100);
    const level =
      score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";

    if (reasons.length === 0) reasons.push("No risk signals — clean history");

    return { customerId, score, level, reasons };
  },
});

export const decideResolution = tool({
  description:
    "Record the final triage decision: action (APPROVE_REFUND | APPROVE_REPLACEMENT | ESCALATE_TO_HUMAN | DENY), refund amount in USD, reasoning, and confidence 0-1. ALWAYS call this LAST after lookupOrder, getCustomerHistory, getReturnsPolicy, and assessFraudRisk.",
  inputSchema: z.object({
    orderId: z.string(),
    action: z.enum([
      "APPROVE_REFUND",
      "APPROVE_REPLACEMENT",
      "ESCALATE_TO_HUMAN",
      "DENY",
    ]),
    refundAmount: z
      .number()
      .describe("Refund amount in USD; 0 if not approving a refund."),
    reasoning: z
      .string()
      .describe("2-3 sentence explanation tying the decision to policy + history."),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("0-1 confidence that this decision is correct."),
  }),
  execute: async ({ orderId, action, refundAmount, reasoning, confidence }) => {
    return {
      orderId,
      action,
      refundAmount,
      reasoning,
      confidence,
      ticketId: `TKT-${Math.floor(Math.random() * 90000) + 10000}`,
      timestamp: new Date().toISOString(),
    };
  },
});

export const draftCustomerReply = tool({
  description:
    "Draft the customer-facing email reply based on the resolution. Keep it warm, brief, and Wayfair-branded. Use AFTER decideResolution.",
  inputSchema: z.object({
    customerName: z.string(),
    action: z.enum([
      "APPROVE_REFUND",
      "APPROVE_REPLACEMENT",
      "ESCALATE_TO_HUMAN",
      "DENY",
    ]),
    product: z.string(),
    refundAmount: z.number(),
    keyDetails: z
      .string()
      .describe("1-2 sentences naming the specific issue and resolution."),
  }),
  execute: async ({
    customerName,
    action,
    product,
    refundAmount,
    keyDetails,
  }) => {
    const subject =
      action === "APPROVE_REFUND"
        ? `Your Wayfair refund for ${product} is approved`
        : action === "APPROVE_REPLACEMENT"
          ? `Replacement on the way: ${product}`
          : action === "ESCALATE_TO_HUMAN"
            ? `We're reviewing your case — ${product}`
            : `Your Wayfair return request — ${product}`;

    return {
      to: customerName,
      subject,
      action,
      refundAmount,
      keyDetails,
      ready: true,
    };
  },
});

export const triageTools = {
  lookupOrder,
  getCustomerHistory,
  getReturnsPolicy,
  assessFraudRisk,
  decideResolution,
  draftCustomerReply,
};
