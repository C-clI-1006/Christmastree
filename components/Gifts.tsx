import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleData, TreeState } from '../types';
import { generateGiftData } from '../utils/math';

interface GiftsProps {
    state: TreeState;
}

const Gifts: React.FC<GiftsProps> = ({ state }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const lidRef = useRef<THREE.InstancedMesh>(null); // For the box lids/ribbons
    
    const COUNT = 25;
    const COLORS = ['#8B0000', '#1A3300', '#D4AF37', '#ffffff', '#222222']; // Red, Green, Gold, White, Black (elegant)
    
    const data = useMemo(() => generateGiftData(COUNT, COLORS), []);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Initialize Colors
    useLayoutEffect(() => {
        if (meshRef.current && lidRef.current) {
            data.forEach((d, i) => {
                meshRef.current!.setColorAt(i, d.color);
                lidRef.current!.setColorAt(i, new THREE.Color('#FFD700'));
            });
            meshRef.current.instanceColor!.needsUpdate = true;
            lidRef.current.instanceColor!.needsUpdate = true;
        }
    }, [data]);

    useFrame((_, delta) => {
        if (!meshRef.current || !lidRef.current) return;
        
        const isTree = state === TreeState.TREE_SHAPE;

        data.forEach((particle, i) => {
            const target = isTree ? particle.treePosition : particle.scatterPosition;
            
            // Lerp position
            particle.currentPosition.lerp(target, delta * particle.speed * 2.0); // Faster movement
            
            // Base Box
            dummy.position.copy(particle.currentPosition);
            
            if (isTree) {
                dummy.rotation.copy(particle.rotation);
                dummy.scale.setScalar(particle.scale);
            } else {
                // SCATTERED: Shrink to zero rapidly
                // Gifts don't become powder, they just vanish into the magic
                dummy.rotation.x += delta * 2;
                dummy.rotation.z += delta * 2;
                dummy.scale.setScalar(0); // Vanish
            }
            
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);

            // Lid / Ribbon logic
            if (isTree) {
                const lidOffset = 0.5 * particle.scale; 
                dummy.position.y += lidOffset;
                dummy.scale.set(particle.scale * 1.05, particle.scale * 0.1, particle.scale * 1.05);
            } else {
                 dummy.scale.setScalar(0); // Vanish
            }
            dummy.updateMatrix();
            lidRef.current!.setMatrixAt(i, dummy.matrix);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        lidRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            {/* Box Bodies */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial roughness={0.3} metalness={0.1} />
            </instancedMesh>
            
            {/* Box Lids/Ribbons */}
            <instancedMesh ref={lidRef} args={[undefined, undefined, COUNT]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial roughness={0.1} metalness={0.8} />
            </instancedMesh>
        </group>
    );
};

export default Gifts;