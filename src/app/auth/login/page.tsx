'use client';

import { useActionState, useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import { login, resendVerification } from '@/app/auth/actions';
import { loginSchema, type LoginSchema } from '@/utils/validators';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isValid },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: (state?.email as string) || '', password: '' },
  });

  // Show server errors/successes via toast
  useEffect(() => {
    if (!state) return;
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  // Focus email on mount
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  // Show loading toast while pending
  useEffect(() => {
    let loadingId: string | number | undefined;
    if (isPending) {
      loadingId = toast.loading('Logging in...');
    }
    return () => {
      if (loadingId) toast.dismiss(loadingId);
    };
  }, [isPending]);

  const onSubmit = (values: LoginSchema) => {
    const fd = new FormData();
    fd.append('email', values.email);
    fd.append('password', values.password);

    startTransition(() => {
      action(fd);
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">Login</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your email & password to continue.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" aria-describedby={errors.email ? 'email-error' : undefined}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <Input
                  id="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                  placeholder="you@example.com"
                  className="h-11 rounded-lg"
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="font-medium">Password</Label>
                  <Link href="/auth/forgot-password" className="ml-auto inline-block text-sm font-medium text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    aria-invalid={!!errors.password}
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="h-11 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="text-sm text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* server side inline error */}
              {state?.error && (
                <div className="rounded-md bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  {state.error}
                  {state.code === 'email_not_confirmed' && state.email && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-red-700 underline hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                        onClick={async () => {
                          const promise = resendVerification(state.email as string);
                          toast.promise(promise, {
                            loading: 'Sending verification email...',
                            success: (data: { error?: string; success?: string }) => {
                              if (data.error) throw new Error(data.error);
                              return 'Verification email sent! Please check your inbox.';
                            },
                            error: (err: any) => err.message || 'Failed to send verification email',
                          });
                        }}
                      >
                        Resend verification email
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" disabled={!isValid || isPending} className="w-full rounded-lg">
                {isPending ? 'Logging in...' : 'Login'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium underline hover:text-foreground">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
