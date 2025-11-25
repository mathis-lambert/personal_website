import { getServerSession } from "next-auth";

import { authOptions } from "./options";

export const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
};
