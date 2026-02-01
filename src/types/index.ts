export interface Note {
    id: string;
    content: string;
    timestamp: number;
    type: 'manual' | 'call_log' | 'email_log';
}

export interface Lead {
    id: string;
    title: string;
    phone: string;
    status: 'Fresh' | 'Hot' | 'Warm' | 'Cold' | 'Dead';
    notes: Note[];

    // Enriched / Imported fields
    imageUrl?: string;
    totalScore?: number;
    reviewsCount?: number;
    street?: string;
    city?: string;
    state?: string;
    countryCode?: string;
    website?: string;
    categoryName?: string;
    url?: string;
    email?: string;
    source?: string;

    // Meta
    createdAt: number;
    updatedAt: number;
}

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
}
