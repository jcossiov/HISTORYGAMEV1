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
  Layers,
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
    'Núcleo listo. Pulsa "Probar" para ver a tu robot en acción.',
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
    scene.background = new THREE.Color(0x0e2a47);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
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
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
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
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.7, roughness: 0.25 });
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

    const headGeo = new THREE.BoxGeometry(0.6, 0.65, 0.6);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(mech.accentColor),
      metalness: 0.9,
      roughness: 0.15,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3;
    mechGroup.add(head);

    const eyeGeo = new THREE.BoxGeometry(0.44, 0.1, 0.15);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x00ffff,
      emissiveIntensity: 2.5,
    });
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    eyes.position.set(0, 2.32, 0.3);
    mechGroup.add(eyes);

    const shoulderGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
    const shoulderMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mech.accentColor) });
    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderL.position.set(-(torsoW / 2 + 0.3), 1.9, 0);
    mechGroup.add(shoulderL);
    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderR.position.set(torsoW / 2 + 0.3, 1.9, 0);
    mechGroup.add(shoulderR);

    const armGeo = new THREE.BoxGeometry(0.32, 0.9, 0.35);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mech.primaryColor), metalness: 0.8 });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-(torsoW / 2 + 0.3), 1.3, 0);
    mechGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(torsoW / 2 + 0.3, 1.3, 0);
    mechGroup.add(armR);

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
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
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
      setSimLogs(['Error: Añade al menos un bloque antes de probar.']);
      return;
    }

    setSimRunning(true);
    setSimBossHp(1000);
    soundEffects.playLaserSound();

    const newLogs: string[] = ['[Probando a tu robot…]'];
    let currentHp = 1000;

    mech.programmedBlocks.forEach((block, idx) => {
      setTimeout(() => {
        if (block.category === 'trigger') {
          soundEffects.playClickSound();
          newLogs.push(`⏱️ [Sensor]: ${block.label} -> ¡Activado!`);
        } else if (block.category === 'condition') {
          soundEffects.playDashSound();
          newLogs.push(`⚡ [Pregunta]: ${block.label} -> ¡Sí!`);
        } else if (block.category === 'action') {
          soundEffects.playAttackSound();
          const dmg = block.powerRating * 3;
          currentHp = Math.max(0, currentHp - dmg);
          setSimBossHp(currentHp);
          newLogs.push(`💥 [Poder]: ${block.label}. Daño: -${dmg} HP`);
        }
        setSimLogs([...newLogs]);

        if (idx === mech.programmedBlocks.length - 1) {
          setTimeout(() => {
            soundEffects.playVictoryFanfare();
            newLogs.push(`🎉 ¡Tu robot ganó la prueba!`);
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
    <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-6xl w-full mx-auto shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-sky-100/70 pb-4 mb-6 gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">
            Laboratorio de Lógica & Robótica
          </span>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
            <Cpu className="w-5 h-5 text-violet-500" />
            <span>Taller de Robots Comunitarios</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Programa bloques de lógica para automatizar reciclaje y protección ecológica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-slate-200 transition-all shadow-sm"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              soundEffects.playCollectSound();
              onSaveMech(mech);
              onClose();
            }}
            className="text-xs font-bold text-white px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-violet-500/20 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Visualizer & Chassis Column */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-inner flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/60 text-[10px] text-violet-700 font-bold flex items-center gap-1.5 pointer-events-none shadow-sm">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Reactor: En Línea</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-4">
            <label className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">
              Chasis del Guardián
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundEffects.playClickSound();
                  setMech({ ...mech, chassis: 'ironman', name: 'Robot Titán' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  mech.chassis === 'ironman'
                    ? 'bg-violet-50 border-violet-400 text-violet-700 shadow-sm'
                    : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                🤖 Titán Ecológico
              </button>
              <button
                onClick={() => {
                  soundEffects.playClickSound();
                  setMech({ ...mech, chassis: 'ironwoman', name: 'Robot Valquiria' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  mech.chassis === 'ironwoman'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                    : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                🦾 Valquiria Verde
              </button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Estadísticas de Soporte
            </span>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium">Potencia Hídrica</span>
                  <span className="text-sky-600 font-bold">{mech.stats.firepower} 💧</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all rounded-full" style={{ width: `${Math.min(100, mech.stats.firepower / 2)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium">Blindaje Comunitario</span>
                  <span className="text-emerald-600 font-bold">{mech.stats.shield} 🛡️</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all rounded-full" style={{ width: `${Math.min(100, mech.stats.shield / 2)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOGIC BLOCKS WORKSPACE */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-4 sm:p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Algoritmo Activo ({mech.programmedBlocks.length} instrucciones)
                </span>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={simRunning}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{simRunning ? 'Simulando…' : 'Ejecutar'}</span>
              </button>
            </div>

            {mech.programmedBlocks.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Sliders className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  El robot no tiene instrucciones. Añade bloques desde el panel inferior.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                {mech.programmedBlocks.map((block, idx) => (
                  <div
                    key={`${block.id}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-white/90 text-xs gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0"
                        style={{ backgroundColor: `${block.color}15`, color: block.color }}
                      >
                        {block.category === 'trigger' ? 'Sensor' : block.category === 'condition' ? 'Condición' : 'Acción'}
                      </span>
                      <span className="text-slate-800 font-semibold truncate">{block.label}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-amber-600 font-bold">+{block.powerRating}⚡</span>
                      <button
                        onClick={() => handleRemoveBlock(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Quitar bloque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Librería de Instrucciones
              </span>
              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
                {(['all', 'trigger', 'condition', 'action'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBlockCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      selectedBlockCategory === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'trigger' ? 'Sensores' : cat === 'condition' ? 'Condición' : 'Acciones'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
              {filteredBlocks.map((block) => (
                <div
                  key={block.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-violet-300 transition-all flex flex-col justify-between gap-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: `${block.color}15`, color: block.color }}
                    >
                      {block.category === 'trigger' ? 'Sensor' : block.category === 'condition' ? 'Condición' : 'Acción'}
                    </span>
                    <button
                      onClick={() => handleAddBlock(block)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-violet-600 text-slate-700 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Añadir</span>
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{block.label}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">{block.codeSnippet}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 font-mono text-[11px] text-slate-300 max-h-[110px] overflow-y-auto">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              <span>Terminal de Diagnóstico</span>
              <span>Resistencia del Basurote: {simBossHp} / 1000 HP</span>
            </div>
            {simLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed text-emerald-400">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
