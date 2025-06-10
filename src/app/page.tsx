import { Button } from "@/components/ui/button";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gradient-to-b from-white to-sky-100">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary mb-4">Examinator</h1>
          <p className="text-xl text-gray-600 mb-8">
            Create and share tests effortlessly. Prepare smarter, succeed
            faster.
          </p>
          <Button asChild size="lg">
            <Link href="/auth">Get Started</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
