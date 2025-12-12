'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SkillInBounds } from '@/app/map/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Fix for default Leaflet markers in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

// Component to handle map events (bounds change)
function MapEvents({
    onBoundsChange,
}: {
    onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
    const map = useMap();

    // Trigger initial bounds
    useEffect(() => {
        onBoundsChange(map.getBounds());
    }, [map, onBoundsChange]);

    useMapEvents({
        moveend: () => {
            onBoundsChange(map.getBounds());
        },
        zoomend: () => {
            onBoundsChange(map.getBounds());
        },
    });

    return null;
}

// Component to programmatically move the map
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 13);
    }, [center, map]);
    return null;
}

interface MapProps {
    skills: SkillInBounds[];
    center: [number, number];
    onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export default function Map({ skills, center, onBoundsChange }: MapProps) {
    const [activeSkill, setActiveSkill] = useState<SkillInBounds | null>(null);

    const handleBoundsChange = (bounds: L.LatLngBounds) => {
        onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
        });
    };

    return (
        <div className="h-full w-full z-0">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents onBoundsChange={handleBoundsChange} />
                <MapUpdater center={center} />

                {skills.map((skill) => (
                    <Marker
                        key={skill.id}
                        position={[skill.latitude, skill.longitude]}
                        icon={defaultIcon}
                        eventHandlers={{
                            click: () => setActiveSkill(skill),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[200px] p-2">
                                <h3 className="font-bold text-lg mb-1 text-zinc-950 dark:text-zinc-950">{skill.title}</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-600 font-medium mb-3">{skill.category}</p>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="px-2 py-1 bg-zinc-100 rounded-md">
                                        <span className="font-bold text-zinc-900">₹{skill.price}/hr</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-3 bg-zinc-50 dark:bg-zinc-100 p-2 rounded-lg">
                                    {skill.profiles?.avatar_url ? (
                                        <img
                                            src={skill.profiles.avatar_url}
                                            alt={skill.profiles.name}
                                            className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">
                                            {skill.profiles?.name?.[0] || 'P'}
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-800">{skill.profiles?.name}</span>
                                </div>
                                <Link href={`/skills/${skill.id}`}>
                                    <Button size="sm" className="w-full">View Details</Button>
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
