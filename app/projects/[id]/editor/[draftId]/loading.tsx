import { LoadingState } from '@/components/loading-state';

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <LoadingState message="Loading video editor..." variant="skeleton" rows={8} />
    </div>
  );
}
