"use client";
import { useModules } from "@/lib/hooks/useModules";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { data: modules, isLoading, error } = useModules();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading modules</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">My Modules</h1>
          <Button
            asChild
            className="rounded-full w-12 h-12 p-0 fixed bottom-8 right-8 shadow-xl"
          >
            <Link href="/dashboard/new">
              <Plus className="w-6 h-6" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules?.map((module) => (
            <Card
              key={module.id}
              className="p-6 rounded-2xl shadow-xl hover:bg-sky-50 transition"
            >
              <Link href={`/dashboard/${module.id}`}>
                <h2 className="text-xl font-semibold text-primary">
                  {module.title}
                </h2>
                <p className="text-gray-600 mt-2">
                  {module.description || "No description"}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Status: {module.is_active ? "Active" : "Inactive"}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
