'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AttemptSummary {
  id: number;
  user: string;
  score: number;
  started_at: string;
  finished_at: string | null;
}

interface HeatmapData {
  questions: Array<{
    id: number;
    text: string;
    correct_percentage: number;
  }>;
}

export default function AnalyticsPage({ params }: { params: { moduleId: string } }) {
  const [activeTab, setActiveTab] = useState('attempts');
  const locale = navigator.language || 'en-US'; // Fallback to 'en-US' if navigator.language is unavailable

  const { data: attempts, isLoading: attemptsLoading, error: attemptsError } = useQuery<AttemptSummary[]>({
    queryKey: ['attempts', params.moduleId],
    queryFn: () => fetchWithAuth(`/modules/${params.moduleId}/attempts/`),
  });

  const { data: heatmap, isLoading: heatmapLoading, error: heatmapError } = useQuery<HeatmapData>({
    queryKey: ['heatmap', params.moduleId],
    queryFn: () => fetchWithAuth(`/modules/${params.moduleId}/heatmap/`),
  });

  // Chart.js configuration
  const chartData = {
    labels: heatmap?.questions.map((q) => `Q${q.id}: ${q.text.slice(0, 20)}...`) || [],
    datasets: [
      {
        label: 'Correct Answers (%)',
        data: heatmap?.questions.map((q) => q.correct_percentage) || [],
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Correct Answers (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Questions',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
  };

  if (attemptsLoading || heatmapLoading) return <div className="text-center py-8">Loading data...</div>;
  if (attemptsError || heatmapError) return <div className="text-center py-8 text-red-500">Error loading analytics data</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-primary mb-6">Module Analytics</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex space-x-2 mb-6 border-b border-gray-200">
            <TabsTrigger
              value="attempts"
              className="px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Attempts
            </TabsTrigger>
            <TabsTrigger
              value="heatmap"
              className="px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Questions Heatmap
            </TabsTrigger>
          </TabsList>
          <TabsContent value="attempts">
            <Card className="p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Attempts</h2>
              <ul className="space-y-4">
                {attempts?.map((attempt) => (
                  <li key={attempt.id} className="border p-4 rounded-lg">
                    <p>Username: {attempt.user}</p>
                    <p>Score: {Math.round(attempt.score * 100)}%</p>
                    <p>
                      Started:{' '}
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                        new Date(attempt.started_at)
                      )}
                    </p>
                    <p>
                      Finished:{' '}
                      {attempt.finished_at
                        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                            new Date(attempt.finished_at)
                          )
                        : 'Ongoing'}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
          <TabsContent value="heatmap">
            <Card className="p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Questions Heatmap</h2>
              {heatmap?.questions.length ? (
                <div className="h-96">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-gray-500">No data available for heatmap</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}