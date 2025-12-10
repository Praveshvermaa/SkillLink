'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifiedPage() {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Check if user just verified via email link
    const justVerified = searchParams.get('success') === 'true';

    useEffect(() => {
        const checkVerification = async () => {
            // If user just verified, show success message without checking session
            if (justVerified) {
                setIsVerified(true);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth/login');
                return;
            }

            setUserEmail(user.email || '');
            setIsVerified(!!user.email_confirmed_at);
        };

        checkVerification();

        // Only listen for auth changes if not just verified
        if (!justVerified) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    const user = session?.user;
                    if (user?.email_confirmed_at) {
                        setIsVerified(true);
                        toast.success('Email verified successfully!');
                    }
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [router, supabase, justVerified]);

    const handleResendVerification = async () => {
        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: userEmail,
            });

            if (error) throw error;

            toast.success('Verification email sent! Please check your inbox.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend verification email');
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified === null) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/40 p-4">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">Checking verification status...</p>
                </div>
            </div>
        );
    }

    // Show success message if user just verified via email link
    if (isVerified && justVerified) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/40 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl">Email Verified!</CardTitle>
                        <CardDescription>
                            Your email has been successfully verified. You can now log in to access your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Thank you for verifying your email address. Please log in to continue.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link href="/auth/login" className="w-full">
                            <Button className="w-full">Log In</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Show success with dashboard link if user is already logged in and verified
    if (isVerified && !justVerified) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/40 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl">Email Verified!</CardTitle>
                        <CardDescription>
                            Your email has been successfully verified. You can now access all features of SkillLink.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Thank you for verifying your email address.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link href="/dashboard" className="w-full">
                            <Button className="w-full">Go to Dashboard</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Show verification pending message for unverified users
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Mail className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl">Verify Your Email</CardTitle>
                    <CardDescription>
                        We've sent a verification link to <strong>{userEmail}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                    Email verification required
                                </p>
                                <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                                    Please check your inbox and click the verification link to access your account.
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Didn't receive the email? Check your spam folder or request a new one.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="w-full"
                    >
                        {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                    <Link href="/auth/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
