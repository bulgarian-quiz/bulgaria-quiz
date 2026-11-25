import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RegionData, Question } from '@/data/questions';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizPopupProps {
  region: RegionData;
  onClose: () => void;
  onComplete: (score: number, total: number) => void;
  isClosing: boolean;
  /** Move on by itself shortly after each answer is revealed, and finish after the last one. */
  autoAdvance?: boolean;
}

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate shuffled questions with shuffled options
const generateShuffledQuestions = (questions: Question[]): { question: Question; shuffledOptions: { bg: string[]; en: string[] }; correctIndex: number }[] => {
  const shuffledQuestions = shuffleArray(questions);
  
  return shuffledQuestions.map(q => {
    // Create indexed options
    const indexedOptions = q.options.bg.map((_, i) => i);
    const shuffledIndices = shuffleArray(indexedOptions);
    
    // Find new correct index
    const newCorrectIndex = shuffledIndices.indexOf(q.correctIndex);
    
    // Create shuffled options
    const shuffledBg = shuffledIndices.map(i => q.options.bg[i]);
    const shuffledEn = shuffledIndices.map(i => q.options.en[i]);
    
    return {
      question: q,
      shuffledOptions: { bg: shuffledBg, en: shuffledEn },
      correctIndex: newCorrectIndex,
    };
  });
};

const AUTO_ADVANCE_MS = 1700;

const QuizPopup: React.FC<QuizPopupProps> = ({ region, onClose, onComplete, isClosing, autoAdvance = false }) => {
  const { language, t } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);

  // Generate shuffled questions once when component mounts
  const shuffledQuestions = useMemo(() => 
    generateShuffledQuestions(region.questions), 
    [region.questions]
  );

  const currentQuestionData = shuffledQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === shuffledQuestions.length - 1;
  const isCorrect = selectedAnswer === currentQuestionData.correctIndex;

  const reveal = (answer: number) => {
    setIsAnswerRevealed(true);
    if (answer === currentQuestionData.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    reveal(selectedAnswer);
  };

  const completedRef = useRef(false);
  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete(score, shuffledQuestions.length);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    }
  };

  // Auto mode: after the result has been shown for a moment, go on (or finish) without a click.
  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = isLastQuestion ? handleFinish : handleNext;
  useEffect(() => {
    if (!autoAdvance || !isAnswerRevealed || isClosing) return;
    const timer = window.setTimeout(() => advanceRef.current(), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [autoAdvance, isAnswerRevealed, isClosing, currentQuestion]);

  const handleSelectAnswer = (index: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(index);
  };

  const answerLabels = ['а)', 'б)', 'в)'];
  const questionText = currentQuestionData.question.question[language];
  const options = currentQuestionData.shuffledOptions[language];
  const regionName = region.name[language];

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center',
      'game-quiz-backdrop transition-opacity duration-300',
      isClosing ? 'opacity-0 pointer-events-none' : 'animate-fade-in'
    )}>
      <div
        className={cn(
          'relative w-full max-w-2xl quiz-popup-card overflow-hidden',
          isClosing ? '' : 'animate-scale-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="game-display text-2xl text-foreground">{regionName}</h2>
          <div className="flex items-center gap-4">
            <span className="quiz-popup-tag text-sm text-foreground">
              {currentQuestion + 1}/{shuffledQuestions.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { onClose(); }}
              className="quiz-popup-button"
              aria-label={language === 'bg' ? 'Затвори' : 'Close'}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Question: keyed, so each new question arrives instead of swapping in place */}
        <div className={cn('p-6', currentQuestion > 0 && 'quiz-step-in')} key={currentQuestion}>
          <p className="text-lg font-medium text-foreground mb-6">{questionText}</p>

          {/* Answer Options */}
          <div className="space-y-3">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === currentQuestionData.correctIndex;
              
              let optionClass = 'quiz-answer-option';
              if (isAnswerRevealed) {
                if (isCorrectAnswer) {
                  optionClass += ' revealed-correct';
                } else if (isSelected && !isCorrectAnswer) {
                  optionClass += ' incorrect';
                }
              } else if (isSelected) {
                optionClass += ' selected';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isAnswerRevealed}
                  className={optionClass}
                  style={{ '--i': index } as React.CSSProperties}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground">{answerLabels[index]}</span>
                    <span className="text-foreground">{option}</span>
                    {isAnswerRevealed && isCorrectAnswer && (
                      <Check className="icon-pop w-5 h-5 text-success ml-auto" />
                    )}
                    {isAnswerRevealed && isSelected && !isCorrectAnswer && (
                      <XCircle className="icon-pop w-5 h-5 text-destructive ml-auto" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Result Feedback */}
          {isAnswerRevealed && (
            <div className={cn(
              'mt-6 p-4 rounded-2xl text-center font-semibold feedback-in',
              isCorrect 
                ? 'bg-success/20 text-success border border-success/30' 
                : 'bg-destructive/20 text-destructive border border-destructive/30'
            )}>
              {isCorrect ? t.correctAnswer : t.wrongAnswer}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-white/10">
          {!isAnswerRevealed ? (
            <Button
              onClick={handleConfirm}
              disabled={selectedAnswer === null}
              className="px-6 glass-button-primary"
            >
              {t.confirm}
            </Button>
          ) : (
            <Button
              onClick={isLastQuestion ? handleFinish : handleNext}
              className="px-6 glass-button-primary"
            >
              {isLastQuestion ? t.finish : t.nextQuestion}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPopup;
