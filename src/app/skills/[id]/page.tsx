import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Briefcase,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

import BookingForm from "./BookingForm";
import MessageProviderButton from "./MessageProviderButton";
import DeleteSkillButton from "./DeleteSkillButton";
import { getReviewsByProvider } from "@/app/reviews/actions";
import { ReviewList } from "@/components/reviews/ReviewList";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: skill, error } = await supabase
    .from("skills")
    .select(
      `
      *,
      provider:profiles(id, name, avatar_url, bio, role, phone)
    `
    )
    .eq("id", id)
    .single();

  if (error || !skill) notFound();

  const reviews = await getReviewsByProvider(skill.provider_id);
  const isOwner = user?.id === skill.provider_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-20">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

        {/* Back Link */}
        <div>
          <Link href="/skills">
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* ── 1. Hero Service Overview ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider capitalize"
                >
                  {skill.category || "General"}
                </Badge>
                {skill.address && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {skill.address}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {skill.title}
              </h1>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {skill.experience ? `${skill.experience} Experience` : "Expertise Verified"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  SkillLink Verified Provider
                </span>
              </div>
            </div>

            {/* Price Tag Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card/80 border border-border/60 shadow-sm text-center md:text-right shrink-0 w-full sm:w-auto">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Standard Rate</p>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">₹{skill.price}</p>
              <p className="text-[10px] text-muted-foreground">Fixed pricing / session</p>
            </div>
          </div>
        </div>

        {/* ── 2. Content Grid: Details vs Booking Form ── */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Main Info Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Description Card */}
            <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-bold">Service Details</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {skill.description || "No detailed service description provided."}
              </p>
            </Card>

            {/* Provider Profile Card */}
            <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold">About the Service Professional</h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-muted/20 border border-border/40">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-border/60 shadow-sm shrink-0">
                  <AvatarImage src={skill.provider?.avatar_url} className="object-cover" />
                  <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                    {skill.provider?.name?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-foreground">
                      {skill.provider?.name || "Professional Provider"}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 h-4 rounded-md">
                      Provider
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {skill.provider?.bio || "Experienced service professional ready to assist with your projects."}
                  </p>

                  <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                    <MessageProviderButton providerId={skill.provider?.id} />

                    {skill.provider?.phone && (
                      <Link href={`tel:${skill.provider.phone}`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 px-3 gap-1.5 border-border/60">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Call Provider
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Reviews Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Client Reviews & Feedback</h2>
                  <Badge variant="secondary" className="text-xs px-2.5 py-0.5 rounded-full">
                    {reviews?.length || 0}
                  </Badge>
                </div>
              </div>
              <ReviewList reviews={reviews} />
            </div>

          </div>

          {/* Sticky Booking Form Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h3 className="text-base font-bold">
                  {isOwner ? "Manage Your Listing" : "Book Service"}
                </h3>
                <Badge variant="outline" className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                  Available Now
                </Badge>
              </div>

              {isOwner ? (
                <div className="space-y-3 bg-muted/30 rounded-2xl p-5 text-center">
                  <p className="text-xs text-muted-foreground">
                    This is your published listing on SkillLink.
                  </p>
                  <Link href="/provider/skills" className="block">
                    <Button className="w-full rounded-xl text-xs h-10" variant="outline">
                      Edit in Provider Dashboard
                    </Button>
                  </Link>
                  <DeleteSkillButton skillId={skill.id} />
                </div>
              ) : (
                <BookingForm
                  skillId={skill.id}
                  providerId={skill.provider?.id}
                  price={skill.price}
                />
              )}
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
