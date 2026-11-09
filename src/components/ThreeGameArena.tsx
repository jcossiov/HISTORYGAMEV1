import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  HabitLevel,
  HeroId,
  MovementMode,
  WeaponType,
  AvatarProfile,
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
  Award,
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
  Key,
  Heart,
  LogOut,
} from 'lucide-react';

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
  collected: boolean;
  x: number;
  z: number;
  specialType?: 'scroll' | 'chicken' | 'lion_key' | 'delivery_package' | 'oasis_canal' | 'trash';
}

interface ActiveProjectile {
  mesh: THREE.Mesh | THREE.Group;
  vx: number;
  vz: number;
  life: number;
  damage: number;
  type: 'water' | 'light' | 'lightning' | 'fireball' | 'whirlpool' | 'dark_beam' | 'trash_bomb';
  isEnemy?: boolean;
}

interface TorchLight {
  pointLight: THREE.PointLight;
  flameMesh: THREE.Mesh;
  baseIntensity: number;
}

export const ThreeGameArena: React.FC<ThreeGameArenaProps> = ({
  level,
  playerCoins = 0,
  onAddCoins = () => {},
  onAddGreenCard = () => {},
  onLevelComplete,
  onExitArena,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Stable callback refs to prevent 3D canvas re-creation on coin updates!
  const onAddCoinsRef = useRef(onAddCoins);
  onAddCoinsRef.current = onAddCoins;
  const onAddGreenCardRef = useRef(onAddGreenCard);
  onAddGreenCardRef.current = onAddGreenCard;

  // Character Swap State: Richard (orange) <-> Juan (green)
  const [activeHero, setActiveHero] = useState<HeroId>('richard');

  // Movement Mode & Weapon State
  const [movementMode, setMovementMode] = useState<MovementMode>('on_foot');
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('water_cannon');

  // Pearls & Referee Cards
  const [pearlsTeleport, setPearlsTeleport] = useState<number>(3);
  const [pearlsSpeed, setPearlsSpeed] = useState<number>(3);
  const [matchGreenCards, setMatchGreenCards] = useState<number>(1);

  // Special Mission State
  const [hasLionKey, setHasLionKey] = useState<boolean>(false);
  const [isLionFreed, setIsLionFreed] = useState<boolean>(false);

  // Kid-friendly HUD state
  const [hudHp, setHudHp] = useState<number>(100);
  const [hudBossHp, setHudBossHp] = useState<number>(level.villainHp);
  const [hudBossShield, setHudBossShield] = useState<number>(
    level.villainPowers.includes('escudo_oscuro') ? 100 : 0
  );
  const [hudObjectives, setHudObjectives] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isDefeat, setIsDefeat] = useState<boolean>(false);
  const [refereeCall, setRefereeCall] = useState<string>(
    '¡PRIIIT! 🏁 Sigue la flecha dorada y limpia el nivel'
  );
  const [soundOn, setSoundOn] = useState<boolean>(soundEffects.enabled);
  const [showTriviaModal, setShowTriviaModal] = useState<boolean>(false);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [triviaResult, setTriviaResult] = useState<'correct' | 'wrong' | null>(null);
  const [coinRewardToast, setCoinRewardToast] = useState<string | null>(null);

  // Dynamic Muscle Scale Factor based on Level
  const muscleScale = 1.0 + Math.min(0.85, (level.id - 1) * 0.06);

  // Mutable 60FPS Engine State
  const engineRef = useRef({
    gameActive: true,
    activeHero: 'richard' as HeroId,
    movementMode: 'on_foot' as MovementMode,
    activeWeapon: 'water_cannon' as WeaponType,
    heroPos: { x: 0, y: 0, z: 8 },
    heroRot: 0,
    carSpeed: 0,
    isNitroBoost: false,
    nitroTimer: 0,
    isShieldActive: false,
    shieldTimer: 0,
    heroHp: 100,
    bossPos: { x: 0, z: -14 },
    bossHp: level.villainHp,
    bossMaxHp: level.villainHp,
    bossShield: level.villainPowers.includes('escudo_oscuro') ? 100 : 0,
    bossAttackTimer: 0,
    bossSpecialTimer: 0,
    bossFlashTimer: 0,
    objectivesCount: level.objectiveCount,
    objectivesDone: 0,
    hasLionKey: false,
    isLionFreed: false,
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
    scene: null as THREE.Scene | null,
    heroGroup: null as THREE.Group | null,
    guideArrowGroup: null as THREE.Group | null,
    refereeGroup: null as THREE.Group | null,
    carMesh: null as THREE.Group | null,
    jetpackMesh: null as THREE.Group | null,
    bossMesh: null as THREE.Group | null,
    bossMaterial: null as THREE.MeshStandardMaterial | null,
    bossShieldMesh: null as THREE.Mesh | null,
    shieldMesh: null as THREE.Mesh | null,
    torsoMesh: null as THREE.Mesh | null,
    armsMesh: [] as THREE.Mesh[],
    legsMesh: [] as THREE.Mesh[],
    torchLights: [] as TorchLight[],
    cageMesh: null as THREE.Group | null,
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
    setTimeout(() => setCoinRewardToast(null), 1900);
  }, []);

  // Award a Referee Green Card for good habits
  const awardGreenCard = useCallback(
    (msg: string) => {
      soundEffects.playGreenCardSound();
      setMatchGreenCards((c) => c + 1);
      onAddGreenCardRef.current();
      setRefereeCall(msg);
    },
    []
  );

  // Swap Character: Richard <-> Juan
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

    setRefereeCall(`¡Cambio limpio! Entra ${char.name} al campo 🏃‍♂️`);
  }, [activeHero]);

  // Toggle Eco-Buggy Car Mode [E]
  const handleToggleVehicle = useCallback(() => {
    const eng = engineRef.current;
    if (eng.movementMode === 'in_vehicle') {
      eng.movementMode = 'on_foot';
      setMovementMode('on_foot');
      if (eng.carMesh) eng.carMesh.visible = false;
      if (eng.heroGroup) eng.heroGroup.position.y = 0;
      soundEffects.playClickSound();
      setRefereeCall('A pie: ¡Sigue la flecha dorada!');
    } else {
      eng.movementMode = 'in_vehicle';
      setMovementMode('in_vehicle');
      if (eng.carMesh) eng.carMesh.visible = true;
      if (eng.jetpackMesh) eng.jetpackMesh.visible = false;
      soundEffects.playCarEngineSound();
      setRefereeCall('🚗 ¡Eco-Buggy activado! Usa las flechas para conducir');
    }
  }, []);

  // Toggle Flight [F]
  const handleToggleFlight = useCallback(() => {
    const eng = engineRef.current;
    if (eng.movementMode === 'flying') {
      eng.movementMode = 'on_foot';
      setMovementMode('on_foot');
      if (eng.jetpackMesh) eng.jetpackMesh.visible = false;
      eng.heroPos.y = 0;
      soundEffects.playClickSound();
      setRefereeCall('Aterrizaje perfecto 👌');
    } else {
      eng.movementMode = 'flying';
      setMovementMode('flying');
      if (eng.carMesh) eng.carMesh.visible = false;
      if (eng.jetpackMesh) eng.jetpackMesh.visible = true;
      eng.heroPos.y = 3.8;
      soundEffects.playJetpackSound();
      setRefereeCall('✈️ ¡Volando por el cielo! Nada te detiene');
    }
  }, []);

  // Use Teleport Pearl [T]
  const handleUseTeleportPearl = useCallback(() => {
    if (pearlsTeleport <= 0) return;
    const eng = engineRef.current;
    setPearlsTeleport((p) => p - 1);
    soundEffects.playTeleportSound();

    const forwardX = Math.sin(eng.heroRot);
    const forwardZ = Math.cos(eng.heroRot);
    eng.heroPos.x += forwardX * 14;
    eng.heroPos.z += forwardZ * 14;

    const bound = 24;
    eng.heroPos.x = Math.max(-bound, Math.min(bound, eng.heroPos.x));
    eng.heroPos.z = Math.max(-bound, Math.min(bound, eng.heroPos.z));

    setRefereeCall('🔮 ¡Súper Teletransporte!');
  }, [pearlsTeleport]);

  // Use Speed Pearl (Nitro) [Shift]
  const handleUseSpeedPearl = useCallback(() => {
    if (pearlsSpeed <= 0) return;
    const eng = engineRef.current;
    setPearlsSpeed((p) => p - 1);
    eng.isNitroBoost = true;
    eng.nitroTimer = 180;
    soundEffects.playSpeedBoostSound();
    setRefereeCall('⚡ ¡Súper Velocidad Sónica activada!');
  }, [pearlsSpeed]);

  // Primary Attack & Elemental Powers
  const handleAttack = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.gameActive) return;

    if (activeWeapon === 'bat') {
      soundEffects.playBatSwingSound();
      const dx = eng.bossPos.x - eng.heroPos.x;
      const dz = eng.bossPos.z - eng.heroPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 5.5) {
        const dmg = Math.round(65 * muscleScale);
        if (eng.bossShield > 0) {
          eng.bossShield = Math.max(0, eng.bossShield - dmg);
          setHudBossShield(eng.bossShield);
          setRefereeCall(`¡Golpe al escudo! Queda ${eng.bossShield}%`);
        } else {
          eng.bossHp = Math.max(0, eng.bossHp - dmg);
          eng.bossFlashTimer = 6;
          soundEffects.playBossHurtSound();
          setHudBossHp(eng.bossHp);

          if (eng.bossHp <= 0) {
            eng.gameActive = false;
            setIsVictory(true);
            onAddCoinsRef.current(100);
            soundEffects.playVictoryFanfare();
            confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
          } else {
            setRefereeCall(`💥 ¡Batazo limpio! -${dmg} HP`);
          }
        }
      }
      return;
    }

    if (activeWeapon === 'shield') {
      soundEffects.playClickSound();
      eng.isShieldActive = true;
      eng.shieldTimer = 80;
      if (eng.shieldMesh) eng.shieldMesh.visible = true;
      setRefereeCall('🛡️ ¡Escudo activado! Eres invencible');
      return;
    }

    // Ranged Elemental Projectiles (Auto-aims toward Boss!)
    if (!eng.scene) return;

    let colorHex = 0x06b6d4;
    let dmg = Math.round(45 * muscleScale);
    let pType: ActiveProjectile['type'] = 'water';

    if (activeWeapon === 'water_cannon') {
      soundEffects.playWaterStreamSound();
      colorHex = 0x06b6d4;
      pType = 'water';
    } else if (activeWeapon === 'lightning_staff') {
      soundEffects.playLightningSound();
      colorHex = 0x38bdf8;
      dmg = Math.round(55 * muscleScale);
      pType = 'lightning';
    } else if (activeWeapon === 'fire_orb') {
      soundEffects.playFireballSound();
      colorHex = 0xef4444;
      dmg = Math.round(60 * muscleScale);
      pType = 'fireball';
    } else {
      soundEffects.playLightBeamSound();
      colorHex = 0xfacc15;
      dmg = Math.round(52 * muscleScale);
      pType = 'light';
    }

    const orbGeo = new THREE.SphereGeometry(0.45, 10, 10);
    const orbMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const orbMesh = new THREE.Mesh(orbGeo, orbMat);
    orbMesh.position.set(eng.heroPos.x, (eng.heroPos.y || 0) + 1.3, eng.heroPos.z);
    eng.scene.add(orbMesh);

    const dx = eng.bossPos.x - eng.heroPos.x;
    const dz = eng.bossPos.z - eng.heroPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const speed = 0.9;

    eng.projectiles.push({
      mesh: orbMesh,
      vx: (dx / dist) * speed,
      vz: (dz / dist) * speed,
      life: 55,
      damage: dmg,
      type: pType,
    });
  }, [activeWeapon, muscleScale]);

  // Manual or Auto Collect Habit Objective
  const handleCollect = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.gameActive) return;

    // Check Rome Lion Key & Cage first
    if (level.specialMissionType === 'colosseum_lion_key') {
      if (!eng.hasLionKey) {
        for (const item of eng.collectibles) {
          if (item.specialType === 'lion_key' && !item.collected) {
            const dx = item.x - eng.heroPos.x;
            const dz = item.z - eng.heroPos.z;
            if (Math.sqrt(dx * dx + dz * dz) < 5.0) {
              item.collected = true;
              item.mesh.visible = false;
              eng.hasLionKey = true;
              setHasLionKey(true);
              triggerCoinToast('🔑 ¡Llave Dorada! Ve a la jaula central');
              awardGreenCard('🟩 ¡Tarjeta Verde! Tienes la llave del león');
              return;
            }
          }
        }
      } else if (!eng.isLionFreed) {
        const cageDist = Math.sqrt(
          eng.heroPos.x * eng.heroPos.x + eng.heroPos.z * eng.heroPos.z
        );
        if (cageDist < 6.0) {
          eng.isLionFreed = true;
          setIsLionFreed(true);
          if (eng.cageMesh) eng.cageMesh.visible = false;
          soundEffects.playLionRoarSound();
          onAddCoinsRef.current(500);
          triggerCoinToast('🦁 ¡Cachorro Libre! +500 🪙');
          awardGreenCard('🟩 ¡Tarjeta Verde del Árbitro por salvar al león!');
          return;
        }
      }
    }

    for (const item of eng.collectibles) {
      if (!item.collected) {
        const dx = item.x - eng.heroPos.x;
        const dz = item.z - eng.heroPos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 5.0) {
          item.collected = true;
          item.mesh.visible = false;
          eng.objectivesDone += 1;
          setHudObjectives(eng.objectivesDone);
          onAddCoinsRef.current(100);

          if (item.specialType === 'chicken') {
            soundEffects.playChickenCluckSound();
            triggerCoinToast('🐔 ¡Gallina salvada! +100 🪙');
          } else if (item.specialType === 'scroll') {
            soundEffects.playScrollPickupSound();
            triggerCoinToast('📜 ¡Pergamino rescatado! +100 🪙');
          } else {
            soundEffects.playCollectSound();
            triggerCoinToast('✨ ¡Buen Hábito! +100 🪙');
          }

          awardGreenCard(
            `🟩 ¡Árbitro valida punto! (${eng.objectivesDone}/${eng.objectivesCount})`
          );
          return;
        }
      }
    }
  }, [level.specialMissionType, awardGreenCard, triggerCoinToast]);

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

  // INITIALIZE 3D WORLD & 3D REFEREE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Referee whistle is strictly reserved for fouls/infractions
    soundEffects.playClickSound();

    const eng = engineRef.current;
    eng.gameActive = true;
    eng.heroHp = 100;
    eng.bossHp = level.villainHp;
    eng.bossMaxHp = level.villainHp;
    eng.bossShield = level.villainPowers.includes('escudo_oscuro') ? 100 : 0;
    eng.heroPos = { x: 0, y: 0, z: 8 };
    eng.bossPos = { x: 0, z: -14 };
    eng.objectivesDone = 0;
    eng.torchLights = [];

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    eng.scene = scene;

    // Bright, crisp kid-friendly sky colors per biome
    let skyHex = 0x0c192c;
    if (level.biome === 'oasis_egipcio') skyHex = 0x3b2510;
    else if (level.biome === 'roma_coliseo') skyHex = 0x1c120e;
    else if (level.biome === 'grecia_filosofos') skyHex = 0x102a45;
    else if (level.biome === 'edad_media_castillo') skyHex = 0x0f1f1c;
    else if (level.biome === 'japon_montana') skyHex = 0x1e2538;

    scene.background = new THREE.Color(skyHex);
    scene.fog = new THREE.FogExp2(skyHex, 0.015);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(0, 12, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(16, 28, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Ground
    const groundSize = 64;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    let groundColor = 0x15803d;
    if (level.biome === 'oasis_egipcio') groundColor = 0xd97706;
    else if (level.biome === 'roma_coliseo') groundColor = 0x57534e;
    else if (level.biome === 'grecia_filosofos') groundColor = 0x475569;
    else if (level.biome === 'edad_media_castillo') groundColor = 0x166534;
    else if (level.biome === 'japon_montana') groundColor = 0xe2e8f0;
    else if (level.biome === 'nieve_invierno') groundColor = 0xbfdbfe;
    else if (level.biome === 'oceano') groundColor = 0x0284c7;
    else if (level.biome === 'desierto') groundColor = 0xb45309;

    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Biome 3D Landmarks
    if (level.biome === 'oasis_egipcio') {
      const pyrMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
      const pyr1 = new THREE.Mesh(new THREE.ConeGeometry(15, 18, 4), pyrMat);
      pyr1.position.set(-20, 9, -30);
      pyr1.rotation.y = Math.PI / 4;
      scene.add(pyr1);

      const pyr2 = new THREE.Mesh(new THREE.ConeGeometry(12, 14, 4), pyrMat);
      pyr2.position.set(22, 7, -32);
      pyr2.rotation.y = Math.PI / 4;
      scene.add(pyr2);

      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(7, 24),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1 })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.05, -2);
      scene.add(pool);
    } else if (level.biome === 'roma_coliseo') {
      // Cage & Lion Cub at center
      const cageGroup = new THREE.Group();
      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8);
      const barMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });
      for (let i = -1.2; i <= 1.2; i += 0.6) {
        const b1 = new THREE.Mesh(barGeo, barMat);
        b1.position.set(i, 1.4, -1.2);
        cageGroup.add(b1);
        const b2 = new THREE.Mesh(barGeo, barMat);
        b2.position.set(i, 1.4, 1.2);
        cageGroup.add(b2);
      }
      scene.add(cageGroup);
      eng.cageMesh = cageGroup;

      const lionGroup = new THREE.Group();
      const lionBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.65, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      lionBody.position.y = 0.5;
      lionGroup.add(lionBody);
      const lionHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
      );
      lionHead.position.set(0, 0.95, 0.6);
      lionGroup.add(lionHead);
      scene.add(lionGroup);
    }

    // ==========================================
    // 3D REFEREE CHARACTER ("DON JUSTO") IN THE ARENA!
    // ==========================================
    const refereeGroup = new THREE.Group();
    const refTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3 })
    );
    refTorso.position.y = 1.2;
    refereeGroup.add(refTorso);

    // Black Referee Stripe Belt & Shoulders
    const refStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.47, 0.47, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    refStripe.position.y = 1.2;
    refereeGroup.add(refStripe);

    const refHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xfde68a })
    );
    refHead.position.y = 2.05;
    refereeGroup.add(refHead);

    // Referee Golden Halo Ring
    const refHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.06, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    refHalo.rotation.x = Math.PI / 2;
    refHalo.position.y = 0.15;
    refereeGroup.add(refHalo);

    // Green Card in Referee's raised hand
    const greenCardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.48, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    greenCardMesh.position.set(0.65, 1.85, 0.2);
    refereeGroup.add(greenCardMesh);

    refereeGroup.position.set(-5.5, 0.5, 4);
    scene.add(refereeGroup);
    eng.refereeGroup = refereeGroup;

    // ==========================================
    // HERO 3D MODEL + KID-FRIENDLY 3D DIRECTIONAL GUIDE ARROW
    // ==========================================
    const heroGroup = new THREE.Group();
    eng.heroGroup = heroGroup;
    const char = HERO_DUO[eng.activeHero];

    const torsoW = 1.0 * muscleScale;
    const torsoD = 0.65 * muscleScale;
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(torsoW, 1.25, torsoD),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(char.primaryColor), metalness: 0.5 })
    );
    torso.position.y = 1.35;
    torso.castShadow = true;
    heroGroup.add(torso);
    eng.torsoMesh = torso;

    const armW = 0.36 * muscleScale;
    const armGeo = new THREE.BoxGeometry(armW, 0.85, armW);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(char.secondaryColor) });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-(torsoW / 2 + armW / 2 + 0.05), 1.3, 0);
    heroGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(torsoW / 2 + armW / 2 + 0.05, 1.3, 0);
    heroGroup.add(armR);
    eng.armsMesh = [armL, armR];

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
    );
    head.position.y = 2.25;
    heroGroup.add(head);

    const legGeo = new THREE.BoxGeometry(0.38, 0.85, 0.38);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.3, 0.45, 0);
    heroGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.3, 0.45, 0);
    heroGroup.add(legR);
    eng.legsMesh = [legL, legR];

    // Jetpack
    const jetpackGroup = new THREE.Group();
    const tankGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 8);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const t1 = new THREE.Mesh(tankGeo, tankMat);
    t1.position.set(-0.3, 1.3, -0.4);
    jetpackGroup.add(t1);
    const t2 = new THREE.Mesh(tankGeo, tankMat);
    t2.position.set(0.3, 1.3, -0.4);
    jetpackGroup.add(t2);
    jetpackGroup.visible = false;
    heroGroup.add(jetpackGroup);
    eng.jetpackMesh = jetpackGroup;

    // Shield Dome
    const shieldDome = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      })
    );
    shieldDome.position.y = 1.3;
    shieldDome.visible = false;
    heroGroup.add(shieldDome);
    eng.shieldMesh = shieldDome;

    heroGroup.position.set(0, 0, 8);
    scene.add(heroGroup);

    // 3D Floating Directional Guide Arrow for Kids!
    const guideArrowGroup = new THREE.Group();
    const arrowCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    arrowCone.rotation.x = Math.PI / 2;
    arrowCone.position.z = 1.8;
    guideArrowGroup.add(arrowCone);
    guideArrowGroup.position.set(0, 0.6, 8);
    scene.add(guideArrowGroup);
    eng.guideArrowGroup = guideArrowGroup;

    // GTA Eco-Buggy
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.8, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.7 })
    );
    carBody.position.y = 0.7;
    carGroup.add(carBody);
    carGroup.visible = false;
    scene.add(carGroup);
    eng.carMesh = carGroup;

    // Boss 3D Model
    const bossGroup = new THREE.Group();
    const bossMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(level.villainColor),
      roughness: 0.4,
      metalness: 0.7,
    });
    eng.bossMaterial = bossMat;

    const bTorso = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.9, 1.9), bossMat);
    bTorso.position.y = 2.6;
    bTorso.castShadow = true;
    bossGroup.add(bTorso);

    const bHead = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    bHead.position.y = 4.4;
    bossGroup.add(bHead);

    if (level.villainPowers.includes('escudo_oscuro')) {
      const dShield = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 14, 14),
        new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          wireframe: true,
          transparent: true,
          opacity: 0.55,
        })
      );
      dShield.position.y = 2.6;
      bossGroup.add(dShield);
      eng.bossShieldMesh = dShield;
    }

    bossGroup.position.set(0, 0, -14);
    scene.add(bossGroup);
    eng.bossMesh = bossGroup;

    // Collectibles
    const collectibles: CollectibleItem3D[] = [];
    eng.collectibles = collectibles;

    if (level.specialMissionType === 'colosseum_lion_key') {
      const keyGroup = new THREE.Group();
      const kMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 8, 16), kMat);
      ring.position.y = 1.0;
      keyGroup.add(ring);
      keyGroup.position.set(-10, 0, 6);
      scene.add(keyGroup);
      collectibles.push({
        mesh: keyGroup,
        collected: false,
        x: -10,
        z: 6,
        specialType: 'lion_key',
      });
    }

    const sharedItemGeo = new THREE.IcosahedronGeometry(0.65, 1);
    const sharedItemMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(level.lifeStageColor),
      emissive: new THREE.Color(level.lifeStageColor),
      emissiveIntensity: 1.1,
    });

    for (let i = 0; i < level.objectiveCount; i++) {
      const g = new THREE.Group();
      const m = new THREE.Mesh(sharedItemGeo, sharedItemMat);
      m.position.y = 0.9;
      g.add(m);

      const angle = (i / level.objectiveCount) * Math.PI * 2;
      const radius = 8 + (i % 2) * 4;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - 2;

      g.position.set(x, 0, z);
      scene.add(g);
      collectibles.push({
        mesh: g,
        collected: false,
        x,
        z,
        specialType:
          level.specialMissionType === 'greek_scrolls'
            ? 'scroll'
            : level.specialMissionType === 'medieval_hens_castle'
            ? 'chicken'
            : 'trash',
      });
    }

    // Keyboard Controls
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
        setActiveWeapon('bat');
      } else if (k === '2') {
        setActiveWeapon('water_cannon');
      } else if (k === '3') {
        setActiveWeapon('lightning_staff');
      } else if (k === '4') {
        setActiveWeapon('fire_orb');
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

    // 60FPS Game Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (!eng.gameActive) {
        renderer.render(scene, camera);
        return;
      }

      // Animate 3D Referee Floating & Following Match
      if (eng.refereeGroup) {
        eng.refereeGroup.position.y = 0.4 + Math.sin(elapsed * 3) * 0.25;
        eng.refereeGroup.rotation.y = Math.atan2(
          eng.heroPos.x - eng.refereeGroup.position.x,
          eng.heroPos.z - eng.refereeGroup.position.z
        );
      }

      // Player Movement
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
        const accel = 0.024 * speedMultiplier;
        const maxSpd = 0.55 * speedMultiplier;

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
        const walkSpeed = (eng.movementMode === 'flying' ? 0.34 : 0.25) * speedMultiplier;
        let mx = 0;
        let mz = 0;
        if (isUp) mz -= 1;
        if (isDown) mz += 1;
        if (isLeft) mx -= 1;
        if (isRight) mx += 1;

        const isMoving = mx !== 0 || mz !== 0;

        if (isMoving) {
          const len = Math.sqrt(mx * mx + mz * mz);
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

          // Natural walk cycle animation for arms & legs - eliminates frozen sliding!
          if (eng.movementMode === 'on_foot') {
            if (isMoving) {
              const swing = Math.sin(elapsed * 12) * 0.45;
              if (eng.armsMesh[0]) eng.armsMesh[0].rotation.x = swing;
              if (eng.armsMesh[1]) eng.armsMesh[1].rotation.x = -swing;
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

      // Update 3D Directional Guide Arrow for Kids (Points to nearest objective or Boss)
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

      // Smooth Third-Person Console Camera
      const camDist = eng.movementMode === 'in_vehicle' ? 17 : 14;
      const camHeight = eng.movementMode === 'in_vehicle' ? 11 : 10;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, eng.heroPos.x * 0.7, 0.1);
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
      camera.lookAt(eng.heroPos.x, (eng.heroPos.y || 0) + 1.2, eng.heroPos.z - 2);

      // Shield decay
      if (eng.shieldTimer > 0) {
        eng.shieldTimer--;
        if (eng.shieldTimer <= 0 && shieldDome) {
          shieldDome.visible = false;
          eng.isShieldActive = false;
        }
      }

      // Projectiles update
      for (let i = eng.projectiles.length - 1; i >= 0; i--) {
        const p = eng.projectiles[i];
        p.mesh.position.x += p.vx;
        p.mesh.position.z += p.vz;
        p.life--;

        if (p.isEnemy) {
          const hDist = Math.hypot(
            eng.heroPos.x - p.mesh.position.x,
            eng.heroPos.z - p.mesh.position.z
          );
          if (hDist < 2.0 || p.life <= 0) {
            scene.remove(p.mesh);
            eng.projectiles.splice(i, 1);
            if (hDist < 2.0 && !eng.isShieldActive) {
              eng.heroHp = Math.max(0, eng.heroHp - 12);
              setHudHp(eng.heroHp);
              soundEffects.playRefereeWhistle();
              setRefereeCall('¡FALTA! ⚠️ Infracción por vertido tóxico');
              if (eng.heroHp <= 0) {
                eng.gameActive = false;
                setIsDefeat(true);
              }
            }
          }
          continue;
        }

        const bDist = Math.hypot(
          eng.bossPos.x - p.mesh.position.x,
          eng.bossPos.z - p.mesh.position.z
        );
        if (bDist < 3.0 || p.life <= 0) {
          scene.remove(p.mesh);
          eng.projectiles.splice(i, 1);

          if (bDist < 3.0) {
            if (eng.bossShield > 0) {
              eng.bossShield = Math.max(0, eng.bossShield - p.damage);
              setHudBossShield(eng.bossShield);
              if (eng.bossShield <= 0 && eng.bossShieldMesh) {
                eng.bossShieldMesh.visible = false;
                setRefereeCall('🎉 ¡Escudo roto! Dispara al villano');
              }
            } else {
              eng.bossHp = Math.max(0, eng.bossHp - p.damage);
              eng.bossFlashTimer = 6;
              soundEffects.playBossHurtSound();
              setHudBossHp(eng.bossHp);

              if (eng.bossHp <= 0) {
                eng.gameActive = false;
                setIsVictory(true);
                onAddCoinsRef.current(100);
                soundEffects.playVictoryFanfare();
                confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
              }
            }
          }
        }
      }

      // Boss AI
      if (bossGroup) {
        bossGroup.position.y = Math.sin(elapsed * 2) * 0.25;
        const bdx = eng.heroPos.x - bossGroup.position.x;
        const bdz = eng.heroPos.z - bossGroup.position.z;
        bossGroup.rotation.y = Math.atan2(bdx, bdz);

        if (eng.bossFlashTimer > 0) {
          eng.bossFlashTimer--;
          bossMat.emissive.setHex(0xff0000);
          bossMat.emissiveIntensity = 2.0;
        } else {
          bossMat.emissive.setHex(0x000000);
          bossMat.emissiveIntensity = 0;
        }

        eng.bossAttackTimer += delta;
        if (eng.bossAttackTimer > 3.8) {
          eng.bossAttackTimer = 0;
          const bomb = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x84cc16 })
          );
          bomb.position.set(bossGroup.position.x, 2.2, bossGroup.position.z);
          scene.add(bomb);

          const pDist = Math.hypot(bdx, bdz) || 1;
          eng.projectiles.push({
            mesh: bomb,
            vx: (bdx / pDist) * 0.4,
            vz: (bdz / pDist) * 0.4,
            life: 65,
            damage: 12,
            type: 'trash_bomb',
            isEnemy: true,
          });
        }
      }

      // Spin collectibles & auto-collect when kid walks right over them!
      for (const item of eng.collectibles) {
        if (!item.collected) {
          item.mesh.rotation.y = elapsed * 2.0;
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [level.id, muscleScale]);

  const handleRestart = () => {
    soundEffects.playClickSound();
    const eng = engineRef.current;
    eng.gameActive = true;
    eng.heroPos = { x: 0, y: 0, z: 8 };
    eng.heroHp = 100;
    eng.bossHp = level.villainHp;
    eng.bossShield = level.villainPowers.includes('escudo_oscuro') ? 100 : 0;
    eng.objectivesDone = 0;
    eng.hasLionKey = false;
    eng.isLionFreed = false;

    setHasLionKey(false);
    setIsLionFreed(false);
    setHudHp(100);
    setHudBossHp(level.villainHp);
    setHudBossShield(eng.bossShield);
    setHudObjectives(0);
    setIsVictory(false);
    setIsDefeat(false);
    setRefereeCall('🏁 Partida reiniciada. ¡A jugar limpio!');

    eng.collectibles.forEach((c) => {
      c.collected = false;
      c.mesh.visible = true;
    });
    if (eng.cageMesh) eng.cageMesh.visible = true;
    if (eng.bossShieldMesh) eng.bossShieldMesh.visible = true;
  };

  const setTouchMove = (x: number, z: number) => {
    engineRef.current.touchDir = { x, z };
  };

  const handleAnswerTrivia = (idx: number) => {
    setSelectedTriviaOption(idx);
    if (idx === level.trivia.correctIndex) {
      setTriviaResult('correct');
      awardGreenCard('🟩 ¡Respuesta ejemplar! Escudo del villano destruido');
      onAddCoinsRef.current(500);
      engineRef.current.heroHp = 100;
      engineRef.current.bossShield = 0;
      if (engineRef.current.bossShieldMesh) {
        engineRef.current.bossShieldMesh.visible = false;
      }
      setHudHp(100);
      setHudBossShield(0);
      triggerCoinToast('🎉 +500 🪙 & Vida al 100%!');
    } else {
      setTriviaResult('wrong');
      soundEffects.playRefereeWhistle();
      setRefereeCall('¡FALTA! 🟨 Infracción en respuesta');
      soundEffects.playBossHurtSound();
    }
  };

  const heartsCount = Math.ceil((hudHp / 100) * 5);

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] sm:h-[calc(100vh-84px)] min-h-[520px] max-h-[960px] bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none touch-none">
      {/* FULL-SCREEN 3D CANVAS */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* FLOATING REWARD TOAST */}
      {coinRewardToast && (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-heading font-black text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-2xl z-30 animate-bounce flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{coinRewardToast}</span>
        </div>
      )}

      {/* ==========================================
          KID-FRIENDLY RESPONSIVE TOP HUD
         ========================================== */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pointer-events-none z-10">
        {/* 1. HERO & HEARTS PILL (Tap to switch hero!) */}
        <button
          onClick={handleSwapHero}
          className="bg-slate-950/90 backdrop-blur-md border-2 border-slate-700 hover:border-cyan-400 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 pr-2.5 sm:pr-4 shadow-xl flex items-center gap-2 sm:gap-3 pointer-events-auto active:scale-95 transition-all"
          title="Toca para alternar entre Richard y Juan"
        >
          <Hero3DPortrait heroId={activeHero} size={42} muscleLevel={level.id} />
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-heading font-black text-xs sm:text-sm text-white">
                {HERO_DUO[activeHero].name.toUpperCase()}
              </span>
              <span className="text-[9px] sm:text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full font-black">
                CAMBIAR
              </span>
            </div>
            {/* 5 Visual Hearts for Kids */}
            <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((h) => (
                <Heart
                  key={h}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    h <= heartsCount
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-700 fill-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </button>

        {/* 2. REFEREE LIVE CALL & BONUS TRIVIA */}
        <div className="bg-slate-950/90 backdrop-blur-md border-2 border-amber-400/70 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-xl flex items-center gap-2 sm:gap-3 pointer-events-auto max-w-[210px] sm:max-w-[320px]">
          <Referee3DPortrait size={38} />
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase text-amber-400">
              <span>ÁRBITRO 3D</span>
              <span>·</span>
              <span className="text-emerald-400">🌟 {hudObjectives}/{level.objectiveCount}</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold text-white truncate">{refereeCall}</p>
          </div>

          <button
            onClick={() => {
              soundEffects.playClickSound();
              setShowTriviaModal(true);
            }}
            className="px-2 sm:px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] sm:text-xs rounded-lg sm:rounded-xl shadow flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
            title="Pregunta del Árbitro para romper escudo"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BONUS</span>
          </button>
        </div>

        {/* 3. VILLAIN HEALTH, AUDIO & EXIT */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-md border-2 border-rose-500/60 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 pl-2 sm:pl-3 shadow-xl flex items-center gap-2">
            <div className="text-right min-w-[70px] sm:min-w-[90px]">
              <span className="text-[10px] sm:text-xs font-black text-rose-300 block truncate max-w-[90px] sm:max-w-[110px]">
                {level.villainName.split(' ')[0]}
              </span>
              <div className="w-full h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all"
                  style={{ width: `${(hudBossHp / level.villainHp) * 100}%` }}
                />
              </div>
              {hudBossShield > 0 && (
                <span className="text-[8px] sm:text-[9px] font-black text-purple-300 block">
                  🛡️ {hudBossShield}%
                </span>
              )}
            </div>
            <Villain3DPortrait
              name={level.villainName.split(' ')[0]}
              title={level.villainTitle}
              color={level.villainColor}
              size={36}
            />
          </div>

          <button
            onClick={() => {
              const next = !soundOn;
              soundEffects.enabled = next;
              setSoundOn(next);
            }}
            className="p-2 sm:p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl sm:rounded-2xl border-2 border-slate-700 shadow-xl transition-colors"
            title={soundOn ? 'Silenciar' : 'Activar sonido'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onExitArena}
            className="p-2 sm:p-2.5 bg-slate-900/90 hover:bg-rose-600 text-white rounded-xl sm:rounded-2xl border-2 border-slate-700 shadow-xl transition-colors"
            title="Salir al Mapa"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SPECIAL MISSION VISUAL PILL (Rome Key) */}
      {level.specialMissionType === 'colosseum_lion_key' && !isLionFreed && (
        <div className="absolute top-16 sm:top-20 left-3 sm:left-4 bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl flex items-center gap-1.5 sm:gap-2 z-20 pointer-events-none">
          <Key className="w-4 h-4" />
          <span>
            {hasLionKey
              ? '¡Ve a la jaula central para liberar al León! 🦁'
              : '¡Busca la Llave Dorada brillante en la arena! 🔑'}
          </span>
        </div>
      )}

      {/* ========================================================
          WEAPON & ELEMENTAL POWERS SELECTOR BAR
         ======================================================== */}
      <div className="absolute bottom-[170px] sm:bottom-[150px] left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-slate-950/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border-2 border-slate-700 shadow-2xl max-w-[94vw] overflow-x-auto touch-none">
        <button
          onClick={() => {
            soundEffects.playWaterStreamSound();
            setActiveWeapon('water_cannon');
          }}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap active:scale-95 ${
            activeWeapon === 'water_cannon'
              ? 'bg-cyan-400 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-white'
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
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap active:scale-95 ${
            activeWeapon === 'lightning_staff'
              ? 'bg-sky-400 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-white'
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
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap active:scale-95 ${
            activeWeapon === 'fire_orb'
              ? 'bg-orange-500 text-white shadow-md scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span>🔥</span>
          <span>Fuego</span>
        </button>
        <button
          onClick={() => {
            soundEffects.playBatSwingSound();
            setActiveWeapon('bat');
          }}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap active:scale-95 ${
            activeWeapon === 'bat'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-white'
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
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap active:scale-95 ${
            activeWeapon === 'shield'
              ? 'bg-emerald-400 text-slate-950 shadow-md scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span>🛡️</span>
          <span>Escudo</span>
        </button>
      </div>

      {/* ========================================================
          MOBILE & DESKTOP ON-SCREEN TOUCH CONTROLS
         ======================================================== */}
      {/* LEFT THUMB ZONE: D-PAD + QUICK CHARACTER SWAP */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 pointer-events-auto flex flex-col items-center gap-2 touch-none select-none">
        {/* Quick Hero Swap Button for Left Thumb */}
        <button
          onClick={handleSwapHero}
          className="w-full bg-slate-950/90 backdrop-blur-md border-2 border-cyan-400/80 hover:border-cyan-300 active:scale-95 text-cyan-300 px-3 py-1.5 rounded-2xl text-[11px] sm:text-xs font-heading font-black shadow-lg flex items-center justify-center gap-1.5"
          title="Alternar entre Richard y Juan"
        >
          <span className="text-base">{activeHero === 'richard' ? '🧡' : '💚'}</span>
          <span>CAMBIAR [{activeHero === 'richard' ? 'JUAN' : 'RICHARD'}]</span>
        </button>

        {/* 4-Way Virtual D-Pad with generous touch-responsive buttons */}
        <div className="bg-slate-950/90 backdrop-blur-md border-2 border-slate-700/80 p-1.5 sm:p-2 rounded-3xl shadow-2xl flex flex-col items-center gap-1 sm:gap-1.5">
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
            className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow transition-colors touch-none select-none"
            title="Avanzar (Arriba / W)"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
          </button>
          <div className="flex gap-1 sm:gap-1.5">
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
              className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow transition-colors touch-none select-none"
              title="Izquierda (A)"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
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
              className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow transition-colors touch-none select-none"
              title="Retroceder (Abajo / S)"
            >
              <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
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
              className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow transition-colors touch-none select-none"
              title="Derecha (D)"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT THUMB ZONE: ACTION BUTTONS, GTA VEHICLE/FLIGHT & POWER PEARLS */}
      <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 pointer-events-auto flex flex-col items-end gap-2 touch-none select-none">
        {/* Row 1: Vehicle & Flight Mode + Power Pearls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Teleport Pearl Button */}
          <button
            onClick={handleUseTeleportPearl}
            disabled={pearlsTeleport <= 0}
            className={`px-2.5 sm:px-3 py-2 rounded-2xl font-black text-[10px] sm:text-xs flex items-center gap-1 border shadow-lg transition-all active:scale-95 ${
              pearlsTeleport > 0
                ? 'bg-purple-950/80 border-purple-500 text-purple-300 hover:bg-purple-900'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
            }`}
            title="Teletransporte instantáneo [T]"
          >
            <span>🔮</span>
            <span>TELEPORT</span>
            <span className="bg-purple-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[9px] font-black">
              {pearlsTeleport}
            </span>
          </button>

          {/* Nitro Speed Pearl Button */}
          <button
            onClick={handleUseSpeedPearl}
            disabled={pearlsSpeed <= 0}
            className={`px-2.5 sm:px-3 py-2 rounded-2xl font-black text-[10px] sm:text-xs flex items-center gap-1 border shadow-lg transition-all active:scale-95 ${
              pearlsSpeed > 0
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 hover:bg-amber-900'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
            }`}
            title="Súper velocidad sónica [Shift]"
          >
            <span>⚡</span>
            <span>NITRO</span>
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[9px] font-black">
              {pearlsSpeed}
            </span>
          </button>

          {/* GTA Eco-Buggy Car Mode Toggle */}
          <button
            onClick={handleToggleVehicle}
            className={`px-2.5 sm:px-3.5 py-2 rounded-2xl font-heading font-black text-[10px] sm:text-xs flex items-center gap-1 border-2 shadow-xl transition-all active:scale-95 ${
              movementMode === 'in_vehicle'
                ? 'bg-emerald-400 border-white text-slate-950 scale-105'
                : 'bg-slate-950/90 border-slate-700 text-emerald-400 hover:border-emerald-400'
            }`}
            title="Conducir Carro [E]"
          >
            <Car className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">CARRO</span>
          </button>

          {/* Plane Flight Mode Toggle */}
          <button
            onClick={handleToggleFlight}
            className={`px-2.5 sm:px-3.5 py-2 rounded-2xl font-heading font-black text-[10px] sm:text-xs flex items-center gap-1 border-2 shadow-xl transition-all active:scale-95 ${
              movementMode === 'flying'
                ? 'bg-sky-400 border-white text-slate-950 scale-105'
                : 'bg-slate-950/90 border-slate-700 text-sky-400 hover:border-sky-400'
            }`}
            title="Volar / Planear [F]"
          >
            <Plane className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">VOLAR</span>
          </button>
        </div>

        {/* Row 2: Big Dual Action Buttons (Clean / Habit & Attack) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Big Clean / Collect Habit Button */}
          <button
            onClick={handleCollect}
            className="w-20 h-16 sm:w-28 sm:h-16 bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 active:scale-90 text-slate-950 font-heading font-black text-xs sm:text-sm rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-200 flex flex-col items-center justify-center gap-0.5"
            title="Limpiar contaminación y recolectar [J]"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>LIMPIAR [J]</span>
          </button>

          {/* Big Attack / Fire Button */}
          <button
            onClick={handleAttack}
            className="w-24 h-16 sm:w-32 sm:h-16 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 active:scale-90 text-white font-heading font-black text-xs sm:text-sm rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-rose-300 flex flex-col items-center justify-center gap-0.5"
            title="Disparar Poder o Batir [K / Espacio]"
          >
            <Crosshair className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>DISPARAR [K]</span>
          </button>
        </div>
      </div>

      {/* KID-FRIENDLY TRIVIA BONUS MODAL */}
      {showTriviaModal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-40">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Referee3DPortrait size={54} />
                <div>
                  <span className="text-xs font-black text-amber-400 uppercase block">
                    PREGUNTA DEL ÁRBITRO
                  </span>
                  <h3 className="font-heading font-black text-white text-base">
                    ¡Gana Tarjeta Verde y Rompe el Escudo!
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTriviaModal(false);
                  setSelectedTriviaOption(null);
                  setTriviaResult(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cerrar
              </button>
            </div>

            <p className="text-sm font-bold text-white mb-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              {level.trivia.question}
            </p>

            <div className="flex flex-col gap-2.5 mb-4">
              {level.trivia.options.map((opt, idx) => {
                const isSelected = selectedTriviaOption === idx;
                const isCorrect = idx === level.trivia.correctIndex;
                let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-cyan-400';

                if (triviaResult && isSelected) {
                  btnStyle = isCorrect
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-rose-950 border-rose-400 text-rose-300';
                }

                return (
                  <button
                    key={idx}
                    disabled={triviaResult !== null}
                    onClick={() => handleAnswerTrivia(idx)}
                    className={`p-3.5 rounded-2xl border-2 text-left text-xs font-bold transition-all flex items-center gap-3 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {triviaResult && (
              <div
                className={`p-3.5 rounded-2xl border-2 text-xs font-bold ${
                  triviaResult === 'correct'
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-400 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {triviaResult === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>¡TARJETA VERDE! +500 🪙 y Escudo Oscuro Destruido</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span>¡Casi! Inténtalo de nuevo</span>
                    </>
                  )}
                </div>
                <p className="text-slate-200">{level.trivia.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VICTORY MODAL CERTIFIED BY THE 3D REFEREE */}
      {isVictory && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-40">
          <div className="bg-slate-900 border-2 border-emerald-400 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="flex justify-center mb-3">
              <Referee3DPortrait size={88} />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase">
              ✓ VICTORIA VALIDADA POR EL ÁRBITRO
            </span>

            <h2 className="text-2xl font-heading font-black text-white mt-2 mb-1">
              ¡NIVEL {level.id} SUPERADO!
            </h2>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 my-4 flex justify-around text-center">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Premio</span>
                <span className="text-base font-black text-amber-400">
                  +{level.coinsReward.toLocaleString()} 🪙
                </span>
              </div>
              <div className="w-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 font-bold block">Juego Limpio</span>
                <span className="text-base font-black text-emerald-400">
                  🟩 +{matchGreenCards} Tarjetas
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onLevelComplete(level.id, level.coinsReward, level.powerReward, level.badgeName);
                onExitArena();
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-heading font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" />
              <span>CONTINUAR Y GUARDAR EN SERVIDOR</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT OVERLAY */}
      {isDefeat && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-40">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-400">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-heading font-black text-white mb-2">
              ¡TIEMPO FUERA DEL ÁRBITRO!
            </h2>
            <p className="text-xs text-slate-300 font-bold mb-5">
              Usa el Carro [E] o responde la pregunta BONUS para destruir el escudo del villano.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onExitArena}
                className="flex-1 py-3 bg-slate-800 text-white text-xs font-black rounded-2xl"
              >
                MAPA
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-rose-600 text-white text-xs font-black rounded-2xl shadow-lg"
              >
                REINTENTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
