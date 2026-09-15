import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSessionToken } from "@/lib/server/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  const customer = verifyCustomerSessionToken(token);
  return Response.json({ customer });
}
