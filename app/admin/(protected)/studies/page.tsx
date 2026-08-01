import { CollectionScreen } from "@/components/admin/shared/CollectionScreen";
import { studiesConfig } from "@/components/admin/config/collections";

export const metadata = { title: "Admin · Studies" };

export default function Page() {
  return <CollectionScreen config={studiesConfig} />;
}
