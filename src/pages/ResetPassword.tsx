import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSeo } from "@/seo/useSeo";

const passwordSchema = z.string().min(6).max(100);

const ResetPassword: React.FC = () => {
  useSeo('/reset-password');
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { language } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const t = {
    resetPassword: language === 'bg' ? 'Нова парола' : 'New Password',
    newPassword: language === 'bg' ? 'Нова парола' : 'New Password',
    confirmPassword: language === 'bg' ? 'Потвърди парола' : 'Confirm Password',
    updatePassword: language === 'bg' ? 'Обнови паролата' : 'Update Password',
    passwordUpdated: language === 'bg' ? 'Паролата е обновена успешно!' : 'Password updated successfully!',
    passwordMismatch: language === 'bg' ? 'Паролите не съвпадат' : 'Passwords do not match',
    invalidPassword: language === 'bg' ? 'Паролата трябва да е поне 6 символа' : 'Password must be at least 6 characters',
    invalidLink: language === 'bg' ? 'Невалиден или изтекъл линк' : 'Invalid or expired link',
    goToLogin: language === 'bg' ? 'Към вход' : 'Go to Login',
    successMessage: language === 'bg' ? 'Можете да влезете с новата си парола.' : 'You can now log in with your new password.',
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hasRecoveryLink = params.has('code') || hash.get('type') === 'recovery';
      setIsValidSession(Boolean(session && hasRecoveryLink));
      setCheckingSession(false);
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(password);
    } catch {
      toast.error(t.invalidPassword);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t.passwordMismatch);
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setSuccess(true);
      toast.success(t.passwordUpdated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-8">
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">{t.passwordUpdated}</h2>
                <p className="text-muted-foreground">{t.successMessage}</p>
                <Button
                  onClick={() => navigate('/')}
                  className="glass-button-primary"
                >
                  {t.goToLogin}
                </Button>
              </div>
            ) : !isValidSession ? (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">{t.invalidLink}</h2>
                <Button
                  onClick={() => navigate('/')}
                  className="glass-button-primary"
                >
                  {t.goToLogin}
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground text-center mb-6">
                  {t.resetPassword}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {t.newPassword}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input"
                      placeholder="••••••••"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {t.confirmPassword}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input"
                      placeholder="••••••••"
                      maxLength={100}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full glass-button-primary"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.updatePassword}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResetPassword;
