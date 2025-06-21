"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlayCircle, Clock, BookOpen } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import Navbar from "@/components/navbar";
import { toast } from "sonner";
import { useModulesStore } from "@/lib/modules-store";
import { Module } from "@/lib/api";

interface Option { id: string; text: string; is_correct: boolean }
interface QuestionData {
  id: string;
  text: string;
  is_multiple_choice: boolean;
  options: Option[];
}
interface PreviewModule {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
  questions: QuestionData[];
}
interface AnswerRecord {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
}

export default function StartTestPage({ params }: { params: { slug: string } }) {
  const { user } = useAuthStore();
  const router = useRouter();

  // Preview state
  const [preview, setPreview] = useState<Module | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  const { fetchTestPreview } = useModulesStore();

  // Test session state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSel, setCurrentSel] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  // 1) Fetch preview on mount
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const loadPreview = async () => {
      setLoadingPreview(true);
      try {
        const previewData = await fetchTestPreview(params.slug);
        if (previewData) {
          setPreview(previewData);
          console.log("Fetched preview:", previewData);
        } else {
          toast.error("Тест не найден");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Ошибка при загрузке теста:", error);
        toast.error("Не удалось загрузить тест");
        // router.push("/dashboard");
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();
    
  }, [params.slug, user]);

  if (loadingPreview || !preview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8 text-center">Загрузка…</main>
      </div>
    );
  }

  // 2) Preview screen
  if (!attemptId) {
    if (!preview.is_active) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Тест недоступен</h1>
            <Button onClick={() => router.push("/dashboard")}>
              Вернуться к Dashboard
            </Button>
          </main>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto p-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{preview.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {preview.description && <p className="mb-4">{preview.description}</p>}
              <p className="mb-4">Вопросов: {preview.questions.length}</p>
              <div className="space-y-6">
                {preview.questions.map((q, idx) => (
                  <div key={q.id}>
                    <h3 className="font-semibold">
                      {idx + 1}. {q.text}
                    </h3>
                    <ul className="list-disc ml-6">
                      {q.options.map(opt => (
                        <li
                          key={opt.id}
                          className={opt.is_correct ? "text-green-600" : ""}
                        >
                          {opt.text} {opt.is_correct ? "(Правильный)" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={async () => {
              // Start test
              const res = await fetch(`/api/t/${params.slug}/start/`, {
                method: "POST",
              });
              if (!res.ok) {
                toast.error("Не удалось начать тест");
                return;
              }
              const { attempt_id } = await res.json();
              setAttemptId(attempt_id);

              // Prepare questions without correct flags
              const qs = preview.questions.map(q => ({
                ...q,
                options: q.options.map(o => ({
                  id: o.id,
                  text: o.text,
                  is_correct: false,
                })),
              }));
              // Shuffle questions & options
              const shuffled = qs
                .sort(() => Math.random() - 0.5)
                .map(q => ({
                  ...q,
                  options: q.options.sort(() => Math.random() - 0.5),
                }));
              setQuestions(shuffled);

              // Clear any old answers
              localStorage.removeItem("answers");
            }}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Начать тест
          </Button>
        </main>
      </div>
    );
  }

  // 3) Quiz loop
  if (!completed) {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{preview.title}</h2>
            <span className="text-gray-600">
              Вопрос {currentIdx + 1} из {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 mb-6" />
          <h3 className="text-lg font-medium mb-4">{q.text}</h3>
          {q.is_multiple_choice ? (
            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={currentSel.includes(i)}
                    onCheckedChange={c =>
                      setCurrentSel(cs =>
                        c ? [...cs, i] : cs.filter(x => x !== i)
                      )
                    }
                    id={`opt-${i}`}
                  />
                  <Label htmlFor={`opt-${i}`}>{opt.text}</Label>
                </div>
              ))}
            </div>
          ) : (
            <RadioGroup
              value={currentSel[0]?.toString() || ""}
              onValueChange={v => setCurrentSel([parseInt(v)])}
              className="space-y-3 mb-6"
            >
              {q.options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <RadioGroupItem value={i.toString()} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`}>{opt.text}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          <Button
            onClick={() => {
              if (!currentSel.length) {
                toast.error("Выберите ответ");
                return;
              }
              // Evaluate correctness against preview
              const orig = preview.questions.find(x => x.id === q.id)!;
              const correctIdx = orig.options
                .map((o, idx) => (o.is_correct ? idx : -1))
                .filter(i => i >= 0);
              const isCorrect =
                JSON.stringify(correctIdx.sort()) ===
                JSON.stringify(currentSel.sort());

              // Save to localStorage
              const stored: AnswerRecord[] = JSON.parse(
                localStorage.getItem("answers") || "[]"
              );
              stored.push({
                questionId: q.id,
                selectedOptionIds: currentSel.map(i => q.options[i].id),
                isCorrect,
              });
              localStorage.setItem("answers", JSON.stringify(stored));

              setCurrentSel([]);
              if (currentIdx + 1 < questions.length) {
                setCurrentIdx(currentIdx + 1);
              } else {
                setCompleted(true);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {currentIdx + 1 < questions.length ? "Ответить" : "Завершить тест"}
          </Button>
        </main>
      </div>
    );
  }

  // 4) Completion & final submit
  const submitAll = async () => {
    const all: AnswerRecord[] = JSON.parse(
      localStorage.getItem("answers") || "[]"
    );
    const res = await fetch(`/api/t/${params.slug}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_id: attemptId, answers: all }),
    });
    if (!res.ok) {
      toast.error("Ошибка при отправке результатов");
      return;
    }
    router.push(`/start-test/${params.slug}/result`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Тест завершён!</h1>
        <Button
          onClick={submitAll}
          className="bg-green-600 hover:bg-green-700"
        >
          Посмотреть результаты
        </Button>
      </main>
    </div>
  );
}