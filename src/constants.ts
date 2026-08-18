/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SocialClass, CharacterStats } from './types';

export const INITIAL_STATS: Record<SocialClass, CharacterStats> = {
  [SocialClass.NOMAD]: {
    health: 80,
    happiness: 80,
    appearance: 50,
    strength: 40,
    intelligence: 30,
    perception: 60,
    leadership: 10,
    loyalty: 50,
    reputation: 5,
    realmReputation: 0,
    horseRiding: 20,
    archery: 15,
    wealth: 10,
  },
  [SocialClass.NOBLE]: {
    health: 70,
    happiness: 80,
    appearance: 50,
    strength: 30,
    intelligence: 60,
    perception: 50,
    leadership: 70,
    loyalty: 40,
    reputation: 80,
    realmReputation: 40,
    horseRiding: 50,
    archery: 40,
    wealth: 500,
  },
  [SocialClass.MERCHANT]: {
    health: 75,
    happiness: 80,
    appearance: 50,
    strength: 25,
    intelligence: 70,
    perception: 75,
    leadership: 40,
    loyalty: 60,
    reputation: 50,
    realmReputation: 25,
    horseRiding: 30,
    archery: 10,
    wealth: 1000,
  },
  [SocialClass.WARRIOR]: {
    health: 90,
    happiness: 80,
    appearance: 50,
    strength: 70,
    intelligence: 40,
    perception: 55,
    leadership: 50,
    loyalty: 90,
    reputation: 40,
    realmReputation: 15,
    horseRiding: 60,
    archery: 70,
    wealth: 50,
  },
  [SocialClass.BLACKSMITH]: {
    health: 85,
    happiness: 80,
    appearance: 50,
    strength: 80,
    intelligence: 50,
    perception: 45,
    leadership: 20,
    loyalty: 70,
    reputation: 30,
    realmReputation: 10,
    horseRiding: 20,
    archery: 10,
    wealth: 100,
  },
};

export const MONGOL_SURNAMES = [
  'Borgijin', 'Jalayir', 'Tayichiud', 'Kereid', 'Naiman', 'Merkid', 'Tatar', 'Ongud'
];

export const MONGOL_NAMES_MALE = [
  'Temujin', 'Jochi', 'Chagatai', 'Ogedei', 'Tolui', 'Subutai', 'Jebe', 'Muqali', 'Batu', 'Hulagu', 'Kublai', 'Berke'
];

export const MONGOL_NAMES_FEMALE = [
  'Borte', 'Hoelun', 'Yesugen', 'Yesui', 'Khutulun', 'Sorkhotani', 'Oghul', 'Chabi', 'Mandukhai'
];

export const TRIBES = [
  'Khamag Mongol', 'Kereid', 'Naiman', 'Merkid', 'Tatar', 'Tayichiud',
  'Jalayir', 'Ongud', 'Oirats', 'Khongirad', 'Buryats', 'Uriankhai'
];

export const STARTING_TRAITS = [
  { id: 'brawny', name: 'Brawny', description: 'Born with unusual physical strength.', effect: { strength: 15 } },
  { id: 'wise', name: 'Wise', description: 'A sharp mind from an early age.', effect: { intelligence: 15 } },
  { id: 'eagle_eye', name: 'Eagle Eye', description: 'Superior vision and awareness.', effect: { perception: 15 } },
  { id: 'charming', name: 'Charming', description: 'People are naturally drawn to you.', effect: { appearance: 15 } },
  { id: 'fearless', name: 'Fearless', description: 'Unwavering courage in battle.', effect: { leadership: 10, reputation: 5 } },
  { id: 'destined', name: 'Destined', description: 'The spirits of the ancestors watch over you.', effect: { health: 10, happiness: 10 } },
];

export const APPEARANCE_HAIR_COLORS = ['Black', 'Dark Brown', 'Chestnut', 'Gray'];
export const APPEARANCE_EYE_COLORS = ['Dark Brown', 'Black', 'Amber', 'Hazel'];

