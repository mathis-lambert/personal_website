import { EditorialLibrary } from "@/admin/editorial/EditorialLibrary";

export const metadata = { title: "Admin · Notes" };

export default function Page() {
  return <EditorialLibrary kind="notes" />;
}
