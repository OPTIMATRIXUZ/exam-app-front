"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useRouter, useSearchParams } from "next/navigation";

const loginSchema = z.object({
  name: z.string().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid Number number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get("tab") === "signup";
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: isSignup
      ? { name: "", phoneNumber: "", password: "" }
      : { phoneNumber: "", password: "" },
  });

  const onSubmit = async (data: any) => {
    try {
      const endpoint = isSignup
        ? "http://127.0.0.1:8000/api/users/register"
        : "http://127.0.0.1:8000/api/users/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Authentication failed");
      const { access, refresh } = await response.json();
      // Сохранить токены в localStorage
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to authenticate. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-primary mb-6">
            {isSignup ? "Sign Up" : "Sign In"}
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isSignup && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+998991234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" className="w-full">
                {isSignup ? "Sign Up" : "Sign In"}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-gray-600">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              href={`/auth?tab=${isSignup ? "" : "signup"}`}
              className="text-primary hover:underline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
