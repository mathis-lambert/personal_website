import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";

type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  /** Ink for the whole group, so a screen's colour says which part you are in. */
  ink: "azure" | "coral" | "turquoise";
  items: AdminNavItem[];
};

/**
 * Grouped by what the sections are for, not by how often they are used.
 *
 * Seven flat entries gave no sense of where anything lived. These three groups
 * are the actual jobs: read what happened, publish work, keep the CV current.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Audience",
    ink: "azure",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      {
        label: "Conversations",
        href: "/admin/discussions",
        icon: MessageSquareText,
      },
    ],
  },
  {
    label: "Publishing",
    ink: "coral",
    items: [
      { label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { label: "Notes", href: "/admin/notes", icon: FileText },
    ],
  },
  {
    label: "Career",
    ink: "turquoise",
    items: [
      { label: "Resume", href: "/admin/resume", icon: IdCard },
      {
        label: "Experience",
        href: "/admin/experiences",
        icon: BriefcaseBusiness,
      },
      { label: "Studies", href: "/admin/studies", icon: GraduationCap },
    ],
  },
];

/** The ink of the section a path belongs to, for tinting that screen. */
export const inkForPath = (pathname: string): string => {
  let best: { length: number; ink: string } = { length: -1, ink: "azure" };
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      const matches =
        item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href);
      if (matches && item.href.length > best.length) {
        best = { length: item.href.length, ink: group.ink };
      }
    }
  }
  return best.ink;
};
