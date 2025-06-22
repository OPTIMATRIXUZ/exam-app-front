'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Calendar, Target, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { TestResult } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ResultDetailPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const moduleId = parseInt(params.id as string);
  const resultId = parseInt(params.resultId as string);

  useEffect(() => {
    fetchResult();
  }, [moduleId, resultId]);

  const fetchResult = async () => {
    try {
      const data = await apiClient.getResult(moduleId, resultId);
      setResult(data);
    } catch (error) {
      toast.error('Failed to load result details');
      router.push(`/module/${moduleId}/results`);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Result not found</h1>
            <Button onClick={() => router.push(`/module/${moduleId}/results`)}>
              Back to Results
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/module/${moduleId}/results`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Result Details
          </h1>
          <p className="text-gray-600">
            Detailed breakdown of the test attempt
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Student</p>
                    <p className="font-semibold">{result.student_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className={`font-semibold ${getScoreColor(result.percentage)}`}>
                      {result.score}/{result.total_questions}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <Badge variant={getScoreBadge(result.percentage)}>
                      {result.percentage}%
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Percentage</p>
                    <p className="font-semibold">
                      {result.percentage >= 80 ? 'Excellent' : 
                       result.percentage >= 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="font-semibold">
                      {format(new Date(), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Answers */}
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of each question and answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.answers.map((answer, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          Question {index + 1}
                        </h3>
                        <p className="text-gray-700 mb-4">
                          {answer.question.text}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {answer.is_correct ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
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
                    </div>

                    <div className="space-y-3">
                      {answer.question.options.map((option, optionIndex) => {
                        const isSelected = answer.selected_options.some(selected => selected.id === option.id);
                        const isCorrect = answer.correct_options.some(correct => correct.id === option.id);
                        
                        return (
                          <div
                            key={option.id}
                            className={`flex items-center p-3 rounded-lg border ${
                              isCorrect
                                ? 'bg-green-50 border-green-200'
                                : isSelected
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="text-sm font-medium mr-3">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span className="flex-1">{option.text}</span>
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <Badge variant="outline" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                              {isCorrect && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {index < result.answers.length - 1 && (
                      <Separator className="my-6" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}