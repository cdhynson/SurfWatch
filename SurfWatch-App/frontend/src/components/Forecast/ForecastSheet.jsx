import React, { useRef, useState, useEffect, useCallback } from "react";
import "./Forecast.css";

function BottomSheet({ children }) {
  const sheetRef = useRef(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const [translateY, setTranslateY] = useState(0);

  const maxTranslateY = 75;
  const minTranslateY = 0;

  const updateSheetPosition = useCallback(
    (percent) => {
      const clamped = Math.min(Math.max(minTranslateY, percent), maxTranslateY);
      setTranslateY(clamped);
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${clamped}%)`;
      }
    },
    [maxTranslateY, minTranslateY]
  );

  const handleStart = useCallback((y) => {
    dragging.current = true;
    startY.current = y;
  }, []);

  const handleMove = useCallback(
    (y) => {
      if (!dragging.current) return;
      const deltaY = y - startY.current;
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      updateSheetPosition(translateY + deltaPercent);
      startY.current = y;
    },
    [dragging, translateY, updateSheetPosition]
  );

  const handleEnd = useCallback(() => {
    dragging.current = false;
    const snapTo = translateY < 50 ? minTranslateY : maxTranslateY;
    setTranslateY(snapTo);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${snapTo}%)`;
    }
  }, [translateY, maxTranslateY, minTranslateY]);

  // Touch Events
  const onTouchStart = (e) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e) => handleMove(e.touches[0].clientY);
  const onTouchEnd = handleEnd;

  // Mouse Events
  const onMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientY);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => handleMove(e.clientY);

  const onMouseUp = () => {
    handleEnd();
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    updateSheetPosition(translateY);
    // eslint-disable-next-line
  }, []);

  return (
    <div
      ref={sheetRef}
      className="bottom-sheet"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="sheet-handle" onMouseDown={onMouseDown} />
      <div className="sheet-content">{children}</div>
    </div>
  );
}

export default BottomSheet;
