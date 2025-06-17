import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Trophy, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import Navbar from '@/components/navbar';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Создавайте и проходите тесты
            <span className="text-blue-600"> легко</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Examinator - современная платформа для создания интерактивных тестов и проверки знаний. 
            Идеально подходит для учителей, студентов и всех, кто хочет проверить свои знания.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Перейти в Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Начать бесплатно
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button size="lg" variant="outline">
                    Войти в аккаунт
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Создание тестов</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Легко создавайте тесты с вопросами множественного выбора и настраивайте их под свои нужды
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Совместное использование</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Делитесь тестами по ссылке и получайте результаты от ваших студентов в реальном времени
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Аналитика результатов</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Просматривайте детальную статистику прохождения тестов и анализируйте результаты
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Быстро и просто</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Интуитивный интерфейс позволяет создать и запустить тест всего за несколько минут
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl text-white text-center py-16 px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Готовы начать создавать тесты?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Зарегистрируйтесь сейчас и создайте свой первый тест за считанные минуты
          </p>
          {!user && (
            <Link to="/auth/register">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Зарегистрироваться бесплатно
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}