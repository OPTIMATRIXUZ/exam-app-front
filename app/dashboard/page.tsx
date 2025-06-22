'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Settings, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api';
import { Module } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [modules, setModules]     = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 2) don’t run any auth logic until we know we’re hydrated
    if (!hydrated) return;

    // 3) once hydrated, if NOT logged in → redirect
    if (!isAuthenticated) {
      toast.error('You must be logged in to access the dashboard');
      router.push('/auth/login');
      return;
    }

    // 4) if we ARE authenticated, fetch user and modules
    loadUser();
    fetchModules();
  }, [hydrated, isAuthenticated, router, loadUser]);

  const fetchModules = async () => {
    try {
      const data = await apiClient.getModules();
      setModules(data);
    } catch (err) {
      toast.error('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      toast.error('Module name is required');
      return;
    }

    setIsCreating(true);
    try {
      const newModule = await apiClient.createModule(newModuleName, newModuleDescription);
      setModules([...modules, newModule]);
      setNewModuleName('');
      setNewModuleDescription('');
      setShowCreateDialog(false);
      toast.success('Module created successfully!');
    } catch (error) {
      toast.error('Failed to create module');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTest = (module: Module) => {
    if (module.is_active && module.slug) {
      router.push(`/start-test/${module.slug}`);
    } else {
      toast.error('Module is not active');
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user.full_name}!
          </h1>
          <p className="text-gray-600">
            Manage your modules and track test results
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Modules</h2>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>
                  Create a new test module to organize your questions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="moduleName">Module Name</Label>
                  <Input
                    id="moduleName"
                    placeholder="Enter module name"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moduleDescription">Description (Optional)</Label>
                  <Textarea
                    id="moduleDescription"
                    placeholder="Enter module description"
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateModule} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Module'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {modules.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No modules yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first module to start building tests
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      {module.description && (
                        <CardDescription className="mt-1">
                          {module.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={module.is_active ? 'default' : 'secondary'}>
                      {module.is_active ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {module.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="mr-2 h-4 w-4" />
                      Created {format(new Date(module.created_at), 'MMM d, yyyy')}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Questions: {module.questions_count || 0}
                    </div>
                    
                    <div className="flex space-x-2">
                      {module.is_active && (
                        <Button
                          size="sm"
                          onClick={() => handleStartTest(module)}
                          className="flex-1"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Test
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/module/${module.id}`)}
                        className={module.is_active ? '' : 'flex-1'}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}