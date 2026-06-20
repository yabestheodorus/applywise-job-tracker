import { Mail, Send, Globe, Briefcase } from 'lucide-react';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa6';
import type { Source } from '@/lib/types';

const meta: Record<
  Source,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  WHATSAPP: { label: 'WhatsApp', Icon: FaWhatsapp },
  LINKEDIN: { label: 'LinkedIn', Icon: FaLinkedin },
  EMAIL: { label: 'Email', Icon: Mail },
  GLINTS: { label: 'Glints', Icon: Briefcase },
  JOBSTREET: { label: 'JobStreet', Icon: Briefcase },
  DIRECT: { label: 'Direct', Icon: Send },
  OTHER: { label: 'Other', Icon: Globe },
};

export function SourceIcon({ source }: { source: Source }) {
  const { label, Icon } = meta[source];
  return (
    <span
      className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
      title={label}
    >
      <Icon className="size-3.5" />
      <span>{label}</span>
    </span>
  );
}
