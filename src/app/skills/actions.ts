'use server';

import { createClient } from '@/lib/supabase/server';
import { getCached, setCached } from '@/lib/redis';

export async function getSkillsSortedByDistance(
    lat: number,
    lng: number,
    query?: string | null
) {
    // Round lat/lng to 2 decimal places to increase cache hit rate (approx 1.1km area grid)
    const latKey = lat.toFixed(2);
    const lngKey = lng.toFixed(2);
    const cacheKey = `skills:distance:lat:${latKey}:lng:${lngKey}:q:${query || 'all'}`;

    // Try fetching from cache
    const cachedData = await getCached<any[]>(cacheKey);
    if (cachedData) {
        return { data: cachedData };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_skills_sorted_by_distance', {
        user_lat: lat,
        user_lng: lng,
        search_query: query || null,
    });

    if (error) {
        console.error('Error in getSkillsSortedByDistance RPC:', error);
        return { error: error.message };
    }

    const processedData = (data || []).map((s: any) => ({
        ...s,
        provider: { name: s.provider_name, avatar_url: s.provider_avatar_url, role: null },
        distance: s.distance_meters !== undefined ? s.distance_meters / 1000 : Infinity
    }));

    // Cache the processed data for 120 seconds (2 minutes)
    await setCached(cacheKey, processedData, 120);

    return { data: processedData };
}

export async function getSkillsDefault(query?: string | null) {
    const cacheKey = `skills:default:q:${query || 'all'}`;

    const cachedData = await getCached<any[]>(cacheKey);
    if (cachedData) {
        return { data: cachedData };
    }

    const supabase = await createClient();
    let builder = supabase
        .from('skills')
        .select(`
            *,
            provider:profiles(name, avatar_url, role)
        `)
        .order('created_at', { ascending: false });

    if (query) {
        builder = builder.ilike('title', `%${query}%`);
    }

    const { data, error } = await builder;

    if (error) {
        console.error('Error fetching default skills:', error);
        return { error: error.message };
    }

    const processedData = data || [];

    // Cache the default skills list for 120 seconds (2 minutes)
    await setCached(cacheKey, processedData, 120);

    return { data: processedData };
}
