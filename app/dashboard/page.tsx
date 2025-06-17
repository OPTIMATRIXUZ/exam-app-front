'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Play, Settings, TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore } from '@/lib/modules-store';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import CreateModuleDialog from '@/components/create-module-dialog';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { modules } = useModulesStore();
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleStartTest = (moduleId: string) => {
    router.push(`/start-test/${moduleId}`);
  };

  const handleManageModule = (moduleId: string) => {
    router.push(`/module/${moduleId}`);
  };

  const totalQuestions = modules.reduce((acc, module) => acc + module.questions.length, 0);
  const totalResults = modules.reduce((acc, module) => acc + module.results.length, 0);
  const activeModules = modules.filter(module => module.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Добро пожаловать, {user.name}!
          </h1>
          <p className="text-gray-600 text-lg">
            Управляйте своими тестами и отслеживайте результаты студентов
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Всего модулей</p>
                  <p className="text-3xl font-bold">{modules.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Активных модулей</p>
                  <p className="text-3xl font-bold">{activeModules}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Всего вопросов</p>
                  <p className="text-3xl font-bold">{totalQuestions}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Прохождений</p>
                  <p className="text-3xl font-bold">{totalResults}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Создать новый модуль
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-3 text-gray-900">{module.title}</CardTitle>
                      <Badge 
                        variant={module.isActive ? "default" : "secondary"}
                        className={module.isActive 
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white" 
                          : "bg-gray-100 text-gray-600"
                        }
                      >
                        {module.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6 text-gray-600 leading-relaxed">
                    {module.description || 'Без описания'}
                  </CardDescription>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-2 h-4 w-4" />
                      Создан: {new Date(module.createdAt).toLocaleDateString('ru-RU')}
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-2 h-4 w-4" />
                      {module.questions.length} вопросов • {module.results.length} прохождений
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {module.isActive && module.questions.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStartTest(module.id)}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors duration-200"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Пройти тест
                      </Button>
                    )}
                    <Button 
                      size="sm"
                      onClick={() => handleManageModule(module.id)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Управление
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {modules.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="col-span-full"
            >
              <Card className="text-center py-16 border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm">
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Plus className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Создайте свой первый модуль
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Начните создавать тесты для ваших студентов и отслеживайте их прогресс
                    </p>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Создать модуль
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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