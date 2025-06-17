'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Eye } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore } from '@/lib/modules-store';
import Navbar from '@/components/navbar';

export default function ResultsPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const { modules } = useModulesStore();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const calculatePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/module/${params.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к модулю
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Результаты теста</h1>
          <p className="text-gray-600 mt-2">Модуль: {module.title}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Список прохождений</CardTitle>
          </CardHeader>
          <CardContent>
            {module.results.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Пока нет результатов
                  </h3>
                  <p className="text-gray-500">
                    Результаты появятся здесь, когда студенты начнут проходить тест
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя студента</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Процент</TableHead>
                    <TableHead>Дата прохождения</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {module.results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.studentName}
                      </TableCell>
                      <TableCell>
                        {result.score} / {result.totalQuestions}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          calculatePercentage(result.score, result.totalQuestions) >= 70
                            ? 'text-green-600'
                            : calculatePercentage(result.score, result.totalQuestions) >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {calculatePercentage(result.score, result.totalQuestions)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDate(result.completedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/module/${params.id}/results/${result.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Посмотреть детально
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}