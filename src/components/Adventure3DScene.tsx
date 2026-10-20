import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  BookOpen, 
  User, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert,
  Flame,
  Star,
  Coins,
  Sun,
  Clock,
  MapPin,
  Lock,
  Compass,
  Check,
  X
} from 'lucide-react';

export interface AdventureStation3D {
  id: string;
  x: number;
  z: number;
  label: string;
  subLabel?: string;
  icon?: string;
  status: 'completed' | 'unlocked' | 'locked';
  color: number;
  goodsColor?: number;
  onInteract: () => void;
}

export interface Adventure3DSceneProps {
  cityName: string;
  cityNumber?: number;
  totalCities?: number;
  regionName?: string;
  accentColor?: string;
  moduleName?: string;
  landmarkName?: string;
  stations: AdventureStation3D[];
  bossStation?: {
    label: string;
    bossName: string;
    isPassed: boolean;
    allLevelsDone?: boolean;
    completedCount?: number;
    onInteract: () => void;
  };
  exitGate?: {
    isUnlocked: boolean;
    targetCityName: string;
    onWalkThrough: () => void;
  };
  onBackToMap: () => void;
  onOpenVocabulary?: () => void;
}

// Interactive Web Audio synthesizer for Spanish fiesta sound effects
function playSfx(type: 'chime' | 'guitar' | 'palmas' | 'castanets' | 'fanfare' | 'tapa') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'chime') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } else if (type === 'guitar') {
      [196.0, 246.94, 329.63, 392.0, 493.88].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + idx * 0.04 + 1.2);
      });
    } else if (type === 'palmas') {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.09), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (type === 'tapa') {
      [440.0, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.5);
      });
    } else if (type === 'fanfare') {
      [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.85);
      });
    }
  } catch {
    // audio fallback
  }
}

// Procedural Canvas Texture for Grand Stage Banner ("La Gran Fiesta")
function createFiestaBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#7F1D1D');
  grad.addColorStop(0.5, '#B91C1C');
  grad.addColorStop(1, '#5B0E0E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 1004, 236);
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 988, 220);

  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 32px serif';
  ctx.textAlign = 'center';
  ctx.fillText('👑   SEVILLA   👑', 512, 60);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FFFDF5';
  ctx.font = 'bold 92px "Georgia", "Times New Roman", serif';
  ctx.fillText('La Gran Fiesta', 512, 175);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Procedural Canvas Texture for Tapas Stand Chalkboard
function createTapasBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#17251E';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#5A381E';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, 494, 494);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, 460, 460);

  ctx.fillStyle = '#FFF8E7';
  ctx.font = 'bold 96px "Brush Script MT", "Georgia", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('Tapas', 256, 140);

  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = '#FBBF24';
  ctx.fillText('🍷 Jamón Ibérico', 256, 235);
  ctx.fillText('🥘 Tortilla Española', 256, 305);
  ctx.fillText('🧀 Queso Manchego', 256, 375);

  ctx.font = 'italic 26px serif';
  ctx.fillStyle = '#A3A3A3';
  ctx.fillText('Sevilla • 100% Auténtico', 256, 455);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Procedural Canvas Texture for Plaza Terracotta Cobblestones
function createCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#782E1A';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 8;
  const tw = 512 / cols;
  const th = 512 / rows;
  const tileShades = ['#C85A3B', '#BA4E30', '#D66545', '#AF4328', '#C35436'];

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2) * (tw / 2);
    for (let c = -1; c <= cols; c++) {
      const color = tileShades[(r * 5 + c + 17) % tileShades.length];
      ctx.fillStyle = color;
      const x = c * tw + xOff + 2;
      const y = r * th + 2;
      const w = tw - 4;
      const h = th - 4;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, y, w, 2.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(x, y + h - 2.5, w, 2.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.needsUpdate = true;
  return tex;
}

// Character model generator with cultural accessories (guitar, flamenco dress, sombrero, flower)
function createPersonMesh(
  shirtColor: number,
  hairColor: number,
  pantsColor: number,
  skinColor: number,
  accessory?: 'guitar' | 'flamenco' | 'sombrero' | 'flower'
): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });

  const addMesh = (
    geo: THREE.BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1
  ): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat(c));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    g.add(m);
    return m;
  };

  const addLimb = (
    a: [number, number, number],
    b: [number, number, number],
    r1: number,
    r2: number,
    c: number
  ): THREE.Mesh => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const v = B.clone().sub(A);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r2, r1, v.length(), 10),
      mat(c)
    );
    m.position.copy(A.clone().add(B).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    m.castShadow = true;
    g.add(m);
    return m;
  };

  if (accessory === 'flamenco') {
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.95, 16), mat(shirtColor));
    skirt.position.set(0, 0.48, 0);
    g.add(skirt);

    const frill = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 16), mat(0x111827));
    frill.position.set(0, 0.22, 0);
    frill.rotation.x = Math.PI / 2;
    g.add(frill);

    addMesh(new THREE.CylinderGeometry(0.2, 0.26, 0.62, 12), shirtColor, 0, 1.22, 0);
  } else {
    addLimb([-0.12, 0.82, 0], [-0.14, 0.35, 0], 0.105, 0.085, pantsColor);
    addLimb([0.12, 0.82, 0], [0.14, 0.35, 0], 0.105, 0.085, pantsColor);
    addMesh(new THREE.SphereGeometry(0.09, 12, 10), pantsColor, -0.14, 0.35, 0);
    addMesh(new THREE.SphereGeometry(0.09, 12, 10), pantsColor, 0.14, 0.35, 0);
    addMesh(new THREE.BoxGeometry(0.19, 0.12, 0.31), 0x221c1a, -0.14, 0.11, 0.07);
    addMesh(new THREE.BoxGeometry(0.19, 0.12, 0.31), 0x221c1a, 0.14, 0.11, 0.07);

    addMesh(new THREE.SphereGeometry(0.2, 14, 12), pantsColor, 0, 0.83, 0, 1, 0.72, 0.78);
    addMesh(new THREE.CylinderGeometry(0.22, 0.29, 0.62, 12), shirtColor, 0, 1.22, 0);
  }

  addMesh(new THREE.SphereGeometry(0.235, 14, 12), shirtColor, 0, 1.48, 0, 1, 0.55, 0.8);
  addMesh(new THREE.CylinderGeometry(0.075, 0.08, 0.14, 10), skinColor, 0, 1.62, 0);

  addMesh(new THREE.SphereGeometry(0.22, 16, 14), skinColor, 0, 1.82, 0);
  addMesh(new THREE.SphereGeometry(0.235, 16, 14), hairColor, 0, 1.88, -0.04, 1, 0.9, 1);

  addLimb([-0.26, 1.45, 0], [-0.34, 1.05, 0], 0.075, 0.065, shirtColor);
  addLimb([0.26, 1.45, 0], [0.34, 1.05, 0], 0.075, 0.065, shirtColor);
  addMesh(new THREE.SphereGeometry(0.065, 8, 8), skinColor, -0.34, 0.98, 0);
  addMesh(new THREE.SphereGeometry(0.065, 8, 8), skinColor, 0.34, 0.98, 0);

  if (accessory === 'guitar') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.14), mat(0xCA8A04));
    body.position.set(0.12, 1.15, 0.24);
    body.rotation.z = -0.35;
    g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6), mat(0x78350F));
    neck.position.set(-0.16, 1.35, 0.24);
    neck.rotation.z = 0.9;
    g.add(neck);
  } else if (accessory === 'sombrero') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 16), mat(0x111827));
    brim.position.set(0, 1.98, 0);
    g.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), mat(0x111827));
    crown.position.set(0, 2.06, 0);
    g.add(crown);
  } else if (accessory === 'flower' || accessory === 'flamenco') {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat(0xDC2626));
    flower.position.set(0.18, 1.96, 0.05);
    g.add(flower);
  }

  return g;
}

