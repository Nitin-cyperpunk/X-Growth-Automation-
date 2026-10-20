import { getPostsByStatus } from "@/lib/actions/posts";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PublishedPage() {
  const result = await getPostsByStatus("published");
  const posts = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Published Posts"
        description="View your published posts and their performance"
      />

      {posts.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <EmptyState message="No published posts yet. Posts will appear here after they are successfully published to X." />
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <p className="whitespace-pre-wrap text-sm text-zinc-200">
                {post.content}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                {post.publishedAt && (
                  <span>
                    Published: {new Date(post.publishedAt).toLocaleString()}
                  </span>
                )}
                {post.xPostUrl && (
                  <a
                    href={post.xPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline"
                  >
                    View on X
                  </a>
                )}
                {post.isAiGenerated && (
                  <span className="rounded bg-violet-900/30 px-1.5 py-0.5 text-violet-300">
                    AI Generated
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
