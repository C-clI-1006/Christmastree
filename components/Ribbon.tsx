import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateRibbonCurve } from '../utils/math';
import { TreeState } from '../types';

interface RibbonProps {
    state: TreeState;
}

const Ribbon: React.FC<RibbonProps> = ({ state }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const curve = useMemo(() => generateRibbonCurve(), []);
    
    // Create a FLAT ribbon shape for extrusion
    // This makes it look like fabric, not a rope
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const width = 0.6; 
        const thickness = 0.02; // Very thin, like real silk
        
        // Define a rectangle shape
        shape.moveTo(-width/2, -thickness/2);
        shape.lineTo(width/2, -thickness/2);
        shape.lineTo(width/2, thickness/2);
        shape.lineTo(-width/2, thickness/2);
        shape.lineTo(-width/2, -thickness/2);

        return new THREE.ExtrudeGeometry(shape, {
            steps: 400, // High steps for a smooth silk curve
            bevelEnabled: false,
            extrudePath: curve,
            // Automatic frame generation usually creates nice natural twists for ribbons
        });
    }, [curve]);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        
        const isTree = state === TreeState.TREE_SHAPE;
        
        // Animation
        const targetScale = isTree ? 1 : 3;
        const currentScale = meshRef.current.scale.x; 
        const lerpSpeed = delta * 1.5;
        
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, lerpSpeed);
        meshRef.current.scale.setScalar(newScale);

        const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
        const targetOpacity = isTree ? 1 : 0;
        material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, lerpSpeed);
    });

    return (
        <mesh ref={meshRef} geometry={geometry}>
            {/* Silk / Satin Material Logic */}
            <meshPhysicalMaterial 
                color="#F0C750"        // Soft Champagne Gold
                emissive="#C5A000"
                emissiveIntensity={0.15}
                roughness={0.35}       // Smooth but diffuses light (like fabric)
                metalness={0.1}        // Low metalness (It's fabric, not gold bar)
                clearcoat={0.3}        // Subtle surface shine (Satin finish)
                clearcoatRoughness={0.25}
                sheen={1.0}            // Key property for cloth/velvet look
                sheenColor={new THREE.Color("#FFFDD0")} // Creamy sheen
                sheenRoughness={0.5}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default Ribbon;