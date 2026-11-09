import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarProfile, GenderType, HeroClassId } from '../types/game';
import { HERO_CLASSES } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import {
  User,
  Shield,
  Zap,
  Sparkles,
  Check,
  RotateCw,
  Flame,
  Droplets,
  Wind,
} from 'lucide-react';

interface AvatarCustomizerProps {
  avatar: AvatarProfile;
  playerPower: number;
  onSaveAvatar: (newAvatar: AvatarProfile) => void;
  onClose: () => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  avatar,
  playerPower,
  onSaveAvatar,
  onClose,
}) => {
  const [profile, setProfile] = useState<AvatarProfile>(avatar);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    characterGroup: THREE.Group;
    torsoMesh: THREE.Mesh;
    headMesh: THREE.Mesh;
    coreMesh: THREE.Mesh;
    animId: number;
  } | null>(null);

  const activeClass =
    HERO_CLASSES.find((c) => c.id === profile.classId) || HERO_CLASSES[0];

  // Initialize 3D Viewport for Hero preview
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1322);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.6);
    camera.lookAt(0, 1.3, 0);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    keyLight.position.set(5, 10, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -0.1;
    scene.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(1.5, 0.04, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(activeClass.glowColor) });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // Character Group
    const characterGroup = new THREE.Group();

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.55);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.themeColor),
      metalness: 0.7,
      roughness: 0.3,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 1.25;
    characterGroup.add(torsoMesh);

    // Arc Core
    const coreGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.glowColor),
      emissive: new THREE.Color(activeClass.glowColor),
      emissiveIntensity: 2.0,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.rotation.x = Math.PI / 2;
    coreMesh.position.set(0, 1.35, 0.28);
    characterGroup.add(coreMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.accentColor),
      metalness: 0.8,
      roughness: 0.2,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 2.05;
    characterGroup.add(headMesh);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
    const visorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.glowColor),
      emissive: new THREE.Color(activeClass.glowColor),
      emissiveIntensity: 1.5,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 2.05, 0.32);
    characterGroup.add(visor);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.26, 0.75, 0.26);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(activeClass.themeColor) });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.65, 1.25, 0);
    characterGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.65, 1.25, 0);
    characterGroup.add(armR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 0.75, 0.3);
    const legMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(activeClass.accentColor) });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.25, 0.45, 0);
    characterGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.25, 0.45, 0);
    characterGroup.add(legR);

    scene.add(characterGroup);

    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotation & gentle float
      characterGroup.rotation.y = elapsed * 0.45;
      characterGroup.position.y = Math.sin(elapsed * 2) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      characterGroup,
      torsoMesh,
      headMesh,
      coreMesh,
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
  }, [activeClass.glowColor, activeClass.themeColor, activeClass.accentColor]);

  // Update materials when class changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { torsoMesh, headMesh, coreMesh } = sceneRef.current;
    const cl = HERO_CLASSES.find((c) => c.id === profile.classId) || HERO_CLASSES[0];

    (torsoMesh.material as THREE.MeshStandardMaterial).color.set(cl.themeColor);
    (headMesh.material as THREE.MeshStandardMaterial).color.set(cl.accentColor);
    (coreMesh.material as THREE.MeshStandardMaterial).color.set(cl.glowColor);
    (coreMesh.material as THREE.MeshStandardMaterial).emissive.set(cl.glowColor);
  }, [profile.classId]);

  const handleGenderSelect = (gender: GenderType) => {
    soundEffects.playClickSound();
    setProfile((prev) => ({ ...prev, gender }));
  };

  const handleClassSelect = (classId: HeroClassId) => {
    soundEffects.playClickSound();
    setProfile((prev) => ({
      ...prev,
      classId,
      primaryColor: HERO_CLASSES.find((c) => c.id === classId)?.themeColor || prev.primaryColor,
      secondaryColor: HERO_CLASSES.find((c) => c.id === classId)?.accentColor || prev.secondaryColor,
    }));
  };

  const handleSave = () => {
    soundEffects.playCollectSound();
    onSaveAvatar(profile);
    onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-5xl w-full mx-auto shadow-2xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <span>FORJA DE HÉROES & CLASES ELEMENTALES</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecciona tu arquetipo heroico: Mago Eléctrico, Velocista, Rey de Fuego, Rey del Agua o Corredor del Cielo.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 transition-colors"
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: 3D Viewport */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-700/80 text-[10px] font-mono flex items-center gap-1.5 pointer-events-none" style={{ color: activeClass.glowColor }}>
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Visor 3D: {activeClass.name}</span>
            </div>
          </div>

          <div className="mt-4 w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-around text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Poder</span>
              <span className="text-sm font-bold text-amber-400 font-mono">+{activeClass.bonusPower}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Velocidad</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">+{activeClass.bonusSpeed}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Defensa</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">+{activeClass.bonusDefense}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customization Controls */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Avatar Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Nombre del Avatar
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              maxLength={22}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Ej: Rayo Solar, Valkiria Cósmica..."
            />
          </div>

          {/* Gender Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Identidad del Personaje
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['mujer', 'hombre', 'androgino'] as GenderType[]).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderSelect(g)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    profile.gender === g
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g === 'mujer' ? 'Heroína' : g === 'hombre' ? 'Héroe' : 'Andrógino'}
                </button>
              ))}
            </div>
          </div>

          {/* 5 HERO CLASSES */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Selecciona tu Clase de Héroe (5 Opciones con Poderes)
              </label>
              <span className="text-[11px] text-cyan-400 font-mono">{activeClass.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {HERO_CLASSES.map((cl) => {
                const isSelected = profile.classId === cl.id;

                return (
                  <button
                    key={cl.id}
                    onClick={() => handleClassSelect(cl.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-400 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {cl.id === 'rey-fuego' ? <Flame className="w-4 h-4 text-orange-400" /> :
                         cl.id === 'rey-agua' ? <Droplets className="w-4 h-4 text-cyan-400" /> :
                         cl.id === 'corredor-cielo' ? <Wind className="w-4 h-4 text-purple-400" /> :
                         <Zap className="w-4 h-4" style={{ color: cl.glowColor }} />}
                        <span className="text-xs font-bold text-slate-200 truncate">{cl.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>

                    <div className="space-y-0.5 text-[10px] text-slate-300 mb-1.5">
                      <p><span className="text-slate-400">Poder [K]:</span> {cl.primaryPower}</p>
                      <p><span className="text-slate-400">Especial [L]:</span> {cl.specialPower}</p>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400">{cl.passiveTrait}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirmar Personaje</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
