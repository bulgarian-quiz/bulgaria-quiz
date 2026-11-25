import React from 'react';
import schoolLogo from '@/assets/school-logo.png';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { isDesktop3DCapable, useExperience } from '@/experience/store';

const Footer: React.FC = () => {
  const { language } = useLanguage();
  const setMode = useExperience((state) => state.setMode);
  const supportsGame = isDesktop3DCapable();

  return (
    <footer className="relative z-30 py-6 px-4 glass-panel border-t-0 rounded-none">
      <div className="flex flex-col justify-center items-center gap-4">
        <img 
          src={schoolLogo} 
          alt="ПМГ Христо Смирненски" 
          className="h-16 w-auto opacity-70 hover:opacity-100 transition-opacity"
        />
        {supportsGame && (
          <Button variant="outline" onClick={() => setMode('game')}>
            <Gamepad2 />
            {language === 'bg' ? 'Влез във видеоигра режим (нестабилен)' : 'Enter video game mode (unstable)'}
          </Button>
        )}
      </div>
    </footer>
  );
};

export default Footer;