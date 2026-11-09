import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  HabitLevel,
  HeroId,
  MovementMode,
  WeaponType,
  AvatarProfile,
  VillainArchetype,
} from '../types/game';
import { HERO_DUO } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import {
  Hero3DPortrait,
  Villain3DPortrait,
  Referee3DPortrait,
} from './CharacterCardVisuals';
import {
  RotateCcw,
  Sparkles,
  ChevronRight,
  Crosshair,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Car,
  Plane,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Heart,
  LogOut,
  Droplets,
  BookOpen,
  Info,
} from 'lucide-react';

const ORB_GEOMETRY = new THREE.SphereGeometry(0.42, 12, 12);
const WATER_DROP_GEOMETRY = new THREE.SphereGeometry(0.28, 10, 10);
const BOMB_GEOMETRY = new THREE.DodecahedronGeometry(0.48, 0);
const PARTICLE_GEOMETRY = new THREE.SphereGeometry(0.16, 6, 6);

function disposeMeshMaterial(mesh: THREE.Object3D) {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
}

interface ThreeGameArenaProps {
  level: HabitLevel;
  playerCoins?: number;
  avatar?: AvatarProfile;
  onAddCoins?: (amount: number) => void;
  onAddGreenCard?: () => void;
  onLevelComplete: (levelId: number, coins: number, power: number, badge: string) => void;
  onExitArena: () => void;
}

interface CollectibleItem3D {
  mesh: THREE.Group;
  threatGroup: THREE.Group;
  restoredGroup: THREE.Group;
  ringMesh: THREE.Mesh;
  collected: boolean;
  x: number;
  z: number;
  kind: 'basura' | 'tala' | 'hambre' | 'violencia';
}

interface ActiveProjectile {
  mesh: THREE.Object3D;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  damage: number;
  type: 'water' | 'light' | 'lightning' | 'fireball' | 'trash_bomb';
  isEnemy?: boolean;
}

