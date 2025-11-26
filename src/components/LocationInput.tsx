"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface LocationInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onLocationSelect?: (location: string, lat?: number, lon?: number) => void;
}

interface Suggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export function LocationInput({
    className,
    value: controlledValue,
    defaultValue,
    onChange,
    onLocationSelect,
    ...props
}: LocationInputProps) {
    const [query, setQuery] = React.useState(
        controlledValue?.toString() || defaultValue?.toString() || ""
    );
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    // Handle controlled/uncontrolled value
    React.useEffect(() => {
        if (controlledValue !== undefined) {
            setQuery(controlledValue.toString());
        }
    }, [controlledValue]);

    const debouncedQuery = useDebounce(query, 500);

    React.useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedQuery || debouncedQuery.length < 3) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            try {
                // Using Photon API (by Komoot) which is based on OpenStreetMap but optimized for search-as-you-type
                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(
                        debouncedQuery
                    )}&limit=10`,
                    {
                        headers: {
                            "Accept-Language": "en-US,en;q=0.9",
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    // Map Photon's GeoJSON response to our Suggestion format
                    const mappedSuggestions: Suggestion[] = data.features.map((feature: any) => {
                        const { properties, geometry } = feature;

                        // Construct a display name from properties
                        const parts = [
                            properties.name,
                            properties.street,
                            properties.city,
                            properties.state,
                            properties.country
                        ].filter(Boolean);

                        // Remove duplicates (e.g. if name is same as city)
                        const uniqueParts = [...new Set(parts)];

                        return {
                            place_id: properties.osm_id,
                            display_name: uniqueParts.join(", "),
                            lat: geometry.coordinates[1].toString(),
                            lon: geometry.coordinates[0].toString(),
                        };
                    });

                    setSuggestions(mappedSuggestions);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error fetching location suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (onChange) {
            onChange(e);
        }
    };

    const handleSelect = (suggestion: Suggestion) => {
        const newValue = suggestion.display_name;
        setQuery(newValue);
        setSuggestions([]);
        setIsOpen(false);

        // Create a synthetic event for the parent's onChange if needed
        if (onChange) {
            const event = {
                target: { value: newValue, name: props.name },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
        }

        if (onLocationSelect) {
            onLocationSelect(newValue, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
        }
    };

    // Close dropdown when clicking outside
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                {...props}
                value={query}
                onChange={handleInputChange}
                className={cn("pr-10", className)}
                autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                    <MapPin className="h-4 w-4" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <ul className="max-h-[200px] overflow-auto py-1">
                        {suggestions.map((suggestion) => (
                            <li
                                key={suggestion.place_id}
                                onClick={() => handleSelect(suggestion)}
                                className="relative flex cursor-default select-none items-center px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                            >
                                <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <span className="line-clamp-1">{suggestion.display_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
