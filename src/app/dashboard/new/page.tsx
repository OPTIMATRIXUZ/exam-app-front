"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api/client";
import { Card } from "@/components/ui/card";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export default function NewModule() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = async (data: z.infer<typeof moduleSchema>) => {
    try {
      const response = await fetchWithAuth("/modules/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push(`/dashboard/${response.id}`);
    } catch (error) {
      form.setError("root", { message: "Failed to create module" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Create New Module
        </h1>
        <Card className="p-6 rounded-2xl shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Module Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Module Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-red-500">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full">
                Create Module
              </Button>
            </form>
          </Form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
