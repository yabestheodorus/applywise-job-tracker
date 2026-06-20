'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { FileUp, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfileSchema, type UpdateProfileInput } from '@repo/api';

import { saveProfile, uploadCv } from '@/app/(app)/profile/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/profile/tag-input';
import type { ProfileResponse } from '@/lib/types';

type ExperienceValues = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
};

type EducationValues = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
};

type FormValues = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  links: { linkedin: string; github: string; portfolio: string; website: string };
  skills: string[];
  yearsExperience: number | null;
  certifications: string[];
  languages: string[];
  experiences: ExperienceValues[];
  education: EducationValues[];
};

const EMPTY_EXPERIENCE: ExperienceValues = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  skillsUsed: [],
};

const EMPTY_EDUCATION: EducationValues = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  description: '',
};

/** Both the GET /profile row and the AI draft share these (nullable) fields. */
type ProfileLike = Partial<UpdateProfileInput> & {
  links?: ProfileResponse['links'];
};

function toFormValues(p: ProfileLike): FormValues {
  const links = p.links ?? {};
  return {
    fullName: p.fullName ?? '',
    headline: p.headline ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    location: p.location ?? '',
    summary: p.summary ?? '',
    links: {
      linkedin: links.linkedin ?? '',
      github: links.github ?? '',
      portfolio: links.portfolio ?? '',
      website: links.website ?? '',
    },
    skills: p.skills ?? [],
    yearsExperience: p.yearsExperience ?? null,
    certifications: p.certifications ?? [],
    languages: p.languages ?? [],
    experiences: (p.experiences ?? []).map((e) => ({
      company: e.company ?? '',
      title: e.title ?? '',
      location: e.location ?? '',
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
      isCurrent: e.isCurrent ?? false,
      description: e.description ?? '',
      skillsUsed: e.skillsUsed ?? [],
    })),
    education: (p.education ?? []).map((e) => ({
      institution: e.institution ?? '',
      degree: e.degree ?? '',
      fieldOfStudy: e.fieldOfStudy ?? '',
      startDate: e.startDate ?? '',
      endDate: e.endDate ?? '',
      description: e.description ?? '',
    })),
  };
}

