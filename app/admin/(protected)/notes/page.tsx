import { CollectionScreen } from "@/admin/components/CollectionScreen";
import { notesConfig } from "@/admin/collections";

export const metadata = { title: "Admin · Notes" };

export default function Page() {
  return <CollectionScreen config={notesConfig} />;
}
