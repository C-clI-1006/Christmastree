import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface TopStarProps {
  state: TreeState;
}

const TopStar: React.FC<TopStarProps> = ({ state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  
  // Tree Top Position
  const treePos = new THREE.Vector3(0, 9.2, 0); 
  // Scattered Position (Float higher)
  const scatterPos = new THREE.Vector3(0, 18, 0);

  // Generate the 5-point Star Shape
  // SCALED DOWN by ~1.5x
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    // Previous: 1.2 / 0.5
    // New: 0.8 / 0.33
    const outerRadius = 0.8;
    const innerRadius = 0.33; 

    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const currX = Math.cos(angle - Math.PI / 2) * r;
      const currY = Math.sin(angle - Math.PI / 2) * r;
      if (i === 0) shape.moveTo(currX, currY);
      else shape.lineTo(currX, currY);
    }
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.25, // Thinner depth
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.08,
      bevelSegments: 4
    });
    geom.center(); 
    return geom;
  }, []);

  // Generate Halo Texture via Canvas
  const haloTexture = useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          // Radial Gradient for Soft Glow
          const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');   // Bright center
          gradient.addColorStop(0.2, 'rgba(255, 215, 0, 0.8)'); // Gold core
          gradient.addColorStop(0.5, 'rgba(255, 160, 0, 0.2)'); // Orange fade
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');         // Transparent edge
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 128, 128);
      }
      return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((stateThree, delta) => {
    if (!meshRef.current || !haloRef.current) return;

    const target = state === TreeState.TREE_SHAPE ? treePos : scatterPos;
    
    // Smooth movement
    meshRef.current.position.lerp(target, delta * 2);
    haloRef.current.position.copy(meshRef.current.position); 

    // Rotation Animation
    const rotSpeed = state === TreeState.TREE_SHAPE ? 0.8 : 3.0;
    meshRef.current.rotation.y += delta * rotSpeed;
    
    // Gentle floating bob 
    const bob = Math.sin(stateThree.clock.elapsedTime * 1.5) * 0.05;
    meshRef.current.position.y += bob;
    haloRef.current.position.y += bob;

    const targetScale = state === TreeState.TREE_SHAPE ? 1 : 0.6;
    const currentScale = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta);
    meshRef.current.scale.setScalar(currentScale);

    // Update Halo
    // Halo scale relative to star
    haloRef.current.scale.setScalar(currentScale * 6); 
    const opacityPulse = 0.7 + Math.sin(stateThree.clock.elapsedTime * 2) * 0.15;
    haloRef.current.material.opacity = opacityPulse;
  });

  return (
    <group>
        {/* The Star Mesh */}
        <mesh ref={meshRef} geometry={geometry}>
            <meshPhysicalMaterial 
                color="#FFD700"
                emissive="#FFAA00"      
                emissiveIntensity={2.0} 
                roughness={0.15}
                metalness={1.0}
                clearcoat={1.0}
                clearcoatRoughness={0.1}
            />
            {/* Real light source */}
            <pointLight distance={20} intensity={8} color="#FFD700" decay={2} />
        </mesh>

        {/* The Holy Halo Sprite */}
        <sprite ref={haloRef}>
            <spriteMaterial 
                map={haloTexture} 
                transparent 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
            />
        </sprite>
    </group>
  );
};

export default TopStar;