import React, { useState, useEffect, useMemo } from 'react';
import './Countdown.css';

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const isVisible = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const hour = now.getHours();
    return month === 11 && day === 31 && hour >= 23;
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const newYear = new Date(currentYear + 1, 0, 1, 0, 0, 0);
      const diff = newYear - now;

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  return (
    <div className="countdown-container">
      <div className="countdown-content">
        <span className="countdown-title">New Year Countdown</span>
        <div className="countdown-timer">
          <div className="countdown-block">
            <span className="countdown-value">{formatTime(timeLeft.hours)}</span>
            <span className="countdown-label">Hours</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-block">
            <span className="countdown-value">{formatTime(timeLeft.minutes)}</span>
            <span className="countdown-label">Minutes</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-block">
            <span className="countdown-value">{formatTime(timeLeft.seconds)}</span>
            <span className="countdown-label">Seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Countdown;
