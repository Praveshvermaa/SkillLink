'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  Compass,
  Zap,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [bookingsList, setBookingsList] = useState<RecentBooking[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

      // Fetch unread messages
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

      // Fetch recent bookings (last 20 for interactive filtering)
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
        .limit(20);

      const mapped: RecentBooking[] = (bookings || []).map((b: any) => {
        const counterparty = isProvider ? b.customer : b.provider;
        return {
          id: b.id,
          date: b.date,
          status: b.status,
          skillTitle: b.skill?.title || 'Untitled Session',
          counterpartyName: counterparty?.name || 'Unknown User',
          counterpartyAvatar: counterparty?.avatar_url || null,
          price: b.skill?.price ?? null,
        };
      });

      setBookingsList(mapped);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const isProvider = profile?.role === 'provider';

  // Dynamic greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
          indicator: 'bg-emerald-500',
          label: 'Approved',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
          indicator: 'bg-amber-500 animate-pulse',
          label: 'Pending',
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-sky-500 dark:text-sky-400',
          bg: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300',
          indicator: 'bg-sky-500',
          label: 'Completed',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-rose-500 dark:text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300',
          indicator: 'bg-rose-500',
          label: 'Rejected',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-muted-foreground',
          bg: 'bg-muted border-border text-muted-foreground',
          indicator: 'bg-muted-foreground',
          label: status || 'Unknown',
        };
    }
  };

  // Filter bookings based on activeTab and searchQuery
  const filteredBookings = useMemo(() => {
    return bookingsList.filter((booking) => {
      const matchesTab =
        activeTab === 'all' || booking.status.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        booking.skillTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [bookingsList, activeTab, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts = { all: bookingsList.length, pending: 0, approved: 0, completed: 0, rejected: 0 };
    bookingsList.forEach((b) => {
      const s = b.status?.toLowerCase();
      if (s === 'pending') counts.pending++;
      else if (s === 'approved') counts.approved++;
      else if (s === 'completed') counts.completed++;
      else if (s === 'rejected') counts.rejected++;
    });
    return counts;
  }, [bookingsList]);

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8 animate-pulse">
        {/* Skeleton hero */}
        <div className="h-56 w-full rounded-3xl bg-muted/40 border border-border/40" />
        {/* Skeleton stats */}
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted/30 border border-border/40" />
          ))}
        </div>
        {/* Skeleton main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-muted/30 border border-border/40" />
          <div className="h-96 rounded-3xl bg-muted/30 border border-border/40" />
        </div>
      </div>
    );
  }

  const quickActions = isProvider
    ? [
        {
          title: 'Add New Skill',
          desc: 'Create a new service listing',
          icon: Plus,
          href: '/provider/skills',
          gradient: 'from-violet-500/20 to-indigo-500/20 text-indigo-500 dark:text-indigo-400',
          border: 'group-hover:border-indigo-500/30',
        },
        {
          title: 'Direct Messages',
          desc: `${stats.unreadMessages} new message${stats.unreadMessages !== 1 ? 's' : ''}`,
          icon: MessageSquare,
          href: '/chat',
          gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400',
          border: 'group-hover:border-emerald-500/30',
        },
        {
          title: 'Booking Pipeline',
          desc: `${stats.pendingBookings} pending requests`,
          icon: Calendar,
          href: '/bookings',
          gradient: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
          border: 'group-hover:border-amber-500/30',
        },
        {
          title: 'Edit Profile',
          desc: 'Update bio, rates & portfolio',
          icon: Settings,
          href: '/profile/edit',
          gradient: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-500 dark:text-fuchsia-400',
          border: 'group-hover:border-fuchsia-500/30',
        },
      ]
    : [
        {
          title: 'Explore Skills',
          desc: 'Find verified pros near you',
          icon: Search,
          href: '/skills',
          gradient: 'from-violet-500/20 to-indigo-500/20 text-indigo-500 dark:text-indigo-400',
          border: 'group-hover:border-indigo-500/30',
        },
        {
          title: 'Direct Messages',
          desc: `${stats.unreadMessages} unread messages`,
          icon: MessageSquare,
          href: '/chat',
          gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400',
          border: 'group-hover:border-emerald-500/30',
        },
        {
          title: 'My Bookings',
          desc: 'Manage and review sessions',
          icon: Calendar,
          href: '/bookings',
          gradient: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
          border: 'group-hover:border-amber-500/30',
        },
        {
          title: 'Profile Settings',
          desc: 'Personal details & preferences',
          icon: Settings,
          href: '/profile/edit',
          gradient: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-500 dark:text-fuchsia-400',
          border: 'group-hover:border-fuchsia-500/30',
        },
      ];

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      badge: stats.pendingBookings > 0 ? `${stats.pendingBookings} pending` : 'Up to date',
      badgeVariant: stats.pendingBookings > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: Calendar,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      borderGlow: 'hover:border-indigo-500/30 dark:hover:border-indigo-500/40',
    },
    ...(isProvider
      ? [{
          title: 'Active Listings',
          value: stats.activeSkills,
          badge: stats.activeSkills > 0 ? 'Live in catalog' : 'No active skills',
          badgeVariant: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: Briefcase,
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          borderGlow: 'hover:border-emerald-500/30 dark:hover:border-emerald-500/40',
        }]
      : [{
          title: 'Marketplace Services',
          value: 'Live',
          badge: 'Verified experts',
          badgeVariant: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: Compass,
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          borderGlow: 'hover:border-emerald-500/30 dark:hover:border-emerald-500/40',
        }]),
    {
      title: 'Direct Messages',
      value: stats.unreadMessages,
      badge: stats.unreadMessages > 0 ? 'Action needed' : 'All clear',
      badgeVariant: stats.unreadMessages > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : 'bg-muted text-muted-foreground border-border',
      icon: MessageSquare,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      borderGlow: 'hover:border-amber-500/30 dark:hover:border-amber-500/40',
    },
    ...(isProvider
      ? [{
          title: 'Client Satisfaction',
          value: stats.avgRating !== null ? stats.avgRating.toFixed(1) : '—',
          badge: stats.totalReviews > 0 ? `${stats.totalReviews} verified review${stats.totalReviews !== 1 ? 's' : ''}` : 'New provider',
          badgeVariant: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
          icon: Star,
          iconColor: 'text-yellow-500 dark:text-yellow-400',
          iconBg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
          borderGlow: 'hover:border-yellow-500/30 dark:hover:border-yellow-500/40',
        }]
      : [{
          title: 'Account Standing',
          value: 'Verified',
          badge: 'Active client',
          badgeVariant: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          icon: ShieldCheck,
          iconColor: 'text-sky-500 dark:text-sky-400',
          iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
          borderGlow: 'hover:border-sky-500/30 dark:hover:border-sky-500/40',
        }]),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-16">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* ── 1. Executive Modern Hero Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-8 md:p-10 shadow-sm backdrop-blur-xl"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* User Details */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20 shadow-md ring-4 ring-background">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.name} className="object-cover" />
                  <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10 text-primary">
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" title="Online" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {greeting}, {profile?.name?.split(' ')[0] || 'Member'}
                  </h1>
                  <Badge
                    variant="outline"
                    className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full border-primary/30 bg-primary/5 text-primary flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    {profile?.role || 'Client'}
                  </Badge>
                  {stats.pendingBookings > 0 && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full border-0">
                      {stats.pendingBookings} Action required
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
                  {isProvider
                    ? 'Seamlessly track client requests, manage active bookings, and maintain top ratings.'
                    : 'Discover vetted service professionals, track your bookings, and connect effortlessly.'}
                </p>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-start sm:justify-end flex-shrink-0">
              {isProvider ? (
                <>
                  <Link href="/bookings" className="flex-1 sm:flex-initial">
                    <Button variant="outline" className="w-full rounded-xl border-border/80 hover:bg-muted/80 h-11 px-4 gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      View Bookings
                    </Button>
                  </Link>
                  <Link href="/provider/skills" className="flex-1 sm:flex-initial">
                    <Button className="w-full rounded-xl shadow-md h-11 px-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                      <Plus className="h-4 w-4" />
                      Post New Skill
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/bookings" className="flex-1 sm:flex-initial">
                    <Button variant="outline" className="w-full rounded-xl border-border/80 hover:bg-muted/80 h-11 px-4 gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      My Bookings
                    </Button>
                  </Link>
                  <Link href="/skills" className="flex-1 sm:flex-initial">
                    <Button className="w-full rounded-xl shadow-md h-11 px-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                      <Search className="h-4 w-4" />
                      Explore Skills
                    </Button>
                  </Link>
                </>
              )}
            </div>

          </div>
        </motion.div>

        {/* ── 2. Stat Analytics Cards ── */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
              >
                <Card className={`relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${item.borderGlow}`}>
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.title}
                      </span>
                      <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">
                        {item.value}
                      </span>
                    </div>

                    <div className="pt-1">
                      <Badge variant="outline" className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${item.badgeVariant}`}>
                        {item.badge}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ── 3. Main Operational Center: Pipeline + Sidebar ── */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">

          {/* Left Column: Interactive Booking Pipeline (2 cols on large screens) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="lg:col-span-2 space-y-4"
          >
            <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-bold tracking-tight">Booking Pipeline</CardTitle>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full font-semibold">
                        {bookingsList.length} total
                      </Badge>
                    </div>
                    <CardDescription className="text-xs sm:text-sm mt-0.5 text-muted-foreground">
                      Filter, track, and review real-time booking statuses.
                    </CardDescription>
                  </div>

                  <Link href="/bookings">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold rounded-lg hover:bg-muted self-start sm:self-auto">
                      All Bookings <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-muted/60 p-1 rounded-xl h-10 w-full sm:w-auto grid grid-cols-5 sm:flex">
                      <TabsTrigger value="all" className="rounded-lg text-xs font-medium px-3">
                        All <span className="ml-1 text-[10px] opacity-70">({statusCounts.all})</span>
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="rounded-lg text-xs font-medium px-3">
                        Pending <span className="ml-1 text-[10px] opacity-70">({statusCounts.pending})</span>
                      </TabsTrigger>
                      <TabsTrigger value="approved" className="rounded-lg text-xs font-medium px-3">
                        Approved <span className="ml-1 text-[10px] opacity-70">({statusCounts.approved})</span>
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="rounded-lg text-xs font-medium px-3">
                        Done <span className="ml-1 text-[10px] opacity-70">({statusCounts.completed})</span>
                      </TabsTrigger>
                      <TabsTrigger value="rejected" className="rounded-lg text-xs font-medium px-3">
                        Rejected
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 pl-9 pr-3 rounded-xl text-xs bg-muted/30 border-border/60 focus-visible:ring-1"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  {filteredBookings.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 px-4 space-y-3"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
                        <SlidersHorizontal className="h-6 w-6 opacity-60" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">No bookings found</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          {searchQuery
                            ? `No results matching "${searchQuery}". Try a different search term.`
                            : activeTab !== 'all'
                            ? `You have no ${activeTab} bookings at this moment.`
                            : isProvider
                            ? 'Your incoming bookings from clients will appear right here.'
                            : 'Explore our catalog and book your first skilled professional.'}
                        </p>
                      </div>
                      {activeTab !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab('all');
                            setSearchQuery('');
                          }}
                          className="rounded-xl text-xs h-8"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bookings-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2.5"
                    >
                      {filteredBookings.map((booking) => {
                        const statusConfig = getStatusConfig(booking.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <Link
                            key={booking.id}
                            href={`/bookings/${booking.id}`}
                            className="group block"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-border/40 bg-background/60 hover:bg-muted/40 hover:border-border transition-all duration-200 gap-3 group-hover:shadow-sm">
                              
                              {/* Left: Avatar + Title & Details */}
                              <div className="flex items-center gap-3.5 min-w-0">
                                <Avatar className="h-11 w-11 rounded-xl border border-border/60 shrink-0">
                                  <AvatarImage src={booking.counterpartyAvatar || undefined} className="object-cover" />
                                  <AvatarFallback className="rounded-xl text-xs font-semibold bg-primary/10 text-primary">
                                    {booking.counterpartyName?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                                      {booking.skillTitle}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bg}`}
                                    >
                                      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${statusConfig.indicator}`} />
                                      {statusConfig.label}
                                    </Badge>
                                  </div>

                                  <p className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      {booking.counterpartyName}
                                    </span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      {format(new Date(booking.date), 'MMM d, yyyy')}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* Right: Price & CTA Arrow */}
                              <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0 shrink-0">
                                {booking.price !== null && (
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-foreground">
                                      ₹{booking.price}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block -mt-0.5">fixed fee</span>
                                  </div>
                                )}
                                <div className="h-8 w-8 rounded-xl bg-muted/50 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                </div>
                              </div>

                            </div>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Shortcuts & Profile Overview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
            className="space-y-6"
          >
            
            {/* Quick Actions Panel */}
            <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold tracking-tight">Quick Actions</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Frequent shortcuts to power your workflow.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href} className="group block">
                      <div className={`flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-background/50 hover:bg-muted/40 transition-all duration-200 hover:-translate-y-0.5 ${action.border}`}>
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {action.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{action.desc}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Profile Overview Card */}
            <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Profile Presence</h3>
                    <p className="text-xs text-muted-foreground">Visibility on SkillLink</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                  Active
                </Badge>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Profile Completeness</span>
                  <span className="text-foreground font-semibold">90%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '90%' }} />
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs h-9 justify-center gap-1.5 border-border/60">
                    <Settings className="h-3.5 w-3.5" />
                    Complete Profile Setup
                  </Button>
                </Link>
              </div>
            </Card>

          </motion.div>

        </div>

      </div>
    </div>
  );
}
