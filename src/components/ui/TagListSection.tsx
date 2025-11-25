import { GlassCard } from "@/components/ui/GlassCard";
import { ResumeSection } from "@/components/ui/ResumeSection";
import type { LucideIcon } from "lucide-react";

interface TagListSectionProps {
  icon: LucideIcon;
  title: string;
  items: string[];
  colorClass: string;
  delay?: number;
}

export const TagListSection: React.FC<TagListSectionProps> = ({
  icon,
  title,
  items,
  colorClass,
  delay = 0,
}) => (
  <GlassCard delay={delay} className="p-6">
    <ResumeSection icon={icon} title={title}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`${colorClass} text-xs font-medium px-3 py-1 rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10`}
          >
            {item}
          </span>
        ))}
      </div>
    </ResumeSection>
  </GlassCard>
);
