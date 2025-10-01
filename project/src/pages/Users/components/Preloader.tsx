import React, { useState, useEffect } from 'react';
import logo from '/assets/logo.png';
interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade out animation to complete
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2500); // Show for 2.5 seconds, then fade out for 0.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-orange-50 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center preloader-fade-in">
        <img 
          src={logo}
          alt="PRK Tech Logo" 
          className="mx-auto mb-4 w-auto h-50 preloader-pulse"
        />
        <div className="text-black text-xl font-semibold">PRK Tech India</div>
        <div className="text-black text-sm mt-2">Loading...</div>
      </div>
    </div>
  );
};

export default Preloader;
