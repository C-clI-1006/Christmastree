import * as THREE from 'three';
import { ParticleData } from '../types';

export const getRandomSpherePosition = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius; 
  const sinPhi = Math.sin(phi);
  const x = r * sinPhi * Math.cos(theta);
  const y = r * sinPhi * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

// --- TEXT SAMPLING LOGIC ---
let cachedTextPoints: THREE.Vector3[] | null = null;
let lastCalculatedWidth = 0;

const getTextPoints = (totalNeeded: number): THREE.Vector3[] => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const currentWidthKey = isMobile ? 1 : 2;

    if (cachedTextPoints && lastCalculatedWidth === currentWidthKey && cachedTextPoints.length >= totalNeeded) {
        return cachedTextPoints;
    }

    if (typeof document === 'undefined') return [];

    const canvas = document.createElement('canvas');
    // HIGH RESOLUTION SAMPLING for sharpness
    const width = 1024; 
    const height = 512;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return [];

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Ultra Bold Font for dense particle packing
    const fontSize = isMobile ? '900 160px' : '900 130px';
    ctx.font = `${fontSize} "Times New Roman", serif`; 
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lineSpacing = isMobile ? 130 : 150;
    
    ctx.fillText("Merry", width / 2, height / 2 - (lineSpacing/2) + 20);
    ctx.fillText("Christmas", width / 2, height / 2 + (lineSpacing/2));

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const validPixels: THREE.Vector3[] = [];

    // Tighter step for denser point cloud
    const step = 4; 
    
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            if (data[index] > 128) {
                // Scaling
                const scaleX = isMobile ? 0.025 : 0.04;
                const scaleY = isMobile ? 0.025 : 0.04;

                const pX = (x - width / 2) * scaleX; 
                const pY = -(y - height / 2) * scaleY; 
                
                // FLATTENED Z-AXIS:
                // Instead of a cloud, we make it a "Plate" so text is readable.
                // Minimal depth variation (0.2)
                const pZ = (Math.random() - 0.5) * 0.2; 
                
                // Minimal jitter to keep edges sharp
                const jitter = 0.04;
                const finalX = pX + (Math.random() - 0.5) * jitter;
                const finalY = pY + 6.5 + (Math.random() - 0.5) * jitter; 

                validPixels.push(new THREE.Vector3(finalX, finalY, pZ)); 
            }
        }
    }

    // Shuffle
    for (let i = validPixels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validPixels[i], validPixels[j]] = [validPixels[j], validPixels[i]];
    }

    const result: THREE.Vector3[] = [];
    for(let i = 0; i < totalNeeded; i++) {
        const basePoint = validPixels[i % validPixels.length].clone();
        
        // Handling overflow particles (when we have more particles than pixels)
        // Add them as a "Glow Halo" behind the text, rather than blurring the text itself
        if (i >= validPixels.length) {
            basePoint.z -= (Math.random() * 2.0); // Push back behind text
            basePoint.x += (Math.random() - 0.5) * 0.5;
            basePoint.y += (Math.random() - 0.5) * 0.5;
        }
        
        result.push(basePoint);
    }

    cachedTextPoints = result;
    lastCalculatedWidth = currentWidthKey;
    return result;
};

let globalTextIndex = 0;
export const resetGlobalIndex = () => { globalTextIndex = 0; }

