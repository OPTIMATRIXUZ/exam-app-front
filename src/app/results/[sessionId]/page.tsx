'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface AttemptResult {
  total_questions: number;
  correct_answers: number;
  score: number;
  answers: Array<{
    question: { id: number; text: string };
    selected: { id: number; text: string }[];
    correct: { id: number; text: string }[];
    is_correct: boolean;
  }>;
}

export default function ResultPage({ params }: { params: { sessionId: string } }) {
  const { data: result, isLoading } = useQuery<AttemptResult>({
    queryKey: ['result', params.sessionId],
    queryFn: () => fetchWithAuth(`/t/${params.sessionId}/result/`, { method: 'GET' }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12">
        <Card className="p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-primary mb-4">Test Results</h1>
          <p className="text-lg mb-6">
            Score: {(Math.round((result?.score ?? 0) * 100))}% ({result?.correct_answers || 0} / {result?.total_questions || 0})
          </p>
          <div className="space-y-6">
            {result?.answers.map((answer, index) => (
              <div key={answer.question.id} className="border p-4 rounded-lg">
                <h2 className="text-lg font-semibold">{index + 1}. {answer.question.text}</h2>
                <p className="mt-2">
                  Your Answer: {answer.selected.map((s) => s.text).join(', ') || 'No answer'}
                  {answer.is_correct ? (
                    <CheckCircle className="w-5 h-5 inline-block text-green-500 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 inline-block text-red-500 ml-2" />
                  )}
                </p>
                {!answer.is_correct && (
                  <p className="mt-2 text-green-700">
                    Correct Answer: {answer.correct.map((c) => c.text).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
          <Button asChild className="mt-8 w-full">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </Card>
      </main>
      <Footer />
    </div>
  );
}