export const KINGDOMS = [
  'Jin Dynasty', 'Western Xia', 'Kara-Khitan', 'Khwarazmian Empire', 'Sultanate of Delhi'
];

export const ROLE_SALARIES: Record<string, number> = {
  'Infant': 0,
  'Child': 0,
  'War-Ready Youth': 40,
  'Outlaw': 20,
  
  // Military Path
  'Horseback Recruit': 60,
  'Warrior': 100,
  'Vanguard': 180,
  'Squad Leader (Arban)': 250,
  'Centurion (Zuun)': 400,
  'Commander of Thousand (Mingghan)': 600,
  'General': 900,
  'Warlord': 1200,
  'Marshal of the Empire': 2500,
  
  // Elite/Guard Path
  'Kheshig Aspirant': 300,
  'Imperial Guard (Kheshig)': 550,
  'Noyan (Noble Commander)': 1000,
  'Khagan\'s Advisor': 1800,
  'Great Khan': 5000,

  // Civil & Nomad Path
  'Nomad': 50,
  'Herder': 70,
  'Master Herder': 130,
  'Clan Scout': 110,
  'Hunter': 80,
  'Master Hunter': 200,
  'Clan Elder': 350,
  'Tribal Judge (Jarghuchi)': 700,
  'Vizier': 1500,

  // Trade & Craft Path
  'Apprentice Blacksmith': 120,
  'Journeyman Smith': 220,
  'Master Smith': 450,
  'Royal Armorer': 900,
  'Apprentice Bowyer': 130,
  'Bowyer': 280,
  'Master Bowyer': 500,
  'Master of the Arsenal': 1100,
  'Apprentice Trader': 220,
  'Caravan Guard': 180,
  'Merchant': 450,
  'Caravan Master': 750,
  'Guild Master': 1300,
  'Merchant Prince': 2500,

  // Scholar & Scribe Path
  'Scribe': 180,
  'Imperial Librarian': 350,
  'Imperial Scholar': 750,
  'Grand Historian': 1600,

  // Engineering & Siege Path
  'Apprentice Builder': 140,
  'Siege Engineer': 320,
  'Master Architect': 650,
  'Imperial Engineer': 1500,

  // Administration & Law Path
  'Tax Collector': 280,
  'District Overseer (Darughachi)': 700,
  'Imperial Chancellor': 2200,

  // Maritime & River Path
  'River Boatman': 110,
  'Coastal Scout': 240,
  'Fleet Commander': 600,
  'Admiral': 1800,

  // Artisan & Treasury Path
  'Apprentice Jeweler': 160,
  'Jade Carver': 380,
  'Master Artisan': 800,
  'Keeper of the Treasury': 2400,

  // Hunting & Falconry Path
  'Bird-Catcher': 90,
  'Falconer': 220,
  'Master of the Hunt': 550,
  'Imperial Falconer': 1300,

  // Equerry & Horse Path
  'Apprentice Groom': 100,
  'Horse Breaker': 250,
  'Stable Master': 500,
  'Sa\'is (Imperial Equerry)': 1400,

  // Spy & Intrigue Path
  'Steppe Spy': 150,
  'Information Broker': 350,
  'Master of Whispers': 800,
  'Imperial Spymaster': 2200,

  // Diplomacy Path
  'Envoy': 200,
  'Imperial Emissary': 500,
  'Ambassador': 850,
  'Chief Negotiator': 1400,
  'Grand Vizier': 2800,

  // Spiritual Path
  'Tengri-Seeker': 150,
  'Shaman': 250,
  'Tribal Healer': 300,
  'Sage': 650,
  'High Shaman': 1600,
  'Oracle of the Eternal Sky': 3000,
};

