'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSkillsSortedByDistance, getSkillsDefault } from '@/app/skills/actions';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Navigation,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  User,
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { createClient } from '@/lib/supabase/client';

export default function SkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchInput, setSearchInput] = useState(q);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check user role
  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    }
    checkRole();
  }, []);

  // Request geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          let msg = 'Could not retrieve precise location. Showing all skills.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location access was not enabled. Results are sorted chronologically.';
          }
          setLocationError(msg);
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Fetch skills based on search and location
  useEffect(() => {
    async function loadSkills() {
      setLoading(true);
      let data;
      let error;

      if (userLocation) {
        const res = await getSkillsSortedByDistance(
          userLocation.lat,
          userLocation.lon,
          q
        );
        data = res.data;
        error = res.error;
      } else {
        const res = await getSkillsDefault(q);
        data = res.data;
        error = res.error;
      }

      if (error) {
        console.error('Error fetching skills:', error);
      }

      setSkills(data || []);
      setLoading(false);
    }

    loadSkills();
  }, [q, userLocation]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set('q', searchInput.trim());
    }
    router.push(`/skills?${params.toString()}`);
  };

  // Derive unique categories from fetched skills
  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => {
      if (s.category) set.add(s.category.toLowerCase());
    });
    return Array.from(set);
  }, [skills]);

  // Filter skills by selected category
  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') return skills;
    return skills.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [skills, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* ── 1. Modern Catalog Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-8 md:p-10 shadow-sm backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  Skill Marketplace
                </h1>
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full border-primary/30 bg-primary/5 text-primary">
                  {skills.length} Available Services
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Connect with verified local professionals, compare fixed pricing, and book on-demand services right in your neighborhood.
              </p>
            </div>

            {/* Post a skill CTA - only visible to providers */}
            {userRole === 'provider' && (
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <Link href="/provider/skills" className="w-full sm:w-auto">
                  <Button className="w-full rounded-xl shadow-md h-11 px-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                    <Plus className="h-4 w-4" />
                    List Your Skill
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Search & Filter Bar ── */}
        <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search plumbing, design, electrical, tutors..."
                className="h-10 pl-10 pr-20 rounded-xl text-xs sm:text-sm bg-muted/30 border-border/60 focus-visible:ring-1"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg text-xs h-7 px-3 bg-primary text-primary-foreground"
              >
                Search
              </Button>
            </form>

            {/* Location Status Pill */}
            <div className="flex items-center gap-2 text-xs">
              {userLocation ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Navigation className="h-3.5 w-3.5 animate-pulse" />
                  <span>GPS Active (Sorted by nearest)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>General listings</span>
                </div>
              )}
            </div>

          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/40">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 capitalize ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Categories ({skills.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 capitalize ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* ── 3. Skills Cards Grid ── */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-muted/30 border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredSkills.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 px-4 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md space-y-4"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <SlidersHorizontal className="h-7 w-7 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">No skills found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                    {q
                      ? `No listings match "${q}". Try a broader term or reset filters.`
                      : 'No skills are available in this category yet.'}
                  </p>
                </div>
                {(q || selectedCategory !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all');
                      router.push('/skills');
                    }}
                    className="rounded-xl text-xs h-9"
                  >
                    Clear All Filters
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredSkills.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full group">
                      
                      {/* Card Header: Category & Price */}
                      <CardHeader className="p-5 pb-3 border-b border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full capitalize"
                          >
                            {skill.category || 'General'}
                          </Badge>

                          {/* Distance badge if available */}
                          {skill.distance !== undefined && skill.distance !== Infinity && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium border-primary/30 bg-primary/5 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Navigation className="h-2.5 w-2.5" />
                              {skill.distance < 1
                                ? `${(skill.distance * 1000).toFixed(0)} m away`
                                : `${skill.distance.toFixed(1)} km away`}
                            </Badge>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {skill.title}
                          </CardTitle>
                          <span className="text-base font-extrabold text-foreground shrink-0">
                            ₹{skill.price}
                          </span>
                        </div>
                      </CardHeader>

                      {/* Card Body: Description & Location */}
                      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {skill.description || 'No description provided.'}
                        </p>

                        {skill.address && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{skill.address}</span>
                          </div>
                        )}
                      </CardContent>

                      {/* Card Footer: Provider & CTA */}
                      <CardFooter className="p-5 pt-3 border-t border-border/40 bg-muted/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-8 w-8 rounded-xl border border-border/60 shrink-0">
                            <AvatarImage src={skill.provider?.avatar_url || undefined} className="object-cover" />
                            <AvatarFallback className="rounded-xl text-xs font-bold bg-primary/10 text-primary">
                              {skill.provider?.name?.[0]?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {skill.provider?.name || 'Verified Provider'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Service Partner</p>
                          </div>
                        </div>

                        <Link href={`/skills/${skill.id}`}>
                          <Button size="sm" className="rounded-xl text-xs font-semibold h-8 px-3 gap-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                            View
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </CardFooter>

                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
