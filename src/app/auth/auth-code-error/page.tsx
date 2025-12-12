'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card';

export default function AuthCodeErrorPage() {
    const searchParams = useSearchParams();
    const errorMessage = searchParams.get('error');

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="w-full max-w-md"
            >
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Verification Failed
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            The verification link is invalid or has expired
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {errorMessage && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm">
                                <p className="font-medium text-red-800 dark:text-red-200 mb-1">Error Details:</p>
                                <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
                            </div>
                        )}

                        <div className="rounded-lg bg-muted p-4 text-sm">
                            <p className="mb-2">This could happen if:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>The link has already been used</li>
                                <li>The link has expired</li>
                                <li>The link was copied incorrectly</li>
                            </ul>
                        </div>

                        <div className="text-sm text-center text-muted-foreground">
                            Please request a new verification email or contact support if the problem persists.
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                        <Link href="/auth/login" className="w-full">
                            <Button className="w-full rounded-lg">
                                Go to Login
                            </Button>
                        </Link>
                        <Link href="/auth/signup" className="w-full">
                            <Button variant="outline" className="w-full rounded-lg">
                                Sign Up Again
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
