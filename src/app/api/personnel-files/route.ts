import { getPersonnelFiles } from "@/lib/server/store";

export async function GET() {
  const personnelFiles = await getPersonnelFiles();
  return Response.json({ personnelFiles });
}
