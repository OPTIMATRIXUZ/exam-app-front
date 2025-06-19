'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useModulesStore } from '@/lib/modules-store';
import { toast } from 'sonner';

interface CreateModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateModuleDialog({ open, onOpenChange }: CreateModuleDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { addModule, isLoading } = useModulesStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Название модуля обязательно');
      return;
    }

    const success = await addModule({
      title: title.trim(),
      description: description.trim(),
      isActive: false,
    });
    
    if (success) {
      toast.success('Модуль успешно создан!');
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } else {
      toast.error('Ошибка при создании модуля');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Создать новый модуль</DialogTitle>
            <DialogDescription>
              Создайте модуль для группировки ваших тестов по теме
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название модуля *</Label>
              <Input
                id="title"
                placeholder="Например: Математика 10 класс"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Описание (необязательно)</Label>
              <Textarea
                id="description"
                placeholder="Краткое описание модуля..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Создать модуль'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}