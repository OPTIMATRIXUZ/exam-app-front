'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { Question } from '@/types';
import { toast } from 'sonner';

interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export default function EditQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<boolean>(false);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const moduleId = parseInt(params.id as string);
  const questionId = parseInt(params.questionId as string);

  useEffect(() => {
    fetchQuestion();
  }, [moduleId, questionId]);

  const fetchQuestion = async () => {
    try {
      const questionData = await apiClient.getQuestion(moduleId, questionId);
      setQuestion(questionData);
      setQuestionText(questionData.text);
      setQuestionType(questionData.is_multiple_choice);
      setOptions(questionData.options.map(option => ({
        id: option.id.toString(),
        text: option.text,
        is_correct: option.is_correct,
      })));
    } catch (error) {
      toast.error('Failed to load question');
      router.push(`/module/${moduleId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    const newOption: QuestionOption = {
      id: Date.now().toString(),
      text: '',
      is_correct: false,
    };
    setOptions([...options, newOption]);
  };

  const removeOption = (optionId: string) => {
    if (options.length <= 3) {
      toast.error('Minimum 3 options required');
      return;
    }
    setOptions(options.filter(option => option.id !== optionId));
  };

  const updateOptionText = (optionId: string, text: string) => {
    setOptions(options.map(option => 
      option.id === optionId ? { ...option, text } : option
    ));
  };

  const toggleOptionCorrect = (optionId: string) => {
    if (questionType) {
      // For single choice, only one option can be correct
      setOptions(options.map(option => ({
        ...option,
        is_correct: option.id === optionId
      })));
    } else {
      // For multiple choice, toggle the selected option
      setOptions(options.map(option => 
        option.id === optionId 
          ? { ...option, is_correct: !option.is_correct }
          : option
      ));
    }
  };

  const validateForm = () => {
    if (!questionText.trim()) {
      toast.error('Question text is required');
      return false;
    }

    const filledOptions = options.filter(option => option.text.trim());
    if (filledOptions.length < 3) {
      toast.error('At least 3 options are required');
      return false;
    }

    const correctOptions = options.filter(option => option.is_correct);
    if (correctOptions.length === 0) {
      toast.error('At least one correct option is required');
      return false;
    }

    if (questionType && correctOptions.length > 1) {
      toast.error('Only one correct option allowed for single choice questions');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const questionData = {
        text: questionText,
        is_multiple_choice: questionType,
        options: options
          .filter(option => option.text.trim())
          .map(option => ({
            text: option.text.trim(),
            is_correct: option.is_correct,
          })),
      };

      await apiClient.updateQuestion(moduleId, questionId, questionData);
      toast.success('Question updated successfully!');
      router.push(`/module/${moduleId}`);
    } catch (error) {
      toast.error('Failed to update question');
    } finally {
      setIsSaving(false);
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
          <Button
            variant="ghost"
            onClick={() => router.push(`/module/${moduleId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Question
          </h1>
          <p className="text-gray-600">
            Update the question details and options
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
            <CardDescription>
              Update the question details and options below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text</Label>
              <Textarea
                id="questionText"
                placeholder="Enter your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={questionType ? 'multiple_choice' : 'multiple_select'}
                onValueChange={(value: 'multiple_choice' | 'multiple_select') => {
                  setQuestionType(value === 'multiple_choice');
                  // Reset correct answers when changing type
                  setOptions(options.map(option => ({ ...option, is_correct: false })));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Single Choice (Radio)</SelectItem>
                  <SelectItem value="multiple_select">Multiple Choice (Checkbox)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Answer Options</Label>
                <Button onClick={addOption} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {questionType ? (
                        <RadioGroup
                          value={options.find(opt => opt.is_correct)?.id || ''}
                          onValueChange={(value) => toggleOptionCorrect(value)}
                        >
                          <RadioGroupItem value={option.id} />
                        </RadioGroup>
                      ) : (
                        <Checkbox
                          checked={option.is_correct}
                          onCheckedChange={() => toggleOptionCorrect(option.id)}
                        />
                      )}
                      <span className="text-sm font-medium">
                        {String.fromCharCode(65 + index)}.
                      </span>
                    </div>
                    
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateOptionText(option.id, e.target.value)}
                      className="flex-1"
                    />
                    
                    {options.length > 3 && (
                      <Button
                        onClick={() => removeOption(option.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600">
                {questionType
                  ? 'Select one correct answer'
                  : 'Select one or more correct answers'
                }
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button
                variant="outline"
                onClick={() => router.push(`/module/${moduleId}`)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}