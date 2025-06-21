"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  BarChart3,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useModulesStore } from "@/lib/modules-store";
import Navbar from "@/components/navbar";
import { toast } from "sonner";
import { Module } from "@/lib/api";

export default function ModulePage({ params }: { params: { id: string } }) {
  // Prevent server from referencing window/location:
  if (typeof window === "undefined") return null;

  const { user } = useAuthStore();
  const { fetchModule, activateModule, deactivateModule } = useModulesStore();
  const [isActive, setIsActive] = useState<boolean>(false);
  const router = useRouter();
  const [module, setModule] = useState<Module | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadModule = async () => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setIsLoading(true);
      console.log("Fetching module with id:", params.id);

      try {
        const fetchedModule = await fetchModule(params.id);
        console.log("Response from fetchModule:", fetchedModule);
        if (fetchedModule) {
          setModule(fetchedModule);
          setIsActive(fetchedModule.isActive ?? false);
        } else {
          setModule(undefined);
          toast.error("Модуль не найден");
        }
      } catch (error) {
        console.error("Error fetching module:", error);
        toast.error("Ошибка при загрузке модуля");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadModule();
    }
  }, [user, params.id, fetchModule, router]);

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* ... Loading placeholder ... */}
          </div>
        </main>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ... Module not found UI ... */}
        </main>
      </div>
    );
  }

  const handleToggleActive = async (checked: boolean) => {
    if (checked && (!module?.questions || module.questions.length === 0)) {
      toast.error("Добавьте хотя бы один вопрос перед активацией модуля");
      return;
    }

    if (checked) {
      // Activate: expect activateModule to return a slug on success
      const slug = await activateModule(module.id);
      if (slug) {
        toast.success("Модуль активирован");
        setIsActive(true);
        setModule({ ...module, slug });
        // router.refresh();
      } else {
        toast.error("Ошибка при активации модуля");
      }
    } else {
      // Deactivate: expect deactivateModule returns boolean as before
      const success = await deactivateModule(module.id);
      if (success) {
        toast.success("Модуль деактивирован");
        setIsActive(false);
        setModule({ ...module, isActive: false });
        // router.refresh();
      } else {
        toast.error("Ошибка при деактивации модуля");
      }
    }
  };

  const getShareLink = () => {
    // Use window.location only when available
    const origin = window?.location?.origin || "";
    return `${origin}/start-test/${module.slug}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    toast.success("Ссылка скопирована в буфер обмена");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-gray-600 mb-4">{module.description}</p>
              )}
              <div className="flex items-center gap-4">
                <Badge
                  variant={isActive || module.isActive ? "default" : "secondary"}
                >
                  {isActive || module.isActive ? "Активен" : "Неактивен"}
                </Badge>
                <span className="text-sm text-gray-500">
                  {module.questions ? module.questions.length : 0} вопросов
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                  id="module-active"
                />
                <label htmlFor="module-active" className="text-sm font-medium">
                  Активировать модуль
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/module/${module.id}/results`)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Результаты
                </Button>
                <Button
                  onClick={() => router.push(`/module/${module.id}/add-question`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить вопрос
                </Button>
              </div>
              {(module.isActive || isActive) &&
                (module.questions?.length ?? 0) > 0 && (
                  <Button variant="outline" onClick={copyShareLink}>
                    Копировать ссылку для прохождения
                  </Button>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Вопросы</h2>
          {!module.questions || module.questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Plus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Пока нет вопросов
                </h3>
                <p className="text-gray-500 mb-4">
                  Добавьте первый вопрос, чтобы начать создавать тест
                </p>
                <Button
                  onClick={() => router.push(`/module/${module.id}/add-question`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Добавить вопрос
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {module.questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {index + 1}. {question.text}
                        </CardTitle>
                        <Badge variant="outline">
                          {question.is_multiple_choice
                            ? "Несколько ответов"
                            : "Один ответ"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/module/${module.id}/edit-question/${question.id}`
                          )
                        }
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`flex items-center gap-2 p-2 rounded ${
                            option.is_correct
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          {option.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span
                            className={option.is_correct ? "font-medium text-green-900" : ""}
                          >
                            {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}