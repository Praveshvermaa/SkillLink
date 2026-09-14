'use client';

import { useActionState, useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

import { login, resendVerification } from '@/app/auth/actions';
import { loginSchema, type LoginSchema } from '@/utils/validators';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: (state?.email as string) || '', password: '' },
  });

  useEffect(() => {
    if (!state) return;
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  useEffect(() => { setFocus('email'); }, [setFocus]);

  useEffect(() => {
    let loadingId: string | number | undefined;
    if (isPending) loadingId = toast.loading('Signing you in...');
    return () => { if (loadingId) toast.dismiss(loadingId); };
  }, [isPending]);

  const onSubmit = (values: LoginSchema) => {
    const fd = new FormData();
    fd.append('email', values.email);
    fd.append('password', values.password);
    startTransition(() => { action(fd); });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080C14] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8 flex justify-center"
        >
        </motion.div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="........"
                  {...register('password')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {state?.error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {state.error}
                {state.code === 'email_not_confirmed' && state.email && (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="text-xs underline text-red-300 hover:text-red-200 transition-colors"
                      onClick={async () => {
                        const promise = resendVerification(state.email as string);
                        toast.promise(promise, {
                          loading: 'Sending verification email...',
                          success: (data: { error?: string; success?: string }) => {
                            if (data.error) throw new Error(data.error);
                            return 'Verification email sent!';
                          },
                          error: (err: unknown) => err instanceof Error ? err.message : 'Failed',
                        });
                      }}
                    >
                      Resend verification email
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">Protected by industry-standard encryption</p>
      </motion.div>
    </div>
  );
}
