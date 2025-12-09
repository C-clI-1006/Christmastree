import * as THREE from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface ParticleData {
  id: number;
  scatterPosition: THREE.Vector3; // Renamed concept: This is now the "Explosion/Text" position mostly
  textPosition: THREE.Vector3;    // Specific target for text formation
  treePosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  color: THREE.Color;
  speed: number; // Individual lerp speed for organic feel
}

export interface TreeConfig {
  count: number;
  radius: number;
  height: number;
  colorPalette: {
    primary: string;   // Emerald
    secondary: string; // Gold
    accent: string;    // Red
  };
}