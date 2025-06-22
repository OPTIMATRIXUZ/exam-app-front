"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Play,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiClient } from "@/lib/api";
import { useTestStore } from "@/lib/stores/test-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { TestPreview, TestResult } from "@/types";
import { toast } from "sonner";

type TestPhase = "preview" | "confirm-start" | "taking" | "completed";

export default function StartTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [phase, setPhase] = useState<TestPhase>("preview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [questionId: number]: number[];
  }>({});
  const [sessionId, setSessionId] = useState<string>("");

  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const slug = params.slug as string;

  useEffect(() => {
    setHydrated(true);
  }, []);

  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [testPreview, setTestPreview] = useState<TestPreview | null>(null);

  const {
    attemptId,
    questions,
    currentQuestionIndex,
    answers,
    isStarted,
    isCompleted,
    setTestData,
    setCurrentQuestion,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    completeTest,
    resetTest,
    getCurrentQuestion,
    getAnswer,
    getProgress,
  } = useTestStore();

  useEffect(() => {
    // 2) wait for hydration
    if (!hydrated) return;

    // 3) then guard
    if (!isAuthenticated) {
      toast.error("Please login to take the test");
      return void router.push("/auth/login");
    }

    // 4) safe to load user + preview
    loadUser();
    fetchTestPreview();

    return () => resetTest();
  }, [hydrated, isAuthenticated, router, loadUser, slug]);

  const fetchTestPreview = async () => {
    try {
      const preview = await apiClient.getTestPreview(slug);
      if (!preview.is_active) {
        toast.error("This test is not currently active");
        router.push("/dashboard");
        return;
      }
      setTestPreview(preview);
    } catch (error) {
      toast.error("Test not found or not available");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = () => {
    if (!user) {
      toast.error("User information not available");
      return;
    }
    setPhase("confirm-start");
  };

  const handleBeginTest = async () => {
    if (!testPreview || !user) return;

    setIsLoading(true);
    try {
      const testStart = await apiClient.startTest(slug, user.user.full_name);

      // Process questions - convert is_multiple_choice to question_type
      const processedQuestions = testStart.questions.map((question) => ({
        ...question,
        is_multiple_choice: question.is_multiple_choice,
        options: question.options.map((option) => ({
          ...option,
          is_correct: false, // Hide correct answers during test
        })),
      }));

      setTestData(
        testStart.attempt_id,
        processedQuestions,
        user.user.full_name
      );
      setSessionId(testStart.attempt_id.toString()); // Use attempt_id as session_id
      setPhase("taking");
    } catch (error) {
      toast.error("Failed to start test");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, optionId: number) => {
    const question = getCurrentQuestion();
    if (!question) return;

    const newSelected = { ...selectedAnswers };

    if (!question.is_multiple_choice) {
      // SINGLE‐choice: always overwrite
      newSelected[questionId] = [optionId];
    } else {
      // MULTIPLE‐choice: toggle
      const current = newSelected[questionId] || [];
      if (current.includes(optionId)) {
        newSelected[questionId] = current.filter((id) => id !== optionId);
      } else {
        newSelected[questionId] = [...current, optionId];
      }
    }

    setSelectedAnswers(newSelected);
  };

  const handleNextQuestion = () => {
    const question = getCurrentQuestion();
    if (!question) return;

    const selectedOptions = selectedAnswers[question.id] || [];
    if (selectedOptions.length === 0) {
      toast.error("Please select an answer before continuing");
      return;
    }

    // Save answer with correct format for API
    const correctOptions =
      testPreview?.questions
        .find((q) => q.id === question.id)
        ?.options.filter((opt) => opt.is_correct)
        .map((opt) => opt.id) || [];

    const isCorrect =
      selectedOptions.length === correctOptions.length &&
      selectedOptions.every((id) => correctOptions.includes(id));

    saveAnswer(question.id, selectedOptions, isCorrect);

    // Move to next question or complete test
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      handleCompleteTest();
    }
  };

  const handlePreviousQuestion = () => {
    previousQuestion();
  };

  const handleCompleteTest = async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      // Format answers for API - send all answers at once
      const formattedAnswers = answers.map((answer) => ({
        question_id: answer.question_id,
        selected_option_ids: answer.selected_option_ids, // Keep full array for multiple answers
        is_correct: answer.is_correct, // Add the required property
      }));

      // Submit all answers
      await apiClient.submitAnswers(slug, attemptId, formattedAnswers);

      // Get result using session_id
      const result = await apiClient.getTestResult(slug, Number(sessionId));
      setTestResult(result);

      completeTest();
      setPhase("completed");
    } catch (error) {
      toast.error("Failed to submit test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = currentQuestion ? getAnswer(currentQuestion.id) : null;
  const progress = getProgress();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!testPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-2">Test Not Found</h2>
            <p className="text-gray-600 mb-4">
              The requested test could not be found.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preview Phase
  if (phase === "preview") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                {testPreview.title}
              </CardTitle>
              {testPreview.description && (
                <CardDescription className="text-lg">
                  {testPreview.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-2xl font-bold text-blue-600">
                    {testPreview.questions.length}
                  </span>
                  <span className="text-sm text-gray-600">Questions</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                  <Clock className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-2xl font-bold text-green-600">
                    ~{Math.ceil(testPreview.questions.length * 1.5)}
                  </span>
                  <span className="text-sm text-gray-600">Minutes</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                  <User className="h-8 w-8 text-purple-600 mb-2" />
                  <span className="text-2xl font-bold text-purple-600">1</span>
                  <span className="text-sm text-gray-600">Attempt</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Test Preview</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {testPreview.questions.map((question, index) => (
                    <Card
                      key={question.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Question {index + 1}
                        </CardTitle>
                        <CardDescription>{question.text}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={option.id}
                              className={`flex items-center p-3 rounded-lg border ${
                                option.is_correct
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="text-sm font-medium mr-3">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span className="flex-1">{option.text}</span>
                              {option.is_correct && (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-4">
                {user && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Taking test as:</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {user.user.full_name}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleStartTest}
                  size="lg"
                  className="w-full"
                  disabled={!user}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Confirm Start Phase
  if (phase === "confirm-start") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Ready to Begin?
            </CardTitle>
            <CardDescription>
              You're about to start the test. Good luck!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-semibold">
                Hello, {user?.user.full_name}!
              </p>
              <p className="text-gray-600">
                You have {testPreview.questions_count} questions to answer.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setPhase("preview")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleBeginTest}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Begin Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Taking Test Phase
  if (phase === "taking" && currentQuestion) {
    const questionSelectedAnswers = selectedAnswers[currentQuestion.id] || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h1>
              <Badge variant="outline">
                {currentQuestion.is_multiple_choice
                  ? "Multiple Choice"
                  : "Single Choice"}
              </Badge>
            </div>
            {/* <Progress value={progress} className="h-2" /> */}
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
              <CardDescription>
                {currentQuestion.is_multiple_choice
                  ? "Select one or more answers"
                  : "Select one answer"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      questionSelectedAnswers.includes(option.id)
                        ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      handleAnswerSelect(currentQuestion.id, option.id)
                    }
                  >
                    <div className="flex items-center space-x-3">
                      {currentQuestion.is_multiple_choice ? (
                        <Checkbox
                          checked={questionSelectedAnswers.includes(option.id)}
                          onCheckedChange={() =>
                            handleAnswerSelect(currentQuestion.id, option.id)
                          }
                        />
                      ) : (
                        <RadioGroup
                          value={questionSelectedAnswers[0]?.toString() || ""}
                          onValueChange={(val) =>
                            handleAnswerSelect(currentQuestion.id, Number(val))
                          }
                        >
                          <RadioGroupItem
                            value={option.id.toString()}
                            checked={questionSelectedAnswers.includes(
                              option.id
                            )}
                          />
                        </RadioGroup>
                      )}
                      <span className="text-sm font-medium">
                        {String.fromCharCode(65 + index)}.
                      </span>
                    </div>
                    <span className="flex-1 ml-3">{option.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  onClick={handleNextQuestion}
                  disabled={
                    questionSelectedAnswers.length === 0 || isSubmitting
                  }
                >
                  {currentQuestionIndex === questions.length - 1 ? (
                    isSubmitting ? (
                      "Submitting..."
                    ) : (
                      "Complete Test"
                    )
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completed Phase
  if (phase === "completed" && testResult) {
    console.log("Test Result:", testResult);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Test Completed!
              </CardTitle>
              <CardDescription>Here are your results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {testResult.percentage}%
                  </span>
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  {testResult.score} out of {testResult.total_questions} correct
                </h2>
                <p className="text-gray-600">
                  {testResult.percentage >= 80
                    ? "Excellent work!"
                    : testResult.percentage >= 60
                    ? "Good job!"
                    : "Keep practicing!"}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Detailed Results</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {testResult.answers.map((answer, index) => (
                    <Card
                      key={index}
                      className={`border-l-4 ${
                        answer.is_correct
                          ? "border-l-green-500"
                          : "border-l-red-500"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              Question {index + 1}
                            </CardTitle>
                            <CardDescription>
                              {answer.question.text}
                            </CardDescription>
                          </div>
                          {answer.is_correct ? (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Incorrect
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {answer.question.options.map(
                            (option, optionIndex) => {
                              const isSelected = answer.selected_options.some(
                                (selected) => selected.id === option.id
                              );
                              const isCorrect = answer.correct_options.some(
                                (correct) => correct.id === option.id
                              );

                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-center p-3 rounded-lg border ${
                                    isCorrect
                                      ? "bg-green-50 border-green-200"
                                      : isSelected
                                      ? "bg-red-50 border-red-200"
                                      : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <span className="text-sm font-medium mr-3">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className="flex-1">{option.text}</span>
                                  <div className="flex items-center space-x-2">
                                    {isSelected && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Your Answer
                                      </Badge>
                                    )}
                                    {isCorrect && (
                                      <Badge
                                        variant="default"
                                        className="text-xs bg-green-600"
                                      >
                                        Correct
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="text-center pt-6">
                <Button onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
