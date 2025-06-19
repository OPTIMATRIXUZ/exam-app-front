"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useModulesStore } from "@/lib/modules-store";
import Navbar from "@/components/navbar";
import { toast } from "sonner";
import { QuestionCreate } from "@/lib/api";

export default function AddQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuthStore();
  const { modules, addQuestion, fetchModule } = useModulesStore();
  const router = useRouter();

  const [module, setModule] = useState(modules.find((m) => m.id === params.id));
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [questionType, setQuestionType] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModule, setIsLoadingModule] = useState(false);

  useEffect(() => {
    if (user && params.id && !module) {
      loadModule();
    }
  }, [user, params.id]);

  const loadModule = async () => {
    setIsLoadingModule(true);
    const moduleData = await fetchModule(params.id);
    if (moduleData) {
      setModule(moduleData);
    }
    setIsLoadingModule(false);
  };

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user]);

  if (isLoadingModule) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-4 p-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Модуль не найден
                </h3>
                <p className="text-red-700">
                  Модуль с ID {params.id} не существует или недоступен.
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Вернуться к Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Минимум 2 варианта ответа");
      return;
    }

    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);

    // Update correct answers
    const newCorrectAnswers = correctAnswers
      .filter((answerIndex) => answerIndex !== index)
      .map((answerIndex) =>
        answerIndex > index ? answerIndex - 1 : answerIndex
      );
    setCorrectAnswers(newCorrectAnswers);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectAnswerChange = (index: number, checked: boolean) => {
    if (!questionType) {
      setCorrectAnswers(checked ? [index] : []);
    } else {
      if (checked) {
        setCorrectAnswers([...correctAnswers, index]);
      } else {
        setCorrectAnswers(correctAnswers.filter((i) => i !== index));
      }
    }
  };

  const handleSubmit = async (saveAndContinue = false) => {
    // валидация…
    if (!questionText.trim()) {
      toast.error("Введите текст вопроса");
      return;
    }
    if (options.length < 2) {
      toast.error("Добавьте минимум 3 варианта ответа");
      return;
    }
    if (options.some((opt) => !opt.trim())) {
      toast.error("Все варианты ответов должны быть заполнены");
      return;
    }
    if (!questionType && correctAnswers.length !== 1) {
      toast.error("Выберите один правильный ответ для одиночного выбора");
      return;
    }

    if (questionType && correctAnswers.length === 0) {
      toast.error("Выберите хотя бы один правильный ответ для множественного выбора");
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());
    // собираем DTO
    const payload: QuestionCreate = {
      text: questionText.trim(),
      is_multiple_choice: questionType,
      options: filledOptions.map((opt, idx) => ({
        text: opt,
        is_correct: correctAnswers.includes(idx),
      })),
    };

    console.log("Submitting question:", payload);

    setIsLoading(true);
    const success = await addQuestion(params.id, payload);
    setIsLoading(false);

    if (success) {
      toast.success("Вопрос успешно добавлен!");
      if (saveAndContinue) {
        // сброс формы
        setQuestionText("");
        setOptions(["", "", ""]);
        setCorrectAnswers([]);
        setQuestionType(false);
      } else {
        router.push(`/module/${params.id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/module/${params.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к модулю
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Добавить вопрос</h1>
          <p className="text-gray-600 mt-2">Модуль: {module.title}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Создание нового вопроса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question">Текст вопроса *</Label>
              <Textarea
                id="question"
                placeholder="Введите ваш вопрос..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Question Type */}
            <div className="space-y-3">
              <Label>Тип вопроса</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={questionType}
                  onCheckedChange={(checked) => {
                    setQuestionType(checked);
                    setCorrectAnswers([]);
                  }}
                  id="question-type"
                  disabled={isLoading}
                />
                <label htmlFor="question-type" className="text-sm font-medium">
                  {!questionType
                    ? "Один правильный ответ"
                    : "Несколько правильных ответов"}
                </label>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Варианты ответов *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить вариант
                </Button>
              </div>

              <div className="space-y-3">
                {!questionType ? (
                  <RadioGroup
                    value={correctAnswers[0]?.toString() || ""}
                    onValueChange={(value) =>
                      setCorrectAnswers([parseInt(value)])
                    }
                  >
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder={`Вариант ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                          disabled={isLoading}
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Checkbox
                          checked={correctAnswers.includes(index)}
                          onCheckedChange={(checked) =>
                            handleCorrectAnswerChange(index, checked as boolean)
                          }
                          id={`option-${index}`}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder={`Вариант ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                          disabled={isLoading}
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                variant="outline"
              >
                Сохранить и добавить ещё
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/module/${params.id}`)}
                disabled={isLoading}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
