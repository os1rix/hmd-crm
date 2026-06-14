import { getSessionUser } from "@/lib/session";
import ForecastPageClient from "./forecast-client";

export default async function ForecastPage() {
  const user = await getSessionUser();
  return <ForecastPageClient userRole={user?.role ?? null} />;
}
