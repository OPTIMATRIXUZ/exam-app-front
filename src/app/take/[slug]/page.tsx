'use client';
import { useEffect, useState } from 'react';
import { useTestSession } from '@/lib/stores/testSession';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { shuffle } from '@/utils/shuffle'; // Утилита для рандомизации

export default function TestRunner({ params }: { params: { slug: string } }) {
  const { sessionId, currentQuestion, startTest, nextQuestion, submitAnswer } = useTestSession();
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) startTest(params.slug);
  }, [sessionId, params.slug, startTest]);

  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswers([]);
      setShuffledOptions(shuffle([...currentQuestion.options]));
    }
  }, [currentQuestion]);

  const handleAnswer = async () => {
    if (!currentQuestion || !selectedAnswers.length) return;
    await submitAnswer(params.slug, currentQuestion.id, selectedAnswers);
    await nextQuestion(params.slug);
    if (!currentQuestion) router.push(`/result/${sessionId}`);
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-2xl p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">{currentQuestion.text}</h2>
        {currentQuestion.type === 'single' ? (
          <RadioGroup
            onValueChange={(value) => setSelectedAnswers([parseInt(value)])}
            className="space-y-2"
          >
            {shuffledOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id.toString()} id={option.id.toString()} />
                <label htmlFor={option.id.toString()} className="text-sm">
                  {option.text}
                </label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-2">
            {shuffledOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  onCheckedChange={(checked) => {
                    setSelectedAnswers((prev) =>
                      checked
                        ? [...prev, option.id]
                        : prev.filter((id) => id !== option.id)
                    );
                  }}
                />
                <label htmlFor={option.id}>
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )}
        <Button
          onClick={handleAnswer}
          disabled={!selectedAnswers.length}
          className="mt-6 w-full"
        >
          Submit Answer
        </Button>
      </Card>
    </div>
  );
}