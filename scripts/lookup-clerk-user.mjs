import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const user = await clerk.users.getUser("user_3DVSCuX6z5D3QwU105ZEFc1Mley");
console.log("Email addresses:", user.emailAddresses.map(e => e.emailAddress));
console.log("First name:", user.firstName);
console.log("Last name:", user.lastName);
