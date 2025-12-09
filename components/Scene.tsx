import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Environment, Float, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import TreeParticles from './TreeParticles';
import TopStar from './TopStar';
import Ribbon from './Ribbon';
import Gifts from './Gifts';
import ShootingLight from './ShootingLight';
import { TreeState } from '../types';

interface SceneProps {
  treeState: TreeState;
  isMobile: boolean;
}

const Scene: React.FC<SceneProps> = ({ treeState, isMobile }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
        const speed = treeState === TreeState.TREE_SHAPE ? 0.1 : 0.02; // Very slow rotation for text readability
        groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * speed) * 0.1;
    }
  });

  return (
    <>
      <OrbitControls 
        enablePan={false} 
        enableZoom={true}
        minPolarAngle={Math.PI / 2.8} 
        maxPolarAngle={Math.PI / 1.9}
        minDistance={isMobile ? 20 : 15}
        maxDistance={isMobile ? 50 : 45}
        autoRotate={true}
        autoRotateSpeed={0.5}
        rotateSpeed={0.5}
        dampingFactor={0.05}
      />

      {/* Cinematic Background */}
      <color attach="background" args={['#020408']} />
      <fogExp2 attach="fog" args={['#020408', 0.015]} /> 
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Lighting: Magical & Dramatic & BRIGHTER */}
      {/* Increased ambient significantly to lift shadows */}
      <ambientLight intensity={0.5} color="#6a5acd" /> 
      
      {/* Warm glow from bottom */}
      <pointLight position={[10, -10, 10]} intensity={2.0} color="#ff5500" distance={40} decay={2} />
      
      {/* Rim Light */}
      <spotLight 
        position={[-10, 20, -10]} 
        intensity={5} 
        color="#aaccff" 
        angle={0.5} 
        penumbra={1}
      />

      {/* Key Light (Warm Gold) - Main source */}
      <directionalLight 
        position={[5, 10, 15]} 
        intensity={2.0} 
        color="#fff0d0" 
        castShadow
      />

      {/* FILL LIGHT for Text Readability */}
      <pointLight position={[0, 5, 20]} intensity={1.0} color="#ffffff" distance={30} decay={2} />

      <Environment preset="city" blur={0.6} background={false} />

      <group ref={groupRef} position={[0, isMobile ? -2 : -1, 0]}>
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.2, 0.2]}>
           <TreeParticles state={treeState} isMobile={isMobile} />
           <Ribbon state={treeState} />
           <TopStar state={treeState} />
           <ShootingLight state={treeState} />
        </Float>
        
        <Gifts state={treeState} />
      </group>

      <Sparkles 
        count={isMobile ? 100 : 200} 
        scale={30} 
        size={isMobile ? 8 : 6} 
        speed={0.4} 
        opacity={0.6} 
        color="#FFFACD" 
      />

      <EffectComposer disableNormalPass>
        {/* Balanced Bloom */}
        <Bloom 
          luminanceThreshold={0.65} 
          mipmapBlur 
          intensity={1.0} // Slightly lower intensity but lower threshold = more consistent glow
          radius={0.6} 
          levels={9}
        />
        <Vignette eskil={false} offset={0.2} darkness={1.1} />
        <Noise opacity={0.02} /> 
      </EffectComposer>
    </>
  );
};

export default Scene;