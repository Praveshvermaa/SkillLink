'use client';

import { useEffect, useState, startTransition, useActionState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, User, Briefcase, Lock, Phone, MapPin, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { LocationInput } from '@/components/LocationInput';
import { signup } from '@/app/auth/actions';
import { signupSchema, type SignupInput } from '@/utils/validators';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const methods = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'user', latitude: undefined, longitude: undefined },
  });

  const { control, setValue } = methods;
  const { register, handleSubmit, watch, formState: { errors } } = methods;
  const selectedRole = watch('role');

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success('Account created successfully!');
      setShowSuccessDialog(true);
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  const onSubmit = (data: SignupInput) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value.toString());
    });
    startTransition(() => { formAction(formData); });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080C14] px-4 py-12">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-purple-700/10 blur-[100px]" />
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
        className="relative z-10 w-full max-w-[480px]"
      >
        {/* Logo badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8 flex justify-center"
        >
        </motion.div>

        {/* Glass card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">Join thousands of skilled professionals</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  {...register('phone')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-sm font-medium text-slate-300">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none z-10" />
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, value } }) => (
                    <LocationInput
                      id="address"
                      placeholder="123 Main St, City, Country"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30 h-auto"
                      value={value}
                      onChange={onChange}
                      onLocationSelect={(address, lat, lon) => {
                        onChange(address);
                        setValue('latitude', lat);
                        setValue('longitude', lon);
                      }}
                    />
                  )}
                />
              </div>
              {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="........"
                  {...register('password')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
                <button type="button" aria-label="Toggle password" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="........"
                  {...register('confirmPassword')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                />
                <button type="button" aria-label="Toggle confirm password" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            {/* Role selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input type="radio" value="user" className="peer sr-only" {...register('role')} />
                  <div className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all ${selectedRole === 'user' ? 'border-violet-500 bg-violet-500/15' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className={`rounded-xl p-2.5 ${selectedRole === 'user' ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                      <User className={`h-5 w-5 ${selectedRole === 'user' ? 'text-violet-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${selectedRole === 'user' ? 'text-violet-300' : 'text-slate-300'}`}>Find Skills</p>
                      <p className="text-xs text-slate-500 mt-0.5">Hire experts</p>
                    </div>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input type="radio" value="provider" className="peer sr-only" {...register('role')} />
                  <div className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all ${selectedRole === 'provider' ? 'border-violet-500 bg-violet-500/15' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className={`rounded-xl p-2.5 ${selectedRole === 'provider' ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                      <Briefcase className={`h-5 w-5 ${selectedRole === 'provider' ? 'text-violet-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${selectedRole === 'provider' ? 'text-violet-300' : 'text-slate-300'}`}>Offer Skills</p>
                      <p className="text-xs text-slate-500 mt-0.5">Earn money</p>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
            </div>

            {/* Server error */}
            {state?.error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {state.error}
              </div>
            )}

            {/* Submit */}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">Protected by industry-standard encryption</p>
      </motion.div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-white/10 bg-[#0f1420] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20">
                <Mail className="h-4 w-4 text-violet-400" />
              </div>
              Check your email
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              We sent a verification link to your email. Click it to activate your account and get started.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Link href="/auth/login">
              <button className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]">
                Go to Login
              </button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
