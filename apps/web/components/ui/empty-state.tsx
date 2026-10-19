interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
