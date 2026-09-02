import { getVehicles } from "@/lib/server/store";

export async function GET() {
  const vehicles = await getVehicles();
  return Response.json({ vehicles });
}
