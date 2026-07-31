import { EditorialWorkspace } from "@/admin/editorial/EditorialWorkspace";

export const metadata = { title: "New project · Admin" };

export default function Page() {
  return <EditorialWorkspace kind="projects" />;
}
