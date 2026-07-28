import { CollectionScreen } from "@/admin/components/CollectionScreen";
import { notesConfig } from "@/admin/collections";

export const metadata = { title: "Admin · Unotes" };

export default function Page() {
  return <CollectionScreen config={notesConfig} />;
}
