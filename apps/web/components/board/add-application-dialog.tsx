'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  createApplication,
  extractApplication,
} from '@/app/(app)/applications/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  EMPLOYMENT_TYPES,
  SOURCES,
  WORK_ARRANGEMENTS,
  type EmploymentType,
  type Source,
  type WorkArrangement,
} from '@/lib/types';

const SOURCE_LABELS: Record<Source, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  LINKEDIN: 'LinkedIn',
  GLINTS: 'Glints',
  JOBSTREET: 'JobStreet',
  DIRECT: 'Direct',
  OTHER: 'Other',
};

const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULLTIME: 'Full-time',
  PARTTIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

// Radix Select can't hold an empty value, so use a sentinel for "unspecified".
const NONE = 'NONE';

export function AddApplicationDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [extracting, startExtract] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [aiApplied, setAiApplied] = useState(false);

  const [rawText, setRawText] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [source, setSource] = useState<Source>('OTHER');
  const [location, setLocation] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement | ''>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [seniority, setSeniority] = useState('');
  const [industry, setIndustry] = useState('');
  const [summary, setSummary] = useState('');
  const [salary, setSalary] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requirements, setRequirements] = useState(''); // one per line
  const [skills, setSkills] = useState(''); // comma-separated
  const [matchedSkills, setMatchedSkills] = useState(''); // comma-separated
  const [gapSkills, setGapSkills] = useState(''); // comma-separated

  function reset() {
    setRawText('');
    setCompany('');
    setRole('');
    setSource('OTHER');
    setLocation('');
    setJobUrl('');
    setWorkArrangement('');
    setEmploymentType('');
    setSeniority('');
    setIndustry('');
    setSummary('');
    setSalary('');
    setDeadline('');
    setRequirements('');
    setSkills('');
    setMatchedSkills('')
    setGapSkills('')
    setAiApplied(false);
  }

  function handleExtract() {
    if (!rawText.trim()) {
      toast.error('Paste the job text first');
      return;
    }
    startExtract(async () => {
      const res = await extractApplication(rawText);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const d = res.data;
      if (d.company) setCompany(d.company);
      if (d.role) setRole(d.role);
      if (d.location) setLocation(d.location);
      if (d.workArrangement) setWorkArrangement(d.workArrangement);
      if (d.employmentType) setEmploymentType(d.employmentType);
      if (d.seniority) setSeniority(d.seniority);
      if (d.industry) setIndustry(d.industry);
      if (d.jobUrl) setJobUrl(d.jobUrl);
      if (d.summary) setSummary(d.summary);
      if (d.requirements.length) setRequirements(d.requirements.join('\n'));
      if (d.skills.length) setSkills(d.skills.join(', '));
      if (d.matchedSkills.length) setMatchedSkills(d.matchedSkills.join(', '));
      if (d.gapSkills.length) setGapSkills(d.gapSkills.join(', '));
      const sal = d.salaryMin ?? d.salaryMax;
      if (sal) setSalary(String(sal));
      if (d.deadline) setDeadline(d.deadline);
      setAiApplied(true);
      toast.success('Draft extracted — review and confirm');
    });
  }

  function handleSubmit() {
    if (!company.trim() || !role.trim()) {
      toast.error('Company and role are required');
      return;
    }
    startSubmit(async () => {
      const res = await createApplication({
        company: company.trim(),
        role: role.trim(),
        source,
        location: location.trim() || null,
        workArrangement: workArrangement || null,
        employmentType: employmentType || null,
        seniority: seniority.trim() || null,
        industry: industry.trim() || null,
        jobUrl: jobUrl.trim() || null,
        summary: summary.trim() || null,
        requirements: requirements
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),

        matchedSkills: matchedSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),

        gapSkills: gapSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        salaryExpected: salary ? Number(salary) : undefined,
        deadlineDate: deadline || undefined,
        rawText: rawText || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Application added');
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
          <DialogDescription>
            Paste a recruiter message, email, or job post and let AI extract the
            details — or fill them in yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="rawText">Paste job text</Label>
          <Textarea
            id="rawText"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g. 'Hi! We're hiring a Senior Frontend Engineer at Tokopedia — React, TypeScript, 3+ yrs. Budget 25–30jt. Apply by 30 June.'"
            className="max-h-64 min-h-28 overflow-y-auto"
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 self-start"
            onClick={handleExtract}
            disabled={extracting}
          >
            <Sparkles className="size-4" />
            {extracting ? 'Extracting…' : 'Extract with AI'}
          </Button>
        </div>

        <div className="bg-border h-px" />

        <div className="grid gap-4">
          {aiApplied ? (
            <p className="text-muted-foreground text-xs">
              Fields below are AI-suggested — edit anything before saving.
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="South Jakarta, Indonesia"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobUrl">Job / company URL</Label>
              <Input
                id="jobUrl"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workArrangement">Work arrangement</Label>
              <Select
                value={workArrangement || undefined}
                onValueChange={(v) =>
                  setWorkArrangement(v === NONE ? '' : (v as WorkArrangement))
                }
              >
                <SelectTrigger id="workArrangement">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not specified</SelectItem>
                  {WORK_ARRANGEMENTS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {WORK_ARRANGEMENT_LABELS[w]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employmentType">Employment type</Label>
              <Select
                value={employmentType || undefined}
                onValueChange={(v) =>
                  setEmploymentType(v === NONE ? '' : (v as EmploymentType))
                }
              >
                <SelectTrigger id="employmentType">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not specified</SelectItem>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EMPLOYMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seniority">Seniority</Label>
              <Input
                id="seniority"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                placeholder="Mid-Senior"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Legal Services"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as Source)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary">Expected salary (IDR / mo)</Label>
              <Input
                id="salary"
                inputMode="numeric"
                value={salary}
                onChange={(e) => setSalary(e.target.value.replace(/\D/g, ''))}
                placeholder="25000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short summary of the role and company."
              className="max-h-40 min-h-16 overflow-y-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requirements">Job requirements (one per line)</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder={'2–5 yrs fullstack experience\nExperience building REST APIs'}
              className="max-h-48 min-h-20 overflow-y-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="skills">Required skills (comma-separated)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js, Postgres"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matchedSkills">Matched skills (comma-separated)</Label>
            <Input
              id="matchedSkills"
              value={matchedSkills}
              onChange={(e) => setMatchedSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js, Postgres"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gapSkills">Gap skills (comma-separated)</Label>
            <Input
              id="gapSkills"
              value={gapSkills}
              onChange={(e) => setGapSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js, Postgres"
            />
          </div>
          {/* Matched / gap skills are computed against your profile once you add
              one — read-only here, empty until then. */}
          {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReadOnlySkills
              label="Matched skills"
              tone="emerald"
              skills={[]}
            />
            <ReadOnlySkills label="Gap skills" tone="red" skills={[]} />
          </div>
          <p className="text-muted-foreground -mt-2 text-xs">
            Matched and gap skills fill in automatically once you add your profile.
          </p> */}


        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlySkills({
  label,
  tone,
  skills,
}: {
  label: string;
  tone: 'emerald' | 'red';
  skills: string[];
}) {
  const chip =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="border-input bg-muted/30 flex min-h-9 flex-wrap items-center gap-1 rounded-lg border px-3 py-2">
        {skills.length ? (
          skills.map((s) => (
            <span
              key={s}
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${chip}`}
            >
              {s}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-xs">None yet</span>
        )}
      </div>
    </div>
  );
}
