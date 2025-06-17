import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Play, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore } from '@/lib/modules-store';
import Navbar from '@/components/navbar';
import CreateModuleDialog from '@/components/create-module-dialog';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { modules } = useModulesStore();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleStartTest = (moduleId: string) => {
    navigate(`/start-test/${moduleId}`);
  };

  const handleManageModule = (moduleId: string) => {
    navigate(`/module/${moduleId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Управляйте своими тестами и отслеживайте результаты студентов
          </p>
        </div>

        <div className="mb-8">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать новый модуль
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-2">{module.title}</CardTitle>
                    <Badge variant={module.isActive ? "default" : "secondary"}>
                      {module.isActive ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {module.description || 'Без описания'}
                </CardDescription>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="mr-1 h-4 w-4" />
                  Создан: {new Date(module.createdAt).toLocaleDateString('ru-RU')}
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Users className="mr-1 h-4 w-4" />
                  {module.questions.length} вопросов • {module.results.length} прохождений
                </div>

                <div className="flex gap-2">
                  {module.isActive && module.questions.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStartTest(module.id)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Пройти тест
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    onClick={() => handleManageModule(module.id)}
                  >
                    <Settings className="mr-1 h-3 w-3" />
                    Управление
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {modules.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <Plus className="mx-auto h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Создайте свой первый модуль
                </h3>
                <p className="text-gray-500 mb-4">
                  Начните создавать тесты для ваших студентов
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Создать модуль
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateModuleDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}