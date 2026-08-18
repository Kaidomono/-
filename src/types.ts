/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum SocialClass {
  NOMAD = 'Poor Nomad',
  NOBLE = 'Noble Clan',
  MERCHANT = 'Merchant Family',
  WARRIOR = 'Warrior Bloodline',
  BLACKSMITH = 'Blacksmith family',
}

export interface CharacterStats {
  health: number;
  happiness: number;
  appearance: number;
  strength: number;
  intelligence: number;
  perception: number;
  leadership: number;
  loyalty: number;
  reputation: number;
  realmReputation: number;
  horseRiding: number;
  archery: number;
  wealth: number;
}

export type RelationLevel = 'At War' | 'Hostile' | 'Neutral' | 'Friendly' | 'Allied';

export interface TribeRelation {
  name: string;
  level: RelationLevel;
  standing: number; // -100 to 100
  isTrading: boolean;
  militaryPower: number;
}

export interface Relationship {
  id?: string;
  name: string;
  type: string;
  loyalty: number;
  status: string;
  traits?: string[];
  clan?: string;
  socialClass?: SocialClass;
  isMarriageAlliance?: boolean;
  appearance?: string;
  attire?: string;
  expression?: string;
  scent?: string;
  bodyStature?: string;
  hairStyle?: string;
  avatarUrl?: string;
  age?: number;
  gender?: Gender;
  stats?: CharacterStats;
  originType?: 'Tribe' | 'Kingdom';
  originName?: string;
  pregnancy?: Pregnancy | null;
}

export interface Asset {
  id: string;
  name: string;
  type: 'Horse' | 'Weapon' | 'Armor' | 'Livestock' | 'Property';
  value: number;
  quality: number;
  stats?: {
    speed?: number;
    loyalty?: number;
    attackBonus?: number;
    defenseBonus?: number;
  };
}

export interface HistoryEntry {
  age: number;
  text: string;
}

export interface Pregnancy {
  isPregnant: boolean;
  motherName: string;
  partnerName: string;
  isPlayerMother: boolean;
  expectedYear: number;
  spouseId?: string;
}

export enum MarketCondition {
  BOOM = 'Economic Boom',
  STABLE = 'Stable',
  RECESSION = 'Recession',
  FAMINE = 'Livestock Famine',
  WAR_PREP = 'War Preparations',
  GOLD_RUSH = 'Gold Rush',
  BLOCKADE = 'Silk Road Blockade',
}

export interface Character {
  id: string;
  name: string;
  title?: string;
  age: number;
  gender: Gender;
  socialClass: SocialClass;
  stats: CharacterStats;
  role: string;
  tribe: string;
  clan: string;
  relationships: Relationship[];
  assets: Asset[];
  isAlive: boolean;
  children: number;
  clanWealth: number;
  tribeRelations: TribeRelation[];
  conqueredTribes: string[];
  conqueredKingdoms: string[];
  isGreatKhan: boolean;
  kingdomName?: string;
  militaryPower: number;
  hordeSize: number;
  successionLaw: 'Tanistry' | 'Primogeniture' | 'Ultimogeniture' | 'Meritocratic' | 'Elective';
  heirId?: string;
  lifestyle: 'Nomadic' | 'Settled';
  pastureCapacity?: number;
  pastureUpgrades?: number;
  livestock: {
    horses: number;
    sheep: number;
    cattle: number;
    goats: number;
    yaks: number;
    camels: number;
  };
  droughtYears?: number;
  lastCouncilYear?: number;
  lastPromotionAge?: number;
  activeCampaign?: CampaignState;
  marketCondition: MarketCondition;
  marketTrends: Record<string, number>; // Category vs Demand/Supply multiplier (0.5 to 2.0)
    availableMarketItems: {
      id: string;
      originalId: string;
      name: string;
      type: string;
      category: string;
      price: number;
      basePrice: number;
      quality: number;
      desc: string;
    }[];
  marriageCandidates?: Relationship[];
  kingdomRelations?: TribeRelation[]; // Reuse the same structure for kingdoms
  history: HistoryEntry[];
  traits: string[];
  appearanceOptions: {
    hairColor: string;
    eyeColor: string;
    build: 'Slender' | 'Athletic' | 'Robust' | 'Towering';
  };
  weather?: 'Clear' | 'Overcast' | 'Dust Storm' | 'Snow';
  visionBonus?: number;
  avatarUrl?: string;
  designatedHeir?: string;
  deathCause?: string;
  pregnancy?: Pregnancy | null;
  taxReport?: {
    taxesPaid: number;
    taxesCollected: number;
    soldierSalaryPaid: number;
    soldierSalaryReceived: number;
    netIncome: number;
  };
  lastYassaClaimedAge?: number;
  waterwayCleansedAge?: number;
  customRecruitedSoldiers?: number;
  warriorTraining?: number;
  warriorEquipmentLevel?: number;
  warriorMorale?: number;
  workshops?: Workshop[];
  caravans?: CaravanVoyage[];
}

export interface Workshop {
  id: string;
  name: string;
  type: 'Forge' | 'Saddle' | 'Dairy' | 'Weaving';
  level: number;
  passiveIncome: number;
  costToUpgrade: number;
  description: string;
}

export interface CaravanVoyage {
  id: string;
  destination: string;
  investment: number;
  guards: number;
  cargo: string;
  durationYears: number;
  progressYears: number;
  expectedReturnMin: number;
  expectedReturnMax: number;
  status: 'Traveling' | 'Completed' | 'Plundered';
  narrative?: string;
}

export interface GameChoice {
  text: string;
  effect?: (character: Character) => Partial<CharacterStats>;
  customEffect?: (character: Character) => Character;
  nextEvent?: string;
  storySnippet: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  imagePrompt?: string;
  imageUrl?: string;
  choices: GameChoice[];
  ageRange?: [number, number];
  classRequired?: SocialClass[];
}

export interface Equipment {
  id: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Mount';
  attackBonus: number;
  defenseBonus: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface Combatant {
  name: string;
  stats: {
    strength: number;
    skill: number;
    endurance: number;
  };
  equipment: {
    weapon?: Equipment;
    armor?: Equipment;
    mount?: Equipment;
  };
}

export interface CombatLogEntry {
  turn: number;
  attacker: string;
  damage: number;
  message: string;
}

export interface CombatOutcome {
  winner: string;
  rounds: number;
  log: CombatLogEntry[];
  probability: number;
}

export interface WorldState {
  year: number;
  activeTribes: string[];
  currentKhan: string;
  worldEvents: string[];
}

export interface CampaignState {
  targetTribe: string;
  year: number;
  playerProgress: number; // 0 to 100
  playerCasualties: number;
  enemyCasualties: number;
  enemyPower: number;
  enemyInitialPower: number;
  combatLog: string[];
  currentStrategy?: string;
  resolvedForThisYear: boolean;
}
