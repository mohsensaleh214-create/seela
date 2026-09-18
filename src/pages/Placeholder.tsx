import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Coming into view" body="This screen is being built for the prototype." />
    </>
  );
}
