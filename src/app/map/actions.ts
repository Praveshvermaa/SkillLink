'use server';

import { createClient } from '@/lib/supabase/server';

import { getCached, setCached } from '@/lib/redis';

export interface SkillInBounds {
    id: string;
    title: string;
    category: string;
    price: number;
    latitude: number;
    longitude: number;
    profiles: {
        name: string;
        avatar_url: string;
    } | null;
}

export async function getSkillsInBounds({
    north,
    south,
    east,
    west,
}: {
    north: number;
    south: number;
    east: number;
    west: number;
}) {
    // Round bounds to 3 decimal places (~111m) to increase cache hits for nearby users
    const n = north.toFixed(3);
    const s = south.toFixed(3);
    const e = east.toFixed(3);
    const w = west.toFixed(3);
    const cacheKey = `skills:bounds:N${n}:S${s}:E${e}:W${w}`;

    // Try fetching from cache
    const cachedData = await getCached<SkillInBounds[]>(cacheKey);
    if (cachedData) {
        return { data: cachedData };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('get_skills_in_bounds', {
            min_lat: south,
            max_lat: north,
            min_lng: west,
            max_lng: east,
        })
        .select(`
      id,
      title,
      category,
      price,
      latitude,
      longitude,
      profiles:provider_id (
        name,
        avatar_url
      )
    `);

    if (error) {
        console.error('Error fetching skills in bounds:', error);
        return { error: error.message };
    }

    const processedData = data as unknown as SkillInBounds[];

    // Cache the map bounds query for 180 seconds (3 minutes)
    await setCached(cacheKey, processedData, 180);

    return { data: processedData };
}
