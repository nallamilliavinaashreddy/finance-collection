'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { loginAdmin } from '@/lib/auth/admin-auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await loginAdmin(data.email, data.password);

      if (result.success && result.user) {
        setUser(result.user);
        showToast('Single Admin Authenticated Successfully!', 'success', 'Welcome Back');
        router.push('/dashboard');
      } else {
        showToast(result.error || 'Authentication failed. Please check credentials.', 'error', 'Login Failed');
      }
    } catch (err: unknown) {
      showToast('An unexpected error occurred during login.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setValue('email', 'admin@finance.com', { shouldValidate: true });
    setValue('password', 'AdminSecurePassword123!', { shouldValidate: true });
    showToast('Demo Single Admin credentials inserted.', 'info');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 mb-4 animate-in zoom-in duration-300">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            FinCollect Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Single Admin Authentication Portal
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="shadow-xl border-slate-800 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-xl">Admin Sign In</CardTitle>
            <CardDescription>
              Enter your Single Admin credentials to access the collection management console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Email Field */}
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@finance.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password Field */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500"
                    {...register('rememberMe')}
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Sign In to Dashboard
              </Button>
            </form>

            {/* Quick Demo Fill Helper */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                  Single Admin Mode
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-xs font-semibold text-orange-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Fill Demo Credentials
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} FinCollect Management System. Protected by Supabase Auth.
        </p>
      </div>
    </div>
  );
}
