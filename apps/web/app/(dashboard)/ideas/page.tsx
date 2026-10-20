import { getIdeas } from "@/lib/actions/ideas";
import { IdeasClient } from "./ideas-client";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const result = await getIdeas({
    status: params.status,
    category: params.category,
    search: params.search,
  });

  const ideas = result.success ? result.data : [];

  return <IdeasClient ideas={ideas} filters={params} />;
}
