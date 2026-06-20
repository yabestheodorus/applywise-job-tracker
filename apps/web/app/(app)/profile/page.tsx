import { ProfileForm } from '@/components/profile/profile-form';
import { apiFetch } from '@/lib/api/server';
import type { ProfileResponse } from '@/lib/types';

export const metadata = { title: 'Profile · ApplyWise' };

export default async function ProfilePage() {
  const profile = await apiFetch<ProfileResponse>('/profile');

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl">Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload your CV to auto-fill, then review and save. Your profile powers
          skill matching against jobs.
        </p>
      </header>
      <ProfileForm profile={profile} />
    </div>
  );
}
