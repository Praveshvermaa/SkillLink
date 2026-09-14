'use client';

import { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Mail,
  User2,
  Calendar,
  Settings,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Briefcase,
  ExternalLink,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const isProvider = profile?.role === 'provider';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-20">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        
        {/* ── 1. Hero Profile Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-10 shadow-sm backdrop-blur-xl"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
            
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                  <AvatarFallback className="text-3xl font-extrabold bg-primary/10 text-primary">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-background" title="Active" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {profile?.name || "SkillLink Member"}
                  </h1>
                  <Badge
                    variant="outline"
                    className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full border-primary/30 bg-primary/5 text-primary flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    {profile?.role || "Member"}
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full">
                    Verified
                  </Badge>
                </div>

                <p className="text-muted-foreground text-xs sm:text-sm max-w-md leading-relaxed">
                  {isProvider
                    ? 'Verified service professional on SkillLink.'
                    : 'Registered client discovering and booking local services.'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link href="/profile/edit">
                <Button className="rounded-xl shadow-sm h-10 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>

          </div>
        </motion.div>

        {/* ── 2. Profile Details Grid ── */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Contact Details Card */}
          <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <User2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Contact Details</h3>
                <p className="text-xs text-muted-foreground">Primary communication channels</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <InfoRow icon={Mail} label="Email Address" value={profile?.email || 'Not provided'} />
              <InfoRow icon={Phone} label="Phone Number" value={profile?.phone || 'Not provided'} />
              <InfoRow icon={MapPin} label="Service Address / Area" value={profile?.address || 'Not specified'} />
            </div>
          </Card>

          {/* Quick Hub Navigation Card */}
          <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Account Hub</h3>
                <p className="text-xs text-muted-foreground">Shortcuts to manage your activities</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <Link href="/bookings" className="group block">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Bookings Center</p>
                      <p className="text-[11px] text-muted-foreground">View and manage scheduled services</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-all" />
                </div>
              </Link>

              {isProvider && (
                <Link href="/provider/skills" className="group block">
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Manage Listed Skills</p>
                        <p className="text-[11px] text-muted-foreground">Add or update your services</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-all" />
                  </div>
                </Link>
              )}

              <Link href="/dashboard" className="group block">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Main Dashboard</p>
                      <p className="text-[11px] text-muted-foreground">Summary metrics & quick tasks</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-all" />
                </div>
              </Link>
            </div>
          </Card>

        </div>

        {/* ── 3. Bio & About Section ── */}
        <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-6 sm:p-8 space-y-3">
          <h3 className="text-base font-bold">About & Bio</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {profile?.bio || 'No public bio written yet. Click "Edit Profile" above to share your background, qualifications, or service expectations.'}
          </p>
        </Card>

      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/40">
      <div className="p-2 rounded-xl bg-background border border-border/40 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
