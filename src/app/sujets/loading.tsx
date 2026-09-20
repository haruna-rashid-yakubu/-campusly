import { SubjectCardSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-dvh px-5" style={{ paddingTop: "calc(20px + var(--safe-top))" }}>
      <div className="mb-4 h-8 w-48 rounded-lg bg-line-3 anim-skeleton" />
      <SubjectCardSkeleton />
      <SubjectCardSkeleton />
      <SubjectCardSkeleton />
    </div>
  );
}