export const MARKET_ITEMS = [
  // Horses & Mounts
  { id: 'm_pony', name: 'Steppe Pony', type: 'Horse', category: 'Mounts & Animals', price: 100, quality: 30, desc: 'A basic but reliable companion for any nomad.' },
  { id: 'm_stallion', name: 'War Stallion', type: 'Horse', category: 'Mounts & Animals', price: 500, quality: 70, desc: 'Bred for the chaos of battle. Strong and brave.' },
  { id: 'm_white_horse', name: 'White Spirit Horse', type: 'Horse', category: 'Mounts & Animals', price: 2000, quality: 95, desc: 'A horse fit for a Khan. Said to be blessed by Tengri.' },
  { id: 'm_camel_ride', name: 'Desert Camel', type: 'Horse', category: 'Mounts & Animals', price: 600, quality: 65, desc: 'Ideal for long journeys across the Gobi desert.' },
  
  // Weapons
  { id: 'm_bow_simple', name: 'Hunting Bow', type: 'Weapon', category: 'Combat Gear', price: 50, quality: 40, desc: 'A standard bow for hunting marmots and small game.' },
  { id: 'm_bow_composite', name: 'Composite Recurve Bow', type: 'Weapon', category: 'Combat Gear', price: 400, quality: 85, desc: 'The pride of the steppe. Laminated horn, wood, and sinew.' },
  { id: 'm_scimitar', name: 'Curved Scimitar', type: 'Weapon', category: 'Combat Gear', price: 250, quality: 70, desc: 'A sharp, curved blade perfect for slashing from horseback.' },
  { id: 'm_obsidian_blade', name: 'Obsidian Ritual Blade', type: 'Weapon', category: 'Combat Gear', price: 1200, quality: 90, desc: 'A volcanic glass dagger that never loses its edge. Said to hold spirit power.' },
  { id: 'm_mace', name: 'Heavy Iron Mace', type: 'Weapon', category: 'Combat Gear', price: 300, quality: 75, desc: 'Designed to crush even the strongest enemy armor.' },
  { id: 'm_lance', name: 'Tipped Lance', type: 'Weapon', category: 'Combat Gear', price: 150, quality: 60, desc: 'Essential for the first charge of the heavy cavalry.' },

  // Armor
  { id: 'm_felt_armor', name: 'Reinforced Felt Armor', type: 'Armor', category: 'Combat Gear', price: 120, quality: 45, desc: 'Layers of hardened wool that offer decent protection.' },
  { id: 'm_lamellar', name: 'Steel Lamellar Armor', type: 'Armor', category: 'Combat Gear', price: 800, quality: 80, desc: 'Hundreds of small steel plates laced together. Very durable.' },
  { id: 'm_silk_under', name: 'Silk Under-Armor', type: 'Armor', category: 'Combat Gear', price: 400, quality: 60, desc: 'Drawn into wounds by arrowheads, making them easier to extract.' },
  { id: 'm_helmet', name: 'Iron Spiked Helmet', type: 'Armor', category: 'Combat Gear', price: 200, quality: 70, desc: 'A sturdy helmet with a protective neck guard.' },

  // Property
  { id: 'm_basic_yurt', name: 'Small Ger', type: 'Yurt', category: 'Estate & Home', price: 300, quality: 40, desc: 'A modest felt tent for a starting family.' },
  { id: 'm_deluxe_yurt', name: 'Spacious Ger', type: 'Yurt', category: 'Estate & Home', price: 1000, quality: 75, desc: 'Well-insulated with fine carvings. A sign of prosperity.' },
  { id: 'm_iron_stove', name: 'Cast Iron Stove', type: 'Commodity', category: 'Estate & Home', price: 500, quality: 75, desc: 'A heavy luxury for any yurt. Retains heat long into the frozen night.' },
  { id: 'm_palace_yurt', name: 'Golden Horde Ordu', type: 'Yurt', category: 'Estate & Home', price: 5000, quality: 100, desc: 'A massive palace-yurt. The pinnacle of steppe living.' },
  
  // Luxury & Consumer Goods
  { id: 'm_silk_bolts', name: 'Raw Silk Bolts', type: 'Commodity', category: 'Trade Goods', price: 600, quality: 80, desc: 'Rich fabric from the southern empires. Desired by nobles.' },
  { id: 'm_silk_gold', name: 'Gold-Threaded Silk', type: 'Luxury', category: 'Rare Luxuries', price: 1500, quality: 95, desc: 'Impossible to find on the open plain. Worth a fortune in the West.' },
  { id: 'm_chinese_gown', name: 'Dragon Embroidered Gown', type: 'Luxury', category: 'Rare Luxuries', price: 2500, quality: 98, desc: 'A symbols of imperial favor from the Middle Kingdom.' },
  { id: 'm_persian_map', name: 'Al-Khwarizmi Map', type: 'Luxury', category: 'Rare Luxuries', price: 1800, quality: 92, desc: 'A complex map of the world that broadens your horizons.' },
  { id: 'm_ceramics_blue', name: 'Blue-White Porcelain', type: 'Commodity', category: 'Trade Goods', price: 450, quality: 85, desc: 'Delicate vessels from the Ming treasures. Fragile but highly prized.' },
  { id: 'm_ceramics_earthen', name: 'Glazed Earthenware', type: 'Commodity', category: 'Trade Goods', price: 200, quality: 60, desc: 'Practical and beautiful pottery for high-status households.' },
  { id: 'm_spices_pepper', name: 'Black Pepper Bags', type: 'Commodity', category: 'Trade Goods', price: 300, quality: 70, desc: 'Cinnamon and pepper from distant lands. Worth their weight in gold.' },
  { id: 'm_spices_saffron', name: 'Persian Saffron', type: 'Luxury', category: 'Rare Luxuries', price: 2000, quality: 100, desc: 'The most expensive spice known to man. A tiny jar is worth a herd.' },
  { id: 'm_fine_wine', name: 'Persian Wine', type: 'Commodity', category: 'Trade Goods', price: 150, quality: 60, desc: 'A rare fermented drink. Increases prestige when gifted.' },
  { id: 'm_silver_mirror', name: 'Tangled Silver Mirror', type: 'Luxury', category: 'Rare Luxuries', price: 950, quality: 85, desc: 'A polished silver disk that reflects the soul. A rarity from the West.' },
  { id: 'm_tea_blocks', name: 'Pressed Tea Blocks', type: 'Commodity', category: 'Trade Goods', price: 100, quality: 50, desc: 'Often used as currency in remote outposts.' },
  { id: 'm_ivory_chess', name: 'Walrus Ivory Chess Set', type: 'Luxury', category: 'Rare Luxuries', price: 1600, quality: 92, desc: 'Hand-carved pieces depicting an eternal war. Improves tactical mind.' },
  { id: 'm_gold_jewelry', name: 'Gold Filigree Belt', type: 'Luxury', category: 'Rare Luxuries', price: 1200, quality: 90, desc: 'Exquisite craftsmanship that screams status and wealth.' },
  { id: 'm_teaset', name: 'Porcelain Tea Set', type: 'Luxury', category: 'Rare Luxuries', price: 800, quality: 85, desc: 'Fragile and beautiful. A mark of a truly refined home.' },
  { id: 'm_carpets', name: 'Bukhara Carpet', type: 'Luxury', category: 'Rare Luxuries', price: 900, quality: 80, desc: 'Intricate patterns that tell stories of far-off desert cities.' },
  
  // New Trade Goods & Supplies
  { id: 'm_iron_ore', name: 'Iron Ore Sacks', type: 'Commodity', category: 'Trade Goods', price: 120, quality: 50, desc: 'Raw ore for the clan smiths. Essential for war effort.' },
  { id: 'm_coal', name: 'Charcoal Bundles', type: 'Commodity', category: 'Trade Goods', price: 80, quality: 40, desc: 'Fuel for the fire. Necessary for survival in winter.' },
  { id: 'm_salt', name: 'Block Salt', type: 'Commodity', category: 'Trade Goods', price: 150, quality: 70, desc: 'A vital preservative for meat and a sign of civilization.' },
  { id: 'm_incense', name: 'Religious Incense', type: 'Commodity', category: 'Trade Goods', price: 200, quality: 60, desc: 'Sweet-smelling herbs used in shamanistic rituals.' },
  { id: 'm_parchment', name: 'Fine Parchment', type: 'Commodity', category: 'Trade Goods', price: 250, quality: 80, desc: 'Used by scribes to record history and taxes.' },
  { id: 'm_emerald', name: 'Raw Emeralds', type: 'Luxury', category: 'Rare Luxuries', price: 3500, quality: 95, desc: 'Uncut gems found in the mountains. A massive store of value.' },
  { id: 'm_statue', name: 'Gilded Buddha', type: 'Luxury', category: 'Rare Luxuries', price: 4200, quality: 90, desc: 'A rare religious icon from the southern kingdoms. Highly exotic.' },
  { id: 'm_rhino_horn', name: 'Rhinoceros Horn', type: 'Luxury', category: 'Rare Luxuries', price: 2800, quality: 85, desc: 'Said to possess powerful healing properties. Worth more than its weight in gold.' },

  // Vision & Scouting Items
  { id: 'm_eagle', name: 'Golden Eagle', type: 'Bird', category: 'Mounts & Animals', price: 800, quality: 85, desc: 'A majestic hunters bird. Greatly increases your vision on the map.' },
  { id: 'm_falcon', name: 'Hunting Falcon', type: 'Bird', category: 'Mounts & Animals', price: 300, quality: 60, desc: 'A swift predator that aids in scouting nearby tribes.' },
  { id: 'm_spyglass', name: 'Western Spyglass', type: 'Luxury', category: 'Rare Luxuries', price: 1500, quality: 90, desc: 'A rare tube with glass that brings the horizon close.' },
];

