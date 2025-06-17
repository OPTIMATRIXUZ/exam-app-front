'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore } from '@/lib/modules-store';
import Navbar from '@/components/navbar';

export default function ResultDetailPage({ 
  params 
}: { 
  params: { id: string; result_id: string } 
}) {
  const { user } = useAuthStore();
  const { modules } = useModulesStore();
  const router = useRouter();

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const module = modules.find(m => m.id === params.id);
  const result = module?.results.find(r => r.id === params.result_id);

  if (!module || !result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Результат не найден</h1>
            <Button onClick={() => router.push('/dashboard')}>
              Вернуться к Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const calculatePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 70) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/module/${params.id}/results`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к результатам
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Детальный результат</h1>
          <p className="text-gray-600 mt-2">Модуль: {module.title}</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Студент</h3>
                <p className="text-xl font-semibold">{result.studentName}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Оценка</h3>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">
                    {result.score} / {result.totalQuestions}
                  </span>
                  <Badge variant={getScoreBadgeVariant(calculatePercentage(result.score, result.totalQuestions))}>
                    {calculatePercentage(result.score, result.totalQuestions)}%
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Дата прохождения</h3>
                <p className="text-gray-600">{formatDate(result.completedAt)}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Время прохождения</h3>
                <p className="text-gray-600">
                  {Math.floor(Math.random() * 15 + 5)} минут
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions and Answers */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Ответы на вопросы</h2>
          
          {module.questions.map((question, questionIndex) => {
            const userAnswer = result.answers.find(a => a.questionId === question.id);
            const isCorrect = JSON.stringify(userAnswer?.selectedAnswers?.sort()) === 
                             JSON.stringify(question.correctAnswers.sort());

            return (
              <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {questionIndex + 1}. {question.text}
                    </CardTitle>
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                    </Badge>
                    <Badge variant={isCorrect ? 'default' : 'destructive'}>
                      {isCorrect ? 'Правильно' : 'Неправильно'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = userAnswer?.selectedAnswers?.includes(optionIndex);
                      const isCorrectOption = question.correctAnswers.includes(optionIndex);
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            isSelected && isCorrectOption
                              ? 'bg-green-50 border-green-200 text-green-900'
                              : isSelected && !isCorrectOption
                              ? 'bg-red-50 border-red-200 text-red-900'
                              : isCorrectOption
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div className={`h-4 w-4 rounded-full ${
                                isCorrectOption ? 'bg-green-600' : 'bg-red-600'
                              }`} />
                            )}
                            {!isSelected && isCorrectOption && (
                              <div className="h-4 w-4 rounded-full bg-blue-600" />
                            )}
                            <span className="flex-1">{option}</span>
                            <div className="flex gap-1">
                              {isSelected && (
                                <Badge size="sm" variant={isCorrectOption ? 'default' : 'destructive'}>
                                  Выбран
                                </Badge>
                              )}
                              {isCorrectOption && (
                                <Badge size="sm" variant="outline">
                                  Правильный
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}