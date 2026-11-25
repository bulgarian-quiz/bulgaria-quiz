import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MapLineArt from '@/components/MapLineArt';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import quizArtwork from '@/assets/game-quiz-belogradchik.jpg';
import cartographyArtwork from '@/assets/game-cartography-coast.jpg';
import photoArtwork from '@/assets/history-2026.jpg';
import { useSeo } from "@/seo/useSeo";

const Games: React.FC = () => {
  useSeo('/games');
  const { t } = useLanguage();

  const games = [
    {
      id: 'quiz',
      title: t.bulgariaQuiz,
      description: t.gameDescription,
      image: quizArtwork,
      link: '/game',
    },
    {
      id: 'dragdrop',
      title: t.dragDropGame,
      description: t.dragDropDescription,
      image: cartographyArtwork,
      link: '/drag-drop-game',
    },
    {
      id: 'photo',
      title: t.photoQuiz,
      description: t.photoQuizDescription,
      image: photoArtwork,
      link: '/photo-quiz',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="collection-page flex-1 relative z-10">
        <div className="max-w-6xl mx-auto relative">
          <MapLineArt />
          <h1 className="collection-heading text-foreground">
            {t.games}
          </h1>

          {/* Game Cards */}
          <div className="collection-grid collection-grid--three">
            {games.map((game) => (
              <div 
                key={game.id}
                className="collection-item"
              >
                {/* Game Image */}
                <div className="overflow-hidden">
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="collection-image collection-image--artwork"
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                </div>

                {/* Game Info */}
                <div className="collection-copy">
                  <h2 className="text-foreground">
                    {game.title}
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {game.description}
                  </p>
                    <Button asChild
                      size="lg" 
                      className="w-full glass-button-primary"
                    >
                      <Link to={game.link}>{t.startGame}</Link>
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Games;