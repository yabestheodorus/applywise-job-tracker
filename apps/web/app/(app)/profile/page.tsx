import { UserRound } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { apiFetch } from '@/lib/api/server';
import type { ProfileResponse } from '@/lib/types';

export const metadata = { title: 'Profile · ApplyWise' };

export default async function ProfilePage() {
  const profile = await apiFetch<ProfileResponse>('/profile');

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <PageHeader
        icon={UserRound}
        title="Profile"
        description="Upload your CV to auto-fill, then review and save. Your profile powers skill matching against jobs."
        className="mb-6"
      />
      <ProfileForm profile={profile} />
    </div>
  );
}
