'use client';

import { useEffect, useState, startTransition, useActionState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, User, Briefcase } from 'lucide-react';

import { LocationInput } from '@/components/LocationInput';

import { signup } from '@/app/auth/actions';
import { signupSchema, type SignupInput } from '@/utils/validators';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const methods = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'user',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const { control, setValue } = methods;
  const { register, handleSubmit, formState: { errors } } = methods;

  // 🔥 toast notifications
  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success('Account created successfully!');
      setShowSuccessDialog(true);
    }

    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (data: SignupInput) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    startTransition(() => {
      formAction(formData);
    });
  };

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
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your information to get started
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="h-11 rounded-lg"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className="h-11 rounded-lg"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  className="h-11 rounded-lg"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, value } }) => (
                    <LocationInput
                      id="address"
                      placeholder="123 Main St, City, Country"
                      className="h-11 rounded-lg"
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
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-11 rounded-lg"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="h-11 rounded-lg"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Role selection */}
              <div className="space-y-3">
                <Label className="font-medium">I want to...</Label>

                <div className="grid grid-cols-2 gap-4">
                  {/* User option */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="user"
                      className="peer sr-only"
                      {...register('role')}
                    />
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-muted bg-background p-4 transition-all hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary/10">
                      <User className="h-6 w-6" />
                      <span className="text-sm font-medium">Find Skills</span>
                    </div>
                  </label>

                  {/* Provider option */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="provider"
                      className="peer sr-only"
                      {...register('role')}
                    />
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-muted bg-background p-4 transition-all hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary/10">
                      <Briefcase className="h-6 w-6" />
                      <span className="text-sm font-medium">Offer Skills</span>
                    </div>
                  </label>
                </div>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              {/* Error */}
              {state?.error && (
                <div className="rounded-md bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  {state.error}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg"
                onClick={() => {
                  if (isPending) toast.loading('Creating account...');
                }}
              >
                {isPending ? 'Creating account...' : 'Sign Up'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="underline hover:text-foreground"
                >
                  Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Check your email
              </DialogTitle>
              <DialogDescription>
                We've sent a verification link to your email address. Please click the link to verify your account.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end">
              <Link href="/auth/login">
                <Button className="rounded-lg">Go to Login</Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
