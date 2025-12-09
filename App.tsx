import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Scene from './components/Scene';
import UI from './components/UI';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );
  };

  return (
    <div className="relative w-full h-screen bg-[#020408] overflow-hidden">
      {/* 3D Canvas */}
      <Canvas 
        shadows 
        // Cap DPR for mobile performance (1 on very high res screens can look blurry, 2 is sweet spot)
        dpr={[1, 2]} 
        gl={{ 
            antialias: false, 
            toneMapping: 3, // ACESFilmic
            toneMappingExposure: 1.1,
            powerPreference: "high-performance"
        }}
        camera={{ position: [0, 2, 35], fov: isMobile ? 55 : 35 }} // Wider FOV on mobile to fit the tree
      >
        <Suspense fallback={null}>
          <Scene treeState={treeState} isMobile={isMobile} />
        </Suspense>
      </Canvas>

      {/* Disney-style Loader */}
      <Loader 
        containerStyles={{ background: '#020408' }}
        innerStyles={{ background: 'linear-gradient(to right, #D4AF37, #F4E4BC)', width: '200px', height: '4px', borderRadius: '2px' }}
        barStyles={{ background: '#F4E4BC', height: '4px', borderRadius: '2px' }}
        dataInterpolation={(p) => `Summoning Magic... ${p.toFixed(0)}%`} 
        dataStyles={{ color: '#F4E4BC', fontSize: '14px', fontFamily: 'Times New Roman', fontStyle: 'italic', marginTop: '20px' }}
      />

      {/* UI Overlay */}
      <UI currentState={treeState} onToggle={toggleState} />
    </div>
  );
};

export default App;