'use client';

import Link from 'next/link';
import { useActionState, useTransition } from 'react';
import { FcGoogle } from 'react-icons/fc';

import { login, signup, type AuthState } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const copy = {
  login: {
    title: 'Welcome back',
    description: 'Sign in to your ApplyWise account.',
    submit: 'Sign in',
    google: 'Sign in with Google',
    switchPrompt: "Don't have an account?",
    switchHref: '/signup',
    switchCta: 'Create one',
  },
  signup: {
    title: 'Create your account',
    description: 'Start tracking your job applications.',
    submit: 'Create account',
    google: 'Sign up with Google',
    switchPrompt: 'Already have an account?',
    switchHref: '/login',
    switchCta: 'Sign in',
  },
} as const;

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const t = copy[mode];
  const action = mode === 'login' ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const [googlePending, startGoogle] = useTransition();

  function handleGoogle() {
    startGoogle(async () => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-xl">{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2"
          onClick={handleGoogle}
          disabled={googlePending || pending}
        >
          <FcGoogle className="size-4" />
          {t.google}
        </Button>

        <div className="flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              required
              minLength={mode === 'signup' ? 8 : undefined}
            />
          </div>

          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={pending || googlePending}>
            {pending ? 'Please wait…' : t.submit}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {t.switchPrompt}{' '}
          <Link href={t.switchHref} className="text-primary font-medium hover:underline">
            {t.switchCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
