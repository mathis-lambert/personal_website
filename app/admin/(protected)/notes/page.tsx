import { EditorialLibrary } from "@/components/admin/editorial/EditorialLibrary";

export const metadata = { title: "Admin · Notes" };

export default function Page() {
  return <EditorialLibrary kind="notes" />;
}
