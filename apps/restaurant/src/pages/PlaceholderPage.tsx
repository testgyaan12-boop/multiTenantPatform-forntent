import { EmptyState, PageHeader } from '@resto/ui';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Coming in the next phase" description={description} />
    </>
  );
}
