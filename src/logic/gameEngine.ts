/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Character, Gender, SocialClass, Relationship, CharacterStats, GameEvent, Combatant, CombatOutcome, CombatLogEntry, MarketCondition } from '../types';
import { MONGOL_SURNAMES, MONGOL_NAMES_MALE, MONGOL_NAMES_FEMALE, INITIAL_STATS, TRIBES, ROLE_SALARIES, MARKET_ITEMS, MARKET_MULTIPLIERS, STARTING_TRAITS, KINGDOMS } from '../constants';

const RELATIONSHIP_TRAITS = [
  'Loyal', 'Deceitful', 'Ambitious', 'Envious', 
  'Greedy', 'Brave', 'Kind', 'Cruel', 'Wise', 'Rash',
  'Stoic', 'Charismatic', 'Fierce', 'Pious', 'Frugal',
  'Fertile', 'Political', 'Learned', 'Beautiful'
];

const HAIR_COLORS = ['Midnight Black', 'Raven Black', 'Dark Brown', 'Chestnut'];
const EYE_COLORS = ['Dark Brown', 'Black', 'Amber', 'Grey'];
const HEIGHTS = ['Short', 'Average', 'Tall', 'Imposing'];

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateAppearance(): string {
  const hair = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
  const eyes = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
  const height = HEIGHTS[Math.floor(Math.random() * HEIGHTS.length)];
  const beauty = Math.floor(Math.random() * 100);
  
  let beautyDesc = 'Ordinary';
  if (beauty > 90) beautyDesc = 'Radiant';
  else if (beauty > 80) beautyDesc = 'Exquisite';
  else if (beauty > 65) beautyDesc = 'Striking';
  else if (beauty < 30) beautyDesc = 'Homely';

  return `${beautyDesc} beauty, ${height} stature, with ${hair} hair and ${eyes} eyes.`;
}

import { generateNomadSVG } from './avatarRenderer';

export function getNomadAvatar(name: string, gender: Gender, clan: string, age: number, appearance?: Character['appearanceOptions'], socialClass?: SocialClass): string {
  // Use the new custom Mongolian-style SVG generator
  const isNoble = socialClass === SocialClass.NOBLE;
  return generateNomadSVG(name, gender, age, isNoble, appearance);
}

export function generateMarriageCandidates(count: number): Relationship[] {
  const candidates: Relationship[] = [];
  for (let i = 0; i < count; i++) {
    const names = MONGOL_NAMES_FEMALE;
    const name = names[Math.floor(Math.random() * names.length)];
    const clan = MONGOL_SURNAMES[Math.floor(Math.random() * MONGOL_SURNAMES.length)];
    const socialClass = Object.values(SocialClass)[Math.floor(Math.random() * Object.values(SocialClass).length)];
    
    const traitCount = 1 + Math.floor(Math.random() * 2);
    const traits: string[] = [];
    
    // Add social class based trait
    if (socialClass === SocialClass.NOBLE) traits.push('High-Born');
    else if (socialClass === SocialClass.MERCHANT) traits.push('Wealthy');
    else if (socialClass === SocialClass.NOMAD) traits.push('Hardy');

    for (let j = 0; j < traitCount; j++) {
      const trait = RELATIONSHIP_TRAITS[Math.floor(Math.random() * RELATIONSHIP_TRAITS.length)];
      if (!traits.includes(trait)) traits.push(trait);
    }

    candidates.push({
      id: generateId(),
      name,
      type: 'Spouse Candidate',
      loyalty: 50 + Math.floor(Math.random() * 30),
      status: 'Active',
      clan,
      socialClass,
      traits,
      appearance: generateAppearance(),
      avatarUrl: getNomadAvatar(name, Gender.FEMALE, clan, 20, undefined, socialClass)
    });
  }
  return candidates;
}

const TENT_ATTIRES = [
  'a form-fitting crimson silk robe with golden embroidery',
  'sheer, flowing emerald silks cinched with a bronze belt',
  'draped in fine Persian indigo linens with pearl accents',
  'wearing a soft velvet tunic adorned with foreign silver bells',
  'a gossamer white merchant gown, elegantly draped and open-backed',
  'traditional high-collared silk qipao, split along the sides',
  'a provocative wrap of lavender silk held by a gold cord'
];

const TENT_EXPRESSIONS = [
  'a smoky, seductive gaze that holds your attention',
  'a playful, teasing smile that hints at mischief',
  'a shy, gentle glance and soft crimson-blushed cheeks',
  'a confident, direct stare of high allure',
  'a serene but enticing wink',
  'whispering soft verses with parted, painted lips'
];

const TENT_SCENTS = [
  'exotic rosewater and sandalwood',
  'warm amber, musk, and honey',
  'imported plum lilies and sweet incense',
  'wild jasmine blossoms and freshly crushed vanilla'
];

const TENT_BODY = [
  'a voluptuous, hourglass build',
  'a petite and supple frame',
  'a tall, elegant, and statuesque height',
  'a graceful, curvaceous silhouette',
  'a slender, dancer-like physique'
];

const TENT_HAIR = [
  'midnight-black tresses pinned with silver chopsticks',
  'flowing raven locks cascading down to her waist',
  'shimmering dark-brown waves woven with golden threads',
  'loose, ink-black braids adorned with tiny ringing bells',
  'a sophisticated, high-pinned chignon with loose side tendrils'
];

export function generatePleasureTentAppearance(): {
  description: string;
  attire: string;
  expression: string;
  scent: string;
  bodyStature: string;
  hairStyle: string;
} {
  const attire = TENT_ATTIRES[Math.floor(Math.random() * TENT_ATTIRES.length)];
  const expression = TENT_EXPRESSIONS[Math.floor(Math.random() * TENT_EXPRESSIONS.length)];
  const scent = TENT_SCENTS[Math.floor(Math.random() * TENT_SCENTS.length)];
  const bodyStature = TENT_BODY[Math.floor(Math.random() * TENT_BODY.length)];
  const hairStyle = TENT_HAIR[Math.floor(Math.random() * TENT_HAIR.length)];
  
  const description = `${bodyStature}, with ${hairStyle}. She is dressed in ${attire}, gazing at you with ${expression}, carrying a distinct fragrance of ${scent}.`;
  
  return { description, attire, expression, scent, bodyStature, hairStyle };
}

export function generatePleasureTentCandidates(count: number): Relationship[] {
  const candidates: Relationship[] = [];
  for (let i = 0; i < count; i++) {
    const names = MONGOL_NAMES_FEMALE;
    const name = names[Math.floor(Math.random() * names.length)];
    const traitCount = 1 + Math.floor(Math.random() * 1);
    const traits: string[] = [];
    for (let j = 0; j < traitCount; j++) {
      const trait = RELATIONSHIP_TRAITS[Math.floor(Math.random() * RELATIONSHIP_TRAITS.length)];
      if (!traits.includes(trait)) traits.push(trait);
    }

    const appDetails = generatePleasureTentAppearance();
    const beautyVal = 60 + Math.floor(Math.random() * 40); // Generate allure rating from 60 to 100

    candidates.push({
      id: generateId(),
      name,
      type: 'Pleasure Candidate',
      loyalty: 30 + Math.floor(Math.random() * 20),
      status: 'Active',
      traits,
      appearance: appDetails.description,
      attire: appDetails.attire,
      expression: appDetails.expression,
      scent: appDetails.scent,
      bodyStature: appDetails.bodyStature,
      hairStyle: appDetails.hairStyle,
      avatarUrl: getNomadAvatar(name, Gender.FEMALE, 'Pleasure', 18, undefined, SocialClass.NOMAD),
      stats: {
        health: 80,
        happiness: 80,
        appearance: beautyVal,
        strength: 20,
        intelligence: 50,
        perception: 50,
        leadership: 10,
        loyalty: 50,
        reputation: 10,
        realmReputation: 0,
        horseRiding: 15,
        archery: 10,
        wealth: 0
      }
    });
  }
  return candidates;
}

export function generateFriendCandidates(count: number, playerAge: number, playerSocialClass: SocialClass): Relationship[] {
  const candidates: Relationship[] = [];
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5;
    const gender = isMale ? Gender.MALE : Gender.FEMALE;
    const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
    const name = names[Math.floor(Math.random() * names.length)];
    const clan = MONGOL_SURNAMES[Math.floor(Math.random() * MONGOL_SURNAMES.length)];
    
    // Choose appropriate age: player's age +/- 5 years (minimum 0)
    const ageDiff = Math.floor(Math.random() * 11) - 5;
    const age = Math.max(0, playerAge + ageDiff);

    // Origin selection: Tribe or Foreign Kingdom
    const roll = Math.random();
    let originType: 'Tribe' | 'Kingdom' = 'Tribe';
    let originName = TRIBES[Math.floor(Math.random() * TRIBES.length)];
    
    if (roll < 0.6) {
      originType = 'Tribe';
      originName = TRIBES[Math.floor(Math.random() * TRIBES.length)];
    } else {
      originType = 'Kingdom';
      originName = KINGDOMS[Math.floor(Math.random() * KINGDOMS.length)];
    }

    // Traits
    const traitCount = 1 + Math.floor(Math.random() * 2);
    const traits: string[] = [];
    
    if (originType === 'Kingdom') {
      traits.push('Foreigner');
      const foreignTraits = ['Learned', 'Wise', 'Political', 'Charismatic'];
      traits.push(foreignTraits[Math.floor(Math.random() * foreignTraits.length)]);
    } else {
      const nomadTraits = ['Stoic', 'Brave', 'Fierce', 'Hardy'];
      traits.push(nomadTraits[Math.floor(Math.random() * nomadTraits.length)]);
    }

    for (let j = 0; j < traitCount; j++) {
      const trait = RELATIONSHIP_TRAITS[Math.floor(Math.random() * RELATIONSHIP_TRAITS.length)];
      if (!traits.includes(trait)) traits.push(trait);
    }

    candidates.push({
      id: generateId(),
      name,
      type: 'Potential Friend',
      loyalty: 40 + Math.floor(Math.random() * 30),
      status: 'Active',
      clan,
      socialClass: playerSocialClass,
      traits,
      age,
      gender,
      appearance: generateAppearance(),
      originType,
      originName,
      avatarUrl: getNomadAvatar(name, gender, clan, age, undefined, playerSocialClass)
    });
  }
  return candidates;
}

