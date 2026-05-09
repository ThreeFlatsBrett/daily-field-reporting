import { auth, currentUser } from "@clerk/nextjs/server";

export { auth, currentUser };

export async function getClerkAuth() {
  return auth();
}