export interface MarketMultiplierSet {
  sell: number;
  buy: number;
  livestock?: number;
  gear?: number;
  commodity?: number;
  luxury?: number;
}

export const MARKET_MULTIPLIERS: Record<string, MarketMultiplierSet> = {
  'Economic Boom': { sell: 1.5, buy: 1.2, livestock: 1.3, luxury: 1.6, commodity: 1.4 },
  'Stable': { sell: 1.0, buy: 1.0, livestock: 1.0 },
  'Recession': { sell: 0.7, buy: 0.8, livestock: 0.6, luxury: 0.5, commodity: 0.6 },
  'Livestock Famine': { sell: 0.5, buy: 2.0, livestock: 3.0 },
  'War Preparations': { sell: 1.2, buy: 1.5, gear: 2.0, commodity: 1.8 },
  'Gold Rush': { sell: 1.3, buy: 1.6, luxury: 2.5, commodity: 1.4 },
  'Silk Road Blockade': { sell: 0.8, buy: 2.5, luxury: 1.8, commodity: 3.2 }
};

export const LIVESTOCK_PRICES = {
  horses: { buy: 150, sell: 120 },
  sheep: { buy: 20, sell: 15 },
  cattle: { buy: 60, sell: 45 },
  goats: { buy: 15, sell: 12 },
  yaks: { buy: 80, sell: 65 },
  camels: { buy: 250, sell: 200 }
};

