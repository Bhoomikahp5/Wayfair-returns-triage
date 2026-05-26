/**
 * Mock Wayfair data for the Returns Triage Agent demo.
 * Real systems would back these with SQL / order-management APIs.
 */

export type Order = {
  orderId: string;
  customerId: string;
  customerName: string;
  email: string;
  product: string;
  sku: string;
  category: string;
  price: number;
  deliveredAt: string;
  daysSinceDelivery: number;
  carrier: string;
  hasInsurance: boolean;
};

export type CustomerHistory = {
  customerId: string;
  accountAgeDays: number;
  lifetimeOrders: number;
  lifetimeReturns: number;
  refundsLast90Days: number;
  refundDollarsLast90Days: number;
  chargebacks: number;
  flagged: boolean;
};

export const ORDERS: Record<string, Order> = {
  "WF-88421": {
    orderId: "WF-88421",
    customerId: "C-1042",
    customerName: "Priya Anand",
    email: "priya.a@example.com",
    product: "Hartwell Tufted Velvet Sofa, Emerald",
    sku: "SOFA-HW-EM-3S",
    category: "Large Furniture",
    price: 1289.0,
    deliveredAt: "2026-05-22",
    daysSinceDelivery: 4,
    carrier: "Wayfair Freight",
    hasInsurance: true,
  },
  "WF-77310": {
    orderId: "WF-77310",
    customerId: "C-8821",
    customerName: "Marcus Webb",
    email: "marcus.w@example.com",
    product: "Aurora 5-Light Brass Chandelier",
    sku: "LIGHT-AUR-5BR",
    category: "Lighting",
    price: 419.0,
    deliveredAt: "2026-03-02",
    daysSinceDelivery: 85,
    carrier: "FedEx",
    hasInsurance: false,
  },
  "WF-90222": {
    orderId: "WF-90222",
    customerId: "C-3301",
    customerName: "Jordan Lee",
    email: "jordan.l@example.com",
    product: "Cloudloom King Mattress",
    sku: "MATT-CL-K",
    category: "Mattress",
    price: 899.0,
    deliveredAt: "2026-05-18",
    daysSinceDelivery: 8,
    carrier: "Wayfair Freight",
    hasInsurance: true,
  },
  "WF-65109": {
    orderId: "WF-65109",
    customerId: "C-9911",
    customerName: "Alex Rivera",
    email: "alex.r@example.com",
    product: "Maxwell Standing Desk, Walnut",
    sku: "DESK-MX-WAL",
    category: "Office",
    price: 539.0,
    deliveredAt: "2026-05-24",
    daysSinceDelivery: 2,
    carrier: "UPS",
    hasInsurance: true,
  },
};

export const CUSTOMERS: Record<string, CustomerHistory> = {
  "C-1042": {
    customerId: "C-1042",
    accountAgeDays: 1820,
    lifetimeOrders: 47,
    lifetimeReturns: 2,
    refundsLast90Days: 0,
    refundDollarsLast90Days: 0,
    chargebacks: 0,
    flagged: false,
  },
  "C-8821": {
    customerId: "C-8821",
    accountAgeDays: 210,
    lifetimeOrders: 5,
    lifetimeReturns: 1,
    refundsLast90Days: 1,
    refundDollarsLast90Days: 119,
    chargebacks: 0,
    flagged: false,
  },
  "C-3301": {
    customerId: "C-3301",
    accountAgeDays: 12,
    lifetimeOrders: 4,
    lifetimeReturns: 4,
    refundsLast90Days: 4,
    refundDollarsLast90Days: 3210,
    chargebacks: 1,
    flagged: true,
  },
  "C-9911": {
    customerId: "C-9911",
    accountAgeDays: 905,
    lifetimeOrders: 12,
    lifetimeReturns: 0,
    refundsLast90Days: 0,
    refundDollarsLast90Days: 0,
    chargebacks: 0,
    flagged: false,
  },
};

export const RETURNS_POLICY = {
  standardWindowDays: 30,
  mattressTrialDays: 100,
  largeFurnitureRule:
    "Damage on delivery covered for 7 days; after that, eligibility depends on insurance and photo evidence.",
  lightingRule:
    "Defects covered for 30 days. Cosmetic complaints after 30 days require manager approval.",
  highValueThreshold: 1000,
  damagedOnArrivalAction: "Full refund + free pickup, no return shipping fee.",
  customerSatisfactionGuarantee:
    "If the customer photo-documents damage within 48 hours of delivery, approve refund without question.",
  excludedFromAutoApproval: [
    "Customer has >3 refunds in the last 90 days",
    "Customer has any chargeback on file",
    "Account is younger than 30 days with >$500 refund history",
  ],
};

export const DEMO_SCENARIOS = [
  {
    title: "Damaged Velvet Sofa (clear refund)",
    orderId: "WF-88421",
    complaint:
      "Hi, my green velvet sofa arrived yesterday with a torn cushion and a deep scratch on the right arm. The delivery guys were in a rush. I have photos. This was supposed to be a gift for my mom — I am really upset. Can you refund this?",
  },
  {
    title: "Late lighting complaint (out of window)",
    orderId: "WF-77310",
    complaint:
      "I bought this chandelier almost three months ago and one of the brass arms is slightly bent. It still works fine but it bugs me every time I look at it. Want a full refund.",
  },
  {
    title: "Suspicious serial returner (fraud risk)",
    orderId: "WF-90222",
    complaint:
      "The mattress is too firm. I want a refund and DO NOT want a replacement. I've had problems with every order from you and I want my money back today or I'm calling my credit card.",
  },
  {
    title: "Standing desk wobble (replacement track)",
    orderId: "WF-65109",
    complaint:
      "My standing desk wobbles when raised above 38 inches. The mechanism seems fine but it's not stable for typing. Otherwise the desk looks great.",
  },
];