export const generateVintageTreeData = (count: number, colors: string[], totalParticlesInScene: number): ParticleData[] => {
  const allTextPoints = getTextPoints(totalParticlesInScene);
  const data: ParticleData[] = [];
  const scatterRadius = 35;
  const treeHeight = 16;
  const maxBaseRadius = 7.0;

  for (let i = 0; i < count; i++) {
    const h = 1 - Math.pow(Math.random(), 0.8); 
    const y = -treeHeight/2 + h * treeHeight;
    const coneRadius = maxBaseRadius * (1 - h);
    const r = coneRadius * Math.pow(Math.random(), 0.4); 
    const angle = Math.random() * Math.PI * 2;
    const fluffAmp = 0.5 * (1 - h); 
    const x = r * Math.cos(angle) + (Math.random() - 0.5) * fluffAmp;
    const z = r * Math.sin(angle) + (Math.random() - 0.5) * fluffAmp;
    
    const treePos = new THREE.Vector3(x, y, z);
    const scatterPos = getRandomSpherePosition(scatterRadius);
    const textPos = allTextPoints[globalTextIndex % allTextPoints.length];
    globalTextIndex++;

    const rotation = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    if (h > 0.8) color.offsetHSL(0.02, 0.1, 0.05); 
    if (r < coneRadius * 0.5) color.offsetHSL(0, 0, -0.15); 

    data.push({
      id: i,
      scatterPosition: scatterPos, 
      textPosition: textPos,      
      treePosition: treePos,
      currentPosition: treePos.clone(), 
      rotation: rotation,
      scale: 0.8 + Math.random() * 0.7,
      color: color,
      speed: 0.4 + Math.random() * 0.6
    });
  }
  return data;
};

export const generateOrnamentsData = (count: number, colors: string[], type: 'light' | 'ball', totalParticlesInScene: number): ParticleData[] => {
    const allTextPoints = getTextPoints(totalParticlesInScene);
    const data: ParticleData[] = [];
    const treeHeight = 16;
    const maxBaseRadius = 6.8; 

    for(let i=0; i<count; i++) {
        const h = Math.random();
        const y = -treeHeight/2 + h * treeHeight;
        const coneRadius = maxBaseRadius * (1 - h);
        const r = coneRadius * (0.85 + Math.random() * 0.2); 
        const angle = Math.random() * Math.PI * 2;
        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);
        
        const treePos = new THREE.Vector3(x, y, z);
        const scatterPos = getRandomSpherePosition(30);
        const textPos = allTextPoints[globalTextIndex % allTextPoints.length];
        globalTextIndex++;

        data.push({
            id: i,
            scatterPosition: scatterPos,
            textPosition: textPos,
            treePosition: treePos,
            currentPosition: treePos.clone(),
            rotation: new THREE.Euler(0, 0, 0),
            scale: type === 'light' ? (0.5 + Math.random() * 0.5) : (0.8 + Math.random() * 0.4),
            color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
            speed: 0.5 + Math.random() * 0.5
        });
    }
    return data;
}

export const generateRibbonCurve = (): THREE.CatmullRomCurve3 => {
    const points: THREE.Vector3[] = [];
    const turns = 4.5;
    const height = 16;
    const baseRadius = 7.5;
    const pointsPerTurn = 20;
    for (let i = 0; i <= turns * pointsPerTurn; i++) {
        const t = i / (turns * pointsPerTurn); 
        const angle = t * turns * Math.PI * 2;
        const r = baseRadius * (1 - t) * 0.9 + 0.5;
        const y = -height/2 + t * height;
        points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
};

export const generateGiftData = (count: number, colors: string[]): ParticleData[] => {
    const data: ParticleData[] = [];
    const innerRadius = 3;
    const outerRadius = 7;
    const groundY = -8.5; 
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = innerRadius + Math.sqrt(Math.random()) * (outerRadius - innerRadius);
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const stackHeight = Math.random() > 0.8 ? 1.5 : 0; 
        const y = groundY + 0.5 + (stackHeight > 0 ? Math.random() * 1.5 : 0);
        const treePos = new THREE.Vector3(x, y, z);
        const scatterPos = getRandomSpherePosition(40);
        const textPos = new THREE.Vector3(0,0,0); 

        data.push({
            id: i,
            scatterPosition: scatterPos,
            textPosition: textPos,
            treePosition: treePos,
            currentPosition: treePos.clone(),
            rotation: new THREE.Euler(0, Math.random() * Math.PI, 0),
            scale: 0.8 + Math.random() * 0.8,
            color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
            speed: 0.3 + Math.random() * 0.4
        });
    }
    return data;
};