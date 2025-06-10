import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white shadow-xl">
      <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          Examinator
        </Link>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/auth">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth?tab=signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
