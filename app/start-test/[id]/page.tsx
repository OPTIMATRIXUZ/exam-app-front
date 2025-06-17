'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, Clock, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore, Question } from '@/lib/modules-store';
import Navbar from '@/components/navbar';
import { toast } from 'sonner';

interface TestState {
  currentQuestionIndex: number;
  answers: { questionId: string; selectedAnswers: number[] }[];
  isStarted: boolean;
  isCompleted: boolean;
  startTime: Date | null;
  endTime: Date | null;
}

export default function StartTestPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const { modules, addTestResult } = useModulesStore();
  const router = useRouter();

  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: [],
    isStarted: false,
    isCompleted: false,
    startTime: null,
    endTime: null,
  });

  const [currentAnswers, setCurrentAnswers] = useState<number[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const module = modules.find(m => m.id === params.id);

  useEffect(() => {
    if (module && module.questions.length > 0) {
      // Shuffle questions and their options
      const shuffled = [...module.questions]
        .sort(() => Math.random() - 0.5)
        .map(question => ({
          ...question,
          options: question.options
            .map((option, index) => ({ option, originalIndex: index }))
            .sort(() => Math.random() - 0.5)
            .map((item, newIndex) => ({
              ...item,
              newIndex
            }))
        }));
      
      setShuffledQuestions(shuffled as any);
    }
  }, [module]);

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Тест не найден</h1>
            <Button onClick={() => router.push('/dashboard')}>
              Вернуться к Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!module.isActive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Тест недоступен</h1>
            <p className="text-gray-600 mb-4">Этот тест в данный момент неактивен</p>
            <Button onClick={() => router.push('/dashboard')}>
              Вернуться к Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const startTest = () => {
    setTestState(prev => ({
      ...prev,
      isStarted: true,
      startTime: new Date(),
    }));
  };

  const submitAnswer = () => {
    const currentQuestion = shuffledQuestions[testState.currentQuestionIndex];
    
    if (currentAnswers.length === 0) {
      toast.error('Выберите хотя бы один ответ');
      return;
    }

    // Map shuffled indices back to original indices
    const mappedAnswers = currentAnswers.map(shuffledIndex => {
      const shuffledOptions = currentQuestion.options as any;
      return shuffledOptions[shuffledIndex].originalIndex;
    });

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedAnswers: mappedAnswers
    };

    const updatedAnswers = [...testState.answers.filter(a => a.questionId !== currentQuestion.id), newAnswer];

    if (testState.currentQuestionIndex < shuffledQuestions.length - 1) {
      // Move to next question
      setTestState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        answers: updatedAnswers,
      }));
      setCurrentAnswers([]);
    } else {
      // Complete test
      completeTest(updatedAnswers);
    }
  };

  const completeTest = (finalAnswers: { questionId: string; selectedAnswers: number[] }[]) => {
    const endTime = new Date();
    
    // Calculate score
    let score = 0;
    finalAnswers.forEach(answer => {
      const question = module.questions.find(q => q.id === answer.questionId);
      if (question) {
        const isCorrect = JSON.stringify(answer.selectedAnswers.sort()) === 
                         JSON.stringify(question.correctAnswers.sort());
        if (isCorrect) score++;
      }
    });

    // Add result to store
    addTestResult(params.id, {
      studentName: user.name,
      score,
      totalQuestions: shuffledQuestions.length,
      answers: finalAnswers,
      completedAt: endTime.toISOString(),
    });

    setTestState(prev => ({
      ...prev,
      isCompleted: true,
      endTime,
      answers: finalAnswers,
    }));
  };

  const handleAnswerChange = (optionIndex: number, checked: boolean) => {
    const currentQuestion = shuffledQuestions[testState.currentQuestionIndex];
    
    if (currentQuestion.type === 'single') {
      setCurrentAnswers(checked ? [optionIndex] : []);
    } else {
      if (checked) {
        setCurrentAnswers([...currentAnswers, optionIndex]);
      } else {
        setCurrentAnswers(currentAnswers.filter(i => i !== optionIndex));
      }
    }
  };

  const getResultColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Test start screen
  if (!testState.isStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <CardTitle className="text-2xl mb-4">{module.title}</CardTitle>
              {module.description && (
                <p className="text-gray-600 mb-6">{module.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {module.questions.length}
                  </div>
                  <div className="text-gray-600">Вопросов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    <Clock className="h-6 w-6 mx-auto" />
                  </div>
                  <div className="text-gray-600">Без ограничений</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
                  <div className="text-gray-600">Попытка</div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Инструкции:</h3>
                <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
                  <li>• Внимательно читайте каждый вопрос</li>
                  <li>• Выберите один или несколько правильных ответов</li>
                  <li>• Нажмите "Ответить", чтобы перейти к следующему вопросу</li>
                  <li>• После завершения вы увидите результаты</li>
                </ul>
              </div>

              <Button 
                onClick={startTest}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Начать тест
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Test completion screen
  if (testState.isCompleted) {
    const score = testState.answers.reduce((acc, answer) => {
      const question = module.questions.find(q => q.id === answer.questionId);
      if (question) {
        const isCorrect = JSON.stringify(answer.selectedAnswers.sort()) === 
                         JSON.stringify(question.correctAnswers.sort());
        return acc + (isCorrect ? 1 : 0);
      }
      return acc;
    }, 0);

    const percentage = Math.round((score / shuffledQuestions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center mb-8">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">Тест завершен!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <div className={`text-6xl font-bold mb-4 ${getResultColor(percentage)}`}>
                  {percentage}%
                </div>
                <div className="text-xl text-gray-600 mb-2">
                  Правильных ответов: {score} из {shuffledQuestions.length}
                </div>
                <div className="text-gray-500">
                  Время прохождения: {
                    testState.startTime && testState.endTime
                      ? Math.round((testState.endTime.getTime() - testState.startTime.getTime()) / 60000)
                      : 0
                  } минут
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={() => router.push('/dashboard')}>
                  Вернуться к Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Пройти еще раз
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Детальные результаты</h2>
            
            {shuffledQuestions.map((question, questionIndex) => {
              const userAnswer = testState.answers.find(a => a.questionId === question.id);
              const isCorrect = JSON.stringify(userAnswer?.selectedAnswers?.sort()) === 
                               JSON.stringify(question.correctAnswers.sort());

              return (
                <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {questionIndex + 1}. {question.text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(question.options as any).map((optionData: any, optionIndex: number) => {
                        const isSelected = userAnswer?.selectedAnswers?.includes(optionData.originalIndex);
                        const isCorrectOption = question.correctAnswers.includes(optionData.originalIndex);
                        
                        return (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              isSelected && isCorrectOption
                                ? 'bg-green-50 border border-green-200'
                                : isSelected && !isCorrectOption
                                ? 'bg-red-50 border border-red-200'
                                : isCorrectOption
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            {optionData.option}
                            {isSelected && <span className="ml-2 text-sm">(Ваш ответ)</span>}
                            {isCorrectOption && <span className="ml-2 text-sm text-green-600">(Правильный ответ)</span>}
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

  // Test question screen
  const currentQuestion = shuffledQuestions[testState.currentQuestionIndex];
  const progress = ((testState.currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            <span className="text-gray-600">
              Вопрос {testState.currentQuestionIndex + 1} из {shuffledQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
            <p className="text-sm text-gray-600">
              {currentQuestion.type === 'single' 
                ? 'Выберите один правильный ответ' 
                : 'Выберите все правильные ответы'
              }
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-8">
              {currentQuestion.type === 'single' ? (
                <RadioGroup 
                  value={currentAnswers[0]?.toString() || ''}
                  onValueChange={(value) => setCurrentAnswers([parseInt(value)])}
                >
                  {(currentQuestion.options as any).map((optionData: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                      >
                        {optionData.option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  {(currentQuestion.options as any).map((optionData: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        checked={currentAnswers.includes(index)}
                        onCheckedChange={(checked) => handleAnswerChange(index, checked as boolean)}
                        id={`option-${index}`}
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                      >
                        {optionData.option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={submitAnswer}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={currentAnswers.length === 0}
            >
              {testState.currentQuestionIndex < shuffledQuestions.length - 1 ? 'Ответить' : 'Завершить тест'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}