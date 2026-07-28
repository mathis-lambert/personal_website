import { CollectionScreen } from "@/admin/components/CollectionScreen";
import { experiencesConfig } from "@/admin/collections";

export const metadata = { title: "Admin · Uexperiences" };

export default function Page() {
  return <CollectionScreen config={experiencesConfig} />;
}
