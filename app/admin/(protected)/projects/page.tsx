import { EditorialLibrary } from "@/admin/editorial/EditorialLibrary";

export const metadata = { title: "Admin · Projects" };

export default function Page() {
  return <EditorialLibrary kind="projects" />;
}
