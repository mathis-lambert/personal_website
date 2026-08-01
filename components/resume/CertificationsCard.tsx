import { Meta } from "@/components/ds";
import { cn } from "@/lib/utils";
import type { Certification } from "@/types/resume";

/** Certification status reads through opacity of the one accent, not four hues. */
const statusStyle: Record<string, string> = {
  issued: "bg-brand",
  in_progress: "bg-brand/55",
  starting: "bg-brand/30",
  stopped: "bg-line-strong",
};

export const CertificationsCard: React.FC<{
  certifications: Certification[] | undefined;
}> = ({ certifications }) => {
  if (!certifications || certifications.length === 0) return null;

  return (
    <ul className="flex flex-col gap-5">
      {certifications.map((cert, index) => {
        const key =
          cert.status?.toLowerCase().replace(/\s+/g, "_") ?? "stopped";

        return (
          <li key={index}>
            <p className="text-[0.9375rem] font-bold leading-snug text-ink">
              {cert.title}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">{cert.provider}</p>
            <Meta as="p" className="mt-1.5 inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  statusStyle[key] ?? statusStyle.stopped,
                )}
              />
              <span className="capitalize">
                {cert.status?.replace(/_/g, " ")}
              </span>
              {cert.issued_date ? <span>· {cert.issued_date}</span> : null}
            </Meta>
          </li>
        );
      })}
    </ul>
  );
};
