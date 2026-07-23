'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Calendar,
  MessageSquare,
  Search,
  Briefcase,
  ArrowRight,
  User,
  Star,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardStats = {
  totalBookings: number;
  pendingBookings: number;
  activeSkills: number;
  unreadMessages: number;
  avgRating: number | null;
  totalReviews: number;
};

type RecentBooking = {
  id: string;
  date: string;
  status: string;
  skillTitle: string;
  counterpartyName: string;
  counterpartyAvatar: string | null;
  price: number | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    activeSkills: 0,
    unreadMessages: 0,
    avgRating: null,
    totalReviews: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const isProvider = profileData?.role === 'provider';

      // Fetch total bookings
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},provider_id.eq.${user.id}`);

      // Fetch pending bookings
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},provider_id.eq.${user.id}`)
        .eq('status', 'pending');

      // Fetch active skills count (if provider)
      let skillCount = 0;
      if (isProvider) {
        const { count } = await supabase
          .from('skills')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id);
        skillCount = count || 0;
      }

      // Fetch unread messages (two-step: find user's chats, then count unread)
      let unreadCount = 0;
      const { data: userChats } = await supabase
        .from('chats')
        .select('id')
        .or(`user_id.eq.${user.id},provider_id.eq.${user.id}`);

      if (userChats && userChats.length > 0) {
        const chatIds = userChats.map((c: any) => c.id);
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
          .neq('sender_id', user.id)
          .eq('read', false);
        unreadCount = count || 0;
      }

      // Fetch average rating (if provider)
      let avgRating: number | null = null;
      let totalReviews = 0;
      if (isProvider) {
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('rating, bookings!inner(provider_id)')
          .eq('bookings.provider_id', user.id);

        if (reviewData && reviewData.length > 0) {
          totalReviews = reviewData.length;
          const sum = reviewData.reduce((acc: number, r: any) => acc + r.rating, 0);
          avgRating = sum / totalReviews;
        }
      }

      setStats({
        totalBookings: bookingCount || 0,
        pendingBookings: pendingCount || 0,
        activeSkills: skillCount,
        unreadMessages: unreadCount || 0,
        avgRating,
        totalReviews,
      });

      // Fetch recent bookings (last 5)
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, date, status,
          skill:skills(title, price),
          provider:profiles!bookings_provider_id_fkey(name, avatar_url),
          customer:profiles!bookings_user_id_fkey(name, avatar_url)
        `)
        .or(`user_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      const mapped: RecentBooking[] = (bookings || []).map((b: any) => {
        const counterparty = isProvider ? b.customer : b.provider;
        return {
          id: b.id,
          date: b.date,
          status: b.status,
          skillTitle: b.skill?.title || 'Unknown Skill',
          counterpartyName: counterparty?.name || 'Unknown',
          counterpartyAvatar: counterparty?.avatar_url || null,
          price: b.skill?.price ?? null,
        };
      });

      setRecentBookings(mapped);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const isProvider = profile?.role === 'provider';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Approved' };
      case 'pending':
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' };
      case 'completed':
        return { icon: CheckCircle2, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20', label: 'Completed' };
      case 'rejected':
        return { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Rejected' };
      default:
        return { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: status };
    }
  };

  if (loading) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Skeleton loader */}
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const quickActions = isProvider
    ? [
        { title: 'Add New Skill', icon: Plus, href: '/provider/skills', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { title: 'View Messages', icon: MessageSquare, href: '/chat', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'Manage Bookings', icon: Calendar, href: '/bookings', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { title: 'Edit Profile', icon: Settings, href: '/profile/edit', color: 'text-purple-500', bg: 'bg-purple-500/10' },
      ]
    : [
        { title: 'Find Skills', icon: Search, href: '/skills', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { title: 'View Messages', icon: MessageSquare, href: '/chat', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'My Bookings', icon: Calendar, href: '/bookings', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { title: 'Edit Profile', icon: Settings, href: '/profile/edit', color: 'text-purple-500', bg: 'bg-purple-500/10' },
      ];

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      trend: stats.pendingBookings > 0 ? `${stats.pendingBookings} pending` : 'All clear',
    },
    ...(isProvider
      ? [{
          title: 'Active Skills',
          value: stats.activeSkills,
          icon: Briefcase,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          trend: 'Listed services',
        }]
      : [{
          title: 'Skills Explored',
          value: '∞',
          icon: Search,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          trend: 'Browse anytime',
        }]),
    {
      title: 'Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      trend: stats.unreadMessages > 0 ? 'Unread messages' : 'All caught up',
    },
    ...(isProvider && stats.avgRating !== null
      ? [{
          title: 'Avg Rating',
          value: stats.avgRating.toFixed(1),
          icon: Star,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          trend: `${stats.totalReviews} review${stats.totalReviews !== 1 ? 's' : ''}`,
        }]
      : [{
          title: 'Rating',
          value: '—',
          icon: Star,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          trend: isProvider ? 'No reviews yet' : 'Leave reviews after sessions',
        }]),
  ];

  return (
    <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8 space-y-8">

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-8 md:p-10"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {profile?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {profile?.name?.split(' ')[0]} 👋
              </h1>
              <Badge variant="secondary" className="capitalize text-xs px-3 py-1">
                {profile?.role}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              {isProvider
                ? 'Manage your bookings, grow your client base, and track your performance.'
                : 'Discover skilled professionals near you and manage your service requests.'}
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            {isProvider ? (
              <Link href="/provider/skills">
                <Button className="gap-2 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add Skill
                </Button>
              </Link>
            ) : (
              <Link href="/skills">
                <Button className="gap-2 rounded-xl shadow-sm">
                  <Search className="h-4 w-4" />
                  Find a Pro
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* ── Stats Grid ── */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {statCards.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
            >
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-[2px] bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${item.bg}`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{item.value}</div>
                  <p className="text-xs text-muted-foreground mt-1.5">{item.trend}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bottom Grid: Recent Bookings + Quick Actions ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
          className="lg:col-span-3"
        >
          <Card className="rounded-2xl shadow-sm bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
                  <CardDescription className="text-xs">Your latest activity</CardDescription>
                </div>
                <Link href="/bookings">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs rounded-lg">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentBookings.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No bookings yet</p>
                  <p className="text-xs mt-1">
                    {isProvider ? 'Your bookings will appear here.' : 'Book a service to get started!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentBookings.map((booking, i) => {
                    const statusConfig = getStatusConfig(booking.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div key={booking.id}>
                        {i > 0 && <Separator className="my-1" />}
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                        >
                          <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarImage src={booking.counterpartyAvatar || undefined} />
                            <AvatarFallback className="text-xs bg-muted">
                              {booking.counterpartyName[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{booking.skillTitle}</p>
                              <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 border ${statusConfig.bg} ${statusConfig.color}`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <User className="h-3 w-3" />
                              {booking.counterpartyName}
                              <span className="text-muted-foreground/40">·</span>
                              {format(new Date(booking.date), 'MMM d, yyyy')}
                            </p>
                          </div>

                          {booking.price && (
                            <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                              ₹{booking.price}
                            </span>
                          )}

                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl shadow-sm bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Shortcuts to key features</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border hover:-translate-y-[2px] transition-all cursor-pointer group">
                        <div className={`p-3 rounded-xl ${action.bg} group-hover:scale-110 transition-transform`}>
                          <ActionIcon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                          {action.title}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
