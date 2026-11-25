import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MapLineArt from '@/components/MapLineArt';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import historyImage from '@/assets/history-681.jpg';
import geographyImage from '@/assets/about-mountains.jpg';
import generalImage from '@/assets/history-2026.jpg';
import { useSeo } from "@/seo/useSeo";

const Flashcards: React.FC = () => {
  useSeo('/flashcards');
  const { t } = useLanguage();

  const categories = [
    {
      id: 'history',
      title: t.historyFlashcards,
      description: t.historyFlashcardsDescription,
      image: historyImage,
      link: '/flashcards/history',
    },
    {
      id: 'geography',
      title: t.geographyFlashcards,
      description: t.geographyFlashcardsDescription,
      image: geographyImage,
      link: '/flashcards/geography',
    },
    {
      id: 'general',
      title: t.generalFlashcards,
      description: t.generalFlashcardsDescription,
      image: generalImage,
      link: '/flashcards/general',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="collection-page flex-1 relative z-10">
        <div className="max-w-6xl mx-auto relative">
          <MapLineArt />
          <h1 className="collection-heading text-foreground">
            {t.flashcards}
          </h1>

          {/* Category Cards */}
          <div className="collection-grid collection-grid--three">
            {categories.map((category) => {
              return (
                <div 
                  key={category.id}
                   className="collection-item"
                >
                  {/* Icon Section */}
                  <div className="overflow-hidden">
                    <img src={category.image} alt="" className="collection-image" />
                  </div>

                  {/* Info */}
                  <div className="collection-copy">
                    <h2 className="text-foreground">
                      {category.title}
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {category.description}
                    </p>
                      <Button asChild
                        size="lg" 
                        className="w-full glass-button-primary"
                      >
                        <Link to={category.link}>{t.viewFlashcards}</Link>
                      </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Flashcards;
