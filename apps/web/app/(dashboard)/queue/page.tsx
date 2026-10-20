import { getPostsByStatus } from "@/lib/actions/posts";
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

  const result = await getPostsByStatus(activeTab);
  const posts = result.success ? result.data : [];

  return <QueueClient posts={posts} activeTab={activeTab} tabs={TABS} />;
}
