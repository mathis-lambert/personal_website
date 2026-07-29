import { CollectionScreen } from "@/admin/components/CollectionScreen";
import { studiesConfig } from "@/admin/collections";

export const metadata = { title: "Admin · Studies" };

export default function Page() {
  return <CollectionScreen config={studiesConfig} />;
}
