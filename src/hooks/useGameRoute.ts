import { useLocation } from 'react-router-dom';

export const useGameRoute = () => {
  const location = useLocation();
  
  const gameRoutes = ['/game', '/drag-drop-game', '/photo-quiz'];
  const isInGame = gameRoutes.includes(location.pathname);
  
  return { isInGame };
};
