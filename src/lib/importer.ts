import type { Lead } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const importer = {
    validateAndParse(jsonString: string, defaultCategory?: string): Lead[] {
        try {
            const parsed = JSON.parse(jsonString);

            // Smart Array Finder
            let data: any[] = [];
            if (Array.isArray(parsed)) {
                data = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
                // Check for common wrapper keys
                const potentialKeys = ['leads', 'data', 'results', 'items', 'places', 'businesses'];
                const foundKey = potentialKeys.find(k => Array.isArray(parsed[k]));

                if (foundKey) {
                    data = parsed[foundKey];
                } else {
                    // Fallback: treat the object itself as a single item
                    data = [parsed];
                }
            } else {
                return []; // Invalid structure (string/number/boolean)
            }

            const validLeads: Lead[] = [];

            for (const item of data) {
                if (!item || typeof item !== 'object') continue;

                // Fuzzy Mapping
                const title = item.title || item.name || item.businessName || item.placeName || 'Untitled Lead';
                const phone = item.phone || item.phoneNumber || item.mobile || item.tel || '';

                // If it looks like a wrapper object (no title/phone but maybe children?), skip or log?
                // We'll trust the fuzzy match for now.

                const lead: Lead = {
                    id: item.id || uuidv4(),
                    title: title,
                    phone: phone,
                    status: item.status || 'Fresh',
                    notes: Array.isArray(item.notes) ? item.notes : [],

                    imageUrl: item.imageUrl || item.image || item.photo,
                    totalScore: item.totalScore || item.rating,
                    reviewsCount: item.reviewsCount || item.reviewCount,
                    street: item.street || item.address,
                    city: item.city,
                    state: item.state,
                    countryCode: item.countryCode,
                    website: item.website || item.url, // url often used for website in some APIs
                    email: item.email || item.emailAddress || item.mail,
                    source: item.source || item.leadSource || item.origin,
                    categoryName: item.categoryName || item.category || item.type || defaultCategory || 'Other',
                    url: item.url || item.googleMapsUrl, // Keep original URL if distinct

                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                // Filter garbage: Must have at least a Title that isn't default, OR a phone, OR a website
                // Actually, "Untitled Lead" is fine if they have a phone. 
                // If it relies on default title AND has no phone/website, likely a wrapper object that failed parsing.
                const isDefaultTitle = title === 'Untitled Lead';
                const hasContact = phone || lead.website || lead.street;

                if (!isDefaultTitle || hasContact) {
                    validLeads.push(lead);
                }
            }

            return validLeads;
        } catch (e) {
            console.error("Import failed", e);
            throw new Error("Invalid JSON format");
        }
    }
};
