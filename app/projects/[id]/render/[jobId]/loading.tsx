import { LoadingState } from '@/components/loading-state';

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <LoadingState message="Loading render status..." variant="skeleton" rows={4} />
    </div>
  );
}
