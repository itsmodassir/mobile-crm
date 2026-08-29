export interface Note {
    id: string;
    content: string;
    timestamp: number;
    type: 'manual' | 'call_log' | 'email_log';
}

export interface Lead {
    id: string;
    workspace_id: string;
    name: string; // was title
    phone_number: string; // was phone
    status: string; // 'pending' | 'converted' | etc
    followup_stage: string;
    notes: Note[]; // Keep as Note[] for UI, serialize to JSON for backend
    intent_score?: number;
    intent_type?: string;
    tags?: string[];
    
    // Enriched / Imported fields (Keeping for legacy UI if any)
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
    source_group?: string;
    lead_requirement?: string;
    quotation?: string;

    // Meta
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    workspace_id: string;
}

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
}

export interface CustomStatus {
    id: string;
    label?: string;
    value: string;
    color: string;
    isDefault?: boolean;
    order?: number;
}
