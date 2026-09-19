import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Banner } from '@/components/ui/Banner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';

export function LockedPortal({ portal, note }: { portal: string; note?: string }) {
  return (
    <>
      <PageHeader title={portal} />
      <Banner tone="locked">
        <p className="flex items-center gap-1.5 font-medium">
          <Lock size={15} aria-hidden />
          Restricted. Your role does not browse {portal.toLowerCase()} directly.
        </p>
        <p className="mt-1">
          {note ?? `You can still raise a concern at any time — it goes straight to the ${portal.toLowerCase()} team.`}
        </p>
        <Link to="/raise-concern" className="mt-3 inline-block">
          <Button variant="primary" size="sm">
            Raise a concern
          </Button>
        </Link>
      </Banner>
    </>
  );
}
