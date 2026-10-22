import { getPostsByStatus } from "@/lib/actions/posts";
import { getUserXAccount } from "@/lib/actions/x";
import { QueueClient } from "./queue-client";
import type { PostStatus } from "@/lib/services/post-transitions";

const TABS: { label: string; status: PostStatus }[] = [
  { label: "Drafts", status: "draft" },
  { label: "Pending", status: "pending_approval" },
  { label: "Approved", status: "approved" },
  { label: "Scheduled", status: "scheduled" },
  { label: "Failed", status: "failed" },
];

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = (params.tab as PostStatus) || "draft";

  const [result, xResult] = await Promise.all([
    getPostsByStatus(activeTab),
    getUserXAccount(),
  ]);
  const posts = result.success ? result.data : [];
  const xAccount = xResult.success ? xResult.data : null;

  return (
    <QueueClient
      posts={posts}
      activeTab={activeTab}
      tabs={TABS}
      xAccountId={xAccount?.id ?? null}
    />
  );
}
