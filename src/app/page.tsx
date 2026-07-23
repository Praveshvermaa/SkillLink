import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Wrench, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-zinc-950/20">
            {/* Grid background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

            {/* ── HERO SECTION ── */}
            <section className="relative py-12 md:py-20 overflow-visible">
                <div className="container max-w-7xl mx-auto px-4 md:px-6">
                    {/* Main Glassmorphic Showcase Container */}
                    <div className="relative rounded-[32px] border border-white/60 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-900/20 shadow-2xl backdrop-blur-xl p-8 md:p-14 lg:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                        
                        {/* Left Content Column */}
                        <div className="flex-1 space-y-6 text-left relative z-10">
                            {/* Feature Badge */}
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 dark:border-zinc-800/60 bg-slate-100/80 dark:bg-zinc-900/80 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 shadow-sm backdrop-blur-sm">
                                <span>✨</span>
                                <span>New: Real-time chat & location-based matching</span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                                Find <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">Trusted Experts</span> & <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Learn New Skills</span> <br />
                                In Your Neighborhood
                            </h1>

                            {/* Description */}
                            <p className="text-base md:text-lg text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                                Connect with local specialists, discover unique skills, and access reliable services from vetted providers within your community.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <Link href="/skills">
                                    <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500 hover:opacity-95 transition-opacity text-white border-0 font-semibold px-8 h-12 shadow-md flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        Find a Pro
                                    </Button>
                                </Link>

                                {user ? (
                                    <Link href="/dashboard">
                                        <Button variant="outline" size="lg" className="rounded-full border-slate-200 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 px-8 h-12 shadow-sm font-semibold">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/auth/signup">
                                        <Button variant="outline" size="lg" className="rounded-full border-slate-200 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 px-8 h-12 shadow-sm font-semibold">
                                            Become a Provider
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Right Graphic Column */}
                        <div className="relative w-full max-w-md lg:max-w-none flex-1 flex items-center justify-center lg:justify-end min-h-[300px]">
                            {/* Blur Background Blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/25 dark:bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
                            <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-purple-400/25 dark:bg-purple-500/10 rounded-full blur-3xl -z-10" />
                            <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-orange-400/25 dark:bg-orange-500/10 rounded-full blur-3xl -z-10" />

                            {/* Floating Glassmorphic Profile Card */}
                            <div className="relative w-full max-w-[320px] backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-white/80 dark:border-zinc-800/80 shadow-2xl rounded-3xl p-6 transition-all hover:scale-[1.02] duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-14 w-14 rounded-full overflow-hidden border border-slate-100 shadow-sm">
                                        <Image
                                            src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80"
                                            alt="Alex Thompson"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-zinc-100">Alex Thompson</h3>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">local plumber</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 ml-1.5">4.9</span>
                                    <span className="text-xs text-slate-400">| 128 Reviews</span>
                                </div>

                                <div className="space-y-2 mt-4 text-sm text-slate-600 dark:text-zinc-300">
                                    <div className="flex items-center gap-2">
                                        <Wrench className="h-4 w-4 text-slate-400" />
                                        <span>Plumber</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        <span>0.8 miles away</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">Available Now</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── CATEGORIES SECTION ── */}
            <section className="py-16 md:py-24 bg-white dark:bg-zinc-950/40 border-t border-slate-100 dark:border-zinc-900/60">
                <div className="container max-w-7xl mx-auto px-4 md:px-6 text-center space-y-12">
                    {/* Header */}
                    <div className="space-y-3">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Discover Top Local Categories
                        </h2>
                        <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto text-sm md:text-base">
                            Explore thousands of services and skills near you
                        </p>
                    </div>

                    {/* Category Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        
                        {/* 1. Tutors */}
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group dark:bg-zinc-900 dark:border-zinc-850">
                            <div className="relative mb-6 transform group-hover:scale-105 transition-transform duration-300">
                                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20">
                                    <path d="M12 28C12 28 20 20 40 20C60 20 68 28 68 28" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M12 50C12 50 20 42 40 42C60 42 68 50 68 50" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M14 26V52C14 52 23 48 40 48C57 48 66 52 66 52V26" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M40 12L68 24L40 36L12 24L40 12Z" fill="#1e293b" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M60 28.5V45L64 48" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="64" cy="48" r="2.5" fill="#f59e0b" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">Tutors</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center leading-relaxed">
                                Academic, Language,<br />Music
                            </p>
                        </div>

                        {/* 2. Home Services */}
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group dark:bg-zinc-900 dark:border-zinc-850">
                            <div className="relative mb-6 transform group-hover:scale-105 transition-transform duration-300">
                                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20">
                                    <path d="M22 34V60C22 62.2 23.8 64 26 64H54C56.2 64 58 62.2 58 60V34" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 38L40 18L64 38" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M34 64V46H46V64" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <rect x="48" y="12" width="6" height="12" rx="1" fill="#475569" />
                                    <path d="M46 36H56V42C56 44.2 54.2 46 52 46C49.8 46 48 44.2 48 42V36Z" fill="#3b82f6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M52 28L60 36" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">Home Services</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center leading-relaxed">
                                Plumbing, Electric,<br />Cleaning
                            </p>
                        </div>

                        {/* 3. Wellness */}
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group dark:bg-zinc-900 dark:border-zinc-850">
                            <div className="relative mb-6 transform group-hover:scale-105 transition-transform duration-300">
                                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20">
                                    <circle cx="40" cy="24" r="6" stroke="#475569" strokeWidth="2.5" />
                                    <path d="M26 58C28 46 34 38 40 38C46 38 52 46 54 58" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M22 46C22 46 30 42 40 46C50 50 58 46 58 46" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M40 38V54" stroke="#475569" strokeWidth="2" />
                                    <path d="M52 22C52 18 56 16 60 20C64 24 60 28 56 26" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#ef4444" fillOpacity="0.1" />
                                    <circle cx="20" cy="28" r="1.5" fill="#3b82f6" />
                                    <circle cx="62" cy="38" r="1.5" fill="#8b5cf6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">Wellness</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center leading-relaxed">
                                Fitness, Mental Health,<br />Yoga
                            </p>
                        </div>

                        {/* 4. Tech & Digital */}
                        <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group dark:bg-zinc-900 dark:border-zinc-850">
                            <div className="relative mb-6 transform group-hover:scale-105 transition-transform duration-300">
                                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20">
                                    <rect x="14" y="16" width="52" height="34" rx="4" stroke="#475569" strokeWidth="2.5" fill="#1e293b" fillOpacity="0.05" />
                                    <path d="M10 58H70" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M30 50L26 58" stroke="#475569" strokeWidth="2.5" />
                                    <path d="M50 50L54 58" stroke="#475569" strokeWidth="2.5" />
                                    <path d="M22 28L28 33L22 38" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M32 38H42" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                                    <circle cx="58" cy="24" r="2.5" fill="#ec4899" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">Tech & Digital</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center leading-relaxed">
                                Web Dev, Design,<br />Marketing
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    )
}
