import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { LogOut, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

const LogoutConfirmModal = ({ open, onOpenChange, onConfirm }) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          <DialogTitle className="text-xl font-bold text-white">
            {t('confirmLogoutTitle') || (t('lang') === 'fr' ? 'Déconnexion' : 'Log out')}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t('confirmLogoutDesc')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-none order-2 sm:order-1"
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold border-none order-1 sm:order-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('signOut')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutConfirmModal;
