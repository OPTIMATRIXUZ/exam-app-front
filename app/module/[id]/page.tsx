'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, BarChart3, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore, initialModulesData } from '@/lib/modules-store';
import Navbar from '@/components/navbar';
import { toast } from 'sonner';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return initialModulesData.map((module) => ({
    id: module.id,
  }));
}

export default function ModulePage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const { modules, updateModule } = useModulesStore();
  const router = useRouter();

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const module = modules.find(m => m.id === params.id);

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Модуль не найден</h1>
            <Button onClick={() => router.push('/dashboard')}>
              Вернуться к Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleToggleActive = (checked: boolean) => {
    if (checked && module.questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос перед активацией модуля');
      return;
    }
    
    updateModule(module.id, { isActive: checked });
    toast.success(checked ? 'Модуль активирован' : 'Модуль деактивирован');
  };

  const getShareLink = () => {
    return `${window.location.origin}/start-test/${module.id}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareLink());
    toast.success('Ссылка скопирована в буфер обмена');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
              {module.description && (
                <p className="text-gray-600 mb-4">{module.description}</p>
              )}
              <div className="flex items-center gap-4">
                <Badge variant={module.isActive ? "default" : "secondary"}>
                  {module.isActive ? 'Активен' : 'Неактивен'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {module.questions.length} вопросов
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={module.isActive}
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

              {module.isActive && module.questions.length > 0 && (
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
          
          {module.questions.length === 0 ? (
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
                          {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
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
                            question.correctAnswers.includes(optionIndex)
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          {question.correctAnswers.includes(optionIndex) ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={question.correctAnswers.includes(optionIndex) ? 'font-medium text-green-900' : ''}>
                            {option}
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