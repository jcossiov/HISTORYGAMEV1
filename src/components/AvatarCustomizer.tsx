import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarProfile, GenderType, HeroClassId } from '../types/game';
import { HERO_CLASSES } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import {
  User,
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
    scene.background = new THREE.Color(0x0e2a47);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.6);
    camera.lookAt(0, 1.3, 0);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.5);
    keyLight.position.set(5, 10, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.5, roughness: 0.4 });
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

    const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.55);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.themeColor),
      metalness: 0.7,
      roughness: 0.3,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 1.25;
    characterGroup.add(torsoMesh);

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

    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.accentColor),
      metalness: 0.8,
      roughness: 0.2,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 2.05;
    characterGroup.add(headMesh);

    const visorGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
    const visorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeClass.glowColor),
      emissive: new THREE.Color(activeClass.glowColor),
      emissiveIntensity: 1.5,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 2.05, 0.32);
    characterGroup.add(visor);

    const armGeo = new THREE.BoxGeometry(0.26, 0.75, 0.26);
    const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(activeClass.themeColor) });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.65, 1.25, 0);
    characterGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.65, 1.25, 0);
    characterGroup.add(armR);

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
    <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-5xl w-full mx-auto">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" />
            <span>Personalizar Héroe</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Elige el poder elemental de Richard o Juan para tus misiones.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: 3D Viewport */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-sky-200 bg-slate-900 shadow-inner flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute bottom-3 left-3 bg-white/90 px-2.5 py-1 rounded-md border border-sky-100 text-[10px] font-bold flex items-center gap-1.5 pointer-events-none" style={{ color: activeClass.secondaryColor }}>
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Visor 3D: {activeClass.name}</span>
            </div>
          </div>

          <div className="mt-4 w-full bg-sky-50 border border-sky-100 rounded-xl p-3 flex justify-around text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Poder</span>
              <span className="text-sm font-extrabold text-amber-500">+{activeClass.bonusPower}</span>
            </div>
            <div className="w-px h-8 bg-sky-100" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Velocidad</span>
              <span className="text-sm font-extrabold text-sky-600">+{activeClass.bonusSpeed}</span>
            </div>
            <div className="w-px h-8 bg-sky-100" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Defensa</span>
              <span className="text-sm font-extrabold text-emerald-600">+{activeClass.bonusDefense}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Controls */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
              Nombre del héroe
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              maxLength={22}
              className="w-full px-4 py-2 bg-white border border-sky-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="Ej: Rayo Solar, Valkiria…"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
              ¿Quién eres?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['heroina', 'heroe'] as GenderType[]).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderSelect(g)}
                  className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                    profile.gender === g
                      ? 'bg-sky-100 border-sky-400 text-sky-700 shadow-sm'
                      : 'bg-white border-sky-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {g === 'heroina' ? '👧 Niña' : '👦 Niño'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Elige tu superpoder (5 opciones)
              </label>
              <span className="text-[11px] text-sky-600 font-bold">{activeClass.name}</span>
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
                        ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400 shadow-sm'
                        : 'bg-white border-sky-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {cl.id === 'rey-fuego' ? <Flame className="w-4 h-4 text-orange-500" /> :
                         cl.id === 'rey-agua' ? <Droplets className="w-4 h-4 text-cyan-500" /> :
                         cl.id === 'corredor-cielo' ? <Wind className="w-4 h-4 text-violet-500" /> :
                         <Zap className="w-4 h-4" style={{ color: cl.glowColor }} />}
                        <span className="text-xs font-bold text-slate-800 truncate">{cl.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                    </div>

                    <div className="space-y-0.5 text-[10px] text-slate-600 mb-1.5">
                      <p><span className="text-slate-400">Poder [K]:</span> {cl.primaryPower}</p>
                      <p><span className="text-slate-400">Especial [L]:</span> {cl.specialPower}</p>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-600">{cl.passiveTrait}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-sky-50 hover:bg-sky-100 text-slate-600 font-bold text-xs rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Guardar héroe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
