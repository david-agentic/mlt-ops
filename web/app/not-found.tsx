import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <EmptyState
          icon={SearchX}
          illustrationUrl={null}
          title="Page not found"
          description="The page you're looking for doesn't exist or you don't have access to it."
          action={<Button render={<Link href="/">Go home</Link>} nativeButton={false} />}
        />
      </div>
    </div>
  );
}
