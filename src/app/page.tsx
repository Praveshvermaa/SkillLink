import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Search, Star, LayoutDashboard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex flex-col min-h-screen">

            {/* Hero Section */}
            <section className="relative py-20 md:py-32 overflow-x-hidden overflow-y-visible bg-gradient-to-b from-background to-muted/30">
                <div className="container max-w-screen-xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">

                        {/* Logo */}
                        <div className="mb-4">
                            <Image
                                src="/skilllink-logo.png"
                                alt="SkillLink Logo"
                                width={120}
                                height={120}
                                priority
                                className="object-contain block"
                            />
                        </div>

                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                            New: Real-time Chat & Video Calls
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Find the Perfect Skill for Your Needs
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-[42rem] leading-relaxed">
                            Connect with top-rated professionals in your area. From home repairs to personal tutoring, SkillLink makes it easy to find and book experts.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                            <Link href="/skills">
                                <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
                                    <Search className="h-4 w-4" />
                                    Find a Pro
                                </Button>
                            </Link>

                            {user ? (
                                <Link href="/dashboard">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
                                        <LayoutDashboard className="h-4 w-4" />
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/auth/signup">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
                                        Become a Provider
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Background Decoration - Fixed for Edge */}
                <div className="absolute pointer-events-none will-change-transform 
                                top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
            </section>

            {/* Features Section */}
            <section className="py-20 bg-background">
                <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 rounded-full bg-primary/10 mb-4">
                                <Search className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Easy Discovery</h3>
                            <p className="text-muted-foreground">
                                Find professionals by skill, location, or rating. Our smart search helps you find exactly who you need.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 rounded-full bg-primary/10 mb-4">
                                <CheckCircle className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Verified Pros</h3>
                            <p className="text-muted-foreground">
                                All providers are verified for your safety. Read reviews from real users before you book.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 rounded-full bg-primary/10 mb-4">
                                <Star className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Seamless Booking</h3>
                            <p className="text-muted-foreground">
                                Book appointments, chat with providers, and manage your payments all in one place.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
                    <div className="relative rounded-3xl overflow-hidden bg-primary px-6 py-16 md:px-16 md:py-24 text-center">

                        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                                {user ? "Ready to book your next service?" : "Ready to get started?"}
                            </h2>

                            <p className="text-lg text-primary-foreground/80">
                                {user
                                    ? "Browse thousands of skilled professionals and find the perfect match for your needs."
                                    : "Join thousands of users who are finding the help they need or growing their business on SkillLink."
                                }
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">

                                {user ? (
                                    <Link href="/dashboard">
                                        <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/auth/signup">
                                        <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                                            Sign Up Now
                                        </Button>
                                    </Link>
                                )}

                                <Link href="/skills">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                                        Browse Skills
                                    </Button>
                                </Link>

                            </div>
                        </div>

                        {/* Background Pattern - Edge fix (added block) */}
                        <div className="absolute inset-0 opacity-10">
                            <svg className="h-full w-full block" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
                            </svg>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    )
}
