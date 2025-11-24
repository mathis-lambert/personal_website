import type { Certification } from '@/types.ts';

interface CertificationsCardProps {
  certifications: Certification[] | undefined;
}

const CERT_STATUS_COLORS: Record<
  string,
  { dot: string; ping: string; label: string }
> = {
  issued: { dot: 'bg-emerald-500', ping: 'bg-emerald-400', label: 'Issued' },
  in_progress: {
    dot: 'bg-cyan-500',
    ping: 'bg-cyan-400',
    label: 'In Progress',
  },
  starting: { dot: 'bg-amber-500', ping: 'bg-amber-400', label: 'Starting' },
  stopped: {
    dot: 'bg-slate-400 dark:bg-slate-500',
    ping: 'bg-slate-300',
    label: 'Stopped',
  },
};

export const CertificationsCard: React.FC<CertificationsCardProps> = ({
  certifications,
}) => (
  <>
    {certifications?.map((cert, i) => {
      const key = cert.status?.toLowerCase().replace(' ', '_') ?? 'stopped';
      const colors = CERT_STATUS_COLORS[key] ?? CERT_STATUS_COLORS.stopped;

      return (
        <div key={i} className="mb-3 last:mb-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            {cert.title}
          </h3>
          <p className="text-cyan-600 dark:text-cyan-400 text-sm">
            {cert.provider}
          </p>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping ${colors.ping}`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors.dot}`}
              />
            </span>
            <span className="capitalize">{cert.status}</span>
            {cert.issued_date ? <span>• {cert.issued_date}</span> : null}
          </div>
        </div>
      );
    })}
  </>
);
