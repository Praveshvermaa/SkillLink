'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { LocationInput } from '@/components/LocationInput';
import { getSkillsInBounds, type SkillInBounds } from '@/app/map/actions';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/map/Map'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-muted/50">
            <p className="text-muted-foreground">Loading map...</p>
        </div>
    ),
});

export default function MapPage() {
    const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default to Delhi
    const [skills, setSkills] = useState<SkillInBounds[]>([]);
    const [bounds, setBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Debounce bounds to avoid fetching on every small movement
    const debouncedBounds = useDebounce(bounds, 1000); // Wait 1 second after last movement

    const handleBoundsChange = useCallback((newBounds: { north: number; south: number; east: number; west: number }) => {
        setBounds(newBounds);
    }, []);

    // Fetch skills when debounced bounds change
    useEffect(() => {
        const fetchSkills = async () => {
            if (!debouncedBounds) return;

            try {
                const { data, error } = await getSkillsInBounds(debouncedBounds);
                if (error) {
                    console.error(error);
                    return;
                }
                if (data) {
                    setSkills(data);
                }
            } catch (err) {
                console.error('Failed to fetch skills', err);
            }
        };

        fetchSkills();
    }, [debouncedBounds]);

    const handleLocationSelect = (address: string, lat?: number, lon?: number) => {
        if (lat && lon) {
            setCenter([lat, lon]);
            toast.info(`Moved to ${address.split(',')[0]}`);
        }
    };

    return (
        <div className="relative h-[calc(100vh-4rem)] w-full">
            {/* Search Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[5000] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md">
                <Card className="p-2 shadow-xl rounded-xl border-border/50 bg-background/100 backdrop-blur-none">
                    <LocationInput
                        placeholder="Search for an area, city..."
                        className="border-0 shadow-none focus-visible:ring-0 text-base py-6"
                        onLocationSelect={handleLocationSelect}
                    />
                </Card>
            </div>

            {/* Map */}
            <Map
                center={center}
                skills={skills}
                onBoundsChange={handleBoundsChange}
            />
        </div>
    );
}
