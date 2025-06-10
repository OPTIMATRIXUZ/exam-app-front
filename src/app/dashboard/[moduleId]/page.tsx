'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { LinkIcon, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// TypeScript interfaces
interface Module {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
}

interface Question {
  id: number;
  text: string;
  type: 'single' | 'multiple';
  options: Array<{ id: number; text: string; is_correct: boolean }>;
}

// Zod schema
const questionSchema = z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['single', 'multiple']),
    answers: z
      .array(
        z.object({
          text: z.string().min(1, 'Answer text is required'),
          is_correct: z.boolean(),
        })
      )
      .min(2, 'At least two answers are required')
      .superRefine((answers, ctx) => {
        // Access the 'type' field explicitly passed to the refinement function
        const type = ctx.path.includes('type') ? ctx.path[ctx.path.indexOf('type') + 1] : undefined;
  
        // At least one correct answer
        if (!answers.some((answer) => answer.is_correct)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'At least one answer must be correct',
            path: ['answers'],
          });
        }
        // For single choice, exactly one correct answer
        if (type === 'single' && answers.filter((answer) => answer.is_correct).length !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Exactly one correct answer is required for single choice',
            path: ['answers'],
          });
        }
      }),
  });

type QuestionFormData = z.infer<typeof questionSchema>;

export default function ModuleBuilder({ params }: { params: { moduleId: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Fetch module and questions
  const { data: module, isLoading: moduleLoading } = useQuery<Module>({
    queryKey: ['module', params.moduleId],
    queryFn: () => fetchWithAuth(`/modules/${params.moduleId}/`),
  });
  const { data: questions, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: ['questions', params.moduleId],
    queryFn: () => fetchWithAuth(`/modules/${params.moduleId}/questions/`),
  });

  // Form setup
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: '',
      type: 'single',
      answers: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    },
  });

  // Mutations
  const createQuestion = useMutation({
    mutationFn: (data: QuestionFormData) =>
      fetchWithAuth(`/modules/${params.moduleId}/questions/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      refetchQuestions();
      form.reset();
    },
    onError: () => {
      form.setError('root', { message: 'Failed to create question' });
    },
  });

  const activateModule = useMutation({
    mutationFn: () => fetchWithAuth(`/modules/${params.moduleId}/activate/`, { method: 'POST' }),
    onSuccess: (data) => {
      setShareUrl(data.share_url);
      queryClient.invalidateQueries({ queryKey: ['module', params.moduleId] });
    },
  });

  const deactivateModule = useMutation({
    mutationFn: () => fetchWithAuth(`/modules/${params.moduleId}/deactivate/`, { method: 'POST' }),
    onSuccess: () => {
      setShareUrl(null);
      queryClient.invalidateQueries({ queryKey: ['module', params.moduleId] });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: number) => fetchWithAuth(`/questions/${questionId}/`, { method: 'DELETE' }),
    onSuccess: () => refetchQuestions(),
  });

  // Drag-n-drop handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !questions) return;
    const reorderedQuestions = Array.from(questions);
    const [moved] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, moved);
    queryClient.setQueryData(['questions', params.moduleId], reorderedQuestions);
    // TODO: Update order_idx via API if needed
  };

  const onSubmit = (data: QuestionFormData) => {
    createQuestion.mutate(data);
  };

  if (moduleLoading || questionsLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-primary mb-6">{module?.title}</h1>
        <div className="flex justify-between mb-6">
          <Button
            onClick={() => (module?.is_active ? deactivateModule.mutate() : activateModule.mutate())}
            disabled={!questions?.length}
          >
            {module?.is_active ? 'Deactivate Module' : 'Activate Module'}
          </Button>
          {shareUrl && (
            <Button variant="outline" asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <LinkIcon className="w-4 h-4 mr-2" /> Share
              </a>
            </Button>
          )}
        </div>
        <Card className="p-6 rounded-2xl shadow-xl mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter question" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="single" />
                          </FormControl>
                          <FormLabel>Single Choice</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="multiple" />
                          </FormControl>
                          <FormLabel>Multiple Choice</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <h3 className="text-lg font-semibold mb-2">Answers</h3>
                {form.watch('answers').map((answer: { text: string; is_correct: boolean }, index: number) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <FormField
                      control={form.control}
                      name={`answers.${index}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder={`Answer ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`answers.${index}.is_correct`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const answers = form.getValues('answers').filter((_, i: number) => i !== index);
                        form.setValue('answers', answers);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const answers = [...form.getValues('answers'), { text: '', is_correct: false }];
                    form.setValue('answers', answers);
                  }}
                  className="mt-2"
                >
                  Add Answer
                </Button>
              </div>
              {form.formState.errors.root && (
                <p className="text-red-500">{form.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full">
                Save Question
              </Button>
            </form>
          </Form>
        </Card>
        <h2 className="text-xl font-semibold mb-4">Questions List</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided: any) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {questions?.map((question: Question, index: number) => (
                  <Draggable key={question.id} draggableId={question.id.toString()} index={index}>
                    {(provided: any) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Card className="p-4 flex justify-between items-center rounded-2xl shadow-xl">
                          <span>{question.text}</span>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteQuestion.mutate(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Card>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </main>
      <Footer />
    </div>
  );
}