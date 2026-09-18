import { Lock } from 'lucide-react';
import { Banner } from '@/components/ui/Banner';
import { PageHeader } from '@/components/PageHeader';

export function LockedPortal({ portal }: { portal: string }) {
  return (
    <>
      <PageHeader title={portal} />
      <Banner tone="locked">
        <p className="flex items-center gap-1.5 font-medium">
          <Lock size={15} aria-hidden />
          Restricted. Your role does not have access to {portal.toLowerCase()}.
        </p>
      </Banner>
    </>
  );
}
