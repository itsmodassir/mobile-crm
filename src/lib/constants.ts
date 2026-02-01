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

export type Category = typeof CATEGORIES[number];
