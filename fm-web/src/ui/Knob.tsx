import React, { useRef, useState, useCallback } from 'react';
import classNames from 'classnames';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  unit = '',
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  }, [value, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - e.clientY;
    const range = max - min;
    const sensitivity = range / 150; // 150px = 完整范围
    
    const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
    onChange(Math.round(newValue / step) * step);
  }, [isDragging, min, max, step, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 触摸支持
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValueRef.current = value;
  }, [value, disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaY = startYRef.current - e.touches[0].clientY;
    const range = max - min;
    const sensitivity = range / 150;
    
    const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
    onChange(Math.round(newValue / step) * step);
  }, [isDragging, min, max, step, onChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove as any, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove as any);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // 计算旋钮角度 (-135° 到 +135°)
  const percentage = (value - min) / (max - min);
  const angle = -135 + percentage * 270;

  return (
    <div className={classNames('knob-container', { 'knob-disabled': disabled })}>
      <div className="knob-label">{label}</div>
      <div
        className={classNames('knob', { 'knob-active': isDragging, 'knob-disabled': disabled })}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'ns-resize' }}
      >
        <div className="knob-circle">
          <div 
            className="knob-indicator" 
            style={{ transform: `rotate(${angle}deg)` }}
          />
        </div>
      </div>
      <div className="knob-value">
        {typeof value === 'number' ? value.toFixed(2) : value}{unit}
      </div>
    </div>
  );
};

