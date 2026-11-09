import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MechConfiguration, LogicBlock } from '../types/game';
import { INITIAL_LOGIC_BLOCKS } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import {
  Cpu,
  Zap,
  Play,
  Trash2,
  Plus,
  Shield,
  Layers,
  Sparkles,
  RotateCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface MechProgrammingStudioProps {
  mechConfig: MechConfiguration;
  playerPower: number;
  onSaveMech: (config: MechConfiguration) => void;
  onClose: () => void;
}

export const MechProgrammingStudio: React.FC<MechProgrammingStudioProps> = ({
  mechConfig,
  playerPower,
  onSaveMech,
  onClose,
}) => {
  const [mech, setMech] = useState<MechConfiguration>(mechConfig);
  const [selectedBlockCategory, setSelectedBlockCategory] = useState<'all' | 'trigger' | 'condition' | 'action'>('all');
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([
    'Núcleo Arc Reactor en línea. Esperando inicio de simulación de algoritmos...',
  ]);
  const [simBossHp, setSimBossHp] = useState<number>(1000);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mechGroup: THREE.Group;
    reactorMesh: THREE.Mesh;
    animId: number;
  } | null>(null);

  // Initialize 3D IronMech Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    const key = new THREE.DirectionalLight(0xfff5eb, 1.5);
    key.position.set(6, 12, 6);
    key.castShadow = true;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x06b6d4, 1.2);
    rim.position.set(-6, 3, -4);
    scene.add(rim);

    // Glowing Circular Platform
    const platGeo = new THREE.CylinderGeometry(1.8, 2.0, 0.2, 32);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.y = -0.1;
    scene.add(platform);

    const ringGeo = new THREE.TorusGeometry(1.6, 0.05, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // BUILD 3D IRONMECH
    const mechGroup = new THREE.Group();

    // Torso (Heavy Chiseled Armor)
    const isIronWoman = mech.chassis === 'ironwoman';
    const torsoW = isIronWoman ? 1.0 : 1.3;
    const torsoGeo = new THREE.BoxGeometry(torsoW, 1.3, 0.7);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(mech.primaryColor),
      metalness: 0.85,
      roughness: 0.2,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.4;
    torso.castShadow = true;
    mechGroup.add(torso);

    // Arc Reactor Core (Glowing Repulsor Heart)
    const reactorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24);
    const reactorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(mech.reactorColor),
      emissive: new THREE.Color(mech.reactorColor),
      emissiveIntensity: 2.2,
    });
    const reactorMesh = new THREE.Mesh(reactorGeo, reactorMat);
    reactorMesh.rotation.x = Math.PI / 2;
    reactorMesh.position.set(0, 1.5, 0.36);
    mechGroup.add(reactorMesh);

    // Iron Helmet
    const headGeo = new THREE.BoxGeometry(0.6, 0.65, 0.6);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(mech.accentColor),
      metalness: 0.9,
      roughness: 0.15,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3;
    mechGroup.add(head);

    // Slanted Eye Slits (Visor)
    const eyeGeo = new THREE.BoxGeometry(0.44, 0.1, 0.15);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x00ffff,
      emissiveIntensity: 2.5,
    });
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    eyes.position.set(0, 2.32, 0.3);
    mechGroup.add(eyes);

    // Shoulder Guards
    const shoulderGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
    const shoulderMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mech.accentColor) });
    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderL.position.set(-(torsoW / 2 + 0.3), 1.9, 0);
    mechGroup.add(shoulderL);
    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderR.position.set(torsoW / 2 + 0.3, 1.9, 0);
    mechGroup.add(shoulderR);

    // Forearms with Repulsors
    const armGeo = new THREE.BoxGeometry(0.32, 0.9, 0.35);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mech.primaryColor), metalness: 0.8 });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-(torsoW / 2 + 0.3), 1.3, 0);
    mechGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(torsoW / 2 + 0.3, 1.3, 0);
    mechGroup.add(armR);

    // Thruster Wings
    const wingGeo = new THREE.BoxGeometry(0.2, 1.1, 0.4);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.6, 1.6, -0.4);
    wingL.rotation.z = 0.2;
    mechGroup.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0.6, 1.6, -0.4);
    wingR.rotation.z = -0.2;
    mechGroup.add(wingR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.4, 0.9, 0.45);
    const legMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mech.accentColor), metalness: 0.8 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.35, 0.45, 0);
    mechGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.35, 0.45, 0);
    mechGroup.add(legR);

    scene.add(mechGroup);

    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle rotation and dynamic engine pulse
      mechGroup.rotation.y = elapsed * 0.35;
      mechGroup.position.y = Math.sin(elapsed * 2) * 0.04;

      const pulse = 1.8 + Math.sin(elapsed * 6) * 0.6;
      (reactorMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;

      renderer.render(scene, camera);
    };

    animate();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      mechGroup,
      reactorMesh,
      animId,
    };

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mech.chassis]);

  // Add block to logic chain
  const handleAddBlock = (block: LogicBlock) => {
    soundEffects.playClickSound();
    setMech((prev) => {
      const nextBlocks = [...prev.programmedBlocks, block];
      // Recalculate stats
      const firepower = 50 + nextBlocks.reduce((acc, b) => acc + (b.category === 'action' ? b.powerRating : 5), 0);
      const shield = 40 + nextBlocks.reduce((acc, b) => acc + (b.category === 'condition' ? b.powerRating : 10), 0);
      const habitEnergy = 100 - nextBlocks.reduce((acc, b) => acc + b.energyCost, 0);

      return {
        ...prev,
        programmedBlocks: nextBlocks,
        stats: {
          ...prev.stats,
          firepower,
          shield,
          habitEnergy: Math.max(10, habitEnergy),
        },
      };
    });
  };

  // Remove block from chain
  const handleRemoveBlock = (index: number) => {
    soundEffects.playClickSound();
    setMech((prev) => {
      const nextBlocks = prev.programmedBlocks.filter((_, i) => i !== index);
      const firepower = 50 + nextBlocks.reduce((acc, b) => acc + (b.category === 'action' ? b.powerRating : 5), 0);
      const shield = 40 + nextBlocks.reduce((acc, b) => acc + (b.category === 'condition' ? b.powerRating : 10), 0);
      const habitEnergy = 100 - nextBlocks.reduce((acc, b) => acc + b.energyCost, 0);

      return {
        ...prev,
        programmedBlocks: nextBlocks,
        stats: {
          ...prev.stats,
          firepower,
          shield,
          habitEnergy: Math.max(10, habitEnergy),
        },
      };
    });
  };

  // Run Test Simulation
  const handleRunSimulation = () => {
    if (mech.programmedBlocks.length === 0) {
      setSimLogs(['Error: Programa al menos un bloque de acción o disparador antes de simular.']);
      return;
    }

    setSimRunning(true);
    setSimBossHp(1000);
    soundEffects.playLaserSound();

    const newLogs: string[] = ['[INICIANDO SIMULACIÓN DE COMBATE IRONMECH]'];
    let currentHp = 1000;

    mech.programmedBlocks.forEach((block, idx) => {
      setTimeout(() => {
        if (block.category === 'trigger') {
          soundEffects.playClickSound();
          newLogs.push(`⏱️ [TRIGGER]: ${block.label} -> Condición satisfecha`);
        } else if (block.category === 'condition') {
          soundEffects.playDashSound();
          newLogs.push(`⚡ [EVAL]: Verificando estado: ${block.label} -> POSITIVO`);
        } else if (block.category === 'action') {
          soundEffects.playAttackSound();
          const dmg = block.powerRating * 3;
          currentHp = Math.max(0, currentHp - dmg);
          setSimBossHp(currentHp);
          newLogs.push(`💥 [ACCIÓN]: ${block.label} ejecutada con éxito. Daño infligido: -${dmg} HP`);
        }
        setSimLogs([...newLogs]);

        if (idx === mech.programmedBlocks.length - 1) {
          setTimeout(() => {
            soundEffects.playVictoryFanfare();
            newLogs.push(`🎉 [VICTORIA DE PRUEBA]: Algoritmo de combate completado. Villano de prueba derrotado.`);
            setSimLogs([...newLogs]);
            setSimRunning(false);
          }, 600);
        }
      }, (idx + 1) * 600);
    });
  };

  const filteredBlocks = INITIAL_LOGIC_BLOCKS.filter((b) => {
    if (selectedBlockCategory === 'all') return true;
    return b.category === selectedBlockCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-6xl w-full mx-auto shadow-2xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>ESTUDIO DE PROGRAMACIÓN & FORJA IRONMECH</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crea y programa algoritmos tácticos para tu IronMan o IronWoman con nodos lógicos de IA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              soundEffects.playCollectSound();
              onSaveMech(mech);
              onClose();
            }}
            className="text-xs font-bold text-slate-950 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-1.5 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar IronMech</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Visualizer & Chassis Column */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-700 text-[10px] text-amber-400 font-mono flex items-center gap-1.5 pointer-events-none">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Reactor Arc: Activo</span>
            </div>
          </div>

          {/* Chassis Selection (IronMan vs IronWoman) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              Chasis Robótico
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundEffects.playClickSound();
                  setMech({ ...mech, chassis: 'ironman', name: 'IronMan Titan MK-VII' });
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  mech.chassis === 'ironman'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                IronMan Titan
              </button>
              <button
                onClick={() => {
                  soundEffects.playClickSound();
                  setMech({ ...mech, chassis: 'ironwoman', name: 'IronWoman Valkyrie MK-IX' });
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  mech.chassis === 'ironwoman'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                IronWoman Valkyrie
              </button>
            </div>
          </div>

          {/* Mech Stats Breakdown */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Métricas del Algoritmo
            </span>
            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-0.5">
                  <span>Poder de Fuego</span>
                  <span className="text-amber-400 font-mono font-bold">{mech.stats.firepower} ⚡</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${Math.min(100, mech.stats.firepower / 2)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-0.5">
                  <span>Escudo Nanotecnológico</span>
                  <span className="text-cyan-400 font-mono font-bold">{mech.stats.shield} 🛡️</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{ width: `${Math.min(100, mech.stats.shield / 2)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOGIC BLOCKS PROGRAMMING WORKSPACE */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Programmed Sequence Pipeline */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Cadena Lógica Programada ({mech.programmedBlocks.length} Nodos)
                </span>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={simRunning}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{simRunning ? 'Simulando...' : 'Probar en Combate'}</span>
              </button>
            </div>

            {mech.programmedBlocks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Tu IronMech aún no tiene módulos programados. Añade bloques desde la paleta inferior.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {mech.programmedBlocks.map((block, idx) => (
                  <div
                    key={`${block.id}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/90 text-xs gap-3 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0"
                        style={{ backgroundColor: `${block.color}25`, color: block.color }}
                      >
                        {block.category === 'trigger'
                          ? 'Sensor'
                          : block.category === 'condition'
                          ? 'Condición'
                          : 'Poder/Combo'}
                      </span>
                      <span className="text-slate-200 font-medium truncate">{block.label}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-amber-400 font-mono font-semibold">
                        +{block.powerRating}⚡
                      </span>
                      <button
                        onClick={() => handleRemoveBlock(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Eliminar nodo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PALETTE OF BLOCKS TO ADD */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Paleta de Módulos & Poderes
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['all', 'trigger', 'condition', 'action'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBlockCategory(cat)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      selectedBlockCategory === cat ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Todos'
                      : cat === 'trigger'
                      ? 'Sensores'
                      : cat === 'condition'
                      ? 'Condiciones'
                      : 'Combos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredBlocks.map((block) => (
                <div
                  key={block.id}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${block.color}20`, color: block.color }}
                    >
                      {block.category}
                    </span>
                    <button
                      onClick={() => handleAddBlock(block)}
                      className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded text-[11px] font-semibold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insertar</span>
                    </button>
                  </div>

                  <p className="text-xs font-medium text-slate-200 line-clamp-1">{block.label}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">{block.codeSnippet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SIMULATION CONSOLE LOGS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-[110px] overflow-y-auto">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase">
              <span>Consola de Telemetría Táctica</span>
              <span>HP Objetivo: {simBossHp} / 1000</span>
            </div>
            {simLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