export function ProfileForm({ profile }: { profile: ProfileResponse }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(profile.cvFileName);
  const [extracting, startExtract] = useTransition();

  const form = useForm({
    defaultValues: toFormValues(profile),
    // The shared Zod schema validates the form at runtime. Its declared input is
    // wider (nullable, to also accept AI drafts) than the form's concrete values,
    // so bridge that type variance here.
    validators: {
      onSubmit: updateProfileSchema as unknown as StandardSchemaV1<
        FormValues,
        UpdateProfileInput
      >,
    },
    onSubmit: async ({ value }) => {
      const res = await saveProfile(updateProfileSchema.parse(value));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Profile saved');
      router.refresh();
    },
  });

  function handleFile(file: File) {
    setFileName(file.name);
    startExtract(async () => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadCv(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      form.reset(toFormValues(res.data));
      form.validateAllFields('change');
      toast.success('CV extracted — review and save');
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-8"
    >
      {/* CV upload */}
      <section className="bg-muted/30 flex flex-col gap-3 rounded-xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FileUp className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Import from your CV</p>
            <p className="text-muted-foreground text-xs">
              Upload a PDF or DOCX — AI fills in the fields below for you to review.
              {fileName ? (
                <span className="text-foreground/80"> · {fileName}</span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={extracting}
            onClick={() => fileRef.current?.click()}
          >
            {extracting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {extracting ? 'Extracting…' : 'Upload CV'}
          </Button>
        </div>
      </section>

      {/* Identity */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg">Basics</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Text form={form} name="fullName" label="Full name" />
          <Text form={form} name="headline" label="Headline" placeholder="Senior Frontend Engineer" />
          <Text form={form} name="email" label="Email" />
          <Text form={form} name="phone" label="Phone" />
          <Text form={form} name="location" label="Location" placeholder="Jakarta, Indonesia" />
          <form.Field name="yearsExperience">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="yearsExperience">Years of experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min={0}
                  value={field.state.value ?? ''}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                />
              </div>
            )}
          </form.Field>
        </div>
        <form.Field name="summary">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="max-h-48 min-h-20 overflow-y-auto"
                placeholder="A short professional summary."
              />
            </div>
          )}
        </form.Field>
      </section>

      {/* Links */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg">Links</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Text form={form} name="links.linkedin" label="LinkedIn" />
          <Text form={form} name="links.github" label="GitHub" />
          <Text form={form} name="links.portfolio" label="Portfolio" />
          <Text form={form} name="links.website" label="Website" />
        </div>
      </section>

      {/* Skills / certs / languages */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg">Skills &amp; languages</h2>
        <form.Field name="skills">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Skills</Label>
              <TagInput
                value={field.state.value}
                onChange={field.handleChange}
                placeholder="React, TypeScript, Node.js"
              />
            </div>
          )}
        </form.Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <form.Field name="certifications">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Certifications</Label>
                <TagInput value={field.state.value} onChange={field.handleChange} />
              </div>
            )}
          </form.Field>
          <form.Field name="languages">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Languages</Label>
                <TagInput
                  value={field.state.value}
                  onChange={field.handleChange}
                  placeholder="English, Indonesian"
                />
              </div>
            )}
          </form.Field>
        </div>
      </section>

      {/* Experience */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Experience</h2>
        </div>
        <form.Field name="experiences" mode="array">
          {(field) => (
            <div className="flex flex-col gap-4">
              {field.state.value.map((_, i) => (
                <div
                  key={i}
                  className="relative flex flex-col gap-3 rounded-xl border p-4"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground absolute right-2 top-2 size-7"
                    aria-label="Remove experience"
                    onClick={() => field.removeValue(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Text form={form} name={`experiences[${i}].title`} label="Title" />
                    <Text form={form} name={`experiences[${i}].company`} label="Company" />
                    <Text form={form} name={`experiences[${i}].location`} label="Location" />
                    <div className="grid grid-cols-2 gap-3">
                      <Text form={form} name={`experiences[${i}].startDate`} label="Start" placeholder="Mar 2021" />
                      <Text form={form} name={`experiences[${i}].endDate`} label="End" placeholder="Present" />
                    </div>
                  </div>
                  <form.Field name={`experiences[${i}].isCurrent`}>
                    {(sub) => (
                      <label className="flex w-fit items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-primary size-4"
                          checked={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.checked)}
                        />
                        I currently work here
                      </label>
                    )}
                  </form.Field>
                  <form.Field name={`experiences[${i}].description`}>
                    {(sub) => (
                      <div className="flex flex-col gap-1.5">
                        <Label>Description</Label>
                        <Textarea
                          value={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          className="max-h-40 min-h-16 overflow-y-auto"
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name={`experiences[${i}].skillsUsed`}>
                    {(sub) => (
                      <div className="flex flex-col gap-1.5">
                        <Label>Skills used</Label>
                        <TagInput value={sub.state.value} onChange={sub.handleChange} />
                      </div>
                    )}
                  </form.Field>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="gap-2 self-start"
                onClick={() => field.pushValue(EMPTY_EXPERIENCE)}
              >
                <Plus className="size-4" />
                Add experience
              </Button>
            </div>
          )}
        </form.Field>
      </section>

      {/* Education */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg">Education</h2>
        <form.Field name="education" mode="array">
          {(field) => (
            <div className="flex flex-col gap-4">
              {field.state.value.map((_, i) => (
                <div
                  key={i}
                  className="relative flex flex-col gap-3 rounded-xl border p-4"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground absolute right-2 top-2 size-7"
                    aria-label="Remove education"
                    onClick={() => field.removeValue(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Text form={form} name={`education[${i}].institution`} label="Institution" />
                    <Text form={form} name={`education[${i}].degree`} label="Degree" />
                    <Text form={form} name={`education[${i}].fieldOfStudy`} label="Field of study" />
                    <div className="grid grid-cols-2 gap-3">
                      <Text form={form} name={`education[${i}].startDate`} label="Start" />
                      <Text form={form} name={`education[${i}].endDate`} label="End" />
                    </div>
                  </div>
                  <form.Field name={`education[${i}].description`}>
                    {(sub) => (
                      <div className="flex flex-col gap-1.5">
                        <Label>Description</Label>
                        <Textarea
                          value={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          className="max-h-40 min-h-16 overflow-y-auto"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="gap-2 self-start"
                onClick={() => field.pushValue(EMPTY_EDUCATION)}
              >
                <Plus className="size-4" />
                Add education
              </Button>
            </div>
          )}
        </form.Field>
      </section>

      <div className="bg-background/80 sticky bottom-0 flex justify-end gap-2 border-t py-4 backdrop-blur">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || extracting}>
              {isSubmitting ? 'Saving…' : 'Save profile'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

/** Small labelled text field bound to a (possibly nested) form path. */
function Text({
  form,
  name,
  label,
  placeholder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  name: string;
  label: string;
  placeholder?: string;
}) {
  const Form = form;
  return (
    <Form.Field name={name}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(field: any) => (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      )}
    </Form.Field>
  );
}
