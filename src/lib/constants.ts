import type { CustomStatus } from '../types';

export const CATEGORIES = [
    'Real Estate',
    'Dental',
    'Healthcare',
    'Education',
    'Retail',
    'Technology',
    'Consulting',
    'Other'
] as const;

export const DEFAULT_STATUSES: CustomStatus[] = [
    { id: "pending", label: "Pending", value: "pending", color: "#64748b", isDefault: true, order: 1 },
    { id: "hot", label: "Hot", value: "hot", color: "#ef4444", order: 2 },
    { id: "warm", label: "Warm", value: "warm", color: "#f59e0b", order: 3 },
    { id: "cold", label: "Cold", value: "cold", color: "#3b82f6", order: 4 },
    { id: "closed", label: "Closed", value: "closed", color: "#22c55e", order: 5 }
];

export type Category = typeof CATEGORIES[number];
