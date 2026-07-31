import { EditorialWorkspace } from "@/admin/editorial/EditorialWorkspace";

export const metadata = { title: "Edit note · Admin" };

export default async function Page({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <EditorialWorkspace kind="notes" itemId={itemId} />;
}
