import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleData, TreeState } from '../types';
import { generateVintageTreeData, generateOrnamentsData } from '../utils/math';

interface TreeParticlesProps {
  state: TreeState;
  isMobile: boolean;
}

const TreeParticles: React.FC<TreeParticlesProps> = ({ state, isMobile }) => {
  // CONFIG: Optimized for Mobile/Web Balance
  const LEAF_COUNT = isMobile ? 8000 : 12000; 
  const ORNAMENT_COUNT = isMobile ? 250 : 400;
  const LIGHT_COUNT = isMobile ? 400 : 600;
  const TOTAL_PARTICLES = LEAF_COUNT + ORNAMENT_COUNT + LIGHT_COUNT;

  const LEAF_COLORS = ['#1A3300', '#2D4F14', '#0F2206', '#41612A'];
  const ORNAMENT_COLORS = ['#C41E3A', '#D4AF37', '#C0C0C0', '#8B0000']; 
  const LIGHT_COLORS = ['#FFD700', '#FFECB3', '#FFA500']; 

  const { leafData, ornamentData, lightData } = useMemo(() => {
    // Regenerate data when mobile state changes to adjust layout/counts
    const leaves = generateVintageTreeData(LEAF_COUNT, LEAF_COLORS, TOTAL_PARTICLES);
    const ornaments = generateOrnamentsData(ORNAMENT_COUNT, ORNAMENT_COLORS, 'ball', TOTAL_PARTICLES);
    const lights = generateOrnamentsData(LIGHT_COUNT, LIGHT_COLORS, 'light', TOTAL_PARTICLES);
    return { leafData: leaves, ornamentData: ornaments, lightData: lights };
  }, [LEAF_COUNT, isMobile]);

  return (
    <group>
        <PineNeedles data={leafData} state={state} isMobile={isMobile} />
        <ClassicOrnaments data={ornamentData} state={state} isMobile={isMobile} />
        <FairyLights data={lightData} state={state} isMobile={isMobile} />
    </group>
  );
};

// --- Shared Logic ---

// Brighter, Platinum Gold for maximum readability and bloom
const TEXT_GOLD_COLOR = new THREE.Color('#FFF5D0').multiplyScalar(1.5); // Boosted brightness
const VEC_DUMMY = new THREE.Vector3();

