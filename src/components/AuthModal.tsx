import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIVACY_POLICY_URL, TERMS_URL } from '@/lib/legal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { isNameAllowed } from '@/lib/moderation';
import { z } from 'zod';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(100);
const displayNameSchema = z.string().trim().min(1).max(50);

type ModalView = 'login' | 'signup' | 'forgot-password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { language } = useLanguage();
  const [view, setView] = useState<ModalView>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const t = {
    login: language === 'bg' ? 'Вход' : 'Login',
    signup: language === 'bg' ? 'Регистрация' : 'Sign Up',
    email: language === 'bg' ? 'Имейл' : 'Email',
    password: language === 'bg' ? 'Парола' : 'Password',
    displayName: language === 'bg' ? 'Име' : 'Display Name',
    noAccount: language === 'bg' ? 'Нямате акаунт?' : "Don't have an account?",
    haveAccount: language === 'bg' ? 'Имате акаунт?' : 'Already have an account?',
    loginSuccess: language === 'bg' ? 'Успешен вход!' : 'Successfully logged in!',
    signupSuccess: language === 'bg' ? 'Успешна регистрация!' : 'Successfully signed up!',
    error: language === 'bg' ? 'Грешка' : 'Error',
    invalidEmail: language === 'bg' ? 'Невалиден имейл' : 'Invalid email',
    invalidPassword: language === 'bg' ? 'Паролата трябва да е поне 6 символа' : 'Password must be at least 6 characters',
    invalidName: language === 'bg' ? 'Моля въведете име' : 'Please enter a name',
    forgotPassword: language === 'bg' ? 'Забравена парола?' : 'Forgot password?',
    resetPassword: language === 'bg' ? 'Възстанови парола' : 'Reset Password',
    resetPasswordDescription: language === 'bg' ? 'Въведете имейла си и ще ви изпратим линк за възстановяване.' : 'Enter your email and we will send you a reset link.',
    sendResetLink: language === 'bg' ? 'Изпрати линк' : 'Send Reset Link',
    resetEmailSent: language === 'bg' ? 'Изпратихме ви имейл с линк за възстановяване!' : 'We sent you an email with a reset link!',
    backToLogin: language === 'bg' ? 'Обратно към вход' : 'Back to login',
    agreeTo: language === 'bg' ? 'Съгласен/на съм с' : 'I agree to the',
    privacyPolicy: language === 'bg' ? 'Политиката за поверителност' : 'Privacy Policy',
    terms: language === 'bg' ? 'Общите условия' : 'Terms & Conditions',
    nameNotAllowed: language === 'bg' ? 'Това име не е подходящо. Избери друго.' : 'This name is not appropriate. Please choose another.',
    mustAgree: language === 'bg' ? 'За да се регистрираш, приеми Политиката за поверителност и Общите условия.' : 'To sign up, please accept the Privacy Policy and the Terms & Conditions.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email for all views
    try {
      emailSchema.parse(email);
    } catch {
      toast.error(t.invalidEmail);
      return;
    }
    
    // For forgot password, only need email
    if (view === 'forgot-password') {
      setLoading(true);
      try {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast.success(t.resetEmailSent);
        setView('login');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t.error;
        toast.error(message);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Validate password for login/signup
    try {
      passwordSchema.parse(password);
    } catch {
      toast.error(t.invalidPassword);
      return;
    }
    
    if (view === 'signup') {
      try {
        displayNameSchema.parse(displayName);
      } catch {
        toast.error(t.invalidName);
        return;
      }
      if (!acceptPrivacy || !acceptTerms) {
        toast.error(t.mustAgree);
        return;
      }
    }
    
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success(t.loginSuccess);
        onClose();
      } else if (view === 'signup') {
        // An inappropriate name is refused here; the server checks it again at sign-up.
        if (!(await isNameAllowed(displayName.trim()))) {
          toast.error(t.nameNotAllowed);
          return;
        }
        const { error } = await signUp(email, password, displayName.trim(), { acceptedAt: new Date().toISOString() });
        if (error) throw error;
        toast.success(t.signupSuccess);
        onClose();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.error;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAcceptPrivacy(false);
    setAcceptTerms(false);
    setView('login');
    onClose();
  };

  const getTitle = () => {
    switch (view) {
      case 'login': return t.login;
      case 'signup': return t.signup;
      case 'forgot-password': return t.resetPassword;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {view === 'forgot-password' && (
              <Button variant="ghost" size="icon"
                type="button"
                onClick={() => setView('login')}
                className="absolute left-4 top-4"
                aria-label={t.backToLogin}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">{getTitle()}</DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {view === 'forgot-password' && (
            <p className="text-sm text-muted-foreground text-center">
              {t.resetPasswordDescription}
            </p>
          )}
          
          {view === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t.displayName}
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="glass-input"
                placeholder="John Doe"
                maxLength={50}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="email@example.com"
              maxLength={255}
            />
          </div>

          {view !== 'forgot-password' && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {t.password}
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
          )}

          {view === 'signup' && (
            <div className="space-y-3">
              {([
                ['accept-privacy', acceptPrivacy, setAcceptPrivacy, t.privacyPolicy, PRIVACY_POLICY_URL],
                ['accept-terms', acceptTerms, setAcceptTerms, t.terms, TERMS_URL],
              ] as const).map(([id, checked, setChecked, label, href]) => (
                <div key={id} className="flex items-start gap-3">
                  <Checkbox id={id} checked={checked} onCheckedChange={(value) => setChecked(value === true)} className="mt-0.5" aria-required="true" />
                  <Label htmlFor={id} className="text-sm font-normal leading-snug text-muted-foreground">
                    {t.agreeTo}{' '}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-blue-500 underline underline-offset-2 hover:text-blue-400"
                    >
                      {label}
                    </a>
                  </Label>
                </div>
              ))}
            </div>
          )}

          {view === 'login' && (
            <div className="text-right">
              <Button variant="ghost"
                type="button"
                onClick={() => setView('forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                {t.forgotPassword}
              </Button>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (view === 'signup' && (!acceptPrivacy || !acceptTerms))}
            className="w-full glass-button-primary"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {view === 'forgot-password' ? t.sendResetLink : (view === 'login' ? t.login : t.signup)}
          </Button>

          {view !== 'forgot-password' && (
            <div className="text-center text-sm text-muted-foreground">
              <span>{view === 'login' ? t.noAccount : t.haveAccount}</span>{' '}
              <Button variant="ghost"
                type="button"
                onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline"
              >
                {view === 'login' ? t.signup : t.login}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
