import { UserRound } from 'lucide-react';
import { ProfileForm } from '@/components/profile/profile-form';
import { apiFetch } from '@/lib/api/server';
import type { ProfileResponse } from '@/lib/types';

export const metadata = { title: 'Profile · ApplyWise' };

export default async function ProfilePage() {
  const profile = await apiFetch<ProfileResponse>('/profile');

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
          <UserRound className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl leading-tight tracking-tight">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Upload your CV to auto-fill, then review and save. Your profile powers
            skill matching against jobs.
          </p>
        </div>
      </header>
      <ProfileForm profile={profile} />
    </div>
  );
}
