import React, { useMemo } from 'react';
import { useToast } from './Toast';
import { getFestiveMessage, isFestiveSeason, FESTIVE_THEMES } from '../services/encouragementMessages';
import './FestiveBanner.css';

function FestiveBanner() {
  const { showCelebration } = useToast();

  const festiveData = useMemo(() => {
    const message = getFestiveMessage();
    if (!message) return null;

    const themeKey = message.theme;
    const theme = FESTIVE_THEMES[themeKey] || FESTIVE_THEMES.christmas;

    return {
      ...message,
      theme
    };
  }, []);

  if (!festiveData) return null;

  const handleClick = () => {
    showCelebration(festiveData.title, festiveData.message);
  };

  const theme = festiveData.theme;

  return (
    <div
      className="festive-banner"
      style={{
        background: theme.bg,
        '--festive-primary': theme.primary,
        '--festive-secondary': theme.secondary
      }}
      onClick={handleClick}
    >
      <div className="festive-content">
        <span className="festive-emoji">{theme.emoji}</span>
        <span className="festive-title">{festiveData.title}</span>
        <span className="festive-message">{festiveData.message}</span>
      </div>
      <div className="festive-sparkles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

export default FestiveBanner;
