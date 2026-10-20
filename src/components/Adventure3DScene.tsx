import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { soundService } from '../services/soundService';
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
    allLevelsDone: boolean;
    completedCount?: number;
    onInteract: () => void;
  };
  exitGate?: {
    targetCityName?: string;
    isUnlocked: boolean;
    onWalkThrough: () => void;
  };
  onBackToMap: () => void;
}

// Low-poly human character generator using Three.js primitives
function createPersonMesh(
  shirtColor: number,
  hairColor: number,
  pantsColor: number,
  skinColor: number
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

  // Legs, knees and shoes
  addLimb([-0.12, 0.82, 0], [-0.14, 0.35, 0], 0.105, 0.085, pantsColor);
  addLimb([0.12, 0.82, 0], [0.14, 0.35, 0], 0.105, 0.085, pantsColor);
  addMesh(new THREE.SphereGeometry(0.09, 12, 10), pantsColor, -0.14, 0.35, 0, 1, 0.9, 1);
  addMesh(new THREE.SphereGeometry(0.09, 12, 10), pantsColor, 0.14, 0.35, 0, 1, 0.9, 1);
  addMesh(new THREE.BoxGeometry(0.19, 0.12, 0.31), 0x332c2a, -0.14, 0.11, 0.07, 1, 1, 1);
  addMesh(new THREE.BoxGeometry(0.19, 0.12, 0.31), 0x332c2a, 0.14, 0.11, 0.07, 1, 1, 1);

  // Hips and torso
  addMesh(new THREE.SphereGeometry(0.2, 14, 12), pantsColor, 0, 0.83, 0, 1, 0.72, 0.78);
  addMesh(new THREE.CylinderGeometry(0.22, 0.29, 0.62, 12), shirtColor, 0, 1.22, 0, 1, 1, 1);
  addMesh(new THREE.SphereGeometry(0.235, 14, 12), shirtColor, 0, 1.48, 0, 1, 0.55, 0.8);

  // Collar and neck
  addMesh(new THREE.CylinderGeometry(0.075, 0.08, 0.14, 10), skinColor, 0, 1.62, 0);
  addMesh(new THREE.TorusGeometry(0.105, 0.025, 6, 12), 0xf2e6d4, 0, 1.48, 0.12, 1, 1, 0.65);

  // Arms with elbows and hands
  addLimb([-0.23, 1.48, 0], [-0.36, 1.16, 0.035], 0.085, 0.065, shirtColor);
  addLimb([-0.36, 1.16, 0.035], [-0.34, 0.96, 0.1], 0.065, 0.045, shirtColor);
  addLimb([0.23, 1.48, 0], [0.36, 1.16, 0.035], 0.085, 0.065, shirtColor);
  addLimb([0.36, 1.16, 0.035], [0.34, 0.96, 0.1], 0.065, 0.045, shirtColor);
  addMesh(new THREE.SphereGeometry(0.055, 10, 8), skinColor, -0.34, 0.93, 0.105);
  addMesh(new THREE.SphereGeometry(0.055, 10, 8), skinColor, 0.34, 0.93, 0.105);

  // Head and ears
  addMesh(new THREE.SphereGeometry(0.235, 20, 18), skinColor, 0, 1.86, 0, 0.93, 1.08, 0.86);
  addMesh(new THREE.SphereGeometry(0.052, 12, 10), skinColor, -0.222, 1.83, 0, 1, 0.95, 0.7);
  addMesh(new THREE.SphereGeometry(0.052, 12, 10), skinColor, 0.222, 1.83, 0, 1, 0.95, 0.7);

  // Hair cap, locks and fringe
  addMesh(new THREE.SphereGeometry(0.242, 18, 14), hairColor, 0, 1.98, -0.018, 1.02, 0.56, 0.94);
  addMesh(new THREE.SphereGeometry(0.105, 12, 10), hairColor, -0.18, 1.87, 0.035, 0.72, 1.15, 0.7);
  addMesh(new THREE.SphereGeometry(0.105, 12, 10), hairColor, 0.18, 1.87, 0.035, 0.72, 1.15, 0.7);
  addMesh(new THREE.SphereGeometry(0.105, 12, 10), hairColor, -0.075, 2.005, 0.166, 1, 0.48, 0.45);
  addMesh(new THREE.SphereGeometry(0.095, 12, 10), hairColor, 0.055, 2.015, 0.166, 1, 0.45, 0.45);

  // Eyes
  [-1, 1].forEach(side => {
    addMesh(new THREE.SphereGeometry(0.047, 14, 12), 0xfff8ef, side * 0.082, 1.86, 0.188, 1, 0.82, 0.48);
    addMesh(new THREE.SphereGeometry(0.026, 12, 10), 0x5a3828, side * 0.078, 1.858, 0.211, 1, 1, 0.65);
    addMesh(new THREE.SphereGeometry(0.014, 10, 8), 0x17191d, side * 0.078, 1.858, 0.226);
    addMesh(new THREE.SphereGeometry(0.008, 8, 8), 0xffffff, side * 0.069, 1.87, 0.234);
    const brow = addMesh(new THREE.BoxGeometry(0.09, 0.022, 0.025), hairColor, side * 0.082, 1.93, 0.195);
    brow.rotation.z = side * -0.08;
  });

  // Nose and smile
  addMesh(new THREE.SphereGeometry(0.031, 12, 10), skinColor, 0, 1.805, 0.215, 0.78, 1.25, 0.8);
  addMesh(new THREE.SphereGeometry(0.026, 12, 10), skinColor, 0, 1.785, 0.232, 1, 0.7, 0.8);
  const smile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.052, 1.735, 0.202),
    new THREE.Vector3(0, 1.72, 0.216),
    new THREE.Vector3(0.052, 1.735, 0.202)
  ]);
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(smile, 8, 0.009, 5, false), mat(0x713b3b));
  g.add(mouth);

  return g;
}

