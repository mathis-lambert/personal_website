import { EditorialWorkspace } from "@/admin/editorial/EditorialWorkspace";

export const metadata = { title: "New note · Admin" };

export default function Page() {
  return <EditorialWorkspace kind="notes" />;
}
