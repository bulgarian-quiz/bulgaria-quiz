import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { language } = useLanguage();

  const t = {
    title: language === 'bg' ? 'Излизане от профила' : 'Log Out',
    description: language === 'bg' 
      ? 'Сигурни ли сте, че искате да излезете от профила си?' 
      : 'Are you sure you want to log out?',
    cancel: language === 'bg' ? 'Отказ' : 'Cancel',
    confirm: language === 'bg' ? 'Излез' : 'Log Out',
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="glass-card border-white/20">
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>{t.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="glass-button">{t.cancel}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="glass-button-primary bg-destructive/80 hover:bg-destructive"
          >
            {t.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutConfirmDialog;
