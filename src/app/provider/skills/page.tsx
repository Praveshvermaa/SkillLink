'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { motion } from "framer-motion";
import { Trash2, Plus, Sparkles, Briefcase, ArrowUpRight, ArrowLeft } from "lucide-react";

import CreateSkillForm from './create-skill-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteSkill } from '../actions';

export default function ProviderSkillsPage() {
    const router = useRouter();
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function loadData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Check provider role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'provider') {
                router.push('/dashboard');
                return;
            }

            const { data: skillsData } = await supabase
                .from('skills')
                .select('*')
                .eq('provider_id', user.id)
                .order('created_at', { ascending: false });

            setSkills(skillsData || []);
            setLoading(false);
        }

        loadData();
    }, [router]);

    const handleDeleteClick = (skillId: string) => {
        setSkillToDelete(skillId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!skillToDelete) return;

        setDeleting(true);
        const result = await deleteSkill(skillToDelete);

        if (result.error) {
            alert(result.error);
            setDeleting(false);
            setDeleteDialogOpen(false);
            return;
        }

        // Remove the skill from the local state
        setSkills(skills.filter(s => s.id !== skillToDelete));
        setDeleting(false);
        setDeleteDialogOpen(false);
        setSkillToDelete(null);
    };

    if (loading) {
        return (
            <div className="container max-w-7xl mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
                <div className="text-muted-foreground animate-pulse">Loading listings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-20">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                    Provider Services
                                </h1>
                                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full border-primary/30 bg-primary/5 text-primary">
                                    {skills.length} Active Listings
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                                Create and manage the services you offer to clients across SkillLink.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="outline" className="rounded-xl border-border/80 h-11 px-4 gap-2">
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/skills">
                                <Button variant="ghost" className="rounded-xl h-11 px-4 gap-2">
                                    View Marketplace
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">

                    {/* Add Skill Form Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="lg:col-span-5 space-y-4"
                    >
                        <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-6">
                            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border/40">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">List a New Skill</h2>
                                    <p className="text-xs text-muted-foreground">Publish a new service offering</p>
                                </div>
                            </div>
                            <CreateSkillForm />
                        </Card>
                    </motion.div>

                    {/* Current Listings Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="lg:col-span-7 space-y-4"
                    >
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h2 className="text-lg font-bold">Your Active Offerings</h2>
                                <p className="text-xs text-muted-foreground">Manage details or remove listings</p>
                            </div>
                            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {skills.length} listed
                            </Badge>
                        </div>

                        {/* Skill Cards */}
                        <div className="space-y-4">
                            {skills?.map((skill, i) => (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: i * 0.05 }}
                                >
                                    <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                                        <CardHeader className="p-5 pb-3 border-b border-border/40">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <CardTitle className="text-base font-bold">
                                                            {skill.title}
                                                        </CardTitle>
                                                        <Badge variant="secondary" className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full">
                                                            {skill.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Added on {new Date(skill.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-base font-extrabold text-foreground">
                                                        ₹{skill.price}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(skill.id)}
                                                        className="h-8 w-8 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                        title="Delete Listing"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-5 space-y-3">
                                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {skill.description}
                                            </p>

                                            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 text-muted-foreground">
                                                <span>Experience: <strong className="text-foreground">{skill.experience || 'Not specified'}</strong></span>
                                                <Link href={`/skills/${skill.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary hover:text-primary gap-1">
                                                        Preview <ArrowUpRight className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}

                            {/* Empty State */}
                            {skills?.length === 0 && (
                                <div className="rounded-3xl border border-border/60 bg-card/40 p-12 text-center backdrop-blur-sm space-y-3">
                                    <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                                        <Briefcase className="h-6 w-6 opacity-60" />
                                    </div>
                                    <h3 className="font-bold text-base">No skills listed yet</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                        Fill in the form on the left to publish your first service offering to customers.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-2xl border-border/60">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Skill Listing?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm">
                                This will permanently remove this listing from the marketplace. Existing booking records will not be deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting} className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                                {deleting ? 'Deleting...' : 'Delete Listing'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
