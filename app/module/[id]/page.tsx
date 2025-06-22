'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Play, Plus, Edit, BarChart3, Power, PowerOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { Module, Question } from '@/types';
import { toast } from 'sonner';

export default function ModulePage() {
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const moduleId = parseInt(params.id as string);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const [moduleData, questionsData] = await Promise.all([
        apiClient.getModule(moduleId),
        apiClient.getQuestions(moduleId),
      ]);
      setModule(moduleData);
      setQuestions(questionsData);
    } catch (error) {
      toast.error('Failed to load module data');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModule = async () => {
    if (!module) return;

    setIsToggling(true);
    try {
      if (module.isActive) {
        await apiClient.deactivateModule(moduleId);
        setModule({ ...module, isActive: false });
        toast.success('Module deactivated');
      } else {
        const response = await apiClient.activateModule(moduleId);
        setModule({ ...module, isActive: true, slug: response.slug });
        toast.success('Module activated');
      }
    } catch (error) {
      toast.error('Failed to toggle module status');
    } finally {
      setIsToggling(false);
    }
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

  if (!module) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Module not found</h1>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-gray-600">{module.description}</p>
              )}
            </div>
            <Badge variant={module.isActive ? 'default' : 'secondary'} className="text-sm">
              {module.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push(`/module/${moduleId}/results`)}
              variant="outline"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Results
            </Button>
            
            <Button
              onClick={() => router.push(`/module/${moduleId}/add-question`)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
            
            <Button
              onClick={handleToggleModule}
              disabled={isToggling}
              variant={module.isActive ? 'destructive' : 'default'}
            >
              {module.isActive ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>

            {module.isActive && module.slug && (
              <Button
                onClick={() => router.push(`/start-test/${module.slug}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Test
              </Button>
            )}
          </div>

          {module.isActive && module.slug && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Test URL:</strong>{' '}
                <code className="bg-green-100 px-2 py-1 rounded">
                  {window.location.origin}/start-test/{module.slug}
                </code>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Questions ({questions.length})
            </h2>
          </div>

          {questions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No questions yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first question to start building this test
                </p>
                <Button onClick={() => router.push(`/module/${moduleId}/add-question`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="question-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Question {index + 1}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {question.text}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {question.is_multiple_choice ? 'Multiple Choice' : 'Single Choice'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/module/${moduleId}/edit-question/${question.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={option.id}
                          className={`flex items-center p-3 rounded-lg border ${
                            option.is_correct
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <span className="text-sm font-medium mr-3">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="flex-1">{option.text}</span>
                          {option.is_correct && (
                            <Badge variant="default" className="ml-2">
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
          )}
        </div>
      </main>
    </div>
  );
}