export const Adventure3DScene: React.FC<Adventure3DSceneProps> = ({
  cityName,
  cityNumber,
  totalCities,
  regionName,
  accentColor = '#C60B1E',
  landmarkName,
  stations,
  bossStation,
  exitGate,
  onBackToMap,
  onOpenVocabulary
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const { progress } = useGame();

  // Real Playable Quest State (Initializes UNCOMPLETED: 0/3, 0/2, 0/1 - no fake 3/3!)
  const [questState, setQuestState] = useState({
    decorationsCollected: 0,
    musiciansSpoken: [] as string[],
    tapaTasted: false,
    completed: false
  });
  const questStateRef = useRef(questState);
  questStateRef.current = questState;

  const [nearestDistance, setNearestDistance] = useState<number>(12);
  const [nearestStation, setNearestStation] = useState<AdventureStation3D | null>(null);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [isMissionsCollapsed, setIsMissionsCollapsed] = useState<boolean>(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastText(null), 3200);
  }, []);

  const keysRef = useRef<Record<string, boolean>>({});

  // Mobile pad key press
  const handleTouchKey = (key: string, pressed: boolean) => {
    keysRef.current[key] = pressed;
  };

  // Player avatar colors
  const skinHex = {
    light: 0xfddcb5,
    'medium-light': 0xe8b98a,
    medium: 0xc8956c,
    'medium-dark': 0x9a6b4a,
    dark: 0x6b4226
  }[progress.profile?.character?.skinTone || 'medium'] || 0xc8956c;

  const hairHex = {
    black: 0x1a1a2e,
    brown: 0x241711,
    blonde: 0xe8c96a,
    red: 0xb34233,
    gray: 0x9ca3af
  }[progress.profile?.character?.hairColor || 'brown'] || 0x241711;

  const shirtHex = 0xe05615; // Orange terracotta jacket matching reference image
  const pantsHex = 0x24355a; // Navy trousers matching reference image

  const stationsRef = useRef(stations);
  stationsRef.current = stations;
  const bossStationRef = useRef(bossStation);
  bossStationRef.current = bossStation;
  const exitGateRef = useRef(exitGate);
  exitGateRef.current = exitGate;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    const worldGroup = new THREE.Group();

    // Scene & Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    // Warm Spanish Dusk Sky matching reference screenshot
    scene.background = new THREE.Color(0xd97736);
    scene.fog = new THREE.Fog(0xb85b2e, 42, 110);
    scene.add(worldGroup);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);

    // Warm Festive Golden Hour Lighting
    scene.add(new THREE.HemisphereLight(0xffcaa0, 0x854d0e, 1.25));
    const sun = new THREE.DirectionalLight(0xffecc0, 1.15);
    sun.position.set(16, 28, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, far: 90 });
    scene.add(sun);

    // Central & Stage Lantern Glow
    const lanternLight1 = new THREE.PointLight(0xff9933, 1.4, 38);
    lanternLight1.position.set(0, 5, 0);
    scene.add(lanternLight1);

    const lanternLight2 = new THREE.PointLight(0xff5511, 1.2, 32);
    lanternLight2.position.set(0, 4.5, -14);
    scene.add(lanternLight2);

    const mat = (c: number | string) => new THREE.MeshLambertMaterial({ color: c });
    const addBox = (w: number, h: number, d: number, c: number | string, x: number, y: number, z: number, p?: THREE.Group) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
      m.position.set(x, y + h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      (p || worldGroup).add(m);
      return m;
    };

    const obstacles: [number, number, number][] = [];

    // 1. Plaza ground with procedural warm terracotta cobblestone tile pattern
    const groundTex = createCobblestoneTexture();
    const grMat = new THREE.MeshLambertMaterial({ map: groundTex });
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), grMat);
    gr.rotation.x = -Math.PI / 2;
    worldGroup.add(gr);

    const plazaFloor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), grMat);
    plazaFloor.rotation.x = -Math.PI / 2;
    plazaFloor.position.y = 0.02;
    plazaFloor.receiveShadow = true;
    worldGroup.add(plazaFloor);

    // 1b. Hanging Festive String Lights with Glowing Farolillos (Crisscrossing the sky)
    const lanternColors = [0xef4444, 0xfbbf24, 0xf97316, 0xef4444, 0xffffff, 0xfbbf24];
    [-11, 0, 11].forEach((sz, idx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-19, 5.8, sz - 7),
        new THREE.Vector3(-8, 4.4, sz - 2),
        new THREE.Vector3(0, 4.1, sz),
        new THREE.Vector3(8, 4.4, sz + 2),
        new THREE.Vector3(19, 5.8, sz + 7)
      ]);
      const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.025, 4, false), mat(0x452515));
      worldGroup.add(cable);

      const points = curve.getPoints(9);
      points.forEach((pt, pIdx) => {
        if (pIdx === 0 || pIdx === points.length - 1) return;
        const color = lanternColors[(idx * 3 + pIdx) % lanternColors.length];
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4), mat(0x333333));
        cord.position.set(pt.x, pt.y - 0.2, pt.z);
        worldGroup.add(cord);

        const lanternMat = new THREE.MeshBasicMaterial({ color });
        const lanternMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), lanternMat);
        lanternMesh.position.set(pt.x, pt.y - 0.48, pt.z);
        worldGroup.add(lanternMesh);
      });
    });

    // 1c. Tapas Chalkboard sign easel with hand-drawn texture (matching reference)
    const easelGroup = new THREE.Group();
    const easelLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.45, 4), mat(0x5c3317));
    easelLeg1.rotation.x = 0.2;
    easelLeg1.position.set(0, 0.72, -0.15);
    easelGroup.add(easelLeg1);
    const easelLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.45, 4), mat(0x5c3317));
    easelLeg2.rotation.x = -0.2;
    easelLeg2.position.set(0, 0.72, 0.15);
    easelGroup.add(easelLeg2);

    const tapasTex = createTapasBoardTexture();
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.06), new THREE.MeshLambertMaterial({ map: tapasTex }));
    board.position.set(0, 0.85, 0);
    easelGroup.add(board);
    easelGroup.position.set(10.5, 0, -6.5);
    worldGroup.add(easelGroup);
    obstacles.push([10.5, -6.5, 0.9]);

    // Tapas Vendor (Manolo) with black sombrero cordobés
    const tapasVendor = createPersonMesh(0xb45309, 0x1f2937, 0x111827, 0xc58c5f, 'sombrero');
    tapasVendor.position.set(11.5, 0, -7.5);
    tapasVendor.rotation.y = -0.4;
    worldGroup.add(tapasVendor);
    obstacles.push([11.5, -7.5, 1.0]);

    // Wine Barrels with candle lanterns on top
    [[-8, 6], [-8.8, 5.2], [11.8, -4.5], [12.5, -5.5]].forEach(([bx, bz]) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.95, 10), mat(0x6b4423));
      barrel.position.set(bx, 0.48, bz);
      barrel.castShadow = true;
      worldGroup.add(barrel);
      const lMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 6), lMat);
      candle.position.set(bx, 1.05, bz);
      worldGroup.add(candle);
      obstacles.push([bx, bz, 0.65]);
    });

    // Red geranium flower planters
    for (let k = -12; k <= 12; k += 6) {
      if (Math.abs(k) < 3) continue;
      const planter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.5), mat(0xb45309));
      planter.position.set(k, 0.23, 16);
      worldGroup.add(planter);
      for (let f = -0.5; f <= 0.5; f += 0.35) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), mat(0xef4444));
        flower.position.set(k + f, 0.52, 16);
        worldGroup.add(flower);
      }
    }

    // 2. Perimeter Spanish town buildings
    const wallCol = new THREE.Color(0xd4c3a3);
    const buildHouse = (x: number, z: number, w: number, d: number, h: number) => {
      addBox(w, h, d, wallCol.getHex(), x, 0, z);
      for (let y = 2.5; y < h - 1; y += 3) {
        addBox(w + 0.1, 1, d + 0.1, 0x2c3a55, x, y, z);
      }
    };

    for (let k = -4; k <= 4; k++) {
      const h = 8 + (Math.abs(k) % 3) * 3;
      if (Math.abs(k) > 1) buildHouse(k * 6.5, -27, 6, 6, h);
      buildHouse(27, k * 6.5, 6, 6, 8 + (Math.abs(k) % 2) * 4);
      buildHouse(-27, k * 6.5, 6, 6, 8 + (Math.abs(k) % 2) * 4);
      buildHouse(k * 6.5, 27, 6, 6, 8 + (Math.abs(k) % 3) * 3);
    }

    // 3. Central Fountain
    const f1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.7, 20), mat(0xb8b0a0));
    f1.position.set(0, 0.35, -5);
    worldGroup.add(f1);
    const fWater = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.75, 20), mat(0x4fa8d8));
    fWater.position.set(0, 0.4, -5);
    worldGroup.add(fWater);
    obstacles.push([0, -5, 2.5]);

    // 4. Perimeter Trees
    for (let j = 0; j < 10; j++) {
      const a = j * 0.63;
      const x = Math.cos(a) * 19;
      const z = Math.sin(a) * 19;
      if (x > 17 && Math.abs(z) < 4) continue;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2, 6), mat(0x6b4a2a));
      trunk.position.set(x, 1, z);
      worldGroup.add(trunk);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), mat(0x3f8f4a));
      foliage.position.set(x, 3.2, z);
      worldGroup.add(foliage);
      obstacles.push([x, z, 0.8]);
    }

    // 5. Grand Festival Stage at North Plaza Head (matching reference screenshot)
    const bx = 0;
    const bz = -18;
    const stageGroup = new THREE.Group();

    // Elevated stage platform & stairs
    addBox(15, 0.8, 6.5, 0x8a4522, bx, 0, bz, stageGroup);
    addBox(6.5, 0.4, 1.3, 0xa5582e, bx, 0, bz + 3.9, stageGroup);

    // Mudéjar red arch backdrop
    addBox(14.6, 5.0, 0.4, 0x991b1b, bx, 0.8, bz - 2.8, stageGroup);

    // Golden pillars
    [-7.0, -2.6, 2.6, 7.0].forEach(px => {
      addBox(0.42, 5.6, 0.42, 0xf59e0b, bx + px, 0.8, bz - 2.6, stageGroup);
    });

    // Grand Arched Canvas Banner ("La Gran Fiesta")
    const bannerTex = createFiestaBannerTexture();
    const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 2.6), bannerMat);
    bannerMesh.position.set(bx, 5.2, bz - 2.3);
    stageGroup.add(bannerMesh);

    // Concert stage speaker stacks flanking the stage
    [-7.8, 7.8].forEach(sx => {
      addBox(1.2, 2.8, 1.2, 0x1f2937, bx + sx, 0.8, bz - 1.0, stageGroup);
      const speakerCone = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), mat(0x374151));
      speakerCone.position.set(bx + sx, 2.2, bz - 0.38);
      stageGroup.add(speakerCone);
    });

    // Musician 1: Paco el Guitarrista (Stage Left)
    const guitarist = createPersonMesh(0xb45309, 0x1f2937, 0x111827, 0xdeb887, 'guitar');
    guitarist.position.set(bx - 3.2, 0.8, bz - 0.5);
    guitarist.rotation.y = 0.35;
    stageGroup.add(guitarist);

    // Musician 2: Elena la Cantaora (Stage Right)
    const singer = createPersonMesh(0xc60b1e, 0x111827, 0x111827, 0xfce7f3, 'flower');
    singer.position.set(bx + 3.2, 0.8, bz - 0.5);
    singer.rotation.y = -0.35;
    stageGroup.add(singer);

    worldGroup.add(stageGroup);
    obstacles.push([bx, bz, 5.8]);

    // 6. Fiesta Organizer NPC (Carmen / Organizadora) standing in front of stage stairs
    const organizer = createPersonMesh(0xc60b1e, 0x18181b, 0x1f2937, 0xfce7f3, 'flamenco');
    organizer.position.set(0, 0, -14.0);
    organizer.rotation.y = 0;
    worldGroup.add(organizer);
    obstacles.push([0, -14.0, 1.1]);

    // 7. Flamenco Dancer swaying in front of the stage
    const flamencoDancer = createPersonMesh(0xbe123c, 0x0f172a, 0x881337, 0xfce7f3, 'flamenco');
    flamencoDancer.position.set(6.2, 0, -11.5);
    flamencoDancer.rotation.y = -0.4;
    worldGroup.add(flamencoDancer);
    obstacles.push([6.2, -11.5, 1.2]);

    // ========================================================
    // 8. 3D SHOPS / MARKET STALLS FOR ALL STATIONS (MERGED!)
    // ========================================================
    const tagsContainer = tagsContainerRef.current;
    if (tagsContainer) tagsContainer.innerHTML = '';

    const stationElements: {
      id: string;
      station: AdventureStation3D;
      pos: { x: number; z: number };
      tagEl: HTMLDivElement;
    }[] = [];

    stations.forEach((station) => {
      const x = station.x;
      const z = station.z;

      // Stall Group (Market counter with striped awning & vendor)
      const sg = new THREE.Group();
      // Counter
      addBox(3.2, 1.05, 1.2, 0x80502f, x, 0, z, sg);
      addBox(3.4, 0.16, 1.3, 0xd7b78a, x, 1.05, z, sg);
      // Posts
      [-1.3, 1.3].forEach(dx => addBox(0.12, 2.1, 0.12, 0x68452e, x + dx, 0, z - 0.5, sg));
      // Awning
      addBox(3.6, 0.18, 1.8, station.color, x, 2.2, z - 0.4, sg);
      for (let j = 0; j < 5; j++) {
        addBox(0.65, 0.2, 1.82, j % 2 ? 0xf8e8c9 : station.color, x - 1.3 + j * 0.65, 2.2, z - 0.4, sg);
      }
      // Food/goods on counter
      for (let j = 0; j < 4; j++) {
        const prod = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(station.goodsColor || 0xffc94a));
        prod.position.set(x - 0.9 + j * 0.6, 1.38, z - 0.1);
        prod.castShadow = true;
        sg.add(prod);
      }
      worldGroup.add(sg);

      // 3D NPC Vendor behind stall
      const vendor = createPersonMesh(station.color, 0x2a1a10, 0x374151, 0xc58c5f);
      vendor.position.set(x, 0, z - 1.35);
      vendor.rotation.y = 0;
      worldGroup.add(vendor);

      obstacles.push([x, z, 2.0]);

      // Floating 2D/3D projected tag element
      const tagEl = document.createElement('div');
      tagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-opacity select-none';
      if (tagsContainer) tagsContainer.appendChild(tagEl);

      stationElements.push({
        id: station.id,
        station,
        pos: { x, z: z + 2.4 }, // interaction spot in front of counter
        tagEl
      });
    });

    // 9. Boss Station / Carpa Real Academia (if present)
    let bossTagEl: HTMLDivElement | null = null;
    if (bossStation) {
      bossTagEl = document.createElement('div');
      bossTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-opacity select-none z-20';
      if (tagsContainer) tagsContainer.appendChild(bossTagEl);
    }

    // 10. Exit Gate (at x = 22)
    let gateTagEl: HTMLDivElement | null = null;
    if (exitGate) {
      addBox(0.6, 5, 0.6, 0xc8b080, 22, 0, -2.6);
      addBox(0.6, 5, 0.6, 0xc8b080, 22, 0, 2.6);
      addBox(0.8, 0.8, 6, 0xc8b080, 22, 5, 0);

      const isGateOpen = Boolean(exitGate.isUnlocked);
      const gateMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.6, 4.8),
        new THREE.MeshBasicMaterial({
          color: isGateOpen ? 0x40ff90 : 0xff5050,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        })
      );
      gateMesh.rotation.y = Math.PI / 2;
      gateMesh.position.set(22, 2.5, 0);
      worldGroup.add(gateMesh);

      gateTagEl = document.createElement('div');
      gateTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-opacity select-none z-20';
      if (tagsContainer) tagsContainer.appendChild(gateTagEl);
    }

    // 11. Interactive 3D Collectible Decorations (0/3 - Real Quest System!)
    interface CollectibleItem {
      id: string;
      name: string;
      group: THREE.Group;
      pos: { x: number; z: number };
      collected: boolean;
      tagEl: HTMLDivElement;
    }

    const collectibles: CollectibleItem[] = [
      {
        id: 'dec_farolillo',
        name: 'Farolillo Dorado de la Feria',
        pos: { x: 3.8, z: -3.5 },
        collected: false,
        group: new THREE.Group(),
        tagEl: document.createElement('div')
      },
      {
        id: 'dec_guirnalda',
        name: 'Guirnalda Floral de Sevilla',
        pos: { x: -9.5, z: 8.5 },
        collected: false,
        group: new THREE.Group(),
        tagEl: document.createElement('div')
      },
      {
        id: 'dec_cintas',
        name: 'Cintas Festivas de Colores',
        pos: { x: 11.5, z: 2.5 },
        collected: false,
        group: new THREE.Group(),
        tagEl: document.createElement('div')
      }
    ];

    collectibles.forEach((c, idx) => {
      c.group.position.set(c.pos.x, 1.2, c.pos.z);
      const orbMat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0xfbbf24 : idx === 1 ? 0xef4444 : 0x38bdf8 });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), orbMat);
      c.group.add(orb);

      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffe066, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.42, 16), ringMat);
      ring.rotation.x = Math.PI / 2;
      c.group.add(ring);

      const pLight = new THREE.PointLight(idx === 0 ? 0xfbbf24 : 0xef4444, 0.8, 4);
      c.group.add(pLight);

      worldGroup.add(c.group);

      c.tagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
      if (tagsContainer) tagsContainer.appendChild(c.tagEl);
    });

    // 12. Interactive Quest Tags for Musicians, Tapas Stand, and Organizer
    const pacoTagEl = document.createElement('div');
    pacoTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
    if (tagsContainer) tagsContainer.appendChild(pacoTagEl);

    const elenaTagEl = document.createElement('div');
    elenaTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
    if (tagsContainer) tagsContainer.appendChild(elenaTagEl);

    const tapasTagEl = document.createElement('div');
    tapasTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
    if (tagsContainer) tagsContainer.appendChild(tapasTagEl);

    const organizerTagEl = document.createElement('div');
    organizerTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
    if (tagsContainer) tagsContainer.appendChild(organizerTagEl);

    // 12b. In-World Floating Beacon matching screenshot ("⚠️ Organizadora de la Fiesta • 📍 12 m")
    const targetBeaconEl = document.createElement('div');
    targetBeaconEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
    if (tagsContainer) tagsContainer.appendChild(targetBeaconEl);

    // 13. Ambient Golden Embers / Fireflies floating in the dusk sky
    const emberCount = 35;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = -16 + Math.random() * 32;
      emberPositions[i * 3 + 1] = 0.5 + Math.random() * 6.5;
      emberPositions[i * 3 + 2] = -18 + Math.random() * 34;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.16,
      transparent: true,
      opacity: 0.85
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    worldGroup.add(embers);

    // 14. Walking Pedestrians / Crowd AI
    const pedestrians: { mesh: THREE.Group; tx: number; tz: number }[] = [];
    const pColors = [0xec4899, 0xa855f7, 0x3b82f6, 0x10b981, 0xf97316, 0xe11d48];
    for (let k = 0; k < 6; k++) {
      const pm = createPersonMesh(pColors[k % pColors.length], 0x241711, 0x1e293b, 0xc58c5f);
      const px = -8 + Math.random() * 24;
      const pz = -12 + Math.random() * 24;
      pm.position.set(px, 0, pz);
      worldGroup.add(pm);
      pedestrians.push({ mesh: pm, tx: px, tz: pz });
    }

    // 15. Playable 3D Player Character
    const playerMesh = createPersonMesh(shirtHex, hairHex, pantsHex, skinHex);
    scene.add(playerMesh);

    const playerPos = { x: -10, z: 0 };
    let playerPosY = 0;
    let playerVelocityY = 0;
    let playerIsGrounded = true;
    let playerAngle = -Math.PI / 2;

    // Camera orbit dragging
    let isDragging = false;
    let prevMouseX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        playerAngle -= dx * 0.006;
        prevMouseX = e.clientX;
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    // Unified Interaction handler for hotkeys and click triggers
    const triggerInteraction = () => {
      const q = questStateRef.current;

      // 1. Check Collectibles
      for (const item of collectibles) {
        if (!item.collected) {
          const d = Math.hypot(playerPos.x - item.pos.x, playerPos.z - item.pos.z);
          if (d < 3.0) {
            item.collected = true;
            item.group.visible = false;
            playSfx('chime');
            confetti({ particleCount: 35, spread: 65, origin: { y: 0.7 } });
            setQuestState(prev => {
              const newCount = prev.decorationsCollected + 1;
              showToastRef.current(`✨ ¡Conseguiste decoraciones! (${newCount}/3)`);
              if (newCount === 3) {
                setTimeout(() => showToastRef.current('🎉 ¡Objetivo completado: 3/3 decoraciones listas!'), 1400);
              }
              return { ...prev, decorationsCollected: newCount };
            });
            return;
          }
        }
      }

      // 2. Check Paco el Guitarrista
      const dPaco = Math.hypot(playerPos.x - (-3.2), playerPos.z - (-17.0));
      if (dPaco < 3.8) {
        playSfx('guitar');
        setQuestState(prev => {
          const already = prev.musiciansSpoken.includes('paco');
          const next = already ? prev.musiciansSpoken : [...prev.musiciansSpoken, 'paco'];
          showToastRef.current('🎸 Paco: "¡Olé! La guitarra flamenca marca el compás de La Gran Fiesta. ¡Toma este ritmo!"');
          if (!already && next.length === 2) {
            setTimeout(() => showToastRef.current('🎉 ¡Objetivo completado: Hablaste con los músicos (2/2)!'), 1500);
          }
          return { ...prev, musiciansSpoken: next };
        });
        return;
      }

      // 3. Check Elena la Cantaora
      const dElena = Math.hypot(playerPos.x - 3.2, playerPos.z - (-17.0));
      if (dElena < 3.8) {
        playSfx('palmas');
        setQuestState(prev => {
          const already = prev.musiciansSpoken.includes('elena');
          const next = already ? prev.musiciansSpoken : [...prev.musiciansSpoken, 'elena'];
          showToastRef.current('🎤 Elena: "¡Bienvenido a Sevilla! El cante y la alegría llenan el aire esta noche."');
          if (!already && next.length === 2) {
            setTimeout(() => showToastRef.current('🎉 ¡Objetivo completado: Hablaste con los músicos (2/2)!'), 1500);
          }
          return { ...prev, musiciansSpoken: next };
        });
        return;
      }

      // 4. Check Tapas Stand
      const dTapas = Math.hypot(playerPos.x - 10.5, playerPos.z - (-6.5));
      if (dTapas < 3.5) {
        playSfx('tapa');
        setQuestState(prev => {
          if (!prev.tapaTasted) {
            confetti({ particleCount: 30, spread: 55, origin: { y: 0.7 } });
            showToastRef.current('🥘 Manolo: "¡Marchando una de Jamón Ibérico y Tortilla de Patatas de Sevilla! ¡Buen provecho!"');
            setTimeout(() => showToastRef.current('🎉 ¡Objetivo completado: Probaste una tapa típica (1/1)!'), 1500);
          } else {
            showToastRef.current('🥘 Manolo: "¡Qué aproveche! Las mejores tapas de toda Andalucía están aquí."');
          }
          return { ...prev, tapaTasted: true };
        });
        return;
      }

      // 5. Check Fiesta Organizer (Carmen)
      const dOrganizer = Math.hypot(playerPos.x - 0, playerPos.z - (-14.0));
      if (dOrganizer < 3.8) {
        const allDone = q.decorationsCollected >= 3 && q.musiciansSpoken.length >= 2 && q.tapaTasted;
        if (!allDone) {
          playSfx('palmas');
          showToastRef.current('🌸 Organizadora: "¡Hola! Ayúdanos con los preparativos: consigue 3 decoraciones, habla con los 2 músicos y prueba una tapa."');
        } else {
          playSfx('fanfare');
          confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
          setQuestState(prev => ({ ...prev, completed: true }));
          showToastRef.current('🏆 Carmen: "¡Increíble trabajo! Todas las decoraciones están listas, la música suena y has probado nuestra gastronomía. ¡Completaste La Gran Fiesta!"');
        }
        return;
      }

      // 6. Check Market Stalls / Station Shops (MERGED FEATURE!)
      let bestDist = 3.8;
      let bestStationId: string | null = null;
      stationElements.forEach(item => {
        const d = Math.hypot(playerPos.x - item.pos.x, playerPos.z - item.pos.z);
        const currentSt = stationsRef.current.find(s => s.id === item.id) || item.station;
        if (d < bestDist && currentSt.status !== 'locked') {
          bestDist = d;
          bestStationId = item.id;
        }
      });

      if (bestStationId) {
        const found = stationsRef.current.find(s => s.id === bestStationId);
        if (found) {
          found.onInteract();
          return;
        }
      }

      // 7. Check Boss Station
      const currentBoss = bossStationRef.current;
      if (currentBoss) {
        const bossDist = Math.hypot(playerPos.x - 0, playerPos.z - (-18));
        if (bossDist < 4.2 && (currentBoss.allLevelsDone || currentBoss.isPassed)) {
          currentBoss.onInteract();
          return;
        }
      }
    };

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      keysRef.current[key] = true;
      keysRef.current[e.key] = true;

      // Jump
      if (!typing && (key === ' ' || key === 'space') && playerIsGrounded) {
        e.preventDefault();
        playerVelocityY = 6.2;
        playerIsGrounded = false;
        return;
      }

      if (typing || (key !== 'e' && key !== 'Enter')) return;
      e.preventDefault();
      triggerInteraction();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keysRef.current[key] = false;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Project 3D vector to screen
    const projVector = new THREE.Vector3();
    const projectToScreen = (x: number, y: number, z: number, el: HTMLDivElement) => {
      projVector.set(x, y, z).project(camera);
      const isVisible = projVector.z < 1;
      el.style.display = isVisible ? 'block' : 'none';
      if (isVisible) {
        const sx = ((projVector.x + 1) / 2) * container.clientWidth;
        const sy = ((1 - projVector.y) / 2) * container.clientHeight;
        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
      }
    };

    // Minimap Radar - Ornate Brass Compass
    const drawMinimap = () => {
      const canvas = minimapCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 6;

      ctx.clearRect(0, 0, size, size);

      // Brass gradient face
      const grad = ctx.createRadialGradient(center, center, 2, center, center, radius);
      grad.addColorStop(0, '#361c10');
      grad.addColorStop(0.7, '#24120a');
      grad.addColorStop(1, '#160905');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

      // Golden concentric rings
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.45, 0, Math.PI * 2);
      ctx.arc(center, center, radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.beginPath();
      ctx.moveTo(center, center - radius + 4);
      ctx.lineTo(center, center + radius - 4);
      ctx.moveTo(center - radius + 4, center);
      ctx.lineTo(center + radius - 4, center);
      ctx.stroke();

      const scale = radius / 22;

      // Draw Shop / Station blips on Minimap (MERGED!)
      stationsRef.current.forEach(st => {
        const sx = (st.x - playerPos.x) * scale;
        const sz = (st.z - playerPos.z) * scale;
        if (Math.hypot(sx, sz) < radius - 8) {
          ctx.fillStyle = st.status === 'completed' ? '#10B981' : st.status === 'unlocked' ? '#F59E0B' : '#6B7280';
          ctx.beginPath();
          ctx.arc(center + sx, center + sz, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Stage & Organizer Blip
      const orgDx = (0 - playerPos.x) * scale;
      const orgDz = (-14 - playerPos.z) * scale;
      if (Math.hypot(orgDx, orgDz) < radius - 8) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(center + orgDx, center + orgDz, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player Directional Arrow
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-playerAngle - Math.PI / 2);
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let lastTime = performance.now();
    let totalTime = 0;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      totalTime += dt;

      // Handle player movement
      const keys = keysRef.current;
      const f = (keys.w || keys.W || keys.ArrowUp ? 1 : 0) - (keys.s || keys.S || keys.ArrowDown ? 1 : 0);
      const r = (keys.a || keys.A || keys.ArrowLeft ? 1 : 0) - (keys.d || keys.D || keys.ArrowRight ? 1 : 0);
      const isSprinting = keys.Shift || keys.shift;

      playerAngle += r * 2.3 * dt;

      let isMoving = false;
      if (f !== 0) {
        isMoving = true;
        const baseSpeed = isSprinting ? 7.2 : 4.6;
        const speed = (f > 0 ? baseSpeed : 2.6) * dt * f;
        let nx = playerPos.x - Math.sin(playerAngle) * speed;
        let nz = playerPos.z - Math.cos(playerAngle) * speed;

        const boundLimit = (x: number, z: number) => (Math.abs(z) < 2.5 && x > 0 ? 23.5 : 20.5);
        nx = Math.max(-20.5, Math.min(boundLimit(nx, nz), nx));
        nz = Math.max(-20.5, Math.min(20.5, nz));

        obstacles.forEach(o => {
          const dx = nx - o[0];
          const dz = nz - o[1];
          const dist = Math.hypot(dx, dz);
          if (dist < o[2]) {
            nx = o[0] + (dx / dist) * o[2];
            nz = o[1] + (dz / dist) * o[2];
          }
        });

        playerPos.x = nx;
        playerPos.z = nz;

        // Check Exit Gate trigger
        if (playerPos.x > 21.6) {
          if (exitGateRef.current?.isUnlocked) {
            exitGateRef.current.onWalkThrough();
          } else {
            playerPos.x = 21.0;
            showToastRef.current('🚪 Completa todos los niveles y el boss para desbloquear el camino');
          }
        }
      }

      // Jump physics
      if (!playerIsGrounded) {
        playerVelocityY -= 20 * dt;
        playerPosY += playerVelocityY * dt;
        if (playerPosY <= 0) {
          playerPosY = 0;
          playerVelocityY = 0;
          playerIsGrounded = true;
        }
      }

      // Update Player Mesh
      playerMesh.position.set(
        playerPos.x,
        playerPosY + (isMoving ? Math.abs(Math.sin(totalTime * (isSprinting ? 12 : 9))) * 0.08 : 0),
        playerPos.z
      );
      playerMesh.rotation.y = playerAngle + Math.PI;

      // Camera follow lerp
      const camTargetX = playerPos.x + Math.sin(playerAngle) * 5.2;
      const camTargetZ = playerPos.z + Math.cos(playerAngle) * 5.2;
      camera.position.lerp(new THREE.Vector3(camTargetX, 3.2, camTargetZ), 1 - Math.exp(-9 * dt));
      camera.lookAt(playerPos.x, 1.7 + playerPosY * 0.5, playerPos.z);

      // Animate Flamenco Dancer (swaying side to side)
      flamencoDancer.rotation.y = -0.4 + Math.sin(totalTime * 3.5) * 0.25;
      flamencoDancer.position.y = Math.abs(Math.sin(totalTime * 3.5)) * 0.04;

      // Animate Guitarist & Singer
      guitarist.rotation.z = Math.sin(totalTime * 5.0) * 0.05;
      singer.position.y = 0.8 + Math.abs(Math.sin(totalTime * 3.0)) * 0.05;

      // ========================================================
      // Update Shop / Station Floating Tags (MERGED FEATURE!)
      // ========================================================
      stationElements.forEach(item => {
        const d = Math.hypot(playerPos.x - item.pos.x, playerPos.z - item.pos.z);
        const isNearby = d < 3.8;
        const st = stationsRef.current.find(s => s.id === item.id) || item.station;

        item.tagEl.innerHTML = `
          <div class="pointer-events-auto flex flex-col items-center">
            <div class="px-2.5 py-1 rounded-full text-[11px] font-black shadow-lg border backdrop-blur-md ${
              st.status === 'completed'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                : st.status === 'unlocked'
                ? 'bg-[#1C2133]/90 text-amber-300 border-amber-400/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }">
              <span>${st.status === 'completed' ? '✔' : st.status === 'locked' ? '🔒' : '🏪'} ${st.label}</span>
            </div>
            ${
              isNearby
                ? `<button class="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
                    E · Interactuar
                  </button>`
                : ''
            }
          </div>
        `;

        if (isNearby) {
          const btn = item.tagEl.querySelector('button');
          if (btn) btn.onclick = () => st.onInteract();
        }

        projectToScreen(st.x, 3.4, st.z, item.tagEl);
      });

      // Update Boss Station Tag
      const currentBoss = bossStationRef.current;
      if (bossTagEl && currentBoss) {
        const bd = Math.hypot(playerPos.x - 0, playerPos.z - (-18));
        const isNearBoss = bd < 4.2;
        bossTagEl.innerHTML = `
          <div class="pointer-events-auto flex flex-col items-center">
            <div class="px-3 py-1 rounded-full text-xs font-black shadow-lg border backdrop-blur-md ${
              currentBoss.isPassed
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500'
                : currentBoss.allLevelsDone
                ? 'bg-rose-950/90 text-rose-300 border-rose-500 glow-red'
                : 'bg-slate-900/90 text-slate-400 border-slate-700'
            }">
              <span>👑 ${currentBoss.label}</span>
            </div>
            ${
              isNearBoss
                ? (currentBoss.allLevelsDone || currentBoss.isPassed)
                  ? `<button class="mt-1 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs rounded-xl shadow-lg border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
                      E · Misión Jefe (Boss)
                    </button>`
                  : `<div class="mt-1 px-3 py-1 bg-slate-900/90 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 shadow flex items-center gap-1">
                      🔒 Completa 10 niveles primero (${currentBoss.completedCount ?? 0}/10)
                    </div>`
                : ''
            }
          </div>
        `;

        if (isNearBoss && (currentBoss.allLevelsDone || currentBoss.isPassed)) {
          const btn = bossTagEl.querySelector('button');
          if (btn) btn.onclick = () => currentBoss.onInteract();
        }
        projectToScreen(0, 4.8, -20, bossTagEl);
      }

      // Update Exit Gate Tag
      const currentGate = exitGateRef.current;
      const isGateOpen = Boolean(currentGate?.isUnlocked);
      if (gateTagEl && currentGate) {
        gateTagEl.innerHTML = `
          <div class="px-2.5 py-1 rounded-full text-xs font-black shadow-lg border backdrop-blur-md ${
            isGateOpen
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/60'
          }">
            <span>${isGateOpen ? '🚪 ' + (currentGate?.targetCityName || 'Siguiente Ciudad') : '🔒 Camino Cerrado'}</span>
          </div>
        `;
        projectToScreen(22, 5.5, 0, gateTagEl);
      }

      // Animate Collectibles (floating & rotating)
      collectibles.forEach((c, idx) => {
        if (!c.collected) {
          c.group.position.y = 1.1 + Math.sin(totalTime * 3 + idx) * 0.15;
          c.group.rotation.y = totalTime * 2.0;

          const dist = Math.hypot(playerPos.x - c.pos.x, playerPos.z - c.pos.z);
          const isNear = dist < 3.0;

          c.tagEl.innerHTML = isNear ? `
            <button class="pointer-events-auto px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs rounded-xl shadow-xl border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
              [E] Recoger ${c.name}
            </button>
          ` : '';

          if (isNear) {
            const btn = c.tagEl.querySelector('button');
            if (btn) btn.onclick = () => triggerInteraction();
          }

          projectToScreen(c.pos.x, 2.2, c.pos.z, c.tagEl);
        } else {
          c.tagEl.style.display = 'none';
        }
      });

      // Update Musicians Tags
      const distPaco = Math.hypot(playerPos.x - (-3.2), playerPos.z - (-17.0));
      if (distPaco < 3.8) {
        pacoTagEl.innerHTML = `
          <button class="pointer-events-auto px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xl border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
            [E] Hablar con Paco el Guitarrista
          </button>
        `;
        const btn = pacoTagEl.querySelector('button');
        if (btn) btn.onclick = () => triggerInteraction();
        projectToScreen(-3.2, 2.6, -17.0, pacoTagEl);
      } else {
        pacoTagEl.style.display = 'none';
      }

      const distElena = Math.hypot(playerPos.x - 3.2, playerPos.z - (-17.0));
      if (distElena < 3.8) {
        elenaTagEl.innerHTML = `
          <button class="pointer-events-auto px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xl border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
            [E] Hablar con Elena la Cantaora
          </button>
        `;
        const btn = elenaTagEl.querySelector('button');
        if (btn) btn.onclick = () => triggerInteraction();
        projectToScreen(3.2, 2.6, -17.0, elenaTagEl);
      } else {
        elenaTagEl.style.display = 'none';
      }

      // Update Tapas Stand Tag
      const distTapas = Math.hypot(playerPos.x - 10.5, playerPos.z - (-6.5));
      if (distTapas < 3.5) {
        tapasTagEl.innerHTML = `
          <button class="pointer-events-auto px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-white font-black text-xs rounded-xl shadow-xl border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
            [E] Probar una tapa típica
          </button>
        `;
        const btn = tapasTagEl.querySelector('button');
        if (btn) btn.onclick = () => triggerInteraction();
        projectToScreen(10.5, 2.4, -6.5, tapasTagEl);
      } else {
        tapasTagEl.style.display = 'none';
      }

      // Update Fiesta Organizer Tag & Beacon
      const distOrganizer = Math.hypot(playerPos.x - 0, playerPos.z - (-14.0));
      const mDistance = Math.max(1, Math.round(distOrganizer * 1.5));

      if (distOrganizer < 3.8) {
        organizerTagEl.innerHTML = `
          <button class="pointer-events-auto px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 text-slate-950 font-black text-xs rounded-xl shadow-2xl border-2 border-white hover:scale-105 active:scale-95 transition-all cursor-pointer">
            [E] Hablar con la Organizadora
          </button>
        `;
        const btn = organizerTagEl.querySelector('button');
        if (btn) btn.onclick = () => triggerInteraction();
        projectToScreen(0, 3.2, -14.0, organizerTagEl);
      } else {
        organizerTagEl.style.display = 'none';
      }

      // Dedicated Floating Target Beacon (Exact match to uploaded image)
      targetBeaconEl.innerHTML = `
        <div class="pointer-events-auto flex flex-col items-center select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          <div class="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#1E0B05] via-[#2B1108] to-[#1E0B05] text-amber-100 font-black text-xs border-2 border-amber-400 shadow-xl">
            <span class="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black">!</span>
            <span class="text-amber-100 font-bold">Organizadora de la Fiesta</span>
            <span class="text-amber-400 text-[10px] font-mono">📍 ${mDistance} m</span>
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-amber-400 -mt-0.5"></div>
        </div>
      `;
      projectToScreen(0, 3.8, -14.0, targetBeaconEl);

      // Track nearest station / shop for HUD readout
      let minDist = 999;
      let closestStation: AdventureStation3D | null = null;
      for (const s of stationsRef.current) {
        const d = Math.hypot(playerPos.x - s.x, playerPos.z - s.z);
        if (d < minDist && s.status !== 'locked') {
          minDist = d;
          closestStation = s;
        }
      }

      // Animate Pedestrians
      pedestrians.forEach(ped => {
        const dx = ped.tx - ped.mesh.position.x;
        const dz = ped.tz - ped.mesh.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.3) {
          ped.tx = -8 + Math.random() * 24;
          ped.tz = -12 + Math.random() * 24;
        } else {
          ped.mesh.position.x += (dx / d) * 1.5 * dt;
          ped.mesh.position.z += (dz / d) * 1.5 * dt;
          ped.mesh.rotation.y = Math.atan2(dx, dz);
          ped.mesh.position.y = Math.abs(Math.sin(totalTime * 8 + ped.tx)) * 0.05;
        }
      });

      // Animate Embers
      const positions = emberGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < emberCount; i++) {
        positions[i * 3 + 1] += 0.4 * dt;
        if (positions[i * 3 + 1] > 7.5) {
          positions[i * 3 + 1] = 0.5;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;

      // Update distance readout for HUD
      if (Math.floor(totalTime * 4) !== Math.floor((totalTime - dt) * 4)) {
        setNearestDistance(mDistance);
        setNearestStation(closestStation);
      }

      drawMinimap();
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      renderer.dispose();
    };
  }, []);

  // Compute completed count for shop stations
  const completedStationsCount = stations.filter(s => s.status === 'completed').length;

  return (
    <div className="relative w-full h-[85vh] min-h-[580px] rounded-3xl overflow-hidden shadow-2xl border-3 border-amber-600/80 bg-[#160703] select-none font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Projected Screen Tags */}
      <div ref={tagsContainerRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* ========================================================
          1. TOP-LEFT HUD: SEVILLA HEADER PILL
          ======================================================== */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 pointer-events-auto">
        <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-2xl bg-gradient-to-r from-[#FFFDF9]/95 via-[#FAF4EA]/95 to-[#F5E8D3]/95 border-2 border-amber-400 shadow-2xl backdrop-blur-md">
          {/* Cathedral Thumbnail */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-amber-900/20 border border-amber-500/50 shrink-0">
            <img src="/game-art/sevilla-landmark.png" alt="Sevilla" className="w-full h-full object-cover" />
          </div>
          {/* Title & Flag */}
          <div className="flex flex-col pr-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-serif font-black text-sm sm:text-base text-[#24140E] tracking-tight leading-none">
                {cityName || 'Sevilla'}
              </span>
              <span className="text-xs">🇪🇸</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#B45309] leading-tight">
              {landmarkName || 'La Gran Fiesta'}
            </span>
          </div>
          {/* Time & Weather Capsule */}
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-b from-[#2B1108] to-[#160703] border border-amber-400/80 text-amber-200 text-[10px] sm:text-xs font-black shadow-inner flex items-center space-x-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow shrink-0" />
            <span>Día 4 • 8:15 PM</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. LEFT HUD: "MISIONES" QUEST PANEL
          ======================================================== */}
      <div className="absolute top-18 sm:top-20 left-3 sm:left-4 z-20 pointer-events-auto w-64 sm:w-72 transition-all">
        <div className="bg-gradient-to-b from-[#2B1108]/95 via-[#1E0B05]/95 to-[#160703]/95 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-3 text-amber-100 backdrop-blur-md space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-base">📜</span>
              <span className="text-xs font-black tracking-wider uppercase text-amber-300 font-serif">
                MISIONES
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black text-amber-400 font-mono">
                {completedStationsCount}/20
              </span>
              <button
                onClick={() => setIsMissionsCollapsed(!isMissionsCollapsed)}
                className="text-amber-400 hover:text-white text-xs font-bold cursor-pointer"
                title={isMissionsCollapsed ? 'Expandir' : 'Colapsar'}
              >
                {isMissionsCollapsed ? '▼' : '▲'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-amber-500/30">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((completedStationsCount / (stations.length || 20)) * 100)}%` }}
            />
          </div>

          {!isMissionsCollapsed && (
            <>
              {/* Active Mission Card - Glowing Amber Gold */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#FBBF24] text-[#24140E] shadow-md border border-amber-300 space-y-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start space-x-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-amber-700/20 shrink-0 border border-amber-600/40">
                      <img src="/game-art/sevilla-landmark.png" alt="Misión" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black leading-tight truncate font-serif">
                        {nearestStation?.label || 'La Gran Fiesta'}
                      </h4>
                      <p className="text-[10px] text-[#422A16] font-semibold line-clamp-2 leading-tight mt-0.5">
                        {nearestStation?.subLabel || 'Habla con la organizadora de la fiesta y ayuda con los preparativos.'}
                      </p>
                    </div>
                  </div>
                  {/* Live Distance Beacon */}
                  <div className="shrink-0 flex items-center space-x-0.5 bg-black/15 px-1.5 py-0.5 rounded-md text-[10px] font-black text-[#24140E]">
                    <MapPin className="w-3 h-3 text-[#B45309]" />
                    <span>{nearestDistance} m</span>
                  </div>
                </div>

                {/* Real Checklist Objectives (Starts uncompleted: 0/3, 0/2, 0/1!) */}
                <div className="space-y-1.5 pt-1.5 border-t border-amber-600/30 text-[10px] font-bold text-[#3B291A]">
                  {/* Task 1: Consigue las decoraciones */}
                  <div 
                    onClick={() => showToast('📍 Recoge las 3 decoraciones brillantes en la plaza (farolillo, guirnalda y cintas).')}
                    className="flex items-center justify-between cursor-pointer hover:bg-amber-600/10 p-0.5 rounded transition-colors"
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center text-[9px] font-black transition-all ${
                        questState.decorationsCollected >= 3
                          ? 'border-emerald-700 bg-emerald-500 text-white shadow-xs'
                          : 'border-[#8C6239] bg-white/40 text-transparent'
                      }`}>
                        {questState.decorationsCollected >= 3 ? '✓' : ''}
                      </span>
                      <span className={questState.decorationsCollected >= 3 ? 'line-through opacity-75' : ''}>
                        Consigue las decoraciones
                      </span>
                    </span>
                    <span className="font-mono">{questState.decorationsCollected}/3</span>
                  </div>

                  {/* Task 2: Habla con los músicos */}
                  <div 
                    onClick={() => showToast('📍 Ve al escenario y habla con Paco el guitarrista y Elena la cantante.')}
                    className="flex items-center justify-between cursor-pointer hover:bg-amber-600/10 p-0.5 rounded transition-colors"
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center text-[9px] font-black transition-all ${
                        questState.musiciansSpoken.length >= 2
                          ? 'border-emerald-700 bg-emerald-500 text-white shadow-xs'
                          : 'border-[#8C6239] bg-white/40 text-transparent'
                      }`}>
                        {questState.musiciansSpoken.length >= 2 ? '✓' : ''}
                      </span>
                      <span className={questState.musiciansSpoken.length >= 2 ? 'line-through opacity-75' : ''}>
                        Habla con los músicos
                      </span>
                    </span>
                    <span className="font-mono">{questState.musiciansSpoken.length}/2</span>
                  </div>

                  {/* Task 3: Prueba una tapa típica */}
                  <div 
                    onClick={() => showToast('📍 Ve al puesto de Tapas junto a la pizarra y prueba una tapa típica.')}
                    className="flex items-center justify-between cursor-pointer hover:bg-amber-600/10 p-0.5 rounded transition-colors"
                  >
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border inline-flex items-center justify-center text-[9px] font-black transition-all ${
                        questState.tapaTasted
                          ? 'border-emerald-700 bg-emerald-500 text-white shadow-xs'
                          : 'border-[#8C6239] bg-white/40 text-transparent'
                      }`}>
                        {questState.tapaTasted ? '✓' : ''}
                      </span>
                      <span className={questState.tapaTasted ? 'line-through opacity-75' : ''}>
                        Prueba una tapa típica
                      </span>
                    </span>
                    <span className="font-mono">{questState.tapaTasted ? '1/1' : '0/1'}</span>
                  </div>
                </div>
              </div>

              {/* Locked Upcoming Missions */}
              <div className="space-y-1 pt-0.5 text-xs">
                <div className="p-1.5 rounded-xl bg-black/40 border border-amber-500/20 text-stone-300 flex items-center space-x-2 opacity-80">
                  <span className="text-xs">🔒</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold block truncate text-amber-200">El Rincón de las Tapas</span>
                    <span className="text-[9px] text-stone-400 block truncate">Completa "La Gran Fiesta"</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-xl bg-black/40 border border-amber-500/20 text-stone-300 flex items-center space-x-2 opacity-80">
                  <span className="text-xs">🔒</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold block truncate text-amber-200">Explora Sevilla</span>
                    <span className="text-[9px] text-stone-400 block truncate">Visita 5 lugares de interés.</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          3. TOP-RIGHT HUD: BRASS COMPASS MINIMAP & BUTTONS
          ======================================================== */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center space-x-2 sm:space-x-2.5 pointer-events-auto">
        {/* Action Buttons: Mapa & Inventario */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={onBackToMap}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2B1108]/95 to-[#160703]/95 border-2 border-amber-400/80 text-amber-200 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            title="Abrir mapa de España (M)"
          >
            <span className="text-base leading-none">🗺️</span>
            <span className="text-[9px] font-black leading-tight mt-0.5">Mapa</span>
            <span className="text-[8px] text-amber-400 font-mono opacity-80">(M)</span>
          </button>

          <button
            onClick={() => setShowInventory(!showInventory)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2B1108]/95 to-[#160703]/95 border-2 border-amber-400/80 text-amber-200 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            title="Abrir inventario y estado (I)"
          >
            <span className="text-base leading-none">🎒</span>
            <span className="text-[8px] font-black leading-tight mt-0.5">Inventario</span>
            <span className="text-[8px] text-amber-400 font-mono opacity-80">(I)</span>
          </button>
        </div>

        {/* Ornate Brass Minimap with Compass Points */}
        <div className="relative p-1 rounded-full border-4 border-amber-500 shadow-2xl bg-[#1C0D07]">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center shadow border border-amber-300 z-10">
            N
          </span>
          <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#3B1E12] text-amber-200 font-black text-[9px] flex items-center justify-center shadow border border-amber-500 z-10">
            E
          </span>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#3B1E12] text-amber-200 font-black text-[9px] flex items-center justify-center shadow border border-amber-500 z-10">
            S
          </span>
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#3B1E12] text-amber-200 font-black text-[9px] flex items-center justify-center shadow border border-amber-500 z-10">
            W
          </span>

          <canvas
            ref={minimapCanvasRef}
            width={112}
            height={112}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-inner block"
          />
        </div>
      </div>

      {/* ========================================================
          4. BOTTOM-LEFT HUD: CARMEN GUIDE PORTRAIT & CONSEJO CARD
          ======================================================== */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 pointer-events-auto flex items-end space-x-2.5 max-w-sm sm:max-w-md">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-amber-400 shadow-2xl overflow-hidden shrink-0 bg-amber-900 ring-2 ring-amber-600/50">
          <img 
            src="/game-art/guide-carmen.png" 
            alt="Guía Carmen" 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="relative p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-[#FFFDF9]/95 via-[#FAF4EA]/95 to-[#F5E8D3]/95 border-2 border-amber-400 shadow-2xl text-[#24140E] text-left backdrop-blur-sm">
          <span className="text-xs font-black text-[#B45309] block uppercase tracking-wider mb-0.5 font-serif">
            Consejo
          </span>
          <p className="text-[10px] sm:text-[11px] text-[#524136] font-medium leading-relaxed">
            ¡La Gran Fiesta es una celebración muy importante en Sevilla! Habla con los organizadores, ayuda con los preparativos y disfruta de la música, las tapas y el baile.
          </p>
        </div>
      </div>

      {/* ========================================================
          5. BOTTOM-CENTER HUD: CONTROLS GUIDE BAR
          ======================================================== */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto hidden md:flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#2B1108]/95 via-[#1E0B05]/95 to-[#160703]/95 border-2 border-amber-400/80 shadow-2xl text-amber-100 text-xs font-bold backdrop-blur-md">
        <div className="flex items-center space-x-1 font-mono text-[11px]">
          <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-400/60 text-amber-200">W</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-400/60 text-amber-200">A</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-400/60 text-amber-200">S</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-400/60 text-amber-200">D</kbd>
          <span className="font-sans ml-1 text-amber-100">Moverse</span>
        </div>
        <span className="text-amber-500">•</span>
        <div className="flex items-center space-x-1 font-mono text-[11px]">
          <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-400/60 text-amber-200">Shift</kbd>
          <span className="font-sans ml-1 text-amber-100">Correr</span>
        </div>
        <span className="text-amber-500">•</span>
        <div className="flex items-center space-x-1.5">
          <kbd className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[11px] shadow-sm">E</kbd>
          <span>Interactuar</span>
        </div>
        <span className="text-amber-500">•</span>
        <div className="flex items-center space-x-1.5 text-stone-300">
          <span>🖱️</span>
          <span>Rotar Cámara</span>
        </div>
      </div>

      {/* Mobile On-Screen D-Pad Controls */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto md:hidden flex flex-col items-center">
        <button
          onTouchStart={() => handleTouchKey('w', true)}
          onTouchEnd={() => handleTouchKey('w', false)}
          className="w-11 h-11 rounded-xl bg-black/60 border border-amber-400/60 text-amber-200 font-bold flex items-center justify-center text-lg active:bg-amber-500 active:text-black mb-1"
        >
          ▲
        </button>
        <div className="flex space-x-1">
          <button
            onTouchStart={() => handleTouchKey('a', true)}
            onTouchEnd={() => handleTouchKey('a', false)}
            className="w-11 h-11 rounded-xl bg-black/60 border border-amber-400/60 text-amber-200 font-bold flex items-center justify-center text-lg active:bg-amber-500 active:text-black"
          >
            ◀
          </button>
          <button
            onTouchStart={() => handleTouchKey('s', true)}
            onTouchEnd={() => handleTouchKey('s', false)}
            className="w-11 h-11 rounded-xl bg-black/60 border border-amber-400/60 text-amber-200 font-bold flex items-center justify-center text-lg active:bg-amber-500 active:text-black"
          >
            ▼
          </button>
          <button
            onTouchStart={() => handleTouchKey('d', true)}
            onTouchEnd={() => handleTouchKey('d', false)}
            className="w-11 h-11 rounded-xl bg-black/60 border border-amber-400/60 text-amber-200 font-bold flex items-center justify-center text-lg active:bg-amber-500 active:text-black"
          >
            ▶
          </button>
        </div>
      </div>

      {/* ========================================================
          6. BOTTOM-RIGHT HUD: LANDMARK BUTTON
          ======================================================== */}
      <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 pointer-events-auto">
        <button
          onClick={() => bossStation?.onInteract ? bossStation.onInteract() : onBackToMap()}
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-[#FAF5EE] via-[#F5ECE0] to-[#EBDDC8] border-2 border-amber-500/80 shadow-2xl text-[#24140E] font-black text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <span>🏛️</span>
          <span className="font-serif">Real Academia & Puestos</span>
          <ChevronRight className="w-4 h-4 text-amber-700" />
        </button>
      </div>

      {/* Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#2B1108] via-[#1E0B05] to-[#160703] border-3 border-amber-500 rounded-3xl p-5 text-amber-100 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎒</span>
                <h3 className="font-serif font-black text-base text-amber-200">Mochila & Inventario</h3>
              </div>
              <button 
                onClick={() => setShowInventory(false)}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-amber-300 font-bold flex items-center justify-center border border-amber-500/40 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center space-x-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[10px] text-amber-300/70 block">Monedas</span>
                  <span className="font-mono font-bold text-amber-200">{progress.stats?.coins || 0}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <div>
                  <span className="text-[10px] text-amber-300/70 block">Estrellas</span>
                  <span className="font-mono font-bold text-yellow-200">
                    {Object.values(progress.completedLevels || {}).reduce((sum, lvl) => sum + (lvl.stars || 0), 0)}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-[10px] text-amber-300/70 block">Racha</span>
                  <span className="font-mono font-bold text-orange-200">{progress.stats?.streak || 1} Días</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center space-x-2">
                <span className="text-sm">❤️</span>
                <div>
                  <span className="text-[10px] text-amber-300/70 block">Vidas</span>
                  <span className="font-mono font-bold text-rose-300">{progress.stats?.lives ?? 3}/3</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-200/90 text-xs">
              <span className="font-bold text-amber-300 block mb-1">Misiones de La Gran Fiesta:</span>
              <ul className="space-y-1 text-[11px]">
                <li>• Decoraciones: {questState.decorationsCollected}/3</li>
                <li>• Músicos: {questState.musiciansSpoken.length}/2</li>
                <li>• Tapa típica: {questState.tapaTasted ? 'Probada ✓' : 'Pendiente ◯'}</li>
              </ul>
            </div>

            <button
              onClick={() => setShowInventory(false)}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-md"
            >
              Cerrar Mochila
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-5 py-2.5 rounded-2xl bg-white/95 border-2 border-amber-400 text-[#24140E] font-black text-sm shadow-2xl backdrop-blur-md animate-bounceIn z-30 pointer-events-none text-center max-w-sm">
          {toastText}
        </div>
      )}
    </div>
  );
};