export interface CareerRole {
  name: string;
  salary: number;
  reqs: string;
}

export interface CareerAction {
  name: string;
  cost: number;
  desc: string;
  successMsg: string;
  effects: Record<string, number>;
}

export interface CareerBranch {
  id: string;
  name: string;
  icon: string;
  entryRole: string;
  description: string;
  roles: CareerRole[];
  action: CareerAction;
}

export const CAREER_BRANCHES: CareerBranch[] = [
  {
    id: 'Military',
    name: '🗡️ Military Command',
    icon: 'Sword',
    entryRole: 'Horseback Recruit',
    description: 'Lead fast horse archers and deploy massive tactical heavy cavalry units across the Gobi and beyond.',
    roles: [
      { name: 'Horseback Recruit', salary: 60, reqs: 'Age 15+' },
      { name: 'Warrior', salary: 100, reqs: 'Strength 45+, Archery 40+' },
      { name: 'Vanguard', salary: 180, reqs: 'Strength 60+, Archery 60+' },
      { name: 'Squad Leader (Arban)', salary: 250, reqs: 'Leadership 40+' },
      { name: 'Centurion (Zuun)', salary: 400, reqs: 'Leadership 60+, Reputation 50+' },
      { name: 'Commander of Thousand (Mingghan)', salary: 600, reqs: 'Leadership 80+, Reputation 80+' },
      { name: 'General', salary: 900, reqs: 'Leadership 90+, Conquer 1 Tribe' },
      { name: 'Warlord', salary: 1200, reqs: 'Conquer 3 Tribes' },
      { name: 'Marshal of the Empire', salary: 2500, reqs: 'Conquer 5 Tribes, Leadership 95+' }
    ],
    action: {
      name: '🏹 Cavalry Archery Maneuver',
      cost: 15,
      desc: 'Form up the squadrons and execute circular high-speed drills.',
      successMsg: 'You lead your cohorts in continuous circular archery drills. Bowstrings twang in unison, boosting tactical readiness.',
      effects: { archery: 3, strength: 2, reputation: 1 }
    }
  },
  {
    id: 'Kheshig',
    name: '⚜️ Imperial Guard',
    icon: 'Shield',
    entryRole: 'Kheshig Aspirant',
    description: 'The Emperor\'s elite bodyguard and noble inner circle administrators.',
    roles: [
      { name: 'Kheshig Aspirant', salary: 300, reqs: 'Age 15+, Leadership 40+' },
      { name: 'Imperial Guard (Kheshig)', salary: 550, reqs: 'Leadership 65+, Strength 60+' },
      { name: 'Noyan (Noble Commander)', salary: 1000, reqs: 'Leadership 80+, Reputation 70+' },
      { name: 'Khagan\'s Advisor', salary: 1800, reqs: 'Intelligence 85+, Leadership 85+' },
      { name: 'Great Khan', salary: 5000, reqs: 'Conquer 6 Tribes, Leadership 95+' }
    ],
    action: {
      name: '🛡️ Stand Imperial Sentry',
      cost: 20,
      desc: 'Guard the central palace-ger and counsel senior chiefs.',
      successMsg: 'With a glistening saber in hand, you stood guard over the sacred threshold, eavesdropping on major military debates.',
      effects: { leadership: 2, perception: 2, reputation: 2 }
    }
  },
  {
    id: 'Nomad',
    name: '🐑 Civil & Herding',
    icon: 'Utensils',
    entryRole: 'Nomad',
    description: 'Secure the pastures, gather supplies, and guide the traditional nomadic lifestyle.',
    roles: [
      { name: 'Nomad', salary: 50, reqs: 'Age 15+' },
      { name: 'Herder', salary: 70, reqs: 'Strength 40+ or Riding 50+' },
      { name: 'Master Herder', salary: 130, reqs: 'Strength 60+, Riding 70+' },
      { name: 'Clan Scout', salary: 110, reqs: 'Riding 65+, Perception 50+' },
      { name: 'Hunter', salary: 80, reqs: 'Archery 50+, Perception 50+' },
      { name: 'Master Hunter', salary: 200, reqs: 'Archery 75+, Perception 70+' },
      { name: 'Clan Elder', salary: 350, reqs: 'Intelligence 60+, Reputation 55+' },
      { name: 'Tribal Judge (Jarghuchi)', salary: 700, reqs: 'Intelligence 80+, Reputation 75+' },
      { name: 'Vizier', salary: 1500, reqs: 'Intelligence 90+, Leadership 80+' }
    ],
    action: {
      name: '🐎 Drive Herds to New Grazing',
      cost: 10,
      desc: 'Scout fresh lush pastures and guide the animals over meadows.',
      successMsg: 'Your migration avoids deep river marshes and local wolf zones. The livestock is fat and secure.',
      effects: { horseRiding: 3, perception: 2 }
    }
  },
  {
    id: 'Crafts',
    name: '⚒️ Blacksmithing & Bowyers',
    icon: 'Briefcase',
    entryRole: 'Apprentice Blacksmith',
    description: 'Forge flexible steel sabers and construct the fabled layered horn bows.',
    roles: [
      { name: 'Apprentice Blacksmith', salary: 120, reqs: 'Age 15+' },
      { name: 'Journeyman Smith', salary: 220, reqs: 'Strength 50+, Intelligence 40+' },
      { name: 'Master Smith', salary: 450, reqs: 'Strength 70+, Intelligence 60+' },
      { name: 'Royal Armorer', salary: 900, reqs: 'Strength 80+, Reputation 80+' },
      { name: 'Apprentice Bowyer', salary: 130, reqs: 'Intelligence 45+, Perception 45+' },
      { name: 'Bowyer', salary: 280, reqs: 'Intelligence 60+, Archery 60+' },
      { name: 'Master Bowyer', salary: 500, reqs: 'Intelligence 80+, Archery 80+' },
      { name: 'Master of the Arsenal', salary: 1100, reqs: 'Intelligence 85+, Conquer 1 Tribe' }
    ],
    action: {
      name: '⚒️ Forge Steel & Splice Horns',
      cost: 25,
      desc: 'Heat the charcoal furnace and splice composite layers to craft heavy gear.',
      successMsg: 'The bellows whined and hot iron sparks filled your workshop. You successfully designed superior battle spears.',
      effects: { strength: 2, intelligence: 2, reputation: 1 }
    }
  },
  {
    id: 'Trade',
    name: '🐪 Silk Road Commerce',
    icon: 'Coins',
    entryRole: 'Apprentice Trader',
    description: 'Journey across treacherous caravan routes to accumulate immense merchant wealth.',
    roles: [
      { name: 'Apprentice Trader', salary: 220, reqs: 'Age 15+' },
      { name: 'Caravan Guard', salary: 180, reqs: 'Strength 45+, Archery 40+' },
      { name: 'Merchant', salary: 450, reqs: 'Intelligence 65+, Wealth 500г' },
      { name: 'Caravan Master', salary: 750, reqs: 'Wealth 2000г, Intelligence 75+' },
      { name: 'Guild Master', salary: 1300, reqs: 'Wealth 10000г, Leadership 50+' },
      { name: 'Merchant Prince', salary: 2500, reqs: 'Wealth 50000г, Reputation 80+' }
    ],
    action: {
      name: '🐫 Broker Regional Caravan Barter',
      cost: 30,
      desc: 'Open trade chests and convince local tribal agents to exchange furs for porcelain.',
      successMsg: 'You hosted several tea ceremonies and smoothly pocketed a substantial trade arbitrage margin!',
      effects: { intelligence: 2, perception: 2 }
    }
  },
  {
    id: 'Scholar',
    name: '📚 Scribes & Administration',
    icon: 'ScrollText',
    entryRole: 'Scribe',
    description: 'Document Imperial decrees, enforce laws, collect taxes, and direct the script.',
    roles: [
      { name: 'Scribe', salary: 180, reqs: 'Age 15+, Intelligence 50+' },
      { name: 'Imperial Librarian', salary: 350, reqs: 'Intelligence 80+, Wealth 1000г' },
      { name: 'Imperial Scholar', salary: 750, reqs: 'Intelligence 90+, Reputation 60+' },
      { name: 'Grand Historian', salary: 1600, reqs: 'Reputation 90+, Age 50+' },
      { name: 'Tax Collector', salary: 280, reqs: 'Intelligence 60+' },
      { name: 'District Overseer (Darughachi)', salary: 700, reqs: 'Intelligence 80+, Reputation 60+' },
      { name: 'Imperial Chancellor', salary: 2200, reqs: 'Leadership 90+, Conquer 6 Tribes' }
    ],
    action: {
      name: '✒️ Audit Ledger Scrolls',
      cost: 20,
      desc: 'Sift through tax rosters and imperial correspondence to organize tribal registry.',
      successMsg: 'By standardizing brush strokes and accounting errors, you secured stable administrative credit.',
      effects: { intelligence: 3, perception: 2 }
    }
  },
  {
    id: 'Espionage',
    name: '👥 Intelligence & Espionage',
    icon: 'Users',
    entryRole: 'Steppe Spy',
    description: 'Strike from the shadows, intercept enemy runner-messengers, and manage whispers.',
    roles: [
      { name: 'Steppe Spy', salary: 150, reqs: 'Age 15+' },
      { name: 'Information Broker', salary: 350, reqs: 'Intelligence 70+, Archery 75+' },
      { name: 'Master of Whispers', salary: 800, reqs: 'Intelligence 90+, Reputation 70+' },
      { name: 'Imperial Spymaster', salary: 2200, reqs: 'Conquer 4 Tribes' }
    ],
    action: {
      name: '👥 Sift Whisper Channels',
      cost: 20,
      desc: 'Decode encoded ribbons tied to messenger hawks and bribe rival guards.',
      successMsg: 'You discovered useful insights regarding a rival chieftain\'s secret marriage plan, storing it to use as leverage.',
      effects: { intelligence: 2, perception: 3 }
    }
  },
  {
    id: 'Falconry',
    name: '🦅 Falconry & Scouting',
    icon: 'Bird',
    entryRole: 'Bird-Catcher',
    description: 'Trap and rear hunting falcons to sweep deep ranges and mountain heights.',
    roles: [
      { name: 'Bird-Catcher', salary: 90, reqs: 'Age 15+' },
      { name: 'Falconer', salary: 220, reqs: 'Archery 80+' },
      { name: 'Master of the Hunt', salary: 550, reqs: 'Reputation 70+, Leadership 50+' },
      { name: 'Imperial Falconer', salary: 1300, reqs: 'Reputation 90+, Conquer 2 Tribes' }
    ],
    action: {
      name: '🦅 Train Hunting Raptor',
      cost: 15,
      desc: 'Cast off your hooded eagle in pursuit of scurrying steppe prey.',
      successMsg: 'Your golden eagle soared high, swooping swiftly to pin down high-quality fat marmots.',
      effects: { perception: 3, archery: 2 }
    }
  },
  {
    id: 'Spiritual',
    name: '✨ Shamanic Rites & Tengri',
    icon: 'Sparkles',
    entryRole: 'Tengri-Seeker',
    description: 'Commune with high heavenly spirits and guide clan fortunes.',
    roles: [
      { name: 'Tengri-Seeker', salary: 150, reqs: 'Age 15+' },
      { name: 'Shaman', salary: 250, reqs: 'Intelligence 70+' },
      { name: 'Tribal Healer', salary: 300, reqs: 'Reputation 60+' },
      { name: 'Sage', salary: 650, reqs: 'Intelligence 90+' },
      { name: 'High Shaman', salary: 1600, reqs: 'Reputation 90+' },
      { name: 'Oracle of the Eternal Sky', salary: 3000, reqs: 'Conquer 5 Tribes' }
    ],
    action: {
      name: '🔥 Beat Sacred Ot-Drums',
      cost: 40,
      desc: 'Throw sacred incense needles onto embers to seek sky ancestors\' blessings.',
      successMsg: 'The camp falls into a trance as dry smoke coils toward the stars. The sky father beams on your lineage.',
      effects: { intelligence: 3, appearance: 2 }
    }
  },
  {
    id: 'Equerry',
    name: '🐎 Equerry & Horsemanship',
    icon: 'Utensils',
    entryRole: 'Apprentice Groom',
    description: 'Breed and gentle the most competitive racing stallions on the steppe.',
    roles: [
      { name: 'Apprentice Groom', salary: 100, reqs: 'Age 15+' },
      { name: 'Horse Breaker', salary: 250, reqs: 'Riding 75+' },
      { name: 'Stable Master', salary: 500, reqs: 'Riding 85+, Leadership 60+' },
      { name: 'Sa\'is (Imperial Equerry)', salary: 1400, reqs: 'Reputation 90+, Conquer 1 Tribe' }
    ],
    action: {
      name: '🐎 Tame Wild Steppe Stallions',
      cost: 20,
      desc: 'Lasso wild mustangs running through the rocky valleys and break them gently.',
      successMsg: 'You mounted a wild brown mustang, holding tight until its breathing calmed down and it accepted the bridle.',
      effects: { horseRiding: 3, strength: 2 }
    }
  }
];
