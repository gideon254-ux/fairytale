import React, { useState, useEffect, useMemo } from 'react';
import './ProjectCountdown.css';

function ProjectCountdown({ dueDate, size = 'normal' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOverdue: false,
    isCompleted: false
  });

  const isVisible = useMemo(() => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    return diff > 0 || diff > -86400000;
  }, [dueDate]);

  useEffect(() => {
    if (!isVisible || !dueDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const due = new Date(dueDate);
      const diff = due - now;

      if (diff <= 0) {
        const overdueDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
        return {
          days: overdueDays,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOverdue: true,
          isCompleted: false
        };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, isOverdue: false, isCompleted: false };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [dueDate, isVisible]);

  if (!isVisible) return null;

  const { days, hours, minutes, seconds, isOverdue } = timeLeft;

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  const getUrgencyClass = () => {
    if (isOverdue) return 'overdue';
    if (days <= 1) return 'urgent';
    if (days <= 3) return 'warning';
    return 'normal';
  };

  return (
    <div className={`project-countdown ${size} ${getUrgencyClass()}`}>
      <div className="countdown-blocks">
        {days > 0 && (
          <div className="countdown-block">
            <span className="countdown-value">{formatTime(days)}</span>
            <span className="countdown-label">Days</span>
          </div>
        )}
        <div className="countdown-block">
          <span className="countdown-value">{formatTime(hours)}</span>
          <span className="countdown-label">Hrs</span>
        </div>
        <div className="countdown-block separator">:</div>
        <div className="countdown-block">
          <span className="countdown-value">{formatTime(minutes)}</span>
          <span className="countdown-label">Min</span>
        </div>
        <div className="countdown-block separator">:</div>
        <div className="countdown-block">
          <span className="countdown-value">{formatTime(seconds)}</span>
          <span className="countdown-label">Sec</span>
        </div>
      </div>
      {isOverdue && (
        <div className="overdue-badge">Overdue</div>
      )}
    </div>
  );
}

export default ProjectCountdown;