interface SplashParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export const ThreeGameArena: React.FC<ThreeGameArenaProps> = ({
  level,
  onAddCoins = () => {},
  onAddGreenCard = () => {},
  onLevelComplete,
  onExitArena,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const onAddCoinsRef = useRef(onAddCoins);
  onAddCoinsRef.current = onAddCoins;
  const onAddGreenCardRef = useRef(onAddGreenCard);
  onAddGreenCardRef.current = onAddGreenCard;

  const [activeHero, setActiveHero] = useState<HeroId>('richard');
  const [movementMode, setMovementMode] = useState<MovementMode>('on_foot');
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('water_cannon');

  const [pearlsTeleport, setPearlsTeleport] = useState<number>(3);
  const [pearlsSpeed, setPearlsSpeed] = useState<number>(3);
  const [matchGreenCards, setMatchGreenCards] = useState<number>(1);

  const [hudHp, setHudHp] = useState<number>(100);
  const [hudBossHp, setHudBossHp] = useState<number>(level.villainHp);
  const [hudBossShield, setHudBossShield] = useState<number>(
    level.villainPowers.includes('escudo_oscuro') ? 100 : 0
  );
  const [hudObjectives, setHudObjectives] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isDefeat, setIsDefeat] = useState<boolean>(false);
  const [showStoryIntro, setShowStoryIntro] = useState<boolean>(true);
  const [refereeCall, setRefereeCall] = useState<string>(
    level.habitCategory === 'no_tala'
      ? 'Usa tu Arma de Agua [K] para frenar la tala'
      : level.habitCategory === 'recoger_basura'
      ? 'Dispara agua [K] contra el Basurote'
      : level.habitActionName
  );
  const [soundOn, setSoundOn] = useState<boolean>(soundEffects.enabled);
  const [showTriviaModal, setShowTriviaModal] = useState<boolean>(false);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [triviaResult, setTriviaResult] = useState<'correct' | 'wrong' | null>(null);
  const [coinRewardToast, setCoinRewardToast] = useState<string | null>(null);

  const muscleScale = 1.0 + Math.min(0.75, (level.id - 1) * 0.05);

  const resolvedArchetype: VillainArchetype =
    level.villainArchetype ||
    (level.habitCategory === 'recoger_basura'
      ? 'basurote'
      : level.habitCategory === 'no_tala'
      ? 'talador'
      : level.habitCategory === 'cero_hambre'
      ? 'acaparador'
      : 'maton');

  const engineRef = useRef({
    gameActive: true,
    activeHero: 'richard' as HeroId,
    movementMode: 'on_foot' as MovementMode,
    activeWeapon: 'water_cannon' as WeaponType,
    heroPos: { x: 0, y: 0, z: 9 },
    heroRot: Math.PI,
    carSpeed: 0,
    isNitroBoost: false,
    nitroTimer: 0,
    isShieldActive: false,
    shieldTimer: 0,
    heroHp: 100,
    bossPos: { x: 0, z: -13 },
    bossHp: level.villainHp,
    bossMaxHp: level.villainHp,
    bossShield: level.villainPowers.includes('escudo_oscuro') ? 100 : 0,
    bossAttackTimer: 0,
    bossFlashTimer: 0,
    objectivesCount: level.objectiveCount,
    objectivesDone: 0,
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      up: false,
      down: false,
      left: false,
      right: false,
    },
    touchDir: { x: 0, z: 0 },
    collectibles: [] as CollectibleItem3D[],
    projectiles: [] as ActiveProjectile[],
    particles: [] as SplashParticle[],
    scene: null as THREE.Scene | null,
    heroGroup: null as THREE.Group | null,
    guideArrowGroup: null as THREE.Group | null,
    refereeGroup: null as THREE.Group | null,
    carMesh: null as THREE.Group | null,
    jetpackMesh: null as THREE.Group | null,
    bossMesh: null as THREE.Group | null,
    bossMaterial: null as THREE.MeshStandardMaterial | null,
    bossShieldMesh: null as THREE.Mesh | null,
    bossSawMesh: null as THREE.Object3D | null,
    shieldMesh: null as THREE.Mesh | null,
    torsoMesh: null as THREE.Mesh | null,
    armsMesh: [] as THREE.Mesh[],
    legsMesh: [] as THREE.Mesh[],
    metrocableGroup: null as THREE.Group | null,
    cloudsGroup: null as THREE.Group | null,
  });

  const actionsRef = useRef({
    onSwapHero: () => {},
    onToggleVehicle: () => {},
    onToggleFlight: () => {},
    onAttack: () => {},
    onUseTeleportPearl: () => {},
    onUseSpeedPearl: () => {},
    onCollect: () => {},
  });

  const triggerCoinToast = useCallback((text: string) => {
    setCoinRewardToast(text);
    setTimeout(() => setCoinRewardToast(null), 1800);
  }, []);

  const awardGreenCard = useCallback((msg: string) => {
    soundEffects.playGreenCardSound();
    setMatchGreenCards((c) => c + 1);
    onAddGreenCardRef.current();
    setRefereeCall(msg);
  }, []);

  const spawnSplashBurst = useCallback((x: number, y: number, z: number, colorHex: number, count = 10) => {
    const eng = engineRef.current;
    if (!eng.scene) return;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const m = new THREE.Mesh(PARTICLE_GEOMETRY, mat);
      m.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.08 + Math.random() * 0.22;
      eng.scene.add(m);
      eng.particles.push({
        mesh: m,
        vx: Math.cos(angle) * spd,
        vy: 0.12 + Math.random() * 0.22,
        vz: Math.sin(angle) * spd,
        life: 22 + Math.floor(Math.random() * 12),
      });
    }
  }, []);

  const completeObjectiveItem = useCallback(
    (item: CollectibleItem3D, viaWaterCannon = false) => {
      const eng = engineRef.current;
      if (item.collected || !eng.gameActive) return;

      item.collected = true;
      item.threatGroup.visible = false;
      item.restoredGroup.visible = true;
      (item.ringMesh.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);

      eng.objectivesDone += 1;
      setHudObjectives(eng.objectivesDone);
      onAddCoinsRef.current(150);

      spawnSplashBurst(item.x, 1.2, item.z, viaWaterCannon ? 0x06b6d4 : 0x10b981, 14);
      soundEffects.playCollectSound();

      if (item.kind === 'tala') {
        triggerCoinToast('🌳 Árbol protegido de la tala +150 🪙');
        awardGreenCard(`Árbol a salvo (${eng.objectivesDone}/${eng.objectivesCount}) 🟩`);
      } else if (item.kind === 'basura') {
        triggerCoinToast('♻️ Basura limpiada +150 🪙');
        awardGreenCard(`Lugar limpio (${eng.objectivesDone}/${eng.objectivesCount}) 🟩`);
      } else if (item.kind === 'hambre') {
        triggerCoinToast('🌽 Huerta regada +150 🪙');
        awardGreenCard(`Cero Hambre (${eng.objectivesDone}/${eng.objectivesCount}) 🟩`);
      } else {
        triggerCoinToast('🕊️ Convivencia en Paz +150 🪙');
        awardGreenCard(`Cero Violencia (${eng.objectivesDone}/${eng.objectivesCount}) 🟩`);
      }

      if (eng.objectivesDone >= eng.objectivesCount && eng.bossShield > 0) {
        eng.bossShield = 0;
        setHudBossShield(0);
        if (eng.bossShieldMesh) eng.bossShieldMesh.visible = false;
        setRefereeCall(`¡Escudo roto! Dispara tu Cañón de Agua [K]`);
      }
    },
    [awardGreenCard, spawnSplashBurst, triggerCoinToast]
  );

  const handleSwapHero = useCallback(() => {
    const nextHero: HeroId = activeHero === 'richard' ? 'juan' : 'richard';
    setActiveHero(nextHero);
    engineRef.current.activeHero = nextHero;
    soundEffects.playSwitchHeroSound();

    const char = HERO_DUO[nextHero];
    if (engineRef.current.torsoMesh) {
      (engineRef.current.torsoMesh.material as THREE.MeshStandardMaterial).color.set(
        char.primaryColor
      );
    }
    engineRef.current.armsMesh.forEach((arm) => {
      (arm.material as THREE.MeshStandardMaterial).color.set(char.secondaryColor);
    });

    setRefereeCall(`Entra ${char.name} 💧`);
  }, [activeHero]);

  const handleToggleVehicle = useCallback(() => {
    const eng = engineRef.current;
    if (eng.movementMode === 'in_vehicle') {
      eng.movementMode = 'on_foot';
      setMovementMode('on_foot');
      if (eng.carMesh) eng.carMesh.visible = false;
      if (eng.heroGroup) eng.heroGroup.position.y = 0;
      soundEffects.playClickSound();
      setRefereeCall('A pie');
    } else {
      eng.movementMode = 'in_vehicle';
      setMovementMode('in_vehicle');
      if (eng.carMesh) eng.carMesh.visible = true;
      if (eng.jetpackMesh) eng.jetpackMesh.visible = false;
      soundEffects.playCarEngineSound();
      setRefereeCall('🚗 Eco-Auto activo');
    }
  }, []);

  const handleToggleFlight = useCallback(() => {
    const eng = engineRef.current;
    if (eng.movementMode === 'flying') {
      eng.movementMode = 'on_foot';
      setMovementMode('on_foot');
      if (eng.jetpackMesh) eng.jetpackMesh.visible = false;
      eng.heroPos.y = 0;
      soundEffects.playClickSound();
      setRefereeCall('Aterrizaje suave');
    } else {
      eng.movementMode = 'flying';
      setMovementMode('flying');
      if (eng.carMesh) eng.carMesh.visible = false;
      if (eng.jetpackMesh) eng.jetpackMesh.visible = true;
      eng.heroPos.y = 3.8;
      soundEffects.playJetpackSound();
      setRefereeCall('✈️ Modo Vuelo activo');
    }
  }, []);

  const handleUseTeleportPearl = useCallback(() => {
    if (pearlsTeleport <= 0) return;
    const eng = engineRef.current;
    setPearlsTeleport((p) => p - 1);
    soundEffects.playTeleportSound();

    const forwardX = Math.sin(eng.heroRot);
    const forwardZ = Math.cos(eng.heroRot);
    eng.heroPos.x += forwardX * 12;
    eng.heroPos.z += forwardZ * 12;

    const bound = 25;
    eng.heroPos.x = Math.max(-bound, Math.min(bound, eng.heroPos.x));
    eng.heroPos.z = Math.max(-bound, Math.min(bound, eng.heroPos.z));

    spawnSplashBurst(eng.heroPos.x, 1.5, eng.heroPos.z, 0xa855f7, 12);
    setRefereeCall('🔮 Teletransporte');
  }, [pearlsTeleport, spawnSplashBurst]);

  const handleUseSpeedPearl = useCallback(() => {
    if (pearlsSpeed <= 0) return;
    const eng = engineRef.current;
    setPearlsSpeed((p) => p - 1);
    eng.isNitroBoost = true;
    eng.nitroTimer = 180;
    soundEffects.playSpeedBoostSound();
    setRefereeCall('⚡ Turbo activo');
  }, [pearlsSpeed]);

  const handleAttack = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.gameActive || !eng.scene) return;

    if (activeWeapon === 'bat') {
      soundEffects.playBatSwingSound();
      for (const item of eng.collectibles) {
        if (!item.collected && Math.hypot(item.x - eng.heroPos.x, item.z - eng.heroPos.z) < 5.0) {
          completeObjectiveItem(item, false);
        }
      }

      const dist = Math.hypot(eng.bossPos.x - eng.heroPos.x, eng.bossPos.z - eng.heroPos.z);
      if (dist < 6.0) {
        const dmg = Math.round(65 * muscleScale);
        if (eng.bossShield > 0) {
          eng.bossShield = Math.max(0, eng.bossShield - dmg);
          setHudBossShield(eng.bossShield);
          if (eng.bossShield <= 0 && eng.bossShieldMesh) eng.bossShieldMesh.visible = false;
        } else {
          eng.bossHp = Math.max(0, eng.bossHp - dmg);
          eng.bossFlashTimer = 6;
          soundEffects.playBossHurtSound();
          setHudBossHp(eng.bossHp);

          if (eng.bossHp <= 0) {
            eng.gameActive = false;
            setIsVictory(true);
            onAddCoinsRef.current(250);
            soundEffects.playVictoryFanfare();
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          }
        }
      }
      return;
    }

    if (activeWeapon === 'shield') {
      soundEffects.playClickSound();
      eng.isShieldActive = true;
      eng.shieldTimer = 100;
      if (eng.shieldMesh) eng.shieldMesh.visible = true;
      setRefereeCall('🛡️ Escudo protector');
      return;
    }

    let targetX = eng.bossPos.x;
    let targetZ = eng.bossPos.z;
    const distToBoss = Math.hypot(eng.bossPos.x - eng.heroPos.x, eng.bossPos.z - eng.heroPos.z);

    let nearestItemDist = 999;
    let nearestItem: CollectibleItem3D | null = null;
    for (const item of eng.collectibles) {
      if (!item.collected) {
        const d = Math.hypot(item.x - eng.heroPos.x, item.z - eng.heroPos.z);
        if (d < nearestItemDist) {
          nearestItemDist = d;
          nearestItem = item;
        }
      }
    }

    if (nearestItem && nearestItemDist < 11 && nearestItemDist < distToBoss * 0.85) {
      targetX = nearestItem.x;
      targetZ = nearestItem.z;
    }

    let colorHex = 0x06b6d4;
    let dmg = Math.round(52 * muscleScale);
    let pType: ActiveProjectile['type'] = 'water';

    if (activeWeapon === 'water_cannon') {
      soundEffects.playWaterStreamSound();
      colorHex = 0x06b6d4;
      dmg = Math.round(62 * muscleScale);
      pType = 'water';
    } else if (activeWeapon === 'lightning_staff') {
      soundEffects.playLightningSound();
      colorHex = 0x38bdf8;
      dmg = Math.round(56 * muscleScale);
      pType = 'lightning';
    } else if (activeWeapon === 'fire_orb') {
      soundEffects.playFireballSound();
      colorHex = 0xf97316;
      dmg = Math.round(58 * muscleScale);
      pType = 'fireball';
    } else {
      soundEffects.playLightBeamSound();
      colorHex = 0xfacc15;
      dmg = Math.round(54 * muscleScale);
      pType = 'light';
    }

    const dx = targetX - eng.heroPos.x;
    const dz = targetZ - eng.heroPos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const speed = 0.95;

    eng.heroRot = Math.atan2(dx, dz);

    if (pType === 'water') {
      for (let w = 0; w < 3; w++) {
        const dropMat = new THREE.MeshStandardMaterial({
          color: w === 0 ? 0x06b6d4 : 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.7,
          roughness: 0.1,
        });
        const dropMesh = new THREE.Mesh(w === 0 ? ORB_GEOMETRY : WATER_DROP_GEOMETRY, dropMat);
        const offsetBack = w * 0.65;
        dropMesh.position.set(
          eng.heroPos.x - (dx / dist) * offsetBack,
          (eng.heroPos.y || 0) + 1.35 + (w === 1 ? 0.12 : 0),
          eng.heroPos.z - (dz / dist) * offsetBack
        );
        eng.scene.add(dropMesh);

        eng.projectiles.push({
          mesh: dropMesh,
          vx: (dx / dist) * speed,
          vy: 0,
          vz: (dz / dist) * speed,
          life: 58,
          damage: w === 0 ? dmg : Math.round(dmg * 0.25),
          type: 'water',
        });
      }
    } else {
      const orbMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const orbMesh = new THREE.Mesh(ORB_GEOMETRY, orbMat);
      orbMesh.position.set(eng.heroPos.x, (eng.heroPos.y || 0) + 1.35, eng.heroPos.z);
      eng.scene.add(orbMesh);

      eng.projectiles.push({
        mesh: orbMesh,
        vx: (dx / dist) * speed,
        vy: 0,
        vz: (dz / dist) * speed,
        life: 55,
        damage: dmg,
        type: pType,
      });
    }
  }, [activeWeapon, completeObjectiveItem, muscleScale]);

  const handleCollect = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.gameActive) return;

    for (const item of eng.collectibles) {
      if (!item.collected) {
        const dist = Math.hypot(item.x - eng.heroPos.x, item.z - eng.heroPos.z);
        if (dist < 5.2) {
          completeObjectiveItem(item, false);
          return;
        }
      }
    }
  }, [completeObjectiveItem]);

  useEffect(() => {
    actionsRef.current = {
      onSwapHero: handleSwapHero,
      onToggleVehicle: handleToggleVehicle,
      onToggleFlight: handleToggleFlight,
      onAttack: handleAttack,
      onUseTeleportPearl: handleUseTeleportPearl,
      onUseSpeedPearl: handleUseSpeedPearl,
      onCollect: handleCollect,
    };
  }, [
    handleSwapHero,
    handleToggleVehicle,
    handleToggleFlight,
    handleAttack,
    handleUseTeleportPearl,
    handleUseSpeedPearl,
    handleCollect,
  ]);

  // INITIALIZE 3D WORLD
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    soundEffects.playClickSound();

    const eng = engineRef.current;
    eng.gameActive = true;
    eng.heroHp = 100;
    eng.bossHp = level.villainHp;
    eng.bossMaxHp = level.villainHp;
    eng.bossShield = level.villainPowers.includes('escudo_oscuro') ? 100 : 0;
    eng.heroPos = { x: 0, y: 0, z: 9 };
    eng.bossPos = { x: 0, z: -13 };
    eng.objectivesDone = 0;
    eng.particles = [];

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    eng.scene = scene;

    let skyHex = 0x7dd3fc;
    let groundColor = 0x22c55e;
    let pathColor = 0xe2e8f0;

    if (level.biome === 'bosque_arvi' || level.biome === 'jardin_guayacanes') {
      skyHex = 0x67e8f9;
      groundColor = 0x16a34a;
      pathColor = 0xd6d3d1;
    } else if (level.biome === 'comuna_paz' || level.biome === 'ciudad_metro') {
      skyHex = 0x93c5fd;
      groundColor = 0x4ade80;
      pathColor = 0xcbd5e1;
    } else if (level.biome === 'huerta_solidaria') {
      skyHex = 0xfde68a;
      groundColor = 0x65a30d;
      pathColor = 0xd97706;
    } else if (level.biome === 'rio_medellin' || level.biome === 'guatape_embalse') {
      skyHex = 0x38bdf8;
      groundColor = 0x10b981;
      pathColor = 0x0284c7;
    } else if (level.biome === 'paramo_andino') {
      skyHex = 0xbae6fd;
      groundColor = 0x4d7c0f;
      pathColor = 0x94a3b8;
    } else if (level.biome === 'cumbre_colombia') {
      skyHex = 0xfef08a;
      groundColor = 0x15803d;
      pathColor = 0xfacc15;
    }

    scene.background = new THREE.Color(skyHex);
    scene.fog = new THREE.FogExp2(skyHex, 0.009);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 220);
    camera.position.set(0, 13, 23);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, groundColor, 0.95);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    sunLight.position.set(22, 36, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    sunOrb.position.set(35, 38, -48);
    scene.add(sunOrb);

    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    for (let c = 0; c < 7; c++) {
      const cg = new THREE.Group();
      const p1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 10), cloudMat);
      const p2 = new THREE.Mesh(new THREE.SphereGeometry(1.7, 10, 10), cloudMat);
      p2.position.set(1.8, -0.3, 0.2);
      cg.add(p1, p2);
      cg.position.set((c - 3) * 18, 20 + (c % 3) * 3, -32 - (c % 2) * 12);
      cloudsGroup.add(cg);
    }
    scene.add(cloudsGroup);
    eng.cloudsGroup = cloudsGroup;

    const groundSize = 84;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.88 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const plazaMesh = new THREE.Mesh(
      new THREE.CircleGeometry(14, 32),
      new THREE.MeshStandardMaterial({
        color: pathColor,
        roughness: 0.75,
      })
    );
    plazaMesh.rotation.x = -Math.PI / 2;
    plazaMesh.position.set(0, 0.03, -2);
    plazaMesh.receiveShadow = true;
    scene.add(plazaMesh);

    // Mountains
    const mountainPositions = [
      { x: -34, z: -38, r: 18, h: 24, c: 0x15803d },
      { x: -12, z: -42, r: 22, h: 28, c: 0x166534 },
      { x: 16, z: -40, r: 20, h: 26, c: 0x15803d },
      { x: 36, z: -36, r: 17, h: 22, c: 0x14532d },
    ];
    mountainPositions.forEach((mp) => {
      const mtn = new THREE.Mesh(
        new THREE.ConeGeometry(mp.r, mp.h, 6),
        new THREE.MeshStandardMaterial({ color: mp.c, roughness: 0.9 })
      );
      mtn.position.set(mp.x, mp.h / 2 - 1, mp.z);
      scene.add(mtn);
    });

    // Metrocable
    const metrocableGroup = new THREE.Group();
    const cableLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 76, 6),
      new THREE.MeshBasicMaterial({ color: 0x334155 })
    );
    cableLine.rotation.z = Math.PI / 2;
    cableLine.position.set(0, 16.5, -24);
    scene.add(cableLine);

    const cabinBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.3 })
    );
    metrocableGroup.add(cabinBody);
    metrocableGroup.position.set(-18, 15.0, -24);
    scene.add(metrocableGroup);
    eng.metrocableGroup = metrocableGroup;

    // Referee
    const refereeGroup = new THREE.Group();
    const refTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    refTorso.position.y = 1.15;
    refereeGroup.add(refTorso);

    const refHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xfde68a })
    );
    refHead.position.y = 2.0;
    refereeGroup.add(refHead);

    refereeGroup.position.set(-6.5, 0.4, 5);
    scene.add(refereeGroup);
    eng.refereeGroup = refereeGroup;

    // Hero Model
    const heroGroup = new THREE.Group();
    eng.heroGroup = heroGroup;
    const char = HERO_DUO[eng.activeHero];

    const torsoW = 1.0 * muscleScale;
    const torsoD = 0.62 * muscleScale;
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(torsoW, 1.25, torsoD),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(char.primaryColor),
        metalness: 0.3,
        roughness: 0.4,
      })
    );
    torso.position.y = 1.35;
    torso.castShadow = true;
    heroGroup.add(torso);
    eng.torsoMesh = torso;

    const hydroTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.95, 12),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
      })
    );
    hydroTank.position.set(0, 1.42, -(torsoD / 2 + 0.22));
    heroGroup.add(hydroTank);

    const armW = 0.34 * muscleScale;
    const armGeo = new THREE.BoxGeometry(armW, 0.85, armW);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(char.secondaryColor) });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-(torsoW / 2 + armW / 2 + 0.05), 1.3, 0);
    heroGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(torsoW / 2 + armW / 2 + 0.05, 1.3, 0);

    const cannonBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.17, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 })
    );
    cannonBarrel.rotation.x = Math.PI / 2;
    cannonBarrel.position.set(0, -0.15, 0.45);
    armR.add(cannonBarrel);

    heroGroup.add(armR);
    eng.armsMesh = [armL, armR];

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfdba74 })
    );
    head.position.y = 2.25;
    heroGroup.add(head);

    const legGeo = new THREE.BoxGeometry(0.34, 0.85, 0.36);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.26, 0.45, 0);
    heroGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.26, 0.45, 0);
    heroGroup.add(legR);
    eng.legsMesh = [legL, legR];

    const jetpackGroup = new THREE.Group();
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.4), wingMat);
    wingL.position.set(-1.0, 1.5, -0.3);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.4), wingMat);
    wingR.position.set(1.0, 1.5, -0.3);
    jetpackGroup.add(wingL, wingR);
    jetpackGroup.visible = false;
    heroGroup.add(jetpackGroup);
    eng.jetpackMesh = jetpackGroup;

    const shieldDome = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      })
    );
    shieldDome.position.y = 1.3;
    shieldDome.visible = false;
    heroGroup.add(shieldDome);
    eng.shieldMesh = shieldDome;

    heroGroup.position.set(0, 0, 9);
    scene.add(heroGroup);

    // Guide Arrow
    const guideArrowGroup = new THREE.Group();
    const arrowCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.0, 8),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    arrowCone.rotation.x = Math.PI / 2;
    arrowCone.position.z = 1.7;
    guideArrowGroup.add(arrowCone);
    guideArrowGroup.position.set(0, 0.6, 9);
    scene.add(guideArrowGroup);
    eng.guideArrowGroup = guideArrowGroup;

    // Eco-Auto
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.8, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.5, roughness: 0.3 })
    );
    carBody.position.y = 0.7;
    carGroup.add(carBody);
    carGroup.visible = false;
    scene.add(carGroup);
    eng.carMesh = carGroup;

    // Boss Model
    const bossGroup = new THREE.Group();
    const bossMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(level.villainColor),
      roughness: 0.45,
    });
    eng.bossMaterial = bossMat;

    if (resolvedArchetype === 'basurote') {
      const canBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.4, 3.1, 14),
        bossMat
      );
      canBody.position.y = 1.9;
      bossGroup.add(canBody);

      const lidMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.9, 1.9, 0.3, 14),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      lidMesh.position.y = 3.7;
      bossGroup.add(lidMesh);
      eng.bossSawMesh = lidMesh;
    } else {
      const bTorso = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.8, 1.8), bossMat);
      bTorso.position.y = 2.3;
      bossGroup.add(bTorso);

      const bHead = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.3, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      bHead.position.y = 4.1;
      bossGroup.add(bHead);
      eng.bossSawMesh = null;
    }

    if (level.villainPowers.includes('escudo_oscuro')) {
      const dShield = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 14, 14),
        new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        })
      );
      dShield.position.y = 2.4;
      bossGroup.add(dShield);
      eng.bossShieldMesh = dShield;
    }

    bossGroup.position.set(0, 0, -13);
    scene.add(bossGroup);
    eng.bossMesh = bossGroup;

    // Collectibles
    const collectibles: CollectibleItem3D[] = [];
    eng.collectibles = collectibles;

    const itemKind: CollectibleItem3D['kind'] =
      level.habitCategory === 'no_tala'
        ? 'tala'
        : level.habitCategory === 'recoger_basura'
        ? 'basura'
        : level.habitCategory === 'cero_hambre'
        ? 'hambre'
        : 'violencia';

    for (let i = 0; i < level.objectiveCount; i++) {
      const rootGroup = new THREE.Group();
      const threatGroup = new THREE.Group();
      const restoredGroup = new THREE.Group();
      restoredGroup.visible = false;

      const ringMat = new THREE.MeshBasicMaterial({
        color: itemKind === 'tala' ? 0xf59e0b : itemKind === 'basura' ? 0x84cc16 : 0x38bdf8,
      });
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 20), ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.08;
      rootGroup.add(ringMesh);

      if (itemKind === 'tala') {
        const stumpTrunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.26, 0.34, 1.6, 8),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        stumpTrunk.position.y = 0.8;
        threatGroup.add(stumpTrunk);

        const smallCrown = new THREE.Mesh(
          new THREE.ConeGeometry(0.9, 1.6, 8),
          new THREE.MeshStandardMaterial({ color: 0x65a30d })
        );
        smallCrown.position.y = 1.9;
        threatGroup.add(smallCrown);

        const tallTrunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.45, 2.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        tallTrunk.position.y = 1.2;
        restoredGroup.add(tallTrunk);

        const lushCrown = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.4, 1),
          new THREE.MeshStandardMaterial({ color: 0x10b981 })
        );
        lushCrown.position.y = 2.8;
        restoredGroup.add(lushCrown);
      } else {
        const threatSphere = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.6, 0),
          new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        threatSphere.position.y = 0.6;
        threatGroup.add(threatSphere);

        const bloom = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4 })
        );
        bloom.position.y = 0.9;
        restoredGroup.add(bloom);
      }

      rootGroup.add(threatGroup);
      rootGroup.add(restoredGroup);

      const angle = (i / level.objectiveCount) * Math.PI * 2;
      const radius = 8.5 + (i % 2) * 4.2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - 1.5;

      rootGroup.position.set(x, 0, z);
      scene.add(rootGroup);

      collectibles.push({
        mesh: rootGroup,
        threatGroup,
        restoredGroup,
        ringMesh,
        collected: false,
        x,
        z,
        kind: itemKind,
      });
    }

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.code === 'KeyW') eng.keys.w = true;
      if (k === 's' || e.code === 'KeyS') eng.keys.s = true;
      if (k === 'a' || e.code === 'KeyA') eng.keys.a = true;
      if (k === 'd' || e.code === 'KeyD') eng.keys.d = true;
      if (k === 'arrowup') eng.keys.up = true;
      if (k === 'arrowdown') eng.keys.down = true;
      if (k === 'arrowleft') eng.keys.left = true;
      if (k === 'arrowright') eng.keys.right = true;

      if (e.code === 'Tab' || k === 'q') {
        e.preventDefault();
        actionsRef.current.onSwapHero();
      } else if (k === 'e') {
        actionsRef.current.onToggleVehicle();
      } else if (k === 'f') {
        actionsRef.current.onToggleFlight();
      } else if (k === 't') {
        actionsRef.current.onUseTeleportPearl();
      } else if (e.key === 'Shift') {
        actionsRef.current.onUseSpeedPearl();
      } else if (k === '1') {
        setActiveWeapon('water_cannon');
      } else if (k === '2') {
        setActiveWeapon('lightning_staff');
      } else if (k === '3') {
        setActiveWeapon('fire_orb');
      } else if (k === '4') {
        setActiveWeapon('bat');
      } else if (k === '5') {
        setActiveWeapon('shield');
      } else if (k === 'j') {
        actionsRef.current.onCollect();
      } else if (k === 'k' || e.code === 'Space') {
        actionsRef.current.onAttack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.code === 'KeyW') eng.keys.w = false;
      if (k === 's' || e.code === 'KeyS') eng.keys.s = false;
      if (k === 'a' || e.code === 'KeyA') eng.keys.a = false;
      if (k === 'd' || e.code === 'KeyD') eng.keys.d = false;
      if (k === 'arrowup') eng.keys.up = false;
      if (k === 'arrowdown') eng.keys.down = false;
      if (k === 'arrowleft') eng.keys.left = false;
      if (k === 'arrowright') eng.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (eng.metrocableGroup) {
        eng.metrocableGroup.position.x = Math.sin(elapsed * 0.35) * 24;
      }
      if (eng.cloudsGroup) {
        eng.cloudsGroup.position.x = Math.sin(elapsed * 0.12) * 3;
      }

      if (!eng.gameActive) {
        renderer.render(scene, camera);
        return;
      }

      if (eng.refereeGroup) {
        eng.refereeGroup.position.y = 0.35 + Math.sin(elapsed * 3) * 0.2;
        eng.refereeGroup.rotation.y = Math.atan2(
          eng.heroPos.x - eng.refereeGroup.position.x,
          eng.heroPos.z - eng.refereeGroup.position.z
        );
      }

      const isUp = eng.keys.w || eng.keys.up || eng.touchDir.z < -0.2;
      const isDown = eng.keys.s || eng.keys.down || eng.touchDir.z > 0.2;
      const isLeft = eng.keys.a || eng.keys.left || eng.touchDir.x < -0.2;
      const isRight = eng.keys.d || eng.keys.right || eng.touchDir.x > 0.2;

      let speedMultiplier = 1.0;
      if (eng.activeHero === 'richard' && eng.movementMode === 'in_vehicle') {
        speedMultiplier *= 1.25;
      }
      if (eng.isNitroBoost) {
        speedMultiplier *= 1.85;
        eng.nitroTimer--;
        if (eng.nitroTimer <= 0) eng.isNitroBoost = false;
      }

      if (eng.movementMode === 'in_vehicle') {
        const accel = 0.025 * speedMultiplier;
        const maxSpd = 0.56 * speedMultiplier;

        if (isUp) eng.carSpeed = Math.min(maxSpd, eng.carSpeed + accel);
        else if (isDown) eng.carSpeed = Math.max(-maxSpd * 0.5, eng.carSpeed - accel);
        else eng.carSpeed *= 0.92;

        if (Math.abs(eng.carSpeed) > 0.01) {
          const steerAmt = (eng.carSpeed > 0 ? 1 : -1) * 0.055;
          if (isLeft) eng.heroRot += steerAmt;
          if (isRight) eng.heroRot -= steerAmt;
        }

        eng.heroPos.x += Math.sin(eng.heroRot) * eng.carSpeed;
        eng.heroPos.z += Math.cos(eng.heroRot) * eng.carSpeed;

        if (carGroup) {
          carGroup.position.set(eng.heroPos.x, 0, eng.heroPos.z);
          carGroup.rotation.y = eng.heroRot;
        }
        if (heroGroup) {
          heroGroup.position.set(eng.heroPos.x, 0.45, eng.heroPos.z);
          heroGroup.rotation.y = eng.heroRot;
        }
      } else {
        const walkSpeed = (eng.movementMode === 'flying' ? 0.35 : 0.26) * speedMultiplier;
        let mx = 0;
        let mz = 0;
        if (isUp) mz -= 1;
        if (isDown) mz += 1;
        if (isLeft) mx -= 1;
        if (isRight) mx += 1;

        const isMoving = mx !== 0 || mz !== 0;

        if (isMoving) {
          const len = Math.hypot(mx, mz);
          mx /= len;
          mz /= len;
          eng.heroPos.x += mx * walkSpeed;
          eng.heroPos.z += mz * walkSpeed;
          eng.heroRot = Math.atan2(mx, mz);
        }

        if (heroGroup) {
          const hoverY =
            eng.movementMode === 'flying' ? 3.8 + Math.sin(elapsed * 3) * 0.25 : 0.05;
          heroGroup.position.set(eng.heroPos.x, hoverY, eng.heroPos.z);
          heroGroup.rotation.y = eng.heroRot;

          if (eng.movementMode === 'on_foot') {
            if (isMoving) {
              const swing = Math.sin(elapsed * 12) * 0.45;
              if (eng.armsMesh[0]) eng.armsMesh[0].rotation.x = swing;
              if (eng.armsMesh[1]) eng.armsMesh[1].rotation.x = -swing * 0.4;
              if (eng.legsMesh[0]) eng.legsMesh[0].rotation.x = -swing;
              if (eng.legsMesh[1]) eng.legsMesh[1].rotation.x = swing;
            } else {
              if (eng.armsMesh[0]) eng.armsMesh[0].rotation.x = 0;
              if (eng.armsMesh[1]) eng.armsMesh[1].rotation.x = 0;
              if (eng.legsMesh[0]) eng.legsMesh[0].rotation.x = 0;
              if (eng.legsMesh[1]) eng.legsMesh[1].rotation.x = 0;
            }
          }
        }
      }

      const bound = 25;
      eng.heroPos.x = Math.max(-bound, Math.min(bound, eng.heroPos.x));
      eng.heroPos.z = Math.max(-bound, Math.min(bound, eng.heroPos.z));

      if (eng.guideArrowGroup) {
        eng.guideArrowGroup.position.set(
          eng.heroPos.x,
          (eng.heroPos.y || 0) + 0.5,
          eng.heroPos.z
        );

        let targetX = eng.bossPos.x;
        let targetZ = eng.bossPos.z;
        let minDist = 999;

        for (const item of eng.collectibles) {
          if (!item.collected) {
            const d = Math.hypot(item.x - eng.heroPos.x, item.z - eng.heroPos.z);
            if (d < minDist) {
              minDist = d;
              targetX = item.x;
              targetZ = item.z;
            }
          }
        }

        eng.guideArrowGroup.rotation.y = Math.atan2(
          targetX - eng.heroPos.x,
          targetZ - eng.heroPos.z
        );
      }

      const camDist = eng.movementMode === 'in_vehicle' ? 17 : 14.5;
      const camHeight = eng.movementMode === 'in_vehicle' ? 11 : 10.2;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, eng.heroPos.x * 0.72, 0.1);
      camera.position.z = THREE.MathUtils.lerp(
        camera.position.z,
        eng.heroPos.z + camDist,
        0.1
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        (eng.heroPos.y || 0) + camHeight,
        0.1
      );
      camera.lookAt(eng.heroPos.x, (eng.heroPos.y || 0) + 1.2, eng.heroPos.z - 2.5);

      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const pt = eng.particles[i];
        pt.mesh.position.x += pt.vx;
        pt.mesh.position.y += pt.vy;
        pt.mesh.position.z += pt.vz;
        pt.vy -= 0.012;
        pt.life--;
        pt.mesh.scale.setScalar(Math.max(0.1, pt.life / 25));
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          disposeMeshMaterial(pt.mesh);
          eng.particles.splice(i, 1);
        }
      }

      if (eng.shieldTimer > 0) {
        eng.shieldTimer--;
        if (eng.shieldTimer <= 0 && shieldDome) {
          shieldDome.visible = false;
          eng.isShieldActive = false;
        }
      }

      for (let i = eng.projectiles.length - 1; i >= 0; i--) {
        const p = eng.projectiles[i];
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.life--;

        if (p.isEnemy) {
          const hDist = Math.hypot(
            eng.heroPos.x - p.mesh.position.x,
            eng.heroPos.z - p.mesh.position.z
          );
          if (hDist < 2.0 || p.life <= 0) {
            scene.remove(p.mesh);
            disposeMeshMaterial(p.mesh);
            eng.projectiles.splice(i, 1);
            if (hDist < 2.0 && !eng.isShieldActive) {
              eng.heroHp = Math.max(0, eng.heroHp - 10);
              setHudHp(eng.heroHp);
              soundEffects.playRefereeWhistle();
              if (eng.heroHp <= 0) {
                eng.gameActive = false;
                setIsDefeat(true);
              }
            }
          }
          continue;
        }

        let hitObjective = false;
        for (const item of eng.collectibles) {
          if (!item.collected) {
            const iDist = Math.hypot(
              item.x - p.mesh.position.x,
              item.z - p.mesh.position.z
            );
            if (iDist < 2.3) {
              completeObjectiveItem(item, true);
              hitObjective = true;
              break;
            }
          }
        }

        if (hitObjective) {
          scene.remove(p.mesh);
          disposeMeshMaterial(p.mesh);
          eng.projectiles.splice(i, 1);
          continue;
        }

        const bDist = Math.hypot(
          eng.bossPos.x - p.mesh.position.x,
          eng.bossPos.z - p.mesh.position.z
        );
        if (bDist < 3.2 || p.life <= 0) {
          const hitX = p.mesh.position.x;
          const hitZ = p.mesh.position.z;
          scene.remove(p.mesh);
          disposeMeshMaterial(p.mesh);
          eng.projectiles.splice(i, 1);

          if (bDist < 3.2) {
            spawnSplashBurst(hitX, 2.2, hitZ, p.type === 'water' ? 0x06b6d4 : 0xfacc15, 8);
            if (eng.bossShield > 0) {
              eng.bossShield = Math.max(0, eng.bossShield - p.damage);
              setHudBossShield(eng.bossShield);
              if (eng.bossShield <= 0 && eng.bossShieldMesh) {
                eng.bossShieldMesh.visible = false;
                setRefereeCall(`Escudo roto`);
              }
            } else {
              eng.bossHp = Math.max(0, eng.bossHp - p.damage);
              eng.bossFlashTimer = 6;
              soundEffects.playBossHurtSound();
              setHudBossHp(eng.bossHp);

              if (eng.bossHp <= 0) {
                eng.gameActive = false;
                setIsVictory(true);
                onAddCoinsRef.current(250);
                soundEffects.playVictoryFanfare();
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              }
            }
          }
        }
      }

      if (bossGroup) {
        bossGroup.position.y = Math.sin(elapsed * 2.2) * 0.25;
        const bdx = eng.heroPos.x - bossGroup.position.x;
        const bdz = eng.heroPos.z - bossGroup.position.z;
        bossGroup.rotation.y = Math.atan2(bdx, bdz);

        if (eng.bossFlashTimer > 0) {
          eng.bossFlashTimer--;
          bossMat.emissive.setHex(0x06b6d4);
          bossMat.emissiveIntensity = 1.8;
        } else {
          bossMat.emissive.setHex(0x000000);
          bossMat.emissiveIntensity = 0;
        }

        eng.bossAttackTimer += delta;
        if (eng.bossAttackTimer > 4.0) {
          eng.bossAttackTimer = 0;
          const bomb = new THREE.Mesh(
            BOMB_GEOMETRY,
            new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
          );
          bomb.position.set(bossGroup.position.x, 2.2, bossGroup.position.z);
          scene.add(bomb);

          const pDist = Math.hypot(bdx, bdz) || 1;
          eng.projectiles.push({
            mesh: bomb,
            vx: (bdx / pDist) * 0.38,
            vy: 0,
            vz: (bdz / pDist) * 0.38,
            life: 65,
            damage: 10,
            type: 'trash_bomb',
            isEnemy: true,
          });
        }
      }

      for (const item of eng.collectibles) {
        if (!item.collected) {
          const dist = Math.hypot(item.x - eng.heroPos.x, item.z - eng.heroPos.z);
          if (dist < 2.6) {
            actionsRef.current.onCollect();
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);

      eng.projectiles.forEach((p) => {
        scene.remove(p.mesh);
        disposeMeshMaterial(p.mesh);
      });
      eng.projectiles = [];

      eng.particles.forEach((pt) => {
        scene.remove(pt.mesh);
        disposeMeshMaterial(pt.mesh);
      });
      eng.particles = [];

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          disposeMeshMaterial(obj);
          const geo = obj.geometry;
          if (
            geo &&
            geo !== ORB_GEOMETRY &&
            geo !== WATER_DROP_GEOMETRY &&
            geo !== BOMB_GEOMETRY &&
            geo !== PARTICLE_GEOMETRY
          ) {
            geo.dispose();
          }
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [level.id, level.biome, level.habitCategory, level.objectiveCount, level.villainColor, level.villainHp, level.villainPowers, muscleScale, resolvedArchetype, completeObjectiveItem, spawnSplashBurst]);

  const handleRestart = () => {
    soundEffects.playClickSound();
    const eng = engineRef.current;
    eng.gameActive = true;
    eng.heroPos = { x: 0, y: 0, z: 9 };
    eng.heroHp = 100;
    eng.bossHp = level.villainHp;
    eng.bossShield = level.villainPowers.includes('escudo_oscuro') ? 100 : 0;
    eng.objectivesDone = 0;

    setHudHp(100);
    setHudBossHp(level.villainHp);
    setHudBossShield(eng.bossShield);
    setHudObjectives(0);
    setIsVictory(false);
    setIsDefeat(false);
    setRefereeCall('Capítulo reiniciado');

    eng.collectibles.forEach((c) => {
      c.collected = false;
      c.threatGroup.visible = true;
      c.restoredGroup.visible = false;
      (c.ringMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
    });
    if (eng.bossShieldMesh) eng.bossShieldMesh.visible = true;
  };

  const setTouchMove = (x: number, z: number) => {
    engineRef.current.touchDir = { x, z };
  };

  const handleAnswerTrivia = (idx: number) => {
    setSelectedTriviaOption(idx);
    if (idx === level.trivia.correctIndex) {
      setTriviaResult('correct');
      awardGreenCard('¡Respuesta correcta! Escudo roto');
      onAddCoinsRef.current(500);
      engineRef.current.heroHp = 100;
      engineRef.current.bossShield = 0;
      if (engineRef.current.bossShieldMesh) {
        engineRef.current.bossShieldMesh.visible = false;
      }
      setHudHp(100);
      setHudBossShield(0);
      triggerCoinToast('✨ Escudo destruido +500 🪙');
    } else {
      setTriviaResult('wrong');
      soundEffects.playRefereeWhistle();
      setRefereeCall('Intenta otra opción');
      soundEffects.playBossHurtSound();
    }
  };

  const heartsCount = Math.ceil((hudHp / 100) * 5);

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] sm:h-[calc(100vh-84px)] min-h-[540px] max-h-[960px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl select-none touch-none">
      {/* 3D CANVAS */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* TOAST NOTIFICATION */}
      {coinRewardToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white font-medium text-xs px-4 py-2 rounded-full shadow-2xl z-30 animate-bounce flex items-center gap-2 pointer-events-none border border-white/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{coinRewardToast}</span>
        </div>
      )}

      {/* AWWWARDS MINIMALIST FLOATING TOP HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none z-10">
        {/* Left: Hero & Hearts Capsule */}
        <button
          onClick={handleSwapHero}
          className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white shadow-lg active:scale-95 transition-all"
          title="Toca para alternar héroe"
        >
          <span className="text-xs font-bold text-sky-400">
            {activeHero === 'richard' ? 'Richard' : 'Juan'}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((h) => (
              <span
                key={h}
                className={`w-2 h-2 rounded-full transition-all ${
                  h <= heartsCount ? 'bg-rose-500 scale-100' : 'bg-slate-600/60 scale-75'
                }`}
              />
            ))}
          </div>
        </button>

        {/* Center: Clean Progress Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white shadow-lg text-xs">
          <span className="font-semibold text-emerald-400">
            {hudObjectives}/{level.objectiveCount}
          </span>
          <span className="text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[200px]">
            {refereeCall}
          </span>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setShowTriviaModal(true);
            }}
            className="w-5 h-5 rounded-full bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 flex items-center justify-center transition-colors ml-1"
            title="Pregunta de hábitos para romper el escudo"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Boss Health & Minimal Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white shadow-lg text-xs">
            <span className="font-semibold text-rose-400 max-w-[80px] sm:max-w-[120px] truncate">
              {level.villainName.split(' ')[0]}
            </span>
            <div className="w-14 sm:w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${(hudBossHp / level.villainHp) * 100}%` }}
              />
            </div>
            {hudBossShield > 0 && (
              <span className="text-[10px] text-purple-400 font-bold">🛡️</span>
            )}
          </div>

          <button
            onClick={() => setShowStoryIntro(true)}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Misión del capítulo"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              const next = !soundOn;
              soundEffects.enabled = next;
              setSoundOn(next);
            }}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title={soundOn ? 'Silenciar' : 'Activar sonido'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onExitArena}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-rose-500/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Salir"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* FLOATING WEAPONS DOCK (Bottom-Center) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1 p-1 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/15 shadow-2xl">
        <button
          onClick={() => {
            soundEffects.playWaterStreamSound();
            setActiveWeapon('water_cannon');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeWeapon === 'water_cannon'
              ? 'bg-cyan-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>💧</span>
          <span>Agua</span>
        </button>
        <button
          onClick={() => {
            soundEffects.playLightningSound();
            setActiveWeapon('lightning_staff');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeWeapon === 'lightning_staff'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⚡</span>
          <span>Rayo</span>
        </button>
        <button
          onClick={() => {
            soundEffects.playFireballSound();
            setActiveWeapon('fire_orb');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeWeapon === 'fire_orb'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>☀️</span>
          <span>Sol</span>
        </button>
        <button
          onClick={() => {
            soundEffects.playBatSwingSound();
            setActiveWeapon('bat');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeWeapon === 'bat'
              ? 'bg-amber-400 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🏏</span>
          <span>Bate</span>
        </button>
        <button
          onClick={() => {
            soundEffects.playClickSound();
            setActiveWeapon('shield');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeWeapon === 'shield'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🛡️</span>
          <span>Escudo</span>
        </button>
      </div>

      {/* CONTROLS (Left: D-Pad, Right: Actions) */}
      {/* Left: Sleek D-Pad */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex flex-col items-center gap-1">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            setTouchMove(0, -1);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
            setTouchMove(0, 0);
          }}
          onPointerCancel={() => setTouchMove(0, 0)}
          className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-colors active:scale-95"
        >
          <ArrowUp className="w-4 h-4 pointer-events-none" />
        </button>
        <div className="flex gap-1">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              setTouchMove(-1, 0);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
              setTouchMove(0, 0);
            }}
            onPointerCancel={() => setTouchMove(0, 0)}
            className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 pointer-events-none" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              setTouchMove(0, 1);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
              setTouchMove(0, 0);
            }}
            onPointerCancel={() => setTouchMove(0, 0)}
            className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-colors active:scale-95"
          >
            <ArrowDown className="w-4 h-4 pointer-events-none" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              setTouchMove(1, 0);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
              setTouchMove(0, 0);
            }}
            onPointerCancel={() => setTouchMove(0, 0)}
            className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-colors active:scale-95"
          >
            <ArrowRight className="w-4 h-4 pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Right: Mode Toggles & Action Triggers */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex flex-col items-end gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUseTeleportPearl}
            disabled={pearlsTeleport <= 0}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-xs text-purple-300 font-semibold flex items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <span>🔮</span>
            <span>{pearlsTeleport}</span>
          </button>
          <button
            onClick={handleUseSpeedPearl}
            disabled={pearlsSpeed <= 0}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-xs text-amber-300 font-semibold flex items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <span>⚡</span>
            <span>{pearlsSpeed}</span>
          </button>
          <button
            onClick={handleToggleVehicle}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
              movementMode === 'in_vehicle'
                ? 'bg-emerald-500 border-white text-white'
                : 'bg-slate-900/60 border-white/10 text-slate-300'
            }`}
            title="Auto"
          >
            <Car className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleFlight}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
              movementMode === 'flying'
                ? 'bg-sky-500 border-white text-white'
                : 'bg-slate-900/60 border-white/10 text-slate-300'
            }`}
            title="Volar"
          >
            <Plane className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Primary Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCollect}
            className="px-4 py-3 rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 backdrop-blur-md text-white font-heading font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Acción [J]</span>
          </button>
          <button
            onClick={handleAttack}
            className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-heading font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Droplets className="w-4 h-4" />
            <span>Agua [K]</span>
          </button>
        </div>
      </div>

      {/* STORY BRIEFING CARD (Uncluttered, Editorial, Awwwards Style) */}
      {showStoryIntro && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 animate-float">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>{level.historicalEra}</span>
              <span>{level.locationName?.split(' · ')[0]}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight mb-2">
              {level.title.split(': ')[1] || level.title}
            </h2>

            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
              {level.humanLifeStory}
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Tu Objetivo</span>
                <span className="text-slate-500">{level.habitDescription}</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundEffects.playClickSound();
                setShowStoryIntro(false);
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Comenzar Capítulo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TRIVIA DIALOG (Clean & Minimalist) */}
      {showTriviaModal && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">
                Pregunta de Buenos Hábitos
              </span>
              <button
                onClick={() => {
                  setShowTriviaModal(false);
                  setSelectedTriviaOption(null);
                  setTriviaResult(null);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 mb-4 leading-snug">
              {level.trivia.question}
            </h3>

            <div className="flex flex-col gap-2 mb-4">
              {level.trivia.options.map((opt, idx) => {
                const isSelected = selectedTriviaOption === idx;
                const isCorrect = idx === level.trivia.correctIndex;
                let btnStyle = 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100';

                if (triviaResult && isSelected) {
                  btnStyle = isCorrect
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : 'bg-rose-50 border-rose-400 text-rose-800';
                }

                return (
                  <button
                    key={idx}
                    disabled={triviaResult !== null}
                    onClick={() => handleAnswerTrivia(idx)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${btnStyle}`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {triviaResult && (
              <div className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl">
                {level.trivia.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {isVictory && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-200/80">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              🏆
            </div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
              Capítulo Superado
            </span>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 mt-1 mb-2">
              ¡Buen trabajo, Guardián!
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Medalla: <strong className="text-slate-800">{level.badgeName}</strong>
            </p>

            <button
              onClick={() => {
                onLevelComplete(level.id, level.coinsReward, level.powerReward, level.badgeName);
                onExitArena();
              }}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
            >
              Continuar al Mapa
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT SCREEN */}
      {isDefeat && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-heading font-bold text-slate-900 mb-1">
              Tiempo Fuera
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Usa tu Cañón de Agua [K] para mantener a distancia los residuos.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onExitArena}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
              >
                Salir
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
