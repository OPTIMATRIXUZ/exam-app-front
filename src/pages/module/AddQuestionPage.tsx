import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useModulesStore } from '@/lib/modules-store';
import Navbar from '@/components/navbar';
import { toast } from 'sonner';

export default function AddQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { modules, addQuestion } = useModulesStore();
  const navigate = useNavigate();

  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [questionType, setQuestionType] = useState<'single' | 'multiple'>('single');
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const module = modules.find(m => m.id === id);

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Модуль не найден</h1>
            <Button onClick={() => navigate('/dashboard')}>
              Вернуться к Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 3) {
      toast.error('Минимум 3 варианта ответа');
      return;
    }
    
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    // Update correct answers
    const newCorrectAnswers = correctAnswers
      .filter(answerIndex => answerIndex !== index)
      .map(answerIndex => answerIndex > index ? answerIndex - 1 : answerIndex);
    setCorrectAnswers(newCorrectAnswers);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectAnswerChange = (index: number, checked: boolean) => {
    if (questionType === 'single') {
      setCorrectAnswers(checked ? [index] : []);
    } else {
      if (checked) {
        setCorrectAnswers([...correctAnswers, index]);
      } else {
        setCorrectAnswers(correctAnswers.filter(i => i !== index));
      }
    }
  };

  const handleSubmit = async (saveAndContinue: boolean = false) => {
    if (!questionText.trim()) {
      toast.error('Введите текст вопроса');
      return;
    }

    const filledOptions = options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      toast.error('Минимум 2 варианта ответа');
      return;
    }

    if (correctAnswers.length === 0) {
      toast.error('Выберите хотя бы один правильный ответ');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      addQuestion(id!, {
        text: questionText.trim(),
        type: questionType,
        options: filledOptions,
        correctAnswers: correctAnswers.filter(index => index < filledOptions.length)
      });

      toast.success('Вопрос успешно добавлен!');
      
      if (saveAndContinue) {
        // Reset form
        setQuestionText('');
        setOptions(['', '', '']);
        setCorrectAnswers([]);
        setQuestionType('single');
      } else {
        navigate(`/module/${id}`);
      }
      
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/module/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к модулю
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Добавить вопрос</h1>
          <p className="text-gray-600 mt-2">Модуль: {module.title}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Создание нового вопроса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question">Текст вопроса *</Label>
              <Textarea
                id="question"
                placeholder="Введите ваш вопрос..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Question Type */}
            <div className="space-y-3">
              <Label>Тип вопроса</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={questionType === 'multiple'}
                  onCheckedChange={(checked) => {
                    setQuestionType(checked ? 'multiple' : 'single');
                    setCorrectAnswers([]);
                  }}
                  id="question-type"
                />
                <label htmlFor="question-type" className="text-sm font-medium">
                  {questionType === 'single' ? 'Один правильный ответ' : 'Несколько правильных ответов'}
                </label>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Варианты ответов *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить вариант
                </Button>
              </div>

              <div className="space-y-3">
                {questionType === 'single' ? (
                  <RadioGroup 
                    value={correctAnswers[0]?.toString() || ''}
                    onValueChange={(value) => setCorrectAnswers([parseInt(value)])}
                  >
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Input
                          placeholder={`Вариант ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                        />
                        {options.length > 3 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Checkbox
                          checked={correctAnswers.includes(index)}
                          onCheckedChange={(checked) => 
                            handleCorrectAnswerChange(index, checked as boolean)
                          }
                          id={`option-${index}`}
                        />
                        <Input
                          placeholder={`Вариант ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                        />
                        {options.length > 3 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                variant="outline"
              >
                Сохранить и добавить ещё
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/module/${id}`)}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}