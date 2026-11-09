export type TierType = 'amateur' | 'pro' | 'legendary';

export type GenderType = 'heroe' | 'heroina';

export type HeroId = 'richard' | 'juan';

export type HeroClassId =
  | 'mago-electrico'
  | 'velocista'
  | 'rey-fuego'
  | 'rey-agua'
  | 'corredor-cielo';

export type MovementMode = 'on_foot' | 'in_vehicle' | 'flying';

export type WeaponType =
  | 'bat'
  | 'water_cannon'
  | 'light_ray'
  | 'shield'
  | 'lightning_staff'
  | 'fire_orb';

export type BiomeType =
  | 'medellin_parque'
  | 'bosque_arvi'
  | 'comuna_paz'
  | 'huerta_solidaria'
  | 'rio_medellin'
  | 'guatape_embalse'
  | 'paramo_andino'
  | 'jardin_guayacanes'
  | 'ciudad_metro'
  | 'cumbre_colombia'
  // Legacy compatibility aliases
  | 'oasis_egipcio'
  | 'roma_coliseo'
  | 'grecia_filosofos'
  | 'edad_media_castillo'
  | 'japon_montana'
  | 'bosque'
  | 'rio_parque'
  | 'oceano'
  | 'nieve_invierno'
  | 'desierto';

export type LifeStage = 'ninez' | 'adolescencia' | 'juventud' | 'adultez' | 'vejez';

export type VillainPower =
  | 'control_sombras'
  | 'rayos_energia_oscura'
  | 'ilusiones_mentales'
  | 'teletransportacion'
  | 'absorcion_energia'
  | 'tormenta_oscuridad'
  | 'escudo_oscuro';

export type VillainArchetype =
  | 'basurote'
  | 'talador'
  | 'maton'
  | 'acaparador'
  | 'contaminador';

export type HabitCategory =
  | 'recoger_basura'
  | 'no_tala'
  | 'cero_violencia'
  | 'cero_hambre'
  | 'cuidado_agua';

export interface HeroClass {
  id: HeroClassId;
  name: string;
  title: string;
  powerName: string;
  primaryPower: string;
  specialPower: string;
  passiveTrait: string;
  description: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  themeColor: string;
  accentColor: string;
  glowColor: string;
  bonusPower: number;
  bonusSpeed: number;
  bonusDefense: number;
  specialAbility: string;
  projectileType: 'lightning' | 'sonic' | 'fireball' | 'whirlpool' | 'water' | 'light';
}

export interface TriviaDilemma {
  id: string;
  category:
    | 'cero_violencia'
    | 'transporte_sostenible'
    | 'salud_trabajo'
    | 'cero_hambre'
    | 'cuidado_agua';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rewardPower: number;
}

export interface HabitLevel {
  id: number;
  tier: TierType;
  title: string;
  subtitle: string;
  theme: string;
  habitCategory?: HabitCategory;
  villainArchetype?: VillainArchetype;
  locationName?: string;
  biome: BiomeType;
  historicalEra: string;
  humanLifeStory: string;
  pollutionProblem: string;
  lifeStage: LifeStage;
  lifeStageColor: string;
  lifeStageLabel: string;
  habitDescription: string;
  habitActionName: string;
  objectiveCount: number;
  objectiveItemName: string;
  objectiveIcon: string;
  villainName: string;
  villainTitle: string;
  villainBio: string;
  villainHp: number;
  villainColor: string;
  villainPowers: VillainPower[];
  coinsReward: number;
  powerReward: number;
  badgeName: string;
  badgeDescription: string;
  trivia: TriviaDilemma;
  specialMissionType?:
    | 'stop_basurote'
    | 'stop_loggers'
    | 'peace_convivencia'
    | 'zero_hunger_garden'
    | 'clean_water_river'
    | 'oasis_pyramids'
    | 'colosseum_lion_key'
    | 'greek_scrolls'
    | 'medieval_hens_castle'
    | 'japan_mountain_delivery'
    | 'standard';
}

export interface HeroCharacter {
  id: HeroId;
  name: string;
  suitColorName: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  description: string;
  trait: string;
  equippedClassId: HeroClassId;
  muscleLevel: number;
}

export interface AvatarProfile {
  name: string;
  gender: GenderType;
  characterId?: HeroId;
  classId: HeroClassId;
  suitId?: string;
  primaryColor: string;
  secondaryColor: string;
  equippedTool: string;
  bio: string;
}

export interface PlayerInventory {
  coins: number;
  powerPoints: number;
  medals: string[];
  tools: string[];
  pearlsTeleport: number;
  pearlsSpeed: number;
  unlockedLevelMax: number;
  completedLevels: number[];
}

export interface LogicBlock {
  id: string;
  category: 'trigger' | 'condition' | 'action';
  label: string;
  codeSnippet: string;
  color: string;
  description: string;
  energyCost: number;
  powerRating: number;
}

export interface MechConfiguration {
  id: string;
  name: string;
  chassis: 'ironman' | 'ironwoman';
  primaryColor: string;
  accentColor: string;
  reactorColor: string;
  programmedBlocks: LogicBlock[];
  stats: {
    firepower: number;
    shield: number;
    agility: number;
    habitEnergy: number;
  };
}

export interface TeamSquad {
  id: string;
  name: string;
  motto: string;
  emblem: string;
  membersCount: number;
  reputation: number;
  primaryCause: string;
  isPlayerMember: boolean;
}
