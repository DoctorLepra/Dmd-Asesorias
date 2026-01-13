import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    let i = 0;
    const typeNextCharacter = () => {
      if (i <= text.length) {
        setDisplayedText(text.substring(0, i));
        i++;
        timeoutRef.current = window.setTimeout(typeNextCharacter, speed);
      }
    };

    timeoutRef.current = window.setTimeout(typeNextCharacter, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]);

  const isTyping = displayedText.length < text.length;

  return (
    <>
      {displayedText}
      {isTyping && <span className="typewriter-cursor"></span>}
    </>
  );
};

export default Typewriter;