function getRandomTraits(count: number = 1): string[] {
  const shuffled = [...RELATIONSHIP_TRAITS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function calculateTitle(character: Character): string | undefined {
  const { stats, role, age, conqueredTribes, isGreatKhan } = character;
  
  if (age < 5) return undefined; // No titles for babies

  // Children-specific titles (Age 5-14)
  if (age < 15) {
    if (stats.strength >= 70) return 'the Brawny';
    if (stats.archery >= 70) return 'the Sparrow-Hunter';
    if (stats.horseRiding >= 70) return 'the Colt-Tamer';
    if (stats.intelligence >= 70) return 'the Quick-Witted';
    if (stats.appearance >= 80) return 'the Bright-Eyed';
    if (stats.leadership >= 50) return 'the Young Khan';
    if (stats.reputation >= 50) return 'the Promising';
    
    // Low tier for flavor
    if (stats.strength < 15) return 'the Fragile';
    if (stats.intelligence < 15) return 'the Simple';
    
    return undefined; // Most children don't have titles yet
  }

  // Peak Achievements (highest priority)
  if (isGreatKhan) return 'the Universal Ruler';
  if (conqueredTribes.length >= 8) return 'the World-Eater';
  if (conqueredTribes.length >= 5) return 'Scourge of the Steppe';
  if (conqueredTribes.length >= 3) return 'the Conqueror';

  // Role-specific achievements
  if (role === 'High Shaman' || role === 'Oracle of the Eternal Sky') return 'the Spirit-Speaker';
  if (role === 'Merchant Prince' || role === 'Guild Master') {
    if (stats.wealth > 100000) return 'the Golden';
    if (stats.wealth > 50000) return 'the Wealthy';
  }
  if (role === 'Warlord' || role === 'Marshal of the Empire') return 'the Wolf';
  if (role === 'General' && stats.strength > 80) return 'the Unyielding';
  if (role === 'Imperial Guard (Kheshig)') return 'the Loyal';
  if (role === 'Tribal Judge (Jarghuchi)') return 'the Lawgiver';
  if (role === 'Vizier' || role === "Khagan's Advisor" || role === 'Grand Vizier') return 'the Wise';
  if (role === 'Grand Historian' || role === 'Imperial Scholar') return 'the Chronicler';
  if (role === 'Master of the Arsenal' || role === 'Royal Armorer') return 'the Iron-Fisted';
  if (role === 'Clan Elder' && stats.intelligence > 70) return 'the Just';
  
  // Stat-based achievements (High end - Skill Mastery)
  if (stats.archery >= 95) return 'Eagle-Eye';
  if (stats.perception >= 95) return 'the Seer';
  if (stats.strength >= 95) return 'Iron-Will';
  if (stats.horseRiding >= 95) return 'Master of the Winds';
  if (stats.intelligence >= 95) return 'the Sage';
  if (stats.leadership >= 95) return 'the Great';
  
  if (stats.archery >= 90) return 'the Hawk-Eyed';
  if (stats.perception >= 85) return 'the Far-Sighted';
  if (stats.intelligence >= 85) return 'the Wise';
  if (stats.leadership >= 85) return 'the Lion';
  if (stats.reputation >= 90) return 'the Magnificent';
  if (stats.reputation >= 80) return 'the Illustrious';
  if (stats.strength >= 85) return 'the Iron';
  if (stats.horseRiding >= 85) return 'the Wind-Rider';
  if (stats.appearance >= 90) return 'the Beautiful';
  if (stats.appearance >= 80) return 'the Radiant';
  
  // Mid-tier titles
  if (stats.reputation >= 70) return 'the Renowned';
  if (stats.strength >= 70) return 'the Brave';
  if (stats.health >= 90) return 'the Robust';
  if (stats.happiness >= 90) return 'the Jovial';
  
  // Low-tier or negative titles (for flavor)
  if (stats.reputation < 15) return 'the Shadow';
  if (stats.health < 20) return 'the Frail';
  if (stats.happiness < 20) return 'the Melancholy';
  if (stats.strength < 20) return 'the Weakling';

  return undefined;
}

export function refreshMarketItems(
  condition: MarketCondition = MarketCondition.STABLE, 
  trends: Record<string, number> = {}
): Character['availableMarketItems'] {
   // Select 3-8 random items from the parent MARKET_ITEMS
   const shuffled = [...MARKET_ITEMS].sort(() => 0.5 - Math.random());
   const count = 4 + Math.floor(Math.random() * 5); // 4 to 8 items
   
   const multipliers = MARKET_MULTIPLIERS[condition] || MARKET_MULTIPLIERS.Stable;

   return shuffled.slice(0, count).map(item => {
      // Price jitter: 90% to 110% of original price
      const jitter = 0.9 + (Math.random() * 0.2);
      let basePrice = item.price;

      // Apply category trend (Supply/Demand)
      const categoryTrend = trends[item.type] || 1.0;
      basePrice *= categoryTrend;

      // Apply condition multipliers
      if (item.type === 'Weapon' || item.type === 'Armor') {
        basePrice *= (multipliers.gear || 1.0);
      } else if (item.type === 'Horse') {
        basePrice *= (multipliers.livestock || 1.0);
      } else if (item.type === 'Commodity') {
        basePrice *= (multipliers.commodity || 1.0);
      } else if (item.type === 'Luxury') {
        basePrice *= (multipliers.luxury || 1.0);
      }
      
      basePrice *= multipliers.buy;

      return {
         ...item,
         originalId: item.id,
         basePrice: item.price,
         id: `${item.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
         price: Math.floor(basePrice * jitter)
      };
   });
}

export function simulateBattle(attacker: Combatant, defender: Combatant): CombatOutcome {
  let turn = 1;
  const log: CombatLogEntry[] = [];
  let attackerHealth = attacker.stats.endurance * 10;
  let defenderHealth = defender.stats.endurance * 10;

  const getAttackPower = (c: Combatant) => {
    let power = c.stats.strength + c.stats.skill;
    if (c.equipment.weapon) power += c.equipment.weapon.attackBonus;
    if (c.equipment.mount) power += c.equipment.mount.attackBonus;
    return power;
  };

  const getDefensePower = (c: Combatant) => {
    let defense = (c.stats.skill * 0.8) + (c.stats.strength * 0.2); // Skill is primary for defense
    if (c.equipment.armor) defense += c.equipment.armor.defenseBonus;
    if (c.equipment.mount) defense += c.equipment.mount.defenseBonus;
    return defense;
  };

  const aPerception = (attacker as any).stats?.perception || 50;
  const dPerception = (defender as any).stats?.perception || 50;

  while (attackerHealth > 0 && defenderHealth > 0 && turn <= 30) {
    // Attacker hits defender
    let attackerPower = getAttackPower(attacker);
    let defenderDef = getDefensePower(defender);

    // Perception check for "Critical Opening"
    if (Math.random() < (aPerception / 200)) {
       attackerPower *= 1.5;
       log.push({ turn, attacker: attacker.name, damage: 0, message: `${attacker.name} spotted a gap in the defense with keen perception!` });
    }

    const damageToDefender = Math.max(1, Math.floor((attackerPower * (0.8 + Math.random() * 0.4)) - (defenderDef * 0.5)));
    defenderHealth -= damageToDefender;
    log.push({ turn, attacker: attacker.name, damage: damageToDefender, message: `${attacker.name} strikes for ${damageToDefender} damage!` });

    if (defenderHealth <= 0) break;

    // Defender hits attacker
    let defenderPower = getAttackPower(defender);
    let attackerDef = getDefensePower(attacker);

    // Defender Perception check for "Perfect Dodge/Counter"
    if (Math.random() < (dPerception / 300)) {
       defenderPower *= 1.2;
       attackerDef *= 1.5;
       log.push({ turn, attacker: defender.name, damage: 0, message: `${defender.name} predicted the move and countered!` });
    }

    const damageToAttacker = Math.max(1, Math.floor((defenderPower * (0.8 + Math.random() * 0.4)) - (attackerDef * 0.5)));
    attackerHealth -= damageToAttacker;
    log.push({ turn, attacker: defender.name, damage: damageToAttacker, message: `${defender.name} counter-attacks for ${damageToAttacker} damage!` });

    turn++;
  }

  const winner = attackerHealth > defenderHealth ? attacker.name : defender.name;
  
  // Simple probability estimation (can be refined)
  const aStr = getAttackPower(attacker) + getDefensePower(attacker);
  const dStr = getAttackPower(defender) + getDefensePower(defender);
  const probability = (aStr + dStr === 0) ? 50 : Math.min(100, Math.max(0, Math.floor((aStr / (aStr + dStr)) * 100)));

  return { winner, rounds: turn, log, probability };
}

export function generateEnemy(difficulty: number): Combatant {
  const archetypes = [
    { 
      type: 'Light Archer', 
      statBias: { strength: 0.7, skill: 1.5, endurance: 0.8 },
      weapon: { id: 'e-bow', name: 'Steppe Composite Bow', type: 'Weapon' as const, attackBonus: 10 + difficulty * 2, defenseBonus: 0, rarity: 'Common' as const },
      armor: { id: 'e-cloth', name: 'Nomad Felt Armor', type: 'Armor' as const, attackBonus: 0, defenseBonus: 5 + difficulty, rarity: 'Common' as const },
      mount: { id: 'e-pony', name: 'Steppe Pony', type: 'Mount' as const, attackBonus: 3, defenseBonus: 2, rarity: 'Common' as const }
    },
    { 
      type: 'Tribal Spearman', 
      statBias: { strength: 1.2, skill: 0.8, endurance: 1.3 },
      weapon: { id: 'e-spear', name: 'Tipped Spear', type: 'Weapon' as const, attackBonus: 7 + difficulty * 2, defenseBonus: 5 + Math.floor(difficulty / 2), rarity: 'Common' as const },
      armor: { id: 'e-leather', name: 'Hardened Leather', type: 'Armor' as const, attackBonus: 0, defenseBonus: 10 + difficulty * 2, rarity: 'Common' as const }
    },
    { 
      type: 'Bökh Wrestler', 
      statBias: { strength: 1.8, skill: 0.6, endurance: 1.5 },
      weapon: { id: 'e-fists', name: 'Raw Strength', type: 'Weapon' as const, attackBonus: 15 + difficulty * 2, defenseBonus: 5, rarity: 'Common' as const },
      armor: { id: 'e-vest', name: 'Wrestling Vest', type: 'Armor' as const, attackBonus: 5, defenseBonus: 10 + difficulty * 2, rarity: 'Common' as const }
    },
    { 
      type: 'Mountain Bandit', 
      statBias: { strength: 1.5, skill: 0.7, endurance: 1.2 },
      weapon: { id: 'e-club', name: 'Heavy Spiked Club', type: 'Weapon' as const, attackBonus: 18 + difficulty * 2, defenseBonus: 0, rarity: 'Common' as const },
      armor: { id: 'e-furs', name: 'Thick Bear Hides', type: 'Armor' as const, attackBonus: 0, defenseBonus: 12 + difficulty * 2, rarity: 'Common' as const }
    },
    { 
      type: 'Mangudai Skirmisher', 
      statBias: { strength: 0.8, skill: 1.7, endurance: 0.8 },
      weapon: { id: 'e-mangudai-bow', name: 'Precision Recurve Bow', type: 'Weapon' as const, attackBonus: 18 + difficulty * 2, defenseBonus: 0, rarity: 'Rare' as const },
      armor: { id: 'e-silk', name: 'Raw Silk Vest', type: 'Armor' as const, attackBonus: 0, defenseBonus: 8 + difficulty, rarity: 'Rare' as const },
      mount: { id: 'e-akhal', name: 'Akhal-Teke Stallion', type: 'Mount' as const, attackBonus: 20 + difficulty, defenseBonus: 8, rarity: 'Rare' as const }
    },
    { 
      type: 'Heavy Lancer', 
      statBias: { strength: 1.5, skill: 0.7, endurance: 1.5 },
      weapon: { id: 'e-lance', name: 'Iron-tipped Lance', type: 'Weapon' as const, attackBonus: 22 + difficulty * 3, defenseBonus: 0, rarity: 'Rare' as const },
      armor: { id: 'e-scale', name: 'Scale Mail', type: 'Armor' as const, attackBonus: 0, defenseBonus: 20 + difficulty * 3, rarity: 'Rare' as const },
      mount: { id: 'e-warhorse', name: 'Armored Northern Horse', type: 'Mount' as const, attackBonus: 15 + difficulty, defenseBonus: 15 + difficulty, rarity: 'Rare' as const }
    },
    { 
      type: 'Tibet Raider', 
      statBias: { strength: 1.4, skill: 1.0, endurance: 1.6 },
      weapon: { id: 'e-heavy-mace', name: 'Steel-Headed Mace', type: 'Weapon' as const, attackBonus: 25 + difficulty * 3, defenseBonus: 0, rarity: 'Rare' as const },
      armor: { id: 'e-yak-hide', name: 'Reinforced Yak Hide', type: 'Armor' as const, attackBonus: 0, defenseBonus: 30 + difficulty * 3, rarity: 'Rare' as const },
      mount: { id: 'e-yak-war', name: 'Fierce Battle-Yak', type: 'Mount' as const, attackBonus: 12 + difficulty, defenseBonus: 35 + difficulty, rarity: 'Rare' as const }
    },
    { 
      type: 'Merkid Vanguard', 
      statBias: { strength: 1.3, skill: 1.1, endurance: 1.4 },
      weapon: { id: 'e-axe', name: 'War Axe', type: 'Weapon' as const, attackBonus: 20 + difficulty * 3, defenseBonus: 2, rarity: 'Rare' as const },
      armor: { id: 'e-padded', name: 'Reinforced Padded Armor', type: 'Armor' as const, attackBonus: 0, defenseBonus: 25 + difficulty * 3, rarity: 'Rare' as const },
      mount: { id: 'e-yak-mighty', name: 'Mighty Yak', type: 'Mount' as const, attackBonus: 8 + difficulty, defenseBonus: 20 + difficulty, rarity: 'Rare' as const }
    },
    { 
      type: 'Naiman Duelist', 
      statBias: { strength: 1.0, skill: 1.8, endurance: 1.0 },
      weapon: { id: 'e-saber', name: 'Fine Curved Saber', type: 'Weapon' as const, attackBonus: 18 + difficulty * 3, defenseBonus: 10, rarity: 'Rare' as const },
      armor: { id: 'e-studded', name: 'Studded Leather', type: 'Armor' as const, attackBonus: 5, defenseBonus: 15 + difficulty * 3, rarity: 'Rare' as const }
    },
    { 
      type: 'Tribal Champion', 
      statBias: { strength: 1.3, skill: 1.3, endurance: 1.2 },
      weapon: { id: 'e-sword', name: 'Curved Saber', type: 'Weapon' as const, attackBonus: 12 + difficulty * 3, defenseBonus: 3 + Math.floor(difficulty / 2), rarity: 'Rare' as const },
      armor: { id: 'e-lamellar', name: 'Iron Lamellar', type: 'Armor' as const, attackBonus: 0, defenseBonus: 18 + difficulty * 3, rarity: 'Rare' as const },
      mount: { id: 'e-charger', name: 'Clan Charger', type: 'Mount' as const, attackBonus: 8, defenseBonus: 6, rarity: 'Rare' as const }
    },
    { 
      type: 'Kheshig Elite Guard', 
      statBias: { strength: 1.5, skill: 1.5, endurance: 1.5 },
      weapon: { id: 'e-dao', name: 'Imperial Curved Blade', type: 'Weapon' as const, attackBonus: 30 + difficulty * 4, defenseBonus: 8, rarity: 'Epic' as const },
      armor: { id: 'e-imp-lamellar', name: 'Polished Iron Lamellar', type: 'Armor' as const, attackBonus: 8, defenseBonus: 35 + difficulty * 4, rarity: 'Epic' as const },
      mount: { id: 'e-stallion', name: 'Khan\'s Chosen Stallion', type: 'Mount' as const, attackBonus: 18, defenseBonus: 18, rarity: 'Epic' as const }
    },
    { 
      type: 'Jin Siege Guard', 
      statBias: { strength: 1.2, skill: 0.9, endurance: 2.0 },
      weapon: { id: 'e-mace', name: 'Iron Flail', type: 'Weapon' as const, attackBonus: 25 + difficulty * 4, defenseBonus: 10, rarity: 'Epic' as const },
      armor: { id: 'e-plate', name: 'Captured Heavy Plate', type: 'Armor' as const, attackBonus: 0, defenseBonus: 50 + difficulty * 4, rarity: 'Epic' as const }
    }
  ];

  // Logic to determine which archetypes are available based on difficulty
  let availableArchetypes = archetypes.filter(a => {
    if (difficulty < 3) return ['Light Archer', 'Tribal Spearman', 'Mountain Bandit', 'Bökh Wrestler'].includes(a.type);
    if (difficulty < 7) return !['Kheshig Elite Guard', 'Jin Siege Guard'].includes(a.type);
    return true; // All available for high difficulty
  });

  // Fallback
  if (availableArchetypes.length === 0) availableArchetypes = archetypes.slice(0, 3);

  const archetype = availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)];
  
  const baseStrength = 30 + (difficulty * 6);
  const baseSkill = 20 + (difficulty * 5);
  const baseEndurance = 40 + (difficulty * 7);

  const enemy: Combatant = {
    name: `${archetype.type} of the ${TRIBES[Math.floor(Math.random() * TRIBES.length)]}`,
    stats: {
      strength: Math.floor(baseStrength * archetype.statBias.strength),
      skill: Math.floor(baseSkill * archetype.statBias.skill),
      endurance: Math.floor(baseEndurance * archetype.statBias.endurance)
    },
    equipment: {
      weapon: archetype.weapon,
      armor: archetype.armor,
      mount: archetype.mount
    }
  };

  return enemy;
}
export function calculateMilitaryPower(character: Character): { power: number, soldiers: number } {
  let baseSoldiers = 0;
  
  // Base soldiers from role
  switch (character.role) {
    case 'Horseback Recruit': baseSoldiers = 10; break;
    case 'Warrior': baseSoldiers = 30; break;
    case 'Vanguard': baseSoldiers = 50; break;
    case 'Squad Leader (Arban)': baseSoldiers = 10; break; // Leads 10
    case 'Centurion (Zuun)': baseSoldiers = 100; break; // Leads 100
    case 'Commander of Thousand (Mingghan)': baseSoldiers = 1000; break; // Leads 1000
    case 'General': baseSoldiers = 5000; break;
    case 'Warlord': baseSoldiers = 10000; break;
    case 'Marshal of the Empire': baseSoldiers = 25000; break;
    case 'Kheshig Aspirant': baseSoldiers = 1; break;
    case 'Imperial Guard (Kheshig)': baseSoldiers = 10; break; // Part of elite unit
    case 'Noyan (Noble Commander)': baseSoldiers = 2000; break;
    case 'Khagan\'s Advisor': baseSoldiers = 500; break;
    case 'Great Khan': baseSoldiers = 100000; break;
    case 'Imperial Spymaster': baseSoldiers = 500; break; // Elite shadow network
    case 'Master of Whispers': baseSoldiers = 100; break;
    case 'Grand Vizier': baseSoldiers = 2000; break; // Administrative guard
    case 'Master of the Arsenal': baseSoldiers = 800; break; // Guards of the forges
    case 'Nomad': baseSoldiers = 5; break;
    case 'Herder': baseSoldiers = 2; break;
    case 'Master Herder': baseSoldiers = 20; break;
    case 'Clan Scout': baseSoldiers = 15; break;
    case 'Master Hunter': baseSoldiers = 25; break;
    case 'Hunter': baseSoldiers = 10; break;
    case 'Child': case 'Infant': baseSoldiers = 0; break;
    default: baseSoldiers = 5;
  }

  // Bonus from leadership and reputation
  const statsBonus = (character.stats.leadership / 10) + (character.stats.reputation / 20);
  let soldiers = Math.floor(baseSoldiers * (1 + statsBonus / 10));

  // Add custom recruited soldiers
  if (character.customRecruitedSoldiers && character.customRecruitedSoldiers > 0) {
    soldiers += character.customRecruitedSoldiers;
  }

  // Vassal levies (contribute to both power and soldier count)
  const levyPerTribe = 200;
  soldiers += character.conqueredTribes.length * levyPerTribe;

  // Power calculation
  // Horses are crucial for Mongol military power. Having fewer horses than soldiers penalizes power.
  // Ideally, every Mongol warrior has 2-3 horses.
  const idealHorses = soldiers * 2;
  const mobilityBonus = Math.min(1.5, Math.max(0.5, (character.livestock?.horses || 0) / (idealHorses || 1)));
  
  const stats = character.stats || INITIAL_STATS[SocialClass.NOMAD];
  const combatSkill = ((stats.archery || 0) + (stats.horseRiding || 0) + (stats.strength || 0) + (stats.perception || 0)) / 400;
  
  const skillVal = isNaN(combatSkill) ? 0 : combatSkill;

  // Apply training, equipment, and morale multipliers
  const trainingFactor = 1 + (character.warriorTraining ?? 40) / 200; // up to +50% at 100 training
  const equipmentFactor = 1 + ((character.warriorEquipmentLevel ?? 1) - 1) * 0.20; // +20% per level above 1, up to +80% at level 5
  const moraleFactor = 0.5 + (character.warriorMorale ?? 75) / 100; // can vary from 0.5 to 1.5

  const power = Math.floor(soldiers * (1 + skillVal) * mobilityBonus * trainingFactor * equipmentFactor * moraleFactor);

  return { power: isNaN(power) ? 0 : power, soldiers: isNaN(soldiers) ? 0 : soldiers };
}

export function generateCharacter(overrides?: {
  name?: string;
  gender?: Gender;
  tribe?: string;
  clan?: string;
  socialClass?: SocialClass;
  appearanceOptions?: Character['appearanceOptions'];
  traits?: string[];
}): Character {
  const gender = overrides?.gender || (Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE);
  const names = gender === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
  const firstName = overrides?.name || names[Math.floor(Math.random() * names.length)];
  const clan = overrides?.clan || MONGOL_SURNAMES[Math.floor(Math.random() * MONGOL_SURNAMES.length)];
  const socialClass = overrides?.socialClass || Object.values(SocialClass)[Math.floor(Math.random() * Object.values(SocialClass).length)];
  const tribe = overrides?.tribe || TRIBES[Math.floor(Math.random() * TRIBES.length)];

  // Randomize stats slightly
  const baseStats = { ...INITIAL_STATS[socialClass] };
  Object.keys(baseStats).forEach(key => {
    const k = key as keyof typeof baseStats;
    const currentVal = baseStats[k] || 0;
    const randomized = currentVal + (Math.floor(Math.random() * 21) - 10);
    
    if (k === 'wealth') {
      baseStats[k] = Math.max(0, randomized);
    } else {
      baseStats[k] = Math.max(0, Math.min(100, randomized));
    }
  });

  const traits = overrides?.traits || [];
  
  // Apply trait effects if present
  if (traits.length > 0) {
    traits.forEach(traitId => {
      const trait = STARTING_TRAITS.find(t => t.id === traitId);
      if (trait && (trait as any).effect) {
        Object.entries((trait as any).effect).forEach(([stat, bonus]) => {
          const s = stat as keyof typeof baseStats;
          baseStats[s] = Math.min(100, baseStats[s] + (bonus as number));
        });
      }
    });
  }

  const appearanceOptions = overrides?.appearanceOptions || {
    hairColor: 'Black',
    eyeColor: 'Dark Brown',
    build: 'Athletic' as const
  };

  const fatherName = MONGOL_NAMES_MALE[Math.floor(Math.random() * MONGOL_NAMES_MALE.length)];
  const motherName = MONGOL_NAMES_FEMALE[Math.floor(Math.random() * MONGOL_NAMES_FEMALE.length)];

  const startingRelationships: Relationship[] = [
    { id: crypto.randomUUID(), name: `${fatherName} ${clan}`, type: 'Father', loyalty: 80, status: 'Active', traits: getRandomTraits(2), clan, avatarUrl: getNomadAvatar(fatherName, Gender.MALE, clan, 25, undefined, socialClass), age: 25 },
    { id: crypto.randomUUID(), name: `${motherName} ${clan}`, type: 'Mother', loyalty: 90, status: 'Active', traits: getRandomTraits(2), clan, avatarUrl: getNomadAvatar(motherName, Gender.FEMALE, clan, 22, undefined, socialClass), age: 22 },
  ];

  const char: Character = {
    id: crypto.randomUUID(),
    name: `${firstName} ${clan}`,
    age: 0,
    gender,
    socialClass,
    stats: baseStats,
    role: 'Child',
    tribe,
    clan,
    relationships: startingRelationships,
    traits,
    appearanceOptions,
    assets: socialClass === SocialClass.NOMAD ? [] : [{ 
      id: 'starter-horse', 
      name: 'Family Pony', 
      type: 'Horse', 
      value: 50, 
      quality: 30,
      stats: { speed: 40, loyalty: 80, attackBonus: 2, defenseBonus: 2 } 
    }],
    isAlive: true,
    children: 0,
    clanWealth: socialClass === SocialClass.NOBLE ? 5000 : (socialClass === SocialClass.MERCHANT ? 3000 : 1000),
    tribeRelations: TRIBES.filter(t => t !== tribe).map(t => ({
      name: t,
      level: 'Neutral' as const,
      standing: 0,
      isTrading: false,
      militaryPower: 500 + Math.floor(Math.random() * 2000)
    })),
    conqueredTribes: [],
    conqueredKingdoms: [],
    isGreatKhan: false,
    militaryPower: 0,
    hordeSize: 0,
    successionLaw: 'Tanistry',
    lifestyle: 'Nomadic',
    pastureCapacity: socialClass === SocialClass.NOBLE ? 600 : 300,
    pastureUpgrades: 0,
    livestock: {
      horses: socialClass === SocialClass.NOMAD ? 2 : (socialClass === SocialClass.WARRIOR ? 5 : (socialClass === SocialClass.NOBLE ? 20 : 0)),
      sheep: socialClass === SocialClass.NOMAD ? 20 : (socialClass === SocialClass.NOBLE ? 100 : 10),
      cattle: socialClass === SocialClass.NOMAD ? 5 : (socialClass === SocialClass.NOBLE ? 30 : 2),
      goats: socialClass === SocialClass.NOMAD ? 10 : (socialClass === SocialClass.NOBLE ? 50 : 5),
      yaks: socialClass === SocialClass.NOMAD ? 1 : (socialClass === SocialClass.NOBLE ? 10 : 0),
      camels: socialClass === SocialClass.MERCHANT ? 5 : (socialClass === SocialClass.NOBLE ? 5 : 0),
    },
    marketCondition: MarketCondition.STABLE,
    marketTrends: {
      'Horse': 1.0,
      'Weapon': 1.0,
      'Armor': 1.0,
      'Commodity': 1.0,
      'Luxury': 1.0,
      'Bird': 1.0,
      'Yurt': 1.0
    },
    availableMarketItems: refreshMarketItems(MarketCondition.STABLE, {
      'Horse': 1.0,
      'Weapon': 1.0,
      'Armor': 1.0,
      'Commodity': 1.0,
      'Luxury': 1.0,
      'Bird': 1.0,
      'Yurt': 1.0
    }),
    history: [{ age: 0, text: `Born to the ${clan} clan in the ${tribe} tribe.` }],
    avatarUrl: getNomadAvatar(firstName, gender, clan, 0, appearanceOptions, socialClass),
    taxReport: {
      taxesPaid: 0,
      taxesCollected: 0,
      soldierSalaryPaid: 0,
      soldierSalaryReceived: 0,
      netIncome: 0,
    },
  };

  const initialMil = calculateMilitaryPower(char);
  char.militaryPower = initialMil.power;
  char.hordeSize = initialMil.soldiers;

  char.title = calculateTitle(char);
  return char;
}

export function ageUp(character: Character): Character {
  const newAge = character.age + 1;
  const newHistory = [...character.history];
  const newStats = { ...character.stats };

  // Ensure stats are numbers (protection against NaN)
  Object.keys(newStats).forEach(key => {
    const k = key as keyof typeof newStats;
    if (typeof newStats[k] !== 'number' || Number.isNaN(newStats[k])) {
      newStats[k] = 0;
    }
  });

  // Yearly fluctuations
  newStats.happiness = Math.max(0, Math.min(100, newStats.happiness + (Math.floor(Math.random() * 11) - 5)));
  newStats.health = Math.max(0, Math.min(100, newStats.health + (Math.floor(Math.random() * 5) - 3)));
  newStats.appearance = Math.max(0, Math.min(100, newStats.appearance + (Math.floor(Math.random() * 3) - 1))); // Slow changes
  newStats.perception = Math.max(0, Math.min(100, newStats.perception + (Math.floor(Math.random() * 3)))); // Experience increases perception slowly

  // ===== UNIFIED TAX & SOLDIER SALARY ECONOMY =====
  const militaryRoles = [
    'Horseback Recruit', 'Warrior', 'Vanguard', 'Squad Leader (Arban)',
    'Centurion (Zuun)', 'Commander of Thousand (Mingghan)', 'General',
    'Warlord', 'Marshal of the Empire', 'Kheshig Aspirant', 'Imperial Guard (Kheshig)'
  ];
  const isMilitary = militaryRoles.includes(character.role);
  const soldierSalaryReceived = isMilitary ? (ROLE_SALARIES[character.role] || 0) : 0;
  const baseRoleSalary = !isMilitary ? (ROLE_SALARIES[character.role] || 0) : 0;

  // Artisan Crafting & Trade growth (Calculated on current wealth before taxes/salaries)
  let artisanIncome = 0;
  if (character.socialClass === SocialClass.BLACKSMITH) {
    artisanIncome = (newStats.strength * 2) + (newStats.intelligence * 2);
  } else if (character.socialClass === SocialClass.MERCHANT || character.role.includes('Merchant') || character.role.includes('Trader') || character.role.includes('Guild')) {
    let scrollMultiplier = 0.05;
    if (character.role === 'Merchant Prince') scrollMultiplier = 0.10;
    if (character.role === 'Guild Master') scrollMultiplier = 0.15;
    artisanIncome = Math.floor(newStats.wealth * scrollMultiplier);
  }

  // Taxes / Tributes Collected by the player if in a sovereign role
  let taxesCollected = 0;
  if (character.role === 'Great Khan') {
    // Imperial direct taxation of subject tribes
    character.tribeRelations.forEach(rel => {
      if (rel.standing >= 50) taxesCollected += 200;
      else if (rel.standing >= 0) taxesCollected += 100;
      else if (rel.level !== 'At War') taxesCollected += 30;
    });
    // Heavy yearly tribute from conquered tribes
    taxesCollected += character.conqueredTribes.length * 750;
    // Conquered kingdoms extra tributary revenue
    taxesCollected += (character.conqueredKingdoms?.length || 0) * 1500;
  } else if (character.role === 'Warlord' || character.role === 'General' || character.role === 'Noyan (Noble Commander)' || character.role === 'Marshal of the Empire') {
    taxesCollected += character.conqueredTribes.length * 350;
    taxesCollected += Math.floor(character.assets.length * 25);
  } else if (character.role === 'Clan Elder' || character.role === 'Tribal Judge (Jarghuchi)' || character.role === 'Master Herder' || character.role === 'Guild Master') {
    taxesCollected += 120 + Math.floor(newStats.reputation * 1.5);
  }

  // Taxes Paid by the player to the higher sovereign (unless exempt)
  let taxesPaid = 0;
  const exemptFromTaxes = ['Great Khan', 'Warlord', 'Noyan (Noble Commander)', 'Marshal of the Empire', 'General'];
  if (newAge >= 15 && !exemptFromTaxes.includes(character.role)) {
    if (character.socialClass === SocialClass.NOMAD) {
      taxesPaid = 6 + Math.floor(newStats.wealth * 0.02);
    } else if (character.socialClass === SocialClass.BLACKSMITH) {
      taxesPaid = 12 + Math.floor(newStats.wealth * 0.035);
    } else if (character.socialClass === SocialClass.WARRIOR) {
      taxesPaid = 8 + Math.floor(newStats.wealth * 0.025);
    } else if (character.socialClass === SocialClass.MERCHANT) {
      taxesPaid = 35 + Math.floor(newStats.wealth * 0.05);
    } else if (character.socialClass === SocialClass.NOBLE) {
      taxesPaid = 80 + Math.floor(newStats.wealth * 0.045);
    }
  }

  // Soldiers Salary Paid by the player to maintain their active horde
  let soldierSalaryPaid = 0;
  const commandRoles = ['Squad Leader (Arban)', 'Centurion (Zuun)', 'Commander of Thousand (Mingghan)', 'General', 'Warlord', 'Marshal of the Empire', 'Noyan (Noble Commander)', 'Great Khan'];
  
  if (character.hordeSize > 0 && commandRoles.includes(character.role)) {
    let wageRate = 0.5;
    if (character.role === 'Squad Leader (Arban)') wageRate = 1.0;
    else if (character.role === 'Centurion (Zuun)') wageRate = 0.75;
    else if (character.role === 'Commander of Thousand (Mingghan)') wageRate = 0.6;
    else if (character.role === 'General') wageRate = 0.5;
    else if (character.role === 'Warlord' || character.role === 'Noyan (Noble Commander)' || character.role === 'Marshal of the Empire') wageRate = 0.4;
    else if (character.role === 'Great Khan') wageRate = 0.25;

    soldierSalaryPaid = Math.floor(character.hordeSize * wageRate);
  }

  // Domestic lifestyle herder costs or noble maintenance
  let nobleAssetMaintenance = 0;
  if (character.socialClass === SocialClass.NOBLE && character.age > 18 && !character.role.includes('Great Khan')) {
    nobleAssetMaintenance = Math.floor(character.assets.length * 30) + 120;
  }

  // Final Calculations
  const grossIncome = baseRoleSalary + soldierSalaryReceived + taxesCollected + artisanIncome;
  const grossExpenses = taxesPaid + soldierSalaryPaid + nobleAssetMaintenance;
  const netIncome = grossIncome - grossExpenses;

  newStats.wealth = Math.max(0, newStats.wealth + netIncome);

  // Recession losses (investment risk)
  let recessionLoss = 0;
  if ((character.socialClass === SocialClass.MERCHANT || character.role.includes('Merchant')) && character.marketCondition === MarketCondition.RECESSION && Math.random() < 0.2) {
    recessionLoss = Math.floor(newStats.wealth * 0.08);
    newStats.wealth = Math.max(0, newStats.wealth - recessionLoss);
    newHistory.push({ age: newAge, text: `The economic recession hit your trade investments hard. Lost ${recessionLoss}г.` });
  }

  // Narrative logging for Taxes & Military Wages
  if (soldierSalaryReceived > 0) {
    newHistory.push({ age: newAge, text: `🛡️ Received army wage of ${soldierSalaryReceived}г as an active ${character.role}.` });
  }
  if (taxesPaid > 0) {
    newHistory.push({ age: newAge, text: `📥 Paid ${taxesPaid}г in annual taxes to the Tribal elders and Khaganate Tax collectors.` });
  }
  if (taxesCollected > 0) {
    newHistory.push({ age: newAge, text: `💰 Collected ${taxesCollected}г in taxes and tributes from subject herds and conquered territories.` });
  }
  if (soldierSalaryPaid > 0) {
    newHistory.push({ age: newAge, text: `✊ Disbursed ${soldierSalaryPaid}г in soldiers' wages to sustain your army of ${character.hordeSize} fierce warriors.` });
    
    // Check for mutinous pay crisis
    if (newStats.wealth === 0 && netIncome < 0) {
      newStats.happiness = Math.max(0, newStats.happiness - 15);
      newStats.reputation = Math.max(0, newStats.reputation - 12);
      newHistory.push({ age: newAge, text: "⚠️ PAY CRISIS: You have run out of gold and failed to pay your soldiers' wages! Morale collapsed; army desertions imminent." });
    }
  }
  if (nobleAssetMaintenance > 0) {
    newHistory.push({ age: newAge, text: `Spent ${nobleAssetMaintenance}г to maintain your noble status, gear, and yurt compound.` });
  }

  const currentTaxReport = {
    taxesPaid,
    taxesCollected,
    soldierSalaryPaid,
    soldierSalaryReceived,
    netIncome
  };

  // Realm Reputation growth
  let realmRepGain = 0;
  if (character.isGreatKhan) realmRepGain += 2;
  realmRepGain += character.conqueredTribes.length * 0.5;
  if (newStats.reputation > 80) realmRepGain += 1;
  if (newStats.wealth > 10000 && character.role.includes('Merchant')) realmRepGain += 1;
  
  // High tier roles gain realm reputation
  const eliteRoles = ['Marshal of the Empire', 'Merchant Prince', 'Oracle of the Eternal Sky', 'Imperial Spymaster', 'Warlord'];
  if (eliteRoles.includes(character.role)) realmRepGain += 1.5;
  
  newStats.realmReputation = Math.max(0, Math.min(100, newStats.realmReputation + realmRepGain));

  // Diplomacy Impacts
  let newClanWealth = character.clanWealth;
  const newLivestock = { ...character.livestock };
  const droughtYearsLeft = character.droughtYears ? Math.max(0, character.droughtYears - 1) : 0;
  const inDrought = character.droughtYears && character.droughtYears > 0;
  const droughtPenalty = inDrought ? 0.2 : 1.0; // 80% reduction in breeding and crops

  if (inDrought) {
    newStats.health = Math.max(0, newStats.health - 4);
    newStats.happiness = Math.max(0, newStats.happiness - 8);
    newHistory.push({ age: newAge, text: "The effects of the drought persist, weakening your herds and people." });
  }

  // Breeding Logic
  const currentCapacity = character.pastureCapacity || (character.socialClass === SocialClass.NOBLE ? 600 : 300);
  const totalAnimalsBefore = (newLivestock.horses || 0) + (newLivestock.sheep || 0) + (newLivestock.cattle || 0) + (newLivestock.goats || 0) + (newLivestock.yaks || 0) + (newLivestock.camels || 0);

  // If already at or above capacity, breeding is disabled and overgrazing occurs
  const isOvergrazedBefore = totalAnimalsBefore > currentCapacity;
  const capacityBreedingMultiplier = isOvergrazedBefore ? 0.05 : 1.0; // Breeding almost halts due to sparse grass

  if (character.lifestyle === 'Nomadic') {
    // Nomads have better breeding for horses
    if (newLivestock.horses > 0) newLivestock.horses += Math.floor(newLivestock.horses * (0.1 + Math.random() * 0.05) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.sheep > 0) newLivestock.sheep += Math.floor(newLivestock.sheep * (0.2 + Math.random() * 0.1) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.cattle > 0) newLivestock.cattle += Math.floor(newLivestock.cattle * (0.15 + Math.random() * 0.08) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.goats > 0) newLivestock.goats += Math.floor(newLivestock.goats * (0.25 + Math.random() * 0.15) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.yaks > 0) newLivestock.yaks += Math.floor(newLivestock.yaks * (0.1 + Math.random() * 0.05) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.camels > 0) newLivestock.camels += Math.floor(newLivestock.camels * (0.05 + Math.random() * 0.03) * droughtPenalty * capacityBreedingMultiplier);
  } else {
    // Settled lifestyle has stable breeding but lower rates for horses
    if (newLivestock.horses > 0) newLivestock.horses += Math.floor(newLivestock.horses * (0.05 + Math.random() * 0.02) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.sheep > 0) newLivestock.sheep += Math.floor(newLivestock.sheep * (0.15 + Math.random() * 0.05) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.cattle > 0) newLivestock.cattle += Math.floor(newLivestock.cattle * (0.2 + Math.random() * 0.1) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.goats > 0) newLivestock.goats += Math.floor(newLivestock.goats * (0.2 + Math.random() * 0.1) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.yaks > 0) newLivestock.yaks += Math.floor(newLivestock.yaks * (0.15 + Math.random() * 0.07) * droughtPenalty * capacityBreedingMultiplier);
    if (newLivestock.camels > 0) newLivestock.camels += Math.floor(newLivestock.camels * (0.08 + Math.random() * 0.04) * droughtPenalty * capacityBreedingMultiplier);
    
    // Settled life provides crop income
    const cropIncome = (200 + (newStats.intelligence * 2)) * droughtPenalty;
    newClanWealth += Math.floor(cropIncome);
  }

  // Calculate post-breeding count
  const totalAnimalsAfter = (newLivestock.horses || 0) + (newLivestock.sheep || 0) + (newLivestock.cattle || 0) + (newLivestock.goats || 0) + (newLivestock.yaks || 0) + (newLivestock.camels || 0);
  if (totalAnimalsAfter > currentCapacity) {
    // Overgrazing starvation penalty: reduce counts to close to capacity
    const excess = totalAnimalsAfter - currentCapacity;
    const lossPercentage = Math.min(0.4, (excess / currentCapacity) * 0.5 + 0.1); // Up to 40% loss of excess

    const hLoss = Math.floor(newLivestock.horses * lossPercentage);
    const sLoss = Math.floor(newLivestock.sheep * lossPercentage);
    const cLoss = Math.floor(newLivestock.cattle * lossPercentage);
    const gLoss = Math.floor(newLivestock.goats * lossPercentage);
    const yLoss = Math.floor(newLivestock.yaks * lossPercentage);
    const camLoss = Math.floor(newLivestock.camels * lossPercentage);

    newLivestock.horses = Math.max(0, newLivestock.horses - hLoss);
    newLivestock.sheep = Math.max(0, newLivestock.sheep - sLoss);
    newLivestock.cattle = Math.max(0, newLivestock.cattle - cLoss);
    newLivestock.goats = Math.max(0, newLivestock.goats - gLoss);
    newLivestock.yaks = Math.max(0, newLivestock.yaks - yLoss);
    newLivestock.camels = Math.max(0, newLivestock.camels - camLoss);

    const totalLost = hLoss + sLoss + cLoss + gLoss + yLoss + camLoss;
    if (totalLost > 0) {
      newHistory.push({ 
        age: newAge, 
        text: `⚠️ OVERGRAZING: Your herd (${totalAnimalsAfter}) exceeded pasture capacity (${currentCapacity}). Overgrazing withered the grasslands, causing starvation and loss of ${totalLost} animals.` 
      });
      newStats.happiness = Math.max(0, newStats.happiness - 8);
    }
  }

  // Disease/Winter loss (random event)
  if (Math.random() < 0.15) {
     const lossRate = 0.1 + Math.random() * 0.2;
     const lossH = Math.floor(newLivestock.horses * lossRate);
     const lossS = Math.floor(newLivestock.sheep * lossRate);
     const lossC = Math.floor(newLivestock.cattle * lossRate);
     const lossG = Math.floor(newLivestock.goats * lossRate);
     const lossY = Math.floor(newLivestock.yaks * lossRate);
     const lossCam = Math.floor(newLivestock.camels * lossRate);
     newLivestock.horses -= lossH;
     newLivestock.sheep -= lossS;
     newLivestock.cattle -= lossC;
     newLivestock.goats -= lossG;
     newLivestock.yaks -= lossY;
     newLivestock.camels -= lossCam;
     if (lossS > 5 || lossG > 5) {
        newHistory.push({ age: newAge, text: `A harsh winter (Dzud) struck. You lost many animals to the cold and hunger.` });
     }
  }

  character.tribeRelations.forEach(rel => {
    // Update tribal military power over time
    rel.militaryPower = Math.floor(rel.militaryPower * (0.95 + Math.random() * 0.1));
    
    if (rel.isTrading) {
      const isMerchant = character.socialClass === SocialClass.MERCHANT;
      const tradeIncome = (isMerchant ? 300 : 100) + Math.floor(newStats.intelligence * (isMerchant ? 2 : 1));
      newClanWealth += tradeIncome;
    }
    if (rel.level === 'At War') {
      const raidLoss = Math.floor(Math.random() * 200) + 50;
      newClanWealth = Math.max(0, newClanWealth - raidLoss);
      
      const stolenList: string[] = [];
      if (newLivestock.horses > 0) {
        const stolen = Math.max(1, Math.floor(newLivestock.horses * (0.05 + Math.random() * 0.1)));
        newLivestock.horses -= stolen;
        stolenList.push(`${stolen}x Horses`);
      }
      if (newLivestock.sheep > 0) {
        const stolen = Math.max(1, Math.floor(newLivestock.sheep * (0.08 + Math.random() * 0.12)));
        newLivestock.sheep -= stolen;
        stolenList.push(`${stolen}x Sheep`);
      }
      if (newLivestock.cattle > 0) {
        const stolen = Math.max(1, Math.floor(newLivestock.cattle * (0.05 + Math.random() * 0.1)));
        newLivestock.cattle -= stolen;
        stolenList.push(`${stolen}x Cattle`);
      }
      if (newLivestock.goats > 0) {
        const stolen = Math.max(1, Math.floor(newLivestock.goats * (0.08 + Math.random() * 0.12)));
        newLivestock.goats -= stolen;
        stolenList.push(`${stolen}x Goats`);
      }
      if (newLivestock.yaks > 0) {
        const stolen = Math.max(1, Math.floor(newLivestock.yaks * (0.05 + Math.random() * 0.08)));
        newLivestock.yaks -= stolen;
        stolenList.push(`${stolen}x Yaks`);
      }
      if (newLivestock.camels > 0) {
        const stolen = Math.max(1, Math.floor(newLivestock.camels * (0.03 + Math.random() * 0.05)));
        newLivestock.camels -= stolen;
        stolenList.push(`${stolen}x Camels`);
      }

      const stolenString = stolenList.length > 0 ? stolenList.join(', ') : "some stray livestock";

      if (Math.random() < 0.1) {
        newStats.health -= 5;
        newHistory.push({ age: newAge, text: `⚠️ RAID: A ${rel.name} war-party raided your pastures. You were wounded defending the herds, losing ${stolenString}.` });
      } else {
        newHistory.push({ age: newAge, text: `⚠️ RAID: A ${rel.name} war-party raided your pastures, stealing livestock: ${stolenString}.` });
      }
    }
  });

  let newlyDeceasedHeirId: string | undefined = undefined;

  // Relationship aging and stat growth
  const newRelationships = character.relationships.map(rel => {
    const updatedRel = { ...rel };
    if (!updatedRel.status) {
      updatedRel.status = 'Active';
    }

    if (updatedRel.age !== undefined && updatedRel.status === 'Active') {
      updatedRel.age += 1;
      
      // Update avatar on birthday milestone or style boundaries
      if (updatedRel.age % 5 === 0 || updatedRel.age === 12 || updatedRel.age === 66) {
        updatedRel.avatarUrl = getNomadAvatar(updatedRel.name, updatedRel.gender || Gender.FEMALE, updatedRel.clan || 'Unknown', updatedRel.age, undefined, updatedRel.socialClass);
      }
      
      // If it's a child, evolve their stats
      if (updatedRel.type === 'Child' && updatedRel.stats) {
        const stats = { ...updatedRel.stats };
        Object.keys(stats).forEach(key => {
          const k = key as keyof CharacterStats;
          // Stats grow naturally based on random chance
          if (Math.random() < 0.4) {
             const currentVal = typeof stats[k] === 'number' ? stats[k] : 0;
             stats[k] = Math.min(100, currentVal + Math.floor(Math.random() * 3));
          }
        });
        updatedRel.stats = stats;
        
        // Evolve to Adult Child at age 15
        if (updatedRel.age >= 15) {
          updatedRel.type = 'Adult Child';
        }
      }

      // NPC death logic
      let died = false;
      let deathReason = '';
      const age = updatedRel.age;

      if (age > 1) {
        let deathChance = 0.003; // Base annual tragedy chance
        
        // Increase death probability progressively with age milestones
        if (age > 30) deathChance += 0.006; // ~0.9%
        if (age > 45) deathChance += 0.018; // ~2.7%
        if (age > 60) deathChance += 0.045; // ~7.2%
        if (age > 70) deathChance += 0.10;  // ~17.2%
        if (age > 80) deathChance += 0.20;  // ~37.2%
        if (age > 90) deathChance += 0.40;  // ~77.2%

        if (inDrought) {
          deathChance += 0.035; // Stress from resource exhaustion
        }

        if (Math.random() < deathChance) {
          died = true;
          if (age > 65) {
            const oldAgeCauses = [
              'passing away peacefully in their yurt',
              'natural exhaustion after a lifetime on the open steppe',
              'a failing tired heart under the great sky',
              'a winter chest sickness and chill'
            ];
            deathReason = oldAgeCauses[Math.floor(Math.random() * oldAgeCauses.length)];
          } else if (updatedRel.type === 'Spouse' || updatedRel.type === 'Second Wife' || updatedRel.type === 'Concubine') {
            const spouseCauses = [
              'childbed fever and delivery complications',
              'severe campfire fever',
              'an unexpected outbreak of lung sickness',
              'being thrown and trampled by a restless warhorse'
            ];
            deathReason = spouseCauses[Math.floor(Math.random() * spouseCauses.length)];
          } else if (updatedRel.type === 'Child' || updatedRel.type === 'Adult Child') {
            const offspringCauses = [
              'a rapid summer throat infection',
              'a rogue arrow accident during archery practice',
              'a sudden deadly desert fever',
              'being thrown from a wild stallion',
              'infection after battle training'
            ];
            deathReason = offspringCauses[Math.floor(Math.random() * offspringCauses.length)];
          } else {
            const genericCauses = [
              'a sudden cold of the lungs',
              'a night predator wolf ambush',
              'a violent kick from a pack camel',
              'septic poisoning after a hunting mishap'
            ];
            deathReason = genericCauses[Math.floor(Math.random() * genericCauses.length)];
          }
        }
      }

      if (died) {
        updatedRel.status = 'Deceased';
        newHistory.push({
          age: newAge,
          text: `Tragedy falls on your yurt: your ${updatedRel.type.toLowerCase()} ${updatedRel.name} has passed away at age ${updatedRel.age} due to ${deathReason}.`
        });
        if (character.heirId === updatedRel.id) {
          newlyDeceasedHeirId = updatedRel.id;
        }
      }
    }
    return updatedRel;
  });

  if (newlyDeceasedHeirId) {
    newHistory.push({
      age: newAge,
      text: "With the tragic passing of your designated heir, you have no named successor left in your house."
    });
  }

  // Natural aging effects
  if (newAge > 40) {
    newStats.health -= 1;
    newStats.appearance -= 1;
  }
  if (newAge > 60) {
    newStats.health -= 3;
    newStats.strength -= 2;
    newStats.happiness -= 2;
    newStats.appearance -= 2;
  }

  // Yearly Market Update
  let newMarketCondition = character.marketCondition;
  const newMarketTrends = { ...character.marketTrends };

  // Randomly fluctuate trends (Supply/Demand)
  Object.keys(newMarketTrends).forEach(cat => {
     // Trends move slowly, but can reach extremes
     const fluctuation = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
     newMarketTrends[cat] = Math.max(0.5, Math.min(2.0, newMarketTrends[cat] + fluctuation));
  });

  if (Math.random() < 0.25) {
     const conditions = Object.values(MarketCondition);
     newMarketCondition = conditions[Math.floor(Math.random() * conditions.length)];
     if (newMarketCondition !== character.marketCondition) {
        let msg = `The steppe markets have changed. Current state: ${newMarketCondition}.`;
        if (newMarketCondition === MarketCondition.GOLD_RUSH) msg = "Rumors of gold in the mountains have sent luxury prices soaring!";
        if (newMarketCondition === MarketCondition.BLOCKADE) msg = "A conflict in the South has blockaded the Silk Road. Commodities are scarce and expensive!";
        newHistory.push({ age: newAge, text: msg });
        
        // Conditions can drastically sway trends
        if (newMarketCondition === MarketCondition.WAR_PREP) {
           newMarketTrends['Weapon'] = 1.8;
           newMarketTrends['Armor'] = 1.6;
        } else if (newMarketCondition === MarketCondition.FAMINE) {
           newMarketTrends['Horse'] = 2.0;
        } else if (newMarketCondition === MarketCondition.BOOM) {
           newMarketTrends['Luxury'] = 1.5;
           newMarketTrends['Commodity'] = 1.3;
        }
     }
  }

  // Career Promotion Logic
  let updatedRole = character.role;
  const promotionChance = 0.25; // Slightly increased chance

  if (Math.random() < promotionChance) {
    const totalAnimals = (newLivestock.horses || 0) + (newLivestock.sheep || 0) + (newLivestock.cattle || 0) + (newLivestock.goats || 0) + (newLivestock.yaks || 0) + (newLivestock.camels || 0);
    // Child to Adult transition
    if (updatedRole === 'Child' && newAge >= 15) {
      if (character.socialClass === SocialClass.WARRIOR) updatedRole = 'Horseback Recruit';
      else if (character.socialClass === SocialClass.MERCHANT) updatedRole = 'Apprentice Trader';
      else if (character.socialClass === SocialClass.BLACKSMITH) updatedRole = 'Apprentice Blacksmith';
      else if (character.socialClass === SocialClass.NOBLE) updatedRole = 'Kheshig Aspirant';
      else updatedRole = 'Nomad';
      newHistory.push({ age: newAge, text: `You have come of age. You are now a ${updatedRole}.` });
    }
    
    // Military Path
    else if (updatedRole === 'Horseback Recruit' && newStats.strength >= 45 && newStats.archery >= 40) {
      updatedRole = 'Warrior';
      newHistory.push({ age: newAge, text: "You have proven your worth in raids. You are now a recognized Warrior." });
    } else if (updatedRole === 'Warrior' && newStats.strength >= 60 && newStats.archery >= 60) {
      updatedRole = 'Vanguard';
      newHistory.push({ age: newAge, text: "You lead the charge. You are now of the Vanguard." });
    } else if (updatedRole === 'Vanguard' && newStats.leadership >= 40) {
      updatedRole = 'Squad Leader (Arban)';
      newHistory.push({ age: newAge, text: "Ten warriors now follow your command. You are an Arban leader." });
    } else if (updatedRole === 'Squad Leader (Arban)' && newStats.leadership >= 60 && newStats.reputation >= 50) {
      updatedRole = 'Centurion (Zuun)';
      newHistory.push({ age: newAge, text: "You lead a hundred. You are a Centurion." });
    } else if (updatedRole === 'Centurion (Zuun)' && newStats.leadership >= 80 && newStats.reputation >= 80) {
      updatedRole = 'Commander of Thousand (Mingghan)';
      newHistory.push({ age: newAge, text: "A thousand warriors obey your word. You are a Mingghan commander." });
    } else if (updatedRole === 'Commander of Thousand (Mingghan)' && newStats.leadership >= 90 && character.conqueredTribes.length >= 1) {
      updatedRole = 'General';
      newHistory.push({ age: newAge, text: "You orchestrate entire campaigns. You are a General of the Steppe." });
    } else if (updatedRole === 'General' && character.conqueredTribes.length >= 3) {
      updatedRole = 'Warlord';
      newHistory.push({ age: newAge, text: "Nations tremble at your name. You are a Warlord." });
    }

    // Elite Path
    else if (updatedRole === 'Kheshig Aspirant' && newStats.loyalty >= 80 && newAge >= 18) {
      updatedRole = 'Imperial Guard (Kheshig)';
      newHistory.push({ age: newAge, text: "You serve in the Khagan's personal guard. You are Kheshig." });
    } else if (updatedRole === 'Imperial Guard (Kheshig)' && newStats.leadership >= 70 && newStats.reputation >= 70) {
      updatedRole = 'Noyan (Noble Commander)';
      newHistory.push({ age: newAge, text: "You are a Noyan, a lord and commander of the elite." });
    }

    // Trade Path
    else if (updatedRole === 'Apprentice Trader' && newStats.intelligence >= 50) {
      updatedRole = 'Caravan Guard';
      newHistory.push({ age: newAge, text: "You protect the riches of the Silk Road. You are a Caravan Guard." });
    } else if (updatedRole === 'Caravan Guard' && newStats.intelligence >= 65 && newStats.wealth >= 500) {
      updatedRole = 'Merchant';
      newHistory.push({ age: newAge, text: "You have your own caravans now. You are a Merchant." });
    } else if (updatedRole === 'Merchant' && newStats.wealth >= 2000) {
       updatedRole = 'Caravan Master';
       newHistory.push({ age: newAge, text: "You manage vast networks of trade. You are a Caravan Master." });
    } else if (updatedRole === 'Caravan Master' && newStats.wealth >= 10000) {
      updatedRole = 'Guild Master';
      newHistory.push({ age: newAge, text: "The trade guilds bow to your influence. You are a Guild Master." });
    } else if (updatedRole === 'Guild Master' && newStats.wealth >= 50000) {
      updatedRole = 'Merchant Prince';
      newHistory.push({ age: newAge, text: "Your wealth rivals the Khans. You are a Merchant Prince." });
    }

    // Craft Path
    else if (updatedRole === 'Apprentice Blacksmith' && newStats.strength >= 50 && newStats.intelligence >= 40) {
      updatedRole = 'Journeyman Smith';
      newHistory.push({ age: newAge, text: "Your steel rings true. You are now a Journeyman Smith." });
    } else if (updatedRole === 'Journeyman Smith' && newStats.strength >= 70 && newStats.intelligence >= 60) {
      updatedRole = 'Master Smith';
      newHistory.push({ age: newAge, text: "The finest blades in the tribe are yours. You are a Master Smith." });
    } else if (updatedRole === 'Master Smith' && newStats.reputation >= 80 && newStats.wealth >= 5000) {
      updatedRole = 'Royal Armorer';
      newHistory.push({ age: newAge, text: "You forge the gear of the Great Khagan himself. You are the Royal Armorer." });
    }

    // Bowyer Path
    else if (updatedRole === 'Journeyman Smith' && newStats.archery >= 60 && newStats.intelligence >= 50) {
      updatedRole = 'Apprentice Bowyer';
      newHistory.push({ age: newAge, text: "You have shown a talent for the recursive bow. You are an Apprentice Bowyer." });
    } else if (updatedRole === 'Apprentice Bowyer' && newStats.archery >= 75 && newStats.intelligence >= 60) {
      updatedRole = 'Bowyer';
      newHistory.push({ age: newAge, text: "Your bows are coveted by warriors. You are a Bowyer." });
    } else if (updatedRole === 'Bowyer' && newStats.reputation >= 80 && newStats.intelligence >= 80) {
      updatedRole = 'Master Bowyer';
      newHistory.push({ age: newAge, text: "You understand the soul of the horn and sinew. You are a Master Bowyer." });
    } else if (updatedRole === 'Master Bowyer' && character.conqueredTribes.length >= 1) {
      updatedRole = 'Master of the Arsenal';
      newHistory.push({ age: newAge, text: "You oversee the production of war for the entire horde. You are Master of the Arsenal." });
    }

    // Diplomacy Path
    else if (updatedRole === 'Clan Scout' && newStats.intelligence >= 60 && newStats.reputation >= 40) {
      updatedRole = 'Envoy';
      newHistory.push({ age: newAge, text: "You carry the word of your tribe to others. You are an Envoy." });
    } else if (updatedRole === 'Envoy' && newStats.intelligence >= 75 && newStats.reputation >= 60) {
      updatedRole = 'Imperial Emissary';
      newHistory.push({ age: newAge, text: "You represent the Great Empire in foreign courts. You are an Emissary." });
    } else if (updatedRole === 'Imperial Emissary' && newStats.leadership >= 70 && newStats.intelligence >= 85) {
      updatedRole = 'Ambassador';
      newHistory.push({ age: newAge, text: "Kings and Queens listen when you speak. You are an Ambassador." });
    } else if (updatedRole === 'Ambassador' && character.conqueredTribes.length >= 2) {
      updatedRole = 'Grand Vizier';
      newHistory.push({ age: newAge, text: "You sit at the right hand of power. You are the Grand Vizier." });
    }

    // Spy Path
    else if (updatedRole === 'Clan Scout' && newStats.archery >= 60 && newStats.intelligence >= 50) {
      updatedRole = 'Steppe Spy';
      newHistory.push({ age: newAge, text: "You see what others cannot. You have become a Steppe Spy." });
    } else if (updatedRole === 'Steppe Spy' && newStats.archery >= 75 && newStats.intelligence >= 70) {
      updatedRole = 'Information Broker';
      newHistory.push({ age: newAge, text: "Secrets are your currency. You are an Information Broker." });
    } else if (updatedRole === 'Information Broker' && newStats.intelligence >= 90 && newStats.reputation >= 70) {
      updatedRole = 'Master of Whispers';
      newHistory.push({ age: newAge, text: "You control the flow of knowledge. You are the Master of Whispers." });
    } else if (updatedRole === 'Master of Whispers' && character.conqueredTribes.length >= 4) {
      updatedRole = 'Imperial Spymaster';
      newHistory.push({ age: newAge, text: "The entire world's secrets are yours to command. You are the Imperial Spymaster." });
    }

    // Civil Path
    else if (updatedRole === 'Nomad' && newStats.strength >= 40) {
      updatedRole = 'Herder';
      newHistory.push({ age: newAge, text: "You manage the family herds. You are a Herder." });
    } else if (updatedRole === 'Herder' && totalAnimals >= 200) {
      updatedRole = 'Master Herder';
      newHistory.push({ age: newAge, text: "Your animals are legendary. You are a Master Herder." });
    } else if (updatedRole === 'Nomad' && newStats.horseRiding >= 60 && newStats.intelligence >= 60) {
      updatedRole = 'Clan Scout';
      newHistory.push({ age: newAge, text: "You find the best paths for the tribe. You are a Clan Scout." });
    } else if (updatedRole === 'Clan Scout' && newStats.leadership >= 50 && newAge >= 45) {
      updatedRole = 'Clan Elder';
      newHistory.push({ age: newAge, text: "The tribe seeks your wisdom. You are a Clan Elder." });
    } else if (updatedRole === 'Clan Elder' && newStats.intelligence >= 80) {
      updatedRole = 'Tribal Judge (Jarghuchi)';
      newHistory.push({ age: newAge, text: "You interpret the Yassa. You are a Jarghuchi." });
    }

    // Spiritual Path
    else if (updatedRole === 'Nomad' && Math.random() < 0.05 && newStats.intelligence >= 60) {
      updatedRole = 'Tengri-Seeker';
      newHistory.push({ age: newAge, text: "The spirits have called to you. You are a Tengri-Seeker." });
    } else if (updatedRole === 'Tengri-Seeker' && newStats.intelligence >= 70) {
      // Possible branch to Scribe
      if (Math.random() < 0.3 && character.socialClass !== SocialClass.WARRIOR) {
        updatedRole = 'Scribe';
        newHistory.push({ age: newAge, text: "You have learned the secrets of letters and record-keeping. You are a Scribe." });
      } else {
        updatedRole = 'Shaman';
        newHistory.push({ age: newAge, text: "You have traversed the spirit world. You are a Shaman." });
      }
    } else if (updatedRole === 'Scribe' && newStats.intelligence >= 80 && newStats.wealth >= 1000) {
      updatedRole = 'Imperial Librarian';
      newHistory.push({ age: newAge, text: "You guard the scrolls of the ancestors. You are an Imperial Librarian." });
    } else if (updatedRole === 'Imperial Librarian' && newStats.intelligence >= 90 && newStats.reputation >= 60) {
      updatedRole = 'Imperial Scholar';
      newHistory.push({ age: newAge, text: "The Great Khan values your translations and maps. You are an Imperial Scholar." });
    } else if (updatedRole === 'Imperial Scholar' && newStats.reputation >= 90 && newAge >= 50) {
      updatedRole = 'Grand Historian';
      newHistory.push({ age: newAge, text: "You write the story of the empire for eternity. You are the Grand Historian." });
    }
    
    // Engineering Path
    else if (updatedRole === 'Apprentice Blacksmith' && newStats.intelligence >= 65 && newStats.strength >= 60) {
      updatedRole = 'Apprentice Builder';
      newHistory.push({ age: newAge, text: "You have moved from forges to foundations. You are an Apprentice Builder." });
    } else if (updatedRole === 'Apprentice Builder' && newStats.intelligence >= 75) {
      updatedRole = 'Siege Engineer';
      newHistory.push({ age: newAge, text: "You build the machines that break cities. You are a Siege Engineer." });
    } else if (updatedRole === 'Siege Engineer' && newStats.intelligence >= 85 && newStats.reputation >= 50) {
      updatedRole = 'Master Architect';
      newHistory.push({ age: newAge, text: "Your designs define the new cities of the steppe. You are a Master Architect." });
    } else if (updatedRole === 'Master Architect' && newStats.intelligence >= 95 && character.conqueredTribes.length >= 3) {
      updatedRole = 'Imperial Engineer';
      newHistory.push({ age: newAge, text: "None can stand against your towers. You are the Imperial Engineer." });
    }

    // Administration Path
    else if (updatedRole === 'Scribe' && newStats.intelligence >= 70 && newStats.wealth >= 500) {
      updatedRole = 'Tax Collector';
      newHistory.push({ age: newAge, text: "You count the wealth of the tribes. You are a Tax Collector." });
    } else if (updatedRole === 'Tax Collector' && newStats.reputation >= 60 && newStats.intelligence >= 80) {
      updatedRole = 'District Overseer (Darughachi)';
      newHistory.push({ age: newAge, text: "You govern a conquered province. You are a Darughachi." });
    } else if (updatedRole === 'District Overseer (Darughachi)' && newStats.leadership >= 90 && character.conqueredTribes.length >= 6) {
      updatedRole = 'Imperial Chancellor';
      newHistory.push({ age: newAge, text: "The administration of the entire empire is in your hands. You are the Imperial Chancellor." });
    }

    // Maritime Path
    else if (updatedRole === 'Nomad' && Math.random() < 0.05 && newStats.strength >= 50) {
      updatedRole = 'River Boatman';
      newHistory.push({ age: newAge, text: "You have left the horses for the river. You are a River Boatman." });
    } else if (updatedRole === 'River Boatman' && newStats.horseRiding >= 50 && newStats.intelligence >= 60) {
      updatedRole = 'Coastal Scout';
      newHistory.push({ age: newAge, text: "You explore the shores where the steppe meets the sea. You are a Coastal Scout." });
    } else if (updatedRole === 'Coastal Scout' && newStats.leadership >= 70 && character.conqueredTribes.length >= 1) {
      updatedRole = 'Fleet Commander';
      newHistory.push({ age: newAge, text: "The Great Khan's ships are yours to lead. You are a Fleet Commander." });
    } else if (updatedRole === 'Fleet Commander' && newStats.reputation >= 90 && character.conqueredTribes.length >= 4) {
      updatedRole = 'Admiral';
      newHistory.push({ age: newAge, text: "The oceans are now parte of the blue sky. You are an Admiral." });
    }

    // Artisan Path
    else if (updatedRole === 'Apprentice Blacksmith' && newStats.appearance >= 60 && newStats.intelligence >= 60) {
      updatedRole = 'Apprentice Jeweler';
      newHistory.push({ age: newAge, text: "Your hands find beauty in the small details. You are an Apprentice Jeweler." });
    } else if (updatedRole === 'Apprentice Jeweler' && newStats.intelligence >= 75) {
      updatedRole = 'Jade Carver';
      newHistory.push({ age: newAge, text: "You master the sacred stone. You are a Jade Carver." });
    } else if (updatedRole === 'Jade Carver' && newStats.wealth >= 5000 && newStats.reputation >= 60) {
      updatedRole = 'Master Artisan';
      newHistory.push({ age: newAge, text: "Only the finest materials pass through your fingers. You are a Master Artisan." });
    } else if (updatedRole === 'Master Artisan' && newStats.intelligence >= 90 && newStats.wealth >= 20000) {
      updatedRole = 'Keeper of the Treasury';
      newHistory.push({ age: newAge, text: "The empire's gold is counted by your hand. You are Keeper of the Treasury." });
    }

    // Falconry Path
    else if (updatedRole === 'Hunter' && newStats.horseRiding >= 70 && newStats.archery >= 60) {
      updatedRole = 'Bird-Catcher';
      newHistory.push({ age: newAge, text: "You have moved from hunting deer to taming the sky. You are a Bird-Catcher." });
    } else if (updatedRole === 'Bird-Catcher' && newStats.archery >= 80) {
      updatedRole = 'Falconer';
      newHistory.push({ age: newAge, text: "The golden eagle answers your whistle. You are a Falconer." });
    } else if (updatedRole === 'Falconer' && newStats.reputation >= 70 && newStats.leadership >= 50) {
      updatedRole = 'Master of the Hunt';
      newHistory.push({ age: newAge, text: "You orchestrate the great imperial drives. You are Master of the Hunt." });
    } else if (updatedRole === 'Master of the Hunt' && newStats.reputation >= 90 && character.conqueredTribes.length >= 2) {
      updatedRole = 'Imperial Falconer';
      newHistory.push({ age: newAge, text: "You carry the Khagan's own eagle. You are the Imperial Falconer." });
    }

    // Equerry Path
    else if (updatedRole === 'Herder' && newStats.horseRiding >= 65 && newStats.strength >= 55) {
      updatedRole = 'Apprentice Groom';
      newHistory.push({ age: newAge, text: "You have shown a natural bond with the stallions. You are an Apprentice Groom." });
    } else if (updatedRole === 'Apprentice Groom' && newStats.horseRiding >= 75) {
      updatedRole = 'Horse Breaker';
      newHistory.push({ age: newAge, text: "No wild spirit can throw you. You are a Horse Breaker." });
    } else if (updatedRole === 'Horse Breaker' && newStats.horseRiding >= 85 && newStats.leadership >= 60) {
      updatedRole = 'Stable Master';
      newHistory.push({ age: newAge, text: "The finest mounts of the clan are under your care. You are a Stable Master." });
    } else if (updatedRole === 'Stable Master' && newStats.reputation >= 90 && character.conqueredTribes.length >= 1) {
      updatedRole = 'Sa\'is (Imperial Equerry)';
      newHistory.push({ age: newAge, text: "You manage the sacred herds of the Khan. You are a Sa'is, the Imperial Equerry." });
    }
    
    else if (updatedRole === 'Shaman' && newStats.reputation >= 60) {
      updatedRole = 'Tribal Healer';
      newHistory.push({ age: newAge, text: "Your remedies save lives. You are a Tribal Healer." });
    } else if (updatedRole === 'Tribal Healer' && newStats.intelligence >= 90) {
      updatedRole = 'Sage';
      newHistory.push({ age: newAge, text: "All seek your ancient knowledge. You are a Sage." });
    } else if (updatedRole === 'Sage' && newStats.reputation >= 90) {
      updatedRole = 'High Shaman';
      newHistory.push({ age: newAge, text: "You represent the heavens on earth. You are a High Shaman." });
    } else if (updatedRole === 'High Shaman' && character.conqueredTribes.length >= 5) {
       updatedRole = 'Oracle of the Eternal Sky';
       newHistory.push({ age: newAge, text: "You see the future of the empire. You are the Oracle." });
    }
  }

  // Check for death
  let isAlive = character.isAlive;
  let deathCause = character.deathCause;
  const healthDeathChance = newStats.health <= 0 ? 1 : 0;
  const naturalDeathChance = newAge < 5 ? 0.05 : (newAge > 60 ? (newAge - 60) * 0.03 : 0.01);
  
  if (healthDeathChance === 1 || Math.random() < naturalDeathChance) {
    isAlive = false;
    
    if (newStats.health <= 0) {
      deathCause = "Severely poor health and physical exhaustion";
    } else if (newAge < 5) {
      const childhoodCauses = ["Childhood fever", "Accident in the camp", "Weak constitution from birth"];
      deathCause = childhoodCauses[Math.floor(Math.random() * childhoodCauses.length)];
    } else if (newAge > 60) {
      const oldAgeCauses = ["Passed peacefully in sleep", "A lingering winter chill", "A tired heart finally found rest", "Natural causes after a long life"];
      deathCause = oldAgeCauses[Math.floor(Math.random() * oldAgeCauses.length)];
    } else {
      const accidentCauses = ["A fall from a spirited stallion", "A sudden infection from an old wound", "A brief but fierce illness", "Poisoning by a rival (rumored)"];
      deathCause = accidentCauses[Math.floor(Math.random() * accidentCauses.length)];
    }
    
    newHistory.push({ age: newAge, text: `Departed to the eternal blue sky at the age of ${newAge}. Cause: ${deathCause}.` });
  } else {
    newHistory.push({ age: newAge, text: `Completed another cycle around the sun. Age: ${newAge}.` });
  }

  // Generate colleague relationships on job switch/promotion!
  if (updatedRole !== character.role && updatedRole !== 'Child' && isAlive) {
    const colleagueCount = Math.random() < 0.6 ? 1 : 2;
    for (let c = 0; c < colleagueCount; c++) {
      const colleague = generateWorkplaceColleague(updatedRole, newAge);
      newRelationships.push(colleague);
      newHistory.push({ age: newAge, text: `Met ${colleague.name} ${colleague.clan}, who became your ${colleague.type} in your new role of ${updatedRole}.` });
    }
  }

  let updatedCampaign = character.activeCampaign ? { ...character.activeCampaign } : undefined;
  if (updatedCampaign) {
    if (!updatedCampaign.resolvedForThisYear) {
      const progressLoss = 5 + Math.floor(Math.random() * 10);
      updatedCampaign.playerProgress = Math.max(0, updatedCampaign.playerProgress - progressLoss);
      updatedCampaign.combatLog = [...updatedCampaign.combatLog, `Жил солигдлоо: Та энэ жилийн стратегиа сонгож тулалдаагүй тул дайн сунжирч, давуу тал буурлаа (-${progressLoss}% Ахиц).`].slice(-10);
    }
    updatedCampaign.year += 1;
    updatedCampaign.resolvedForThisYear = false;
    updatedCampaign.currentStrategy = undefined;
  }

  const updatedChar: Character = {
    ...character,
    age: newAge,
    stats: newStats,
    role: updatedRole,
    clanWealth: newClanWealth,
    livestock: newLivestock,
    droughtYears: droughtYearsLeft,
    lastPromotionAge: updatedRole !== character.role ? newAge : character.lastPromotionAge,
    activeCampaign: updatedCampaign,
    relationships: newRelationships,
    marketCondition: newMarketCondition,
    marketTrends: newMarketTrends,
    availableMarketItems: refreshMarketItems(newMarketCondition, newMarketTrends),
    isAlive,
    deathCause,
    history: newHistory,
    avatarUrl: getNomadAvatar(character.name.split(' ')[0], character.gender, character.clan, newAge, character.appearanceOptions, character.socialClass),
    heirId: newlyDeceasedHeirId ? undefined : character.heirId,
    designatedHeir: newlyDeceasedHeirId ? undefined : character.designatedHeir,
    militaryPower: 0, // Placeholder, will update below
    hordeSize: 0, // Placeholder, will update below
    taxReport: currentTaxReport,
  };

  const milData = calculateMilitaryPower(updatedChar);
  updatedChar.militaryPower = milData.power;
  updatedChar.hordeSize = milData.soldiers;

  const newTitle = calculateTitle(updatedChar);
  if (newTitle && newTitle !== character.title) {
    updatedChar.title = newTitle;
    newHistory.push({ age: newAge, text: `You are now known as ${character.name.split(' ')[0]} ${newTitle}.` });
  }

  return updatedChar;
}

export function generateWorkplaceColleague(roleName: string, playerAge: number): Relationship {
  const isMale = Math.random() > 0.4;
  const gender = isMale ? Gender.MALE : Gender.FEMALE;
  const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
  const name = names[Math.floor(Math.random() * names.length)];
  const clan = MONGOL_SURNAMES[Math.floor(Math.random() * MONGOL_SURNAMES.length)];
  
  let type = "Work Colleague";
  if (roleName.includes("Apprentice") || roleName.includes("Aspirant") || roleName.includes("Recruit")) {
    const roll = Math.random();
    if (roll < 0.3) {
      type = "Guild Mentor";
    } else if (roll < 0.6) {
      type = "Apprentice Partner";
    } else {
      type = "Work Colleague";
    }
  } else if (roleName.includes("General") || roleName.includes("Warlord") || roleName.includes("Commander") || roleName.includes("Prince") || roleName.includes("Chancellor") || roleName.includes("High Shaman")) {
    const roll = Math.random();
    if (roll < 0.4) {
      type = "Noble Rival";
    } else if (roll < 0.8) {
      type = "Subordinate Officer";
    } else {
      type = "Council Peer";
    }
  } else {
    const roll = Math.random();
    if (roll < 0.25) {
      type = "Work Rival";
    } else if (roll < 0.5) {
      type = "Vocation Partner";
    } else {
      type = "Work Colleague";
    }
  }

  const workTraits = ["Industrious", "Diligent", "Ambitious", "Loyal", "Envious", "Wise", "Stubborn", "Learned", "Greedy", "Cunning"];
  const traitsList: string[] = [];
  const traitCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < traitCount; i++) {
    const trait = workTraits[Math.floor(Math.random() * workTraits.length)];
    if (!traitsList.includes(trait)) {
      traitsList.push(trait);
    }
  }

  const age = Math.max(15, playerAge + Math.floor(Math.random() * 21) - 8);

  return {
    id: generateId(),
    name,
    type,
    loyalty: 40 + Math.floor(Math.random() * 41),
    status: "Active",
    clan,
    traits: traitsList,
    appearance: generateAppearance(),
    avatarUrl: getNomadAvatar(name, gender, clan, age, undefined, SocialClass.NOMAD),
    age,
    gender
  };
}
