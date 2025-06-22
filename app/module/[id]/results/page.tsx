'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, Eye, Calendar, User, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { TestAttempt } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ModuleResultsPage() {
  const [results, setResults] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const moduleId = parseInt(params.id as string);

  useEffect(() => {
    fetchResults();
  }, [moduleId]);

  const fetchResults = async () => {
    try {
      const data = await apiClient.getModuleResults(moduleId);
      setResults(data);
    } catch (error) {
      toast.error('Failed to load results');
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/module/${moduleId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Results
          </h1>
          <p className="text-gray-600">
            View all test attempts and their results
          </p>
        </div>

        {results.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No results yet
              </h3>
              <p className="text-gray-600 mb-4">
                Test results will appear here once students start taking tests
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Test Attempts ({results.length})</CardTitle>
              <CardDescription>
                Complete list of all test attempts with scores and details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <span className="font-medium">{result.student.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getScoreColor(result.score / result.answers.length * 100)}`}>
                            {result.score}/{result.answers.length}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScoreBadge(result.score / result.answers.length * 100)}>
                            {result.score}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(new Date(result.started_at), 'MMM d, yyyy HH:mm')} — {format(new Date(result.finished_at), 'MMM d, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/module/${moduleId}/results/${result.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}