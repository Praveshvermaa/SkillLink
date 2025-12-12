'use server';

import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('skills')
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
    `)
        .lte('latitude', north)
        .gte('latitude', south)
        .lte('longitude', east)
        .gte('longitude', west);

    if (error) {
        console.error('Error fetching skills in bounds:', error);
        return { error: error.message };
    }

    return { data: data as unknown as SkillInBounds[] };
}
