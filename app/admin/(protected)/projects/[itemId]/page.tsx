import { EditorialWorkspace } from "@/components/admin/editorial/EditorialWorkspace";

export const metadata = { title: "Edit project · Admin" };

export default async function Page({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <EditorialWorkspace kind="projects" itemId={itemId} />;
}
