import React from 'react';
import { TreeState } from '../types';

interface UIProps {
  currentState: TreeState;
  onToggle: () => void;
}

const UI: React.FC<UIProps> = ({ currentState, onToggle }) => {
  const isTree = currentState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 md:p-10 z-10 font-serif overflow-hidden">
      {/* Header */}
      <header className="text-center md:text-left select-none mt-8 md:mt-0 transition-opacity duration-1000">
        <h1 className="text-5xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFFACD] to-[#D4AF37] tracking-wider drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)]" 
            style={{ fontFamily: '"Times New Roman", serif', fontStyle: 'italic', lineHeight: 1.1 }}>
          Merry<br className="md:hidden" /> Christmas
        </h1>
        <p className="text-[#F4E4BC] text-xs md:text-lg mt-3 tracking-[0.3em] uppercase opacity-80 font-light">
           The Vintage Collection
        </p>
      </header>

      {/* Footer / Controls */}
      <footer className="flex flex-col items-center justify-center pb-8 md:pb-12 w-full">
        <button
          onClick={onToggle}
          className="pointer-events-auto group relative transition-transform duration-300 hover:scale-105 active:scale-95"
        >
            {/* Glow Effect behind button */}
            <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            
            <div className={`relative px-8 md:px-12 py-4 md:py-4 border border-[#D4AF37]/50 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-4 group-hover:border-[#D4AF37] transition-all duration-500 shadow-2xl`}>
                 {/* Indicator Light */}
                 <span className={`w-2 h-2 rounded-full ${isTree ? 'bg-[#FF4444] shadow-[0_0_12px_#FF4444]' : 'bg-[#44FFAA] shadow-[0_0_12px_#44FFAA]'} transition-colors duration-500`}></span>
                 
                 <span className="text-[#F4E4BC] group-hover:text-white tracking-[0.2em] text-xs md:text-sm uppercase font-semibold whitespace-nowrap">
                    {isTree ? 'Cast Spell' : 'Gather Magic'}
                 </span>
            </div>
        </button>
        
        <div className="mt-8 text-[#8B6914] text-[10px] tracking-[0.25em] opacity-50 select-none">
            EST. 2024 • CHANEY'S HOLIDAY
        </div>
      </footer>
    </div>
  );
};

export default UI;