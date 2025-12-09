import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { TreeState } from '../types';

interface ShootingLightProps {
    state: TreeState;
}

const ShootingLight: React.FC<ShootingLightProps> = ({ state }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Path parameters
    const progress = useRef(0);
    const speed = 0.4; // Slightly slower to admire the reflection
    
    useFrame((stateThree, delta) => {
        if (!meshRef.current) return;
        
        if (state !== TreeState.TREE_SHAPE) {
            meshRef.current.scale.setScalar(0);
            return;
        }

        meshRef.current.scale.setScalar(1);

        // Increment progress
        progress.current += delta * speed;
        
        if (progress.current > 1) {
            progress.current = 0; // Loop
        }

        const t = progress.current;
        
        // Spiral Math
        const height = -8 + t * 17; 
        const radius = 9 * (1 - t); 
        const angle = t * Math.PI * 10; 

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = height;

        meshRef.current.position.set(x, y, z);
        
        // Rotate the sphere to show off metallic reflections
        meshRef.current.rotation.x += delta * 2;
        meshRef.current.rotation.z += delta * 2;
    });

    return (
        <group>
            {/* The Trail */}
            <Trail
                width={1.5} 
                length={8} 
                color={new THREE.Color("#FFFDD0")} 
                attenuation={(t) => t * t}
            >
                {/* The "Golden Snitch" style Spirit */}
                <mesh ref={meshRef}>
                    <sphereGeometry args={[0.2, 32, 32]} />
                    {/* High Polish Metal Material */}
                    <meshStandardMaterial 
                        color="#FFFFFF" 
                        metalness={1.0}    // Full Metal
                        roughness={0.1}    // Polished
                        emissive="#FFD700" // Inner Glow
                        emissiveIntensity={0.8}
                    />
                    <pointLight distance={8} intensity={3} color="#FFD700" decay={2} />
                </mesh>
            </Trail>
        </group>
    );
};

export default ShootingLight;