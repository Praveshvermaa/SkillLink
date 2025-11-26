'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

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
            <div className="container py-10 flex items-center justify-center min-h-[60vh]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container py-10 space-y-10">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">

                {/* Add Skill */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                >
                    <h2 className="text-xl font-semibold">Add New Skill</h2>
                    <CreateSkillForm />
                </motion.div>

                {/* Listings */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-6"
                >
                    <h2 className="text-xl font-semibold">Your Listings</h2>

                    {/* Skill Cards */}
                    <div className="grid gap-5">
                        {skills?.map((skill, i) => (
                            <motion.div
                                key={skill.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.05 }}
                            >
                                <Card className="rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all bg-card/60 backdrop-blur-md">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl font-semibold">
                                                    {skill.title}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    <Badge variant="secondary" className="capitalize">
                                                        {skill.category}
                                                    </Badge>
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(skill.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                            {skill.description}
                                        </p>

                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-primary">₹{skill.price}</span>
                                            <span className="text-muted-foreground">{skill.experience}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Empty State */}
                        {skills?.length === 0 && (
                            <div className="rounded-xl border bg-muted/20 p-10 text-center backdrop-blur-sm">
                                <p className="text-muted-foreground">You haven’t added any skills yet.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your skill listing.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
