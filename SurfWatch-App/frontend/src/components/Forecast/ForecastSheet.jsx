import React, { useRef, useState, useEffect } from "react";
import "./Forecast.css";

function BottomSheet({ children }) {
  const sheetRef = useRef(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const [translateY, setTranslateY] = useState(70); // 80% = mostly closed

  const maxTranslateY = 70; // open
  const minTranslateY = 0;  // closed

  const updateSheetPosition = (percent) => {
    const clamped = Math.min(Math.max(minTranslateY, percent), maxTranslateY);
    setTranslateY(clamped);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${clamped}%)`;
    }
  };

  const handleStart = (y) => {
    dragging.current = true;
    startY.current = y;
  };

  const handleMove = (y) => {
    if (!dragging.current) return;
    const deltaY = y - startY.current;
    const screenHeight = window.innerHeight;
    const deltaPercent = (deltaY / screenHeight) * 100;
    updateSheetPosition(translateY + deltaPercent);
    startY.current = y;
  };

  const handleEnd = () => {
    dragging.current = false;

    // Decide based on final position whether to open or close
    if (translateY < 20) {
      // Less than halfway => snap open
      setTranslateY(minTranslateY);
      sheetRef.current.style.transform = `translateY(${minTranslateY}%)`;
    } else {
      // Otherwise snap closed
      setTranslateY(maxTranslateY);
      sheetRef.current.style.transform = `translateY(${maxTranslateY}%)`;
    }
  };


  // Touch Events
  const onTouchStart = (e) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e) => handleMove(e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

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
