import { Archive, CheckCircle2, CircleDot, type LucideIcon } from "lucide-react";

import type { ProjectStatus } from "@/types/content";

/**
 * The one project-status table. `label` is the status itself (filters, admin);
 * `kicker` is what a card calls a project in that status (editorial voice).
 * `icon` is the component, not an element, so this module stays free of JSX.
 */
const PROJECT_STATUSES = {
  "in-progress": {
    label: "In progress",
    kicker: "In progress",
    icon: CircleDot,
  },
  completed: {
    label: "Completed",
    kicker: "Case study",
    icon: CheckCircle2,
  },
  archived: {
    label: "Archived",
    kicker: "Archived",
    icon: Archive,
  },
} satisfies Record<
  ProjectStatus,
  { label: string; kicker: string; icon: LucideIcon }
>;

const DEFAULT_PROJECT_STATUS: ProjectStatus = "completed";

/**
 * The status of a project, falling back to completed.
 *
 * `status` is optional on the document and free-form in the database, so this
 * takes a plain string rather than pretending the stored value is already one of
 * the three.
 */
export const resolveProjectStatus = (status?: string) =>
  PROJECT_STATUSES[status as ProjectStatus] ??
  PROJECT_STATUSES[DEFAULT_PROJECT_STATUS];

/** Filter-bar options, derived so a fourth status cannot be added to only two of them. */
export const PROJECT_STATUS_FILTER_OPTIONS = Object.entries(
  PROJECT_STATUSES,
).map(([value, { label }]) => ({ value, label }));
