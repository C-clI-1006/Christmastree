import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface FireworksProps {
    start: boolean;
}

const Fireworks: React.FC<FireworksProps> = ({ start }) => {
    const pointsRef = useRef<THREE.Points>(null);
    
    // Config
    const PARTICLE_COUNT = 1500;
    const EXPLOSION_DURATION = 2.0;
    
    // Store particle state: [x, y, z, vx, vy, vz, life, colorIndex]
    // We'll manage multiple explosions in one buffer for simplicity
    
    const { geometry, velocities, life, colors, startPositions } = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const vels = new Float32Array(PARTICLE_COUNT * 3);
        const lfs = new Float32Array(PARTICLE_COUNT); // 0 to 1
        const cols = new Float32Array(PARTICLE_COUNT * 3);
        const starts = new Float32Array(PARTICLE_COUNT * 3); // To reset

        // Hide initially
        for(let i=0; i<PARTICLE_COUNT; i++) {
            lfs[i] = -1; // Inactive
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        
        return { geometry: geo, velocities: vels, life: lfs, colors: cols, startPositions: starts };
    }, []);

    // Manage explosions
    // Each index in this array represents a "batch" of particles
    const batches = useMemo(() => {
        const batchSize = 100;
        const numBatches = Math.floor(PARTICLE_COUNT / batchSize);
        return Array.from({ length: numBatches }).map((_, i) => ({
            offset: i * batchSize,
            count: batchSize,
            active: false,
            timer: 0
        }));
    }, []);

    // Timer to trigger new fireworks
    const nextFireworkTime = useRef(0);

    const PALETTE = [
        new THREE.Color('#FF0044'), // Red
        new THREE.Color('#00FF88'), // Green
        new THREE.Color('#4488FF'), // Blue
        new THREE.Color('#FFD700'), // Gold
        new THREE.Color('#FFFFFF'), // White
        new THREE.Color('#FF00FF'), // Purple
    ];

    useFrame((state, delta) => {
        if (!pointsRef.current || !start) return;

        const time = state.clock.elapsedTime;
        const positions = geometry.attributes.position.array as Float32Array;
        const cols = geometry.attributes.color.array as Float32Array;

        // 1. Trigger Logic
        if (time > nextFireworkTime.current) {
            // Find inactive batch
            const availableBatch = batches.find(b => !b.active);
            
            if (availableBatch) {
                availableBatch.active = true;
                availableBatch.timer = EXPLOSION_DURATION;
                
                // Random Origin high up
                const origin = new THREE.Vector3(
                    (Math.random() - 0.5) * 30, // Spread width
                    5 + Math.random() * 15,    // Height
                    (Math.random() - 0.5) * 10 - 5 // Depth behind text
                );

                const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

                // Init particles for this batch
                for (let i = 0; i < availableBatch.count; i++) {
                    const idx = availableBatch.offset + i;
                    
                    // Reset Pos
                    positions[idx * 3] = origin.x;
                    positions[idx * 3 + 1] = origin.y;
                    positions[idx * 3 + 2] = origin.z;

                    // Random Velocity (Sphere burst)
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 5 + Math.random() * 10;
                    
                    velocities[idx * 3] = speed * Math.sin(phi) * Math.cos(theta);
                    velocities[idx * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
                    velocities[idx * 3 + 2] = speed * Math.cos(phi);

                    // Color
                    cols[idx * 3] = color.r;
                    cols[idx * 3 + 1] = color.g;
                    cols[idx * 3 + 2] = color.b;

                    life[idx] = 1.0; // Full life
                }
                
                // Next firework in 0.3 - 0.8 seconds
                nextFireworkTime.current = time + 0.3 + Math.random() * 0.5;
            }
        }

        // 2. Update Physics
        for (let b = 0; b < batches.length; b++) {
            const batch = batches[b];
            if (!batch.active) continue;

            batch.timer -= delta;
            if (batch.timer <= 0) {
                batch.active = false;
                // Clear particles (hide them)
                for (let i = 0; i < batch.count; i++) {
                     life[batch.offset + i] = -1;
                     positions[(batch.offset + i) * 3 + 1] = -1000; // Move out of view
                }
                continue;
            }

            // Update particles in batch
            for (let i = 0; i < batch.count; i++) {
                const idx = batch.offset + i;
                if (life[idx] <= 0) continue;

                // Gravity
                velocities[idx * 3 + 1] -= 9.8 * delta * 0.5; // Drag/Gravity factor

                // Drag
                velocities[idx * 3] *= 0.96;
                velocities[idx * 3 + 1] *= 0.96;
                velocities[idx * 3 + 2] *= 0.96;

                // Move
                positions[idx * 3] += velocities[idx * 3] * delta;
                positions[idx * 3 + 1] += velocities[idx * 3 + 1] * delta;
                positions[idx * 3 + 2] += velocities[idx * 3 + 2] * delta;

                // Fade life
                life[idx] -= delta * 0.8; // Decay
                
                // Twinkle / Fade size logic could go here if we used a shader, 
                // but simpler to just let them disappear via scale/opacity if using shader material
                // For PointsMaterial, we just move them or toggle colors.
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial 
                size={0.6} 
                vertexColors 
                transparent 
                opacity={0.8} 
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation
            />
        </points>
    );
};

export default Fireworks;