const useOrganicAnimation = (
    meshRef: React.RefObject<THREE.InstancedMesh>, 
    data: ParticleData[], 
    state: TreeState,
    config: {
        scale: number;
        swaySpeed?: number;
    }
) => {
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((stateThree, delta) => {
        if (!meshRef.current) return;
        const isTree = state === TreeState.TREE_SHAPE;
        const time = stateThree.clock.elapsedTime;
        
        data.forEach((particle, i) => {
            const target = isTree ? particle.treePosition : particle.textPosition;
            
            // 1. POSITION ANIMATION
            const current = particle.currentPosition;
            const dist = current.distanceTo(target);
            
            let moveSpeed = delta * particle.speed * 4.0;
            if (dist < 0.5) moveSpeed *= 0.5; // Soft landing

            if (dist > 0.05) {
                current.lerp(target, moveSpeed);

                // Swirl effect
                if (dist > 2) {
                    const spiralStrength = 1.5;
                    VEC_DUMMY.copy(current).setY(current.y - 5); 
                    const tangentX = VEC_DUMMY.z;
                    const tangentZ = -VEC_DUMMY.x;
                    current.x += tangentX * delta * spiralStrength;
                    current.z += tangentZ * delta * spiralStrength;
                }
            } else if (!isTree) {
                // FORCE SNAP: If very close in text mode, snap to ensure sharpness
                current.lerp(target, 0.1); 
            }

            dummy.position.copy(current);

            // 2. STATE BEHAVIOR
            if (isTree) {
                // --- TREE MODE ---
                dummy.rotation.copy(particle.rotation);
                
                if (config.swaySpeed) {
                   dummy.rotation.z += Math.sin(time * config.swaySpeed + particle.id) * 0.02;
                   dummy.rotation.x += Math.cos(time * config.swaySpeed + particle.id) * 0.02;
                }
                
                dummy.scale.setScalar(config.scale * particle.scale);
                meshRef.current!.setColorAt(i, particle.color);

            } else {
                // --- TEXT MODE (Optimized for Clarity) ---
                
                // Reduced noise for sharpness. 
                // Instead of vibrating, they just gently breathe.
                const noiseAmp = 0.02; 
                dummy.position.x += Math.sin(time * 1.5 + particle.id) * noiseAmp;
                dummy.position.y += Math.cos(time * 1.0 + particle.id) * noiseAmp;
                
                // Rotation: Tumble slowly
                dummy.rotation.x += delta;
                dummy.rotation.y += delta;

                // SCALE UP for text mode to fill gaps
                const dustSize = 0.08; 
                // Subtle sparkle
                const twinkle = 0.8 + Math.sin(time * 5 + particle.id) * 0.2; 
                dummy.scale.setScalar(config.scale * dustSize * twinkle * 1.5); // 1.5x boost

                // COLOR: High Intensity Gold
                meshRef.current!.setColorAt(i, TEXT_GOLD_COLOR);
            }

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });
};

const useColorInit = (meshRef: React.RefObject<THREE.InstancedMesh>, data: ParticleData[]) => {
    useLayoutEffect(() => {
        if (meshRef.current) {
            data.forEach((particle, i) => {
                meshRef.current!.setColorAt(i, particle.color);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
            meshRef.current.instanceColor!.needsUpdate = true;
        }
    }, [data]);
};

const PineNeedles = ({ data, state, isMobile }: { data: ParticleData[], state: TreeState, isMobile: boolean }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    useColorInit(meshRef, data);
    useOrganicAnimation(meshRef, data, state, {
        scale: isMobile ? 0.35 : 0.28,
        swaySpeed: 1.0,
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
            <tetrahedronGeometry args={[1, 0]} /> 
            <meshStandardMaterial 
                roughness={0.8} 
                metalness={0.0}
                flatShading={true}
            />
        </instancedMesh>
    );
};

const ClassicOrnaments = ({ data, state, isMobile }: { data: ParticleData[], state: TreeState, isMobile: boolean }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    useColorInit(meshRef, data);
    useOrganicAnimation(meshRef, data, state, {
        scale: isMobile ? 0.45 : 0.35,
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial 
                roughness={0.2} 
                metalness={0.8}
                envMapIntensity={1.5}
            />
        </instancedMesh>
    );
};

const FairyLights = ({ data, state, isMobile }: { data: ParticleData[], state: TreeState, isMobile: boolean }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        if (meshRef.current) {
            data.forEach((particle, i) => {
                meshRef.current!.setColorAt(i, particle.color);
            });
        }
    }, [data]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((stateThree, delta) => {
       if(!meshRef.current) return;
       const time = stateThree.clock.elapsedTime;
       const isTree = state === TreeState.TREE_SHAPE;

       data.forEach((particle, i) => {
           const target = isTree ? particle.treePosition : particle.textPosition;
           
           // Swirl Logic for Lights
           const current = particle.currentPosition;
           const dist = current.distanceTo(target);
           let moveSpeed = delta * particle.speed * 4.5;
           if(dist < 0.5) moveSpeed *= 0.5;

           if(dist > 0.05) {
               current.lerp(target, moveSpeed);
               if(dist > 2) {
                   const spiralStrength = 2.0;
                   VEC_DUMMY.copy(current).setY(current.y - 5); 
                   current.x += VEC_DUMMY.z * delta * spiralStrength;
                   current.z += -VEC_DUMMY.x * delta * spiralStrength;
               }
           }
           
           dummy.position.copy(particle.currentPosition);
           
           if (isTree) {
               const twinkle = 0.8 + Math.sin(time * 3 + particle.id * 10) * 0.3;
               dummy.scale.setScalar(0.15 * twinkle);
               meshRef.current!.setColorAt(i, particle.color); 
           } else {
               // Text Mode Lights - The "Diamonds" in the text
               const noiseAmp = 0.05; // Reduced noise
               dummy.position.x += Math.sin(time * 5 + particle.id) * noiseAmp;
               dummy.position.y += Math.cos(time * 5 + particle.id) * noiseAmp;

               const twinkle = 0.5 + Math.sin(time * 15 + particle.id) * 0.5;
               dummy.scale.setScalar(0.08 * twinkle); 
               
               // Pure White for lights to stand out against gold text
               meshRef.current!.setColorAt(i, new THREE.Color('#FFFFFF').multiplyScalar(2.0));
           }
           
           dummy.updateMatrix();
           meshRef.current!.setMatrixAt(i, dummy.matrix);
       });
       meshRef.current.instanceMatrix.needsUpdate = true;
       if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial 
                emissive="#FFD700"
                emissiveIntensity={4.0}
                toneMapped={false}
                color="#FFFFFF"
            />
        </instancedMesh>
    );
};

export default TreeParticles;