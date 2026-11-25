import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeo } from '@/seo/useSeo';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePoints } from '@/contexts/PointsContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { historyCards, geographyCards, generalFactsCards, Flashcard } from '@/data/flashcards';
import { cn } from '@/lib/utils';

const FlashcardView: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  useSeo(`/flashcards/${category ?? ''}`);
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { awardFlashcardViewed } = usePoints();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const viewedCardsRef = useRef<Set<string>>(new Set());

  const getCards = (): Flashcard[] => {
    switch (category) {
      case 'history':
        return historyCards;
      case 'geography':
        return geographyCards;
      case 'general':
        return generalFactsCards;
      default:
        return [];
    }
  };

  const cards = getCards();
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [category]);

  // Track viewed cards by category and index
  const cardKey = `${category}-${currentIndex}`;

  // Award points when viewing a new flashcard
  useEffect(() => {
    if (currentCard && !viewedCardsRef.current.has(cardKey)) {
      viewedCardsRef.current.add(cardKey);
      awardFlashcardViewed();
    }
  }, [cardKey, currentCard, awardFlashcardViewed]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(index => Math.min(index + 1, cards.length - 1));
    } else {
      navigate('/flashcards');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(index => Math.max(0, index - 1));
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="pt-24 pb-12 px-4 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Category not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const getCategoryTitle = () => {
    switch (category) {
      case 'history':
        return t.historyFlashcards;
      case 'geography':
        return t.geographyFlashcards;
      case 'general':
        return t.generalFlashcards;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      
      <main className="pt-24 pb-12 px-4 flex-1 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flashcard-header mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/flashcards')}
              className="glass-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              {getCategoryTitle()}
            </h1>
            <div className="glass-tag px-4 py-2 rounded-full">
              {currentIndex + 1} / {cards.length}
            </div>
          </div>

          {/* Flashcard */}
          <div
            className="cursor-pointer mb-8"
            role="button"
            tabIndex={0}
            aria-label={currentCard.title[language]}
            aria-pressed={isFlipped}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleFlip(); }
            }}
            onClick={handleFlip}
            style={{ perspective: '1200px' }}
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 480ms var(--ease-in-out)',
                position: 'relative',
                minHeight: '400px',
              }}
            >
              {/* Front */}
              <div
                className="glass-card flashcard-face"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <p className="text-sm text-muted-foreground mb-4">{t.clickToFlip}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
                  {currentCard.title[language]}
                </h2>
              </div>

              {/* Back */}
              <div
                className="glass-card flashcard-face"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflowY: 'auto',
                }}
              >
                <p className="text-sm text-muted-foreground mb-4">{t.clickToFlip}</p>
                <p className="text-base md:text-lg text-foreground text-center leading-relaxed max-w-prose">
                  {currentCard.content[language]}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="glass-button"
              size="lg"
              aria-label={language === 'bg' ? 'Предишна' : 'Previous'}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleReset}
              className="glass-button"
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {t.reset}
            </Button>
            
            <Button
              onClick={handleNext}
              className="glass-button"
              size="lg"
              aria-label={currentIndex === cards.length - 1 ? (language === 'bg' ? 'Завърши' : 'Finish') : (language === 'bg' ? 'Следваща' : 'Next')}
            >
              {currentIndex === cards.length - 1 ? (
                <><Check className="w-5 h-5 mr-2" />{language === 'bg' ? 'Завърши' : 'Finish'}</>
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FlashcardView;
