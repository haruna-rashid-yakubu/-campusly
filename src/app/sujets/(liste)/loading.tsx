import { SubjectCardSkeleton } from "@/components/Skeletons";

// Under the layout's title and search, which stay on screen: only the results are waited for.
export default function Loading() {
  return (
    <div className="px-5 pt-3">
      <SubjectCardSkeleton />
      <SubjectCardSkeleton />
      <SubjectCardSkeleton />
    </div>
  );
}