export const Adventure3DScene: React.FC<Adventure3DSceneProps> = ({
  cityName,
  cityNumber = 1,
  totalCities = 15,
  regionName = 'España',
  accentColor = '#C60B1E',
  moduleName,
  landmarkName,
  stations,
  bossStation,
  exitGate,
  onBackToMap
}) => {
  const { progress } = useGame();
  const mountRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  // Toast message
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Dynamic distance and target tracking for quest HUD (matching reference image)
  const [nearestDistance, setNearestDistance] = useState<number>(12);
  const [nearestStation, setNearestStation] = useState<AdventureStation3D | null>(null);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [isMissionsCollapsed, setIsMissionsCollapsed] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastText(null), 2800);
  }, []);

  // Keyboard state
  const keysRef = useRef<Record<string, boolean>>({});

  // Mobile pad key press
  const handleTouchKey = (key: string, pressed: boolean) => {
    keysRef.current[key] = pressed;
  };

  // Convert player profile to colors - default to vibrant orange jacket & blue jeans matching reference image
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

  // Vibrant Spanish terracotta/orange jacket matching reference image
  const shirtHex = 0xe05615;
  // Deep navy blue trousers matching reference image
  const pantsHex = 0x24355a;

  // Stable references for dynamic props so the 3D WebGL scene never tears down during gameplay
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
    // Warm Spanish Dusk Sky matching user reference image
    scene.background = new THREE.Color(0xd97736);
    scene.fog = new THREE.Fog(0xb85b2e, 45, 115);
    scene.add(worldGroup);

    camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );

    // Warm Festive Golden Hour Lighting (matching user reference image)
    scene.add(new THREE.HemisphereLight(0xffcaa0, 0x854d0e, 1.15));
    const sun = new THREE.DirectionalLight(0xffecc0, 1.1);
    sun.position.set(16, 28, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -32,
      right: 32,
      top: 32,
      bottom: -32,
      far: 90
    });
    scene.add(sun);

    // Warm Central Lantern Glow Points (lighting the cobblestones like in the reference image)
    const lanternLight1 = new THREE.PointLight(0xff9933, 1.3, 36);
    lanternLight1.position.set(0, 5, 0);
    scene.add(lanternLight1);

    const lanternLight2 = new THREE.PointLight(0xff6622, 1.1, 30);
    lanternLight2.position.set(0, 4.5, -14);
    scene.add(lanternLight2);

    // Materials helper
    const mat = (c: number | string) => new THREE.MeshLambertMaterial({ color: c });
    const addBox = (w: number, h: number, d: number, c: number | string, x: number, y: number, z: number, p?: THREE.Group) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
      m.position.set(x, y + h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      (p || worldGroup).add(m);
      return m;
    };

    // Obstacles collision list: [x, z, radius]
    const obstacles: [number, number, number][] = [];

    // 1. Plaza ground - Warm terracotta red cobblestone pattern matching reference image
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0x8a3822));
    gr.rotation.x = -Math.PI / 2;
    worldGroup.add(gr);

    const plazaFloor = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), mat(0xc85a3b));
    plazaFloor.rotation.x = -Math.PI / 2;
    plazaFloor.position.y = 0.02;
    plazaFloor.receiveShadow = true;
    worldGroup.add(plazaFloor);

    // 1b. Hanging Festive String Lights & Glowing Farolillos (Crisscrossing the square)
    const lanternColors = [0xef4444, 0xfbbf24, 0xf97316, 0xef4444, 0xffffff, 0xfbbf24];
    [-10, 0, 10].forEach((sz, idx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-18, 5.5, sz - 6),
        new THREE.Vector3(-8, 4.3, sz - 2),
        new THREE.Vector3(0, 4.0, sz),
        new THREE.Vector3(8, 4.3, sz + 2),
        new THREE.Vector3(18, 5.5, sz + 6)
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
        const lanternMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), lanternMat);
        lanternMesh.position.set(pt.x, pt.y - 0.45, pt.z);
        worldGroup.add(lanternMesh);
      });
    });

    // 1c. Tapas Chalkboard sign easel next to front stall (matching reference)
    const easelGroup = new THREE.Group();
    const easelLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), mat(0x5c3317));
    easelLeg1.rotation.x = 0.2;
    easelLeg1.position.set(0, 0.7, -0.15);
    easelGroup.add(easelLeg1);
    const easelLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), mat(0x5c3317));
    easelLeg2.rotation.x = -0.2;
    easelLeg2.position.set(0, 0.7, 0.15);
    easelGroup.add(easelLeg2);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.06), mat(0x1a2e22));
    board.position.set(0, 0.8, 0);
    easelGroup.add(board);
    easelGroup.position.set(10.5, 0, -6);
    worldGroup.add(easelGroup);
    obstacles.push([10.5, -6, 0.8]);

    // Wine Barrels
    [[-8, 6], [-8.8, 5.2], [11.5, -4.5], [12.2, -5.5]].forEach(([bx, bz]) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.95, 10), mat(0x6b4423));
      barrel.position.set(bx, 0.48, bz);
      barrel.castShadow = true;
      worldGroup.add(barrel);
      obstacles.push([bx, bz, 0.6]);
    });

    // Red geranium flower planters along perimeter
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
      // Windows
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

    // 3. Cathedral Facade at North Plaza Head
    addBox(14, 12, 8, 0xd9c9a6, 0, 0, -27);
    [-5.5, 5.5].forEach(x => {
      addBox(4, 20, 4, 0xd9c9a6, x, 0, -27);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 5, 4), mat(0x5b6b74));
      cone.position.set(x, 22.5, -27);
      cone.castShadow = true;
      worldGroup.add(cone);
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8, 0, 6.3, 0, 1.57), mat(0x8fa0a6));
    dome.position.set(0, 12, -27);
    worldGroup.add(dome);

    // 4. Central Fountain
    const f1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.7, 20), mat(0xb8b0a0));
    f1.position.set(0, 0.35, -5);
    worldGroup.add(f1);
    const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8), mat(0xb8b0a0));
    f2.position.set(0, 1.2, -5);
    worldGroup.add(f2);
    const fWater = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.75, 20), mat(0x4fa8d8));
    fWater.position.set(0, 0.4, -5);
    worldGroup.add(fWater);
    obstacles.push([0, -5, 2.5]);

    // 5. Spanish Flagpole & Waving Flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 12, 8), mat(0xcccccc));
    pole.position.set(0, 6, -12);
    worldGroup.add(pole);

    const flagGroup = new THREE.Group();
    // Spanish flag red/yellow stripes
    const redStripe1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 0.05), new THREE.MeshBasicMaterial({ color: 0xc60b1e }));
    redStripe1.position.set(0, 0.8, 0);
    flagGroup.add(redStripe1);
    const yellowStripe = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.05), new THREE.MeshBasicMaterial({ color: 0xffc400 }));
    yellowStripe.position.set(0, 0, 0);
    flagGroup.add(yellowStripe);
    const redStripe2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 0.05), new THREE.MeshBasicMaterial({ color: 0xc60b1e }));
    redStripe2.position.set(0, -0.8, 0);
    flagGroup.add(redStripe2);
    flagGroup.position.set(1.8, 10.4, -12);
    worldGroup.add(flagGroup);

    // 6. Perimeter Trees
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

    // 7. Exit Gate at x = 22
    addBox(0.6, 5, 0.6, 0xc8b080, 22, 0, -2.6);
    addBox(0.6, 5, 0.6, 0xc8b080, 22, 0, 2.6);
    addBox(0.8, 0.8, 6, 0xc8b080, 22, 5, 0);

    const isGateOpen = Boolean(exitGate?.isUnlocked);
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

    // 8. 3D Market Stalls for each Station
    const stationElements: {
      id: string;
      station: AdventureStation3D;
      pos: { x: number; z: number };
      tagEl: HTMLDivElement;
    }[] = [];

    const tagsContainer = tagsContainerRef.current;
    if (tagsContainer) tagsContainer.innerHTML = '';

    stations.forEach((station) => {
      const x = station.x;
      const z = station.z;

      // Stall Group
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

    // 9. Boss Station / Grand Stage at North end of Plaza (matching reference image)
    let bossTagEl: HTMLDivElement | null = null;
    if (bossStation) {
      const bx = 0;
      const bz = -18;
      const stageGroup = new THREE.Group();

      // Elevated wooden stage platform
      addBox(14, 0.8, 6, 0x8a4522, bx, 0, bz, stageGroup);
      // Stage front steps
      addBox(6, 0.4, 1.2, 0xa5582e, bx, 0, bz + 3.6, stageGroup);
      // Grand Red Arch Backdrop
      addBox(14, 4.5, 0.4, 0x991b1b, bx, 0.8, bz - 2.8, stageGroup);
      // Golden Pillars
      [-6.8, -2.5, 2.5, 6.8].forEach(px => {
        addBox(0.4, 5.5, 0.4, 0xf59e0b, bx + px, 0.8, bz - 2.6, stageGroup);
      });
      // Archway Header Beam with Red Banner
      addBox(14.4, 1.4, 0.8, 0xb91c1c, bx, 5.3, bz - 2.4, stageGroup);

      // Musicians on stage (Guitarist + Singer)
      const guitarist = createPersonMesh(0xb45309, 0x1f2937, 0x111827, 0xdeb887);
      guitarist.position.set(bx - 2.8, 0.8, bz - 0.5);
      guitarist.rotation.y = 0.35;
      stageGroup.add(guitarist);

      const singer = createPersonMesh(0xc60b1e, 0x111827, 0x111827, 0xfce7f3);
      singer.position.set(bx + 2.8, 0.8, bz - 0.5);
      singer.rotation.y = -0.35;
      stageGroup.add(singer);

      // Grand Boss NPC in center of stage
      const bossChar = createPersonMesh(0xc60b1e, 0x1a1a2e, 0x1f2937, 0xe0b08a);
      bossChar.position.set(bx, 0.8, bz);
      bossChar.scale.set(1.2, 1.2, 1.2);
      stageGroup.add(bossChar);

      worldGroup.add(stageGroup);
      obstacles.push([bx, bz, 5.5]);

      bossTagEl = document.createElement('div');
      bossTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-opacity select-none';
      if (tagsContainer) tagsContainer.appendChild(bossTagEl);
    }

    // 9b. Dedicated Floating Quest Beacon Element (matching reference image)
    const targetBeaconEl = document.createElement('div');
    targetBeaconEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-all select-none z-20';
    if (tagsContainer) tagsContainer.appendChild(targetBeaconEl);

    // 9c. Flamenco dancer in red dress in front of the stage (matching reference)
    const flamencoDancer = createPersonMesh(0xbe123c, 0x0f172a, 0x881337, 0xfce7f3);
    flamencoDancer.position.set(6.2, 0, -11.5);
    flamencoDancer.rotation.y = -0.4;
    worldGroup.add(flamencoDancer);
    obstacles.push([6.2, -11.5, 1.2]);

    // 10. Gate Tag
    const gateTagEl = document.createElement('div');
    gateTagEl.className = 'absolute transform -translate-x-1/2 -translate-y-full text-center pointer-events-none transition-opacity select-none';
    if (tagsContainer) tagsContainer.appendChild(gateTagEl);

    // 11. Walking Pedestrians / Crowd AI
    interface Pedestrian {
      mesh: THREE.Group;
      tx: number;
      tz: number;
    }
    const pedestrians: Pedestrian[] = [];
    const pColors = [0x4d908e, 0xe09f3e, 0x457b9d, 0xd6577a, 0x6d597a, 0x588157];
    for (let k = 0; k < 6; k++) {
      const pm = createPersonMesh(
        pColors[k % pColors.length],
        [0x2a1a10, 0x302c2a, 0x8b552b][k % 3],
        0x343a40,
        [0xc58c5f, 0xe0b08a, 0x8d5a3b][k % 3]
      );
      const px = -8 + Math.random() * 26;
      const pz = -14 + Math.random() * 28;
      pm.position.set(px, 0, pz);
      worldGroup.add(pm);
      pedestrians.push({ mesh: pm, tx: px, tz: pz });
    }

    // 12. Playable 3D Player Character
    const playerMesh = createPersonMesh(shirtHex, hairHex, pantsHex, skinHex);
    scene.add(playerMesh);

    // Player position & angle state
    const playerPos = { x: -10, z: 0 };
    let playerAngle = -Math.PI / 2;

    // Mouse drag for camera rotation
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

    // Keyboard handlers. Normalize keys so E/e and Enter are handled consistently.
    // Ignore interaction hotkeys while the player is typing in a form control.
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
      // Keep compatibility with any movement code that checks the original key.
      keysRef.current[e.key] = true;

      if (typing || (key !== 'e' && key !== 'Enter' && key !== ' ')) return;
      e.preventDefault();

      // Match the same interaction radius used by the visible interaction prompt.
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

      // Boss interaction is available only when all prerequisite levels are complete.
      const currentBoss = bossStationRef.current;
      if (currentBoss) {
        const bossDistance = Math.hypot(playerPos.x, playerPos.z + 18);
        if (bossDistance < 4.2 && currentBoss.allLevelsDone && !currentBoss.isPassed) {
          currentBoss.onInteract();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keysRef.current[key] = false;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Helper to project 3D point to screen
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

    // Render Minimap Radar - Ornate Brass Compass (matching reference image)
    const drawMinimap = () => {
      const mmCanvas = minimapCanvasRef.current;
      if (!mmCanvas) return;
      const ctx = mmCanvas.getContext('2d');
      if (!ctx) return;

      const size = 112;
      const center = size / 2;
      const radius = 50;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      // Warm cobblestone dusk plaza background
      ctx.fillStyle = '#26140D';
      ctx.fillRect(0, 0, size, size);

      // Radial rings & compass lines
      ctx.strokeStyle = '#4A2A1A';
      ctx.lineWidth = 1;
      [18, 34, 48].forEach(r => {
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, size);
      ctx.moveTo(0, center);
      ctx.lineTo(size, center);
      ctx.stroke();

      // Coordinate converter (centered on player)
      const toMinimap = (wx: number, wz: number): [number, number] => {
        return [center + (wx - playerPos.x) * 2.2, center + (wz - playerPos.z) * 2.2];
      };

      // Draw fountain / plaza center
      const [fx, fz] = toMinimap(0, -5);
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(fx, fz, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw station pins with vibrant colors
      stations.forEach(s => {
        const [sx, sz] = toMinimap(s.x, s.z);
        ctx.fillStyle = s.status === 'completed' ? '#10B981' : s.status === 'unlocked' ? '#F59E0B' : '#64748B';
        ctx.beginPath();
        ctx.arc(sx, sz, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(sx, sz, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Exit Gate
      const [gx, gz] = toMinimap(22, 0);
      ctx.fillStyle = isGateOpen ? '#10B981' : '#EF4444';
      ctx.fillRect(gx - 3, gz - 4, 6, 8);

      // Draw player arrow in center (rotates with playerAngle)
      ctx.translate(center, center);
      ctx.rotate(-playerAngle);
      // Arrow shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      // Golden Arrow
      ctx.fillStyle = '#FBBF24';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // Main Animation Loop
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

      playerAngle += r * 2.2 * dt;

      let isMoving = false;
      if (f !== 0) {
        isMoving = true;
        const speed = (f > 0 ? 4.8 : 2.6) * dt * f;
        let nx = playerPos.x - Math.sin(playerAngle) * speed;
        let nz = playerPos.z - Math.cos(playerAngle) * speed;

        // Boundaries
        const boundLimit = (x: number, z: number) => (Math.abs(z) < 2.5 && x > 0 ? 23.5 : 20.5);
        nx = Math.max(-20.5, Math.min(boundLimit(nx, nz), nx));
        nz = Math.max(-20.5, Math.min(20.5, nz));

        // Obstacle collisions
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
          if (exitGate?.isUnlocked) {
            exitGate.onWalkThrough();
          } else {
            playerPos.x = 21.0;
            showToast('🚪 Completa todos los niveles y el boss para desbloquear el camino');
          }
        }
      }

      // Update Player Mesh position & rotation
      playerMesh.position.set(
        playerPos.x,
        isMoving ? Math.abs(Math.sin(totalTime * 9)) * 0.06 : 0,
        playerPos.z
      );
      playerMesh.rotation.y = playerAngle + Math.PI;

      // Camera follow lerp
      const camTargetX = playerPos.x + Math.sin(playerAngle) * 5.2;
      const camTargetZ = playerPos.z + Math.cos(playerAngle) * 5.2;
      camera.position.lerp(new THREE.Vector3(camTargetX, 3.2, camTargetZ), 1 - Math.exp(-9 * dt));
      camera.lookAt(playerPos.x, 1.7, playerPos.z);

      // Animate Flag
      flagGroup.rotation.y = Math.sin(totalTime * 2) * 0.25;

      // Animate Pedestrians Wander AI
      pedestrians.forEach(ped => {
        const dx = ped.tx - ped.mesh.position.x;
        const dz = ped.tz - ped.mesh.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.3) {
          ped.tx = -8 + Math.random() * 26;
          ped.tz = -14 + Math.random() * 28;
        } else {
          ped.mesh.position.x += (dx / d) * 1.5 * dt;
          ped.mesh.position.z += (dz / d) * 1.5 * dt;
          ped.mesh.rotation.y = Math.atan2(dx, dz);
          ped.mesh.position.y = Math.abs(Math.sin(totalTime * 8 + ped.tx)) * 0.05;
        }
      });

      // Update Floating HUD Tags
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
                ? `<button class="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg border border-white hover:scale-105 active:scale-95 transition-all">
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

      // Update Boss Tag
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
                  ? `<button class="mt-1 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs rounded-xl shadow-lg border border-white hover:scale-105 active:scale-95 transition-all">
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

      // Update Gate Tag
      const currentGate = exitGateRef.current;
      const isGateOpen = Boolean(currentGate?.isUnlocked);
      if (gateTagEl) {
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

      // Track nearest station & update beacon (matching user reference image)
      let minDist = 999;
      let closestStation: AdventureStation3D | null = null;
      for (const s of stationsRef.current) {
        const d = Math.hypot(playerPos.x - s.x, playerPos.z - s.z);
        if (d < minDist && s.status !== 'locked') {
          minDist = d;
          closestStation = s;
        }
      }

      // Update beacon element above closest station
      if (targetBeaconEl && closestStation) {
        const target = closestStation as AdventureStation3D;
        const mDistance = Math.max(1, Math.round(minDist * 1.5));
        targetBeaconEl.innerHTML = `
          <div class="pointer-events-auto flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 text-slate-950 font-black text-xs shadow-2xl border-2 border-white animate-bounce">
            <span class="w-4 h-4 rounded-full bg-black text-amber-300 flex items-center justify-center text-[10px] font-black">!</span>
            <span>${target.label || 'Organizadora de la Fiesta'}</span>
            <span class="text-amber-800 text-[10px] font-bold">• 📍 ${mDistance} m</span>
          </div>
        `;
        projectToScreen(target.x, 3.8, target.z, targetBeaconEl);
      }

      // Throttled state update for HUD
      if (Math.floor(totalTime * 4) !== Math.floor((totalTime - dt) * 4)) {
        setNearestDistance(Math.max(1, Math.round(minDist * 1.5)));
        setNearestStation(closestStation);
      }

      // Draw radar
      drawMinimap();

      // Render Scene
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup on unmount
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
  }, [accentColor, cityName, shirtHex, hairHex, pantsHex, skinHex]);

  const completedCount = stations.filter(s => s.status === 'completed').length;
  const totalStars = Object.values(progress.completedLevels).reduce((acc, lvl) => acc + (lvl.stars || 0), 0);

  return (
    <div className="relative w-full h-[680px] sm:h-[780px] rounded-3xl overflow-hidden border-4 border-amber-500/80 shadow-2xl bg-[#160B05] select-none">
      
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Projected Floating Tags Container */}
      <div ref={tagsContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* ========================================================
          1. TOP-LEFT HUD: BAROQUE CARVED HEADER PILL
          ======================================================== */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center space-x-2 sm:space-x-3 pointer-events-auto">
        <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-2xl bg-gradient-to-r from-[#FFFDF9]/95 via-[#FFF8EE]/95 to-[#FFEAD1]/95 border-2 border-amber-400 shadow-xl backdrop-blur-md">
          {/* Miniature landmark artwork */}
          <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-xl overflow-hidden border border-amber-300 shadow-xs shrink-0 bg-amber-100 flex items-center justify-center">
            <img src="/game-art/sevilla-landmark.png" alt="Monumento" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base md:text-lg font-black font-serif text-[#24140E] tracking-tight leading-none">
                {cityName || 'Sevilla'}
              </h1>
              <span className="text-sm sm:text-base leading-none">🇪🇸</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8C5A2B] leading-tight mt-0.5">
              {landmarkName || 'La Gran Fiesta'}
            </span>
          </div>
          {/* Time / Weather Capsule */}
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
                {completedCount}/20
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
              style={{ width: `${Math.round((completedCount / (stations.length || 20)) * 100)}%` }}
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

                {/* Checklist Objectives */}
                <div className="space-y-1 pt-1.5 border-t border-amber-600/30 text-[10px] font-bold text-[#3B291A]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-[#8C6239] inline-flex items-center justify-center text-[9px] bg-white/40">
                        {completedCount >= 1 ? '✓' : ''}
                      </span>
                      <span>Consigue las decoraciones</span>
                    </span>
                    <span className="font-mono">{Math.min(3, completedCount)}/3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-[#8C6239] inline-flex items-center justify-center text-[9px] bg-white/40">
                        {completedCount >= 2 ? '✓' : ''}
                      </span>
                      <span>Habla con los músicos</span>
                    </span>
                    <span className="font-mono">{completedCount >= 2 ? '2/2' : '0/2'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-[#8C6239] inline-flex items-center justify-center text-[9px] bg-white/40">
                        {completedCount >= 3 ? '✓' : ''}
                      </span>
                      <span>Prueba una tapa típica</span>
                    </span>
                    <span className="font-mono">{completedCount >= 3 ? '1/1' : '0/1'}</span>
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
        {/* Vertical Stack Action Buttons: Mapa & Inventario */}
        <div className="flex flex-col space-y-2">
          {/* 🗺️ Mapa (M) */}
          <button
            onClick={onBackToMap}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2B1108]/95 to-[#160703]/95 border-2 border-amber-400/80 text-amber-200 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            title="Abrir mapa de España (M)"
          >
            <span className="text-base leading-none">🗺️</span>
            <span className="text-[9px] font-black leading-tight mt-0.5">Mapa</span>
            <span className="text-[8px] text-amber-400 font-mono opacity-80">(M)</span>
          </button>

          {/* 🎒 Inventario (1) */}
          <button
            onClick={() => setShowInventory(!showInventory)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2B1108]/95 to-[#160703]/95 border-2 border-amber-400/80 text-amber-200 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            title="Abrir inventario y estado (I)"
          >
            <span className="text-base leading-none">🎒</span>
            <span className="text-[8px] font-black leading-tight mt-0.5">Inventario</span>
            <span className="text-[8px] text-amber-400 font-mono opacity-80">(1)</span>
          </button>
        </div>

        {/* Ornate Brass Minimap with Compass Points */}
        <div className="relative p-1 rounded-full border-4 border-amber-500 shadow-2xl bg-[#1C0D07]">
          {/* Cardinal Points */}
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
        {/* Carmen Avatar Circle with Red Flower */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-amber-400 shadow-2xl overflow-hidden shrink-0 bg-amber-900 ring-2 ring-amber-600/50">
          <img 
            src="/game-art/guide-carmen.png" 
            alt="Guía Carmen" 
            className="w-full h-full object-cover" 
          />
        </div>
        {/* Parchment Speech Bubble */}
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

      {/* ========================================================
          6. BOTTOM-RIGHT HUD: LANDMARK BUTTON
          ======================================================== */}
      <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 pointer-events-auto">
        <button
          onClick={() => bossStation?.onInteract ? bossStation.onInteract() : onBackToMap()}
          className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF4EA] to-[#F5E8D3] hover:from-white hover:to-amber-100 border-2 border-amber-400 text-[#78350F] font-black text-xs sm:text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="text-base">🏛️</span>
          <span className="font-serif">Real Academia & Puestos</span>
          <ChevronRight className="w-4 h-4 text-[#E05615]" />
        </button>
      </div>

      {/* ========================================================
          7. INVENTORY MODAL (Toggled by "I" key or backpack icon)
          ======================================================== */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#2B1108] via-[#1E0B05] to-[#160703] border-3 border-amber-500 rounded-3xl p-5 text-amber-100 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎒</span>
                <h3 className="font-serif font-black text-base text-amber-300">Mochila del Aventurero</h3>
              </div>
              <button
                onClick={() => setShowInventory(false)}
                className="p-1 rounded-full hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-bold">Monedas</span>
                <span className="text-sm font-black text-amber-200">{progress.stats.coins.toLocaleString()} 🪙</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-rose-400 block font-bold">Vidas</span>
                <span className="text-sm font-black text-rose-300">{progress.stats.lives}/3 ❤️</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-bold">Estrellas</span>
                <span className="text-sm font-black text-amber-200">{totalStars} ⭐</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[10px] text-orange-400 block font-bold">Racha</span>
                <span className="text-sm font-black text-orange-300">{progress.stats.streak} días 🔥</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold text-amber-300 block mb-0.5">📜 Pasaporte de Viaje:</span>
              Has completado {completedCount} de {stations.length} estaciones en {cityName}.
            </div>

            <button
              onClick={() => setShowInventory(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Cerrar Mochila
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-5 py-2.5 rounded-2xl bg-white/95 border-2 border-amber-400 text-[#24140E] font-black text-sm shadow-2xl backdrop-blur-md animate-bounceIn z-30 pointer-events-none">
          {toastText}
        </div>
      )}

    </div>
  );
};
