/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Character, GameEvent, GameChoice, WorldState, Gender, SocialClass, Relationship, TribeRelation, RelationLevel, CombatOutcome, Asset, Pregnancy, CharacterStats, CampaignState, CaravanVoyage } from "./types";
import { generateCharacter, ageUp, refreshMarketItems, generateMarriageCandidates, generatePleasureTentCandidates, generateFriendCandidates, calculateMilitaryPower, getNomadAvatar, generateWorkplaceColleague } from "./logic/gameEngine";
import { getLocalEvent, getRandomLocalSummary } from "./logic/localEvents";
import { ROLE_SALARIES, MONGOL_SURNAMES, MONGOL_NAMES_MALE, MONGOL_NAMES_FEMALE, TRIBES, STARTING_TRAITS, APPEARANCE_HAIR_COLORS, APPEARANCE_EYE_COLORS, KINGDOMS, INITIAL_STATS, LIVESTOCK_PRICES, MARKET_ITEMS, MARKET_MULTIPLIERS, CAREER_BRANCHES } from "./constants";
import { WorldMap } from "./components/WorldMap";
import { StatProgressBar } from "./components/StatProgressBar";
import { EventCard } from "./components/EventCard";
import { MenuOverlay } from "./components/MenuOverlay";
import { CombatSimulator } from './components/CombatSimulator';
import { Heart, Sword, Brain, Users, Shield, Trophy, Map as MapIcon, Target, Coins, History, User, Play, Briefcase, Tent, Sparkles, ChevronRight, ScrollText, Music, Bird, ShoppingBag, Utensils, Globe, Handshake, TrendingUp, Sword as WarIcon, Wand2, Activity, Package, Shirt, Coffee, Box, MapPin, RotateCcw, MessageSquare, Zap, Smartphone, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { triggerVibration, playClickSound, playCoinSound, playCombatSound, playWarSound, playAgeUpSound, playDeathSound } from "./utils/audio";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

enum Tab {
  LIFE,
  RELATIONSHIPS,
  ACTIVITIES,
  ASSETS,
  CLAN,
  DIPLOMACY,
  LIVESTOCK,
  MAP,
  PREMIUM,
  COMBAT_SIM,
  SETTINGS,
  MERCHANT,
  HERITAGE
}

export default function App() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [worldState, setWorldState] = useState<WorldState>({
    year: 1206,
    activeTribes: ['Khamag Mongol'],
    currentKhan: 'Temujin',
    worldEvents: ['The Unification of the Tribes']
  });
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [creationData, setCreationData] = useState({
    name: '',
    gender: Gender.MALE,
    tribe: TRIBES[0],
    clan: MONGOL_SURNAMES[0],
    socialClass: SocialClass.NOMAD,
    appearanceOptions: {
      hairColor: 'Black',
      eyeColor: 'Dark Brown',
      build: 'Athletic' as 'Slender' | 'Athletic' | 'Robust' | 'Towering'
    },
    traits: [] as string[]
  });
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LIFE);
  const [hallOfFame, setHallOfFame] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Relationship | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [adRewardUsed, setAdRewardUsed] = useState(false);
  const [showAdOptions, setShowAdOptions] = useState(false);
  const [settings, setSettings] = useState({
    parchmentTexture: true,
    showDetailedStats: true,
    notifications: true,
    vibration: true,
    sound: true,
    androidThemeColor: 'gold', // 'gold' | 'crimson' | 'emerald' | 'sky'
    deviceShell: false
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRecentsSwitcher, setShowRecentsSwitcher] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("premium") === "true") {
      setIsPremium(true);
      localStorage.setItem("isPremium", "true");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const stored = localStorage.getItem("isPremium");
      if (stored === "true") {
        setIsPremium(true);
      }
    }
    
    // Load Hall of Fame
    const storedHof = localStorage.getItem("steppe_nomad_hof");
    if (storedHof) {
      try {
        setHallOfFame(JSON.parse(storedHof));
      } catch (e) {
        console.error("Failed to load HOF", e);
      }
    }
  }, []);
  
  const [isSuccessionMode, setIsSuccessionMode] = useState(false);
  const [isCouncilOpen, setIsCouncilOpen] = useState(false);
  const [isSuccessionCouncilOpen, setIsSuccessionCouncilOpen] = useState(false);
  const [successionCouncilOpinions, setSuccessionCouncilOpinions] = useState<any[]>([]);
  const [currentCouncilDecision, setCurrentCouncilDecision] = useState<any | null>(null);
  const [isGiftingMode, setIsGiftingMode] = useState(false);
  const [marriageCandidates, setMarriageCandidates] = useState<Relationship[] | null>(null);
  const [pleasureTentCandidates, setPleasureTentCandidates] = useState<Relationship[] | null>(null);
  const [pleasureTentOutcome, setPleasureTentOutcome] = useState<{
    type: 'OneNight' | 'Mistress';
    success: boolean;
    candidateName: string;
    text: string;
    cost: number;
    healthImpact: number;
    happinessGain: number;
    spouseLoyaltyImpact: number;
    otherWivesLoyaltyImpact: number;
  } | null>(null);
  const [friendCandidates, setFriendCandidates] = useState<Relationship[] | null>(null);
  const [genericActionResult, setGenericActionResult] = useState<{
    title: string;
    subtitle?: string;
    storySnippet: string;
    avatarUrl?: string;
    effects?: {
      label: string;
      value: string | number;
      isPositive?: boolean;
      isNegative?: boolean;
    }[];
  } | null>(null);
  const [relationshipSort, setRelationshipSort] = useState<'name' | 'loyalty'>('loyalty');
  const [marketTab, setMarketTab] = useState<'buy' | 'sell'>('buy');
  const [merchantSubTab, setMerchantSubTab] = useState<'market' | 'workshops' | 'caravans'>('market');
  const [caravanRoute, setCaravanRoute] = useState<string>('Jin Dynasty');
  const [caravanGuards, setCaravanGuards] = useState<number>(1);
  const [caravanCargo, setCaravanCargo] = useState<string>('Felt & Leather');
  const [selectedCareerBranch, setSelectedCareerBranch] = useState<string>('Military');
  const [marketCategory, setMarketCategory] = useState<string>('All');
  const [marketSort, setMarketSort] = useState<'price' | 'name' | 'quality'>('name');
  const [hasWon, setHasWon] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryType, setVictoryType] = useState<string | null>(null);
  const [isEditingNPCName, setIsEditingNPCName] = useState(false);
  const [editedNPCName, setEditedNPCName] = useState('');
  const [childBirthPending, setChildBirthPending] = useState<Pregnancy | null>(null);
  const [childBirthsQueue, setChildBirthsQueue] = useState<Pregnancy[]>([]);
  const [newChildName, setNewChildName] = useState('');
  const [newChildGender, setNewChildGender] = useState<Gender>(Gender.MALE);
  const [showHordeUpkeepBreakdown, setShowHordeUpkeepBreakdown] = useState(false);

  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [character?.history]);

  useEffect(() => {
    if (!childBirthPending && childBirthsQueue.length > 0) {
      const nextBirth = childBirthsQueue[0];
      setChildBirthPending(nextBirth);
      setChildBirthsQueue(prev => prev.slice(1));
      
      const randomGender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      setNewChildGender(randomGender);
      const randomNames = randomGender === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
      setNewChildName(randomNames[Math.floor(Math.random() * randomNames.length)]);
    }
  }, [childBirthPending, childBirthsQueue]);

  const handleSave = (silent: boolean = false) => {
    if (!character) return;
    
    const saveData = {
      character,
      worldState,
      gameStarted,
      creationData,
      activeTab,
      isPremium,
      settings,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem("steppe_nomad_save", JSON.stringify(saveData));
    if (!silent) {
      alert("Game saved successfully!");
    }
  };

  useEffect(() => {
    if (!gameStarted || !character || !character.isAlive) return;
    const interval = setInterval(() => {
      handleSave(true);
    }, 60000); // Auto-save every minute
    return () => clearInterval(interval);
  }, [gameStarted, character?.id, character?.isAlive]);

  const handleLoad = () => {
    const saved = localStorage.getItem("steppe_nomad_save");
    if (!saved) {
      alert("No saved game found.");
      return;
    }

    try {
      const data = JSON.parse(saved);
      setCharacter(data.character);
      setWorldState(data.worldState);
      setGameStarted(data.gameStarted);
      setCreationData(data.creationData);
      setActiveTab(data.activeTab || Tab.LIFE);
      setIsPremium(data.isPremium || false);
      setSettings(data.settings || settings);
      setIsMenuOpen(false);
      alert("Game loaded successfully!");
    } catch (e) {
      console.error("Failed to load save", e);
      alert("Error loading save file. It may be corrupted.");
    }
  };

  const recordLegacy = (char: Character) => {
    const legacy = {
      id: char.id,
      name: char.name,
      gender: char.gender,
      age: char.age,
      role: char.role,
      clan: char.clan,
      wealth: Math.floor(char.stats.wealth),
      militaryPower: Math.floor(char.militaryPower),
      deathCause: char.deathCause || "Natural causes",
      conqueredTribes: char.conqueredTribes.length,
      avatarUrl: char.avatarUrl,
      timestamp: new Date().toISOString()
    };

    setHallOfFame(prev => {
      const updated = [legacy, ...prev.filter(l => l.id !== legacy.id)].sort((a, b) => b.wealth - a.wealth).slice(0, 50);
      localStorage.setItem("steppe_nomad_hof", JSON.stringify(updated));
      return updated;
    });
  };

  const startNewLife = (heir?: Relationship, overrides?: any) => {
    if (!heir) {
      setWorldState({
        year: 1206,
        activeTribes: ['Khamag Mongol'],
        currentKhan: 'Temujin',
        worldEvents: ['The Unification of the Tribes']
      });
    }

    const newChar = generateCharacter(overrides);
    
    if (isPremium) {
      newChar.stats.strength += 20;
      newChar.stats.wealth += 500;
      newChar.history.push({ age: 0, text: "Premium Lineage: You begin with divine physical strength and significant silken wealth." });
    }

    if (heir && character) {
      // Legacy Inheritance
      newChar.name = `${heir.name.split(' ')[0]} ${character.clan}`;
      if (heir.avatarUrl) newChar.avatarUrl = heir.avatarUrl;
      
      // Inherit stats from heir relationship object if they exist
      if (heir.stats) {
        newChar.stats.strength = Math.max(newChar.stats.strength || 0, heir.stats.strength || 0);
        newChar.stats.intelligence = Math.max(newChar.stats.intelligence || 0, heir.stats.intelligence || 0);
        newChar.stats.leadership = Math.max(newChar.stats.leadership || 0, heir.stats.leadership || 0);
        newChar.stats.archery = Math.max(newChar.stats.archery || 0, heir.stats.archery || 0);
      }

      newChar.age = heir.age || 0;
      newChar.gender = heir.gender || Gender.MALE;
      
      // Law based inheritance multipliers
      let wealthMult = 0.5;
      let repMult = 0.3;
      
      if (character.successionLaw === 'Tanistry') { wealthMult = 0.4; repMult = 0.5; }
      else if (character.successionLaw === 'Primogeniture') { wealthMult = 0.7; repMult = 0.2; }
      else if (character.successionLaw === 'Ultimogeniture') { wealthMult = 0.8; repMult = 0.1; }
      else if (character.successionLaw === 'Elective') { wealthMult = 0.3; repMult = 0.6; }

      newChar.stats.wealth = Math.floor((character.stats.wealth || 0) * wealthMult) + (newChar.stats.wealth || 0);
      newChar.stats.reputation = Math.floor((character.stats.reputation || 0) * repMult) + (newChar.stats.reputation || 0);
      newChar.clanWealth = character.clanWealth;
      newChar.history = [{ age: newChar.age, text: `Continuing the legacy of ${character.name} as the new head of the ${character.clan} Clan.` }];
    }

    setCharacter(newChar);
    setGameStarted(true);
    setShowIntro(false);
    setIsCreatingCharacter(false);
    setCurrentEvent(null);
    setSelectedPerson(null);
    setIsSuccessionMode(false);
    setHasWon(false);
    setShowVictoryModal(false);
    setVictoryType(null);
  };

  const fullReset = () => {
    setShowIntro(true);
    setGameStarted(false);
    setIsCreatingCharacter(false);
    setCharacter(null);
    setCurrentEvent(null);
    setSelectedPerson(null);
    setIsSuccessionMode(false);
    setIsMenuOpen(false);
    setHasWon(false);
    setShowVictoryModal(false);
    setVictoryType(null);
    setActiveTab(Tab.LIFE);
    setWorldState({
      year: 1206,
      activeTribes: ['Khamag Mongol'],
      currentKhan: 'Temujin',
      worldEvents: ['The Unification of the Tribes']
    });
  };

  const handleAgeUp = async () => {
    if (!character || !character.isAlive) return;
    
    // Advance world state year by 1
    setWorldState(prev => ({ ...prev, year: prev.year + 1 }));
    
    // 1. Immediate UI update for the age increase
    const agedChar = ageUp(character);
    
    // Collect active pregnancies carried to term
    const pendingBirths: Pregnancy[] = [];
    if (character.pregnancy?.isPregnant) {
      pendingBirths.push({ ...character.pregnancy });
      agedChar.pregnancy = null;
    }

    // Check relationships for pregnancies (wives, concubines, mistresses)
    agedChar.relationships = agedChar.relationships.map(rel => {
      if (rel.pregnancy?.isPregnant) {
        pendingBirths.push({ ...rel.pregnancy });
        return { ...rel, pregnancy: null };
      }
      return rel;
    });

    if (pendingBirths.length > 0) {
      setChildBirthsQueue(prev => [...prev, ...pendingBirths]);
    }
    
    if (!agedChar.isAlive) {
      recordLegacy(agedChar);
      playDeathSound(settings.sound);
      triggerVibration(200, settings.vibration);
    } else {
      playAgeUpSound(settings.sound);
      triggerVibration(65, settings.vibration);
    }
    
    // 2. Weather Simulation
    const weatherRoll = Math.random();
    if (weatherRoll < 0.6) agedChar.weather = 'Clear';
    else if (weatherRoll < 0.8) agedChar.weather = 'Overcast';
    else if (weatherRoll < 0.9) agedChar.weather = 'Snow';
    else agedChar.weather = 'Dust Storm';

    // 3. Reset temporary vision bonus (but keep item-based ones)
    const itemVisionBonus = agedChar.assets.reduce((acc, asset) => {
      if (asset.name === 'Golden Eagle') return acc + 20;
      if (asset.name === 'Hunting Falcon') return acc + 8;
      if (asset.name === 'Western Spyglass') return acc + 15;
      return acc;
    }, 0);
    agedChar.visionBonus = itemVisionBonus;

    setAdRewardUsed(false);
    
    // Check Victory
    if (!hasWon) {
      if (agedChar.age >= 80 && agedChar.stats.happiness >= 80) {
        setHasWon(true);
        setVictoryType("The Eternal Elder: You have reached a ripe old age with a heart full of joy.");
        setShowVictoryModal(true);
      }
    }

    // Process Steppe Businesses
    let businessLog: string[] = [];
    if (agedChar.workshops && agedChar.workshops.length > 0) {
      agedChar.workshops = agedChar.workshops.map(ws => {
        const income = Math.floor(ws.passiveIncome * (1 + (agedChar.stats.intelligence + agedChar.stats.perception) / 100));
        agedChar.stats.wealth += income;
        businessLog.push(`Your level ${ws.level} ${ws.name} generated ${income}г profit.`);
        return ws;
      });
    }

    if (agedChar.caravans && agedChar.caravans.length > 0) {
      agedChar.caravans = agedChar.caravans.map(car => {
        if (car.status === 'Traveling') {
          const nextProgress = car.progressYears + 1;
          if (nextProgress >= car.durationYears) {
            // Caravan resolves!
            const guardBonus = Math.min(25, car.guards * 6);
            const playerBonus = (agedChar.stats.perception + agedChar.stats.intelligence) / 8;
            const successChance = 65 + guardBonus + playerBonus;
            const roll = Math.random() * 100;

            if (roll < successChance) {
              const actualProfit = Math.floor(car.expectedReturnMin + Math.random() * (car.expectedReturnMax - car.expectedReturnMin));
              agedChar.stats.wealth += actualProfit;
              businessLog.push(`💰 Success: Caravan returned from ${car.destination} (${car.cargo}), earning ${actualProfit}г!`);
              return { ...car, progressYears: nextProgress, status: 'Completed', narrative: `Successfully arrived in ${car.destination} and returned with ${actualProfit}г.` };
            } else {
              const partialReturn = Math.floor(car.investment * (Math.random() * 0.3));
              agedChar.stats.wealth += partialReturn;
              businessLog.push(`⚔️ Plundered! Caravan to ${car.destination} was raided. Salvaged only ${partialReturn}г.`);
              return { ...car, progressYears: nextProgress, status: 'Plundered', narrative: `Raided by bandits on the Silk Road. Salvaged ${partialReturn}г.` };
            }
          } else {
            return { ...car, progressYears: nextProgress };
          }
        }
        return car;
      });
    }

    if (businessLog.length > 0) {
      businessLog.forEach(log => {
        agedChar.history.push({ age: agedChar.age, text: log });
      });
    }

    let businessReport = "";
    if (businessLog.length > 0) {
      businessReport = "\n\n💼 **Steppe Business Report:**\n" + businessLog.map(log => `• ${log}`).join("\n");
    }

    // Check for a specific local event
    const localEvent = getLocalEvent(agedChar);
    
    if (localEvent) {
      const clonedEvent = { 
        ...localEvent, 
        description: localEvent.description + businessReport,
        choices: localEvent.choices.map(c => ({
          ...c,
          storySnippet: c.storySnippet + businessReport
        }))
      };
      setCharacter(agedChar);
      setCurrentEvent(clonedEvent);
    } else {
      // Fallback: Show a "Yearly Summary" as a Log event
      let summary = getRandomLocalSummary();
      if (businessReport) {
        summary = summary + businessReport;
      }
      const logEvent: GameEvent = {
        id: `log-${Date.now()}`,
        title: "The Passing Year",
        description: summary,
        choices: [
          {
            text: "Continue Your Journey",
            storySnippet: summary,
            effect: () => ({})
          }
        ]
      };
      setCharacter(agedChar);
      setCurrentEvent(logEvent);
    }
    
    setSelectedPerson(null);
    setIsMenuOpen(false);
  };

  const handleChoice = (choice: GameChoice) => {
    if (!character) return;

    // Tactile & audio feedback
    triggerVibration(40, settings.vibration);
    const textLower = (choice.text || "").toLowerCase() + (choice.storySnippet || "").toLowerCase();
    if (textLower.includes('plunder') || textLower.includes('reclaim') || textLower.includes('coin') || textLower.includes('gold') || textLower.includes('compensat') || textLower.includes('buy') || textLower.includes('sell') || textLower.includes('wealth')) {
      playCoinSound(settings.sound);
    } else if (textLower.includes('charge') || textLower.includes('raid') || textLower.includes('arrow') || textLower.includes('bow') || textLower.includes('blade') || textLower.includes('fight') || textLower.includes('slew') || textLower.includes('war') || textLower.includes('combat') || textLower.includes('defense')) {
      playCombatSound(settings.sound);
    } else {
      playClickSound(settings.sound);
    }

    let updatedChar = { ...character };

    if (choice.customEffect) {
      const oldCondition = updatedChar.marketCondition;
      const oldTrends = JSON.stringify(updatedChar.marketTrends);
      updatedChar = choice.customEffect(updatedChar);
      
      if (updatedChar.marketCondition !== oldCondition || JSON.stringify(updatedChar.marketTrends) !== oldTrends) {
         updatedChar.availableMarketItems = refreshMarketItems(updatedChar.marketCondition, updatedChar.marketTrends);
      }
    }

    if (choice.effect) {
      const statsEffect = choice.effect(updatedChar);
      const newStats = { ...updatedChar.stats };
      Object.entries(statsEffect).forEach(([key, val]) => {
        const k = key as keyof typeof newStats;
        const currentVal = Number.isNaN(Number(newStats[k])) ? 0 : (newStats[k] || 0);
        const change = Number.isNaN(Number(val)) ? 0 : (val || 0);
        
        if (k === 'wealth') {
          newStats[k] = Math.max(0, currentVal + change);
        } else {
          newStats[k] = Math.max(0, Math.min(100, currentVal + change));
        }
      });
      updatedChar.stats = newStats;

      if (newStats.health <= 0 && updatedChar.isAlive) {
        updatedChar.isAlive = false;
        updatedChar.deathCause = "Severely poor health and physical exhaustion";
        updatedChar.history.push({ age: updatedChar.age, text: "Your body finally gave out. Your physical health has reached zero." });
        recordLegacy(updatedChar);
      }
    }

    updatedChar.history = [...updatedChar.history, { age: updatedChar.age, text: choice.storySnippet }];

    // Check Victory
    if (!hasWon) {
      if (updatedChar.isGreatKhan) {
        setHasWon(true);
        setVictoryType("Great Khan: You have united the tribes under one banner!");
        setShowVictoryModal(true);
      } else if (updatedChar.conqueredTribes && updatedChar.conqueredTribes.length >= 5) {
        setHasWon(true);
        setVictoryType("Supreme Conqueror: Five tribes have fallen before your horde.");
        setShowVictoryModal(true);
      }
    }

    setCharacter(updatedChar);
    setCurrentEvent(null);
  };

  const openMenu = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(true);
    setSelectedPerson(null);
  };

  const handleInteract = (person: Relationship, action: string) => {
    if (!character) return;

    let loyaltyMod = 0;
    let wealthMod = 0;
    let storySnippet = "";

    switch (action) {
      case 'Spend Time':
        loyaltyMod = 5 + Math.floor(Math.random() * 6);
        storySnippet = `Spent a fine afternoon with ${person.name} sharing stories of the steppe.`;
        break;
      case 'Give Gift':
        if (character.stats.wealth >= 20) {
          wealthMod = -20;
          loyaltyMod = 15;
          storySnippet = `Presented a fine silk scarf to ${person.name}. They were greatly moved.`;
        } else {
          storySnippet = `Tried to buy a gift for ${person.name} but your coin purse was empty. How embarrassing.`;
          loyaltyMod = -2;
        }
        break;
      case 'Ask for Advice':
        loyaltyMod = 2;
        storySnippet = `Hung onto every word of ${person.name}'s wisdom. You feel slightly more prepared for life.`;
        break;
      case 'Insult':
        loyaltyMod = -20;
        storySnippet = `You insulted ${person.name}'s lineage. A bitter grudge is born.`;
        break;
      case 'Praise':
        loyaltyMod = 8;
        storySnippet = `You publicly praised ${person.name} for their virtues. They glow with pride.`;
        break;
      case 'Discipline':
        loyaltyMod = -10;
        storySnippet = `You sternly corrected ${person.name}. They are shamed, but perhaps more disciplined.`;
        break;
    }

    const updatedRels = character.relationships.map(r => 
      r.name === person.name ? { ...r, loyalty: Math.min(100, Math.max(0, r.loyalty + loyaltyMod)) } : r
    );

    setCharacter({
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth + wealthMod },
      relationships: updatedRels,
      history: [...character.history, { age: character.age, text: storySnippet }]
    });

    const effectsList = [];
    if (wealthMod !== 0) {
      effectsList.push({
        label: "💰 Wealth",
        value: wealthMod > 0 ? `+${wealthMod}г` : `${wealthMod}г`,
        isPositive: wealthMod > 0,
        isNegative: wealthMod < 0
      });
    }
    if (loyaltyMod !== 0) {
      effectsList.push({
        label: `👥 ${person.name}'s Loyalty`,
        value: loyaltyMod > 0 ? `+${loyaltyMod}%` : `${loyaltyMod}%`,
        isPositive: loyaltyMod > 0,
        isNegative: loyaltyMod < 0
      });
    }

    setGenericActionResult({
      title: `${action} Outcome`,
      subtitle: `${person.name} (${person.type})`,
      storySnippet,
      avatarUrl: person.avatarUrl,
      effects: effectsList
    });

    setSelectedPerson(null);
  };

  const handleGiftCustomAsset = (person: Relationship, asset: Asset) => {
    if (!character) return;
    
    // Calculate loyalty gain
    const loyaltyGain = Math.min(100 - person.loyalty, Math.min(80, 15 + Math.floor(asset.value / 10) + Math.floor(asset.quality / 5)));
    
    // Remove from assets
    const updatedAssets = character.assets.filter(a => a.id !== asset.id);
    
    // Update relationship loyalty
    const updatedRels = character.relationships.map(r => 
      r.id === person.id || (r.name === person.name && r.type === person.type)
        ? { ...r, loyalty: Math.min(100, r.loyalty + loyaltyGain) }
        : r
    );

    const storySnippet = `You formally presented your prized ${asset.name} (${asset.type}, Quality: ${asset.quality}%) to ${person.name}. They are deeply honored by such immense generosity.`;

    const updatedChar = {
      ...character,
      assets: updatedAssets,
      relationships: updatedRels,
      history: [...character.history, { age: character.age, text: `Gifted prized ${asset.name} to ${person.name}.` }]
    };

    // Remove vision bonuses if the item provided them
    if (asset.id.startsWith('m_eagle')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 20);
    if (asset.id.startsWith('m_falcon')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 8);
    if (asset.id.startsWith('m_spyglass')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 15);
    if (asset.id.startsWith('m_persian_map')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 25);

    setCharacter(updatedChar);

    setGenericActionResult({
      title: "🎁 Asset Gift Honored",
      subtitle: `${person.name} (${person.type})`,
      storySnippet,
      avatarUrl: person.avatarUrl,
      effects: [
        { label: "📦 Gifted Asset", value: asset.name, isNegative: true },
        { label: `👥 ${person.name}'s Loyalty`, value: `+${loyaltyGain}%`, isPositive: true }
      ]
    });

    setSelectedPerson(null);
    setIsGiftingMode(false);
  };

  const handleGiftLivestock = (person: Relationship, type: 'horses' | 'camels' | 'sheep' | 'yaks' | 'cattle' | 'goats', quantity: number, loyaltyGain: number, label: string) => {
    if (!character || (character.livestock[type] || 0) < quantity) return;

    // Deduct livestock
    const updatedLivestock = {
      ...character.livestock,
      [type]: Math.max(0, (character.livestock[type] || 0) - quantity)
    };

    // Update relationship loyalty
    const updatedRels = character.relationships.map(r => 
      r.id === person.id || (r.name === person.name && r.type === person.type)
        ? { ...r, loyalty: Math.min(100, r.loyalty + loyaltyGain) }
        : r
    );

    const storySnippet = `Presented a magnificent gift of ${quantity}x ${label} from your pasture herds to ${person.name}. They offer deep bows and praises to Tengri for your thriving stock.`;

    const updatedChar = {
      ...character,
      livestock: updatedLivestock,
      relationships: updatedRels,
      history: [...character.history, { age: character.age, text: `Gifted ${quantity}x ${label} to ${person.name}.` }]
    };

    // Recompute military power if we gifted horses (since horses affect power)
    const milData = calculateMilitaryPower(updatedChar);
    updatedChar.militaryPower = milData.power;
    updatedChar.hordeSize = milData.soldiers;

    setCharacter(updatedChar);

    setGenericActionResult({
      title: "🐄 Pastoral Gift Honored",
      subtitle: `${person.name} (${person.type})`,
      storySnippet,
      avatarUrl: person.avatarUrl,
      effects: [
        { label: `牧 Livestock Deducted`, value: `-${quantity} ${label}`, isNegative: true },
        { label: `👥 ${person.name}'s Loyalty`, value: `+${loyaltyGain}%`, isPositive: true }
      ]
    });

    setSelectedPerson(null);
    setIsGiftingMode(false);
  };

  const handleGiftStandard = (person: Relationship) => {
    if (!character || character.stats.wealth < 20) return;

    const updatedRels = character.relationships.map(r => 
      r.id === person.id || (r.name === person.name && r.type === person.type)
        ? { ...r, loyalty: Math.min(100, r.loyalty + 15) }
        : r
    );

    setCharacter({
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth - 20 },
      relationships: updatedRels,
      history: [...character.history, { age: character.age, text: `Presented a fine silk scarf to ${person.name}.` }]
    });

    setGenericActionResult({
      title: "🎁 Gift Presented",
      subtitle: `${person.name} (${person.type})`,
      storySnippet: `Presented a fine silk scarf to ${person.name}. They were greatly moved and expressed hearty gratitude.`,
      avatarUrl: person.avatarUrl,
      effects: [
        { label: "💰 Cost", value: "-20г", isNegative: true },
        { label: `👥 ${person.name}'s Loyalty`, value: "+15%", isPositive: true }
      ]
    });

    setSelectedPerson(null);
    setIsGiftingMode(false);
  };

  const handleSelectPerson = (rel: Relationship) => {
    let personWithStats = { ...rel };
    if (!personWithStats.stats) {
      const isChild = personWithStats.type === 'Child';
      const genStat = (base: number, variation: number) => Math.min(100, Math.max(5, Math.floor(base + Math.random() * variation)));
      personWithStats.stats = {
        health: isChild ? genStat(75, 20) : genStat(50, 45),
        happiness: genStat(60, 35),
        appearance: genStat(40, 50),
        strength: isChild ? genStat(10, 20) : genStat(30, 55),
        intelligence: isChild ? genStat(15, 20) : genStat(30, 55),
        perception: genStat(20, 60),
        leadership: isChild ? genStat(5, 15) : genStat(20, 60),
        loyalty: personWithStats.loyalty || genStat(50, 45),
        reputation: isChild ? genStat(2, 10) : genStat(15, 60),
        realmReputation: genStat(0, 15),
        horseRiding: isChild ? genStat(10, 25) : genStat(35, 55),
        archery: isChild ? genStat(10, 20) : genStat(30, 55),
        wealth: 0
      };

      if (character) {
        const updatedRels = character.relationships.map(r => 
          (r.id && rel.id ? r.id === rel.id : (r.name === rel.name && r.type === rel.type)) 
            ? personWithStats 
            : r
        );
        setCharacter({
          ...character,
          relationships: updatedRels
        });
      }
    }
    setIsEditingNPCName(false);
    setSelectedPerson(personWithStats);
  };

  const handleSaveNPCName = () => {
    if (!character || !selectedPerson || !editedNPCName.trim()) return;
    
    const newName = editedNPCName.trim();
    const oldName = selectedPerson.name;
    const isHeir = character.designatedHeir === oldName;

    const updatedRels = character.relationships.map(r => {
      if (r.id === selectedPerson.id || (r.name === oldName && r.type === selectedPerson.type)) {
        return { ...r, name: newName };
      }
      return r;
    });

    const updatedChar = {
      ...character,
      relationships: updatedRels,
      designatedHeir: isHeir ? newName : character.designatedHeir
    };

    setCharacter(updatedChar);
    setSelectedPerson({
      ...selectedPerson,
      name: newName
    });
    setIsEditingNPCName(false);
  };

  const handleHaveChild = (spouse: Relationship) => {
    if (!character) return;
    
    // Check pregnancy parameters:
    const isPlayerMother = character.gender === Gender.FEMALE;
    
    // 1. If player is female (mother), she can only have one pregnancy at a time
    if (isPlayerMother && character.pregnancy?.isPregnant) {
      return;
    }
    
    // 2. If player is male, we check if this specific spouse is already pregnant
    if (!isPlayerMother && spouse.pregnancy?.isPregnant) {
      return;
    }
    
    // Chance increases with loyalty
    const chance = 0.25 + (spouse.loyalty / 200); 
    let storySnippet = "";
    let updatedChar = { ...character };

    if (Math.random() < chance) {
      const motherName = isPlayerMother ? character.name : spouse.name;
      const partnerName = isPlayerMother ? spouse.name : character.name;

      storySnippet = isPlayerMother 
        ? `A warm flutter fills your womb... You have become pregnant with the child of ${spouse.name}! The clan celebrates the coming heir.`
        : `Your beloved ${spouse.name} whispers late in the night that a new life quickens in her womb! A child is expected next year.`;
      
      const newPregnancy: Pregnancy = {
        isPregnant: true,
        motherName,
        partnerName,
        isPlayerMother,
        expectedYear: character.age + 1,
        spouseId: spouse.id
      };

      if (isPlayerMother) {
        // Player is pregnant
        updatedChar = {
          ...character,
          stats: { ...character.stats, happiness: Math.min(100, character.stats.happiness + 20) },
          relationships: character.relationships.map(r => 
            (r.id === spouse.id || r.name === spouse.name)
              ? { ...r, loyalty: Math.min(100, r.loyalty + 15) } 
              : r
          ),
          pregnancy: newPregnancy
        };
      } else {
        // Spouse/Concubine is pregnant
        updatedChar = {
          ...character,
          stats: { ...character.stats, happiness: Math.min(100, character.stats.happiness + 20) },
          relationships: character.relationships.map(r => 
            (r.id === spouse.id || r.name === spouse.name)
              ? { ...r, loyalty: Math.min(100, r.loyalty + 15), pregnancy: newPregnancy } 
              : r
          )
        };
      }
    } else {
      storySnippet = `You spent quality time with ${spouse.name}, though the spirits have not blessed you with another child just yet.`;
      updatedChar = {
        ...character,
        stats: { ...character.stats, happiness: Math.min(100, character.stats.happiness + 5) },
        relationships: character.relationships.map(r => 
          (r.id === spouse.id || r.name === spouse.name) 
            ? { ...r, loyalty: Math.min(100, r.loyalty + 5) } 
            : r
        )
      };
    }

    updatedChar.history = [...updatedChar.history, { age: character.age, text: storySnippet }];
    setCharacter(updatedChar);

    const wasSuccessfulConception = !!(updatedChar.pregnancy?.isPregnant || updatedChar.relationships.find(r => r.id === spouse.id && r.pregnancy?.isPregnant));

    const effectsList = [
      {
        label: "😊 Happiness",
        value: wasSuccessfulConception ? "+20" : "+5",
        isPositive: true
      },
      {
        label: `👥 ${spouse.name}'s Loyalty`,
        value: wasSuccessfulConception ? "+15%" : "+5%",
        isPositive: true
      }
    ];

    if (wasSuccessfulConception) {
      effectsList.unshift({
        label: "🤰 Pregnancy Status",
        value: "Pregnant (Expected Next Year)",
        isPositive: true
      });
    }

    setGenericActionResult({
      title: "Seek an Heir",
      subtitle: `Domestic Practice with ${spouse.name}`,
      storySnippet,
      avatarUrl: spouse.avatarUrl,
      effects: effectsList
    });

    setSelectedPerson(null);
  };

  const handleChildBirthSubmit = (name: string, gender: Gender) => {
    if (!character || !childBirthPending) return;

    const namePool = gender === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
    const trimmedName = name.trim() || namePool[Math.floor(Math.random() * namePool.length)];
    const isMale = gender === Gender.MALE;

    // Retrieve mother relationship if any
    const motherRel = character.relationships.find(r => r.id === childBirthPending.spouseId);
    let finalTraits = ["Loyal"];
    let parentageSnippet = "";

    const childStats: CharacterStats = {
      health: 80 + Math.floor(Math.random() * 15),
      happiness: 90,
      appearance: 40 + Math.floor(Math.random() * 40),
      strength: 5 + Math.floor(Math.random() * 15),
      intelligence: 5 + Math.floor(Math.random() * 15),
      perception: 10 + Math.floor(Math.random() * 20),
      leadership: 5 + Math.floor(Math.random() * 10),
      loyalty: 100,
      reputation: 5,
      realmReputation: 0,
      horseRiding: 5 + Math.floor(Math.random() * 15),
      archery: 5 + Math.floor(Math.random() * 15),
      wealth: 0
    };

    if (motherRel) {
      if (motherRel.originType === 'Tribe') {
        finalTraits.push('Steppe Blood');
        if (motherRel.originName) {
          finalTraits.push(`${motherRel.originName.split(' ')[0]} Blood`);
        }
        childStats.strength += 10;
        childStats.horseRiding += 15;
        childStats.archery += 10;
        parentageSnippet = ` As the child of Steppe Princess ${motherRel.name.split(' ')[0]}, they carry the premium equestrian and archery genes of the ${motherRel.originName}.`;
      } else if (motherRel.originType === 'Kingdom') {
        finalTraits.push('Noble-Born');
        if (motherRel.originName) {
          finalTraits.push(`${motherRel.originName.split(' ')[0]} Lineage`);
        }
        childStats.intelligence += 15;
        childStats.perception += 10;
        childStats.leadership += 10;
        childStats.appearance = Math.min(100, childStats.appearance + 15);
        parentageSnippet = ` As the offspring of Princess ${motherRel.name.split(' (')[0]} from the grand ${motherRel.originName}, they inherit an illustrious dynastic aura intellectual capacity.`;
      }
    }

    const childNum = (Number(character.children) || 0) + 1;
    let storySnippet = `Your house welcomes ${trimmedName}, a strong ${isMale ? 'son' : 'daughter'}, born to ${childBirthPending.motherName} and ${childBirthPending.partnerName}. The family line flourishes.${parentageSnippet}`;

    const newChildRelation: Relationship = {
      id: crypto.randomUUID(),
      name: trimmedName,
      type: "Child",
      gender: gender,
      age: 0,
      loyalty: 100,
      status: "Active",
      clan: character.clan,
      traits: finalTraits,
      socialClass: character.socialClass,
      avatarUrl: getNomadAvatar(trimmedName, gender, character.clan, 0, undefined, character.socialClass),
      stats: childStats
    };

    const updatedChar: Character = {
      ...character,
      children: childNum,
      stats: { ...character.stats, happiness: Math.min(100, character.stats.happiness + 15) },
      relationships: [...character.relationships, newChildRelation],
      pregnancy: null
    };

    updatedChar.history = [...updatedChar.history, { age: character.age, text: storySnippet }];
    
    setCharacter(updatedChar);
    setChildBirthPending(null);
    setNewChildName("");

    // Save progress immediately
    localStorage.setItem("steppe_nomad_save", JSON.stringify({
      character: updatedChar,
      worldState,
      gameStarted,
      showIntro,
      adRewardUsed
    }));
  };

  const COUNCIL_DECISIONS = [
    {
      id: 'migration',
      title: "🏔️ Seasonal Migration Route",
      description: "Where should the clan graze this season?",
      options: [
        { 
          text: "Northern Steppe (Greener Grass)", 
          outcome: "Better livestock growth but risks winter hardship.",
          effect: (char: Character) => ({ ...char, livestock: { ...char.livestock, horses: char.livestock.horses + 20 }, stats: { ...char.stats, happiness: char.stats.happiness + 5 } })
        },
        { 
          text: "Southern Valley (Safe from Cold)", 
          outcome: "Lower growth but very safe herd stability.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, reputation: char.stats.reputation + 5 } })
        }
      ]
    },
    {
      id: 'blood-feud',
      title: "🏹 A Question of Blood-Feud",
      description: "A rival sub-clan has stolen a dozen horses. How shall we answer?",
      options: [
        { 
          text: "Declare War (Total Revenge)", 
          outcome: "Full-scale conflict. High reputation if successful.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, reputation: char.stats.reputation + 15, strength: char.stats.strength + 5 } })
        },
        { 
          text: "Demand Wergild (Blood-Price)", 
          outcome: "Seek compensation in gold and cattle.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, wealth: char.stats.wealth + 300, intelligence: char.stats.intelligence + 10 } })
        }
      ]
    },
    {
      id: 'feast',
      title: "🍖 Host a Tribal Feast",
      description: "The warriors are restless. Should we host a grand celebration?",
      options: [
        { 
          text: "Grand Feast (Big Wealth Cost)", 
          outcome: "Massive reputation and loyalty boost.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, wealth: Math.max(0, char.stats.wealth - 1000), reputation: char.stats.reputation + 25 }, relationships: char.relationships.map(r => ({ ...r, loyalty: Math.min(100, r.loyalty + 10) })) })
        },
        { 
          text: "Skip it (Save Resources)", 
          outcome: "Keeps wealth but might lower morale.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, happiness: char.stats.happiness - 10 } })
        }
      ]
    },
    {
      id: 'recruiting',
      title: "⚔️ Warrior Recruitment",
      description: "How should we bolster our ranks?",
      options: [
        { 
          text: "Hire Mercenaries", 
          outcome: "Instant horde increase but lower overall loyalty.",
          effect: (char: Character) => ({ ...char, hordeSize: char.hordeSize + 100, stats: { ...char.stats, wealth: Math.max(0, char.stats.wealth - 500) } })
        },
        { 
          text: "Train Clansmen", 
          outcome: "Slower horde increase but very loyal warriors.",
          effect: (char: Character) => ({ ...char, hordeSize: char.hordeSize + 50, stats: { ...char.stats, strength: char.stats.strength + 10 } })
        }
      ]
    },
    {
      id: 'succession',
      title: "👑 Naming a Successor",
      description: "The lineages must be clear. Who is your favored heir?",
      options: [
        { 
          text: "The Eldest (Traditional)", 
          outcome: "Clan elders are pleased, but younger sons feel slighted.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, leadership: char.stats.leadership + 10, loyalty: char.stats.loyalty + 5 } })
        },
        { 
          text: "The Skilled (Meritocratic)", 
          outcome: "Warriors are inspired, but tradition is broken.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, reputation: char.stats.reputation + 15, intelligence: char.stats.intelligence + 10 } })
        }
      ]
    },
    {
      id: 'foreign-merchants',
      title: "🕌 Foreign Merchant Caravan",
      description: "A caravan from the Silk Road seeks passage through your lands.",
      options: [
        { 
          text: "Tax them heavily", 
          outcome: "Great short-term wealth, but future caravans may avoid you.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, wealth: char.stats.wealth + 800, reputation: char.stats.reputation - 5 } })
        },
        { 
          text: "Offer protection", 
          outcome: "Moderate wealth and trade goods, plus improved reputation.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, wealth: char.stats.wealth + 300, reputation: char.stats.reputation + 15, intelligence: char.stats.intelligence + 5 } })
        }
      ]
    },
    {
      id: 'shaman-ritual',
      title: "✨ The Shaman's Portent",
      description: "The high shaman claims the spirits demand a great sacrifice for victory.",
      options: [
        { 
          text: "Perform the sacrifice (99 sheep)", 
          outcome: "The warriors are emboldened by divine favor.",
          effect: (char: Character) => ({ ...char, livestock: { ...char.livestock, sheep: Math.max(0, char.livestock.sheep - 99) }, stats: { ...char.stats, strength: char.stats.strength + 15, happiness: char.stats.happiness + 10 } })
        },
        { 
          text: "Reject the superstition", 
          outcome: "Save your herds, but some warriors fear the sky's wrath.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, leadership: char.stats.leadership + 10, happiness: char.stats.happiness - 15 } })
        }
      ]
    },
    {
      id: 'internal-dissent',
      title: "⚖️ A Dispute Between Families",
      description: "Two powerful families in your clan are fighting over grazing rights. It threatens to turn bloody.",
      options: [
        { 
          text: "Settle via Combat", 
          outcome: "The strong prevail. Warriors respect the tradition.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, strength: char.stats.strength + 5, reputation: char.stats.reputation + 10 } })
        },
        { 
          text: "Divide the Land Equitably", 
          outcome: "Peace is restored, but some think you are soft on rule-breakers.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, leadership: char.stats.leadership + 15, reputation: char.stats.reputation - 5 } })
        }
      ]
    },
    {
      id: 'raid-opportunity',
      title: "🐎 A Weak Frontier",
      description: "Scouts report a nearby settled kingdom has left its border town poorly guarded.",
      options: [
        { 
          text: "Launch a Lightning Raid", 
          outcome: "Quick wealth but risks retaliation and diplomatic fallout.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, wealth: char.stats.wealth + 1200, reputation: char.stats.reputation + 10, happiness: char.stats.happiness + 5 } })
        },
        { 
          text: "Demand 'Protection' Money", 
          outcome: "Smaller immediate gain, but establishes long-term dominance.",
          effect: (char: Character) => ({ ...char, stats: { ...char.stats, wealth: char.stats.wealth + 500, leadership: char.stats.leadership + 10, intelligence: char.stats.intelligence + 10 } })
        }
      ]
    }
  ];

  const getCouncilMembers = () => {
    if (!character) return [];
    
    // Council capacity grows with reputation and status
    const capacity = 3 + (character.stats.reputation > 60 ? 2 : 0) + (character.isGreatKhan ? 2 : 0);
    
    const actualMembers = character.relationships.filter(r => 
      (r.type === 'Spouse' || r.type === 'Second Wife' || r.type === 'Adult Child' || r.type === 'Trusted Warrior' || r.loyalty > 75) &&
      r.status === 'Active'
    ).slice(0, capacity).map(r => {
      let councilRole = "Advisor";
      if (r.type === 'Spouse' || r.type === 'Second Wife') {
        councilRole = "Clan Matriarch";
      } else if (r.type === 'Adult Child') {
        councilRole = "High Heir";
      } else if (r.type === 'Trusted Warrior') {
        councilRole = "Tumen Commander";
      } else if (r.loyalty >= 95) {
        councilRole = "Grand Sage";
      } else if (r.loyalty >= 85) {
        councilRole = "Elder Noyan";
      }
      return { ...r, councilRole };
    });

    const filledMembers = [...actualMembers];
    const needed = 3 - filledMembers.length;
    if (needed > 0) {
      const elderNames = ["Bökö", "Munan", "Temür", "Jörchi", "Chilaun", "Khorchi", "Kokochu", "Sorkhan", "Naya'a"];
      const elderRoles = ["Camp Elder", "Wise Shaman", "Tribe Veteran", "Horse Elder", "Spiritual Guide"];
      for (let i = 0; i < needed; i++) {
        const index = Math.abs((character.age + i) % elderNames.length);
        const roleIndex = Math.abs((character.age + i) % elderRoles.length);
        const elderName = elderNames[index];
        filledMembers.push({
          id: `elder-${i}-${character.age}`,
          name: `${elderName} Elder`,
          type: 'Camp Elder',
          status: 'Active',
          loyalty: 55 + (i * 10),
          traits: ['Wise', 'Traditional'],
          age: 60 + i * 4,
          gender: Gender.MALE,
          councilRole: elderRoles[roleIndex]
        });
      }
    }

    return filledMembers.slice(0, capacity);
  };

  const handleConveneCouncil = () => {
    if (!character) return;
    const decision = COUNCIL_DECISIONS[Math.floor(Math.random() * COUNCIL_DECISIONS.length)];
    
    // Assign preferences to council members
    const members = getCouncilMembers();
    const updatedMembers = members.map(m => {
      let preference = Math.floor(Math.random() * 2);
      let reason = "This choice seems best for the clan overall.";
      
      // Role-based logic
      if (decision.id === 'migration') {
        if (m.councilRole === 'Clan Matriarch' || m.councilRole === 'Elder Noyan') {
          preference = 1; // Southern Valley (Safety)
          reason = "Our elders and infants cannot survive another harsh winter in the north.";
        }
        if (m.councilRole === 'Tumen Commander' || m.councilRole === 'High Heir') {
          preference = 0; // Northern Steppe (Growth)
          reason = "The horses need the greenest grass if we are to wage war next year.";
        }
      } else if (decision.id === 'feast') {
        if (m.councilRole === 'Clan Matriarch' || m.councilRole === 'Elder Noyan') {
          preference = 0; // Grand Feast (Harmony)
          reason = "A feast will heal the divides in the camp and bring us together.";
        }
        if (m.councilRole === 'Grand Sage') {
          preference = 1; // Skip it (Prudence)
          reason = "Our wealth is finite. We should save for harder times ahead.";
        }
      } else if (decision.id === 'recruiting') {
        if (m.councilRole === 'Tumen Commander') {
          preference = 1; // Train Clansmen (Tradition)
          reason = "Foreign swords have no soul. We should rely on our own blood.";
        }
      } else if (decision.id === 'blood-feud') {
        if (m.councilRole === 'Tumen Commander') {
          preference = 0; // War
          reason = "Blood must be answered with blood, or we are seen as weak.";
        }
        if (m.councilRole === 'Elder Noyan') {
          preference = 1; // Wergild
          reason = "Why spend lives when we can grow rich from their gold?";
        }
      } else if (decision.id === 'succession') {
        if (m.councilRole === 'Elder Noyan' || m.councilRole === 'Clan Matriarch') {
          preference = 0; // Eldest (Traditional)
          reason = "Tradition is the glue that binds the clans together.";
        } else {
          preference = 1; // Skilled (Meritocratic)
          reason = "Only the strong can lead us through the coming storms.";
        }
      } else if (decision.id === 'shaman-ritual') {
        if (m.traits?.includes('Pious')) {
          preference = 0; // Sacrifice
          reason = "We must honor the eternal blue sky or face ruin.";
        } else {
          preference = 1; // Reject
          reason = "Sheep are more useful than smoke and chants.";
        }
      } else if (decision.id === 'foreign-merchants') {
        if (m.traits?.includes('Greedy') || m.councilRole === 'Clan Elder') {
          preference = 0; // Tax
          reason = "Their gold is better in our purses than in theirs.";
        } else {
          preference = 1; // Protect
          reason = "Long term trade brings more than simple plunder.";
        }
      }

      // Trait-based overrides or refinements
      if (m.traits?.includes('Ambitious')) {
        // Ambitious people prefer aggressive or high-reward options
        if (decision.id === 'blood-feud') { preference = 0; reason = "Strength is the only language our rivals understand."; }
        if (decision.id === 'migration') { preference = 0; reason = "Greater risks lead to greater herds."; }
      }
      if (m.traits?.includes('Wise') || m.traits?.includes('Frugal')) {
        if (decision.id === 'feast') { preference = 1; reason = "Wisdom dictates we preserve our resources."; }
      }
      if (m.traits?.includes('Brave')) {
        if (decision.id === 'blood-feud') { preference = 0; reason = "I will lead the charge myself!"; }
      }

      return {
        ...m,
        preference,
        reason
      };
    });

    setCurrentCouncilDecision({ ...decision, members: updatedMembers });
    setIsCouncilOpen(true);
  };

  const handleCouncilDecision = (optionIndex: number) => {
    if (!character || !currentCouncilDecision) return;
    
    const option = currentCouncilDecision.options[optionIndex];
    let updatedChar = option.effect(character);
    
    // Consensus detection
    const votes = [0, 0];
    currentCouncilDecision.members.forEach((m: any) => votes[m.preference]++);
    const isPopularChoice = (votes[optionIndex] > votes[optionIndex === 0 ? 1 : 0]);
    const isUnalteredConsensus = votes[optionIndex] === currentCouncilDecision.members.length;

    // Influence penalty reduction based on leadership
    // Higher leadership means people respect your decision even if they disagree
    const leadershipBonus = Math.floor(character.stats.leadership / 25); // 0 to 4 points reduction
    
    // Update loyalty of members based on if you followed their preference
    updatedChar.relationships = updatedChar.relationships.map(r => {
      const councilMember = currentCouncilDecision.members.find((cm: any) => cm.name === r.name);
      if (councilMember) {
        if (councilMember.preference === optionIndex) {
          return { ...r, loyalty: Math.min(100, r.loyalty + 10 + (isPopularChoice ? 5 : 0)) };
        } else {
          const penalty = Math.max(0, 12 - leadershipBonus);
          return { ...r, loyalty: Math.max(0, r.loyalty - penalty) };
        }
      }
      return r;
    });

    // Special gains
    if (isUnalteredConsensus) {
        updatedChar.stats.leadership = Math.min(100, updatedChar.stats.leadership + 5);
        updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 5);
    }
    if (isPopularChoice) {
        updatedChar.stats.reputation = Math.min(100, updatedChar.stats.reputation + 2);
    }

    updatedChar.history = [...updatedChar.history, { age: character.age, text: `The Clan Council convened. Final decision: ${option.text}. ${option.outcome}` }];
    updatedChar.lastCouncilYear = worldState.year;

    setCharacter(updatedChar);
    setIsCouncilOpen(false);
    setCurrentCouncilDecision(null);
  };

  const handleConveneSuccessionCouncil = () => {
    if (!character) return;
    
    // Find all eligible children/relatives that are active & alive (not Deceased), age >= 5
    const candidates = character.relationships.filter(r => 
      (r.type === 'Child' || r.type === 'Adult Child' || r.type === 'Relative') && 
      r.status === 'Active' && 
      (r.age || 0) >= 5
    );

    const members = getCouncilMembers();
    const opinions = members.map(m => {
      let favoriteId = "";
      let scoreMax = -Infinity;
      let reason = "";

      if (candidates.length > 0) {
        candidates.forEach(h => {
          let score = 0;
          const hStr = h.stats?.strength || 15;
          const hInt = h.stats?.intelligence || 15;
          const hLead = h.stats?.leadership || 15;
          const hArch = h.stats?.archery || 15;
          const hLoy = h.loyalty || 50;
          const hAge = h.age || 5;

          if (m.councilRole === 'Clan Matriarch' || m.councilRole === 'Elder Noyan' || m.councilRole === 'Camp Elder') {
            if (character.successionLaw === 'Ultimogeniture') {
              score = 100 - hAge;
            } else {
              score = hAge * 3;
            }
          } else if (m.councilRole === 'Tumen Commander' || m.councilRole === 'Tribe Veteran') {
            score = hStr * 2 + hArch;
          } else if (m.councilRole === 'Grand Sage' || m.councilRole === 'Wise Shaman' || m.councilRole === 'Spiritual Guide') {
            score = hInt * 2 + (h.stats?.perception || 15);
          } else {
            score = hLead * 2 + hLoy / 2;
          }

          if (score > scoreMax) {
            scoreMax = score;
            favoriteId = h.id || "";
          }
        });

        const favName = candidates.find(h => h.id === favoriteId)?.name || "Default";
        if (m.councilRole === 'Clan Matriarch' || m.councilRole === 'Elder Noyan' || m.councilRole === 'Camp Elder') {
          reason = `By blood and seniority, ${favName} commands my vote. We must respect the ancient ancestral lineage.`;
        } else if (m.councilRole === 'Tumen Commander' || m.councilRole === 'Tribe Veteran') {
          reason = `${favName} has iron in their grip and fire in their eyes. The warriors will ride behind high strength!`;
        } else if (m.councilRole === 'Grand Sage' || m.councilRole === 'Wise Shaman' || m.councilRole === 'Spiritual Guide') {
          reason = `${favName} possesses deep wit and wisdom. The spirits offer favor to a sharp mind.`;
        } else {
          reason = `${favName} possesses great character and leadership. They are the true successor.`;
        }
      }

      return {
        ...m,
        preferredHeirId: favoriteId,
        reason: reason || "No candidate stands ready to lead."
      };
    });

    setSuccessionCouncilOpinions(opinions);
    setIsSuccessionCouncilOpen(true);
  };

  const handleSuccessionCouncilSelectHeir = (selectedId: string) => {
    if (!character) return;
    const candidates = character.relationships.filter(r => 
      (r.type === 'Child' || r.type === 'Adult Child' || r.type === 'Relative') && 
      r.status === 'Active' && 
      (r.age || 0) >= 5
    );
    const heir = candidates.find(h => h.id === selectedId);
    if (!heir) return;

    // Determine popularity/consensus
    const totalVotes = successionCouncilOpinions.length;
    const voteCounts: Record<string, number> = {};
    successionCouncilOpinions.forEach(o => {
      if (o.preferredHeirId) {
        voteCounts[o.preferredHeirId] = (voteCounts[o.preferredHeirId] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let maxVoteId = "";
    Object.entries(voteCounts).forEach(([id, vt]) => {
      if (vt > maxVotes) {
        maxVotes = vt;
        maxVoteId = id;
      }
    });

    const isConsensusWinner = selectedId === maxVoteId;
    const votesForSelected = voteCounts[selectedId] || 0;

    let updatedChar = { ...character };
    updatedChar.heirId = selectedId;
    updatedChar.designatedHeir = heir.name;

    // Leadership bonus mitigates disappointed advisor penalty
    const leadershipBonus = Math.floor(character.stats.leadership / 25); // 0 to 4 points reduction

    // Adjust advisor loyalty based on your decision
    updatedChar.relationships = updatedChar.relationships.map(r => {
      const advisorOpinion = successionCouncilOpinions.find(ao => ao.name === r.name);
      if (advisorOpinion) {
        if (advisorOpinion.preferredHeirId === selectedId) {
          // Pleased with decision
          return { ...r, loyalty: Math.min(100, r.loyalty + 12) };
        } else {
          // Disappointed because you ignored their recommendation
          const penalty = Math.max(2, 10 - leadershipBonus);
          return { ...r, loyalty: Math.max(0, r.loyalty - penalty) };
        }
      }
      return r;
    });

    // Global bonuses or logs
    if (isConsensusWinner) {
      updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 10);
      updatedChar.stats.reputation = Math.min(100, updatedChar.stats.reputation + 10);
      updatedChar.stats.leadership = Math.min(100, updatedChar.stats.leadership + 5);
      updatedChar.history = [
        ...updatedChar.history,
        { age: character.age, text: `Following the advice of the Succession Council, you designated ${heir.name} as your heir. The clan rejoices in this shared decision.` }
      ];
    } else {
      updatedChar.stats.happiness = Math.max(0, updatedChar.stats.happiness - 5);
      updatedChar.history = [
        ...updatedChar.history,
        { age: character.age, text: `You overrode your advisors to designate ${heir.name} as successor. Some camp leaders look on with cold skepticism.` }
      ];
    }

    setCharacter(updatedChar);
    setIsSuccessionCouncilOpen(false);
    setSelectedPerson(null);

    setGenericActionResult({
      title: "Succession Council Verdict",
      subtitle: `${heir.name} Designated`,
      storySnippet: isConsensusWinner 
        ? `Following the advice of the Succession Council, you designated ${heir.name} as your heir. The clan rejoices in this shared decision.`
        : `You overrode your advisors to designate ${heir.name} as successor. Some camp leaders look on with cold skepticism.`,
      avatarUrl: heir.avatarUrl,
      effects: [
        {
          label: "👑 Successor Set",
          value: heir.name.toUpperCase(),
          isPositive: true
        },
        {
          label: "🗳️ Council Approval",
          value: isConsensusWinner ? "CONSENSUS (+10 Rep, +10 Happ)" : "DISSENT (-5 Happiness)",
          isPositive: isConsensusWinner,
          isNegative: !isConsensusWinner
        }
      ]
    });
  };

  const handleDraftSuccessionKin = () => {
    if (!character || character.stats.wealth < 300) return;

    const genGender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const candidateType = genGender === Gender.MALE ? 'Nephew' : 'Niece';
    const names = genGender === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
    const baseName = names[Math.floor(Math.random() * names.length)];
    const fullName = `${baseName} (of ${character.clan})`;
    const age = 15 + Math.floor(Math.random() * 6); // 15 to 20

    const randomTraitsList = ["Loyal", "Ambitious", "Wise", "Brave", "Pious", "Frugal", "Greedy", "Cunning", "Generous", "Fierce"];
    const traits = [
      randomTraitsList[Math.floor(Math.random() * randomTraitsList.length)],
      randomTraitsList[Math.floor(Math.random() * randomTraitsList.length)]
    ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicated

    // Standardized stats for high-kin Distant Relative
    const stats: CharacterStats = {
      health: 80 + Math.floor(Math.random() * 16),
      happiness: 75 + Math.floor(Math.random() * 21),
      appearance: 45 + Math.floor(Math.random() * 41),
      strength: 40 + Math.floor(Math.random() * 41),
      intelligence: 40 + Math.floor(Math.random() * 41),
      perception: 40 + Math.floor(Math.random() * 41),
      leadership: 35 + Math.floor(Math.random() * 41),
      loyalty: 70, // Base loyalty for adopting
      reputation: 30 + Math.floor(Math.random() * 21),
      realmReputation: 10,
      horseRiding: 45 + Math.floor(Math.random() * 36),
      archery: 40 + Math.floor(Math.random() * 41),
      wealth: 100
    };

    const newRel: Relationship = {
      id: `adopted-kin-${crypto.randomUUID()}`,
      name: fullName,
      type: 'Relative',
      loyalty: 70,
      status: 'Active',
      traits,
      clan: character.clan,
      socialClass: character.socialClass,
      age,
      gender: genGender,
      avatarUrl: getNomadAvatar(baseName, genGender, character.clan, age, undefined, character.socialClass),
      stats
    };

    const updatedChar = {
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth - 300 },
      relationships: [...character.relationships, newRel],
      history: [
        ...character.history,
        { age: character.age, text: `The council of elders searched the outer pastures and brought forward your distant kin, ${fullName}, aged ${age}, to recruit into the main family circle.` }
      ]
    };

    // Update state and immediately re-trigger the opinion calculation for the modal!
    setCharacter(updatedChar);

    // Refresh candidates & opinions list right away
    const updatedCandidates = [...updatedChar.relationships.filter(r => 
      (r.type === 'Child' || r.type === 'Adult Child' || r.type === 'Relative') && 
      r.status === 'Active' && 
      (r.age || 0) >= 5
    )];

    const members = getCouncilMembers();
    const updatedOpinions = members.map(m => {
      let favoriteId = "";
      let scoreMax = -Infinity;
      let reason = "";

      updatedCandidates.forEach(h => {
        let score = 0;
        const hStr = h.stats?.strength || 15;
        const hInt = h.stats?.intelligence || 15;
        const hLead = h.stats?.leadership || 15;
        const hArch = h.stats?.archery || 15;
        const hLoy = h.loyalty || 50;
        const hAge = h.age || 5;

        if (m.councilRole === 'Clan Matriarch' || m.councilRole === 'Elder Noyan' || m.councilRole === 'Camp Elder') {
          if (character.successionLaw === 'Ultimogeniture') {
            score = 100 - hAge;
          } else {
            score = hAge * 3;
          }
        } else if (m.councilRole === 'Tumen Commander' || m.councilRole === 'Tribe Veteran') {
          score = hStr * 2 + hArch;
        } else if (m.councilRole === 'Grand Sage' || m.councilRole === 'Wise Shaman' || m.councilRole === 'Spiritual Guide') {
          score = hInt * 2 + (h.stats?.perception || 15);
        } else {
          score = hLead * 2 + hLoy / 2;
        }

        if (score > scoreMax) {
          scoreMax = score;
          favoriteId = h.id || "";
        }
      });

      const favName = updatedCandidates.find(h => h.id === favoriteId)?.name || "Default";
      if (m.councilRole === 'Clan Matriarch' || m.councilRole === 'Elder Noyan' || m.councilRole === 'Camp Elder') {
        reason = `By blood and seniority, ${favName} commands my vote. We must respect the ancient ancestral lineage.`;
      } else if (m.councilRole === 'Tumen Commander' || m.councilRole === 'Tribe Veteran') {
        reason = `${favName} has iron in their grip and fire in their eyes. The warriors will ride behind high strength!`;
      } else if (m.councilRole === 'Grand Sage' || m.councilRole === 'Wise Shaman' || m.councilRole === 'Spiritual Guide') {
        reason = `${favName} possesses deep wit and wisdom. The spirits offer favor to a sharp mind.`;
      } else {
        reason = `${favName} possesses great character and leadership. They are the true successor.`;
      }

      return {
        ...m,
        preferredHeirId: favoriteId,
        reason
      };
    });

    setSuccessionCouncilOpinions(updatedOpinions);

    setGenericActionResult({
      title: "Succession Kin Recruited",
      subtitle: `${fullName} (Age ${age})`,
      storySnippet: `The council of elders searched the outer pastures and brought forward your distant kin, ${fullName}, aged ${age}, to recruit into the main family circle.`,
      avatarUrl: newRel.avatarUrl,
      effects: [
        {
          label: "💰 Gold Spent",
          value: "-300г",
          isNegative: true
        },
        {
          label: "👑 Bloodline Extended",
          value: `Recruited distant ${candidateType}`,
          isPositive: true
        }
      ]
    });
  };

  const getYassaLaws = () => {
    if (!character) return [];

    const hasStolenThisYear = character.history.some(h => 
      h.age === character.age && 
      (h.text.toLowerCase().includes("thievery") || h.text.toLowerCase().includes("stole") || h.text.toLowerCase().includes("stealing"))
    );
    
    const hasDesertedThisYear = character.history.some(h => 
      h.age === character.age && 
      (h.text.toLowerCase().includes("deserting") || h.text.toLowerCase().includes("desertion") || h.text.toLowerCase().includes("escaped into the mountains"))
    );

    const isWaterwayCleansed = character.waterwayCleansedAge === character.age;

    const hasGoodHospitality = character.stats.reputation >= 40 && !character.tribeRelations.some(tr => tr.level === 'At War');

    const familyRels = character.relationships.filter(r => ['Spouse', 'Father', 'Mother', 'Child', 'Adult Child'].includes(r.type));
    const avgFamilyLoyalty = familyRels.length > 0 
      ? familyRels.reduce((sum, r) => sum + r.loyalty, 0) / familyRels.length 
      : 100;
    const hasFamilyOathLoyalty = avgFamilyLoyalty >= 60;

    return [
      {
        id: 'livestock',
        name: '🐄 Theft of Livestock (Do Not Steal)',
        prohibition: 'Stealing horses, sheep, or cattle is strictly forbidden under penalty of ninefold restitution or death.',
        criteria: 'Avoid horse thievery or tribal pillaging in your youth.',
        status: hasStolenThisYear ? 'Violated' : 'Honored',
        statusText: hasStolenThisYear 
          ? '⚠️ VIOLATED! Involved in theft this year.' 
          : '📜 HONORED! Free of livestock thievery this year.',
        rewardDesc: '+60г, +15 Clan Wealth, +5 Reputation',
        rewards: { wealth: 60, clanWealth: 15, reputation: 5 }
      },
      {
        id: 'desertion',
        name: '🏹 Army Desertion (Stand Firm)',
        prohibition: 'Abandoning or fleeing the army ranks during war is a capital offense.',
        criteria: 'Avoid desertion activities during campaign years.',
        status: hasDesertedThisYear ? 'Violated' : 'Honored',
        statusText: hasDesertedThisYear 
          ? '⚠️ VIOLATED! You deserted your commander.' 
          : '📜 HONORED! Consistent service in the army ranks.',
        rewardDesc: '+120г, +8 Leadership, +5 Strength',
        rewards: { wealth: 120, leadership: 8, strength: 5 }
      },
      {
        id: 'waterway',
        name: '💧 Pure Camp Waterways (No Pollution)',
        prohibition: 'Contaminating running streams or rivers of the steppe is highly prohibited.',
        criteria: 'Maintain stream care this year (click filter stream button).',
        status: isWaterwayCleansed ? 'Honored' : 'Awaiting Action',
        statusText: isWaterwayCleansed 
          ? '📜 HONORED! Stream cleansed and camping pasture clean.' 
          : '⏳ AWAITING CARE! Waterway needs stream filtering care.',
        rewardDesc: '+15 Health, +15 Happiness, +5 Intelligence',
        rewards: { health: 15, happiness: 15, intelligence: 5 }
      },
      {
        id: 'hospitality',
        name: '🤝 Envoy Hospitality (Peaceful Guest)',
        prohibition: 'Harming or denying shelter and food to weary travelers or visiting ambassadors is forbidden.',
        criteria: 'Maintain Reputation ≥ 40 and avoid active war with neighboring tribes.',
        status: hasGoodHospitality ? 'Honored' : 'Staggering',
        statusText: hasGoodHospitality 
          ? '📜 HONORED! High hospitality standing confirmed.' 
          : '⚠️ STAGGERING! Low reputation or hostile tribal wars prevent trade.',
        rewardDesc: '+50г, +5 Intelligence, +5 Reputation',
        rewards: { wealth: 50, intelligence: 5, reputation: 5 }
      },
      {
        id: 'oath',
        name: '💍 Marital & Kin Vows (Oathkeepers)',
        prohibition: 'Betraying spouses, poisoning kinsmen, or lying to council elders invites absolute ruin.',
        criteria: 'Maintain family average loyalty ≥ 60%.',
        status: hasFamilyOathLoyalty ? 'Honored' : 'Awaiting Alignment',
        statusText: hasFamilyOathLoyalty 
          ? `📜 HONORED! Strong family alignment at ${Math.round(avgFamilyLoyalty)}% loyalty.` 
          : `⚠️ COLLAPSED! Low average family loyalty at ${Math.round(avgFamilyLoyalty)}%.`,
        rewardDesc: '+15 Happiness, +10 Family Loyalty',
        rewards: { happiness: 15, familyLoyalty: 10 }
      }
    ];
  };

  const handleCleanseWaterway = () => {
    if (!character) return;
    if (character.stats.wealth < 40) {
      setGenericActionResult({
        title: "❌ Insufficient Wealth",
        subtitle: "Water purification cost",
        storySnippet: "You do not have the 40г coins required to buy filtering fabric, hire camp boys to clear silt, and divert breeding herds away from pasture streams.",
        effects: []
      });
      return;
    }

    const updatedChar = { ...character };
    updatedChar.stats.wealth -= 40;
    updatedChar.waterwayCleansedAge = character.age;
    updatedChar.stats.health = Math.min(100, (updatedChar.stats.health || 0) + 12);
    updatedChar.stats.happiness = Math.min(100, (updatedChar.stats.happiness || 0) + 10);
    updatedChar.history = [...updatedChar.history, { age: character.age, text: "Purified camp stream pathways and organized kid sentries to divert polluting livestock." }];

    setCharacter(updatedChar);

    setGenericActionResult({
      title: "💧 Waterways Purified",
      subtitle: "Upholding Yassa Sanitary Law",
      storySnippet: "You gathered several youth to clear rotting deadwood and silt from flowing yurt streams. Campers drink securely, praising your civil wisdom.",
      effects: [
        { label: "💰 Cost", value: "-40г", isNegative: true },
        { label: "❤️ Health Recovery", value: "+12%", isPositive: true },
        { label: "😊 Happiness Boost", value: "+10%", isPositive: true },
        { label: "⚖️ Condition Secured", value: "Waterways Cleanse Honored!", isPositive: true }
      ]
    });
  };

  const handleClaimYassaBlessings = () => {
    if (!character) return;

    if (character.age === (character.lastYassaClaimedAge ?? -1)) {
      setGenericActionResult({
        title: "⏳ Blessings Already Claimed",
        subtitle: "Tengri has logged your deeds",
        storySnippet: `You have already claimed your Yassa compliance rewards at age ${character.age}. Age up one year to allow reporting on state law again.`,
        effects: []
      });
      return;
    }

    const laws = getYassaLaws();
    const honoredLaws = laws.filter(l => l.status === 'Honored');

    if (honoredLaws.length === 0) {
      setGenericActionResult({
        title: "⚙️ No Laws Complied",
        subtitle: "Yassa Compliance 0%",
        storySnippet: "Your actions this year completely violated the codes of the steppe. The elders refuse to distribute standard communal rewards.",
        effects: []
      });
      return;
    }

    const updatedChar = { ...character };
    let wealthAward = 0;
    let clanWealthAward = 0;
    let repAward = 0;
    let leadAward = 0;
    let strAward = 0;
    let hpAward = 0;
    let hapAward = 0;
    let intAward = 0;
    let familyLoyaltyAward = 0;

    honoredLaws.forEach(law => {
      if (law.rewards.wealth) wealthAward += law.rewards.wealth;
      if (law.rewards.clanWealth) clanWealthAward += law.rewards.clanWealth;
      if (law.rewards.reputation) repAward += law.rewards.reputation;
      if (law.rewards.leadership) leadAward += law.rewards.leadership;
      if (law.rewards.strength) strAward += law.rewards.strength;
      if (law.rewards.health) hpAward += law.rewards.health;
      if (law.rewards.happiness) hapAward += law.rewards.happiness;
      if (law.rewards.intelligence) intAward += law.rewards.intelligence;
      if (law.rewards.familyLoyalty) familyLoyaltyAward += law.rewards.familyLoyalty;
    });

    updatedChar.stats.wealth += wealthAward;
    updatedChar.clanWealth = Math.max(0, updatedChar.clanWealth + clanWealthAward);
    updatedChar.stats.reputation = Math.min(100, (updatedChar.stats.reputation || 0) + repAward);
    updatedChar.stats.leadership = Math.min(100, (updatedChar.stats.leadership || 0) + leadAward);
    updatedChar.stats.strength = Math.min(100, (updatedChar.stats.strength || 0) + strAward);
    updatedChar.stats.health = Math.min(100, (updatedChar.stats.health || 0) + hpAward);
    updatedChar.stats.happiness = Math.min(100, (updatedChar.stats.happiness || 0) + hapAward);
    updatedChar.stats.intelligence = Math.min(100, (updatedChar.stats.intelligence || 0) + intAward);

    if (familyLoyaltyAward > 0) {
      updatedChar.relationships = updatedChar.relationships.map(r => {
        if (['Spouse', 'Father', 'Mother', 'Child', 'Adult Child'].includes(r.type)) {
          return { ...r, loyalty: Math.min(100, r.loyalty + familyLoyaltyAward) };
        }
        return r;
      });
    }

    updatedChar.lastYassaClaimedAge = character.age;
    const namesList = honoredLaws.map(l => l.name.replace(/[^a-zA-Z\s]/g, '').trim()).join(', ');
    updatedChar.history = [
      ...updatedChar.history,
      { 
        age: character.age, 
        text: `⚖️ Adhered to Great Yassa prohibitions: ${namesList}. Claimed blessings.` 
      }
    ];

    setCharacter(updatedChar);

    const effects = [
      { label: "⚖️ Honored Laws", value: `${honoredLaws.length} / 5`, isPositive: true }
    ];
    if (wealthAward > 0) effects.push({ label: "💰 Gold Claimed", value: `+${wealthAward}г`, isPositive: true });
    if (clanWealthAward > 0) effects.push({ label: "🏰 Clan Treasury", value: `+${clanWealthAward}г`, isPositive: true });
    if (repAward > 0) effects.push({ label: "⭐ Reputation", value: `+${repAward}%`, isPositive: true });
    if (leadAward > 0) effects.push({ label: "🏹 Leadership", value: `+${leadAward}%`, isPositive: true });
    if (hpAward > 0) effects.push({ label: "❤️ Health Recovery", value: `+${hpAward}%`, isPositive: true });
    if (hapAward > 0) effects.push({ label: "😊 Happiness Boost", value: `+${hapAward}%`, isPositive: true });
    if (intAward > 0) effects.push({ label: "🧠 Intelligence", value: `+${intAward}%`, isPositive: true });
    if (familyLoyaltyAward > 0) effects.push({ label: "💍 Family Alignment", value: `+${familyLoyaltyAward}%`, isPositive: true });

    setGenericActionResult({
      title: "⚖️ Great Yassa Blessings",
      subtitle: `Annual Law Compliance Blessing (Age ${character.age})`,
      storySnippet: `By following the Great Khagan's laws, your reputation and physical/spiritual strength is fortified by the Blue Sky. You have complied with: ${namesList}.`,
      effects
    });
  };

  const handleClanAction = (action: 'Contribute' | 'Invest-Feast' | 'Invest-Guard' | 'Invest-Stock' | 'Great-Naadam' | 'Tribal-Feast') => {
    if (!character) return;

    let updatedChar = { ...character };
    let storyStr = "";

    if (action === 'Contribute') {
       const amount = 100;
       if (updatedChar.stats.wealth >= amount) {
         updatedChar.stats.wealth -= amount;
         updatedChar.clanWealth += amount;
         updatedChar.stats.reputation += 10;
         updatedChar.stats.loyalty += 5;
         storyStr = `You contributed ${amount} coins to the ${character.clan} Clan Treasury. The elders are pleased with your generosity.`;
       } else {
         return; // Not enough money
       }
    } else if (action === 'Invest-Feast') {
       const cost = 500;
       if (updatedChar.clanWealth >= cost) {
         updatedChar.clanWealth -= cost;
         updatedChar.stats.reputation += 15;
         updatedChar.stats.happiness += 10;
         updatedChar.relationships = updatedChar.relationships.map(r => ({ ...r, loyalty: Math.min(100, r.loyalty + 5) }));
         storyStr = `The ${character.clan} clan shared a modest feast. Spirits are lifted.`;
       }
    } else if (action === 'Tribal-Feast') {
       const cost = 1200;
       if (updatedChar.clanWealth >= cost) {
         updatedChar.clanWealth -= cost;
         updatedChar.stats.reputation += 35;
         updatedChar.stats.happiness += 25;
         updatedChar.stats.leadership += 10;
         updatedChar.relationships = updatedChar.relationships.map(r => ({ ...r, loyalty: Math.min(100, r.loyalty + 15) }));
         storyStr = `A grand Tribal Feast was held in your honor. The ${character.clan} clan feels more united than ever!`;
       }
    } else if (action === 'Great-Naadam') {
       const cost = 2500;
       if (updatedChar.clanWealth >= cost) {
         updatedChar.clanWealth -= cost;
         updatedChar.stats.reputation += 50;
         updatedChar.stats.happiness += 30;
         updatedChar.stats.leadership += 20;
         updatedChar.relationships = updatedChar.relationships.map(r => ({ ...r, loyalty: Math.min(100, r.loyalty + 25) }));
         storyStr = `You convened a Great Naadam for the entire tribal coalition. Thousands of warriors wrestled and raced in your honor. Your name is legends.`;
       }
    } else if (action === 'Invest-Guard') {
       const cost = 300;
       if (updatedChar.clanWealth >= cost) {
         updatedChar.clanWealth -= cost;
         updatedChar.stats.health += 10;
         updatedChar.stats.leadership += 5;
         storyStr = `Hired elite Kheshig guards to protect the clan's elders and children. The camp feels safer.`;
       }
    } else if (action === 'Invest-Stock') {
       const cost = 1000;
       if (updatedChar.clanWealth >= cost) {
         updatedChar.clanWealth -= cost;
         // Potential long term returns or assets
         updatedChar.stats.wealth += 200; // Small immediate return
         storyStr = `Invested in a massive new herd of cattle and horses for the collective. Prosperity flows to the clan.`;
       }
    }

    if (storyStr) {
      updatedChar.history = [...updatedChar.history, { age: updatedChar.age, text: storyStr }];
      setCharacter(updatedChar);
    }
  };

  const handleSwitchPath = (branchId: string, entryRole: string) => {
    if (!character) return;
    const switchCost = 100;
    if (character.stats.wealth < switchCost) {
      setGenericActionResult({
        title: "❌ Insufficient Gold",
        subtitle: "Career transition has fees",
        storySnippet: `You need at least ${switchCost}г to establish credentials and purchase toolkits to cross-train into the ${entryRole} vocation.`,
        effects: []
      });
      return;
    }

    if (character.role === entryRole) {
      setGenericActionResult({
        title: "⛺ Already in this Vocation",
        subtitle: "No transition needed",
        storySnippet: `You are already starting out as a ${entryRole}.`,
        effects: []
      });
      return;
    }

    let updatedChar = { ...character };
    updatedChar.stats.wealth -= switchCost;
    updatedChar.role = entryRole;
    updatedChar.history = [
      ...updatedChar.history,
      { age: updatedChar.age, text: `Sought a new destiny on the open plains: transitioned career path to become a ${entryRole}.` }
    ];

    const merchantRoles = [
      'Apprentice Trader',
      'Caravan Guard',
      'Merchant',
      'Caravan Master',
      'Guild Master',
      'Merchant Prince'
    ];

    const blacksmithRoles = [
      'Apprentice Blacksmith',
      'Journeyman Smith',
      'Master Smith',
      'Royal Armorer',
      'Apprentice Bowyer',
      'Bowyer',
      'Master Bowyer',
      'Master of the Arsenal',
      'Master Smith or Bowyer'
    ];

    let businessOwnerAlert = "";
    if (merchantRoles.includes(entryRole) || blacksmithRoles.includes(entryRole)) {
      const baseWorkshops = updatedChar.workshops || [
        {
          id: 'ws-dairy',
          name: 'Dairy Fermentation Ger',
          type: 'Dairy',
          level: 0,
          passiveIncome: 30,
          costToUpgrade: 150,
          description: 'Process sheep, horse, and yak milk into Aaruul (dried cheese curd) and Airag.'
        },
        {
          id: 'ws-saddle',
          name: 'Saddle & Leather Workshop',
          type: 'Saddle',
          level: 0,
          passiveIncome: 50,
          costToUpgrade: 250,
          description: 'Craft sturdy horse saddles, tethers, leather boots, and winter coats.'
        },
        {
          id: 'ws-forge',
          name: 'Iron Weaponry Forge',
          type: 'Forge',
          level: 0,
          passiveIncome: 80,
          costToUpgrade: 400,
          description: 'Forge flexible steel sabers, battle spears, and armor-piercing arrows.'
        },
        {
          id: 'ws-weaving',
          name: 'Carpet & Wool Loom',
          type: 'Weaving',
          level: 0,
          passiveIncome: 65,
          costToUpgrade: 320,
          description: 'Weave warm wool carpets, felt wall insulation, and ornamental silk belts.'
        }
      ];

      updatedChar.workshops = baseWorkshops.map(ws => {
        if (ws.level === 0) {
          return {
            ...ws,
            level: 1,
            passiveIncome: Math.floor(ws.passiveIncome * 1.5),
            costToUpgrade: Math.floor(ws.costToUpgrade * 1.8)
          };
        }
        return ws;
      }) as any[];

      const isMerchant = merchantRoles.includes(entryRole);
      const professionName = isMerchant ? "худалдаачин" : "дархан";
      const professionEng = isMerchant ? "Merchant" : "Blacksmith";

      businessOwnerAlert = ` 💼 Та ${professionName} мэргэжлийг сонгосон тул шууд БИЗНЕС ЭРХЛЭГЧ боллоо! Таны зуслан дахь бүх урлангууд ашиглалтад орж, идэвхтэй ажиллаж эхэллээ. (By choosing the ${professionEng} profession, you have immediately become a BUSINESS OWNER! All workshops in your camp are now established and active.)`;
      updatedChar.history.push({
        age: updatedChar.age,
        text: `💼 Became a business owner! All 4 nomadic workshops have been immediately established at Level 1.`
      });
    }

    // Generate workplace colleagues
    const colleagueCount = Math.random() < 0.6 ? 1 : 2;
    const addedColleagues: Relationship[] = [];
    for (let c = 0; c < colleagueCount; c++) {
      const colleague = generateWorkplaceColleague(entryRole, updatedChar.age);
      updatedChar.relationships.push(colleague);
      addedColleagues.push(colleague);
      updatedChar.history.push({
        age: updatedChar.age,
        text: `Met ${colleague.name} ${colleague.clan}, who is serving as your ${colleague.type} in your new role as ${entryRole}.`
      });
    }

    // Recalculate military power if switching into or out of combat
    const milData = calculateMilitaryPower(updatedChar);
    updatedChar.militaryPower = milData.power;
    updatedChar.hordeSize = milData.soldiers;

    setCharacter(updatedChar);

    const colleagueNames = addedColleagues.map(c => `${c.name} (${c.type})`).join(", ");

    setGenericActionResult({
      title: "⛩️ Career Retraining Complete",
      subtitle: `New Calling: ${entryRole}`,
      storySnippet: `You spent ${switchCost}г on apprenticeship supplies, and secured a license to join the ranks of the local ${entryRole} guild. Your path changes, and you meet new work people: ${colleagueNames}!${businessOwnerAlert}`,
      effects: [
         { label: "💰 Cost", value: `-${switchCost}г`, isNegative: true },
         { label: "📋 New Role", value: entryRole, isPositive: true },
         { label: "👥 Colleagues", value: `+${addedColleagues.length}`, isPositive: true },
         ...(businessOwnerAlert ? [{ label: "🏭 Workshops", value: "All Built (Lvl 1)", isPositive: true }] : [])
      ]
    });
  };

  const handleCareerAction = (branchId: string) => {
    if (!character) return;
    const branch = CAREER_BRANCHES.find(b => b.id === branchId);
    if (!branch) return;

    const action = branch.action;
    if (character.stats.wealth < action.cost) {
      setGenericActionResult({
        title: "❌ Insufficient Gold",
        subtitle: "Cannot perform vocation duties",
        storySnippet: `You need at least ${action.cost}г to buy ingredients, rations, or supplies to organize this action.`,
        effects: []
      });
      return;
    }

    let updatedChar = { ...character };
    updatedChar.stats.wealth -= action.cost;

    // Apply stat changes
    const effectsList: { label: string, value: any, isPositive?: boolean, isNegative?: boolean }[] = [
      { label: "💰 Duty Cost", value: `-${action.cost}г`, isNegative: true }
    ];

    if (action.effects) {
      const stats = { ...updatedChar.stats };
      Object.entries(action.effects).forEach(([stat, val]) => {
        const key = stat as keyof CharacterStats;
        if (stats[key] !== undefined) {
          stats[key] = Math.min(100, (stats[key] || 0) + val);
          effectsList.push({
            label: `✨ ${stat.toUpperCase()}`,
            value: `+${val}%`,
            isPositive: true
          });
        }
      });
      updatedChar.stats = stats;
    }

    // Special behavior flavor chances!
    let specialSuccessText = "";
    if (branchId === 'Nomad') {
      const roll = Math.random();
      if (roll < 0.25) {
        if (!updatedChar.livestock) {
          updatedChar.livestock = { horses: 0, sheep: 0, cattle: 0, goats: 0, yaks: 0, camels: 0 };
        }
        updatedChar.livestock.sheep = (updatedChar.livestock.sheep || 0) + 1;
        specialSuccessText = " While driving the flock, you discovered a stray ewe and added it to your herd!";
        effectsList.push({ label: "🐑 Seized", value: "+1 Sheep", isPositive: true });
      }
    } else if (branchId === 'Trade') {
      const roll = Math.random();
      if (roll < 0.3) {
        const bonusGold = 60 + Math.floor(Math.random() * 80);
        updatedChar.stats.wealth += bonusGold;
        specialSuccessText = ` Your clever price arbitrage paid off richly: you pocketed an additional ${bonusGold}г in coin margins!`;
        effectsList.push({ label: "💰 Bonus Profit", value: `+${bonusGold}г`, isPositive: true });
      }
    } else if (branchId === 'Equerry') {
      const roll = Math.random();
      if (roll < 0.2) {
        if (!updatedChar.livestock) {
          updatedChar.livestock = { horses: 0, sheep: 0, cattle: 0, goats: 0, yaks: 0, camels: 0 };
        }
        updatedChar.livestock.horses = (updatedChar.livestock.horses || 0) + 1;
        specialSuccessText = " You successfully gentled a magnificent, wild black stallion who took to your care immediately!";
        effectsList.push({ label: "🐎 Broken Horse", value: "+1 Horse", isPositive: true });
      }
    } else if (branchId === 'Crafts') {
      const roll = Math.random();
      if (roll < 0.15) {
        specialSuccessText = " Your metallurgical balance was so sterling that you forged an exquisite, razor-sharp steel dagger for your personal collection.";
        effectsList.push({ label: "⚔️ Armament", value: "+1 Steel Dagger", isPositive: true });
      }
    } else if (branchId === 'Falconry') {
      const roll = Math.random();
      if (roll < 0.2) {
        const bonusFurs = 120;
        updatedChar.stats.wealth += bonusFurs;
        specialSuccessText = ` Your bird effortlessly downed a rare white Arctic falcon during the woodland pass, yielding fine furs worth ${bonusFurs}г.`;
        effectsList.push({ label: "💰 Trapping Spoils", value: `+${bonusFurs}г`, isPositive: true });
      }
    } else if (branchId === 'Spiritual') {
      const roll = Math.random();
      if (roll < 0.3) {
        updatedChar.stats.health = Math.min(100, updatedChar.stats.health + 10);
        specialSuccessText = " The sacrificial smoke infuses your lungs with sacred mountain ash, purifying your breath.";
        effectsList.push({ label: "❤️ Divine Healing", value: "+10% Health", isPositive: true });
      }
    }

    // Recalculate military power if switching into or out of combat
    const milData = calculateMilitaryPower(updatedChar);
    updatedChar.militaryPower = milData.power;
    updatedChar.hordeSize = milData.soldiers;

    updatedChar.history = [
      ...updatedChar.history,
      { age: updatedChar.age, text: `${action.name}: ${action.successMsg}${specialSuccessText}` }
    ];

    setCharacter(updatedChar);

    setGenericActionResult({
      title: action.name,
      subtitle: "Professional Duty Conducted",
      storySnippet: `${action.successMsg}${specialSuccessText}`,
      effects: effectsList
    });
  };

  const handleWarriorAction = (action: 'Recruit' | 'Train' | 'UpgradeGear' | 'Feast' | 'Patrol') => {
    if (!character) return;

    let updatedChar = { ...character };
    let storyTitle = "";
    let storySub = "";
    let storyText = "";
    let effects: { label: string, value: string, isPositive?: boolean, isNegative?: boolean }[] = [];

    // Initialize custom warrior attributes if they don't exist
    if (updatedChar.customRecruitedSoldiers === undefined) updatedChar.customRecruitedSoldiers = 0;
    if (updatedChar.warriorTraining === undefined) updatedChar.warriorTraining = 40;
    if (updatedChar.warriorEquipmentLevel === undefined) updatedChar.warriorEquipmentLevel = 1;
    if (updatedChar.warriorMorale === undefined) updatedChar.warriorMorale = 75;

    if (action === 'Recruit') {
      const cost = 120;
      if (updatedChar.stats.wealth < cost) {
        setGenericActionResult({
          title: "❌ Insufficient Gold",
          subtitle: "Recruitment is costly",
          storySnippet: `You need at least ${cost}г to recruit new horse-riding warriors. Earn gold by trading or age up.`,
          effects: []
        });
        return;
      }
      updatedChar.stats.wealth -= cost;
      updatedChar.customRecruitedSoldiers += 30;
      updatedChar.stats.reputation = Math.min(100, (updatedChar.stats.reputation || 0) + 5);
      
      storyTitle = "⚔️ Horsemen Recruited";
      storySub = "Strengthening the Horde";
      storyText = "You rode from yurt to yurt, displaying your silk banners and promising glory. Thirty young nomads swore their bows to your vanguard.";
      effects = [
        { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
        { label: "⚔️ Warriors Recruited", value: "+30", isPositive: true },
        { label: "⭐ Reputation", value: "+5%", isPositive: true }
      ];
    } 
    else if (action === 'Train') {
      const cost = 50;
      if (updatedChar.stats.wealth < cost) {
        setGenericActionResult({
          title: "❌ Insufficient Gold",
          subtitle: "Supplies needed for drills",
          storySnippet: `You need at least ${cost}г to organize intensive combat and horse-archery training exercises.`,
          effects: []
        });
        return;
      }
      updatedChar.stats.wealth -= cost;
      updatedChar.warriorTraining = Math.min(100, updatedChar.warriorTraining + 15);
      updatedChar.stats.archery = Math.min(100, (updatedChar.stats.archery || 0) + 4);
      updatedChar.stats.horseRiding = Math.min(100, (updatedChar.stats.horseRiding || 0) + 3);
      updatedChar.stats.strength = Math.min(100, (updatedChar.stats.strength || 0) + 2);

      storyTitle = "🎯 Training Drills Conducted";
      storySub = "Sweat saves Blood";
      storyText = "You organized archery tournaments and fast-riding scouts drills. The camp thundered with hooves, honing your horde's collective skill.";
      effects = [
        { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
        { label: "🏹 Training Level", value: "+15%", isPositive: true },
        { label: "🎯 Archery", value: "+4%", isPositive: true },
        { label: "🐎 Riding & Strength", value: "+5%", isPositive: true }
      ];
    }
    else if (action === 'UpgradeGear') {
      if (updatedChar.warriorEquipmentLevel >= 5) {
        setGenericActionResult({
          title: "⚔️ Peak Equipment Level",
          subtitle: "Armory fully maxed out",
          storySnippet: "Your horde is already armed with Golden Kheshig Elite steel plate and heavy composite lances. No further upgrades possible.",
          effects: []
        });
        return;
      }
      const cost = 250;
      if (updatedChar.stats.wealth < cost) {
        setGenericActionResult({
          title: "❌ Insufficient Gold",
          subtitle: "Iron and bowyers are premium",
          storySnippet: `You need at least ${cost}г to order high-quality sabers, ringed chainmail, and laminated sinew-bows from master blacksmiths.`,
          effects: []
        });
        return;
      }
      updatedChar.stats.wealth -= cost;
      updatedChar.warriorEquipmentLevel += 1;

      const gearNames = ["Default Ragged Furs", "Hardened Leather Vests", "Lamellar Steel Plates", "Iron Barding & Lances", "Golden Kheshig Elite Armor"];
      const currentGear = gearNames[updatedChar.warriorEquipmentLevel - 1];

      storyTitle = "🛡️ Horde Armaments Cleansed";
      storySub = `Horde Gear Upgraded to: ${currentGear}`;
      storyText = `You commissioned local silversmiths and armorers to forge superior protective coats. Your riders look intimidating.`;
      effects = [
        { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
        { label: "🛡️ Armaments Level", value: `${updatedChar.warriorEquipmentLevel} / 5`, isPositive: true }
      ];
    }
    else if (action === 'Feast') {
      const cost = 80;
      if (updatedChar.stats.wealth < cost) {
        setGenericActionResult({
          title: "❌ Insufficient Gold",
          subtitle: "Meat & Kumis require spending",
          storySnippet: "Providing enough whole-roasted mutton and fermented mare's milk to feed your warriors takes at least 80г.",
          effects: []
        });
        return;
      }
      updatedChar.stats.wealth -= cost;
      updatedChar.warriorMorale = Math.min(100, updatedChar.warriorMorale + 20);
      updatedChar.stats.happiness = Math.min(100, (updatedChar.stats.happiness || 0) + 12);
      
      storyTitle = "🍖 Feast with the Commanders";
      storySub = "Brothers in Arms";
      storyText = "You shared roasted meats, played the horse-head fiddle, and raised wooden bowls of kumis with your commanders. Brotherhood of the bows is renewed!";
      effects = [
        { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
        { label: "🔥 Morale Boost", value: "+20%", isPositive: true },
        { label: "😊 Happiness Boost", value: "+12%", isPositive: true }
      ];
    }
    else if (action === 'Patrol') {
      const cost = 30;
      if (updatedChar.stats.wealth < cost) {
        setGenericActionResult({
          title: "❌ Insufficient Gold",
          subtitle: "Saddlebags and rations cost",
          storySnippet: "To dispatch scouting networks along the ranges and valleys, you need 30г to cover rations and scout horses feed.",
          effects: []
        });
        return;
      }
      updatedChar.stats.wealth -= cost;
      updatedChar.stats.reputation = Math.min(100, (updatedChar.stats.reputation || 0) + 3);
      updatedChar.stats.leadership = Math.min(100, (updatedChar.stats.leadership || 0) + 2);

      const roll = Math.random();
      if (roll < 0.4) {
        storyTitle = "🐎 Peaceful Borders Secured";
        storySub = "A quiet day on the steppe";
        storyText = "The scouts patrolled the mountain lines. No rustlers or wolves were spotted. Campers graze their herds in supreme tranquility.";
        effects = [
          { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
          { label: "⭐ Reputation", value: "+3%", isPositive: true },
          { label: "👑 Leadership", value: "+2%", isPositive: true }
        ];
      } else if (roll < 0.70) {
        const goldGain = 120 + Math.floor(Math.random() * 80);
        updatedChar.stats.wealth += goldGain;
        if (updatedChar.livestock === undefined) {
          updatedChar.livestock = { horses: 0, sheep: 0, cattle: 0, goats: 0, yaks: 0, camels: 0 };
        }
        updatedChar.livestock.horses = (updatedChar.livestock.horses || 0) + 2;

        storyTitle = "🏹 Rustlers Intercepted!";
        storySub = "Guardians of the Herds";
        storyText = `Your patrol cornered a bandit squad attempting to drive off clan horses. In the ensuing clash, your riders routed them, seizing their plunder!`;
        effects = [
          { label: "💰 Net Outcome", value: `+${goldGain - cost}г`, isPositive: true },
          { label: "🐎 Seized Mounts", value: "+2 Horses", isPositive: true },
          { label: "⭐ Reputation", value: "+6%", isPositive: true }
        ];
      } else if (roll < 0.90) {
        if (updatedChar.livestock === undefined) {
          updatedChar.livestock = { horses: 0, sheep: 0, cattle: 0, goats: 0, yaks: 0, camels: 0 };
        }
        updatedChar.livestock.horses = (updatedChar.livestock.horses || 0) + 1;
        updatedChar.livestock.sheep = (updatedChar.livestock.sheep || 0) + 4;

        storyTitle = "🐑 Stray Herd Retrieved";
        storySub = "Blessings of the Valleys";
        storyText = "Your scouts discovered stray livestock grazing deep in a dry ravine. They successfully corralled them back into the clan pastures.";
        effects = [
          { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
          { label: "🐎 Corralled Horses", value: "+1 Horse", isPositive: true },
          { label: "🐑 Corralled Sheep", value: "+4 Sheep", isPositive: true }
        ];
      } else {
        const lostSoldiers = 5;
        updatedChar.customRecruitedSoldiers = Math.max(0, (updatedChar.customRecruitedSoldiers ?? 0) - lostSoldiers);
        updatedChar.stats.reputation = Math.min(100, (updatedChar.stats.reputation || 0) + 10);
        updatedChar.stats.leadership = Math.min(100, (updatedChar.stats.leadership || 0) + 6);

        storyTitle = "⚔️ Border Clashes!";
        storySub = "Bravery under Fire";
        storyText = `A fierce skirmish erupted against a rival clan's heavy cavalry at the river crossing. Your scouts fought valiantly to hold the line. Five riders were slain, but the homeland was defended.`;
        effects = [
          { label: "💰 Cost", value: `-${cost}г`, isNegative: true },
          { label: "💀 Casualties", value: `-${lostSoldiers} Warriors`, isNegative: true },
          { label: "⭐ Reputation", value: "+10%", isPositive: true },
          { label: "👑 Leadership", value: "+6%", isPositive: true }
        ];
      }
    }

    const milData = calculateMilitaryPower(updatedChar);
    updatedChar.militaryPower = milData.power;
    updatedChar.hordeSize = milData.soldiers;

    updatedChar.history = [
      ...updatedChar.history,
      { age: updatedChar.age, text: `${storyTitle} (${storySub}): ${storyText}` }
    ];

    setCharacter(updatedChar);

    setGenericActionResult({
      title: storyTitle,
      subtitle: storySub,
      storySnippet: storyText,
      effects
    });
  };

  const handleBuyAsset = (item: Character['availableMarketItems'][0]) => {
    if (!character || character.stats.wealth < item.price) return;

    // Coins / Haptics feedback
    playCoinSound(settings.sound);
    triggerVibration(45, settings.vibration);

    const newAsset: Asset = {
      id: `${item.originalId}-${Date.now()}`,
      name: item.name,
      type: item.type as any,
      value: item.basePrice || item.price,
      quality: item.quality,
    };

    if (item.type === 'Horse') {
      newAsset.stats = {
        speed: Math.floor(30 + (item.quality * 0.7)),
        loyalty: 50 + Math.floor(Math.random() * 20),
        attackBonus: Math.floor(item.quality / 10),
        defenseBonus: Math.floor(item.quality / 15),
      };
    }

    const prevStats = { ...character.stats };
    const updatedChar = {
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth - item.price },
      assets: [...character.assets, newAsset],
      history: [...character.history, { age: character.age, text: `Purchased a ${item.name} for ${item.price}г at the tribal market.` }]
    };

    // Vision Item Bonuses
    if (item.originalId === 'm_eagle') updatedChar.visionBonus = (updatedChar.visionBonus || 0) + 20;
    if (item.originalId === 'm_falcon') updatedChar.visionBonus = (updatedChar.visionBonus || 0) + 8;
    if (item.originalId === 'm_spyglass') updatedChar.visionBonus = (updatedChar.visionBonus || 0) + 15;
    if (item.originalId === 'm_persian_map') {
      updatedChar.visionBonus = (updatedChar.visionBonus || 0) + 25;
      updatedChar.stats.intelligence = Math.min(100, updatedChar.stats.intelligence + 10);
      updatedChar.stats.perception = Math.min(100, updatedChar.stats.perception + 5);
    }
    if (item.originalId === 'm_chinese_gown') {
      updatedChar.stats.reputation = Math.min(100, updatedChar.stats.reputation + 15);
      updatedChar.stats.realmReputation = Math.min(100, updatedChar.stats.realmReputation + 5);
      updatedChar.stats.appearance = Math.min(100, updatedChar.stats.appearance + 10);
    }
    if (item.originalId === 'm_statue') {
      updatedChar.stats.realmReputation = Math.min(100, updatedChar.stats.realmReputation + 10);
      updatedChar.stats.intelligence = Math.min(100, updatedChar.stats.intelligence + 5);
    }
    if (item.originalId === 'm_gold_jewelry') {
      updatedChar.stats.reputation = Math.min(100, updatedChar.stats.reputation + 10);
      updatedChar.stats.realmReputation = Math.min(100, updatedChar.stats.realmReputation + 3);
    }
    if (item.originalId === 'm_rhino_horn') {
      updatedChar.stats.health = Math.min(100, updatedChar.stats.health + 15);
      updatedChar.stats.realmReputation = Math.min(100, updatedChar.stats.realmReputation + 2);
    }
    if (item.originalId === 'm_obsidian_blade') {
      updatedChar.stats.strength = Math.min(100, updatedChar.stats.strength + 5);
      updatedChar.stats.archery = Math.min(100, updatedChar.stats.archery + 3);
    }
    if (item.originalId === 'm_iron_stove') {
      updatedChar.stats.health = Math.min(100, updatedChar.stats.health + 8);
      updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 5);
    }
    if (item.originalId === 'm_silver_mirror') {
      updatedChar.stats.appearance = Math.min(100, updatedChar.stats.appearance + 12);
    }
    if (item.originalId === 'm_ivory_chess') {
      updatedChar.stats.intelligence = Math.min(100, updatedChar.stats.intelligence + 15);
    }

    setCharacter(updatedChar);

    const postStats = { ...updatedChar.stats };
    const effectsList: {
      label: string;
      value: string | number;
      isPositive?: boolean;
      isNegative?: boolean;
    }[] = [
      {
        label: "💰 Wealth",
        value: `-${item.price}г`,
        isNegative: true
      }
    ];

    Object.keys(postStats).forEach(ky => {
      const key = ky as keyof typeof postStats;
      const before = prevStats[key] || 0;
      const after = postStats[key] || 0;
      const diff = after - before;
      if (diff !== 0 && key !== 'wealth') {
        const statLabel = key === 'happiness' ? '😊 Happiness' :
                          key === 'health' ? '❤️ Health' :
                          key === 'reputation' ? '📈 Reputation' :
                          key === 'realmReputation' ? '👑 Realm Influence' :
                          key === 'strength' ? '💪 Strength' :
                          key === 'intelligence' ? '🧠 Intelligence' :
                          key === 'perception' ? '👁️ Perception' :
                          key === 'leadership' ? '👑 Chieftain Leadership' :
                          key === 'horseRiding' ? '🐎 Horse Riding' :
                          key === 'archery' ? '🏹 Archery' : String(key);
        effectsList.push({
          label: statLabel,
          value: diff > 0 ? `+${diff}` : `${diff}`,
          isPositive: diff > 0,
          isNegative: diff < 0
        });
      }
    });

    setGenericActionResult({
      title: "Market Purchase",
      subtitle: item.name,
      storySnippet: `You purchased a ${item.name} for ${item.price}г at the tribal market. It is added to your personal assets.`,
      effects: effectsList
    });
  };

  const handleSellAsset = (assetId: string) => {
    if (!character) return;

    const assetToSell = character.assets.find(a => a.id === assetId);
    if (!assetToSell) return;

    // Resale value is 70% of base value, adjusted by market conditions
    const multipliers = MARKET_MULTIPLIERS[character.marketCondition] || MARKET_MULTIPLIERS.Stable;
    const sellValue = Math.floor(assetToSell.value * 0.7 * multipliers.sell);

    const updatedAssets = character.assets.filter(a => a.id !== assetId);
    
    const updatedChar = {
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth + sellValue },
      assets: updatedAssets,
      history: [...character.history, { age: character.age, text: `Sold your ${assetToSell.name} for ${sellValue}г.` }]
    };

    // Remove vision bonuses if the item provided them
    if (assetId.startsWith('m_eagle')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 20);
    if (assetId.startsWith('m_falcon')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 8);
    if (assetId.startsWith('m_spyglass')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 15);
    if (assetId.startsWith('m_persian_map')) updatedChar.visionBonus = Math.max(0, (updatedChar.visionBonus || 0) - 25);

    setCharacter(updatedChar);

    setGenericActionResult({
      title: "Market Sale",
      subtitle: assetToSell.name,
      storySnippet: `You have negotiated with a trader and sold your ${assetToSell.name} for ${sellValue}г.`,
      effects: [
        {
          label: "💰 Wealth",
          value: `+${sellValue}г`,
          isPositive: true
        },
        {
          label: `📦 Assets Removed`,
          value: assetToSell.name,
          isNegative: true
        }
      ]
    });
  };

  const handleDesignateHeir = (relId: string) => {
    if (!character) return;
    const heir = character.relationships.find(r => r.id === relId);
    if (!heir) return;

    // Check suitability
    if (heir.status === 'Deceased') {
      const updatedChar = {
        ...character,
        history: [...character.history, { age: character.age, text: `You cannot designate ${heir.name} as heir. Their spirit has already departed to the Eternal Sky.` }]
      };
      setCharacter(updatedChar);
      setGenericActionResult({
        title: "Designation Blocked",
        subtitle: `${heir.name} (${heir.type})`,
        storySnippet: `You cannot designate ${heir.name} as heir. Their spirit has already departed to the Eternal Sky.`,
        effects: [
          {
            label: "👑 Succession Status",
            value: "BLOCKED (DECEASED)",
            isNegative: true
          }
        ]
      });
      return;
    }

    if (heir.type !== 'Child' && heir.type !== 'Relative') {
      const updatedChar = {
        ...character,
        history: [...character.history, { age: character.age, text: `You cannot designate ${heir.name} as heir. Succession is only through blood.` }]
      };
      setCharacter(updatedChar);
      setGenericActionResult({
        title: "Designation Blocked",
        subtitle: `${heir.name} (${heir.type})`,
        storySnippet: `You cannot designate ${heir.name} as heir. Succession is only through blood of your direct lineage.`,
        effects: [
          {
            label: "👑 Succession Status",
            value: "BLOCKED (INVALID KIN)",
            isNegative: true
          }
        ]
      });
      return;
    }

    if ((heir.age || 0) < 5) {
       const updatedChar = {
        ...character,
        history: [...character.history, { age: character.age, text: `${heir.name} is too young to be named as successor.` }]
      };
      setCharacter(updatedChar);
      setGenericActionResult({
        title: "Designation Blocked",
        subtitle: `${heir.name} (${heir.type})`,
        storySnippet: `${heir.name} is too young to be named as successor of the steppe. Successors must be at least 5 summers old.`,
        effects: [
          {
            label: "👑 Succession Status",
            value: "BLOCKED (TOO YOUNG)",
            isNegative: true
          }
        ]
      });
      return;
    }

    const updatedChar = {
      ...character,
      heirId: relId,
      history: [...character.history, { age: character.age, text: `You have formally designated ${heir.name} as your legal heir.` }]
    };
    setCharacter(updatedChar);
    setGenericActionResult({
      title: "Heir Designated",
      subtitle: `${heir.name} (${heir.type})`,
      storySnippet: `You have formally designated ${heir.name} as your legal heir.`,
      avatarUrl: heir.avatarUrl,
      effects: [
        {
          label: "👑 Succession Status",
          value: "SUCCESSOR DECREED",
          isPositive: true
        }
      ]
    });
    setSelectedPerson(null);
  };

  const handleChangeSuccessionLaw = (law: Character['successionLaw']) => {
    if (!character) return;
    const updatedChar = {
      ...character,
      successionLaw: law,
      history: [...character.history, { age: character.age, text: `You have decreed a new succession law: ${law}.` }]
    };
    setCharacter(updatedChar);
  };

  const handleSellLivestock = (type: keyof Character['livestock'], amount: number) => {
    if (!character || character.livestock[type] < amount) return;

    const basePrice = (LIVESTOCK_PRICES as any)[type]?.sell || 10;
    const multipliers = MARKET_MULTIPLIERS[character.marketCondition] || MARKET_MULTIPLIERS.Stable;
    
    // Scale sell price based on market condition
    const sellPrice = Math.floor(basePrice * amount * multipliers.sell * (multipliers.livestock || 1));

    const updatedLivestock = { ...character.livestock };
    updatedLivestock[type] -= amount;

    const updatedChar = {
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth + sellPrice },
      livestock: updatedLivestock,
      history: [...character.history, { age: character.age, text: `Sold ${amount} ${type} for ${sellPrice}г at the tribal market.` }]
    };

    setCharacter(updatedChar);

    setGenericActionResult({
      title: "Livestock Sold",
      subtitle: `${type.toUpperCase()} x${amount}`,
      storySnippet: `You traded ${amount} ${type} with a merchant for a sum of ${sellPrice}г in cash.`,
      effects: [
        {
          label: "💰 Wealth",
          value: `+${sellPrice}г`,
          isPositive: true
        },
        {
          label: "🐎 Herd Status",
          value: `-${amount} ${type}`,
          isNegative: true
        }
      ]
    });
  };

  const handleAdReward = (option: 'GOLD' | 'VISION' | 'STRENGTH') => {
    if (!character) return;
    let rewardText = "";
    const updatedStats = { ...character.stats };
    let visionBonus = character.visionBonus || 0;
    
    switch(option) {
      case 'GOLD':
        updatedStats.wealth += 350;
        rewardText = "Received 350г from Silk Road trade tips.";
        break;
      case 'VISION':
        visionBonus += 45;
        rewardText = "Scouts from the caravan revealed the hidden paths and camp sizes of your rivals.";
        break;
      case 'STRENGTH':
        updatedStats.strength = Math.min(100, updatedStats.strength + 12);
        updatedStats.health = Math.min(100, updatedStats.health + 8);
        rewardText = "Learned secret endurance and health techniques from the caravan guards.";
        break;
    }

    setCharacter({
      ...character,
      stats: updatedStats,
      visionBonus,
      history: [...character.history, { age: character.age, text: rewardText }]
    });
    setAdRewardUsed(true);
    setShowAdOptions(false);
  };

  const getCurrentLivestockPrice = (animal: keyof typeof LIVESTOCK_PRICES, action: 'buy' | 'sell') => {
    if (!character) return 0;
    const base = LIVESTOCK_PRICES[animal][action];
    
    // Check for MARKET_MULTIPLIERS
    // Note: Constants are not exported in a way that makes this easy without re-importing or moving
    // But I can use a simple switch or just a hardcoded map for the UI side if I don't want to re-import
  
    const multipliers = MARKET_MULTIPLIERS[character.marketCondition] || MARKET_MULTIPLIERS.Stable;
    let finalMult = 1.0;
    
    if (action === 'buy') {
      finalMult = multipliers.buy * (multipliers.livestock || 1.0);
    } else {
      finalMult = multipliers.sell * (multipliers.livestock || 1.0);
    }

    return Math.floor(base * finalMult);
  };

  const handleLivestockAction = (animal: keyof typeof LIVESTOCK_PRICES, action: 'buy' | 'sell') => {
    if (!character) return;
    const price = getCurrentLivestockPrice(animal, action);

    if (action === 'buy') {
      const currentCapacity = character.pastureCapacity || (character.socialClass === SocialClass.NOBLE ? 600 : 300);
      const totalAnimals = (character.livestock.horses || 0) + 
                           (character.livestock.sheep || 0) + 
                           (character.livestock.cattle || 0) + 
                           (character.livestock.goats || 0) + 
                           (character.livestock.yaks || 0) + 
                           (character.livestock.camels || 0);

      if (totalAnimals >= currentCapacity) {
        setGenericActionResult({
          title: "🚫 Out of Grasslands",
          subtitle: `${animal.toUpperCase()}`,
          storySnippet: `Under the custom of the Steppe, you cannot graze more animals than your pasture capacity (${currentCapacity} heads of livestock). You must sell some animals or expand your pastures.`,
          effects: [
            {
              label: "Grasslands Status",
              value: `${totalAnimals} / ${currentCapacity} Animals`,
              isNegative: true
            }
          ]
        });
        return;
      }

      if (character.stats.wealth >= price) {
        playCoinSound(settings.sound);
        triggerVibration(45, settings.vibration);
        setCharacter(prev => {
          if (!prev) return null;
          return {
            ...prev,
            stats: { ...prev.stats, wealth: prev.stats.wealth - price },
            livestock: { ...prev.livestock, [animal]: prev.livestock[animal] + 1 },
            history: [...prev.history, { age: prev.age, text: `Bought one ${animal} for ${price}г.` }]
          };
        });
        setGenericActionResult({
          title: "Livestock Acquired",
          subtitle: `${animal.toUpperCase()}`,
          storySnippet: `You purchased a healthy ${animal} for ${price}г to reinforce your personal herd.`,
          effects: [
            {
              label: "💰 Wealth",
              value: `-${price}г`,
              isNegative: true
            },
            {
              label: "🐎 Herd Status",
              value: `+1 ${animal}`,
              isPositive: true
            }
          ]
        });
      }
    } else {
      if (character.livestock[animal] > 0) {
        playCoinSound(settings.sound);
        triggerVibration(45, settings.vibration);
        setCharacter(prev => {
          if (!prev) return null;
          return {
            ...prev,
            stats: { ...prev.stats, wealth: prev.stats.wealth + price },
            livestock: { ...prev.livestock, [animal]: prev.livestock[animal] - 1 },
            history: [...prev.history, { age: prev.age, text: `Sold one ${animal} for ${price}г.` }]
          };
        });
        setGenericActionResult({
          title: "Livestock Sold",
          subtitle: `${animal.toUpperCase()}`,
          storySnippet: `You sold a healthy ${animal} to a tribal trader for a sum of ${price}г.`,
          effects: [
            {
              label: "💰 Wealth",
              value: `+${price}г`,
              isPositive: true
            },
            {
              label: "🐎 Herd Status",
              value: `-1 ${animal}`,
              isNegative: true
            }
          ]
        });
      }
    }
  };

  const handleUpgradePasture = () => {
    if (!character) return;
    const upgrades = character.pastureUpgrades || 0;
    const cost = 250 + upgrades * 150;
    
    if (character.stats.wealth < cost) return;

    const newCapacity = (character.pastureCapacity || (character.socialClass === SocialClass.NOBLE ? 600 : 300)) + 200;

    setCharacter({
      ...character,
      stats: { ...character.stats, wealth: character.stats.wealth - cost },
      pastureCapacity: newCapacity,
      pastureUpgrades: upgrades + 1,
      history: [...character.history, { age: character.age, text: `Leased and secured additional pasture fields. Grassland capacity expanded to ${newCapacity} heads.` }]
    });

    setGenericActionResult({
      title: "🌍 Pastures Expanded",
      subtitle: `Capacity: ${newCapacity} heads`,
      storySnippet: `You sent riders to claim extra meadows and established stone landmark cairns to mark your family's new protected pastures. Your herds can now browse freely.`,
      effects: [
        { label: "💰 Gold Spent", value: `-${cost}г`, isNegative: true },
        { label: "🌿 Pasture Limit", value: `${newCapacity} heads`, isPositive: true }
      ]
    });
  };

  const handlePromotion = (newRole: string) => {
    if (!character) return;
    if (character.lastPromotionAge === character.age) return;
    setCharacter(prev => {
      if (!prev) return prev;

      const merchantRoles = [
        'Apprentice Trader',
        'Caravan Guard',
        'Merchant',
        'Caravan Master',
        'Guild Master',
        'Merchant Prince'
      ];

      const blacksmithRoles = [
        'Apprentice Blacksmith',
        'Journeyman Smith',
        'Master Smith',
        'Royal Armorer',
        'Apprentice Bowyer',
        'Bowyer',
        'Master Bowyer',
        'Master of the Arsenal',
        'Master Smith or Bowyer'
      ];

      let extraHistory: any[] = [];
      let updatedWorkshops = prev.workshops;

      if (merchantRoles.includes(newRole) || blacksmithRoles.includes(newRole)) {
        const baseWorkshops = prev.workshops || [
          {
            id: 'ws-dairy',
            name: 'Dairy Fermentation Ger',
            type: 'Dairy',
            level: 0,
            passiveIncome: 30,
            costToUpgrade: 150,
            description: 'Process sheep, horse, and yak milk into Aaruul (dried cheese curd) and Airag.'
          },
          {
            id: 'ws-saddle',
            name: 'Saddle & Leather Workshop',
            type: 'Saddle',
            level: 0,
            passiveIncome: 50,
            costToUpgrade: 250,
            description: 'Craft sturdy horse saddles, tethers, leather boots, and winter coats.'
          },
          {
            id: 'ws-forge',
            name: 'Iron Weaponry Forge',
            type: 'Forge',
            level: 0,
            passiveIncome: 80,
            costToUpgrade: 400,
            description: 'Forge flexible steel sabers, battle spears, and armor-piercing arrows.'
          },
          {
            id: 'ws-weaving',
            name: 'Carpet & Wool Loom',
            type: 'Weaving',
            level: 0,
            passiveIncome: 65,
            costToUpgrade: 320,
            description: 'Weave warm wool carpets, felt wall insulation, and ornamental silk belts.'
          }
        ];

        let madeAnyUpgrades = false;
        const mapped = baseWorkshops.map(ws => {
          if (ws.level === 0) {
            madeAnyUpgrades = true;
            return {
              ...ws,
              level: 1,
              passiveIncome: Math.floor(ws.passiveIncome * 1.5),
              costToUpgrade: Math.floor(ws.costToUpgrade * 1.8)
                };
          }
          return ws;
        });

        if (madeAnyUpgrades) {
          updatedWorkshops = mapped as any[];
          const isMerchant = merchantRoles.includes(newRole);
          const professionName = isMerchant ? "худалдаачин" : "дархан";
          const professionEng = isMerchant ? "Merchant" : "Blacksmith";

          extraHistory.push({
            age: prev.age,
            text: `💼 Та ${professionName} мэргэжлийг сонгосон тул шууд БИЗНЕС ЭРХЛЭГЧ боллоо! Таны зуслан дахь бүх урлангууд ашиглалтад орж, идэвхтэй ажиллаж эхэллээ. (By choosing the ${professionEng} profession, you have immediately become a BUSINESS OWNER! All workshops in your camp are now established and active.)`
          });
        }
      }

      return {
        ...prev,
        role: newRole,
        lastPromotionAge: prev.age,
        workshops: updatedWorkshops,
        history: [
          ...prev.history,
          { age: prev.age, text: `Promoted to ${newRole}. You have climbed the ladder of the steppe!` },
          ...extraHistory
        ]
      };
    });
  };

  const handleCombatComplete = (outcome: CombatOutcome, difficulty: number) => {
    if (!character) return;
    
    let updatedChar = { ...character };
    const isWin = outcome.winner === character.name;
    
    if (isWin) {
      const repGain = 5 * difficulty;
      const wealthGain = 20 * difficulty;
      updatedChar.stats = {
        ...updatedChar.stats,
        reputation: Math.min(100, updatedChar.stats.reputation + repGain),
        wealth: updatedChar.stats.wealth + wealthGain,
        strength: Math.min(100, updatedChar.stats.strength + 1),
        archery: Math.min(100, updatedChar.stats.archery + 1),
        horseRiding: Math.min(100, updatedChar.stats.horseRiding + 1)
      };
      
      updatedChar.history = [...updatedChar.history, { 
        age: character.age, 
        text: `Earned a glorious victory in trial by combat against a level ${difficulty} opponent! Gained ${repGain} reputation and ${wealthGain}г.` 
      }];
    } else {
      const healthLoss = 10 + (2 * difficulty);
      const repLoss = 2 * difficulty;
      const newHealth = Math.max(0, updatedChar.stats.health - healthLoss);
      
      updatedChar.stats = {
        ...updatedChar.stats,
        health: newHealth,
        reputation: Math.max(0, updatedChar.stats.reputation - repLoss),
        happiness: Math.max(0, updatedChar.stats.happiness - 5)
      };
      
      updatedChar.history = [...updatedChar.history, { 
        age: character.age, 
        text: `Suffered a humiliating defeat in trial by combat. Your wounds bleed and your honor is stained.` 
      }];
      
      if (newHealth <= 0) {
        updatedChar.isAlive = false;
        updatedChar.deathCause = "Fatal injuries sustained in trial by combat";
        updatedChar.history = [...updatedChar.history, { age: character.age, text: "You have succumbed to your injuries sustained in combat." }];
      }
    }
    
    setCharacter(updatedChar);
    setActiveTab(Tab.ACTIVITIES);
  };

  const handleSettleDown = () => {
    if (!character || character.lifestyle === 'Settled' || character.stats.wealth < 1000) return;

    setCharacter(prev => {
      if (!prev) return null;
      return {
        ...prev,
        lifestyle: 'Settled',
        stats: { 
          ...prev.stats, 
          wealth: prev.stats.wealth - 1000, 
          reputation: prev.stats.reputation - 20 
        },
        history: [...prev.history, { age: prev.age, text: "You have abandoned the nomadic life to build a permanent farming estate. The spirits of the steppe weep, but your granaries will be full." }]
      };
    });
    setIsMenuOpen(false);
  };

  const handleConquerTribe = (tribeName: string) => {
    if (!character || character.conqueredTribes.includes(tribeName)) return;

    if (character.activeCampaign) {
      setGenericActionResult({
        title: "🚫 Идэвхтэй дайны аянтай байна",
        subtitle: `${character.activeCampaign.targetTribe.toUpperCase()}`,
        storySnippet: `Та аль хэдийнэ ${character.activeCampaign.targetTribe} аймагтай идэвхтэй аян дайн хийж байна. Нэг зэрэг хоёр аян дайн удирдах боломжгүй.`,
        effects: [
          { label: "Дайны байдал", value: "Цэрэг хөдөлсөн байгаа", isNegative: true }
        ]
      });
      return;
    }

    const rel = character.tribeRelations.find(r => r.name === tribeName);
    const enemyPower = rel ? rel.militaryPower : (300 + Math.floor(Math.random() * 500));

    const initialCampaign: CampaignState = {
      targetTribe: tribeName,
      year: 1,
      playerProgress: 30, // Starts at 30% progress
      playerCasualties: 0,
      enemyCasualties: 0,
      enemyPower: enemyPower,
      enemyInitialPower: enemyPower,
      combatLog: [`${tribeName} аймгийн эсрэг аян дайн эхэллээ! Та жил бүр байлдааны стратегиа сонгож, тулаанаа удирдана уу. Дайн хэдэн жил дамнан үргэлжлэх болно.`],
      resolvedForThisYear: false
    };

    const updatedRelations = character.tribeRelations.map(tr => 
      tr.name === tribeName ? { ...tr, level: 'At War' as RelationLevel, standing: -100 } : tr
    );

    // War SFX & Vibration
    playWarSound(settings.sound);
    triggerVibration(150, settings.vibration);

    setCharacter({
      ...character,
      tribeRelations: updatedRelations,
      activeCampaign: initialCampaign,
      history: [...character.history, { age: character.age, text: `${tribeName} аймгийн эсрэг хэдэн жил дамнах дайны аяныг албан ёсоор эхлүүллээ.` }]
    });

    setGenericActionResult({
      title: "⚔️ Аян дайн эхэллээ",
      subtitle: `${tribeName} аймагтай тулалдаж эхлэв`,
      storySnippet: `Таны цэргүүд дарах дайны тугаа мандуулж, ${tribeName} аймгийн зүг мордов! Энэ тулаан жил дамнан үргэлжлэх аян дайн байх бөгөөд аймаг тань жил бүр тактик, стратегиа сонгож цэрэг дайны ухаанаа уралдуулах хэрэгтэй болно.`,
      effects: [
        { label: "🎯 Зорилтот Аймаг", value: tribeName.toUpperCase(), isPositive: true },
        { label: "⚔️ Дайсны цэргийн хүч", value: `${enemyPower.toLocaleString()} хүч`, isNegative: true },
        { label: "⏳ Дайны төлөв", value: "Олон жил үргэлжилнэ (Multi-year)", isPositive: true }
      ]
    });
  };

  const handleExecuteCampaignStrategy = (strategyKey: string) => {
    if (!character || !character.activeCampaign || character.activeCampaign.resolvedForThisYear) return;

    // Combat SFX & tactile vibration
    playCombatSound(settings.sound);
    triggerVibration(60, settings.vibration);

    const campaign = { ...character.activeCampaign };
    const target = campaign.targetTribe;
    
    // Evaluate based on strategy chosen
    let progressChange = 0;
    let playerCasMult = 0;
    let enemyCasMult = 0;
    let logMessage = "";
    
    // Player stats
    const ride = character.stats.horseRiding || 0;
    const arch = character.stats.archery || 0;
    const str = character.stats.strength || 0;
    const intel = character.stats.intelligence || 0;
    const perc = character.stats.perception || 0;
    const lead = character.stats.leadership || 0;

    if (strategyKey === 'charge') {
      // Cavalry Charge: relies on Horse Riding & Strength
      const score = (ride * 0.6) + (str * 0.4);
      if (score >= 70) {
        progressChange = 25 + Math.floor(Math.random() * 15);
        playerCasMult = 0.08;
        enemyCasMult = 0.25;
        logMessage = `⚔️ Мортодын хүчит дайралт: Таны морьт цэргүүд салхи мэт дайран орж, дайсны хамгаалалтыг тархаалаа! Дайсан их хэмжээний хохирол хүлээсэн ч манай талаас бас цөөнгүй эрсдэв.`;
      } else if (score >= 45) {
        progressChange = 12 + Math.floor(Math.random() * 10);
        playerCasMult = 0.15;
        enemyCasMult = 0.15;
        logMessage = `⚔️ Мортодын дайралт: Ширүүн тулаан боллоо. Манай цэргүүд урагш давшсан ч дайсны сөрөг хамгаалалт хүчтэй байж, талууд тэнцүүхэн гарзтай тулав.`;
      } else {
        progressChange = -5 + Math.floor(Math.random() * 8);
        playerCasMult = 0.25;
        enemyCasMult = 0.05;
        logMessage = `⚠️ Ухаангүй дайралт: Хурд хүч дутсанаас дайралт амжилтгүй болж, дайсны сааль урхинд оров. Манайхан хүнд хохирол амсаж ухрав.`;
      }
    } else if (strategyKey === 'retreat') {
      // Feigned Retreat (Mangudai): relies on Archery, Intelligence & Horse Riding
      const score = (arch * 0.4) + (intel * 0.4) + (ride * 0.2);
      if (score >= 65) {
        progressChange = 20 + Math.floor(Math.random() * 15);
        playerCasMult = 0.03;
        enemyCasMult = 0.30;
        logMessage = `🏹 Хуурамч ухралт (Мангудай): Таны цэргүүд зохион байгуулалттай ухрахад дайснууд ялалтандаа баясан нэхэн хөөв. Алсын отолтонд оруулан харваж, дайсныг хядав!`;
      } else if (score >= 35) {
        progressChange = 10 + Math.floor(Math.random() * 10);
        playerCasMult = 0.06;
        enemyCasMult = 0.15;
        logMessage = `🏹 Хуурамч ухралт: Дайсны тал ухарлыг дагасан ч болгоомжтой байлаа. Гэсэн ч отолт тодорхой хэмжээнд амжилттай болж, давуу тал оллоо.`;
      } else {
        progressChange = -10 + Math.floor(Math.random() * 5);
        playerCasMult = 0.12;
        enemyCasMult = 0.04;
        logMessage = `⚠️ Буруу ухралт: Цэргүүдийн эмх цэгц алдагдаж, жинхэнэ ухралт болж хувирав. Дайсан манай ар талыг ниргэж амжив.`;
      }
    } else if (strategyKey === 'ambush') {
      // Night Ambush: relies on Perception, Intelligence & Leadership
      const score = (perc * 0.4) + (intel * 0.3) + (lead * 0.3);
      if (score >= 60) {
        progressChange = 18 + Math.floor(Math.random() * 20);
        playerCasMult = 0.02;
        enemyCasMult = 0.20;
        logMessage = `🌙 Шөнийн гэнэтийн дайралт: Саргүй шөнөөр дайсны хуаранг унталт дунд нь гэнэт ниргэв. Дарга нарыг нь устгаж, үлэмж сандрал үүсгэлээ!`;
      } else if (score >= 35) {
        progressChange = 8 + Math.floor(Math.random() * 12);
        playerCasMult = 0.08;
        enemyCasMult = 0.10;
        logMessage = `🌙 Шөнийн отолт: Дайсны харуулууд манайхныг дутуу анзаарсан ч бүрэн унтуулаагүй байлаа. Богино хугацааны ширүүн зодоон дунд зарим амжилт гаргав.`;
      } else {
        progressChange = -15 + Math.floor(Math.random() * 8);
        playerCasMult = 0.20;
        enemyCasMult = 0.03;
        logMessage = `⚠️ Илэрсэн отолт: Дайсан манай төлөвлөгөөг тагнаж мэдээд эсрэгээрээ отолтонд оруулав! Сүйрэлтэй гарз амсаж зугтахаас өөр аргагүй болов.`;
      }
    } else if (strategyKey === 'harass') {
      // Harassment: relies on Archery & Horse Riding
      const score = (arch * 0.5) + (ride * 0.5);
      if (score >= 50) {
        progressChange = 10 + Math.floor(Math.random() * 10);
        playerCasMult = 0.012;
        enemyCasMult = 0.12;
        logMessage = `🏹 Тойрсон суман мөндөр: Завсаргүй тойрон давхиж, алсаас сумаар зовоов. Дайсан манай хурдан морьтыг барьж чадалгүй зөвхөн суманд өртөн сийчүүлэв.`;
      } else {
        progressChange = 4 + Math.floor(Math.random() * 8);
        playerCasMult = 0.04;
        enemyCasMult = 0.06;
        logMessage = `🏹 Сөнөөх тактик: Алсын харваагаар байлдаж байна. Дайсны цэргүүд бамбай доороо хоргодон бага сага хохирол амслаа.`;
      }
    } else {
      progressChange = 5 + Math.floor(Math.random() * 10);
      playerCasMult = 0.02;
      enemyCasMult = 0.05;
      logMessage = `Тагнуулын дайралт: Дайсны сул тал, бэлчээрийг тагнаж бага сага давуу тал оллоо.`;
    }

    const startSoldiers = character.hordeSize || 100;
    const playerLoss = Math.max(2, Math.floor(startSoldiers * playerCasMult * (0.8 + Math.random() * 0.4)));
    const enemyLossPower = Math.max(10, Math.floor(campaign.enemyPower * enemyCasMult * (0.7 + Math.random() * 0.6)));

    const nextPlayerProgress = Math.max(0, Math.min(100, campaign.playerProgress + progressChange));
    const nextEnemyPower = Math.max(0, campaign.enemyPower - enemyLossPower);
    const nextHordeSize = Math.max(0, startSoldiers - playerLoss);

    campaign.playerProgress = nextPlayerProgress;
    campaign.enemyPower = nextEnemyPower;
    campaign.playerCasualties += playerLoss;
    campaign.enemyCasualties += enemyLossPower;
    campaign.currentStrategy = strategyKey;
    campaign.resolvedForThisYear = true;
    campaign.combatLog = [...campaign.combatLog, logMessage, `Үр дүн: Манай талаас -${playerLoss} цэрэг, дайснаас -${enemyLossPower} хүч. Нийт ахиц: ${nextPlayerProgress}%`].slice(-10);

    let done = false;
    let victory = false;

    if (nextPlayerProgress >= 100 || nextEnemyPower <= 10) {
      done = true;
      victory = true;
    } else if (nextPlayerProgress <= 0 || nextHordeSize <= 5) {
      done = true;
      victory = false;
    }

    if (done) {
      if (victory) {
        const updatedChar = { 
          ...character,
          activeCampaign: undefined,
          conqueredTribes: [...character.conqueredTribes, target],
          stats: { 
            ...character.stats, 
            reputation: character.stats.reputation + 25,
            leadership: character.stats.leadership + 15,
            wealth: character.stats.wealth + 800,
            health: Math.min(100, character.stats.health + 5)
          },
          clanWealth: character.clanWealth + 2000,
          tribeRelations: character.tribeRelations.map(rel => 
            rel.name === target ? { ...rel, level: 'Allied' as RelationLevel, standing: 100, militaryPower: 0 } : rel
          ),
          hordeSize: nextHordeSize,
          history: [...character.history, { age: character.age, text: `Олон жил үргэлжилсэн цуст аян дайны дараа та ${target} аймгийг бүрэн дагуулав! Дайсны хүч хугарлаа.` }]
        } as Character;

        const milData = calculateMilitaryPower(updatedChar);
        updatedChar.militaryPower = milData.power;
        updatedChar.hordeSize = nextHordeSize + (milData.soldiers - character.hordeSize); // adds vassal levys

        setCharacter(updatedChar);

        setGenericActionResult({
          title: "🏆 Аян дайны ПАН-ЯЛАЛТ (Campaign Victory)",
          subtitle: `${target} Аймаг дагав`,
          storySnippet: `Та олон жил үргэлжилсэн цуст аян дараалсан тулаануудын эцэст ${target} аймгийг бүрэн сөхрүүлэв! Тэдний удирдагч таны алдар сүрийн өмнө захирагдахаа илэрхийлж, цагаан морьдоор тахил өргөн таны холбоотон, вассал болохоо тангараглалаа.`,
          effects: [
            { label: "👑 Вассал аймаг", value: target.toUpperCase(), isPositive: true },
            { label: "💰 Дайны олз", value: "+800г", isPositive: true },
            { label: "💰 Овгийн сан хөмрөг", value: "+2000г", isPositive: true },
            { label: "📈 Нэр хүнд", value: "+25", isPositive: true },
            { label: "⚔️ Манай амь үрэгдэгсэд", value: `-${campaign.playerCasualties} зоригтон`, isNegative: true },
            { label: "💀 Дайсны хохирол", value: `-${campaign.enemyCasualties} хүч`, isPositive: true }
          ]
        });
      } else {
        const randomFatality = Math.random() < 0.05;
        if (randomFatality) {
          setCharacter({
            ...character,
            isAlive: false,
            activeCampaign: undefined,
            history: [...character.history, { age: character.age, text: `${target} аймгийн эсрэг аян дайн сүйрлээр төгсөж, та тулааны талбарт амь үрэгдлээ.` }]
          } as Character);

          setGenericActionResult({
            title: "💀 Тулаанд амь үрэгдэв",
            subtitle: `${target} аймгийн аян дайн сүйрэв`,
            storySnippet: `Дайн сунжран манай цэргүүд туйлдаж ухрах үед та өөрөө хаалтын тулаанд орж, суманд өртөн амь үрэгдлээ. Бие тань хээр талын бэлчээрт үлдэв.`,
            effects: [
              { label: "💀 Амьд эсэх", value: "АМЬ ҮРЭГДСЭН", isNegative: true }
            ]
          });
        } else {
          const newHealth = Math.max(5, character.stats.health - 20);
          const history = [...character.history, { age: character.age, text: `${target} аймгийн сунжирсан дайн манай талын гутамшигт ухралтаар төгсөж, маш их цэрэг, нэр хүндээ алдлаа.` }];
          
          setCharacter({
            ...character,
            activeCampaign: undefined,
            stats: { 
              ...character.stats, 
              health: newHealth, 
              reputation: Math.max(0, character.stats.reputation - 20),
              happiness: Math.max(0, character.stats.happiness - 15)
            },
            hordeSize: Math.floor(nextHordeSize * 0.6),
            tribeRelations: character.tribeRelations.map(rel => 
              rel.name === target ? { ...rel, standing: -60, level: 'Neutral' as RelationLevel } : rel
            ),
            history
          } as Character);

          setGenericActionResult({
            title: "❌ Зэвсэг мултрав (Campaign Defeat)",
            subtitle: `${target} аймгийн эсрэг дайн амжилтгүй`,
            storySnippet: `Олон жилийн сунжирсан тулаанд танай цэргийн нөөц дуусаж, ухрахаас өөр аргагүй болов. Дайсан таны бүслэлтийг задлан довтолж, хүнд цохилт өглөө.`,
            effects: [
              { label: "❤️ Эрүүл мэнд", value: "-20", isNegative: true },
              { label: "📈 Нэр хүнд", value: "-20", isNegative: true },
              { label: "⚔️ Цэргийн хүч", value: "Цэргүүдийн 40% нь амь үрэгдсэн", isNegative: true }
            ]
          });
        }
      }
    } else {
      setCharacter({
        ...character,
        hordeSize: nextHordeSize,
        activeCampaign: campaign
      });
    }
  };

  const handleConquerKingdom = (kingdomName: string) => {
    if (!character || !character.conqueredKingdoms || character.conqueredKingdoms.includes(kingdomName)) return;

    const kingdom = character.kingdomRelations?.find(k => k.name === kingdomName);
    const kingdomPower = kingdom?.militaryPower || 15000;
    const powerRatio = character.militaryPower / (kingdomPower || 1);
    const victoryChance = Math.max(0.01, Math.min(0.98, (powerRatio - 1.0) * 0.5 + 0.1));
    
    if (Math.random() < victoryChance) {
      const updatedChar = { 
        ...character,
        conqueredKingdoms: [...character.conqueredKingdoms, kingdomName],
        stats: { 
          ...character.stats, 
          reputation: character.stats.reputation + 200,
          leadership: character.stats.leadership + 100,
          wealth: character.stats.wealth + 15000
        },
        clanWealth: character.clanWealth + 50000,
        kingdomRelations: character.kingdomRelations?.map(rel => 
          rel.name === kingdomName ? { ...rel, level: 'Allied' as RelationLevel, standing: 100 } : rel
        ),
        history: [...character.history, { age: character.age, text: `The world is in shock! You have conquered the great ${kingdomName}. Their temples and palaces now fly your banners.` }]
      } as Character;

      const milData = calculateMilitaryPower(updatedChar);
      updatedChar.militaryPower = milData.power;
      updatedChar.hordeSize = milData.soldiers;

      setCharacter(updatedChar);

      setGenericActionResult({
        title: "Decisive Imperial Conquest",
        subtitle: `Conquered ${kingdomName}`,
        storySnippet: `The world is in shock! You have conquered the great ${kingdomName}. Their temples and palaces now fly your banners.`,
        effects: [
          { label: "👑 Domain Claimed", value: kingdomName.toUpperCase(), isPositive: true },
          { label: "💰 Treasures Plundered", value: "+15,000г", isPositive: true },
          { label: "💰 Clan Treasury", value: "+50,000г", isPositive: true },
          { label: "📈 Reputation", value: "+200", isPositive: true },
          { label: "👑 Leadership", value: "+100", isPositive: true },
          { label: "⚔️ Vassal Soldiers Mobilized", value: `+${milData.soldiers - character.hordeSize}`, isPositive: true }
        ]
      });
    } else {
       const isFatal = Math.random() < 0.25;
       if (isFatal) {
         setCharacter({
           ...character,
           isAlive: false,
           history: [...character.history, { age: character.age, text: `Your campaign to conquer ${kingdomName} failed. You were executed as a barbarian rebel after your capture.` }]
         } as Character);

         setGenericActionResult({
           title: "Captured & Executed",
           subtitle: `Invasion of ${kingdomName} failed`,
           storySnippet: `Your campaign to conquer ${kingdomName} failed. You were executed as a barbarian rebel after your capture.`,
           effects: [
             { label: "💀 Life Status", value: "EXECUTED", isNegative: true }
           ]
         });
       } else {
         const newHealth = Math.max(0, character.stats.health - 40);
         const isAlive = newHealth > 0;
         const history = [...character.history, { age: character.age, text: `Your invasion of ${kingdomName} was crushed by their sophisticated siege engines and heavy infantry. You barely escaped with your life.` }];
         
         if (!isAlive) {
           history.push({ age: character.age, text: `Your wounds from the disastrous invasion of ${kingdomName} proved fatal.` });
         }

         setCharacter({
           ...character,
           isAlive,
           stats: { ...character.stats, health: newHealth },
           history
         } as Character);

         setGenericActionResult({
           title: "Invasion Crushed",
           subtitle: `${kingdomName} Fortress Defended You`,
           storySnippet: `Your invasion of ${kingdomName} was crushed by their sophisticated warfare. You barely escaped with your life.`,
           effects: [
             { label: "❤️ Health Damage", value: "-40 Check", isNegative: true },
             { label: "💀 Life Status", value: isAlive ? "SURVIVED (Wounded)" : "DECEASED", isNegative: !isAlive }
           ]
         });
       }
    }
  };

  const handleKingdomDiplomacy = (kingdomName: string, action: string) => {
    if (!character || !character.kingdomRelations) return;

    let reputationChange = 0;

    const updatedRelations = character.kingdomRelations.map(rel => {
      if (rel.name === kingdomName) {
        let newLevel = rel.level;
        let newStanding = rel.standing;
        let isTrading = rel.isTrading;
        let historyText = "";

        if (action === 'trade') {
          if (character.stats.realmReputation >= 50) {
            isTrading = true;
            newStanding += 20;
            reputationChange = 10;
            historyText = `The ${kingdomName} opened its borders to your silk road caravan, recognizing your authority in the realm.`;
          } else {
            newStanding -= 10;
            historyText = `The ${kingdomName} emissaries mocked your "horde", calling you uncivilized bandits. Your global reputation is insufficient.`;
          }
        } else if (action === 'war') {
           newLevel = 'At War';
           newStanding = -100;
           historyText = `You have challenged the heavens. War has been declared on the imperial ${kingdomName}.`;
        }

        return { ...rel, level: newLevel as RelationLevel, standing: newStanding, isTrading, historyText };
      }
      return rel;
    });

    const target = updatedRelations.find(r => r.name === kingdomName);
    if (target) {
       setCharacter({
         ...character,
         stats: {
           ...character.stats,
           reputation: Math.max(0, Math.min(100, character.stats.reputation + reputationChange))
         },
         kingdomRelations: updatedRelations,
         history: [...character.history, { age: character.age, text: (target as any).historyText }]
       });

       const startStanding = character.kingdomRelations.find(r => r.name === kingdomName)!.standing;
       const endStanding = target.standing;
       const standDiff = endStanding - startStanding;
       
       const effectsList = [];
       if (standDiff !== 0) {
         effectsList.push({
           label: `👥 ${kingdomName} Standing`,
           value: standDiff > 0 ? `+${standDiff}` : `${standDiff}`,
           isPositive: standDiff > 0,
           isNegative: standDiff < 0
         });
       }
       if (reputationChange !== 0) {
         effectsList.push({
           label: "📈 Reputation",
           value: `+${reputationChange}`,
           isPositive: true
         });
       }

       setGenericActionResult({
         title: `${action.toUpperCase()} Diplomacy`,
         subtitle: kingdomName,
         storySnippet: (target as any).historyText,
         effects: effectsList
       });
    }
  };

  const handleProclaimKingdom = (name: string) => {
    if (!character || character.isGreatKhan || character.conqueredTribes.length < 3) return;

    // Initialize kingdoms when player becomes Great Khan
    const initialKingdomRelations: TribeRelation[] = KINGDOMS.map(kName => ({
      name: kName,
      level: 'Neutral' as RelationLevel,
      standing: 0,
      isTrading: false,
      militaryPower: 10000 + Math.floor(Math.random() * 20000) // Kingdoms are much stronger
    }));

    setCharacter({
      ...character,
      isGreatKhan: true,
      kingdomName: name,
      kingdomRelations: initialKingdomRelations,
      stats: { ...character.stats, reputation: 100, leadership: 100 },
      role: 'Great Khan',
      history: [...character.history, { age: character.age, text: `The Curultai has spoken! You have been proclaimed the Great Khan of the ${name}. All the Steppe trembles. Beyond the borders, ancient kingdoms now look towards your rising power.` }]
    } as Character);
    setIsMenuOpen(false);
  };

  const handleTakePrincessConcubine = (originName: string, originType: 'Tribe' | 'Kingdom', isVassal: boolean) => {
    if (!character) return;

    // Check if we already have an active concubine from this specific tribe or kingdom to avoid duplicates
    const hasConcubine = character.relationships.some(
      r => r.type === 'Concubine' && r.originName === originName && r.status === 'Active'
    );
    if (hasConcubine) return;

    // Determine cost
    const cost = isVassal ? 0 : (originType === 'Tribe' ? 350 : 1000);
    if (character.stats.wealth < cost) return;

    // Generation of name and traits
    let name = "";
    let traits: string[] = [];
    const age = 16 + Math.floor(Math.random() * 8); // Age 16-23

    if (originType === 'Tribe') {
      const tribeNames = ['Borte', 'Hoelun', 'Yesugen', 'Yesui', 'Khutulun', 'Sorkhotani', 'Oghul', 'Chabi', 'Mandukhai', 'Altani', 'Alan Goa'];
      name = tribeNames[Math.floor(Math.random() * tribeNames.length)];
      traits = ['Steppe Beauty', 'Fierce Rider', 'Tribe Princess'];
    } else {
      if (originName === 'Jin Dynasty') {
        const jinNames = ['Lihua', 'Meiling', 'Ruolan', 'Xiaotong', 'Yanling', 'Zhaojun'];
        name = `Princess ${jinNames[Math.floor(Math.random() * jinNames.length)]}`;
        traits = ['Imperial Princess', 'Cultured', 'Diplomatic Link'];
      } else if (originName === 'Western Xia') {
        const xiaNames = ['Guchu', 'Muye', 'Yebapu', 'Weiming'];
        name = `Princess ${xiaNames[Math.floor(Math.random() * xiaNames.length)]}`;
        traits = ['Tangut Princess', 'Astute', 'Silk Road Origin'];
      } else if (originName === 'Kara-Khitan') {
        const khitanNames = ['Xiao', 'Yelü', 'Pusuwan', 'Tabuyan'];
        name = `Princess ${khitanNames[Math.floor(Math.random() * khitanNames.length)]}`;
        traits = ['Khitan Noble', 'Linguistic Scholar', 'Graceful'];
      } else if (originName === 'Khwarazmian Empire') {
        const khwNames = ['Fatimah', 'Shireen', 'Roxana', 'Soraya', 'Yasmin', 'Reyhan'];
        name = `Princess ${khwNames[Math.floor(Math.random() * khwNames.length)]}`;
        traits = ['Persian Royalty', 'Educated', 'Exotic Elegance'];
      } else if (originName === 'Sultanate of Delhi') {
        const delhiNames = ['Razia', 'Jahanara', 'Mumtaz', 'Zeenat', 'Niloufer'];
        name = `Princess ${delhiNames[Math.floor(Math.random() * delhiNames.length)]}`;
        traits = ['Delhi Princess', 'Golden Silk Threaded', 'Strategic Chess player'];
      } else {
        const fallbackName = MONGOL_NAMES_FEMALE[Math.floor(Math.random() * MONGOL_NAMES_FEMALE.length)];
        name = `Princess ${fallbackName}`;
        traits = ['Imperial Princess', 'Cultured'];
      }
    }

    const princessFullName = originType === 'Tribe' ? `${name} of ${originName}` : `${name} (${originName})`;

    // Princess stats
    const stats: CharacterStats = {
      health: 85 + Math.floor(Math.random() * 16),
      happiness: 80,
      appearance: 80 + Math.floor(Math.random() * 21),
      strength: originType === 'Tribe' ? 50 + Math.floor(Math.random() * 31) : 20 + Math.floor(Math.random() * 21),
      intelligence: 65 + Math.floor(Math.random() * 31),
      perception: 60 + Math.floor(Math.random() * 31),
      leadership: 50 + Math.floor(Math.random() * 31),
      loyalty: isVassal ? 45 : 70, // Hostage concubines have lower starting loyalty
      reputation: 60 + Math.floor(Math.random() * 31),
      realmReputation: originType === 'Kingdom' ? 30 : 10,
      horseRiding: originType === 'Tribe' ? 70 + Math.floor(Math.random() * 26) : 30 + Math.floor(Math.random() * 21),
      archery: originType === 'Tribe' ? 60 + Math.floor(Math.random() * 31) : 10 + Math.floor(Math.random() * 11),
      wealth: originType === 'Kingdom' ? 500 : 150
    };

    const newConcubine: Relationship = {
      id: `concubine-${crypto.randomUUID()}`,
      name: princessFullName,
      type: 'Concubine',
      loyalty: isVassal ? 45 : 70,
      status: 'Active',
      traits,
      clan: originType === 'Tribe' ? originName : 'Royal Dynasty',
      socialClass: SocialClass.NOBLE,
      age,
      gender: Gender.FEMALE,
      avatarUrl: getNomadAvatar(name.replace('Princess ', ''), Gender.FEMALE, originName, age, undefined, SocialClass.NOBLE),
      stats,
      originType,
      originName
    };

    // Update tribeRelations or kingdomRelations
    let updatedTribeRelations = [...character.tribeRelations];
    let updatedKingdomRelations = character.kingdomRelations ? [...character.kingdomRelations] : undefined;
    let historyText = "";

    if (originType === 'Tribe') {
      updatedTribeRelations = character.tribeRelations.map(rel => {
        if (rel.name === originName) {
          const newStanding = isVassal ? Math.max(-100, rel.standing - 15) : Math.min(100, rel.standing + 25);
          const newLevel = isVassal ? rel.level : (newStanding >= 50 ? 'Allied' : newStanding >= 15 ? 'Friendly' : 'Neutral') as RelationLevel;
          return { ...rel, standing: newStanding, level: newLevel };
        }
        return rel;
      });

      if (isVassal) {
        historyText = `As a symbol of submission, the defeated ${originName} tribe yields their prized noble-daughter, ${princessFullName}, to serve as your concubine hostage.`;
      } else {
        historyText = `To cement your cooperative peace, you seal a treaty with the ${originName} chiefs, welcoming Princess ${princessFullName} to your hearth as an ally concubine (-350г).`;
      }
    } else {
      if (updatedKingdomRelations) {
        updatedKingdomRelations = updatedKingdomRelations.map(rel => {
          if (rel.name === originName) {
            const newStanding = isVassal ? Math.max(-100, rel.standing - 20) : Math.min(100, rel.standing + 35);
            const newLevel = isVassal ? rel.level : (newStanding >= 50 ? 'Allied' : newStanding >= 15 ? 'Friendly' : 'Neutral') as RelationLevel;
            return { ...rel, standing: newStanding, level: newLevel };
          }
          return rel;
        });
      }

      if (isVassal) {
        historyText = `Following the complete subjection of the ${originName}, their imperial court surrendered Princess ${princessFullName} as an hostage concubine of your Great White Yurt.`;
      } else {
        historyText = `After intense Silk Road diplomacy and payment of an imperial dowry (-1000г), you formalize an alliance with the ${originName}, taking Princess ${princessFullName} as an imperial concubine.`;
      }
    }

    // Update state
    const repBonus: number = isVassal ? (originType === 'Tribe' ? 10 : 20) : (originType === 'Tribe' ? 5 : 15);
    const ldrBonus: number = isVassal ? (originType === 'Tribe' ? 10 : 20) : 0;
    const realmBonus: number = isVassal ? 0 : (originType === 'Kingdom' ? 5 : 0);

    setCharacter({
      ...character,
      stats: {
        ...character.stats,
        wealth: character.stats.wealth - cost,
        reputation: Math.min(100, character.stats.reputation + repBonus),
        leadership: Math.min(100, character.stats.leadership + ldrBonus),
        realmReputation: Math.min(100, character.stats.realmReputation + realmBonus)
      },
      relationships: [...character.relationships, newConcubine],
      tribeRelations: updatedTribeRelations,
      kingdomRelations: updatedKingdomRelations,
      history: [...character.history, { age: character.age, text: historyText }]
    } as Character);

    const effectsList = [
      {
        label: "👑 Royal Concubine",
        value: princessFullName.toUpperCase(),
        isPositive: true
      }
    ];

    if (cost > 0) {
      effectsList.push({
        label: "💰 Imperial Dowry",
        value: `-${cost}г`,
        isPositive: false
      });
    }
    if (repBonus !== 0) effectsList.push({ label: "📈 Reputation", value: `+${repBonus}`, isPositive: true });
    if (ldrBonus !== 0) effectsList.push({ label: "👑 Leadership", value: `+${ldrBonus}`, isPositive: true });
    if (realmBonus !== 0) effectsList.push({ label: "🗺️ Realm Influence", value: `+${realmBonus}`, isPositive: true });

    setGenericActionResult({
      title: "Alliance Sealed",
      subtitle: `${newConcubine.name} taken as concubine`,
      storySnippet: historyText,
      effects: effectsList
    });
  };

  const handleDiplomacyAction = (tribeName: string, action: 'trade' | 'alliance' | 'war' | 'peace' | 'demand-tribute' | 'negotiate-peace' | 'gift-horses' | 'sabotage' | 'incite' | 'peaceful-vassalage') => {
    if (!character) return;

    const updatedRelations = character.tribeRelations.map(rel => {
      if (rel.name === tribeName) {
        let newLevel = rel.level;
        let newStanding = rel.standing;
        let isTrading = rel.isTrading;
        let historyText = "";
        let wealthChange = 0;
        let reputationChange = 0;
        let leadershipChange = 0;
        let healthChange = 0;
        let livestockChange: any = null;
        let conqueredTribesChange: string | null = null;
        let updatedMilitaryPower = rel.militaryPower;

        const tribeDefensivePower = 300 + Math.floor(Math.random() * 500); // Slightly weaker than full conquest defense for tribute check
        const powerRatio = character.militaryPower / (tribeDefensivePower || 1);

        if (action === 'trade') {
          if (character.stats.realmReputation >= 20 || character.stats.reputation >= 40) {
            isTrading = true;
            newStanding += 10;
            historyText = `Established a trade route with the ${tribeName} clan. Your name is becoming known across the steppe.`;
          } else {
             newStanding -= 5;
             historyText = `The ${tribeName} clan refused your trade envoys, citing your lack of a significant reputation in the realm.`;
          }
        } else if (action === 'alliance') {
          if (character.stats.leadership >= 60 && rel.standing >= 30 && character.stats.realmReputation >= 30) {
            newLevel = 'Allied';
            newStanding += 30;
            reputationChange = 10;
            historyText = `Forged a blood brother alliance with the chief of the ${tribeName} tribe. Your realm-wide renown swayed their decision!`;
          } else {
            newStanding -= 15;
            historyText = `Your offer of alliance was rejected by the ${tribeName}. They do not yet trust your leadership or global standing.`;
          }
        } else if (action === 'war') {
          newLevel = 'At War';
          newStanding = -100;
          isTrading = false;
          reputationChange = 5;
          historyText = `You have officially declared war on the ${tribeName}! The drums of war thunder across the steppe.`;
        } else if (action === 'demand-tribute') {
          // Success chance increases with powerRatio and Global Reputation
          const successChance = Math.min(0.95, (powerRatio / 2) + (character.stats.realmReputation / 100));
          if (Math.random() < successChance) {
            wealthChange = 400 + Math.floor(Math.random() * 600);
            newStanding -= 45;
            reputationChange = 5;
            historyText = `Cowed by your overwhelming military presence and global renown, the ${tribeName} handed over ${wealthChange}г in tribute to avoid conflict.`;
          } else {
            newStanding = -60;
            newLevel = 'At War';
            historyText = `The ${tribeName} took offense at your arrogant demands for tribute and declared war! "We would rather burn our yurts than pay you!"`;
          }
        } else if (action === 'peace') {
          const peaceCost = rel.level === 'At War' ? 500 : 200;
          if (character.stats.wealth >= peaceCost) {
            newLevel = 'Neutral';
            newStanding = 0;
            isTrading = false;
            wealthChange = -peaceCost;
            historyText = `After a gift of ${peaceCost}г and many negotiations, peace is restored with the ${tribeName}.`;
          }
        } else if (action === 'negotiate-peace') {
          // Requires high leadership
          if (character.stats.leadership >= 75) {
            newLevel = 'Neutral';
            newStanding = -10;
            isTrading = false;
            reputationChange = 10;
            leadershipChange = 5;
            historyText = `Using your immense personal authority and silver-tongued diplomacy, you convinced the ${tribeName} to agree to a ceasefire without paying a single coin in tribute.`;
          } else {
            newStanding -= 20;
            historyText = `The ${tribeName} scoffed at your attempts to negotiate without tribute. "You speak like a Khan, but your pockets are empty or your heart is weak!"`;
          }
        } else if (action === 'gift-horses') {
          if (character.livestock.horses >= 3) {
            newStanding += 20;
            isTrading = true;
            livestockChange = { horses: -3 };
            historyText = `You gifted 3 sturdy horses to the ${tribeName} clan elders. Deeply impressed by your magnanimity, they toasted your health and opened trade paths.`;
          } else {
            historyText = `You do not have enough horses to send as a diplomatic gift.`;
          }
        } else if (action === 'sabotage') {
          const success = Math.random() < 0.65;
          if (success) {
            updatedMilitaryPower = Math.max(100, rel.militaryPower - 150);
            newStanding -= 15;
            reputationChange = 5;
            wealthChange = 150;
            livestockChange = { horses: 1 };
            historyText = `Your stealth riders slipped into the pastures of the ${tribeName} under a dark moon, poisoning their reserve fodder and stealing a prime war-steed. Their military power has withered (-150 Power).`;
          } else {
            healthChange = -15;
            newStanding -= 40;
            if (newStanding <= -30) {
              newLevel = 'At War';
            }
            historyText = `Your raiders were ambushed by alert ${tribeName} guards! In the chaotic nighttime retreat, you suffered a serious wound (-15 Health) and relations plummeted to rock-bottom with war declared.`;
          }
        } else if (action === 'incite') {
          const other = character.tribeRelations.find(t => t.name !== tribeName);
          if (other) {
            wealthChange = -200;
            newStanding -= 5;
            updatedMilitaryPower = Math.max(100, rel.militaryPower - 250);
            historyText = `You paid 200г in bribes and forged letters to stir up a blood feud between the ${tribeName} and the ${other.name}. Both clans have clashed at the border, suffering heavy casualties (-250 Power scale).`;
          } else {
            historyText = `There is no other neighboring tribe to incite conflict against.`;
          }
        } else if (action === 'peaceful-vassalage') {
          if (rel.standing >= 60 && character.stats.leadership >= 80 && character.militaryPower >= rel.militaryPower * 1.5) {
            const success = Math.random() < 0.85;
            if (success) {
              newLevel = 'Allied';
              newStanding = 100;
              reputationChange = 15;
              leadershipChange = 10;
              wealthChange = 400;
              conqueredTribesChange = tribeName;
              historyText = `In awe of your commanding leadership and overwhelming military supremacy, the elders of the ${tribeName} tribe formally bent the knee. They have joined your Khaganate peacefully!`;
            } else {
              newStanding -= 35;
              historyText = `The ${tribeName} elders proudly refused your offer of vassalage. "We are free people of the grass, and we do not bow without a storm!" Relations have significantly cooled.`;
            }
          } else {
            historyText = `You do not meet the strict requirements of 60+ standing, 80+ leadership, and 1.5x their military power to demand peaceful vassalage.`;
          }
        }

        return { 
          ...rel, 
          level: newLevel as RelationLevel, 
          standing: Math.max(-100, Math.min(100, newStanding)), 
          isTrading,
          militaryPower: updatedMilitaryPower,
          historyText,
          wealthChange,
          reputationChange,
          leadershipChange,
          healthChange,
          livestockChange,
          conqueredTribesChange
        } as any;
      }
      return rel;
    });

    const actionData = updatedRelations.find(r => (r as any).historyText) as any;
    if (!actionData) return;

    const wealthChange = actionData.wealthChange || 0;
    const reputationChange = actionData.reputationChange || 0;
    const leadershipChange = actionData.leadershipChange || 0;
    const healthChange = actionData.healthChange || 0;
    const livestockChange = actionData.livestockChange || null;
    const conqueredTribesChange = actionData.conqueredTribesChange || null;
    const histMsg = actionData.historyText;

    // Apply secondary effects if we did an incite action!
    let finalRelations = updatedRelations.map(({ historyText, wealthChange, reputationChange, leadershipChange, healthChange, livestockChange, conqueredTribesChange, ...rest }: any) => rest);
    
    if (action === 'incite' && actionData.wealthChange === -200) {
      const other = character.tribeRelations.find(t => t.name !== tribeName);
      if (other) {
        finalRelations = finalRelations.map(rel => {
          if (rel.name === other.name) {
            return {
              ...rel,
              militaryPower: Math.max(100, rel.militaryPower - 250)
            };
          }
          return rel;
        });
      }
    }

    const nextStats = {
      ...character.stats,
      wealth: character.stats.wealth + wealthChange,
      reputation: Math.max(0, Math.min(100, character.stats.reputation + reputationChange)),
      realmReputation: Math.max(0, Math.min(100, character.stats.realmReputation + (reputationChange > 0 ? Math.ceil(reputationChange / 5) : 0))),
      leadership: Math.max(0, Math.min(100, character.stats.leadership + leadershipChange)),
      health: Math.max(0, Math.min(100, character.stats.health + healthChange))
    };

    let nextLivestock = { ...character.livestock };
    if (livestockChange) {
      Object.entries(livestockChange).forEach(([k, v]) => {
        const key = k as keyof typeof nextLivestock;
        nextLivestock[key] = Math.max(0, nextLivestock[key] + (v as number));
      });
    }

    let nextConqueredTribes = [...character.conqueredTribes];
    if (conqueredTribesChange) {
      if (!nextConqueredTribes.includes(conqueredTribesChange)) {
        nextConqueredTribes.push(conqueredTribesChange);
      }
    }

    let updatedCampaign = character.activeCampaign ? { ...character.activeCampaign } : undefined;
    const isNowAtWar = finalRelations.some(r => r.name === tribeName && r.level === 'At War');
    const isNowNormal = finalRelations.some(r => r.name === tribeName && r.level !== 'At War');

    if (isNowAtWar && !updatedCampaign) {
      const rel = character.tribeRelations.find(r => r.name === tribeName);
      const enemyPower = rel ? rel.militaryPower : (300 + Math.floor(Math.random() * 500));
      updatedCampaign = {
        targetTribe: tribeName,
        year: 1,
        playerProgress: 30,
        playerCasualties: 0,
        enemyCasualties: 0,
        enemyPower: enemyPower,
        enemyInitialPower: enemyPower,
        combatLog: [`${tribeName} аймагтай хийх аян дайн эхэллээ. Жил бүрийн бэлтгэл, стратегиа сонгож тактик гаргана уу.`],
        resolvedForThisYear: false
      };
    } else if (isNowNormal && updatedCampaign && updatedCampaign.targetTribe === tribeName) {
      updatedCampaign = undefined;
    }

    const updatedChar: Character = {
      ...character,
      stats: nextStats,
      livestock: nextLivestock,
      conqueredTribes: nextConqueredTribes,
      tribeRelations: finalRelations,
      activeCampaign: updatedCampaign,
      history: histMsg ? [...character.history, { age: character.age, text: histMsg }] : character.history
    };

    if (conqueredTribesChange) {
      const milData = calculateMilitaryPower(updatedChar);
      updatedChar.militaryPower = milData.power;
      updatedChar.hordeSize = milData.soldiers;
    }

    setCharacter(updatedChar);

    // RESULT PANEL STYLING
    const effectsList: any[] = [];
    if (wealthChange !== 0) {
      effectsList.push({
        label: "💰 Wealth",
        value: wealthChange > 0 ? `+${wealthChange}г` : `${wealthChange}г`,
        isPositive: wealthChange > 0,
        isNegative: wealthChange < 0
      });
    }
    if (reputationChange !== 0) {
      effectsList.push({
        label: "📈 Reputation",
        value: reputationChange > 0 ? `+${reputationChange}` : `${reputationChange}`,
        isPositive: reputationChange > 0,
        isNegative: reputationChange < 0
      });
    }
    if (leadershipChange !== 0) {
      effectsList.push({
        label: "👑 Leadership",
        value: leadershipChange > 0 ? `+${leadershipChange}` : `${leadershipChange}`,
        isPositive: leadershipChange > 0,
        isNegative: leadershipChange < 0
      });
    }
    if (healthChange !== 0) {
      effectsList.push({
        label: "❤️ Health",
        value: healthChange > 0 ? `+${healthChange}` : `${healthChange}`,
        isPositive: healthChange > 0,
        isNegative: healthChange < 0
      });
    }
    if (livestockChange) {
      Object.entries(livestockChange).forEach(([k, v]) => {
        effectsList.push({
          label: `🐎 Herd: ${k.charAt(0).toUpperCase() + k.slice(1)}`,
          value: (v as number) > 0 ? `+${v}` : `${v}`,
          isPositive: (v as number) > 0,
          isNegative: (v as number) < 0
        });
      });
    }
    if (conqueredTribesChange) {
      effectsList.push({
        label: "👑 Vassal Submission",
        value: `${conqueredTribesChange.toUpperCase()}`,
        isPositive: true
      });
    }

    const origRel = character.tribeRelations.find(r => r.name === tribeName);
    const startStanding = origRel ? origRel.standing : 0;
    const endStanding = actionData.standing;
    const standDiff = endStanding - startStanding;
    if (standDiff !== 0) {
      effectsList.push({
        label: `👥 ${tribeName} Standing`,
        value: standDiff > 0 ? `+${standDiff}` : `${standDiff}`,
        isPositive: standDiff > 0,
        isNegative: standDiff < 0
      });
    }

    setGenericActionResult({
      title: `${action.replace('-', ' ').toUpperCase()} Outcome`,
      subtitle: `${tribeName} Clan`,
      storySnippet: histMsg,
      effects: effectsList
    });
  };

  const handleSelectCandidate = (candidate: Relationship) => {
    if (!character) return;
    
    const isWife = candidate.type === 'Spouse Candidate';
    const type = isWife 
      ? (character.relationships.some(r => r.type === 'Spouse') ? 'Second Wife' : 'Spouse')
      : 'Concubine';
    
    const newRel: Relationship = {
      ...candidate,
      type: type,
      status: 'Active'
    };

    const updatedChar: Character = {
      ...character,
      stats: { ...character.stats },
      relationships: [...character.relationships, newRel],
      marriageCandidates: undefined,
      history: [...character.history, { 
        age: character.age, 
        text: isWife 
          ? `You have taken ${candidate.name} of the ${candidate.clan} Clan as your ${type}.`
          : `You have taken ${candidate.name} as your concubine.`
      }]
    };

    // Apply trait-based bonuses
    if (candidate.traits) {
      candidate.traits.forEach(trait => {
        switch (trait) {
          case 'Wise': 
            updatedChar.stats.intelligence += 10;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s wisdom enlightens your path.` });
            break;
          case 'Ambitious':
            updatedChar.stats.reputation += 15;
            updatedChar.stats.loyalty -= 5;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s ambition pushes the clan forward, though some whisper of their designs.` });
            break;
          case 'Brave':
            updatedChar.stats.strength += 10;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s courage inspires the warriors.` });
            break;
          case 'Kind':
            updatedChar.stats.happiness += 15;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s kindness brings warmth to the yurt.` });
            break;
          case 'High-Born':
            updatedChar.stats.reputation += 20;
            updatedChar.clanWealth += 1000;
            updatedChar.history.push({ age: character.age, text: `Alliance with the noble ${candidate.clan} clan bolsters your coffers and standing.` });
            break;
          case 'Wealthy':
            updatedChar.clanWealth += 500;
            updatedChar.history.push({ age: character.age, text: `${candidate.name} brings a significant dowry to the household.` });
            break;
          case 'Hardy':
            updatedChar.stats.health += 5;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s robustness ensures a healthy household.` });
            break;
          case 'Beautiful':
            updatedChar.stats.appearance += 10;
            updatedChar.history.push({ age: character.age, text: `Your union with ${candidate.name} is the envy of many.` });
            break;
          case 'Political':
            updatedChar.stats.leadership += 10;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s political acumen aids your rule.` });
            break;
          case 'Learned':
            updatedChar.stats.intelligence += 5;
            updatedChar.stats.leadership += 5;
            break;
          case 'Loyal':
            updatedChar.stats.loyalty += 20;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s unwavering loyalty stabilizes your inner circle.` });
            break;
          case 'Deceitful':
            updatedChar.stats.intelligence += 8;
            updatedChar.stats.reputation -= 15;
            updatedChar.history.push({ age: character.age, text: `${candidate.name}'s double-tongued nature is useful for intrigue, but damaging to your honor.` });
            break;
        }
      });
    }

    if (!isWife) {
      updatedChar.stats.happiness += 20;
    }

    setCharacter(updatedChar);
  };

  const handlePleasureTentChoice = (candidate: Relationship, type: 'OneNight' | 'Mistress') => {
    if (!character) return;

    let updatedChar = { ...character };
    updatedChar.stats = { ...character.stats };
    updatedChar.relationships = [...character.relationships];
    updatedChar.history = [...character.history];

    let cost = 0;
    let healthImpact = 0;
    let happinessGain = 0;
    let spouseLoyaltyImpact = 0;
    let otherWivesLoyaltyImpact = 0;
    let text = "";
    let success = true;

    // 1. Calculate health risk (foul fever chance 20%)
    const contractDisease = Math.random() < 0.2;
    if (contractDisease) {
      healthImpact = -15;
      updatedChar.stats.health = Math.max(1, updatedChar.stats.health - 15);
      updatedChar.stats.reputation = Math.max(0, updatedChar.stats.reputation - 10);
    }

    if (type === 'OneNight') {
      cost = 0; // Brothel entry already paid 150г earlier
      happinessGain = 10;
      spouseLoyaltyImpact = -15;
      otherWivesLoyaltyImpact = -8;

      updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 10);
      
      updatedChar.relationships = updatedChar.relationships.map(rel => {
        if (rel.type === 'Spouse') {
          return { ...rel, loyalty: Math.max(0, (rel.loyalty || 0) - 15) };
        }
        if (['Second Wife', 'Concubine', 'Mistress'].includes(rel.type)) {
          return { ...rel, loyalty: Math.max(0, (rel.loyalty || 0) - 8) };
        }
        return rel;
      });

      const diseaseText = contractDisease 
        ? " However, the morning brings a foul desert fever that leaves you shivering and weak (Health -15, Reputation -10)."
        : " You slip away before dawn with your desires satisfied.";

      text = `You spent a passionate night with ${candidate.name} in the candle-lit tents.${diseaseText}`;
      updatedChar.history.push({ age: character.age, text });

    } else {
      // Take Mistress - requires 150г
      cost = 150;
      if (character.stats.wealth < 150) {
        success = false;
        text = `You do not have enough wealth (150г required, you only have ${character.stats.wealth}г) to construct an auxiliary yurt and secure a suitable stipend for ${candidate.name}!`;
      } else {
        happinessGain = 15;
        spouseLoyaltyImpact = -25;
        otherWivesLoyaltyImpact = -12;

        updatedChar.stats.wealth -= 150;
        updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 15);

        const newRel: Relationship = {
          ...candidate,
          type: 'Mistress',
          status: 'Active',
          loyalty: 85
        };
        updatedChar.relationships.push(newRel);

        updatedChar.relationships = updatedChar.relationships.map(rel => {
          if (rel.id === candidate.id) return rel;
          if (rel.type === 'Spouse') {
            return { ...rel, loyalty: Math.max(0, (rel.loyalty || 0) - 25) };
          }
          if (['Second Wife', 'Concubine', 'Mistress'].includes(rel.type)) {
            return { ...rel, loyalty: Math.max(0, (rel.loyalty || 0) - 12) };
          }
          return rel;
        });

        const diseaseText = contractDisease 
          ? " However, nesting closely with her has left you feeling terribly feverish (Health -15, Reputation -10)."
          : " The elders whisper of your flagrant disregard for ancestral customs, but she happily moves into your domestic camp.";

        text = `You have officially taken ${candidate.name} as your mistress. A private secondary yurt has been built.${diseaseText}`;
        updatedChar.history.push({ age: character.age, text });
      }
    }

    if (success) {
      setCharacter(updatedChar);
    }

    setPleasureTentOutcome({
      type,
      success,
      candidateName: candidate.name,
      text,
      cost: success ? cost : 0,
      healthImpact: success ? healthImpact : 0,
      happinessGain: success ? happinessGain : 0,
      spouseLoyaltyImpact: success ? spouseLoyaltyImpact : 0,
      otherWivesLoyaltyImpact: success ? otherWivesLoyaltyImpact : 0
    });
  };

  const handleSelectMistress = (candidate: Relationship) => {
    if (!character) return;
    
    const newRel: Relationship = {
      ...candidate,
      type: 'Mistress',
      status: 'Active'
    };

    const updatedChar: Character = {
      ...character,
      stats: { ...character.stats },
      relationships: [...character.relationships, newRel],
      history: [...character.history, { 
        age: character.age, 
        text: `You have taken ${candidate.name} as your mistress after meeting at the pleasure tents.`
      }]
    };

    updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 10);
    setCharacter(updatedChar);
    setPleasureTentCandidates(null);
  };

  const handleSelectFriend = (candidate: Relationship) => {
    if (!character) return;
    
    // Generate some standard attributes for the friend so interaction works seamlessly
    const genStat = (base: number, variation: number) => Math.min(100, Math.max(5, Math.floor(base + Math.random() * variation)));
    const personWithStats: Relationship = {
      ...candidate,
      type: 'Friend',
      status: 'Active',
      stats: {
        health: genStat(50, 45),
        happiness: genStat(60, 35),
        appearance: genStat(40, 50),
        strength: genStat(30, 55),
        intelligence: genStat(30, 55),
        perception: genStat(20, 60),
        leadership: genStat(20, 60),
        loyalty: candidate.loyalty || genStat(50, 45),
        reputation: genStat(15, 60),
        realmReputation: genStat(0, 15),
        horseRiding: genStat(35, 55),
        archery: genStat(30, 55),
        wealth: 0
      }
    };

    const originText = candidate.originName ? ` from the neighboring ${candidate.originName} ${candidate.originType}` : '';
    const updatedChar: Character = {
      ...character,
      stats: { ...character.stats },
      relationships: [...character.relationships, personWithStats],
      history: [...character.history, { 
        age: character.age, 
        text: `You have befriended ${candidate.name} of the ${candidate.clan || 'Unknown'} Clan${originText}. You shared stories of the steppe.`
      }]
    };

    updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 10);
    setCharacter(updatedChar);
    setFriendCandidates(null);
  };

  const handleFriendAction = (friend: Relationship, actionType: 'Kumiss' | 'Hunt' | 'Gossip') => {
    if (!character) return;

    let storySnippet = "";
    let loyaltyMod = 0;
    let statUpdates: Partial<Character['stats']> = {};
    let friendStatUpdates: Partial<Relationship['stats']> = {};

    if (actionType === 'Kumiss') {
      loyaltyMod = 10 + Math.floor(Math.random() * 6);
      storySnippet = `You share bowls of cold, fermented Kumiss around the campfire with your friend ${friend.name}. You drink, sing tribal songs, and grow closer.`;
      statUpdates = { happiness: Math.min(100, (character.stats.happiness || 0) + 12) };
    } else if (actionType === 'Hunt') {
      loyaltyMod = 8 + Math.floor(Math.random() * 5);
      storySnippet = `You ride down the valleys with ${friend.name} in a swift pursuit of wild game. Your cooperative hunting sharpens your synergy.`;
      
      const playerStrChange = Math.random() > 0.5 ? 1 : 0;
      const playerArcheryChange = Math.random() > 0.3 ? 1 : 0;
      if (playerStrChange || playerArcheryChange) {
        statUpdates = {
          strength: Math.min(100, (character.stats.strength || 0) + playerStrChange),
          archery: Math.min(100, (character.stats.archery || 0) + playerArcheryChange)
        };
      }
      
      const fStrength = (friend.stats?.strength || 15) + (Math.random() > 0.5 ? 2 : 0);
      const fArchery = (friend.stats?.archery || 15) + (Math.random() > 0.3 ? 2 : 0);
      friendStatUpdates = {
        strength: Math.min(100, fStrength),
        archery: Math.min(100, fArchery)
      };
    } else if (actionType === 'Gossip') {
      loyaltyMod = 5 + Math.floor(Math.random() * 4);
      storySnippet = `You and ${friend.name} gossip about camp rivalries and local chieftains. Exchanging political whispers deepens your mutual trust.`;
      
      const playerIntelChange = Math.random() > 0.6 ? 1 : 0;
      if (playerIntelChange) {
        statUpdates = { intelligence: Math.min(100, (character.stats.intelligence || 0) + playerIntelChange) };
      }
      
      const fIntel = (friend.stats?.intelligence || 15) + (Math.random() > 0.6 ? 2 : 0);
      friendStatUpdates = { intelligence: Math.min(100, fIntel) };
    }

    // Update relationship state
    const updatedRels = character.relationships.map(r => {
      if (r.id === friend.id || r.name === friend.name) {
        return {
          ...r,
          loyalty: Math.min(100, (r.loyalty || 0) + loyaltyMod),
          stats: r.stats ? { ...r.stats, ...friendStatUpdates } : r.stats
        };
      }
      return r;
    });

    const finalStats = { ...character.stats };
    Object.entries(statUpdates).forEach(([key, val]) => {
      const k = key as keyof typeof finalStats;
      finalStats[k] = val as any;
    });

    const updatedChar: Character = {
      ...character,
      stats: finalStats,
      relationships: updatedRels,
      history: [...character.history, { age: character.age, text: storySnippet }]
    };

    setCharacter(updatedChar);

    // Refresh selected person preview in UI
    const refreshedFriend = updatedRels.find(r => r.id === friend.id || r.name === friend.name);
    if (refreshedFriend) {
      setSelectedPerson(refreshedFriend);
    }

    const effectsList = [];
    if (loyaltyMod !== 0) {
      effectsList.push({
        label: `👥 ${friend.name}'s Loyalty`,
        value: `+${loyaltyMod}%`,
        isPositive: true
      });
    }
    Object.entries(statUpdates).forEach(([k, v]) => {
      const currentVal = character.stats[k as keyof typeof character.stats] || 0;
      const finalVal = v as number;
      const change = finalVal - currentVal;
      if (change !== 0) {
        effectsList.push({
          label: `📊 You: ${k.charAt(0).toUpperCase() + k.slice(1)}`,
          value: change > 0 ? `+${change}` : `${change}`,
          isPositive: change > 0,
          isNegative: change < 0
        });
      }
    });

    setGenericActionResult({
      title: `${actionType} Outing`,
      subtitle: `${friend.name} (${friend.type})`,
      storySnippet,
      avatarUrl: friend.avatarUrl,
      effects: effectsList
    });
  };

  const handleProposeToFriend = (friend: Relationship, unionType: 'Marriage' | 'Concubine') => {
    if (!character) return;

    let storySnippet = "";
    let updatedRels = [...character.relationships];

    if (unionType === 'Marriage') {
      const isWife = character.gender === Gender.MALE;
      const proposedType = isWife 
        ? (character.relationships.some(r => r.type === 'Spouse') ? 'Second Wife' : 'Spouse')
        : 'Spouse';

      updatedRels = character.relationships.map(r => {
        if (r.id === friend.id || r.name === friend.name) {
          return {
            ...r,
            type: proposedType,
            loyalty: 100
          };
        }
        return r;
      });

      storySnippet = `Your friendship with ${friend.name} climbs to its peak. With tribal songs and the blessing of the Eternal Sky, you have married them as your ${proposedType}!`;
    } else {
      updatedRels = character.relationships.map(r => {
        if (r.id === friend.id || r.name === friend.name) {
          return {
            ...r,
            type: 'Concubine',
            loyalty: 100
          };
        }
        return r;
      });

      storySnippet = `You requested ${friend.name} to enter your hearth as a concubine. Reflecting on your tight friendship, she smiles and moves into your yurt.`;
    }

    const updatedChar: Character = {
      ...character,
      relationships: updatedRels,
      stats: { ...character.stats, happiness: Math.min(100, character.stats.happiness + 20) },
      history: [...character.history, { age: character.age, text: storySnippet }]
    };

    // Apply traits to stats just like a candidate if present
    if (friend.traits) {
      friend.traits.forEach(trait => {
        switch (trait) {
          case 'Wise': 
            updatedChar.stats.intelligence = Math.min(100, updatedChar.stats.intelligence + 10);
            break;
          case 'Brave':
            updatedChar.stats.strength = Math.min(100, updatedChar.stats.strength + 10);
            break;
          case 'Kind':
            updatedChar.stats.happiness = Math.min(100, updatedChar.stats.happiness + 15);
            break;
          case 'High-Born':
            updatedChar.stats.reputation = Math.min(100, updatedChar.stats.reputation + 20);
            updatedChar.clanWealth += 1000;
            break;
          case 'Wealthy':
            updatedChar.clanWealth += 500;
            break;
          case 'Hardy':
            updatedChar.stats.health = Math.min(100, updatedChar.stats.health + 5);
            break;
          case 'Beautiful':
            updatedChar.stats.appearance = Math.min(100, updatedChar.stats.appearance + 10);
            break;
          case 'Political':
            updatedChar.stats.leadership = Math.min(100, updatedChar.stats.leadership + 10);
            break;
          case 'Learned':
            updatedChar.stats.intelligence = Math.min(100, updatedChar.stats.intelligence + 5);
            updatedChar.stats.leadership = Math.min(100, updatedChar.stats.leadership + 5);
            break;
        }
      });
    }

    setCharacter(updatedChar);

    const effectsList = [
      {
        label: "💍 Union Status",
        value: unionType === 'Marriage' ? "MARRIED" : "HEARTH PARTNER",
        isPositive: true
      },
      {
        label: "😊 Happiness",
        value: "+20",
        isPositive: true
      }
    ];

    if (friend.traits) {
      friend.traits.forEach(trait => {
        switch (trait) {
          case 'Wise': 
            effectsList.push({ label: "🧠 Intelligence", value: "+10", isPositive: true });
            break;
          case 'Brave':
            effectsList.push({ label: "💪 Strength", value: "+10", isPositive: true });
            break;
          case 'Kind':
            effectsList.push({ label: "😊 Happiness", value: "+15", isPositive: true });
            break;
          case 'High-Born':
            effectsList.push({ label: "👑 Reputation", value: "+20", isPositive: true });
            effectsList.push({ label: "💰 Clan Wealth", value: "+1000", isPositive: true });
            break;
          case 'Wealthy':
            effectsList.push({ label: "💰 Clan Wealth", value: "+500", isPositive: true });
            break;
          case 'Hardy':
            effectsList.push({ label: "❤️ Health", value: "+5", isPositive: true });
            break;
          case 'Beautiful':
            effectsList.push({ label: "✨ Appearance", value: "+10", isPositive: true });
            break;
          case 'Political':
            effectsList.push({ label: "👑 Leadership", value: "+10", isPositive: true });
            break;
          case 'Learned':
            effectsList.push({ label: "🧠 Intelligence", value: "+5", isPositive: true });
            effectsList.push({ label: "👑 Leadership", value: "+5", isPositive: true });
            break;
        }
      });
    }

    setGenericActionResult({
      title: unionType === 'Marriage' ? "Union Accomplished" : "Hearth Union",
      subtitle: friend.name,
      storySnippet,
      avatarUrl: friend.avatarUrl,
      effects: effectsList
    });

    setSelectedPerson(null); // Direct back to list so they see the change
  };

  const renderRelationships = () => (
    <div className="space-y-4">
      {selectedPerson ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <button 
            onClick={() => { setSelectedPerson(null); setIsGiftingMode(false); }}
            className="text-xs flex items-center gap-1 text-[#8b7355] hover:underline"
          >
            ← Back to all people
          </button>
          
          <div className="text-center p-6 bg-white/30 rounded-2xl border border-[#8b7355]/20">
             <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-2xl bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow shadow-2xl">
                   {selectedPerson.avatarUrl ? (
                     <img src={selectedPerson.avatarUrl} alt={selectedPerson.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <User size={48} className="text-[#c5a021]/60" />
                     </div>
                   )}
                </div>
             </div>
             {isEditingNPCName ? (
                <div className="flex items-center justify-center gap-2 mt-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={editedNPCName}
                    onChange={(e) => setEditedNPCName(e.target.value)}
                    maxLength={20}
                    className="px-3 py-1 bg-[#faf6f0] border border-[#8b7355]/40 text-[#2b1d0e] font-sans font-medium text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c5a021] w-full text-center"
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveNPCName}
                    className="px-2.5 py-1 bg-[#8b7355] hover:bg-[#5d4037] text-white rounded-lg font-sans font-bold text-[10px] transition-all shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingNPCName(false)}
                    className="px-2.5 py-1 bg-black/5 hover:bg-black/10 text-[#5d4037] rounded-lg font-sans font-bold text-[10px] transition-all shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-2xl font-display text-[#2b1d0e] leading-tight">{selectedPerson.name}</span>
                  {selectedPerson.status !== 'Deceased' && (
                    <button
                      onClick={() => {
                        setEditedNPCName(selectedPerson.name);
                        setIsEditingNPCName(true);
                      }}
                      className="p-1 hover:bg-black/5 rounded text-[#8b7355] transition-all"
                      title="Rename NPC"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                  )}
                </div>
              )}
             <div className="text-sm font-bold text-[#c57d21] uppercase">
               {selectedPerson.type} {selectedPerson.clan ? `(${selectedPerson.clan} Clan)` : ''}
             </div>
             {selectedPerson.originName && (
               <div className="text-[10px] text-[#5d4037] font-semibold tracking-wider mt-0.5 uppercase">
                 📡 Origin: {selectedPerson.originName} ({selectedPerson.originType})
               </div>
             )}
             {selectedPerson.isMarriageAlliance && (
               <div className="text-[10px] bg-red-900/10 text-red-900 px-2 py-0.5 rounded-full mt-1 inline-block font-bold">
                 MARRIAGE ALLIANCE
               </div>
             )}
             
             {/* Traits Display */}
             {selectedPerson.traits && selectedPerson.traits.length > 0 && (
               <div className="mt-3 flex flex-wrap justify-center gap-1">
                 {selectedPerson.traits.map(trait => (
                   <span key={trait} className="px-2 py-0.5 bg-[#2b1d0e]/10 text-[#5d4037] text-[10px] font-bold rounded-full border border-[#8b7355]/20">
                     {trait}
                   </span>
                 ))}
               </div>
             )}

             <div className="mt-4 flex flex-col items-center">
                <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Relationship Quality: {selectedPerson.loyalty}%</div>
                <div className="h-2 w-full max-w-xs bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-800 transition-all duration-500" style={{ width: `${selectedPerson.loyalty}%` }} />
                </div>
             </div>

             {/* Character Stats Grid */}
             {selectedPerson.stats && (
               <div className="mt-5 pt-4 border-t border-[#8b7355]/15">
                 <div className="text-[10px] uppercase font-bold text-[#8b7355] tracking-widest mb-2.5">Attributes</div>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left">
                   <StatProgressBar label="Strength" value={selectedPerson.stats.strength || 0} color="bg-orange-800" icon={<Sword size={8} />} />
                   <StatProgressBar label="Archery" value={selectedPerson.stats.archery || 0} color="bg-emerald-800" icon={<Target size={8} />} />
                   <StatProgressBar label="Intelligence" value={selectedPerson.stats.intelligence || 0} color="bg-blue-800" icon={<Brain size={8} />} />
                   <StatProgressBar label="Leadership" value={selectedPerson.stats.leadership || 0} color="bg-purple-800" icon={<Shield size={8} />} />
                   <StatProgressBar label="Riding" value={selectedPerson.stats.horseRiding || 0} color="bg-amber-800" icon={<MapIcon size={8} />} />
                   <StatProgressBar label="Appearance" value={selectedPerson.stats.appearance || 0} color="bg-pink-800" icon={<Sparkles size={8} />} />
                 </div>
               </div>
             )}

             {character?.designatedHeir === selectedPerson.name && (
               <div className="mt-4 px-4 py-1.5 bg-[#c5a021] text-[#2b1d0e] text-xs font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse">
                 Designated Heir
               </div>
             )}
          </div>

          {selectedPerson.status === 'Deceased' ? (
            <div className="text-center p-6 bg-[#2b1d0e]/5 rounded-xl border border-dashed border-[#8b7355]/30 flex flex-col items-center justify-center">
              <p className="text-xs text-[#5d4037] italic font-serif opacity-80 mb-2">
                "We come from the Earth, and our spirits rise to the Eternal Blue Sky."
              </p>
              <div className="text-xs font-bold text-[#8b7355] uppercase tracking-wider">
                Deceased • Returned to Ancestral Spirits
              </div>
            </div>
          ) : isGiftingMode ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#2b1d0e]/5 p-5 rounded-2xl border border-[#8b7355]/30 flex flex-col gap-4 text-left w-full"
            >
              <div className="flex justify-between items-center border-b border-[#8b7355]/20 pb-3">
                <h4 className="font-display text-sm font-bold text-[#2b1d0e] tracking-wide uppercase flex items-center gap-1.5">
                  🎁 Select Gift for {selectedPerson.name}
                </h4>
                <button 
                  onClick={() => setIsGiftingMode(false)}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#8b7355] border border-[#8b7355]/30 rounded-lg hover:bg-[#8b7355]/10 transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* Standard Gold Option */}
              <div className="space-y-3">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-[#5d4037]/60">General Gift Option</div>
                <div className="p-3 bg-white/50 rounded-xl border border-[#8b7355]/25 flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-[#2b1d0e]">Standard Silk & Sweets Gift</div>
                    <div className="text-[10px] text-[#5d4037]/75">Present custom silk wares, tea bricks or fine metalwork (+15% Loyalty)</div>
                  </div>
                  <button
                    onClick={() => handleGiftStandard(selectedPerson)}
                    disabled={!character || character.stats.wealth < 20}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${
                      character && character.stats.wealth >= 20 
                        ? 'bg-yellow-950 text-[#e8dab2] hover:bg-yellow-900 border border-[#c5a021]/30 shadow-md animate-pulse' 
                        : 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                    }`}
                  >
                    20г
                  </button>
                </div>
              </div>

              {/* Custom equipment items / Property Assets list */}
              <div className="space-y-3 mt-1">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-[#5d4037]/60 font-sans">Equipment & Property (From Assets)</div>
                {character?.assets && character.assets.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                    {character.assets.map((asset) => (
                      <div key={asset.id} className="p-3 bg-[#c5a021]/5 rounded-xl border border-[#c5a021]/20 flex justify-between items-center transition-all hover:bg-[#c5a021]/10">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <div className="shrink-0 text-amber-900">
                            {asset.type === 'Horse' ? '🐎' : 
                             asset.type === 'Weapon' ? '⚔️' : 
                             asset.type === 'Armor' ? '🛡️' : '📦'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#2b1d0e] truncate">{asset.name}</div>
                            <div className="text-[9px] text-[#5d4037]/80">Value: {asset.value}г • Quality: {asset.quality}%</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGiftCustomAsset(selectedPerson, asset)}
                          className="px-2.5 py-1.5 bg-[#2b1d0e] hover:bg-[#2b1d0e]/80 text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm shrink-0"
                        >
                          Gift
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-[#5d4037]/60 pl-1">You own no custom weapons, armors, or prime mounts to bestow.</p>
                )}
              </div>

              {/* Livestock Gifting Section */}
              <div className="space-y-3 mt-1">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-[#5d4037]/60 font-sans">Stock from Personal Pastures (Livestock)</div>
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  
                  {/* Gift Horse */}
                  {character && character.livestock.horses >= 1 && (
                    <div className="p-3 bg-white/50 rounded-xl border border-[#8b7355]/25 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#2b1d0e]">🐎 Steppe War Horse (x1)</div>
                        <div className="text-[9px] text-[#5d4037]/80">A valued riding stallion from your family pasture (+18% Loyalty)</div>
                      </div>
                      <button
                        onClick={() => handleGiftLivestock(selectedPerson, 'horses', 1, 18, 'Steppe Stud')}
                        className="px-2.5 py-1.5 bg-[#2b1d0e] hover:bg-[#2b1d0e]/80 text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm shrink-0"
                      >
                        Gift
                      </button>
                    </div>
                  )}

                  {/* Gift Camel */}
                  {character && character.livestock.camels >= 1 && (
                    <div className="p-3 bg-white/50 rounded-xl border border-[#8b7355]/25 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#2b1d0e]">🐪 Bactrian Camel (x1)</div>
                        <div className="text-[9px] text-[#5d4037]/80">An elite dual-humped pack camel (+24% Loyalty)</div>
                      </div>
                      <button
                        onClick={() => handleGiftLivestock(selectedPerson, 'camels', 1, 24, 'Bactrian Camel')}
                        className="px-2.5 py-1.5 bg-[#2b1d0e] hover:bg-[#2b1d0e]/80 text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm shrink-0"
                      >
                        Gift
                      </button>
                    </div>
                  )}

                  {/* Gift Sheep */}
                  {character && character.livestock.sheep >= 10 && (
                    <div className="p-3 bg-white/50 rounded-xl border border-[#8b7355]/25 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#2b1d0e]">🐑 Flock of Sheep (x10)</div>
                        <div className="text-[9px] text-[#5d4037]/80">A substantial herd contribution of 10 sheep (+12% Loyalty)</div>
                      </div>
                      <button
                        onClick={() => handleGiftLivestock(selectedPerson, 'sheep', 10, 12, 'Grassland Sheep (10)')}
                        className="px-2.5 py-1.5 bg-[#2b1d0e] hover:bg-[#2b1d0e]/80 text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm shrink-0"
                      >
                        Gift
                      </button>
                    </div>
                  )}

                  {/* Gift Cattle */}
                  {character && character.livestock.cattle >= 5 && (
                    <div className="p-3 bg-white/50 rounded-xl border border-[#8b7355]/25 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#2b1d0e]">🐄 Herd of Cattle (x5)</div>
                        <div className="text-[9px] text-[#5d4037]/80">5 prime steppe cattle to enrich their pasture tent (+15% Loyalty)</div>
                      </div>
                      <button
                        onClick={() => handleGiftLivestock(selectedPerson, 'cattle', 5, 15, 'Steppe Cattle (5)')}
                        className="px-2.5 py-1.5 bg-[#2b1d0e] hover:bg-[#2b1d0e]/80 text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm shrink-0"
                      >
                        Gift
                      </button>
                    </div>
                  )}

                  {/* Gift Yaks */}
                  {character && character.livestock.yaks >= 3 && (
                    <div className="p-3 bg-white/50 rounded-xl border border-[#8b7355]/25 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#2b1d0e]">🐂 Shaggy Yaks (x3)</div>
                        <div className="text-[9px] text-[#5d4037]/80">3 mountain work-yaks for transport or hide production (+14% Loyalty)</div>
                      </div>
                      <button
                        onClick={() => handleGiftLivestock(selectedPerson, 'yaks', 3, 14, 'Shaggy Yaks (3)')}
                        className="px-2.5 py-1.5 bg-[#2b1d0e] hover:bg-[#2b1d0e]/80 text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm shrink-0"
                      >
                        Gift
                      </button>
                    </div>
                  )}

                  {/* Fallback if no pastoral options can be gifted */}
                  {(!character || (character.livestock.horses < 1 && character.livestock.camels < 1 && character.livestock.sheep < 10 && character.livestock.cattle < 5 && character.livestock.yaks < 3)) && (
                    <p className="text-[11px] italic text-[#5d4037]/60 pl-1">No pasture livestock herd options are large enough to be gifted singly.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {['Spend Time', 'Give Gift', 'Ask for Advice', 'Praise', 'Discipline', 'Insult'].map(action => (
                <button
                  key={action}
                  onClick={() => {
                    if (action === 'Give Gift') {
                      setIsGiftingMode(true);
                    } else {
                      handleInteract(selectedPerson, action);
                    }
                  }}
                  className={`p-4 rounded-xl border text-sm font-bold transition-all ${action === 'Insult' ? 'border-red-900/20 text-red-900 hover:bg-red-900/10' : 'border-[#8b7355]/30 text-[#2b1d0e] hover:bg-white/60'}`}
                >
                  {action}
                </button>
              ))}
              {(selectedPerson.type === 'Spouse' || selectedPerson.type === 'Second Wife' || selectedPerson.type === 'Concubine' || selectedPerson.type === 'Mistress') && (() => {
                const isPlayerMother = character?.gender === Gender.FEMALE;
                const isPregnant = isPlayerMother 
                  ? !!character?.pregnancy?.isPregnant 
                  : !!selectedPerson.pregnancy?.isPregnant;
                return (
                  <button
                    onClick={() => {
                      if (isPregnant) return;
                      handleHaveChild(selectedPerson);
                    }}
                    disabled={isPregnant}
                    className={`col-span-2 p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${isPregnant ? 'bg-stone-200 border-stone-800/10 text-stone-500 cursor-not-allowed opacity-60' : 'border-yellow-900/30 bg-yellow-900/5 text-yellow-900 font-bold hover:bg-yellow-900/10'}`}
                  >
                    <Sparkles size={18} />
                    {isPregnant ? 'Pregnancy in Progress (Birth Next Year)' : 'Make Child'}
                  </button>
                );
              })()}
              {(selectedPerson.type === 'Child' || selectedPerson.type === 'Adult Child' || selectedPerson.type === 'Relative') && character?.heirId !== selectedPerson.id && (
                <button
                  onClick={() => handleDesignateHeir(selectedPerson.id)}
                  className="col-span-2 p-4 rounded-xl border border-[#c5a021] bg-[#c5a021]/10 text-[#2b1d0e] font-display text-sm tracking-widest hover:bg-[#c5a021]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trophy size={18} className="text-[#c5a021]" />
                  DESIGNATE AS HEIR
                </button>
              )}
              {selectedPerson.type === 'Friend' && (
                <>
                  <button
                    onClick={() => handleFriendAction(selectedPerson, 'Kumiss')}
                    className="col-span-2 p-4 rounded-xl border border-amber-900/30 bg-amber-900/5 text-amber-900 font-bold hover:bg-amber-900/10 transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    🍺 Share Kumiss Together (Free)
                  </button>
                  <button
                    onClick={() => handleFriendAction(selectedPerson, 'Hunt')}
                    className="col-span-2 p-4 rounded-xl border border-emerald-900/30 bg-emerald-900/5 text-emerald-900 font-bold hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    🏹 Practice Hunting & Archery
                  </button>
                  <button
                    onClick={() => handleFriendAction(selectedPerson, 'Gossip')}
                    className="col-span-2 p-4 rounded-xl border border-blue-900/30 bg-blue-900/5 text-blue-900 font-bold hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    🗣️ Gossip about Clan Politics
                  </button>
                  
                  <div className="col-span-2 border-t border-[#8b7355]/25 my-1 pt-3 space-y-2">
                    <div className="text-[10px] text-center uppercase font-bold text-[#8b7355] tracking-widest">Elevate Relationship</div>
                    <button
                      onClick={() => handleProposeToFriend(selectedPerson, 'Marriage')}
                      disabled={selectedPerson.loyalty < 60}
                      className={`w-full p-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        selectedPerson.loyalty < 60 
                          ? 'bg-stone-200 border-stone-800/10 text-stone-500 cursor-not-allowed opacity-60' 
                          : 'border-yellow-900/30 bg-yellow-900/10 text-yellow-900 hover:bg-yellow-900/20 shadow-md'
                      }`}
                    >
                      💍 Propose Marriage {selectedPerson.loyalty < 60 && "(Needs 60+ Loyalty)"}
                    </button>

                    {character?.gender === Gender.MALE && selectedPerson.gender === Gender.FEMALE && (
                      <button
                        onClick={() => handleProposeToFriend(selectedPerson, 'Concubine')}
                        disabled={selectedPerson.loyalty < 45}
                        className={`w-full p-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          selectedPerson.loyalty < 45 
                            ? 'bg-stone-200 border-stone-800/10 text-stone-500 cursor-not-allowed opacity-60' 
                            : 'border-rose-900/30 bg-rose-900/10 text-rose-900 hover:bg-rose-900/20 shadow-md'
                        }`}
                      >
                        💋 Take as Concubine {selectedPerson.loyalty < 45 && "(Needs 45+ Loyalty)"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          <div className="flex justify-center gap-2 mb-2 bg-[#2b1d0e]/5 p-1 rounded-xl border border-[#8b7355]/10 shadow-inner">
             <button 
              onClick={() => setRelationshipSort('loyalty')}
              className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${relationshipSort === 'loyalty' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-md ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/10'}`}
             >
              <Heart size={10} className={relationshipSort === 'loyalty' ? 'text-[#c5a021]' : ''} />
              By Loyalty
             </button>
             <button 
              onClick={() => setRelationshipSort('name')}
              className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${relationshipSort === 'name' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-md ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/10'}`}
             >
              <Users size={10} className={relationshipSort === 'name' ? 'text-[#c5a021]' : ''} />
              By Name
             </button>
          </div>
          
          {[...(character?.relationships || [])].sort((a, b) => {
            if (relationshipSort === 'loyalty') {
              const aVal = a.status === 'Deceased' ? -1 : a.loyalty;
              const bVal = b.status === 'Deceased' ? -1 : b.loyalty;
              return bVal - aVal;
            }
            return a.name.localeCompare(b.name);
          }).map((rel, i) => {
            const isDeceased = rel.status === 'Deceased';
            return (
              <button 
                key={i} 
                onClick={() => handleSelectPerson(rel)}
                className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left group ${isDeceased ? 'bg-black/5 border-stone-800/10 opacity-60 hover:bg-black/10' : 'bg-white/40 border-[#8b7355]/10 hover:bg-white/60'}`}
              >
              <div className={`h-16 w-16 rounded-xl bg-[#2b1d0e] avatar-frame-leather avatar-portrait avatar-inner-shadow shrink-0 transition-transform group-hover:scale-105 ${isDeceased ? 'grayscale contrast-75' : ''}`}>
                 {rel.avatarUrl ? (
                   <img src={rel.avatarUrl} alt={rel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                      <User size={24} className="text-[#c5a021]/30" />
                   </div>
                 )}
              </div>
              <div className="flex-1">
                <div className={`font-bold flex items-center gap-2 ${isDeceased ? 'text-[#2b1d0e]/60 line-through' : 'text-[#2b1d0e]'}`}>
                  {rel.name}
                  {rel.isMarriageAlliance && (
                    <span className="text-[7px] bg-red-900/10 text-red-900 px-1 py-0.5 rounded-full font-bold">ALLIANCE</span>
                  )}
                  {character?.designatedHeir === rel.name && (
                    <span className="text-[7px] bg-[#c5a021] text-[#2b1d0e] px-1 py-0.5 rounded-full font-black">HEIR</span>
                  )}
                  {isDeceased && (
                    <span className="text-[7px] bg-[#5d4037]/20 text-[#5d4037] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">PASSED</span>
                  )}
                </div>
                <div className="text-xs text-[#5d4037] mb-1">
                  <span>{rel.type} {rel.clan ? `(${rel.clan})` : ''}</span>
                  {rel.age !== undefined && (
                    <span className="ml-1.5 text-[10px] font-bold text-[#8b7355]">
                      {isDeceased ? `(Died at age ${rel.age})` : `(Age: ${rel.age})`}
                    </span>
                  )}
                  {rel.originName && (
                    <span className="block text-[8px] text-[#c57d21] font-bold uppercase tracking-widest mt-0.5">
                      🧭 {rel.originName} ({rel.originType})
                    </span>
                  )}
                </div>
                {rel.traits && rel.traits.length > 0 && (
                  <div className="flex gap-1">
                    {rel.traits.slice(0, 2).map(t => (
                      <span key={t} className="text-[8px] px-1.5 py-0.5 bg-[#8b7355]/10 text-[#5d4037] rounded-sm font-bold uppercase tracking-tighter">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                {isDeceased ? (
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">Eternal sky</span>
                ) : (
                  <>
                    <div className="text-[10px] uppercase opacity-60">Loyalty</div>
                    <div className="h-1.5 w-16 bg-black/10 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-green-800" style={{ width: `${rel.loyalty}%` }} />
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </>
    )}
    </div>
  );

  const renderAssets = () => {
    if (!character) return null;

    const isMilitaryRole = (role: string) => {
      return [
        'Horseback Recruit', 'Warrior', 'Vanguard', 'Squad Leader (Arban)',
        'Centurion (Zuun)', 'Commander of Thousand (Mingghan)', 'General',
        'Warlord', 'Marshal of the Empire', 'Kheshig Aspirant', 'Imperial Guard (Kheshig)'
      ].includes(role);
    };

    const calculateAuxillaryIncome = () => {
      let income = 0;
      if (character.socialClass === 'Blacksmith family') {
        income = (character.stats.strength * 2) + (character.stats.intelligence * 2);
      } else if (character.socialClass === 'Merchant Family' || character.role.includes('Merchant') || character.role.includes('Trader') || character.role.includes('Guild')) {
        let scrollMultiplier = 0.05;
        if (character.role === 'Merchant Prince') scrollMultiplier = 0.10;
        if (character.role === 'Guild Master') scrollMultiplier = 0.15;
        income = Math.floor(character.stats.wealth * scrollMultiplier);
      }
      return income;
    };

    const calculateAuxillaryMaintenance = () => {
      let maintenance = 0;
      if (character.socialClass === 'Noble Clan' && character.age > 18 && !character.role.includes('Great Khan')) {
        maintenance = Math.floor(character.assets.length * 30) + 120;
      }
      return maintenance;
    };

    const isMil = isMilitaryRole(character.role);
    const auxIncome = calculateAuxillaryIncome();
    const auxMaint = calculateAuxillaryMaintenance();

    const grossIncomeCombined = (character.taxReport?.taxesCollected ?? 0) + 
      (character.taxReport?.soldierSalaryReceived ?? 0) + 
      (!isMil ? (ROLE_SALARIES[character.role] || 0) : 0) +
      auxIncome;

    const grossExpensesCombined = (character.taxReport?.taxesPaid ?? 0) + 
      (character.taxReport?.soldierSalaryPaid ?? 0) + 
      auxMaint;

    return (
      <div className="space-y-4">
        {/* Unified Treasury & Soldiers' Salary Ledger */}
        <div className="bg-[#2b1d0e] p-5 rounded-2xl border-2 border-[#c5a021] text-[#e8dab2] relative overflow-hidden shadow-2xl mb-2">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins size={60} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-[7.5px] uppercase font-black tracking-widest text-[#c5a021]">📊 Tribal Fiscal System</span>
                <h3 className="text-sm font-display uppercase tracking-wider text-white">Treasury & Military Wage Ledger</h3>
              </div>
              <div className="text-right">
                <span className="text-[7.5px] uppercase font-mono tracking-wider opacity-60">Net Wealth Flow</span>
                <div className={`text-md font-black font-mono leading-none ${(character.taxReport?.netIncome ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(character.taxReport?.netIncome ?? 0) >= 0 ? '+' : ''}{character.taxReport?.netIncome ?? 0}г/yr
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-b border-[#e8dab2]/15 py-3 my-2 text-[11px]">
              {/* Receipts Column */}
              <div className="space-y-2">
                <div className="text-[8px] font-bold uppercase text-[#c5a021] border-b border-[#c5a021]/25 pb-0.5 flex justify-between">
                  <span>📥 Yearly Earnings</span>
                  <span>+{grossIncomeCombined}г</span>
                </div>
                <div className="space-y-1">
                  {!isMil && (ROLE_SALARIES[character.role] || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70">Civil Role Stipend:</span>
                      <span className="font-mono text-green-300 font-bold">+{ROLE_SALARIES[character.role]}г</span>
                    </div>
                  )}
                  {(character.taxReport?.soldierSalaryReceived ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70 flex items-center gap-1">🛡️ Army Wage Received:</span>
                      <span className="font-mono text-green-300 font-bold">+{character.taxReport?.soldierSalaryReceived}г</span>
                    </div>
                  )}
                  {(character.taxReport?.taxesCollected ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70 flex items-center gap-1">👑 Subject Taxes Collected:</span>
                      <span className="font-mono text-green-300 font-bold">+{character.taxReport?.taxesCollected}г</span>
                    </div>
                  )}
                  {auxIncome > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70">🛠️ Artisan/Trade Proceeds:</span>
                      <span className="font-mono text-green-300 font-bold">+{auxIncome}г</span>
                    </div>
                  )}
                  {grossIncomeCombined === 0 && (
                    <div className="text-[10px] text-center italic opacity-40">No active income streams</div>
                  )}
                </div>
              </div>

              {/* Disbursements Column */}
              <div className="space-y-2">
                <div className="text-[8px] font-bold uppercase text-red-400 border-b border-[#e8dab2]/15 pb-0.5 flex justify-between">
                  <span>📤 Expenditures</span>
                  <span>-{grossExpensesCombined}г</span>
                </div>
                <div className="space-y-1">
                  {(character.taxReport?.taxesPaid ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70">📥 Tribute & Taxes paid:</span>
                      <span className="font-mono text-red-300 font-bold">-{character.taxReport?.taxesPaid}г</span>
                    </div>
                  )}
                  {(character.taxReport?.soldierSalaryPaid ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70 flex items-center gap-1">⚔️ Soldier Wages Paid:</span>
                      <span className="font-mono text-red-300 font-bold">-{character.taxReport?.soldierSalaryPaid}г</span>
                    </div>
                  )}
                  {auxMaint > 0 && (
                    <div className="flex justify-between">
                      <span className="opacity-70">🏡 Noble Estate Upkeep:</span>
                      <span className="font-mono text-red-300 font-bold">-{auxMaint}г</span>
                    </div>
                  )}
                  {grossExpensesCombined === 0 && (
                    <div className="text-[10px] text-center italic opacity-40">Tax-exempt & no army upkeep</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] font-mono text-[#e8dab2]/40 italic">
              <div>* Calculated and applied on yearly anniversary cycle</div>
              <div>Standing Horde: <span className="text-[#c5a021] font-black">{character.hordeSize}</span> warriors</div>
            </div>
          </div>
        </div>

        {/* Market Header */}
      <div className="bg-[#2b1d0e] p-6 rounded-2xl border-2 border-[#c5a021] text-[#e8dab2] relative overflow-hidden shadow-xl mb-6">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <ShoppingBag size={80} />
         </div>
         <div className="relative z-10 text-center">
            <h3 className="text-2xl font-display uppercase tracking-widest text-[#c5a021]">The Tribal Market</h3>
            <p className="text-xs italic opacity-80 mt-1">"Trade for fine stallion and sturdy yurts from all over the steppe."</p>
            {character?.marketTrends && (
               <div className="mt-2 flex flex-wrap justify-center gap-2">
                 {(Object.entries(character.marketTrends) as [string, number][]).map(([cat, val]) => {
                   const isHot = val > 1.2;
                   const isCold = val < 0.8;
                   if (!isHot && !isCold) return null;
                   return (
                     <div key={cat} className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-sm border ${isHot ? 'bg-red-900/40 text-red-100 border-red-500/30' : 'bg-green-900/40 text-green-100 border-green-500/30'}`}>
                        {cat}: {isHot ? 'High Price' : 'Low Price'}
                     </div>
                   );
                 })}
               </div>
             )}
            <div className="mt-4 flex justify-center">
               <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
                 character?.marketCondition === 'Economic Boom' ? 'bg-green-100 text-green-800 border-green-800/30' :
                 character?.marketCondition === 'Recession' ? 'bg-red-100 text-red-800 border-red-800/30' :
                 character?.marketCondition === 'Livestock Famine' ? 'bg-orange-100 text-orange-800 border-orange-800/30' :
                 character?.marketCondition === 'War Preparations' ? 'bg-purple-100 text-purple-800 border-purple-800/30' :
                 'bg-blue-100 text-blue-800 border-blue-800/30'
               }`}>
                  Current Climate: {character?.marketCondition}
               </div>
            </div>
         </div>
      </div>

      {/* Market Sub-Tabs */}
      <div className="flex bg-[#2b1d0e]/5 p-1 rounded-2xl border border-[#8b7355]/20 mb-4 shadow-inner">
        <button 
          onClick={() => setMarketTab('buy')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${marketTab === 'buy' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-lg ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/10'}`}
        >
          <ShoppingBag size={14} className={marketTab === 'buy' ? 'text-[#c5a021]' : ''} />
          Buy Goods
        </button>
        <button 
          onClick={() => setMarketTab('sell')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${marketTab === 'sell' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-lg ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/10'}`}
        >
          <TrendingUp size={14} className={marketTab === 'sell' ? 'text-[#c5a021]' : ''} />
          Sell Livestock
        </button>
      </div>

      {marketTab === 'buy' ? (
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037] mb-3 flex items-center gap-2">
              <Sparkles size={12} className="text-[#c57d21]" />
              Merchant Inventory
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {character?.availableMarketItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleBuyAsset(item)}
                  disabled={character!.stats.wealth < item.price}
                  className="w-full p-4 bg-white/40 border border-[#8b7355]/20 rounded-xl text-left hover:bg-white/60 transition-all disabled:opacity-50 flex items-center gap-4 group"
                >
                  <div className="h-12 w-12 rounded-lg bg-[#2b1d0e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                     {item.type === 'Horse' ? <MapIcon size={24} className="text-[#c5a021]" /> : 
                      item.type === 'Weapon' ? <Sword size={24} className="text-[#c5a021]" /> :
                      item.type === 'Armor' ? <Shield size={24} className="text-[#c5a021]" /> :
                      item.type === 'Commodity' ? <Globe size={24} className="text-[#c5a021]" /> :
                      item.type === 'Luxury' ? <Sparkles size={24} className="text-[#c5a021]" /> :
                      item.type === 'Bird' ? <Bird size={24} className="text-[#c5a021]" /> :
                      <Tent size={24} className="text-[#c5a021]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2b1d0e]">{item.name}</span>
                        {character?.marketTrends && character.marketTrends[item.type] > 1.2 && (
                          <span className="text-[7px] bg-red-100 text-red-800 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-red-800/20">High Demand</span>
                        )}
                        {character?.marketTrends && character.marketTrends[item.type] < 0.8 && (
                          <span className="text-[7px] bg-green-100 text-green-800 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-green-800/20">Over Supply</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#c57d21]">{item.price}г</span>
                    </div>
                    <p className="text-[10px] text-[#5d4037] opacity-70 line-clamp-1">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037] mb-3 flex items-center gap-2">
              <TrendingUp size={12} className="text-green-800" />
              Your Herd Management
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(character?.livestock || {}) as [keyof Character['livestock'], number][]).map(([type, amount]) => {
                const basePrice = (LIVESTOCK_PRICES as any)[type]?.sell || 10;
                const multipliers = MARKET_MULTIPLIERS[character!.marketCondition] || MARKET_MULTIPLIERS.Stable;
                const currentSellPrice = Math.floor(basePrice * multipliers.sell * (multipliers.livestock || 1));
                
                return (
                  <div key={type} className="p-4 bg-white/40 border border-[#8b7355]/20 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-[#2b1d0e] flex items-center justify-center shrink-0">
                      {type === 'horses' ? <MapIcon size={24} className="text-[#c5a021]" /> : <Activity size={24} className="text-[#c5a021]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#2b1d0e] capitalize">{type}</span>
                        <span className="text-[10px] font-bold text-[#5d4037]">Market Value: <span className="text-green-800">{currentSellPrice}г each</span></span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#5d4037]">
                        <div className="opacity-70">Holding: {amount}</div>
                        {type === 'horses' && amount > 0 && (
                          <div className="flex gap-2 font-mono text-[9px]">
                            <span className="text-[#c57d21]">SPD: {40 + Math.floor(character!.stats.horseRiding / 5)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                         <button 
                           onClick={() => handleSellLivestock(type, 1)}
                           disabled={amount < 1}
                           className="flex-1 py-1.5 bg-[#2b1d0e] text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-30 hover:brightness-125"
                         >
                           Sell 1
                         </button>
                         <button 
                           onClick={() => handleSellLivestock(type, 10)}
                           disabled={amount < 10}
                           className="flex-1 py-1.5 bg-[#2b1d0e] text-[#e8dab2] rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-30 hover:brightness-125"
                         >
                           Sell 10
                         </button>
                         <button 
                           onClick={() => handleSellLivestock(type, amount)}
                           disabled={amount <= 0}
                           className="flex-1 py-1.5 bg-red-900/10 text-red-900 border border-red-900/20 rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-30 hover:bg-red-900 hover:text-white"
                         >
                           Sell All
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[#8b7355]/20">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037] mb-4">Your Property Inventory</h4>
        {character?.assets.length === 0 ? (
          <p className="text-center italic opacity-60 py-8 text-sm">You possess nothing but the clothes on your back.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {character?.assets.map((asset, i) => (
              <div key={i} className={`p-4 rounded-2xl border transition-all hover:shadow-md flex justify-between items-center ${asset.type === 'Horse' ? 'bg-[#c5a021]/5 border-[#c5a021]/30' : 'bg-white/40 border-[#8b7355]/10'}`}>
                <div className="flex items-center gap-4">
                   <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${asset.type === 'Horse' ? 'bg-[#c5a021] text-[#2b1d0e]' : 'bg-[#2b1d0e] text-[#e8dab2]'}`}>
                      {asset.type === 'Horse' ? <MapIcon size={20} /> : 
                       asset.type === 'Weapon' ? <Sword size={20} /> : 
                       asset.type === 'Armor' ? <Shield size={20} /> : 
                       asset.type === 'Commodity' ? <Globe size={20} /> :
                       asset.type === 'Luxury' ? <Sparkles size={20} /> :
                       asset.type === 'Bird' ? <Bird size={20} /> :
                       <Tent size={20} />}
                   </div>
                   <div>
                    <div className="font-bold text-sm text-[#2b1d0e] flex items-center gap-2">
                      {asset.name}
                      {asset.type === 'Horse' && (
                        <span className="text-[7px] bg-red-900 text-white px-1 py-0.5 rounded uppercase font-black tracking-tighter">War Mount</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#5d4037] opacity-60 uppercase font-bold tracking-tight">{asset.type} • Quality: {asset.quality}%</div>
                    {asset.stats && (
                      <div className="flex gap-4 mt-2 bg-black/5 p-1.5 rounded-lg border border-black/5">
                        {asset.stats.speed && (
                          <div className="flex flex-col items-center min-w-[32px]">
                            <span className="text-[7px] uppercase font-bold text-[#c57d21]">SPD</span>
                            <span className="text-[11px] font-mono font-black text-[#2b1d0e]">{asset.stats.speed}</span>
                          </div>
                        )}

                        {asset.stats.loyalty && (
                          <div className="flex flex-col items-center min-w-[32px]">
                            <span className="text-[7px] uppercase font-bold text-[#c57d21]">LOY</span>
                            <span className="text-[11px] font-mono font-black text-[#2b1d0e]">{asset.stats.loyalty}</span>
                          </div>
                        )}
                        {(asset.stats.attackBonus || 0) > 0 && (
                          <div className="flex flex-col items-center min-w-[32px]">
                            <span className="text-[7px] uppercase font-bold text-red-700">ATK</span>
                            <span className="text-[11px] font-mono font-black text-red-800">+{asset.stats.attackBonus}</span>
                          </div>
                        )}
                        {(asset.stats.defenseBonus || 0) > 0 && (
                          <div className="flex flex-col items-center min-w-[32px]">
                            <span className="text-[7px] uppercase font-bold text-blue-700">DEF</span>
                            <span className="text-[11px] font-mono font-black text-blue-800">+{asset.stats.defenseBonus}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                  <div>
                    <div className="text-[#c5a021] font-bold text-sm font-mono">{asset.value}г</div>
                    <div className="text-[8px] uppercase font-bold opacity-30 text-[#2b1d0e]">Market Val</div>
                  </div>
                  <button 
                    onClick={() => handleSellAsset(asset.id)}
                    className="px-3 py-1 bg-red-900/10 text-red-900 border border-red-900/20 rounded-lg text-[8px] font-bold uppercase transition-all hover:bg-red-900 hover:text-white"
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderDiplomacy = () => (
    <div className="space-y-6">
      <div className="bg-[#2b1d0e] p-6 rounded-2xl border-2 border-[#c5a021] text-[#e8dab2] relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <Globe size={80} />
         </div>
         <div className="relative z-10 text-center">
            <h3 className="text-2xl font-display uppercase tracking-widest text-[#c5a021]">{character?.isGreatKhan ? character.kingdomName : "Diplomatic Council"}</h3>
            <p className="text-xs italic opacity-80 mt-1">"{character?.isGreatKhan ? "All the horizon is yours to survey." : "Words can be as sharp as swords. Command the steppe through alliances or conquest."}"</p>
         </div>
      </div>

      {character?.activeCampaign && (
        <div className="bg-gradient-to-br from-[#2b1d0e] to-[#422e19] p-6 rounded-2xl border-2 border-red-700/80 text-[#e8dab2] relative overflow-hidden shadow-xl mb-6">
          <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
            <Sword size={150} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-red-900/40 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                <h4 className="text-[10px] uppercase font-black tracking-widest text-red-500">ИДЭВХТЭЙ АЯН ДАЙН (ACTIVE CAMPAIGN)</h4>
              </div>
              <h3 className="text-xl font-display text-white">{character.activeCampaign.targetTribe} аймагтай хийх дайн</h3>
              <p className="text-xs text-[#c5a021] flex items-center gap-1.5 mt-0.5">
                <History size={12} /> Дайны {character.activeCampaign.year} дахь жил (Year {character.activeCampaign.year} of War)
              </p>
            </div>
            
            <div className="text-right bg-black/30 px-4 py-2 rounded-xl border border-red-900/30">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Дайсны хүчин чадал</span>
              <span className="text-sm font-mono font-bold text-red-400 flex items-center gap-1">
                <Sword size={12} /> {character.activeCampaign.enemyPower.toLocaleString()} хүч
              </span>
            </div>
          </div>

          {/* War progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mb-2">
              <span className="text-red-400">🚨 Дарагдах дөхсөн (Defeat)</span>
              <span className="text-[#c5a021]">Дайны ерөнхий ахиц: {character.activeCampaign.playerProgress}%</span>
              <span className="text-green-400">Ялалт ойртсон (Victory)</span>
            </div>
            <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-red-900/40 p-0.5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${character.activeCampaign.playerProgress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6 text-center">
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase text-gray-400 block font-bold">Овогт үлдсэн цэрэг</span>
              <span className="text-sm font-mono text-white font-bold">{character.hordeSize}</span>
            </div>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase text-gray-400 block font-bold">Дайсны эхлэлийн цэрэг</span>
              <span className="text-sm font-mono text-white font-bold">{character.activeCampaign.enemyInitialPower}</span>
            </div>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase text-gray-400 block font-bold">Манай талаас эрсдсэн</span>
              <span className="text-sm font-mono text-red-400 font-bold">-{character.activeCampaign.playerCasualties}</span>
            </div>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase text-gray-400 block font-bold">Дайсанд учруулсан гарз</span>
              <span className="text-sm font-mono text-green-400 font-bold">-{character.activeCampaign.enemyCasualties}</span>
            </div>
          </div>

          {/* Strategy selection for the year */}
          {!character.activeCampaign.resolvedForThisYear ? (
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#c5a021] border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                <Target size={14} /> Энэ жилийн тулааны стратегиа сонгох (Select Strategy)
              </h4>
              <p className="text-[11px] text-gray-300 italic mb-3">Захирагч та энэ жил ямар хэлбэрээр байлдахаа сонгож, цэргээ удирдана уу:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => handleExecuteCampaignStrategy('charge')}
                  className="p-3 bg-white/5 border border-red-900/30 rounded-xl text-left hover:bg-white/10 transition-all hover:border-red-500/50 group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white group-hover:text-red-400 transition-colors flex items-center gap-1">
                      ⚔️ Кавалерын Дайралт
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 font-bold">Хүч / Морь унах</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Морьт цэргийн шууд хүчит довтолгоо. Илүү ахиц өгөх боловч гарз хохирол хүлээх магадлал өндөр.</p>
                </button>

                <button 
                  onClick={() => handleExecuteCampaignStrategy('retreat')}
                  className="p-3 bg-white/5 border border-amber-900/30 rounded-xl text-left hover:bg-white/10 transition-all hover:border-amber-500/50 group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                      🏹 Мангудай отолт (Хуурамч ухралт)
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 font-bold">Сур харвах / Оюун</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Ухрах мэт жүжиглэж дайсныг отолтонд оруулж хярвах. Маш аюулгүй бөгөөд овжин тактик.</p>
                </button>

                <button 
                  onClick={() => handleExecuteCampaignStrategy('ambush')}
                  className="p-3 bg-white/5 border border-[#c5a021]/20 rounded-xl text-left hover:bg-white/10 transition-all hover:border-[#c5a021]/50 group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white group-hover:text-[#c5a021] transition-colors flex items-center gap-1">
                      🌙 Шөнийн гэнэтийн довтолгоо
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold">Анзаарга / Оюун</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Харанхуй шөнөөр дайсны хуаранг гэнэдүүлэн дайрах. Хэдий эрсдэлтэй ч асар их амжилт авчирч мэднэ.</p>
                </button>

                <button 
                  onClick={() => handleExecuteCampaignStrategy('harass')}
                  className="p-3 bg-white/5 border border-blue-900/30 rounded-xl text-left hover:bg-white/10 transition-all hover:border-blue-500/50 group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                      🏹 Сөнөөх / Оролдох тактик
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-bold">Сур харвах / Морь</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Тойрон давхиж, алсаас байнгын сураар зовоох. Богино хугацаанд цөөн хохиролтой урагшилна.</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black/40 border border-amber-500/20 p-4 rounded-xl flex flex-col items-center text-center">
              <span className="text-amber-500 mb-1"><Shield size={20} className="animate-pulse" /></span>
              <h5 className="font-bold text-xs text-white uppercase">🔒 Энэ жилийн тулааны тактик хэрэгжлээ</h5>
              <p className="text-[10px] text-gray-400 mt-1 max-w-sm">
                Та энэ насандаа/жилдээ хийх байлдааны ажиллагаагаа удирдан дуусжээ. Дараагийн жил рүү шилжиж, дайны аянаа үргэлжлүүлэхийн тулд дэлгэцийн баруун дээд булан дахь <span className="text-[#c5a021] font-bold">"Нас ахих (Next Year)"</span> товчийг дарна уу.
              </p>
            </div>
          )}

          {/* Combat History Console */}
          <div className="mt-5 pt-4 border-t border-red-900/20">
            <h5 className="text-[10px] uppercase font-bold text-red-400 mb-2 flex items-center gap-1">
              <ScrollText size={12} /> Аян дайны тэмдэглэл (Campaign Chronicles)
            </h5>
            <div className="bg-black/30 p-3 rounded-xl border border-red-900/10 font-mono text-[9px] text-gray-300 space-y-1.5 max-h-36 overflow-y-auto">
              {character.activeCampaign.combatLog.map((log, idx) => (
                <div key={idx} className="border-b border-white/5 pb-1 last:border-0 last:pb-0">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {character && !character.isGreatKhan && (
        <div className="bg-white/60 p-5 rounded-2xl border border-[#c5a021]/30 shadow-sm">
           <div className="flex justify-between items-end mb-3">
              <div>
                <h4 className="text-[10px] uppercase font-black tracking-widest text-[#5d4037]">Tribal Consolidation</h4>
                <p className="text-lg font-display text-[#2b1d0e]">Path to the Great Khanate</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#5d4037] font-bold">{character.conqueredTribes.length}/3 Tribes Conquered</span>
              </div>
           </div>
           <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-black/5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (character.conqueredTribes.length / 3) * 100)}%` }}
                className="h-full bg-[#c5a021] shadow-[0_0_10px_rgba(197,160,33,0.5)]"
              />
           </div>
           {character.conqueredTribes.length < 3 ? (
             <p className="text-[10px] italic text-[#5d4037] opacity-60 mt-3">"Subjugate 3 tribes to proclaim yourself Great Khan and look towards conquering foreign kingdoms."</p>
           ) : (
             <p className="text-[10px] font-black uppercase text-green-800 mt-3 animate-pulse">The White Felt is ready. Proclaim your Khanate below.</p>
           )}
        </div>
      )}

      {character && character.conqueredTribes.length >= 3 && !character.isGreatKhan && (
        <div className="bg-[#2b1d0e] p-6 rounded-2xl border-2 border-[#c5a021] text-[#e8dab2] flex flex-col items-center gap-4 shadow-xl my-6">
           <div className="text-[#c5a021] animate-bounce"><Trophy size={32} /></div>
           <h3 className="text-xl font-display uppercase text-[#c5a021]">The White Felt Throne</h3>
           <p className="text-xs text-center opacity-80">You have subjugated three tribes. Proclaim your Khanate and rule as the Great Khan.</p>
           <div className="flex gap-2 w-full">
              <input 
                id="kingdomNameInput"
                type="text" 
                placeholder="Khanate Name (e.g. Blue Horde)"
                className="flex-1 bg-white/10 border border-[#c5a021]/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#c5a021]" 
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('kingdomNameInput') as HTMLInputElement;
                  if (input.value) handleProclaimKingdom(input.value);
                }}
                className="px-6 py-2 bg-[#c5a021] text-[#2b1d0e] rounded-xl font-bold text-xs hover:bg-[#d4b54e] transition-all"
              >
                Proclaim
              </button>
           </div>
        </div>
      )}

      <div className="space-y-4 pt-4">
        {character?.tribeRelations.map((rel, i) => (
          <div key={i} className="bg-white/40 p-5 rounded-2xl border border-[#8b7355]/20 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-display text-[#2b1d0e]">{rel.name} Tribe {character?.conqueredTribes.includes(rel.name) ? "(Vassal)" : ""}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                   <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                     rel.level === 'At War' ? 'bg-red-100 text-red-800' : 
                     rel.level === 'Allied' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                   }`}>
                     {rel.level}
                   </span>
                   {rel.isTrading && (
                     <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                       <TrendingUp size={10} /> Trading
                     </span>
                   )}
                   <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 flex items-center gap-1 border border-slate-800/10">
                     <Sword size={10} /> Power: {rel.militaryPower.toLocaleString()}
                   </span>
                   {character.stats.perception >= 60 && (
                     <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-800/20">
                       <Target size={10} /> Weakness Spotted
                     </span>
                   )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[#5d4037] opacity-60">Standing</div>
                <div className={`text-xl font-display ${rel.standing < 0 ? 'text-red-700' : rel.standing > 40 ? 'text-green-700' : 'text-[#2b1d0e]'}`}>
                  {rel.standing > 0 ? '+' : ''}{rel.standing}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               {!character?.conqueredTribes.includes(rel.name) && (
                 <button 
                   onClick={() => handleConquerTribe(rel.name)}
                   className="col-span-2 flex items-center justify-center gap-2 bg-[#2b1d0e] text-[#e8dab2] py-3 rounded-xl text-[10px] uppercase font-bold hover:bg-black transition-all border border-red-900/40 shadow-lg group relative overflow-hidden mb-1"
                 >
                   <WarIcon size={14} className="text-red-500" />
                   <span>Launch Military Campaign</span>
                 </button>
               )}
              {rel.level !== 'At War' && !rel.isTrading && (
                <button 
                  onClick={() => handleDiplomacyAction(rel.name, 'trade')}
                  disabled={character.stats.reputation < 20}
                  className="flex items-center justify-center gap-2 p-2.5 bg-white/60 text-[#2b1d0e] rounded-xl text-[10px] uppercase font-bold hover:bg-white transition-colors disabled:opacity-50 border border-[#8b7355]/20"
                >
                  <TrendingUp size={14} /> Trade
                </button>
              )}
              {(rel.level === 'Neutral' || rel.level === 'Friendly') && (
                <button 
                  onClick={() => handleDiplomacyAction(rel.name, 'alliance')}
                  disabled={character.stats.leadership < 60 || rel.standing < 30}
                  className="flex items-center justify-center gap-2 p-2.5 bg-[#c5a021] text-[#2b1d0e] rounded-xl text-[10px] uppercase font-bold hover:bg-[#d4b54e] transition-colors disabled:opacity-50 border border-black/5"
                  title="Requires Leadership 60 and Standing 30"
                >
                  <Handshake size={14} /> Offer Alliance
                </button>
              )}
              {rel.level !== 'At War' && !character.conqueredTribes.includes(rel.name) && (
                <button 
                  onClick={() => handleDiplomacyAction(rel.name, 'demand-tribute')}
                  className="flex items-center justify-center gap-2 p-2.5 bg-white/60 text-[#2b1d0e] rounded-xl text-[10px] uppercase font-bold hover:bg-white transition-colors border border-[#8b7355]/20"
                  title="Demand immediate wealth. Success depends on military power and reputation."
                >
                  <Coins size={14} /> Demand Tribute
                </button>
              )}
              {rel.level !== 'At War' && (
                <button 
                  onClick={() => handleDiplomacyAction(rel.name, 'war')}
                  className="flex items-center justify-center gap-2 p-2.5 border border-red-800 text-red-800 rounded-xl text-[10px] uppercase font-bold hover:bg-red-50 transition-colors"
                >
                  <WarIcon size={14} /> Declare War
                </button>
              )}
              {rel.level === 'At War' && (
                <>
                  <button 
                    onClick={() => handleDiplomacyAction(rel.name, 'peace')}
                    disabled={character.stats.wealth < 500}
                    className="flex items-center justify-center gap-2 p-2.5 bg-green-800 text-white rounded-xl text-[10px] uppercase font-bold hover:bg-green-900 transition-colors disabled:opacity-50"
                    title="Restores neutral relations."
                  >
                    <Handshake size={14} /> Buy Peace (500г)
                  </button>
                  <button 
                    onClick={() => handleDiplomacyAction(rel.name, 'negotiate-peace')}
                    disabled={character.stats.leadership < 75}
                    className="flex items-center justify-center gap-2 p-2.5 bg-blue-800 text-white rounded-xl text-[10px] uppercase font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                    title="Requires Leadership 75. End war through diplomatic authority."
                  >
                    <MessageSquare size={14} /> Negotiate Ceasefire
                  </button>
                </>
              )}
              {rel.level !== 'At War' && rel.standing < 0 && (
                <button 
                  onClick={() => handleDiplomacyAction(rel.name, 'peace')}
                  disabled={character.stats.wealth < 200}
                  className="flex items-center justify-center gap-2 p-2.5 bg-green-100 text-green-800 rounded-xl text-[10px] uppercase font-bold hover:bg-green-200 transition-colors disabled:opacity-50"
                  title="Improve relations through gifts."
                >
                  <Sparkles size={14} /> Send Gifts (200г)
                </button>
              )}

              {/* Specialized Standalone Tribe Interactions */}
              {rel.level !== 'At War' && !character.conqueredTribes.includes(rel.name) && (
                <>
                  <button 
                    onClick={() => handleDiplomacyAction(rel.name, 'gift-horses')}
                    disabled={character.livestock.horses < 3}
                    className="flex items-center justify-center gap-2 p-2.5 bg-amber-50/60 text-amber-950 rounded-xl text-[10px] uppercase font-bold hover:bg-amber-100 transition-colors disabled:opacity-40 border border-amber-800/20"
                    title="Gift 3 war horses to the elders to bolster trade standing (+20 Standing)"
                  >
                    <MapIcon size={14} className="text-amber-700" /> Gift 3 Horses
                  </button>

                  <button 
                    onClick={() => handleDiplomacyAction(rel.name, 'sabotage')}
                    disabled={character.stats.perception < 40}
                    className="flex items-center justify-center gap-2 p-2.5 bg-red-50/50 text-red-950 rounded-xl text-[10px] uppercase font-bold hover:bg-red-100/60 transition-colors disabled:opacity-40 border border-red-800/25"
                    title="Requires 40+ Perception. Conduct a daring midnight pasture raid (+150г, +1 horse on success; risk -15hp and War on detection)"
                  >
                    <Zap size={14} className="text-red-700 animate-pulse" /> Sabotage & Raid
                  </button>

                  {character.tribeRelations.length > 1 && (
                    <button 
                      onClick={() => handleDiplomacyAction(rel.name, 'incite')}
                      disabled={character.stats.wealth < 200 || (character.stats.intelligence < 50 && character.stats.leadership < 50)}
                      className="flex items-center justify-center gap-2 p-2.5 bg-[#4c1d95]/5 text-[#4c1d95] rounded-xl text-[10px] uppercase font-bold hover:bg-[#4c1d95]/10 transition-colors disabled:opacity-40 border border-[#4c1d95]/20"
                      title="Requires 200г, 50+ Intelligence or Leadership. Sows border conflict between tribes to sap their numbers (-250 Power scale)"
                    >
                      <MessageSquare size={14} className="text-purple-700" /> Incite Feud (-200г)
                    </button>
                  )}

                  <button 
                    onClick={() => handleDiplomacyAction(rel.name, 'peaceful-vassalage')}
                    disabled={rel.standing < 60 || character.stats.leadership < 80 || character.militaryPower < rel.militaryPower * 1.5}
                    className="flex items-center justify-center gap-2 p-2.5 bg-yellow-500 text-black font-extrabold rounded-xl text-[10px] uppercase hover:bg-yellow-600 transition-colors disabled:opacity-40 border border-yellow-600/30"
                    title="Requires 60+ standing, 80+ leadership, and 1.5x of their army size. Command peaceful vassal bend-knee"
                  >
                    <Handshake size={14} className="text-black" /> Demand Vassalage
                  </button>
                </>
              )}

              {/* Take Tribe Princess as Concubine Actions */}
              {character?.conqueredTribes.includes(rel.name) ? (
                character.relationships.some(r => r.type === 'Concubine' && r.originName === rel.name && r.status === 'Active') ? (
                  <div className="col-span-2 text-center py-2.5 bg-[#c5a021]/15 border border-[#c5a021]/30 rounded-xl text-[9px] uppercase font-black text-[#c57d21]">
                    👑 Tribe Princess Held As Concubine Hostage
                  </div>
                ) : (
                  <button 
                    onClick={() => handleTakePrincessConcubine(rel.name, 'Tribe', true)}
                    className="col-span-2 flex items-center justify-center gap-2 p-2.5 bg-[#c5a021]/10 text-[#c5a021] border border-[#c5a021] rounded-xl text-[10px] uppercase font-black hover:bg-[#c5a021] hover:text-[#2b1d0e] transition-all cursor-pointer"
                  >
                    👑 Claim Princess Hostage as Concubine (Free)
                  </button>
                )
              ) : (
                rel.level !== 'At War' && (
                  character.relationships.some(r => r.type === 'Concubine' && r.originName === rel.name && r.status === 'Active') ? (
                    <div className="col-span-2 text-center py-2.5 bg-[#c5a021]/10 border border-[#c5a021]/20 rounded-xl text-[9px] uppercase font-black text-[#5d4037]">
                      🤝 Princess Welcomed as Concubine
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleTakePrincessConcubine(rel.name, 'Tribe', false)}
                      disabled={character.stats.wealth < 350 || rel.standing < 20}
                      className="col-span-2 flex items-center justify-center gap-2 p-2.5 bg-[#2b1d0e] text-[#e8dab2] rounded-xl text-[10px] uppercase font-bold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title={rel.standing < 20 ? "Requires 20+ standing" : "Requires 350г"}
                    >
                      💍 Propose Princess Concubine Alliance (-350г) {rel.standing < 20 && " (Standing 20+ Reqd)"}
                    </button>
                  )
                )
              )}
            </div>
            
            {rel.level !== 'At War' && rel.standing < 30 && (
              <div className="mt-3 text-[10px] italic text-[#5d4037] opacity-60 text-center">
                 {(character.stats.realmReputation < 20 && character.stats.reputation < 40) && "Need 20 Realm Renown or 40 Reputation to trade. "}
                 {character.stats.leadership < 60 && "Need 60 Leadership for alliances. "}
                 {rel.standing < 30 && "Improve standing for closer ties."}
              </div>
            )}
          </div>
        ))}
      </div>

      {character?.isGreatKhan && character.kingdomRelations && (
        <div className="space-y-4 pt-8 border-t border-[#8b7355]/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col items-center gap-1 mb-8">
             <div className="text-[10px] uppercase font-black tracking-[0.3em] text-[#c5a021]">Imperial Phase</div>
             <h3 className="text-3xl font-display uppercase tracking-widest text-[#2b1d0e]">The World Stage</h3>
             <div className="h-1 w-24 bg-[#c5a021] mt-2" />
             <p className="text-[10px] text-center mt-3 max-w-xs opacity-60 italic">"The steppe was merely the cradle. Now, even the heavens tremble as your shadow falls upon the ancient cities of the south."</p>
          </div>
          
          {character.kingdomRelations.map((rel, i) => (
            <div key={i} className={`p-6 rounded-3xl border-2 transition-all hover:shadow-2xl relative overflow-hidden ${character.conqueredKingdoms?.includes(rel.name) ? 'bg-[#c5a021]/10 border-[#c5a021]/50' : 'bg-white border-[#c5a021]/20'}`}>
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Globe size={100} />
              </div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h4 className="text-2xl font-display text-[#2b1d0e] flex items-center gap-2">
                    {rel.name} 
                    {character.conqueredKingdoms?.includes(rel.name) && (
                      <span className="bg-red-900 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-tighter shadow-lg">Vassal Empire</span>
                    )}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`text-xs uppercase font-black px-3 py-1 rounded-full shadow-sm ${
                      rel.level === 'At War' ? 'bg-red-100 text-red-900 border border-red-900/20' : 
                      rel.level === 'Allied' ? 'bg-blue-100 text-blue-900 border border-blue-900/20' : 
                      'bg-slate-100 text-slate-900 border border-slate-900/20'
                    }`}>
                      {rel.level}
                    </span>
                    <span className="text-xs uppercase font-black px-3 py-1 rounded-full bg-slate-900 text-white flex items-center gap-2 shadow-inner">
                      <Sword size={12} className="text-red-500" />
                      Army: {rel.militaryPower.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-black text-[#5d4037] opacity-60 tracking-widest">Imperial Status</div>
                  <div className="text-lg font-display text-[#2b1d0e]">
                    {character.conqueredKingdoms?.includes(rel.name) ? "Eternal Subject" : "Target of Conquest"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                {!character.conqueredKingdoms?.includes(rel.name) && (
                  <button 
                    onClick={() => handleConquerKingdom(rel.name)}
                    className="col-span-2 flex items-center justify-center gap-3 bg-[#2b1d0e] text-[#e8dab2] py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all border-b-4 border-red-900 shadow-xl active:translate-y-1 active:border-b-0"
                  >
                    <Sword size={18} className="text-red-500 animate-pulse" />
                    <span>Launch Imperial Conquest</span>
                  </button>
                )}
                {rel.level !== 'At War' && !rel.isTrading && !character.conqueredKingdoms?.includes(rel.name) && (
                  <button 
                    onClick={() => handleKingdomDiplomacy(rel.name, 'trade')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-[#2b1d0e] rounded-xl text-[10px] font-black uppercase transition-all border-2 border-[#8b7355]/20 hover:border-[#c5a021] hover:bg-[#c5a021]/5"
                  >
                    <TrendingUp size={16} className="text-green-700" />
                    Open Silk Road
                  </button>
                )}
                {rel.level !== 'At War' && !character.conqueredKingdoms?.includes(rel.name) && (
                  <button 
                    onClick={() => handleKingdomDiplomacy(rel.name, 'war')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-900 text-red-900 rounded-xl text-[10px] font-black uppercase hover:bg-red-900 hover:text-white transition-all cursor-pointer"
                  >
                    <WarIcon size={16} /> Declare Total War
                  </button>
                )}

                {/* Take Imperial Princess as Concubine Actions */}
                {character.conqueredKingdoms?.includes(rel.name) ? (
                  character.relationships.some(r => r.type === 'Concubine' && r.originName === rel.name && r.status === 'Active') ? (
                    <div className="col-span-2 text-center py-3 bg-[#c5a021]/15 border border-[#c5a021]/30 rounded-2xl text-[9px] uppercase font-black text-[#c57d21]">
                      👑 Imperial Princess Held in Yurt As Hostage Concubine
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleTakePrincessConcubine(rel.name, 'Kingdom', true)}
                      className="col-span-2 flex items-center justify-center gap-2 py-3 bg-[#c5a021]/10 text-[#c5a021] border border-[#c5a021] rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-[#c5a021] hover:text-[#2b1d0e] transition-all cursor-pointer shadow-md"
                    >
                      👑 Demand Imperial Princess as Hostage (Free)
                    </button>
                  )
                ) : (
                  rel.level !== 'At War' && (
                    character.relationships.some(r => r.type === 'Concubine' && r.originName === rel.name && r.status === 'Active') ? (
                      <div className="col-span-2 text-center py-3 bg-[#c5a021]/10 border border-[#c5a021]/20 rounded-2xl text-[9px] uppercase font-black text-[#5d4037]">
                        🏛️ Imperial Alliance Concubine Welcomed
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleTakePrincessConcubine(rel.name, 'Kingdom', false)}
                        disabled={character.stats.wealth < 1000 || rel.standing < 20}
                        className="col-span-2 flex items-center justify-center gap-2 py-3 bg-[#2b1d0e] text-[#e8dab2] rounded-2xl text-[10px] font-black uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-[#c5a021]/20 shadow-md"
                        title={rel.standing < 20 ? "Requires 20+ standing" : "Requires 1,000г"}
                      >
                        💍 Negotiate Imperial Princess Concubine (-1000г) {rel.standing < 20 && " (Standing 20+ Reqd)"}
                      </button>
                    )
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLivestock = () => (
    <div className="space-y-6">
       <div className="bg-[#2b1d0e] p-6 rounded-2xl border-2 border-[#c5a021] text-[#e8dab2] relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Utensils size={80} />
          </div>
          <div className="relative z-10 text-center">
             <h3 className="text-2xl font-display uppercase tracking-widest text-[#c5a021]">The Herd</h3>
             <p className="text-xs italic opacity-80 mt-1">"{character?.lifestyle === 'Nomadic' ? "Your animals are your life. They drink from the rivers and feed on the grass." : "Your livestock are now secondary to your fields, but still valuable."}"</p>
          </div>
       </div>

       {/* Pasture/Grassland Indicator */}
       {character && (
         (() => {
           const currentCapacity = character.pastureCapacity || (character.socialClass === SocialClass.NOBLE ? 600 : 300);
           const totalAnimals = (character.livestock.horses || 0) + 
                                (character.livestock.sheep || 0) + 
                                (character.livestock.cattle || 0) + 
                                (character.livestock.goats || 0) + 
                                (character.livestock.yaks || 0) + 
                                (character.livestock.camels || 0);
           const percent = Math.min(100, Math.floor((totalAnimals / currentCapacity) * 100));
           const upgrades = character.pastureUpgrades || 0;
           const upgradeCost = 250 + upgrades * 150;
           const isAtCapacity = totalAnimals >= currentCapacity;

           return (
             <div className="bg-white/70 p-5 rounded-2xl border border-[#8b7355]/30 shadow-md flex flex-col gap-3">
               <div className="flex justify-between items-center">
                 <div>
                   <span className="text-[10px] uppercase font-black tracking-widest text-[#5d4037]/60">Meadows & Grasslands Capacity</span>
                   <h4 className="font-display font-bold text-[#2b1d0e] text-base flex items-center gap-1.5 mt-0.5">
                     🌿 Pasture Occupancy: <span className={isAtCapacity ? "text-red-800 font-extrabold" : "text-[#c57d21] font-extrabold"}>{totalAnimals}</span> / {currentCapacity} heads
                   </h4>
                 </div>
                 {isAtCapacity && (
                   <span className="px-2.5 py-1 text-[9px] uppercase font-bold text-red-800 bg-red-100 border border-red-300 rounded-full animate-pulse">
                     ⚠️ OVERGRAZED
                   </span>
                 )}
               </div>

               {/* Progress bar */}
               <div className="w-full bg-[#2b1d0e]/10 h-3.5 rounded-full overflow-hidden border border-[#2b1d0e]/5 p-[2px]">
                 <div 
                   className={`h-full rounded-full transition-all duration-500 ${
                     percent > 85 ? 'bg-red-800' : percent > 60 ? 'bg-amber-600' : 'bg-green-800'
                   }`}
                   style={{ width: `${percent}%` }}
                 />
               </div>

               <div className="flex justify-between items-center gap-4 mt-1 text-[11px] text-[#5d4037]">
                 <p className="leading-tight shrink pr-4">
                   {percent > 85 
                     ? "⚠️ Grasslands are severely overgrazed! Slower breeding and disease risks apply on aging up." 
                     : "Keep grazing herds balanced. If your flock exceeds pasture limits, starvation and deaths will occur."}
                 </p>
                 
                 <button
                   onClick={handleUpgradePasture}
                   disabled={character.stats.wealth < upgradeCost}
                   className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all shadow-md ${
                     character.stats.wealth >= upgradeCost
                       ? 'bg-[#2b1d0e] text-[#e8dab2] hover:bg-yellow-950 border border-[#c5a021]/30 active:translate-y-0.5'
                       : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                   }`}
                 >
                   🚀 Expand (+200 Limit): {upgradeCost}г
                 </button>
               </div>
             </div>
           );
         })()
       )}

        <div className="grid grid-cols-1 gap-4">
          {(['horses', 'sheep', 'cattle', 'goats', 'yaks', 'camels'] as const).map(animal => {
            const amount = character?.livestock[animal] || 0;
            const horseSpeed = animal === 'horses' ? 40 + Math.floor(character!.stats.horseRiding / 5) : 0;

            return (
              <div key={animal} className={`p-5 rounded-3xl border transition-all ${animal === 'horses' && amount > 0 ? 'bg-[#c5a021]/10 border-[#c5a021]/40 shadow-lg' : 'bg-white/40 border-[#8b7355]/20'}`}>
                <div className="flex items-center gap-5">
                  <div className={`h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 border-2 ${animal === 'horses' ? 'bg-[#2b1d0e] border-[#c5a021] shadow-xl' : 'bg-[#2b1d0e]/90 border-white/20'}`}>
                      <span className="text-3xl filter drop-shadow-md">
                        {animal === 'horses' ? '🐎' : 
                        animal === 'sheep' ? '🐑' : 
                        animal === 'cattle' ? '🐂' :
                        animal === 'goats' ? '🐐' : 
                        animal === 'yaks' ? '🦬' : '🐫'}
                      </span>
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#5d4037] opacity-60">Livestock Type</span>
                          <h4 className="font-display text-xl text-[#2b1d0e] capitalize leading-none">{animal}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#5d4037] opacity-60">Herd Size</span>
                          <div className="text-3xl font-display text-[#c57d21] leading-none">{amount}</div>
                        </div>
                      </div>
                      
                      {animal === 'horses' && amount > 0 && (
                        <div className="flex gap-4 mb-4 bg-white/60 p-2 rounded-xl border border-[#c5a021]/20">
                          <div className="flex-1 flex flex-col items-center">
                            <span className="text-[8px] uppercase font-black text-[#c57d21]">Averaged Speed</span>
                            <div className="flex items-center gap-1">
                              <Zap size={10} className="text-[#c5a021]" />
                              <span className="text-sm font-mono font-black">{horseSpeed}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleLivestockAction(animal, 'buy')}
                          disabled={character!.stats.wealth < getCurrentLivestockPrice(animal, 'buy')}
                          className="flex-1 py-3 bg-green-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-800 transition-all disabled:opacity-30 shadow-sm active:translate-y-0.5"
                        >
                          Buy (+{getCurrentLivestockPrice(animal, 'buy')}г)
                        </button>
                        <button 
                          onClick={() => handleLivestockAction(animal, 'sell')}
                          disabled={character!.livestock[animal] <= 0}
                          className="flex-1 py-3 bg-white text-red-900 border-2 border-red-900/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-30 active:translate-y-0.5"
                        >
                          Sell (-{getCurrentLivestockPrice(animal, 'sell')}г)
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

       {character?.lifestyle === 'Nomadic' && (
         <div className="mt-8 p-6 bg-white/50 border-2 border-dashed border-[#8b7355]/30 rounded-2xl text-center">
            <h4 className="text-sm font-display text-[#2b1d0e] uppercase mb-2">Abandon the Steppe?</h4>
            <p className="text-xs text-[#5d4037] mb-4">Establishing a permanent farm costs 1000г and reduces your nomadic reputation, but grants stable yearly income from crops. Breeding rates for horses will be halved.</p>
            <button 
              onClick={handleSettleDown}
              disabled={character.stats.wealth < 1000}
              className="px-6 py-3 bg-[#2b1d0e] text-[#e8dab2] rounded-xl font-bold text-xs hover:bg-black transition-all disabled:opacity-50"
            >
              Build Farming Estate (1000г)
            </button>
         </div>
       )}

       {character?.lifestyle === 'Settled' && (
         <div className="mt-8 p-6 bg-green-900/10 border-2 border-green-900/20 rounded-2xl text-center">
            <h4 className="text-sm font-display text-green-900 uppercase mb-1">Settled Lifestyle</h4>
            <p className="text-xs text-green-800 opacity-80">You are a master of the soil. Each year you gain wealth from your harvests, unaffected by the seasonal migration.</p>
         </div>
       )}
    </div>
  );
  const renderActivities = () => {
    const activities = [
      { name: '👶 Play in the Dirt', icon: <MapIcon size={18} />, desc: 'Observe the small creatures of the steppe.', effect: { intelligence: 1, health: 1 }, minAge: 0 },
      { name: '🚶 Crawl/Walk Practice', icon: <Trophy size={18} />, desc: 'Build your strength and coordination.', effect: { strength: 1, health: 2 }, minAge: 0 },
      { name: '🏠 Bond with Family', icon: <Heart size={18} />, desc: 'Spend time in the warmth of the yurt.', effect: { loyalty: 2 }, minAge: 0 },
      { name: '🧘 Meditate on the Steppe', icon: <Sparkles size={18} />, desc: 'Clear your mind and seek the will of Tengri.', effect: { health: 5, intelligence: 2 }, minAge: 8 },
      { name: '🏹 Practice Archery', icon: <Target size={18} />, desc: 'Spend the day at the range.', effect: { strength: 1, archery: 5 }, minAge: 6 },
      { name: '🤼 Wrestling (Bökh)', icon: <Trophy size={18} />, desc: 'Test your strength against other warriors.', effect: { strength: 5, reputation: 2, health: -2 }, minAge: 10 },
      { name: '🦅 Train a Falcon', icon: <Bird size={18} />, desc: 'Master the art of hunting from the sky.', effect: { intelligence: 3, archery: 3 }, minAge: 12 },
      { name: '🐎 Break a Wild Mustang', icon: <MapIcon size={18} />, desc: 'Tame a spirit of the wind.', effect: { horseRiding: 5, strength: 2, health: -5 }, minAge: 14 },
      { name: '🐪 Silk Road Trade', icon: <ShoppingBag size={18} />, desc: 'Trade furs for exotic southern goods.', effect: { wealth: 100, intelligence: 5, reputation: -5 }, minAge: 18 },
      { name: '🍖 Tribal Feast', icon: <Utensils size={18} />, desc: 'Celebrate with the elders and share kumiss.', effect: { reputation: 5, leadership: 2, health: 5 }, minAge: 14 },
      { name: '🎶 Throat Singing', icon: <Music size={18} />, desc: 'Learn the sacred vibrations of the earth.', effect: { intelligence: 5, health: 2 }, minAge: 10 },
      { name: '⚔️ Raid Rival Camp', icon: <Sword size={18} />, desc: 'A risky attempt to gain wealth and reputation.', effect: { reputation: 10, wealth: 150, health: -15 }, minAge: 16 },
      { 
        name: '👁️ Scout Borderlands', 
        icon: <MapPin size={18} />, 
        desc: 'Observe enemy movements and learn the terrain.', 
        effect: { perception: 8, horseRiding: 3 }, 
        minAge: 12,
        customEffect: (char: Character) => ({
          ...char,
          visionBonus: (char.visionBonus || 0) + 5,
          history: [...char.history, { age: char.age, text: "You spent the day scouting the heights. Your knowledge of the land is unparalleled." }]
        })
      },
      { 
        name: '🕵️ Infiltrate Enemy Camp', 
        icon: <Users size={18} />, 
        desc: 'Slip into a rival tribe\'s camp to gather intelligence.', 
        effect: { perception: 10, intelligence: 5, reputation: 5 }, 
        minAge: 16,
        condition: (char: Character) => char.stats.perception >= 40,
        customEffect: (char: Character) => ({
          ...char,
          visionBonus: (char.visionBonus || 0) + 12,
          history: [...char.history, { age: char.age, text: "You slipped into the shadows of the Merkit camp, mapping their every layout." }]
        })
      },
      { 
        name: '🛡️ Patrol Tribal Borders', 
        icon: <Shield size={18} />, 
        desc: 'Keep watch for bandits and rival scouts.', 
        effect: { reputation: 5, horseRiding: 5, strength: 2 }, 
        minAge: 15,
        condition: (char: Character) => 
          ['Warrior', 'War-Ready Youth', 'General', 'Warlord'].some(r => char.role.includes(r))
      },
      { 
        name: '📜 Inspect Trade Manifests', 
        icon: <ScrollText size={18} />, 
        desc: 'Calculate potential profits for the next Silk Road run.', 
        effect: { intelligence: 8, wealth: 50 }, 
        minAge: 15,
        condition: (char: Character) => 
          ['Trader', 'Merchant', 'Guild Master'].some(r => char.role.includes(r))
      },
      { 
        name: '✨ Commune with Spirits', 
        icon: <Sparkles size={18} />, 
        desc: 'Seek visions at the holy summit.', 
        effect: { intelligence: 10, health: -5 }, 
        minAge: 15,
        condition: (char: Character) => 
          ['Shaman', 'Seeker', 'Sage'].some(r => char.role.includes(r))
      },
      { name: '🪨 Pray at an Ovoo', icon: <History size={18} />, desc: 'Leave an offering for the ancestors.', effect: { loyalty: 5, reputation: 2 }, minAge: 5 },
      { 
        name: '👰 Take Concubine', 
        icon: <Users size={18} />, 
        desc: 'Bring a new woman into your household from captured ranks or smaller clans.', 
        effect: { wealth: -200, reputation: 5 }, 
        minAge: 18,
        condition: (char: Character) => char.gender === Gender.MALE && char.stats.wealth >= 200,
        customEffect: (char: Character) => ({
          ...char,
          marriageCandidates: generateMarriageCandidates(3).map(c => ({...c, type: 'Concubine Candidate' as any}))
        })
      },
      { 
        name: '🔥 Host Personal Grand Feast', 
        icon: <Utensils size={18} />, 
        desc: 'Sacrifice your personal herds and silver to host a feast that will be spoken of for generations.', 
        effect: { happiness: 25, reputation: 35 }, 
        minAge: 20,
        condition: (char: Character) => char.stats.wealth >= 800 && char.livestock.sheep >= 30,
        customEffect: (char: Character) => ({
          ...char,
          stats: { ...char.stats, wealth: char.stats.wealth - 800 },
          livestock: { ...char.livestock, sheep: char.livestock.sheep - 30 },
          relationships: char.relationships.map(r => ({ ...r, loyalty: Math.min(100, r.loyalty + 20) })),
          history: [...char.history, { age: char.age, text: "The hills echoed with the sounds of your grand feast. Your generosity has bound the clan to you like never before." }]
        })
      },
      { 
        name: '💍 Seek Marriage', 
        icon: <Users size={18} />, 
        desc: 'Consult the elders and matchmakers to find a suitable wife.', 
        effect: {}, 
        minAge: 16,
        condition: (char: Character) => char.gender === Gender.MALE && char.relationships.filter(r => r.type === 'Spouse' || r.type === 'Second Wife').length < (char.socialClass === SocialClass.NOBLE ? 3 : 1),
        customEffect: (char: Character) => ({
          ...char,
          marriageCandidates: generateMarriageCandidates(3)
        })
      },
      { 
        name: '🏘️ Visit Foreign Quarter', 
        icon: <Music size={18} />, 
        desc: 'Visit the tents of foreign merchants and travelers seeking pleasure.', 
        effect: { health: -2, wealth: -50, happiness: 10 }, 
        minAge: 18,
        customEffect: (char: Character) => ({
          ...char,
          marriageCandidates: generateMarriageCandidates(3).map(c => ({...c, type: 'Companion' as any}))
        })
      },
      { 
        name: '🔞 Visit Pleasure Tents (Brothel)', 
        icon: <Heart size={18} />, 
        desc: 'Seek carnal pleasure within the red-lantern tents of the caravan outskirts.', 
        effect: { health: -2, wealth: -150, happiness: 20 }, 
        minAge: 16,
        customEffect: (char: Character) => {
          const updatedChar = { ...char };
          const diseaseChance = 0.2;
          if (Math.random() < diseaseChance) {
            updatedChar.stats = { ...updatedChar.stats, health: Math.max(1, updatedChar.stats.health - 20), reputation: Math.max(0, updatedChar.stats.reputation - 10) };
            updatedChar.history = [...updatedChar.history, { age: updatedChar.age, text: "Your night of indulgence left you with a foul itch and a weakening fever." }];
          } else {
             updatedChar.history = [...updatedChar.history, { age: updatedChar.age, text: "You satisfied your base desires in the pleasure tents, waking up refreshed but lighter in purse." }];
          }
          
          setPleasureTentCandidates(generatePleasureTentCandidates(3));
          return updatedChar;
        }
      },
      { 
        name: '🤝 Strengthen Alliance', 
        icon: <Users size={18} />, 
        desc: 'Send gifts and messengers to your allied clan.', 
        effect: { loyalty: 10, reputation: 5, wealth: -100 }, 
        minAge: 18,
        condition: (char: Character) => char.relationships.some(r => r.isMarriageAlliance)
      },
      { 
        name: '🤝 Seek Friends & Socialize', 
        icon: <Users size={18} />, 
        desc: 'Spend time around the camp, looking for other nomads to build lasting friendships with.', 
        effect: { happiness: 5 }, 
        minAge: 5,
        customEffect: (char: Character) => {
          const candidates = generateFriendCandidates(3, char.age, char.socialClass);
          setFriendCandidates(candidates);
          return char;
        }
      },
      { 
        name: '👨‍👩‍👧‍👦 Spend Time with Family', 
        icon: <Heart size={18} />, 
        desc: 'Share stories and meals with your spouses and children.', 
        effect: { health: 2 }, 
        minAge: 18,
        condition: (char: Character) => char.relationships.some(r => ['Spouse', 'Second Wife', 'Concubine', 'Mistress', 'Child'].includes(r.type)),
        customEffect: (char: Character) => ({
          ...char,
          relationships: char.relationships.map(r => 
            (['Spouse', 'Second Wife', 'Concubine', 'Mistress', 'Child'].includes(r.type)) 
            ? { ...r, loyalty: Math.min(100, r.loyalty + 5) } 
            : r
          )
        })
      },
      { 
        name: "🍻 Drink Kumiss with Friends", 
        icon: <Utensils size={18} />, 
        desc: "Strengthen your friendships by drinking horns of fermented horse milk around the fire.", 
        effect: { happiness: 10, health: 1 }, 
        minAge: 14,
        condition: (char: Character) => char.relationships.some(r => r.type === 'Friend'),
        customEffect: (char: Character) => ({
          ...char,
          relationships: char.relationships.map(r => 
            (r.type === 'Friend') 
            ? { ...r, loyalty: Math.min(100, r.loyalty + 12) } 
            : r
          )
        })
      },
      { 
        name: '🍼 Seek an Heir', 
        icon: <Sparkles size={18} />, 
        desc: 'Focus on expanding your lineage and securing your future.', 
        effect: { health: -5 }, 
        minAge: 18,
        condition: (char: Character) => char.relationships.some(r => ['Spouse', 'Second Wife', 'Concubine', 'Mistress'].includes(r.type)),
        customEffect: (char: Character) => {
          const chance = 0.3; // 30% chance to have a child when focused
          if (Math.random() < chance) {
            const childNum = (Number(char.children) || 0) + 1;
            const isMale = Math.random() > 0.5;
            const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
            const name = names[Math.floor(Math.random() * names.length)];
            
            return {
              ...char,
              children: childNum,
              history: [...char.history, { age: char.age, text: `A new life begins! ${name} is born to your house.` }],
              relationships: [
                ...char.relationships,
                { 
                  name: `${name}`, 
                  type: "Child", 
                  loyalty: 100, 
                  status: "Active", 
                  clan: char.clan,
                  traits: ["Loyal"]
                }
              ]
            };
          }
          return char;
        }
      },
      { name: '👨‍🏫 Train Successors', icon: <Target size={18} />, desc: 'Teach your children the ways of the steppe, from archery to leadership.', effect: { leadership: 5, intelligence: 2 }, minAge: 25, condition: (char: Character) => char.children > 0 },
      { 
        name: '⚖️ The Yassa (Law)', 
        icon: <Shield size={18} />, 
        desc: 'Study the laws of the Great Khan to avoid the executioner\'s blade.', 
        effect: { loyalty: 5, intelligence: 2 }, 
        minAge: 12 
      },
      { 
        name: '🕵️ Horse Thievery (Crime)', 
        icon: <Sword size={18} />, 
        desc: 'Try to steal a prize stallion from a rival tribe. High risk, high reward.', 
        effect: { reputation: -10 }, 
        minAge: 14,
        customEffect: (char: Character) => {
          const success = Math.random() > 0.6;
          if (success) {
            return {
              ...char,
              stats: { ...char.stats, wealth: char.stats.wealth + 300, reputation: char.stats.reputation + 5, happiness: char.stats.happiness + 20 },
              history: [...char.history, { age: char.age, text: "Successfully stole a prize stallion! You are the talk of the camp." }]
            };
          } else {
            if (Math.random() > 0.8) {
              return {
                ...char,
                isAlive: false,
                history: [...char.history, { age: char.age, text: "You were caught red-handed by the rival clan. They showed no mercy." }]
              };
            }
            return {
              ...char,
              stats: { ...char.stats, health: char.stats.health - 40, wealth: 0, reputation: char.stats.reputation - 30, happiness: char.stats.happiness - 30 },
              history: [...char.history, { age: char.age, text: "Caught stealing horses. You were beaten and your assets were seized by the Khan's men." }]
            };
          }
        }
      },
      { 
        name: '🏃 Desertion (Crime)', 
        icon: <MapIcon size={18} />, 
        desc: 'Attempt to flee the army during a campaign. If caught, the penalty is death.', 
        effect: { loyalty: -50 }, 
        minAge: 18,
        condition: (char: Character) => char.role.includes('Warrior') || char.role.includes('General'),
        customEffect: (char: Character) => {
          const success = Math.random() > 0.8;
          if (success) {
            return {
              ...char,
              role: 'Outlaw',
              stats: { ...char.stats, reputation: 0, loyalty: 0, happiness: 10 },
              history: [...char.history, { age: char.age, text: "Escaped into the mountains. You are now a nameless outlaw." }]
            };
          } else {
            return {
              ...char,
              isAlive: false,
              history: [...char.history, { age: char.age, text: "Caught deserting the horde. You were executed according to the Yassa." }]
            };
          }
        }
      },
      { 
        name: '🛡️ Combat Simulator', 
        icon: <WarIcon size={18} />, 
        desc: 'Test your martial prowess and equipment against simulated foes.', 
        effect: {}, 
        minAge: 12,
        special: 'combat_sim'
      },
      { 
        name: '🐫 Visit Silk Road Caravan', 
        icon: <Globe size={18} />, 
        desc: 'Listen to news from distant lands and trade with foreign merchants.', 
        effect: {}, 
        minAge: 5,
        special: 'merchant'
      },
    ];

    return (
      <div className="space-y-3">
        {activities.map((act, i) => {
          if (act.condition && character && !act.condition(character)) return null;
          
          const isAgeLocked = act.minAge && (character?.age || 0) < act.minAge;
          const isWealthLocked = act.effect?.wealth && act.effect.wealth < 0 && (character?.stats.wealth || 0) < Math.abs(act.effect.wealth);
          const isLocked = isAgeLocked || isWealthLocked;
          
          return (
            <button 
              key={i} 
              disabled={isLocked}
              onClick={() => {
                if (isLocked) return;

                if ((act as any).special === 'combat_sim') {
                  setActiveTab(Tab.COMBAT_SIM);
                  return;
                }

                if ((act as any).special === 'merchant') {
                  setActiveTab(Tab.MERCHANT);
                  return;
                }

                const prevStats = { ...character!.stats };
                const prevRole = character!.role;
                const prevChildren = character!.children;
                const prevRelsCount = character!.relationships.length;
                const prevClanWealth = character!.clanWealth;

                let updatedChar = { ...character! };

                // Apply standard effects
                const updatedStats = { ...updatedChar.stats };
                Object.entries(act.effect).forEach(([k, v]) => {
                  const key = k as keyof typeof updatedStats;
                  const currentVal = Number.isNaN(Number(updatedStats[key])) ? 0 : (updatedStats[key] || 0);
                  const change = Number.isNaN(Number(v)) ? 0 : (v || 0);

                  if (key === 'wealth') {
                    updatedStats[key] = Math.max(0, currentVal + change);
                  } else {
                    updatedStats[key] = Math.max(0, Math.min(100, currentVal + change));
                  }
                });
                updatedChar.stats = updatedStats;
                
                // Track if it's alive before custom effects
                let isAlive = updatedChar.isAlive;
                const newHistoryEntry = { age: updatedChar.age, text: `Did activity: ${act.name}` };
                updatedChar.history = [...updatedChar.history, newHistoryEntry];
                
                // Apply custom effects if they exist
                if (act.customEffect) {
                  updatedChar = act.customEffect(updatedChar);
                }

                if (updatedChar.stats.health <= 0 && updatedChar.isAlive) {
                  updatedChar.isAlive = false;
                  updatedChar.history = [...updatedChar.history, { age: updatedChar.age, text: "You pushed yourself too far. Your health has reached zero, and you collapsed forever." }];
                }

                setCharacter(updatedChar);
                setIsMenuOpen(false);

                // Compute differences for Result Panel
                const postStats = { ...updatedChar.stats };
                const effectsList: any[] = [];
                
                Object.keys(postStats).forEach(ky => {
                  const key = ky as keyof typeof postStats;
                  const before = prevStats[key] || 0;
                  const after = postStats[key] || 0;
                  const diff = after - before;
                  if (diff !== 0) {
                    const statLabel = key === 'wealth' ? '💰 Wealth' :
                                      key === 'happiness' ? '😊 Happiness' :
                                      key === 'health' ? '❤️ Health' :
                                      key === 'reputation' ? '📈 Reputation' :
                                      key === 'realmReputation' ? '👑 Realm Influence' :
                                      key === 'strength' ? '💪 Strength' :
                                      key === 'intelligence' ? '🧠 Intelligence' :
                                      key === 'perception' ? '👁️ Perception' :
                                      key === 'leadership' ? '👑 Chieftain Leadership' :
                                      key === 'horseRiding' ? '🐎 Horse Riding' :
                                      key === 'archery' ? '🏹 Archery' : key;
                    effectsList.push({
                      label: statLabel,
                      value: diff > 0 ? `+${diff}` : `${diff}`,
                      isPositive: diff > 0,
                      isNegative: diff < 0
                    });
                  }
                });

                if (updatedChar.role !== prevRole) {
                  effectsList.push({
                    label: '👑 Tribal Role',
                    value: updatedChar.role,
                    isPositive: true
                  });
                }

                if (updatedChar.children !== prevChildren) {
                  effectsList.push({
                    label: '👶 Lineage',
                    value: 'New Child Born!',
                    isPositive: true
                  });
                }

                const clanWealthDiff = updatedChar.clanWealth - prevClanWealth;
                if (clanWealthDiff !== 0) {
                  effectsList.push({
                    label: '💰 Clan Treasury',
                    value: clanWealthDiff > 0 ? `+${clanWealthDiff}г` : `${clanWealthDiff}г`,
                    isPositive: clanWealthDiff > 0,
                    isNegative: clanWealthDiff < 0
                  });
                }

                if (updatedChar.relationships.length > prevRelsCount) {
                  const newAdded = updatedChar.relationships[updatedChar.relationships.length - 1];
                  effectsList.push({
                    label: `👥 New ${newAdded.type}`,
                    value: newAdded.name,
                    isPositive: true
                  });
                }

                let finalSnippet = updatedChar.history[updatedChar.history.length - 1]?.text || `Completed activity: ${act.name}`;
                // If the activity text is just "Did activity: XXX", we can look for something richer or make it look better
                if (finalSnippet.startsWith('Did activity: ')) {
                  finalSnippet = `${act.desc} You gained valuable experience and shaped your path.`;
                }

                setGenericActionResult({
                  title: act.name,
                  storySnippet: finalSnippet,
                  effects: effectsList
                });
              }}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                isLocked 
                ? 'bg-black/5 opacity-40 border-dashed border-[#8b7355]/20 grayscale pointer-events-none' 
                : 'bg-white/40 border-[#8b7355]/30 hover:bg-white/60'
              }`}
            >
              <div className={`p-3 rounded-lg ${isLocked ? 'bg-gray-400 text-gray-200' : 'bg-[#2b1d0e] text-[#e8dab2] shadow-sm'}`}>
                {act.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#2b1d0e] flex justify-between items-center text-sm">
                  <span>{act.name}</span>
                  {isAgeLocked && (
                    <span className="text-[8px] bg-red-900/10 text-red-900 px-2 py-0.5 rounded-full ring-1 ring-red-900/10">
                      LOCKED (AGE {act.minAge})
                    </span>
                  )}
                  {!isAgeLocked && isWealthLocked && act.effect?.wealth && (
                    <span className="text-[8px] bg-red-900/10 text-red-900 px-2 py-0.5 rounded-full ring-1 ring-red-900/10">
                      LOCKED ({Math.abs(act.effect.wealth)}г REQUIRED)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#5d4037] line-clamp-1 opacity-70">{act.desc}</div>
              </div>
              {!isLocked && <ChevronRight size={14} className="text-[#8b7355] opacity-40" />}
            </button>
          );
        })}
      </div>
    );
  };

  const renderHallOfFame = () => (
    <div className="space-y-6">
      <div className={`${settings.parchmentTexture ? 'parchment-texture' : 'bg-[#e8dab2]'} p-6 rounded-2xl border border-[#c5a021]/30 shadow-lg`}>
        <h3 className="text-xl font-display text-[#2b1d0e] mb-6 flex items-center gap-3">
          <Trophy size={20} className="text-[#c5a021]" /> Hall of Heroes
        </h3>

        {hallOfFame.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#8b7355]/20 rounded-xl bg-white/20">
            <ScrollText size={40} className="mx-auto text-[#8b7355]/30 mb-4" />
            <p className="text-sm font-serif italic text-[#5d4037]/60">Your heritage is yet to be written. Accomplish great deeds to be remembered.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hallOfFame.map((legacy, idx) => (
              <div 
                key={legacy.id} 
                className={`p-4 rounded-xl border flex gap-4 items-center bg-white/60 hover:bg-white/80 transition-all ${idx === 0 ? 'border-[#c5a021] border-2 ring-2 ring-[#c5a021]/10' : 'border-[#8b7355]/20'}`}
              >
                <div className="w-16 h-16 bg-[#2b1d0e] rounded-lg border-2 border-[#c5a021]/40 shrink-0 overflow-hidden relative">
                  {legacy.avatarUrl ? (
                    <img src={legacy.avatarUrl} alt={legacy.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={30} className="absolute inset-0 m-auto text-[#c5a021]/40" />
                  )}
                  {idx === 0 && <div className="absolute top-0 left-0 bg-[#c5a021] text-[#2b1d0e] p-0.5 rounded-br-lg"><Trophy size={10} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#2b1d0e] truncate">{legacy.name}</h4>
                    <span className="text-[10px] font-bold text-[#c57d21] whitespace-nowrap bg-[#c5a021]/10 px-2 py-0.5 rounded-full">
                      {legacy.wealth}г
                    </span>
                  </div>
                  <div className="text-[9px] uppercase font-bold text-[#5d4037]/60 mb-1">
                    {legacy.role} • Age {legacy.age}
                  </div>
                  <div className="flex items-center gap-3 text-[9px]">
                    <div className="flex items-center gap-1 text-red-700">
                      <Sword size={8} /> {legacy.militaryPower}
                    </div>
                    <div className="flex items-center gap-1 text-blue-700">
                      <Users size={8} /> {legacy.conqueredTribes} Tribes
                    </div>
                  </div>
                  <p className="text-[8px] italic text-[#5d4037]/80 mt-1 line-clamp-1 border-t border-[#8b7355]/10 pt-1">
                    "{legacy.deathCause}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/40 border border-[#8b7355]/20 rounded-xl">
        <h4 className="text-[10px] uppercase font-bold text-[#c57d21] mb-2 text-center tracking-widest">Global Ranking System</h4>
        <p className="text-[9px] text-[#5d4037] text-center opacity-70">
          Rankings are determined by total wealth accumulated plus bonuses for military conquests and age achieved.
        </p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className={`${settings.parchmentTexture ? 'parchment-texture' : 'bg-white/40'} p-6 rounded-2xl border border-[#c5a021]/30 shadow-sm`}>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#c57d21] mb-6 flex items-center gap-2">
          <Wand2 size={16} /> Interface
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2b1d0e]">Parchment Texture</p>
              <p className="text-[10px] text-[#5d4037] opacity-70">Apply authentic Mongolian parchment aesthetics</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, parchmentTexture: !s.parchmentTexture }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.parchmentTexture ? 'bg-[#c5a021]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.parchmentTexture ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2b1d0e]">Detailed Statistics</p>
              <p className="text-[10px] text-[#5d4037] opacity-70">Show more numerical data in the UI</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, showDetailedStats: !s.showDetailedStats }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.showDetailedStats ? 'bg-[#c5a021]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.showDetailedStats ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className={`${settings.parchmentTexture ? 'parchment-texture' : 'bg-white/40'} p-6 rounded-2xl border border-[#c5a021]/30 shadow-sm`}>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#c57d21] mb-6 flex items-center gap-2">
          <Activity size={16} /> Gameplay
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2b1d0e]">Vibration Feedback</p>
              <p className="text-[10px] text-[#5d4037] opacity-70">Haptic feedback on major decisions</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, vibration: !s.vibration }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.vibration ? 'bg-[#c5a021]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.vibration ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2b1d0e]">Notifications</p>
              <p className="text-[10px] text-[#5d4037] opacity-70">Visual alerts for background clan events</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, notifications: !s.notifications }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications ? 'bg-[#c5a021]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.notifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2b1d0e]">Sound Effects</p>
              <p className="text-[10px] text-[#5d4037] opacity-70">Synthesize audio cues for actions</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, sound: !s.sound }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.sound ? 'bg-[#c5a021]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.sound ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#2b1d0e]">Desktop Device Shell</p>
              <p className="text-[10px] text-[#5d4037] opacity-70">Simulate an Android phone frame on large screens</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, deviceShell: !s.deviceShell }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.deviceShell ? 'bg-[#c5a021]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.deviceShell ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#8b7355]/20">
            <p className="text-xs font-bold text-[#2b1d0e]">Android OS Accent Color</p>
            <div className="flex gap-3 pt-1">
              {[
                { name: 'gold', color: '#c5a021', label: 'Steppe Gold' },
                { name: 'crimson', color: '#dc2626', label: 'Blood & Iron' },
                { name: 'emerald', color: '#10b981', label: 'Imperial Jade' },
                { name: 'sky', color: '#0ea5e9', label: 'Eternal Blue Sky' },
              ].map(theme => (
                <button
                  key={theme.name}
                  onClick={() => {
                    playClickSound(settings.sound);
                    triggerVibration(30, settings.vibration);
                    setSettings(s => ({ ...s, androidThemeColor: theme.name }));
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${settings.androidThemeColor === theme.name ? 'ring-2 ring-offset-2 ring-[#2b1d0e]' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.label}
                >
                  {settings.androidThemeColor === theme.name && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {gameStarted && (
        <div className={`${settings.parchmentTexture ? 'parchment-texture' : 'bg-white/40'} p-6 rounded-2xl border border-[#c5a021]/30 shadow-sm`}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#c57d21] mb-6 flex items-center gap-2">
            <History size={16} /> Progress
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSave(false)}
              className="flex flex-col items-center justify-center p-4 bg-[#2b1d0e] text-[#e8dab2] rounded-xl border border-[#c5a021]/40 hover:bg-[#3d2a15] transition-all group"
            >
              <div className="bg-[#c5a021]/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <RotateCcw size={20} className="text-[#c5a021] rotate-180" />
              </div>
              <p className="text-xs font-bold uppercase tracking-tighter">Save Journey</p>
              <p className="text-[9px] opacity-60">Store locally</p>
            </button>

            <button 
              onClick={handleLoad}
              className="flex flex-col items-center justify-center p-4 bg-white/60 text-[#2b1d0e] rounded-xl border border-[#c5a021]/30 hover:bg-white/80 transition-all group"
            >
              <div className="bg-[#c5a021]/10 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <History size={20} className="text-[#c5a021]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-tighter">Load Journey</p>
              <p className="text-[9px] opacity-60">Restore progress</p>
            </button>
          </div>
        </div>
      )}

      {gameStarted && character && (
        <div className={`${settings.parchmentTexture ? 'parchment-texture' : 'bg-white/40'} p-6 rounded-2xl border border-red-500/30 shadow-sm transition-all hover:border-red-500/50`}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-700 mb-6 flex items-center gap-2">
            <RotateCcw size={16} /> End Saga
          </h3>
          <p className="text-xs text-[#5d4037] opacity-70 mb-4 font-serif italic">"Every spirit eventually returns to the Eternal Blue Sky."</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to abandon your current mortal journey and return to your ancestors?")) {
                  const updatedChar = { ...character };
                  updatedChar.isAlive = false;
                  updatedChar.deathCause = "Voluntary departure from this mortal coil";
                  updatedChar.history = [...updatedChar.history, { age: character.age, text: "You have voluntarily returned your spirit to the Eternal Blue Sky." }];
                  setCharacter(updatedChar);
                  recordLegacy(updatedChar);
                  setIsMenuOpen(false);
                }
              }}
              className="w-full py-3 bg-[#c5a021] text-[#2b1d0e] rounded-xl font-display text-sm tracking-widest hover:brightness-110 shadow-lg active:scale-95 transition-all"
            >
              ABANDON MORTAL LIFE
            </button>

            <button 
              onClick={() => {
                if (confirm("This will completely reset your progress and take you back to the main menu. Continue?")) {
                  fullReset();
                }
              }}
              className="w-full py-3 border border-red-500 text-red-500 rounded-xl font-display text-sm tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
              RESTART FROM SCRATCH
            </button>
          </div>
        </div>
      )}

      <div className="p-6 text-center">
        <p className="text-[10px] uppercase font-bold text-[#8b7355] opacity-50 tracking-tighter">Steppe Saga v1.4.2 — Built for Great Khans</p>
      </div>
    </div>
  );

  const renderMerchant = () => {
    if (!character) return null;
    
    const multipliers = MARKET_MULTIPLIERS[character.marketCondition] || MARKET_MULTIPLIERS.Stable;

    const workshops = character.workshops || [
      {
        id: 'ws-dairy',
        name: 'Dairy Fermentation Ger',
        type: 'Dairy' as const,
        level: 0,
        passiveIncome: 30,
        costToUpgrade: 150,
        description: 'Process sheep, horse, and yak milk into Aaruul (dried cheese curd) and Airag.'
      },
      {
        id: 'ws-saddle',
        name: 'Saddle & Leather Workshop',
        type: 'Saddle' as const,
        level: 0,
        passiveIncome: 50,
        costToUpgrade: 250,
        description: 'Craft sturdy horse saddles, tethers, leather boots, and winter coats.'
      },
      {
        id: 'ws-forge',
        name: 'Iron Weaponry Forge',
        type: 'Forge' as const,
        level: 0,
        passiveIncome: 80,
        costToUpgrade: 400,
        description: 'Forge flexible steel sabers, battle spears, and armor-piercing arrows.'
      },
      {
        id: 'ws-weaving',
        name: 'Carpet & Wool Loom',
        type: 'Weaving' as const,
        level: 0,
        passiveIncome: 65,
        costToUpgrade: 320,
        description: 'Weave warm wool carpets, felt wall insulation, and ornamental silk belts.'
      }
    ];

    const caravans = character.caravans || [];

    const CARAVAN_ROUTES = [
      {
        destination: 'Jin Dynasty',
        durationYears: 1,
        baseCost: 350,
        expectedReturnMin: 550,
        expectedReturnMax: 900,
        risk: 'Medium',
        desc: 'Travel to the rich markets of the Jin Dynasty. High demand for nomadic horses and fine furs.'
      },
      {
        destination: 'Western Xia',
        durationYears: 1,
        baseCost: 250,
        expectedReturnMin: 380,
        expectedReturnMax: 620,
        risk: 'Low',
        desc: 'Short route across friendly territories. Safe trade of salt and dried meat.'
      },
      {
        destination: 'Khwarazmian Empire',
        durationYears: 2,
        baseCost: 750,
        expectedReturnMin: 1400,
        expectedReturnMax: 2400,
        risk: 'High',
        desc: 'Treacherous expedition across Central Asian deserts to the glorious Persian bazaars.'
      },
      {
        destination: 'Siberian Forest Tribes',
        durationYears: 1,
        baseCost: 150,
        expectedReturnMin: 220,
        expectedReturnMax: 350,
        risk: 'Low',
        desc: 'Cold northern trail to trade iron tools for precious sables, falcon birds, and fine furs.'
      }
    ];

    const handleBuildWorkshop = (wsId: string) => {
      const wsIndex = workshops.findIndex(w => w.id === wsId);
      if (wsIndex === -1) return;
      const ws = workshops[wsIndex];

      if (character.stats.wealth < ws.costToUpgrade) {
        alert("Not enough wealth to establish this workshop!");
        return;
      }

      const updatedChar = { ...character };
      updatedChar.stats.wealth -= ws.costToUpgrade;
      
      const updatedWorkshops = [...workshops];
      updatedWorkshops[wsIndex] = {
        ...ws,
        level: 1,
        costToUpgrade: Math.floor(ws.costToUpgrade * 1.8),
        passiveIncome: Math.floor(ws.passiveIncome * 1.5)
      };
      
      updatedChar.workshops = updatedWorkshops;
      updatedChar.history = [...updatedChar.history, { age: character.age, text: `Established ${ws.name} in your camp for ${ws.costToUpgrade}г.` }];
      setCharacter(updatedChar);
      playCoinSound(settings.sound);
    };

    const handleUpgradeWorkshop = (wsId: string) => {
      const wsIndex = workshops.findIndex(w => w.id === wsId);
      if (wsIndex === -1) return;
      const ws = workshops[wsIndex];

      if (character.stats.wealth < ws.costToUpgrade) {
        alert("Not enough wealth to upgrade this workshop!");
        return;
      }

      if (ws.level >= 5) {
        alert("This workshop has reached maximum level!");
        return;
      }

      const updatedChar = { ...character };
      updatedChar.stats.wealth -= ws.costToUpgrade;
      
      const updatedWorkshops = [...workshops];
      updatedWorkshops[wsIndex] = {
        ...ws,
        level: ws.level + 1,
        costToUpgrade: Math.floor(ws.costToUpgrade * 1.8),
        passiveIncome: Math.floor(ws.passiveIncome * 1.6)
      };
      
      updatedChar.workshops = updatedWorkshops;
      updatedChar.history = [...updatedChar.history, { age: character.age, text: `Upgraded ${ws.name} to Level ${ws.level + 1} for ${ws.costToUpgrade}г.` }];
      setCharacter(updatedChar);
      playCoinSound(settings.sound);
    };

    const handleCraftWorkshop = (wsId: string) => {
      const wsIndex = workshops.findIndex(w => w.id === wsId);
      if (wsIndex === -1) return;
      const ws = workshops[wsIndex];

      let happinessCost = 0;
      let healthCost = 0;
      let rewardGold = 0;
      let rewardStat: keyof CharacterStats | null = null;
      let craftName = "";

      if (ws.type === 'Dairy') {
        happinessCost = 10;
        healthCost = 5;
        rewardGold = Math.floor(50 * (1 + ws.level * 0.4));
        rewardStat = 'intelligence';
        craftName = "Ferment Grand Airag Batch";
      } else if (ws.type === 'Saddle') {
        happinessCost = 12;
        healthCost = 7;
        rewardGold = Math.floor(85 * (1 + ws.level * 0.4));
        rewardStat = 'perception';
        craftName = "Stitch Imperial Saddle";
      } else if (ws.type === 'Forge') {
        happinessCost = 15;
        healthCost = 10;
        rewardGold = Math.floor(130 * (1 + ws.level * 0.4));
        rewardStat = 'strength';
        craftName = "Forge Steel Sabers";
      } else if (ws.type === 'Weaving') {
        happinessCost = 12;
        healthCost = 5;
        rewardGold = Math.floor(100 * (1 + ws.level * 0.4));
        rewardStat = 'reputation';
        craftName = "Weave Sacred Yurt Carpet";
      }

      if (character.stats.happiness <= happinessCost) {
        alert("You are too unhappy/exhausted to perform this manual labor!");
        return;
      }
      if (character.stats.health <= healthCost + 5) {
        alert("Your health is too fragile for heavy craftsmanship!");
        return;
      }

      const updatedChar = { ...character };
      updatedChar.stats.happiness -= happinessCost;
      updatedChar.stats.health -= healthCost;
      updatedChar.stats.wealth += rewardGold;
      if (rewardStat) {
        updatedChar.stats[rewardStat] = Math.min(100, updatedChar.stats[rewardStat] + 1);
      }
      updatedChar.history = [...updatedChar.history, { age: character.age, text: `Manually crafted ${craftName} in your workshop, earning ${rewardGold}г.` }];
      setCharacter(updatedChar);
      playCoinSound(settings.sound);
    };

    const handleLaunchCaravan = () => {
      const route = CARAVAN_ROUTES.find(r => r.destination === caravanRoute);
      if (!route) return;

      const cargoBonusCost = caravanCargo === 'Skins & Animals' ? 60 : caravanCargo === 'Iron Weapons' ? 120 : 0;
      const cargoBonusReturnMin = caravanCargo === 'Skins & Animals' ? 100 : caravanCargo === 'Iron Weapons' ? 220 : 0;
      const cargoBonusReturnMax = caravanCargo === 'Skins & Animals' ? 150 : caravanCargo === 'Iron Weapons' ? 300 : 0;

      const totalCost = route.baseCost + (caravanGuards * 50) + cargoBonusCost;
      if (character.stats.wealth < totalCost) {
        alert("Not enough wealth to launch this caravan!");
        return;
      }

      const newCaravan: CaravanVoyage = {
        id: `caravan-${Date.now()}`,
        destination: route.destination,
        investment: totalCost,
        guards: caravanGuards,
        cargo: caravanCargo,
        durationYears: route.durationYears,
        progressYears: 0,
        expectedReturnMin: route.expectedReturnMin + cargoBonusReturnMin,
        expectedReturnMax: route.expectedReturnMax + cargoBonusReturnMax,
        status: 'Traveling'
      };

      const updatedChar = { ...character };
      updatedChar.stats.wealth -= totalCost;
      updatedChar.caravans = [...(updatedChar.caravans || []), newCaravan];
      updatedChar.history = [...updatedChar.history, { age: character.age, text: `Launched trade caravan to ${route.destination} with ${caravanGuards} guards carrying ${caravanCargo}. Cost: ${totalCost}г.` }];
      setCharacter(updatedChar);
      playCoinSound(settings.sound);
    };

    const handleDismissCompletedCaravan = (id: string) => {
      const updatedChar = { ...character };
      updatedChar.caravans = (updatedChar.caravans || []).filter(c => c.id !== id);
      setCharacter(updatedChar);
    };

    const handleSellItem = (assetId: string) => {
      const assetIndex = character.assets.findIndex(a => a.id === assetId);
      if (assetIndex === -1) return;
      
      const asset = character.assets[assetIndex];
      let sellPrice = asset.value;
      
      if (asset.type === 'Commodity') sellPrice *= multipliers.sell * (multipliers.commodity || 1.0);
      else if (asset.type === 'Luxury') sellPrice *= multipliers.sell * (multipliers.luxury || 1.0);
      else if (asset.type === 'Weapon' || asset.type === 'Armor') sellPrice *= multipliers.sell * (multipliers.gear || 1.0);
      else sellPrice *= multipliers.sell;

      sellPrice = Math.floor(sellPrice);

      const updatedChar = { ...character };
      updatedChar.stats.wealth += sellPrice;
      updatedChar.assets.splice(assetIndex, 1);
      updatedChar.history = [...updatedChar.history, { age: character.age, text: `Sold ${asset.name} for ${sellPrice}г during ${character.marketCondition}.` }];
      setCharacter(updatedChar);
    };

    const renderMarketIcon = (type: string, name: string) => {
      const lowerName = name.toLowerCase();
      if (type === 'Weapon') return <Sword size={20} />;
      if (type === 'Armor') return <Shield size={20} />;
      if (type === 'Horse') return <MapIcon size={20} />;
      if (lowerName.includes('silk') || lowerName.includes('carpet')) return <Shirt size={20} />;
      if (lowerName.includes('spice') || lowerName.includes('saffron') || lowerName.includes('tea') || lowerName.includes('wine')) return <Coffee size={20} />;
      if (lowerName.includes('ceramic') || lowerName.includes('porcelain') || lowerName.includes('teaset')) return <Box size={20} />;
      if (type === 'Luxury') return <Sparkles size={20} />;
      return <Package size={20} />;
    };

    const categories = ['All', 'Mounts & Animals', 'Combat Gear', 'Estate & Home', 'Trade Goods', 'Rare Luxuries'];

    const filteredItems = character.availableMarketItems
      .filter(item => marketCategory === 'All' || item.category === marketCategory)
      .sort((a, b) => {
        if (marketSort === 'price') return a.price - b.price;
        if (marketSort === 'quality') return b.quality - a.quality;
        return a.name.localeCompare(b.name);
      });

    const renderWorkshopsTab = () => {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#c5a021]/30 bg-white/40 text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2b1d0e]">Tribal Manufacturing</h3>
            <p className="text-[10px] italic opacity-70 mt-1">
              "Establish and upgrade dedicated yurt-workshops to produce passive income and master fine steppe crafts."
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {workshops.map((ws) => {
              const wsIcon = ws.type === 'Dairy' ? <Utensils size={20} /> :
                             ws.type === 'Saddle' ? <Shirt size={20} /> :
                             ws.type === 'Forge' ? <Sword size={20} /> :
                             <Sparkles size={20} />;
              
              const isBuilt = ws.level > 0;
              const currentIncome = isBuilt ? Math.floor(ws.passiveIncome * (1 + (character.stats.intelligence + character.stats.perception) / 100)) : 0;

              return (
                <div key={ws.id} className="p-3 bg-white/60 rounded-xl border border-[#c5a021]/30 hover:border-[#c5a021] transition-all space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[#2b1d0e] rounded-lg text-[#c5a021] shrink-0">
                      {wsIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs text-[#2b1d0e] truncate">{ws.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${isBuilt ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isBuilt ? `Lvl ${ws.level}` : 'Not Built'}
                        </span>
                      </div>
                      <p className="text-[9px] opacity-70 mt-0.5 leading-relaxed">{ws.description}</p>
                      {isBuilt && (
                        <div className="mt-1 text-[9px] font-bold text-[#c57d21] flex items-center gap-1">
                          <TrendingUp size={10} />
                          Yearly Profit: <span className="font-mono">{currentIncome}г</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-[#c5a021]/10">
                    {!isBuilt ? (
                      <button
                        onClick={() => handleBuildWorkshop(ws.id)}
                        disabled={character.stats.wealth < ws.costToUpgrade}
                        className="flex-1 py-2 bg-green-800 hover:bg-green-700 text-white font-bold text-[10px] uppercase rounded-lg disabled:opacity-40 transition-colors"
                      >
                        Establish ({ws.costToUpgrade}г)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUpgradeWorkshop(ws.id)}
                          disabled={character.stats.wealth < ws.costToUpgrade || ws.level >= 5}
                          className="flex-1 py-1.5 bg-[#2b1d0e] text-[#e8dab2] hover:bg-black font-bold text-[10px] uppercase rounded-lg disabled:opacity-40 transition-colors"
                        >
                          {ws.level >= 5 ? 'Max Level' : `Upgrade (${ws.costToUpgrade}г)`}
                        </button>
                        <button
                          onClick={() => handleCraftWorkshop(ws.id)}
                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase rounded-lg transition-colors"
                        >
                          Craft Item
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderCaravansTab = () => {
      const currentRouteInfo = CARAVAN_ROUTES.find(r => r.destination === caravanRoute) || CARAVAN_ROUTES[0];
      const cargoBonusCost = caravanCargo === 'Skins & Animals' ? 60 : caravanCargo === 'Iron Weapons' ? 120 : 0;
      const cargoBonusReturnMin = caravanCargo === 'Skins & Animals' ? 100 : caravanCargo === 'Iron Weapons' ? 220 : 0;
      const cargoBonusReturnMax = caravanCargo === 'Skins & Animals' ? 150 : caravanCargo === 'Iron Weapons' ? 300 : 0;
      const totalCost = currentRouteInfo.baseCost + (caravanGuards * 50) + cargoBonusCost;
      const displayReturnMin = currentRouteInfo.expectedReturnMin + cargoBonusReturnMin;
      const displayReturnMax = currentRouteInfo.expectedReturnMax + cargoBonusReturnMax;

      const guardBonus = Math.min(25, caravanGuards * 6);
      const playerBonus = (character.stats.perception + character.stats.intelligence) / 8;
      const totalSuccessChance = Math.min(98, Math.floor(65 + guardBonus + playerBonus));

      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#c5a021]/30 bg-white/40 text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2b1d0e]">Silk Road Expeditions</h3>
            <p className="text-[10px] italic opacity-70 mt-1">
              "Equip, load, and protect heavy trading caravans traveling to distant empires. Journeys take 1 to 2 years."
            </p>
          </div>

          {caravans.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[9px] uppercase font-bold tracking-widest text-[#c57d21]">Current Expeditions</h4>
              <div className="grid grid-cols-1 gap-2">
                {caravans.map((car) => {
                  const isFinished = car.status !== 'Traveling';
                  return (
                    <div key={car.id} className="p-3 bg-white/60 rounded-xl border border-[#c5a021]/30 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-xs text-[#2b1d0e]">To: {car.destination}</h5>
                          <p className="text-[9px] text-[#5d4037]/70">Guards: {car.guards} • Cargo: {car.cargo}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          car.status === 'Traveling' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          car.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {car.status === 'Traveling' ? `${car.progressYears}/${car.durationYears} Years` : car.status}
                        </span>
                      </div>
                      {isFinished ? (
                        <div className="space-y-2">
                          <p className="text-[9px] italic text-[#5d4037] bg-white/30 p-2 rounded border border-[#8b7355]/10 leading-normal">{car.narrative}</p>
                          <button
                            onClick={() => handleDismissCompletedCaravan(car.id)}
                            className="w-full py-1.5 bg-[#2b1d0e] hover:bg-black text-[#e8dab2] font-bold text-[9px] uppercase rounded-lg transition-colors"
                          >
                            Acknowledge Report
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-[9px] text-[#c57d21] font-semibold border-t border-[#c5a021]/10 pt-1.5">
                          <span>Est Return: {car.expectedReturnMin} - {car.expectedReturnMax}г</span>
                          <span>Progress: {Math.floor((car.progressYears / car.durationYears) * 100)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white/40 p-3 rounded-xl border border-[#c5a021]/30 space-y-3">
            <h4 className="text-[9px] uppercase font-bold tracking-widest text-[#2b1d0e] flex items-center gap-1">
              <Coins size={12} /> Configure New Voyage
            </h4>

            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-[#5d4037]">1. Select Destination Route</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CARAVAN_ROUTES.map(r => (
                  <button
                    key={r.destination}
                    onClick={() => setCaravanRoute(r.destination)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      caravanRoute === r.destination 
                        ? 'bg-[#2b1d0e] border-[#2b1d0e] text-[#e8dab2] shadow-sm' 
                        : 'bg-white/40 border-transparent hover:border-[#c5a021]/40 text-[#5d4037]'
                    }`}
                  >
                    <div className="font-bold text-[9px] flex justify-between">
                      <span>{r.destination}</span>
                      <span className="text-[7px] opacity-75">{r.durationYears} Yr</span>
                    </div>
                    <p className="text-[8px] opacity-65 mt-0.5">{r.risk} Risk • {r.baseCost}г</p>
                  </button>
                ))}
              </div>
              <p className="text-[8px] italic opacity-60 px-1 mt-1 leading-normal">{currentRouteInfo.desc}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-[#5d4037]">2. Load Cargo Type</label>
              <div className="flex gap-1.5">
                {['Felt & Leather', 'Skins & Animals', 'Iron Weapons'].map(c => (
                  <button
                    key={c}
                    onClick={() => setCaravanCargo(c)}
                    className={`flex-1 py-1.5 text-[8px] font-bold uppercase rounded-lg border transition-all ${
                      caravanCargo === c 
                        ? 'bg-[#2b1d0e] border-[#2b1d0e] text-[#e8dab2] shadow-sm' 
                        : 'bg-white/40 border-transparent text-[#5d4037]'
                    }`}
                  >
                    {c}
                    <div className="text-[7px] opacity-70 font-mono mt-0.5">
                      {c === 'Felt & Leather' ? '+0г' : c === 'Skins & Animals' ? '+60г' : '+120г'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[8px] font-bold uppercase tracking-wider text-[#5d4037]">3. Hire Guard Escort</label>
                <span className="text-[8px] font-bold font-mono text-[#c57d21]">Success: {totalSuccessChance}%</span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => setCaravanGuards(num)}
                    className={`flex-1 py-1.5 text-[8px] font-bold uppercase rounded-lg border transition-all ${
                      caravanGuards === num 
                        ? 'bg-[#2b1d0e] border-[#2b1d0e] text-[#e8dab2] shadow-sm' 
                        : 'bg-white/40 border-transparent text-[#5d4037]'
                    }`}
                  >
                    {num === 0 ? 'None' : `${num} Guard${num > 1 ? 's' : ''}`}
                    <div className="text-[7px] opacity-70 font-mono mt-0.5">
                      +{num * 50}г
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#2b1d0e] text-[#e8dab2] p-3 rounded-xl border border-[#c5a021]/30 flex justify-between items-center">
              <div>
                <span className="text-[7px] uppercase font-bold tracking-wider text-gray-400">Total Investment</span>
                <div className="text-sm font-bold font-mono text-green-400">{totalCost}г</div>
                <div className="text-[8px] text-gray-400 mt-0.5">Est profit: {displayReturnMin} - {displayReturnMax}г</div>
              </div>
              <button
                onClick={handleLaunchCaravan}
                disabled={character.stats.wealth < totalCost}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:opacity-40 text-white font-bold text-[10px] uppercase rounded-lg shadow-md transition-colors"
              >
                Launch Caravan
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 pb-4">
        {/* Sub tabs for Silk Road Merchant */}
        <div className="flex bg-[#2b1d0e]/5 p-1 rounded-2xl border border-[#8b7355]/20 shadow-inner">
          <button 
            onClick={() => setMerchantSubTab('market')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${merchantSubTab === 'market' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-md ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/5'}`}
          >
            <ShoppingBag size={12} className={merchantSubTab === 'market' ? 'text-[#c5a021]' : ''} />
            Market Trade
          </button>
          <button 
            onClick={() => setMerchantSubTab('workshops')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${merchantSubTab === 'workshops' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-md ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/5'}`}
          >
            <Briefcase size={12} className={merchantSubTab === 'workshops' ? 'text-[#c5a021]' : ''} />
            Camp Workshops
          </button>
          <button 
            onClick={() => setMerchantSubTab('caravans')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${merchantSubTab === 'caravans' ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-md ring-1 ring-[#c5a021]/30' : 'text-[#2b1d0e]/60 hover:bg-[#2b1d0e]/5'}`}
          >
            <Globe size={12} className={merchantSubTab === 'caravans' ? 'text-[#c5a021]' : ''} />
            Trade Caravans
          </button>
        </div>

        {merchantSubTab === 'market' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border-2 text-center transition-all ${
              character.marketCondition === 'Economic Boom' ? 'bg-green-100 border-green-500 shadow-lg shadow-green-500/20' :
              character.marketCondition === 'Recession' ? 'bg-red-100 border-red-500 shadow-lg shadow-red-500/20' :
              'bg-white/40 border-[#c5a021]'
            }`}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#2b1d0e] flex items-center justify-center gap-2">
                <TrendingUp size={16} />
                {character.marketCondition}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                 <div className="px-2 py-1 bg-white/50 rounded-full text-[8px] font-bold uppercase border border-[#c5a021]/30">
                    Buy: <span className={multipliers.buy > 1 ? 'text-red-600' : multipliers.buy < 1 ? 'text-green-600' : 'text-[#8b7355]'}>x{multipliers.buy.toFixed(1)}</span>
                 </div>
                 <div className="px-2 py-1 bg-white/50 rounded-full text-[8px] font-bold uppercase border border-[#c5a021]/30">
                    Sell: <span className={multipliers.sell > 1 ? 'text-green-600' : multipliers.sell < 1 ? 'text-red-600' : 'text-[#8b7355]'}>x{multipliers.sell.toFixed(1)}</span>
                 </div>
                 {multipliers.livestock && multipliers.livestock !== 1 && (
                    <div title="Livestock Multiplier" className="px-2 py-1 bg-white/50 rounded-full text-[8px] font-bold uppercase border border-[#c5a021]/30">
                       🐎 <span className="text-[#c57d21]">x{multipliers.livestock.toFixed(1)}</span>
                    </div>
                 )}
                 {multipliers.gear && multipliers.gear !== 1 && (
                    <div title="Gear Multiplier" className="px-2 py-1 bg-white/50 rounded-full text-[8px] font-bold uppercase border border-[#c5a021]/30">
                       ⚔️ <span className="text-[#c57d21]">x{multipliers.gear.toFixed(1)}</span>
                    </div>
                 )}
                 {multipliers.commodity && multipliers.commodity !== 1 && (
                    <div title="Commodity Multiplier" className="px-2 py-1 bg-white/50 rounded-full text-[8px] font-bold uppercase border border-[#c5a021]/30">
                       📦 <span className="text-[#c57d21]">x{multipliers.commodity.toFixed(1)}</span>
                    </div>
                 )}
                 {multipliers.luxury && multipliers.luxury !== 1 && (
                    <div title="Luxury Multiplier" className="px-2 py-1 bg-white/50 rounded-full text-[8px] font-bold uppercase border border-[#c5a021]/30">
                       💎 <span className="text-[#c57d21]">x{multipliers.luxury.toFixed(1)}</span>
                    </div>
                 )}
              </div>
              <p className="text-[10px] italic opacity-70 mt-1">
                {character.marketCondition === 'Economic Boom' ? "Wealth flows like the great rivers. High demand for luxuries!" :
                 character.marketCondition === 'Recession' ? "Silver is scarce. Prices have plummeted." :
                 character.marketCondition === 'War Preparations' ? "Steel and supplies are worth their weight in gold." :
                 character.marketCondition === 'Livestock Famine' ? "The herds are thin. Grain and animals are priceless." :
                 "Prices are stable across the Silk Road."}
              </p>
            </div>

            {/* Categories and Sort */}
            <div className="bg-white/40 p-3 rounded-xl border border-[#c5a021]/30 space-y-3">
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMarketCategory(cat)}
                    className={`px-3 py-1 text-[10px] rounded-full border transition-all ${
                      marketCategory === cat 
                        ? 'bg-[#2b1d0e] text-[#e8dab2] border-[#2b1d0e]' 
                        : 'bg-white/50 text-[#5d4037] border-transparent hover:border-[#c5a021]/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-[#c5a021]/10 pt-2">
                <span className="text-[9px] font-bold text-[#c57d21] uppercase tracking-wider">Sort By</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMarketSort('name')}
                    className={`text-[9px] uppercase font-bold transition-colors ${marketSort === 'name' ? 'text-[#2b1d0e]' : 'text-[#5d4037]/40'}`}
                  >
                    Alphabetical
                  </button>
                  <button 
                    onClick={() => setMarketSort('price')}
                    className={`text-[9px] uppercase font-bold transition-colors ${marketSort === 'price' ? 'text-[#2b1d0e]' : 'text-[#5d4037]/40'}`}
                  >
                    Price
                  </button>
                  <button 
                    onClick={() => setMarketSort('quality')}
                    className={`text-[9px] uppercase font-bold transition-colors ${marketSort === 'quality' ? 'text-[#2b1d0e]' : 'text-[#5d4037]/40'}`}
                  >
                    Quality
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c57d21]">Market Goods</h4>
                 <span className="text-[9px] text-[#5d4037] opacity-60">Showing {filteredItems.length} items</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredItems.map((item, idx) => {
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-[#c5a021]/30 hover:border-[#c5a021] transition-all group">
                      <div className="h-10 w-10 bg-[#2b1d0e] rounded-lg flex items-center justify-center text-[#c5a021] group-hover:scale-110 transition-transform">
                        {renderMarketIcon(item.type, item.name)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#2b1d0e]">{item.name}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-[9px] opacity-60 uppercase">{item.category || item.type}</p>
                           <span className="h-1 w-1 rounded-full bg-[#c5a021]/30" />
                           <p className="text-[9px] text-[#c5a021] font-bold">Q: {item.quality}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleBuyAsset(item)}
                        disabled={character.stats.wealth < item.price}
                        className="px-4 py-2 bg-[#2b1d0e] text-[#e8dab2] rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-black transition-colors"
                      >
                        {item.price}г
                      </button>
                    </div>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="bg-white/20 p-8 rounded-xl border border-dashed border-[#c5a021]/30 text-center">
                    <p className="text-xs italic text-[#5d4037] opacity-60">No items matching this category in today's caravan.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
               <div className="flex justify-between items-end mb-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c57d21]">Your Inventory</h4>
                  <span className="text-[9px] text-[#5d4037] opacity-60">Current Wealth: {character.stats.wealth}г</span>
               </div>
               <div className="grid grid-cols-1 gap-2">
                 {character.assets.filter(a => a.type === 'Commodity' || a.type === 'Luxury' || a.type === 'Weapon' || a.type === 'Armor').map((asset) => {
                    let sellPrice = asset.value;
                    if (asset.type === 'Commodity') sellPrice *= multipliers.sell * (multipliers.commodity || 1.0);
                    else if (asset.type === 'Luxury') sellPrice *= multipliers.sell * (multipliers.luxury || 1.0);
                    else if (asset.type === 'Weapon' || asset.type === 'Armor') sellPrice *= multipliers.sell * (multipliers.gear || 1.0);
                    else sellPrice *= multipliers.sell;
                    sellPrice = Math.floor(sellPrice);

                    return (
                      <div key={asset.id} className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-[#8b7355]/20 group">
                         <div className="h-10 w-10 bg-white/50 rounded-lg flex items-center justify-center text-[#5d4037] group-hover:bg-[#2b1d0e] group-hover:text-[#c5a021] transition-all">
                            {renderMarketIcon(asset.type, asset.name)}
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-bold text-[#2b1d0e]">{asset.name}</p>
                            <p className="text-[10px] opacity-60 uppercase">{asset.type} (Q: {asset.quality})</p>
                         </div>
                         <button 
                           onClick={() => handleSellItem(asset.id)}
                           className="px-4 py-2 bg-green-800 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                         >
                           Sell {sellPrice}г
                         </button>
                      </div>
                    );
                 })}
                 {character.assets.filter(a => a.type === 'Commodity' || a.type === 'Luxury' || a.type === 'Weapon' || a.type === 'Armor').length === 0 && (
                   <div className="bg-white/20 p-8 rounded-xl border border-dashed border-[#c5a021]/30 text-center">
                      <Package size={24} className="mx-auto text-[#c5a021]/40 mb-2" />
                      <p className="text-xs italic text-[#5d4037] opacity-60">No trade goods in your inventory.</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-[#2b1d0e] p-6 rounded-2xl border-2 border-[#c5a021] shadow-xl text-center relative overflow-hidden">
              <h3 className="text-lg font-display text-[#e8dab2] mb-2">Silk Road Caravanners</h3>
              <p className="text-[10px] text-[#e8dab2]/60 italic mb-4">"Hire protection or trade tips from the passing caravans."</p>
              <button 
                onClick={() => {
                  if (adRewardUsed) return;
                  setShowAdOptions(true);
                }}
                disabled={adRewardUsed}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${adRewardUsed ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#e8dab2] text-[#2b1d0e] hover:bg-white'}`}
              >
                {adRewardUsed ? 'CARAVAN HAS PASSED' : 'SPEAK WITH TRAVELERS'}
                {!adRewardUsed && <Play size={16} />}
              </button>
            </div>
          </div>
        )}

        {merchantSubTab === 'workshops' && renderWorkshopsTab()}
        {merchantSubTab === 'caravans' && renderCaravansTab()}
      </div>
    );
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === "Stripe not configured") {
          alert("Stripe is not configured. Please add your STRIPE_SECRET_KEY in the Settings menu (Secrets/Env Vars).");
          return;
        }
        throw new Error(data.error || "Failed to create checkout session");
      }
      
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Subscription error:", err);
      alert("Subscription failed: " + err.message);
    }
  };

  const renderHeritage = () => (
    <div className="space-y-6">
      <div className="bg-[#2b1d0e] p-6 rounded-3xl border-2 border-[#c5a021] text-[#e8dab2] relative overflow-hidden shadow-xl mb-6">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <ScrollText size={80} />
         </div>
         <div className="relative z-10">
            <h3 className="text-2xl font-display uppercase tracking-widest text-[#c5a021]">Family Heritage</h3>
            <p className="text-xs italic opacity-80 mt-1">"The blood of the wolf flows through your descendants. Secure the future of your bloodline."</p>
         </div>
      </div>

      <div className="bg-white/40 p-6 rounded-2xl border border-[#8b7355]/20 space-y-4">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037] flex items-center gap-2">
          <Shield size={12} className="text-[#c57d21]" />
          Succession Law
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {(['Tanistry', 'Primogeniture', 'Ultimogeniture', 'Elective'] as const).map(law => (
            <button
              key={law}
              onClick={() => handleChangeSuccessionLaw(law)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${character?.successionLaw === law ? 'bg-[#2b1d0e] border-[#c5a021] text-[#e8dab2] shadow-lg' : 'bg-white/60 border-transparent text-[#2b1d0e] hover:bg-white'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">{law}</span>
                {character?.successionLaw === law && <div className="h-2 w-2 rounded-full bg-[#c5a021] animate-pulse" />}
              </div>
              <p className="text-[9px] opacity-60 mt-1">
                {law === 'Tanistry' && 'Successor is chosen by elders from the wider family pool.'}
                {law === 'Primogeniture' && 'The eldest child inherits all titles and wealth.'}
                {law === 'Ultimogeniture' && 'The youngest child inherits, ensuring continuity for the longest duration.'}
                {law === 'Elective' && 'You can choose any family member, but it requires high reputation.'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {character?.heirId && (
        <div className="bg-white/40 p-6 rounded-2xl border border-[#8b7355]/20">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037] mb-4 flex items-center gap-2">
             <Trophy size={12} className="text-[#c5a021]" />
             Current Designated Heir
          </h4>
          {(() => {
            const heir = character.relationships.find(r => r.id === character.heirId);
            if (!heir) return <p className="text-xs italic opacity-50">Heir record unavailable.</p>;
            return (
              <div className="flex items-center gap-4 p-4 bg-[#2b1d0e] rounded-xl border border-[#c5a021]/30">
                <div className="h-12 w-12 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                  {heir.avatarUrl ? (
                    <img src={heir.avatarUrl} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={24} className="text-[#c5a021]/40" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#e8dab2]">{heir.name}</div>
                  <div className="text-[10px] text-[#c5a021] uppercase font-black">{heir.type} (Age: {heir.age || '?'})</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {(!character?.heirId) && (
        <div className="p-8 text-center bg-[#2b1d0e]/5 border-2 border-dashed border-[#8b7355]/20 rounded-2xl">
          <Users size={32} className="mx-auto mb-3 text-[#5d4037]/30" />
          <p className="text-xs text-[#5d4037] italic">"No heir has been designated. Go to the Relationships tab or call upon the Succession Council to select a blood successor."</p>
        </div>
      )}

      {/* Succession Council Support Card */}
      <div className="bg-[#2b1d0e]/5 p-6 rounded-2xl border-2 border-[#8b7355]/20 space-y-3">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037] flex items-center gap-2">
          <Users size={14} className="text-[#c59521]" />
          Succession Council
        </h4>
        <p className="text-xs text-[#5d4037] opacity-85 leading-relaxed">
          The sages, commanders, and matriarchs of your clan hold critical sway over tribal continuity. Formally convening the council allows you to examine eligible candidates side-by-side, solicit ancestral wisdom, or invest resources to recruit outer blood-kin.
        </p>
        <button
          onClick={handleConveneSuccessionCouncil}
          className="w-full py-3.5 px-6 bg-[#2b1d0e] border border-[#c5a021] text-[#e8dab2] font-semibold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          🗣️ Convene Succession Council
        </button>
      </div>
    </div>
  );

  const renderPremium = () => (
    <div className="space-y-6">
      <div className="parchment-texture p-6 rounded border border-[#c5a021]/50 bg-[#f4e4bc]">
        <div className="text-center space-y-2">
          <Sparkles className="mx-auto text-[#c5a021]" size={48} />
          <h2 className="text-2xl font-display uppercase tracking-tight">Steppe Premium</h2>
          <p className="text-sm text-[#5d4037] italic">Elevate your destiny across the eternal blue sky</p>
        </div>

        {isPremium ? (
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <p className="text-green-900 font-bold text-lg">Active Subscription</p>
              <p className="text-sm text-green-800 opacity-80">All premium benefits are currently unlocked for your bloodline.</p>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: "Kheshig Ancestry", desc: "Start every life with +20 Strength and enhanced survival instincts.", icon: <Sword size={16} /> },
                { title: "Golden Hoard", desc: "Receive 500 extra silver at the start of every new life.", icon: <Coins size={16} /> },
                { title: "Elite Command", icon: <Target size={16} />, desc: "Attract 200 additional veteran warriors to your horde upon reaching adulthood." },
                { title: "Divine Favor", icon: <Sparkles size={16} />, desc: "Higher success rates for rituals and political maneuvers." }
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-4 items-center p-4 bg-white/60 rounded-xl border border-[#c5a021]/20 shadow-sm">
                  <div className="bg-[#2b1d0e] text-[#c5a021] rounded-lg p-2 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2b1d0e]">{benefit.title}</h4>
                    <p className="text-[11px] text-[#5d4037] opacity-70 leading-tight">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              className="w-full py-4 bg-[#2b1d0e] text-[#e8dab2] font-bold rounded-xl shadow-lg hover:shadow-[#c5a021]/20 hover:bg-[#3d2a14] transition-all flex items-center justify-center gap-3 border border-[#c5a021]/50"
            >
              <span>Unlock Everything – $4.99/mo</span>
              <ChevronRight size={18} className="text-[#c5a021]" />
            </button>
            
            <div className="text-center space-y-1">
              <p className="text-[10px] text-[#5d4037] opacity-60">Manage or cancel your subscription at any time.</p>
              <div className="flex justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-[#c57d21]">
                <span>Secure Payment</span>
                <span>•</span>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderClan = () => (
    <div className="space-y-6">
       <div className="parchment-texture p-6 rounded border border-[#c5a021]/30">
          <div className="text-[10px] uppercase font-bold text-[#c57d21] mb-1">📜 Current Standing</div>
          <div className="text-2xl font-display">
            {character?.role} of the {character?.clan} Clan
            {character?.title && <span className="block text-sm text-[#c57d21] mt-1 italic">{character?.title}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="text-[10px] uppercase font-bold text-[#8b7355] bg-[#8b7355]/10 px-2 py-0.5 rounded-full inline-block">
              🏹 Occupation: {character?.role}
            </div>
            <div className="text-[10px] uppercase font-bold text-[#8b7355] bg-[#8b7355]/10 px-2 py-0.5 rounded-full inline-block">
              ⛺ Tribe: {character?.tribe}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold text-[#c57d21]">💰 Yearly Income</div>
            <div className="text-lg font-bold text-[#2b1d0e]">{ROLE_SALARIES[character?.role || ''] || 0}г</div>
          </div>
          <p className="text-sm italic mt-4 opacity-80">"Blood is thick, but the law of the Yassa is absolute."</p>
       </div>

        {/* ⚖️ Yassa Law Tracker */}
        {character && (
           <div id="yassa-tracker-card" className="bg-gradient-to-br from-[#1c140e] to-[#2d1f14] text-[#f5efe4] p-6 rounded-2xl border-2 border-[#c5a021]/80 shadow-xl relative overflow-hidden">
             {/* Decorative Corner Filigree */}
             <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#c5a021]/30 rounded-tr-2xl pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#c5a021]/30 rounded-bl-2xl pointer-events-none" />
             
             <div className="flex items-center gap-2 mb-2">
               <span className="text-2xl">⚖️</span>
               <h3 className="text-lg font-display text-[#e5be42] font-semibold uppercase tracking-wider">The Great Yassa Laws</h3>
             </div>
             
             <p className="text-[11px] opacity-80 leading-relaxed mb-4 italic text-[#e8dab2]">
               "The supreme imperial law code written by Genghis Khan. Cleanse campsite waterways, safeguard your covenants, honor travelers, and shun desertion to secure heavy annual gold and state renown."
             </p>

             {(() => {
                const laws = getYassaLaws();
                const honoredCount = laws.filter(l => l.status === 'Honored').length;
                const percent = Math.round((honoredCount / 5) * 100);
                const hasClaimedThisYear = character.lastYassaClaimedAge === character.age;

                return (
                  <div>
                    <div className="bg-[#120a05] p-4 rounded-xl border border-[#c5a021]/30 mb-5">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="text-[#c5a021]">Annual Adherence Rating</span>
                        <span className={percent === 100 ? "text-green-400" : percent >= 60 ? "text-yellow-400" : "text-red-400"}>
                          {percent}% ({honoredCount}/5 Laws Met)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#c5a021] to-[#e5be42] transition-all duration-500" 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                      <div className="mt-2 text-[10px] opacity-70 flex items-center justify-between">
                        <span>Current Age: <strong className="text-[#f5efe4]">{character.age}</strong></span>
                        <span className="uppercase text-[9px] tracking-widest font-bold">
                          {hasClaimedThisYear 
                            ? "✅ BLESSINGS CLAIMED FOR THIS AGE" 
                            : "⏳ REPORTING PERIOD OPEN"}
                        </span>
                      </div>
                    </div>

                    {/* Laws Cards Grid */}
                    <div className="space-y-3 mb-5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                      {laws.map(law => {
                        const isHonored = law.status === 'Honored';
                        const isViolated = law.status === 'Violated';
                        
                        const motionProps = isHonored ? {
                          animate: {
                            scale: [1, 1.012, 1],
                            borderColor: [
                              "rgba(34, 197, 94, 0.3)",
                              "rgba(56, 189, 248, 0.6)",
                              "rgba(229, 190, 66, 0.6)",
                              "rgba(34, 197, 94, 0.3)"
                            ],
                            boxShadow: [
                              "0 0 0px rgba(56, 189, 248, 0)",
                              "0 0 14px rgba(56, 189, 248, 0.35)",
                              "0 0 14px rgba(229, 190, 66, 0.35)",
                              "0 0 0px rgba(56, 189, 248, 0)"
                            ]
                          },
                          transition: {
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        } : {};

                        return (
                          <motion.div 
                            key={law.id} 
                            className={`p-3 rounded-xl border transition-all ${
                              isHonored 
                                ? 'bg-green-950/20 border-green-500/30 hover:border-green-500/50' 
                                : isViolated 
                                  ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/50' 
                                  : 'bg-white/5 border-white/10'
                            }`}
                            {...motionProps}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-xs text-[#f5efe4]">{law.name}</span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isHonored 
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                  : isViolated 
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              }`}>
                                {law.status}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-85 leading-snug mb-1 text-[#e8dab2]">{law.prohibition}</p>
                            <div className="flex flex-col sm:flex-row sm:justify-between text-[9px] opacity-60 mt-1.5 pt-1.5 border-t border-white/5">
                              <span>Requirement: <strong className="text-[#f5efe4]">{law.criteria}</strong></span>
                              <span className="text-[#e2ba3f]">Rewards: <strong>{law.rewardDesc}</strong></span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Interactive Buttons footer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleCleanseWaterway}
                        disabled={character.waterwayCleansedAge === character.age}
                        className="py-2.5 px-4 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-950/40 border-blue-500/30 text-blue-200 hover:bg-blue-950/70"
                      >
                        💧 Cleanse Waterway (40г)
                      </button>
                      
                      <button
                        onClick={handleClaimYassaBlessings}
                        disabled={hasClaimedThisYear}
                        className="py-2.5 px-4 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-[#c5a021] text-[#1a120b] border-[#c09400] hover:bg-[#e5be42]"
                      >
                        ⚖️ Claim Annual Blessings
                      </button>
                    </div>
                  </div>
                );
             })()}
           </div>
        )}

        {/* 🛡️ Horde & Warriors Command */}
        {character && character.age >= 15 && (
          <div id="warriors-management-card" className="bg-[#2b1d0e] p-6 rounded-2xl border-2 border-[#c5a021] text-[#e8dab2] shadow-xl relative overflow-hidden">
            {/* Background design decorative */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sword size={120} />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Sword size={20} className="text-[#c5a021]" />
              <h3 className="text-lg font-display text-[#e5be42] font-semibold uppercase tracking-wider">Horde & Warrior Command</h3>
            </div>

            <p className="text-xs opacity-80 leading-relaxed mb-4 italic text-[#e8dab2]">
              "Feed, train, and arm your vanguard soldiers to command the respect of rival clans and secure victory across the Great Steppe."
            </p>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-black/30 p-3 rounded-xl border border-[#c5a021]/20">
                <div className="text-[9px] uppercase font-bold text-[#c5a021]">Total Host Size</div>
                <div className="text-lg font-black text-white">{character.hordeSize || 0} <span className="text-[10px] text-[#c5a021] font-normal">Warriors</span></div>
                <div className="text-[9px] opacity-65 flex justify-between mt-1 pt-1 border-t border-white/5">
                  <span>Custom recruits:</span>
                  <span className="font-bold text-white">+{character.customRecruitedSoldiers || 0}</span>
                </div>
              </div>

              <div className="bg-black/30 p-3 rounded-xl border border-[#c5a021]/20">
                <div className="text-[9px] uppercase font-bold text-[#c5a021]">Weaponry Tier</div>
                <div className="text-xs font-bold text-white truncate">
                  {(() => {
                    const gearNames = ["Default Ragged Furs", "Hardened Leather Vests", "Lamellar Steel Plates", "Iron Barding & Lances", "Golden Kheshig Elite Armor"];
                    return gearNames[(character.warriorEquipmentLevel || 1) - 1] || "Default Ragged Furs";
                  })()}
                </div>
                <div className="text-[9px] opacity-65 flex justify-between mt-1 pt-1 border-t border-white/5">
                  <span>Level:</span>
                  <span className="font-bold text-[#c5a021]">{character.warriorEquipmentLevel || 1} / 5</span>
                </div>
              </div>
            </div>

            {/* Upkeep Projection Alert/Card */}
            {(() => {
              const commandRoles = ['Squad Leader (Arban)', 'Centurion (Zuun)', 'Commander of Thousand (Mingghan)', 'General', 'Warlord', 'Marshal of the Empire', 'Noyan (Noble Commander)', 'Great Khan'];
              const hasCommand = commandRoles.includes(character.role);
              
              let wageRate = 0.5;
              if (character.role === 'Squad Leader (Arban)') wageRate = 1.0;
              else if (character.role === 'Centurion (Zuun)') wageRate = 0.75;
              else if (character.role === 'Commander of Thousand (Mingghan)') wageRate = 0.6;
              else if (character.role === 'General') wageRate = 0.5;
              else if (character.role === 'Warlord' || character.role === 'Noyan (Noble Commander)' || character.role === 'Marshal of the Empire') wageRate = 0.4;
              else if (character.role === 'Great Khan') wageRate = 0.25;

              const annualUpkeep = hasCommand && character.hordeSize > 0 ? Math.floor(character.hordeSize * wageRate) : 0;
              const monthlyUpkeep = Number((annualUpkeep / 12).toFixed(1));

              return (
                <div className="bg-amber-950/40 border border-[#c5a021]/30 rounded-xl p-3 mb-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#c5a021]/10 rounded-lg text-[#c5a021]">
                        <Coins size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#e5be42] uppercase tracking-wider">Horde Upkeep Projection</h4>
                        <p className="text-[10px] opacity-75 mt-0.5 leading-tight">
                          {hasCommand 
                            ? `As a ${character.role}, your wage rate is ${wageRate}г per warrior annually.`
                            : "You are not currently in a command role. No army upkeep is charged."
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black font-mono text-amber-400">
                        -{monthlyUpkeep}г <span className="text-[9px] font-normal opacity-60">/mo</span>
                      </div>
                      <div className="text-[9px] opacity-60 font-mono">
                        (-{annualUpkeep}г /year)
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button for breakdown */}
                  <div className="pt-2 border-t border-[#c5a021]/20 flex justify-between items-center">
                    <span className="text-[9px] opacity-65 font-sans">
                      Current Horde Size: <strong className="text-white font-black">{character.hordeSize || 0}</strong> warriors
                    </span>
                    <button
                      id="toggle-upkeep-breakdown-btn"
                      onClick={() => setShowHordeUpkeepBreakdown(!showHordeUpkeepBreakdown)}
                      className="text-[10px] font-bold text-[#e5be42] hover:text-[#c5a021] flex items-center gap-1 transition-colors px-2 py-1 rounded bg-[#c5a021]/10 hover:bg-[#c5a021]/20 pointer-events-auto cursor-pointer"
                    >
                      <TrendingUp size={12} />
                      {showHordeUpkeepBreakdown ? "Hide Rank Upkeep Breakdown" : "Show Rank Upkeep Breakdown"}
                    </button>
                  </div>

                  {/* Breakdown Table/List */}
                  {showHordeUpkeepBreakdown && (
                    <div id="horde-upkeep-breakdown-details" className="mt-1 bg-black/50 rounded-lg p-3 border border-white/5 space-y-2.5">
                      <div className="text-[10px] font-bold text-[#e5be42]/80 uppercase tracking-wide border-b border-white/10 pb-1.5 flex justify-between">
                        <span>Rank & Wage Rate</span>
                        <span>Monthly Cost (for {character.hordeSize || 0} warriors)</span>
                      </div>
                      {[
                        { name: "Squad Leader (Arban)", rate: 1.0, icon: "⛺" },
                        { name: "Centurion (Zuun)", rate: 0.75, icon: "🐎" },
                        { name: "Commander of Thousand (Mingghan)", rate: 0.6, icon: "🏹" },
                        { name: "General", rate: 0.5, icon: "🛡️" },
                        { name: "Warlord / Noyan / Marshal", rate: 0.4, icon: "⚔️" },
                        { name: "Great Khan", rate: 0.25, icon: "👑" }
                      ].map((rank, index) => {
                        const rankAnnual = Math.floor((character.hordeSize || 0) * rank.rate);
                        const rankMonthly = Number((rankAnnual / 12).toFixed(1));
                        const isCurrentRankGroup = (
                          (rank.rate === 1.0 && character.role === "Squad Leader (Arban)") ||
                          (rank.rate === 0.75 && character.role === "Centurion (Zuun)") ||
                          (rank.rate === 0.6 && character.role === "Commander of Thousand (Mingghan)") ||
                          (rank.rate === 0.5 && character.role === "General") ||
                          (rank.rate === 0.4 && ['Warlord', 'Noyan (Noble Commander)', 'Marshal of the Empire'].includes(character.role)) ||
                          (rank.rate === 0.25 && character.role === "Great Khan")
                        );

                        return (
                          <div 
                            key={index} 
                            id={`upkeep-rank-row-${index}`}
                            className={`flex justify-between items-center text-[11px] py-1 px-1.5 rounded transition-all ${isCurrentRankGroup ? 'bg-[#c5a021]/20 border border-[#c5a021]/40 shadow-sm animate-pulse' : 'hover:bg-white/5'}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{rank.icon}</span>
                              <span className={`font-medium ${isCurrentRankGroup ? 'text-[#e5be42] font-bold' : 'text-white/80'}`}>
                                {rank.name} {isCurrentRankGroup && <span className="text-[8px] uppercase bg-[#c5a021] text-[#2b1d0e] px-1 rounded ml-1 font-black">Active</span>}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className={`font-black ${isCurrentRankGroup ? 'text-amber-300' : 'text-gray-300'}`}>
                                -{rankMonthly}г
                              </span>
                              <span className="text-[9px] opacity-50 ml-1">/mo</span>
                              <div className="text-[8px] opacity-40 leading-none mt-0.5">
                                (-{rankAnnual}г/yr @ {rank.rate}г/warrior)
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Recharts Bar Chart representing the upkeep distribution */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-[10px] font-bold text-[#e5be42]/80 uppercase tracking-wide mb-2 flex justify-between items-center">
                          <span>📈 Upkeep Comparison (Monthly Cost/Rank)</span>
                          <span className="text-[8px] text-gray-400 capitalize">Currently: {character.role || "None"}</span>
                        </div>
                        <div className="relative h-[140px] w-full text-[10px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: "Arban", rate: "1.0г", cost: Number((Math.floor((character.hordeSize || 0) * 1.0) / 12).toFixed(1)), isCurrent: character.role === "Squad Leader (Arban)" },
                                { name: "Zuun", rate: "0.75г", cost: Number((Math.floor((character.hordeSize || 0) * 0.75) / 12).toFixed(1)), isCurrent: character.role === "Centurion (Zuun)" },
                                { name: "Mingghan", rate: "0.6г", cost: Number((Math.floor((character.hordeSize || 0) * 0.6) / 12).toFixed(1)), isCurrent: character.role === "Commander of Thousand (Mingghan)" },
                                { name: "General", rate: "0.5г", cost: Number((Math.floor((character.hordeSize || 0) * 0.5) / 12).toFixed(1)), isCurrent: character.role === "General" },
                                { name: "Warlord", rate: "0.4г", cost: Number((Math.floor((character.hordeSize || 0) * 0.4) / 12).toFixed(1)), isCurrent: ['Warlord', 'Noyan (Noble Commander)', 'Marshal of the Empire'].includes(character.role) },
                                { name: "Khan", rate: "0.25г", cost: Number((Math.floor((character.hordeSize || 0) * 0.25) / 12).toFixed(1)), isCurrent: character.role === "Great Khan" }
                              ]}
                              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                            >
                              <XAxis 
                                dataKey="name" 
                                stroke="#e8dab2" 
                                opacity={0.6} 
                                tickLine={false}
                                tick={{ fontSize: 9 }}
                              />
                              <YAxis 
                                stroke="#e8dab2" 
                                opacity={0.6} 
                                tickLine={false}
                                tick={{ fontSize: 8 }}
                                unit="г"
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1c120c', borderColor: '#c5a021', borderRadius: '8px', color: '#e8dab2', fontSize: '11px' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                formatter={(value: any, name: string, props: any) => [
                                  `-${value}г`, 
                                  `Rate: ${props.payload.rate}`
                                ]}
                              />
                              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                                {[
                                  { name: "Arban", rate: "1.0г", cost: Number((Math.floor((character.hordeSize || 0) * 1.0) / 12).toFixed(1)), isCurrent: character.role === "Squad Leader (Arban)" },
                                  { name: "Zuun", rate: "0.75г", cost: Number((Math.floor((character.hordeSize || 0) * 0.75) / 12).toFixed(1)), isCurrent: character.role === "Centurion (Zuun)" },
                                  { name: "Mingghan", rate: "0.6г", cost: Number((Math.floor((character.hordeSize || 0) * 0.6) / 12).toFixed(1)), isCurrent: character.role === "Commander of Thousand (Mingghan)" },
                                  { name: "General", rate: "0.5г", cost: Number((Math.floor((character.hordeSize || 0) * 0.5) / 12).toFixed(1)), isCurrent: character.role === "General" },
                                  { name: "Warlord", rate: "0.4г", cost: Number((Math.floor((character.hordeSize || 0) * 0.4) / 12).toFixed(1)), isCurrent: ['Warlord', 'Noyan (Noble Commander)', 'Marshal of the Empire'].includes(character.role) },
                                  { name: "Khan", rate: "0.25г", cost: Number((Math.floor((character.hordeSize || 0) * 0.25) / 12).toFixed(1)), isCurrent: character.role === "Great Khan" }
                                ].map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.isCurrent ? '#fbbf24' : '#c5a021'} 
                                    fillOpacity={entry.isCurrent ? 1.0 : 0.4}
                                    stroke={entry.isCurrent ? '#fbbf24' : 'transparent'}
                                    strokeWidth={entry.isCurrent ? 1 : 0}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Progress Bars Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-white/5 mb-5">
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase mb-1">
                  <span className="text-[#c5a021]">🔥 Horde Morale</span>
                  <span className="text-white">{character.warriorMorale ?? 75}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300" 
                    style={{ width: `${character.warriorMorale ?? 75}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase mb-1">
                  <span className="text-[#c5a021]">🎯 Host Training</span>
                  <span className="text-white">{character.warriorTraining ?? 40}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-[#c5a021] transition-all duration-300" 
                    style={{ width: `${character.warriorTraining ?? 40}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Command Actions Grid */}
            <div className="space-y-2 pointer-events-auto">
              <div className="text-[10px] uppercase font-bold text-[#c5a021] tracking-widest mb-1">⚔️ Military Orders</div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <button
                  onClick={() => handleWarriorAction('Recruit')}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-white">⛺ Recruit Young Nomads</span>
                    <span className="text-[10px] font-black text-[#e5be42]">120г</span>
                  </div>
                  <p className="text-[10px] opacity-70 mt-1">Hire 30 specialized riders and archers to grow your permanent vanguard.</p>
                </button>

                <button
                  onClick={() => handleWarriorAction('Train')}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-white">🎯 Organize Fast Training</span>
                    <span className="text-[10px] font-black text-[#e5be42]">50г</span>
                  </div>
                  <p className="text-[10px] opacity-70 mt-1">Run horse-archery drills. (+15% training, raises personal combat stats).</p>
                </button>

                <button
                  onClick={() => handleWarriorAction('UpgradeGear')}
                  disabled={(character.warriorEquipmentLevel ?? 1) >= 5}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all flex flex-col justify-between disabled:opacity-40"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-white">🛡️ Upgrade Arsenal Gear</span>
                    <span className="text-[10px] font-black text-[#e5be42]">{character.warriorEquipmentLevel >= 5 ? "MAX" : "250г"}</span>
                  </div>
                  <p className="text-[10px] opacity-70 mt-1">Refit shields, bow sinews and sabers. (+20% power per level above 1).</p>
                </button>

                <button
                  onClick={() => handleWarriorAction('Feast')}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-white">🍖 Disburse War Feast</span>
                    <span className="text-[10px] font-black text-[#e5be42]">80г</span>
                  </div>
                  <p className="text-[10px] opacity-70 mt-1">Raise drinking horns to reward commanders. (+20% morale, raises happiness).</p>
                </button>
              </div>

              <button
                onClick={() => handleWarriorAction('Patrol')}
                className="w-full p-3 bg-gradient-to-r from-[#c5a021]/15 to-[#c59c21]/30 border border-[#c5a021]/40 hover:brightness-110 rounded-xl text-left transition-all flex justify-between items-center mt-2"
              >
                <div>
                  <div className="font-bold text-xs text-[#e5be42] flex items-center gap-1.5Packed">🐎 Dispatch Boundary Scouting Patrol</div>
                  <p className="text-[10px] opacity-80 text-white mt-1">Send scouts to sweep the meadows. Chance to seize livestock, gold, or face hostile skirmishes.</p>
                </div>
                <span className="text-xs font-black text-[#e5be42] shrink-0 bg-[#2b1d0e] px-2.5 py-1 rounded-lg border border-[#c5a021]/30">30г</span>
              </button>
            </div>
          </div>
        )}



       {/* Next Rank Hint */}
       {character && (
         <div className="bg-[#8b7355]/10 p-4 rounded-xl border border-[#8b7355]/20">
            <h5 className="text-[10px] uppercase font-bold text-[#5d4037] mb-2">📈 Next Rank Path</h5>
            {(() => {
              const role = character.role;
              let nextRole = "";
              let reqs: { label: string, met: boolean }[] = [];

              if (role === 'Child') {
                 nextRole = character.socialClass === SocialClass.WARRIOR ? 'Horseback Recruit' : 
                            character.socialClass === SocialClass.MERCHANT ? 'Apprentice Trader' :
                            character.socialClass === SocialClass.BLACKSMITH ? 'Apprentice Blacksmith' :
                            character.socialClass === SocialClass.NOBLE ? 'Kheshig Aspirant' : 'Nomad';
                 reqs = [{ label: `Age 15+`, met: character.age >= 15 }];
              } 
              // Military Path
              else if (role === 'Horseback Recruit') {
                 nextRole = 'Warrior';
                 reqs = [
                   { label: 'Strength 45+', met: character.stats.strength >= 45 },
                   { label: 'Archery 40+', met: character.stats.archery >= 40 }
                 ];
              } else if (role === 'Warrior') {
                 nextRole = 'Vanguard';
                 reqs = [
                   { label: 'Strength 60+', met: character.stats.strength >= 60 },
                   { label: 'Archery 60+', met: character.stats.archery >= 60 }
                 ];
              } else if (role === 'Vanguard') {
                 nextRole = 'Squad Leader (Arban)';
                 reqs = [{ label: 'Leadership 40+', met: character.stats.leadership >= 40 }];
              } else if (role === 'Squad Leader (Arban)') {
                 nextRole = 'Centurion (Zuun)';
                 reqs = [
                   { label: 'Leadership 60+', met: character.stats.leadership >= 60 },
                   { label: 'Reputation 50+', met: character.stats.reputation >= 50 }
                 ];
              } else if (role === 'Centurion (Zuun)') {
                 nextRole = 'Commander of Thousand (Mingghan)';
                 reqs = [
                   { label: 'Leadership 80+', met: character.stats.leadership >= 80 },
                   { label: 'Reputation 80+', met: character.stats.reputation >= 80 }
                 ];
              } else if (role === 'Commander of Thousand (Mingghan)') {
                 nextRole = 'General';
                 reqs = [
                   { label: 'Leadership 90+', met: character.stats.leadership >= 90 },
                   { label: 'Conquer 1 Tribe', met: character.conqueredTribes.length >= 1 }
                 ];
              } else if (role === 'General') {
                 nextRole = 'Warlord';
                 reqs = [{ label: 'Conquer 3 Tribes', met: character.conqueredTribes.length >= 3 }];
              }
              // Trade & Craft Path
              else if (role === 'Apprentice Blacksmith') {
                 nextRole = 'Journeyman Smith';
                 reqs = [
                   { label: 'Strength 50+', met: character.stats.strength >= 50 },
                   { label: 'Intelligence 40+', met: character.stats.intelligence >= 40 }
                 ];
              } else if (role === 'Journeyman Smith') {
                 nextRole = 'Master Smith or Bowyer';
                 reqs = [
                   { label: 'Master: Str 70+, Intel 60+', met: character.stats.strength >= 70 && character.stats.intelligence >= 60 },
                   { label: 'Bowyer: Arch 60+, Intel 50+', met: character.stats.archery >= 60 && character.stats.intelligence >= 50 }
                 ];
              } else if (role === 'Apprentice Bowyer') {
                 nextRole = 'Bowyer';
                 reqs = [
                   { label: 'Archery 75+', met: character.stats.archery >= 75 },
                   { label: 'Intelligence 60+', met: character.stats.intelligence >= 60 }
                 ];
              } else if (role === 'Bowyer') {
                 nextRole = 'Master Bowyer';
                 reqs = [
                   { label: 'Reputation 80+', met: character.stats.reputation >= 80 },
                   { label: 'Intelligence 80+', met: character.stats.intelligence >= 80 }
                 ];
              } else if (role === 'Master Bowyer') {
                 nextRole = 'Master of the Arsenal';
                 reqs = [{ label: 'Conquer 1 Tribe', met: character.conqueredTribes.length >= 1 }];
              } else if (role === 'Master Smith') {
                 nextRole = 'Royal Armorer';
                 reqs = [
                   { label: 'Reputation 80+', met: character.stats.reputation >= 80 },
                   { label: 'Wealth 5000+', met: character.stats.wealth >= 5000 }
                 ];
              } else if (role === 'Apprentice Trader') {
                 nextRole = 'Caravan Guard';
                 reqs = [{ label: 'Intelligence 50+', met: character.stats.intelligence >= 50 }];
              } else if (role === 'Caravan Guard') {
                 nextRole = 'Merchant';
                 reqs = [
                   { label: 'Intelligence 65+', met: character.stats.intelligence >= 65 },
                   { label: 'Wealth 500+', met: character.stats.wealth >= 500 }
                 ];
              } else if (role === 'Merchant') {
                 nextRole = 'Caravan Master';
                 reqs = [{ label: 'Wealth 2000+', met: character.stats.wealth >= 2000 }];
              } else if (role === 'Caravan Master') {
                 nextRole = 'Guild Master';
                 reqs = [{ label: 'Wealth 10000+', met: character.stats.wealth >= 10000 }];
              } else if (role === 'Guild Master') {
                 nextRole = 'Merchant Prince';
                 reqs = [{ label: 'Wealth 50000+', met: character.stats.wealth >= 50000 }];
              }
              // Diplomacy & Spy Paths
              else if (role === 'Clan Scout') {
                 nextRole = 'Envoy or Steppe Spy';
                 reqs = [
                   { label: 'Diplomacy: Intel 60+, Rep 40+', met: character.stats.intelligence >= 60 && character.stats.reputation >= 40 },
                   { label: 'Spy: Archery 60+, Intel 50+', met: character.stats.archery >= 60 && character.stats.intelligence >= 50 }
                 ];
              } else if (role === 'Envoy') {
                 nextRole = 'Imperial Emissary';
                 reqs = [
                   { label: 'Intelligence 75+', met: character.stats.intelligence >= 75 },
                   { label: 'Reputation 60+', met: character.stats.reputation >= 60 }
                 ];
              } else if (role === 'Imperial Emissary') {
                 nextRole = 'Ambassador';
                 reqs = [
                   { label: 'Intelligence 85+', met: character.stats.intelligence >= 85 },
                   { label: 'Leadership 70+', met: character.stats.leadership >= 70 }
                 ];
              } else if (role === 'Ambassador') {
                 nextRole = 'Grand Vizier';
                 reqs = [{ label: 'Conquer 2 Tribes', met: character.conqueredTribes.length >= 2 }];
              } else if (role === 'Steppe Spy') {
                 nextRole = 'Information Broker';
                 reqs = [
                   { label: 'Archery 75+', met: character.stats.archery >= 75 },
                   { label: 'Intelligence 70+', met: character.stats.intelligence >= 70 }
                 ];
              } else if (role === 'Information Broker') {
                 nextRole = 'Master of Whispers';
                 reqs = [
                   { label: 'Intelligence 90+', met: character.stats.intelligence >= 90 },
                   { label: 'Reputation 70+', met: character.stats.reputation >= 70 }
                 ];
              } else if (role === 'Master of Whispers') {
                 nextRole = 'Imperial Spymaster';
                 reqs = [{ label: 'Conquer 4 Tribes', met: character.conqueredTribes.length >= 4 }];
              }
              // Spiritual Path
              else if (role === 'Tengri-Seeker') {
                 nextRole = 'Shaman or Scribe';
                 reqs = [
                   { label: 'Shaman: Intel 70+', met: character.stats.intelligence >= 70 },
                   { label: 'Scribe: Social Class (Not Warrior)', met: character.socialClass !== SocialClass.WARRIOR }
                 ];
              } else if (role === 'Scribe') {
                 nextRole = 'Imperial Librarian';
                 reqs = [
                   { label: 'Intelligence 80+', met: character.stats.intelligence >= 80 },
                   { label: 'Wealth 1000+', met: character.stats.wealth >= 1000 }
                 ];
              } else if (role === 'Imperial Librarian') {
                 nextRole = 'Imperial Scholar';
                 reqs = [
                   { label: 'Intelligence 90+', met: character.stats.intelligence >= 90 },
                   { label: 'Reputation 60+', met: character.stats.reputation >= 60 }
                 ];
              } else if (role === 'Imperial Scholar') {
                 nextRole = 'Grand Historian';
                 reqs = [
                   { label: 'Reputation 90+', met: character.stats.reputation >= 90 },
                   { label: 'Age 50+', met: character.age >= 50 }
                 ];
              } 
              // Engineering Path
              else if (role === 'Apprentice Builder') {
                 nextRole = 'Siege Engineer';
                 reqs = [{ label: 'Intelligence 75+', met: character.stats.intelligence >= 75 }];
              } else if (role === 'Siege Engineer') {
                 nextRole = 'Master Architect';
                 reqs = [
                   { label: 'Intelligence 85+', met: character.stats.intelligence >= 85 },
                   { label: 'Reputation 50+', met: character.stats.reputation >= 50 }
                 ];
              } else if (role === 'Master Architect') {
                 nextRole = 'Imperial Engineer';
                 reqs = [
                   { label: 'Intelligence 95+', met: character.stats.intelligence >= 95 },
                   { label: 'Conquer 3 Tribes', met: character.conqueredTribes.length >= 3 }
                 ];
              }
              // Administration Path
              else if (role === 'Tax Collector') {
                 nextRole = 'District Overseer (Darughachi)';
                 reqs = [
                   { label: 'Reputation 60+', met: character.stats.reputation >= 60 },
                   { label: 'Intelligence 80+', met: character.stats.intelligence >= 80 }
                 ];
              } else if (role === 'District Overseer (Darughachi)') {
                 nextRole = 'Imperial Chancellor';
                 reqs = [
                   { label: 'Leadership 90+', met: character.stats.leadership >= 90 },
                   { label: 'Conquer 6 Tribes', met: character.conqueredTribes.length >= 6 }
                 ];
              }
              // Maritime Path
              else if (role === 'River Boatman') {
                 nextRole = 'Coastal Scout';
                 reqs = [
                   { label: 'Riding 50+', met: character.stats.horseRiding >= 50 },
                   { label: 'Intelligence 60+', met: character.stats.intelligence >= 60 }
                 ];
              } else if (role === 'Coastal Scout') {
                 nextRole = 'Fleet Commander';
                 reqs = [
                   { label: 'Leadership 70+', met: character.stats.leadership >= 70 },
                   { label: 'Conquer 1 Tribe', met: character.conqueredTribes.length >= 1 }
                 ];
              } else if (role === 'Fleet Commander') {
                 nextRole = 'Admiral';
                 reqs = [
                   { label: 'Reputation 90+', met: character.stats.reputation >= 90 },
                   { label: 'Conquer 4 Tribes', met: character.conqueredTribes.length >= 4 }
                 ];
              }
              // Artisan & Treasury Path
              else if (role === 'Apprentice Jeweler') {
                 nextRole = 'Jade Carver';
                 reqs = [{ label: 'Intelligence 75+', met: character.stats.intelligence >= 75 }];
              } else if (role === 'Jade Carver') {
                 nextRole = 'Master Artisan';
                 reqs = [
                   { label: 'Wealth 5000+', met: character.stats.wealth >= 5000 },
                   { label: 'Reputation 60+', met: character.stats.reputation >= 60 }
                 ];
              } else if (role === 'Master Artisan') {
                 nextRole = 'Keeper of the Treasury';
                 reqs = [
                   { label: 'Intelligence 90+', met: character.stats.intelligence >= 90 },
                   { label: 'Wealth 20000+', met: character.stats.wealth >= 20000 }
                 ];
              }
              // Falconry Path
              else if (role === 'Bird-Catcher') {
                 nextRole = 'Falconer';
                 reqs = [{ label: 'Archery 80+', met: character.stats.archery >= 80 }];
              } else if (role === 'Falconer') {
                 nextRole = 'Master of the Hunt';
                 reqs = [
                   { label: 'Reputation 70+', met: character.stats.reputation >= 70 },
                   { label: 'Leadership 50+', met: character.stats.leadership >= 50 }
                 ];
              } else if (role === 'Master of the Hunt') {
                 nextRole = 'Imperial Falconer';
                 reqs = [
                   { label: 'Reputation 90+', met: character.stats.reputation >= 90 },
                   { label: 'Conquer 2 Tribes', met: character.conqueredTribes.length >= 2 }
                 ];
              }
              // Equerry Path
              else if (role === 'Apprentice Groom') {
                 nextRole = 'Horse Breaker';
                 reqs = [{ label: 'Riding 75+', met: character.stats.horseRiding >= 75 }];
              } else if (role === 'Horse Breaker') {
                 nextRole = 'Stable Master';
                 reqs = [
                   { label: 'Riding 85+', met: character.stats.horseRiding >= 85 },
                   { label: 'Leadership 60+', met: character.stats.leadership >= 60 }
                 ];
              } else if (role === 'Stable Master') {
                 nextRole = 'Sa\'is (Imperial Equerry)';
                 reqs = [
                   { label: 'Reputation 90+', met: character.stats.reputation >= 90 },
                   { label: 'Conquer 1 Tribe', met: character.conqueredTribes.length >= 1 }
                 ];
              }
              else if (role === 'Shaman') {
                 nextRole = 'Tribal Healer';
                 reqs = [{ label: 'Reputation 60+', met: character.stats.reputation >= 60 }];
              } else if (role === 'Tribal Healer') {
                 nextRole = 'Sage';
                 reqs = [{ label: 'Intelligence 90+', met: character.stats.intelligence >= 90 }];
              } else if (role === 'Sage') {
                 nextRole = 'High Shaman';
                 reqs = [{ label: 'Reputation 90+', met: character.stats.reputation >= 90 }];
              } else if (role === 'High Shaman') {
                 nextRole = 'Oracle of the Eternal Sky';
                 reqs = [{ label: 'Conquer 5 Tribes', met: character.conqueredTribes.length >= 5 }];
              }
              // Civil Path
              else if (role === 'Nomad') {
                 nextRole = 'Herder or Clan Scout';
                 reqs = [{ label: 'Strength 40+ or Riding 60+', met: character.stats.strength >= 40 || character.stats.horseRiding >= 60 }];
              }

              if (!nextRole) return <div className="text-xs italic opacity-60 text-[#5d4037]">You have reached a peak rank or follow a specialized path.</div>;
              
              const roles = nextRole.split(' or ');
              const canPromote = (targetRole: string) => {
                const s = character.stats;
                if (nextRole === 'Master Smith or Bowyer') {
                  if (targetRole === 'Master Smith') return (s.strength || 0) >= 70 && (s.intelligence || 0) >= 60;
                  if (targetRole === 'Bowyer') return (s.archery || 0) >= 60 && (s.intelligence || 0) >= 50;
                }
                if (nextRole === 'Envoy or Steppe Spy') {
                  if (targetRole === 'Envoy') return (s.intelligence || 0) >= 60 && (s.reputation || 0) >= 40;
                  if (targetRole === 'Steppe Spy') return (s.archery || 0) >= 60 && (s.intelligence || 0) >= 50;
                }
                if (nextRole === 'Shaman or Scribe') {
                  if (targetRole === 'Shaman') return (s.intelligence || 0) >= 70;
                  if (targetRole === 'Scribe') return character.socialClass !== SocialClass.WARRIOR;
                }
                if (nextRole === 'Herder or Clan Scout') {
                   return (s.strength || 0) >= 40 || (s.horseRiding || 0) >= 60;
                }
                return reqs.every(r => r.met);
              };

              return (
                <div className="text-xs text-[#2b1d0e]">
                   To become a <span className="font-bold">{nextRole}</span>: 
                   <ul className="list-disc ml-4 mt-1 opacity-80 mb-3">
                     {reqs.map((r, i) => (
                       <li key={i} className={r.met ? 'text-green-800 font-bold' : ''}>{r.label}</li>
                     ))}
                   </ul>
                   <div className="flex flex-col gap-2 mt-3">
                     {character.lastPromotionAge === character.age ? (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl font-semibold text-center text-[11px]">
                          <div>🔒 Та энэ насандаа/жилдээ тушаал дэвшсэн байна. Дараагийн жил хүртэл дахин дэвших боломжгүй.</div>
                          <div className="text-[10px] font-normal opacity-70 mt-1">(You have already promoted this year. Wait until next year.)</div>
                        </div>
                      ) : roles.map(r => (
                       <button
                         key={r}
                         onClick={() => handlePromotion(r)}
                         disabled={!canPromote(r)}
                         className="w-full py-2 bg-[#c57d21] text-white rounded-lg font-bold hover:bg-[#a0651a] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#c57d21]/20"
                       >
                         <TrendingUp size={14} /> Promote to {r}
                       </button>
                     ))}
                   </div>
                </div>
              );
            })()}
         </div>
       )}

       {/* Clan Treasury Section */}
       <div className="bg-[#2b1d0e] text-[#e8dab2] p-6 rounded-2xl border-2 border-[#c5a021] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins size={80} />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] uppercase font-bold text-[#c5a021] mb-1 tracking-widest">💰 Clan Treasury</div>
            <div className="text-4xl font-display flex items-center gap-2">
              <Coins size={32} className="text-[#c5a021]" />
              {Number.isNaN(Number(character?.clanWealth)) ? 0 : Math.floor(character?.clanWealth || 0)}
            </div>
            <div className="text-[10px] opacity-60 mt-1 uppercase">Collective Wealth of the {character?.clan}</div>
            
            <div className="mt-6 flex flex-col gap-2">
               <button 
                onClick={() => handleClanAction('Contribute')}
                disabled={(character?.stats.wealth || 0) < 100}
                className="w-full py-3 px-4 bg-[#e8dab2] text-[#2b1d0e] rounded-xl font-bold text-xs flex justify-between items-center hover:bg-white transition-all disabled:opacity-50"
               >
                 <span>💰 Contribute (100г)</span>
                 <span className="text-[10px] opacity-60">+REPUTATION / +LOYALTY</span>
               </button>
            </div>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-3">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#5d4037]">🏗️ Clan Investments</h4>
          <button 
            onClick={() => handleClanAction('Invest-Feast')}
            disabled={(character?.clanWealth || 0) < 500}
            className="w-full p-4 bg-white/40 border border-[#8b7355]/20 rounded-xl text-left hover:bg-white/60 transition-all disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm">🍖 Local Feast</span>
              <span className="text-[10px] font-bold text-[#c57d21]">500г</span>
            </div>
            <p className="text-[10px] opacity-70">A small gathering to boost spirits and local loyalty.</p>
          </button>

          <button 
            onClick={() => handleClanAction('Tribal-Feast')}
            disabled={(character?.clanWealth || 0) < 1200}
            className="w-full p-4 bg-[#e8dab2]/80 border-2 border-[#8b7355] rounded-xl text-left hover:brightness-105 transition-all disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm text-[#2b1d0e]">🔥 Grand Tribal Feast</span>
              <span className="text-[10px] font-bold text-[#c57d21]">1200г</span>
            </div>
            <p className="text-[10px] text-[#2b1d0e]/80">A significant event for the entire clan. Major boost to resource morale, loyalty, and your standing.</p>
          </button>

          <button 
            onClick={() => handleClanAction('Great-Naadam')}
            disabled={(character?.clanWealth || 0) < 2500}
            className="w-full p-4 bg-[#1a120b] border-2 border-[#c5a021] rounded-xl text-left hover:brightness-125 transition-all disabled:opacity-50 group"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm text-[#c5a021] flex items-center gap-2">
                 <Sparkles size={14} />
                 🔥 Convene Great Naadam
              </span>
              <span className="text-[10px] font-bold text-[#c5a021]">2500г</span>
            </div>
            <p className="text-[10px] text-[#e8dab2]/70">The ultimate tribal event. Massive boost to reputation, leadership, and total clan loyalty.</p>
          </button>

          <button 
            onClick={() => handleClanAction('Invest-Guard')}
            disabled={(character?.clanWealth || 0) < 300}
            className="w-full p-4 bg-white/40 border border-[#8b7355]/20 rounded-xl text-left hover:bg-white/60 transition-all disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm">🛡️ Upgrade Camp Security</span>
              <span className="text-[10px] font-bold text-[#c57d21]">300г</span>
            </div>
            <p className="text-[10px] opacity-70">Hire Kheshig for the elders. Increases health and leadership.</p>
          </button>

          <button 
            onClick={() => handleClanAction('Invest-Stock')}
            disabled={(character?.clanWealth || 0) < 1000}
            className="w-full p-4 bg-white/40 border border-[#8b7355]/20 rounded-xl text-left hover:bg-white/60 transition-all disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm">🐎 Collective Herds Investment</span>
              <span className="text-[10px] font-bold text-[#c57d21]">1000г</span>
            </div>
            <p className="text-[10px] opacity-70">Long-term economic growth. Improves personal returns and general prosperity.</p>
          </button>

          <button 
            onClick={handleConveneCouncil}
            disabled={getCouncilMembers().length === 0 || (character?.lastCouncilYear && worldState.year - character.lastCouncilYear < 3)}
            className="w-full p-4 bg-[#2b1d0e] border border-[#c5a021] rounded-xl text-left hover:brightness-110 transition-all disabled:opacity-50 group"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-sm text-[#e8dab2] flex items-center gap-2">
                <Users size={16} />
                🗣️ Convene Clan Council
              </span>
              {character?.lastCouncilYear && worldState.year - character.lastCouncilYear < 3 && (
                <span className="text-[10px] font-bold text-[#c5a021]">Wait {3 - (worldState.year - character.lastCouncilYear)}y</span>
              )}
            </div>
            <p className="text-[10px] text-[#e8dab2]/70">Gather your most trusted kin and warriors to decide on major tribal matters.</p>
          </button>
       </div>

       {/* ⛩️ Steppe Vocation Center */}
       <div id="vocation-center-card" className="bg-[#1f150c] text-[#e8dab2] p-6 rounded-2xl border-2 border-[#c5a021] shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Briefcase size={120} />
          </div>

          <div className="flex items-center gap-2">
            <Briefcase size={22} className="text-[#e5be42]" />
            <div>
              <h3 className="text-lg font-display text-[#e5be42] font-semibold uppercase tracking-wider">Steppe Vocation Center</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#c5a021] font-bold">Professional Paths and Duties</p>
            </div>
          </div>

          {/* Current Active Duty Card */}
          {(() => {
             const activeCharBranch = CAREER_BRANCHES.find(b => b.roles.some(r => r.name === character?.role));
             if (!activeCharBranch) return null;

             const renderBranchIcon = (iconName: string, size = 18) => {
               if (iconName === 'Sword') return <Sword size={size} className="text-[#c5a021]" />;
               if (iconName === 'Shield') return <Shield size={size} className="text-[#c5a021]" />;
               if (iconName === 'Utensils') return <Utensils size={size} className="text-[#c5a021]" />;
               if (iconName === 'Briefcase') return <Briefcase size={size} className="text-[#c5a021]" />;
               if (iconName === 'Coins') return <Coins size={size} className="text-[#c5a021]" />;
               if (iconName === 'ScrollText') return <ScrollText size={size} className="text-[#c5a021]" />;
               if (iconName === 'Users') return <Users size={size} className="text-[#c5a021]" />;
               if (iconName === 'Bird') return <Bird size={size} className="text-[#c5a021]" />;
               if (iconName === 'Sparkles') return <Sparkles size={size} className="text-[#c5a021]" />;
               return <Briefcase size={size} className="text-[#c5a021]" />;
             };

             return (
               <div className="bg-yellow-900/10 border border-yellow-700/30 p-4 rounded-xl space-y-3">
                 <div className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-1.5 font-bold text-[#e5be42]">
                     {renderBranchIcon(activeCharBranch.icon, 16)}
                     <span>Active Vocation: {activeCharBranch.name}</span>
                   </div>
                   <span className="text-[10px] text-[#c5a021] px-2 py-0.5 bg-black/40 rounded-full font-bold">
                     Current Rank: {character?.role}
                   </span>
                 </div>

                 <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1.5">
                   <div className="flex justify-between items-center">
                     <span className="font-bold text-xs text-white">{activeCharBranch.action.name}</span>
                     <span className="text-xs font-black text-[#e5be42]">{activeCharBranch.action.cost}г</span>
                   </div>
                   <p className="text-[11px] opacity-85 leading-relaxed">
                     {activeCharBranch.action.desc}
                   </p>
                   <div className="text-[10px] text-[#c5a021] flex flex-wrap gap-x-2 italic pt-1">
                     <span>Yields:</span>
                     {Object.entries(activeCharBranch.action.effects).map(([stat, val]) => (
                       <span key={stat} className="font-semibold">+{val}% {stat}</span>
                     ))}
                     {activeCharBranch.id === 'Nomad' && <span className="font-semibold text-green-400">(+Chance to get sheep)</span>}
                     {activeCharBranch.id === 'Trade' && <span className="font-semibold text-green-400">(+Chance to earn bonus gold)</span>}
                     {activeCharBranch.id === 'Equerry' && <span className="font-semibold text-green-400">(+Chance to tame horses)</span>}
                     {activeCharBranch.id === 'Crafts' && <span className="font-semibold text-green-400">(+Chance to forge daggers)</span>}
                     {activeCharBranch.id === 'Falconry' && <span className="font-semibold text-green-400">(+Chance to hunt furs)</span>}
                     {activeCharBranch.id === 'Spiritual' && <span className="font-semibold text-green-100">(+Chance to heal health)</span>}
                   </div>
                 </div>

                 <button
                   onClick={() => handleCareerAction(activeCharBranch.id)}
                   disabled={(character?.stats.wealth || 0) < activeCharBranch.action.cost}
                   className="w-full py-2 bg-gradient-to-r from-yellow-700/40 to-yellow-600/40 hover:from-yellow-700/60 hover:to-yellow-600/60 border border-yellow-600/40 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
                 >
                   Perform Active Duty
                 </button>
               </div>
             );
          })()}

          {/* Vocation Directory Tabs Grid */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#c5a021]">Browse Career Fields</label>
            <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-yellow-700">
              {CAREER_BRANCHES.map(branch => {
                const isActive = selectedCareerBranch === branch.id;
                const isUserInBranch = branch.roles.some(r => r.name === character?.role);

                const renderBranchIcon = (iconName: string, size = 13) => {
                  if (iconName === 'Sword') return <Sword size={size} />;
                  if (iconName === 'Shield') return <Shield size={size} />;
                  if (iconName === 'Utensils') return <Utensils size={size} />;
                  if (iconName === 'Briefcase') return <Briefcase size={size} />;
                  if (iconName === 'Coins') return <Coins size={size} />;
                  if (iconName === 'ScrollText') return <ScrollText size={size} />;
                  if (iconName === 'Users') return <Users size={size} />;
                  if (iconName === 'Bird') return <Bird size={size} />;
                  if (iconName === 'Sparkles') return <Sparkles size={size} />;
                  return <Briefcase size={size} />;
                };

                return (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedCareerBranch(branch.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#c5a021] text-[#1a120b] border-[#c09400] scale-95 shadow-md shadow-[#c5a021]/15'
                        : isUserInBranch
                          ? 'bg-yellow-950/45 text-[#c5a021] border-yellow-600/40'
                          : 'bg-black/35 text-white/70 border-white/5 hover:bg-black/55'
                    }`}
                  >
                    {renderBranchIcon(branch.icon, 13)}
                    <span>{branch.name.split(' ').slice(1).join(' ') || branch.name}</span>
                    {isUserInBranch && <span className="w-1.5 h-1.5 rounded-full bg-[#c5a021]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Vocation Detailed Card */}
          {(() => {
             const branch = CAREER_BRANCHES.find(b => b.id === selectedCareerBranch);
             if (!branch) return null;

             const isUserInThisBranch = branch.roles.some(r => r.name === character?.role);

             const renderBranchIcon = (iconName: string, size = 18) => {
               if (iconName === 'Sword') return <Sword size={size} className="text-[#c5a021]" />;
               if (iconName === 'Shield') return <Shield size={size} className="text-[#c5a021]" />;
               if (iconName === 'Utensils') return <Utensils size={size} className="text-[#c5a021]" />;
               if (iconName === 'Briefcase') return <Briefcase size={size} className="text-[#c5a021]" />;
               if (iconName === 'Coins') return <Coins size={size} className="text-[#c5a021]" />;
               if (iconName === 'ScrollText') return <ScrollText size={size} className="text-[#c5a021]" />;
               if (iconName === 'Users') return <Users size={size} className="text-[#c5a021]" />;
               if (iconName === 'Bird') return <Bird size={size} className="text-[#c5a021]" />;
               if (iconName === 'Sparkles') return <Sparkles size={size} className="text-[#c5a021]" />;
               return <Briefcase size={size} className="text-[#c5a021]" />;
             };

             return (
               <div className="bg-[#120a05] p-4 rounded-xl border border-white/5 space-y-4">
                 <div className="space-y-1">
                   <h4 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
                     {renderBranchIcon(branch.icon, 18)}
                     {branch.name}
                   </h4>
                   <p className="text-[11px] opacity-75 leading-relaxed italic text-amber-100/70">
                     "{branch.description}"
                   </p>
                 </div>

                 {/* Promotion ladder */}
                 <div className="space-y-2">
                   <div className="text-[10px] uppercase font-bold tracking-widest text-[#c5a021]">Promotion Ladder & Compensation</div>
                   <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                     {branch.roles.map((role, idx) => {
                       const isUsersCurrent = character?.role === role.name;
                       return (
                         <div
                           key={idx}
                           className={`p-2 rounded-lg flex items-center justify-between text-xs transition-all border ${
                             isUsersCurrent
                               ? 'bg-gradient-to-r from-yellow-905/30 to-black/35 border-[#c5a021] text-[#e5be42]'
                               : 'bg-black/25 border-white/5 opacity-80 text-white'
                           }`}
                         >
                           <div className="space-y-0.5">
                             <div className="flex items-center gap-1 font-bold">
                               {isUsersCurrent && <Sparkles size={11} className="text-[#c5a021]" />}
                               <span>{role.name}</span>
                             </div>
                             <div className="text-[10px] opacity-60">Reqs: {role.reqs}</div>
                           </div>
                           <div className="text-right">
                             <div className="font-bold text-[#c5a021]">{role.salary}г</div>
                             <div className="text-[9px] opacity-50">annual check</div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Entry/Switch Path controls */}
                 <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                   <div className="text-left">
                     <div className="text-[10px] uppercase font-bold text-[#c5a021]">Retrain in this vocation</div>
                     <p className="text-[10px] opacity-65">Enter at starting grade: <strong className="text-white">{branch.entryRole}</strong></p>
                   </div>
                   <button
                     disabled={isUserInThisBranch || (character?.age || 0) < 15}
                     onClick={() => handleSwitchPath(branch.id, branch.entryRole)}
                     className="px-4 py-2 bg-yellow-950/45 hover:bg-yellow-950/70 border border-yellow-600/30 text-[#e5be42] text-xs font-bold rounded-lg disabled:opacity-30 disabled:hover:bg-yellow-950/45 transition-all"
                   >
                     {isUserInThisBranch 
                       ? "Already Enrolled" 
                       : (character?.age || 0) < 15 
                         ? "Requires Age 15+" 
                         : "Retrain (100г)"}
                   </button>
                 </div>
               </div>
             );
          })()}
       </div>
    </div>
  );

  if (showIntro) {
    const hasSave = localStorage.getItem("steppe_nomad_save") !== null;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#1a0f05]">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 steppe-bg opacity-40 scale-110 animate-slow-zoom" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f05]/90 via-transparent to-[#1a0f05]" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-radial from-[#c5a021]/10 to-transparent pointer-events-none" />
        
        {/* Dust Particles Effect (CSS only) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: Math.random() * 100 + "%", y: "110%", opacity: 0 }}
              animate={{ 
                y: "-10%", 
                opacity: [0, 0.5, 0],
                x: (Math.random() * 100 - 50) + "%"
              }}
              transition={{ 
                duration: Math.random() * 10 + 10, 
                repeat: Infinity,
                delay: Math.random() * 20
              }}
              className="absolute w-1 h-1 bg-[#c5a021] rounded-full blur-[1px]"
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {activeTab === Tab.SETTINGS || activeTab === Tab.HERITAGE ? (
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col min-h-0"
             >
                <div className="flex justify-between items-center mb-6 parchment-texture p-5 rounded-2xl border-4 border-[#c5a021] shadow-2xl shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#2b1d0e] rounded-lg text-[#c5a021]">
                         {activeTab === Tab.SETTINGS ? <Wand2 size={24} /> : <Trophy size={24} />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-display text-[#2b1d0e] tracking-tight uppercase leading-none">
                          {activeTab === Tab.SETTINGS ? 'Game Settings' : 'Hall of Heroes'}
                        </h2>
                        <p className="text-[10px] font-bold text-[#c57d21] uppercase tracking-widest mt-1 opacity-70">
                          {activeTab === Tab.SETTINGS ? 'Configure your experience' : 'Legacies of the Great Khans'}
                        </p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setActiveTab(Tab.LIFE)}
                    className="px-6 py-2 bg-[#2b1d0e] text-[#e8dab2] rounded-xl font-bold uppercase text-xs hover:bg-black transition-all border border-[#c5a021]/30 active:scale-95"
                   >
                     Back to Menu
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-10">
                   {activeTab === Tab.SETTINGS ? renderSettings() : renderHallOfFame()}
                </div>
             </motion.div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-4 flex flex-col items-center justify-center min-h-0">
              <div className="text-center mb-12 w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1, type: "spring" }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-[#c5a021]/10 border-2 border-[#c5a021]/30">
                      <WarIcon size={48} className="text-[#c5a021]" />
                    </div>
                  </div>
                  <h1 className="text-7xl md:text-8xl font-display text-[#e8dab2] tracking-tighter mb-2 drop-shadow-2xl">
                    STEPPE LEGACY
                  </h1>
                  <div className="flex items-center justify-center gap-4 text-[#c5a021] font-display text-xl tracking-[0.3em] uppercase">
                    <span className="h-[1px] w-12 bg-[#c5a021]/50" />
                    Great Khan
                    <span className="h-[1px] w-12 bg-[#c5a021]/50" />
                  </div>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center w-full max-w-4xl mx-auto">
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="parchment-texture p-8 rounded-2xl border-4 border-[#8b7355] shadow-2xl relative"
                >
                  <div className="absolute -top-4 -left-4">
                    <ScrollText size={32} className="text-[#8b7355]" />
                  </div>
                  <p className="text-lg font-serif text-[#2b1d0e] leading-relaxed italic mb-6">
                    "Under the Eternal Blue Sky, the tribes were scattered like leaves in the wind. Then came the one who would bind them into an iron fist that shook the world..."
                  </p>
                  <div className="text-sm border-t border-[#8b7355]/20 pt-4 text-[#5d4037] font-medium opacity-80">
                    A historical simulation of the 13th century Mongol conquests. Rise from exile to conquer a world.
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="flex flex-col gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowIntro(false); setIsCreatingCharacter(true); }}
                    className="group relative px-8 py-5 bg-[#c5a021] hover:bg-[#d4ae2f] text-[#2b1d0e] rounded-xl border-b-4 border-[#a07c1a] flex items-center justify-between transition-all font-display"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#2b1d0e] p-2 rounded-lg text-[#c5a021]">
                        <Sparkles size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-lg uppercase tracking-tight">Begin New Saga</div>
                        <div className="text-[10px] uppercase font-bold opacity-70">Start from a simple nomad</div>
                      </div>
                    </div>
                    <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const saved = localStorage.getItem("steppe_nomad_save");
                      if (saved) {
                        handleLoad();
                        setShowIntro(false);
                      } else {
                        alert("No saved saga found on your device.");
                      }
                    }}
                    disabled={!hasSave}
                    className={`group px-8 py-5 rounded-xl border-2 flex items-center justify-between transition-all ${
                      hasSave 
                        ? "bg-[#2b1d0e] border-[#c5a021]/50 text-[#e8dab2] hover:bg-black" 
                        : "bg-white/5 border-white/10 text-white/20 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${hasSave ? "bg-[#c5a021]/20 text-[#c5a021]" : "bg-white/5"}`}>
                        <History size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-display uppercase tracking-tight">Resume Journey</div>
                        <div className="text-[10px] uppercase font-bold opacity-70 font-sans">
                          {hasSave ? "Continue your recorded history" : "No recorded history found"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                  </motion.button>

                  <div className="flex gap-4 mt-2">
                    <button 
                      onClick={() => setActiveTab(Tab.SETTINGS)}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white/70 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Briefcase size={14} /> Settings
                    </button>
                    <button 
                      onClick={() => setActiveTab(Tab.HERITAGE)}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white/70 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Trophy size={14} /> Hall of Fame
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-16 text-center text-[#e8dab2]/30 text-[10px] uppercase tracking-[0.5em] shrink-0 pb-4"
              >
                © 1206 - 2026 Steppe Legacy Production
              </motion.div>
            </div>

          )}
        </motion.div>
      </div>
    );
  }

  if (isCreatingCharacter) {
    const names = creationData.gender === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
    
    return (
      <div className="min-h-screen flex items-center justify-center steppe-bg p-4 relative overflow-hidden bg-[#1a0f05]">
        <div className="absolute inset-0 bg-[#1a0f05]/90 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#c5a021]/5 to-transparent pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 parchment-texture p-8 rounded-2xl max-w-xl w-full border-4 border-[#c5a021] shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="text-center">
            <h2 className="text-3xl font-display text-[#2b1d0e] uppercase tracking-tighter">🏹 Character Creation</h2>
            <p className="text-xs text-[#5d4037] opacity-60 uppercase font-bold mt-1 tracking-widest">Forge your destiny</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-28 h-28 rounded-2xl bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow shadow-2xl">
                 <img 
                    src={getNomadAvatar(creationData.name || 'default', creationData.gender, creationData.clan, 18, creationData.appearanceOptions, creationData.socialClass)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                 />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1 ml-1">Hero Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={creationData.name}
                  onChange={(e) => setCreationData({ ...creationData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="flex-1 bg-white/50 border-2 border-[#8b7355]/20 rounded-xl px-4 py-3 text-[#2b1d0e] font-bold focus:outline-none focus:border-[#c5a021] transition-all"
                />
                <button 
                  onClick={() => {
                    const randomName = names[Math.floor(Math.random() * names.length)];
                    setCreationData({ ...creationData, name: randomName });
                  }}
                  className="p-3 bg-[#2b1d0e] text-[#e8dab2] rounded-xl hover:bg-black transition-colors"
                  title="Random Name"
                >
                  <Wand2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1 ml-1">Gender</label>
                <div className="flex gap-1 p-1 bg-white/30 rounded-xl border border-[#8b7355]/20">
                  {Object.values(Gender).map(g => (
                    <button
                      key={g}
                      onClick={() => setCreationData({ ...creationData, gender: g })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${creationData.gender === g ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-md' : 'text-[#5d4037] hover:bg-white/40'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1 ml-1">Social Class</label>
                <select 
                  value={creationData.socialClass}
                  onChange={(e) => setCreationData({ ...creationData, socialClass: e.target.value as SocialClass })}
                  className="w-full bg-white/50 border-2 border-[#8b7355]/20 rounded-xl px-4 py-2.5 text-[#2b1d0e] font-bold appearance-none focus:outline-none focus:border-[#c5a021]"
                >
                  {Object.values(SocialClass).map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1 ml-1">Tribe</label>
                <select 
                  value={creationData.tribe}
                  onChange={(e) => setCreationData({ ...creationData, tribe: e.target.value })}
                  className="w-full bg-white/50 border-2 border-[#8b7355]/20 rounded-xl px-4 py-2.5 text-[#2b1d0e] font-bold appearance-none focus:outline-none focus:border-[#c5a021]"
                >
                  {TRIBES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1 ml-1">Clan</label>
                <select 
                  value={creationData.clan}
                  onChange={(e) => setCreationData({ ...creationData, clan: e.target.value })}
                  className="w-full bg-white/50 border-2 border-[#8b7355]/20 rounded-xl px-4 py-2.5 text-[#2b1d0e] font-bold appearance-none focus:outline-none focus:border-[#c5a021]"
                >
                  {MONGOL_SURNAMES.map(c => (
                    <option key={c} value={c}>{c} Clan</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Customization */}
            <div className="pt-4 border-t border-[#8b7355]/10 space-y-4">
              <h3 className="text-xs uppercase font-bold text-[#c57d21] tracking-widest text-center">Visual Appearance</h3>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-bold text-[#5d4037] mb-1">Hair Color</label>
                  <select 
                    value={creationData.appearanceOptions.hairColor}
                    onChange={(e) => setCreationData({ 
                      ...creationData, 
                      appearanceOptions: { ...creationData.appearanceOptions, hairColor: e.target.value }
                    })}
                    className="w-full bg-white/30 border border-[#8b7355]/20 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c5a021]"
                  >
                    {APPEARANCE_HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-[#5d4037] mb-1">Eye Color</label>
                  <select 
                    value={creationData.appearanceOptions.eyeColor}
                    onChange={(e) => setCreationData({ 
                      ...creationData, 
                      appearanceOptions: { ...creationData.appearanceOptions, eyeColor: e.target.value }
                    })}
                    className="w-full bg-white/30 border border-[#8b7355]/20 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c5a021]"
                  >
                    {APPEARANCE_EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-[#5d4037] mb-1">Build</label>
                  <select 
                    value={creationData.appearanceOptions.build}
                    onChange={(e) => setCreationData({ 
                      ...creationData, 
                      appearanceOptions: { ...creationData.appearanceOptions, build: e.target.value as any }
                    })}
                    className="w-full bg-white/30 border border-[#8b7355]/20 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c5a021]"
                  >
                    {['Slender', 'Athletic', 'Robust', 'Towering'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Starting Traits */}
            <div className="pt-4 border-t border-[#8b7355]/10 space-y-2">
              <h3 className="text-xs uppercase font-bold text-[#c57d21] tracking-widest text-center">Starting Traits (Select 2)</h3>
              <div className="grid grid-cols-2 gap-2">
                {STARTING_TRAITS.map(trait => {
                  const isSelected = creationData.traits.includes(trait.id);
                  return (
                    <button
                      key={trait.id}
                      onClick={() => {
                        if (isSelected) {
                          setCreationData({ ...creationData, traits: creationData.traits.filter(id => id !== trait.id) });
                        } else if (creationData.traits.length < 2) {
                          setCreationData({ ...creationData, traits: [...creationData.traits, trait.id] });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-[#2b1d0e] border-[#c5a021] shadow-md' 
                          : 'bg-white/30 border-[#8b7355]/20 hover:bg-white/50'
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-tight ${isSelected ? 'text-[#c5a021]' : 'text-[#2b1d0e]'}`}>
                        {trait.name}
                      </div>
                      <div className={`text-[8px] leading-tight ${isSelected ? 'text-white/60' : 'text-[#5d4037]/60'}`}>
                        {trait.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-[#2b1d0e]/5 border border-[#8b7355]/10 rounded-xl">
             <h3 className="text-[10px] uppercase font-bold text-[#c57d21] mb-2 tracking-widest text-center">Class Characteristics</h3>
             <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-[#5d4037]">
                <div className="flex justify-between border-b border-[#8b7355]/10 pb-1">
                  <span>Starting Wealth</span>
                  <span className="font-bold">{INITIAL_STATS[creationData.socialClass].wealth}г</span>
                </div>
                <div className="flex justify-between border-b border-[#8b7355]/10 pb-1">
                   <span>Initial Leadership</span>
                   <span className="font-bold">{INITIAL_STATS[creationData.socialClass].leadership}</span>
                </div>
                <div className="flex justify-between border-b border-[#8b7355]/10 pb-1">
                   <span>Physical Strength</span>
                   <span className="font-bold">{INITIAL_STATS[creationData.socialClass].strength}</span>
                </div>
                <div className="flex justify-between border-b border-[#8b7355]/10 pb-1">
                   <span>Tardiness/Archery</span>
                   <span className="font-bold">{INITIAL_STATS[creationData.socialClass].archery}</span>
                </div>
             </div>
          </div>

          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => {
                setIsCreatingCharacter(false);
                setShowIntro(true);
              }}
              className="flex-1 py-4 border-2 border-[#8b7355] text-[#8b7355] font-display rounded-xl hover:bg-[#8b7355]/10 transition-all uppercase tracking-widest text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (!creationData.name) {
                  const randomName = names[Math.floor(Math.random() * names.length)];
                  startNewLife(undefined, { ...creationData, name: randomName });
                } else {
                  startNewLife(undefined, creationData);
                }
              }}
              className="flex-2 py-4 bg-[#2b1d0e] text-[#e8dab2] border-2 border-[#c5a021] font-display rounded-xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              <Sparkles size={18} className="text-[#c5a021]" />
              Start Saga
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-[#1a0f05] flex items-center justify-center text-[#e8dab2] font-display">
        <p className="animate-pulse font-serif italic text-lg text-[#c5a021]">Returning to the Great Steppe...</p>
      </div>
    );
  }

  const getThemeColor = () => {
    switch (settings.androidThemeColor) {
      case 'crimson': return '#dc2626';
      case 'emerald': return '#10b981';
      case 'sky': return '#0ea5e9';
      case 'gold':
      default:
        return '#c5a021';
    }
  };
  const themeColor = getThemeColor();
  const currentTimeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const renderAndroidStatusBar = () => (
    <div className="w-full h-7 bg-[#120701] text-[#e8dab2]/80 px-4 flex justify-between items-center text-[10px] font-sans border-b border-white/5 select-none shrink-0 z-[190] relative">
      <div className="flex items-center gap-1.5 font-semibold">
        <span style={{ color: themeColor }}>SteppeNet 5G</span>
        <div className="flex gap-0.5 items-end h-2">
          <div className="w-[1.5px] h-[3px] bg-current rounded-3xs" />
          <div className="w-[1.5px] h-[4.5px] bg-current rounded-3xs" />
          <div className="w-[1.5px] h-[6px] rounded-3xs" style={{ backgroundColor: themeColor }} />
          <div className="w-[1.5px] h-[7.5px] rounded-3xs" style={{ backgroundColor: themeColor }} />
        </div>
      </div>
      
      {/* Punch hole camera notch spacer */}
      <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full border border-neutral-900 flex items-center justify-center top-1.5 hidden lg:flex">
        <div className="w-1.5 h-1.5 rounded-full bg-[#111] shadow-inner" />
      </div>

      <div className="flex items-center gap-2">
        <span className="font-semibold">{currentTimeString}</span>
        <div className="flex items-center gap-1">
          {/* Signal / Wifi Icon */}
          <svg className="w-3 h-3 text-[#e8dab2]/80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21l-12-18h24z" />
          </svg>
          {/* Battery Icon */}
          <div className="flex items-center gap-1">
            <span className="text-[9px]">84%</span>
            <div className="relative w-5 h-2.5 border border-[#e8dab2]/50 rounded-xs p-0.5 flex items-center">
              <div className="h-full rounded-3xs" style={{ width: '84%', backgroundColor: themeColor }} />
              <div className="absolute -right-[2px] top-0.5 w-[2.5px] h-1.2 bg-[#e8dab2]/50 rounded-r-3xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAndroidNavigationBar = () => (
    <div className="w-full h-11 bg-[#120701] border-t border-white/5 flex justify-around items-center select-none shrink-0 z-[190]">
      {/* Back Button */}
      <button 
        onClick={() => {
          playClickSound(settings.sound);
          triggerVibration(30, settings.vibration);
          if (showRecentsSwitcher) {
            setShowRecentsSwitcher(false);
          } else if (isMenuOpen) {
            setIsMenuOpen(false);
          } else if (showHistory) {
            setShowHistory(false);
          } else if (activeTab !== Tab.LIFE) {
            setActiveTab(Tab.LIFE);
          }
        }}
        className="w-16 h-full flex items-center justify-center text-[#e8dab2]/60 hover:text-white transition-colors"
        title="Back"
      >
        <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Home Button */}
      <button 
        onClick={() => {
          playClickSound(settings.sound);
          triggerVibration(30, settings.vibration);
          setShowRecentsSwitcher(false);
          setIsMenuOpen(false);
          setShowHistory(false);
          setActiveTab(Tab.LIFE);
        }}
        className="w-16 h-full flex items-center justify-center text-[#e8dab2]/60 hover:text-white transition-colors"
        title="Home"
      >
        <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-current" />
      </button>

      {/* Recents Multitasking Button */}
      <button 
        onClick={() => {
          playClickSound(settings.sound);
          triggerVibration(30, settings.vibration);
          setShowRecentsSwitcher(prev => !prev);
        }}
        className="w-16 h-full flex items-center justify-center text-[#e8dab2]/60 hover:text-white transition-colors"
        title="Recents"
      >
        <div className="w-3.5 h-3.5 border-[2.5px] border-current rounded-xs" />
      </button>
    </div>
  );

  const renderRecentsSwitcher = () => {
    if (!showRecentsSwitcher) return null;
    
    const recents = [
      {
        id: 'stats',
        title: 'Nomad Attributes & Health',
        icon: <Activity size={18} style={{ color: themeColor }} />,
        content: (
          <div className="space-y-3 text-xs text-[#e8dab2]">
            <div className="flex justify-between"><span>Health:</span> <span className="font-bold text-red-400">{character.stats.health}%</span></div>
            <div className="flex justify-between"><span>Happiness:</span> <span className="font-bold text-yellow-400">{character.stats.happiness}%</span></div>
            <div className="flex justify-between"><span>Strength:</span> <span className="font-bold text-orange-400">{character.stats.strength}</span></div>
            <div className="flex justify-between"><span>Intelligence:</span> <span className="font-bold text-purple-400">{character.stats.intelligence}</span></div>
            <div className="flex justify-between"><span>Perception:</span> <span className="font-bold text-sky-400">{character.stats.perception}</span></div>
          </div>
        ),
        action: () => { setActiveTab(Tab.LIFE); setIsMenuOpen(false); setShowRecentsSwitcher(false); }
      },
      {
        id: 'military',
        title: 'Horde & Wealth Ledger',
        icon: <Sword size={18} style={{ color: themeColor }} />,
        content: (
          <div className="space-y-3 text-xs text-[#e8dab2]">
            <div className="flex justify-between"><span>Military Power:</span> <span className="font-bold text-red-400">{Math.floor(character.militaryPower || 0)}</span></div>
            <div className="flex justify-between"><span>Horde Size:</span> <span className="font-bold text-blue-400">{Math.floor(character.hordeSize || 0)} warriors</span></div>
            <div className="flex justify-between"><span>Wealth:</span> <span className="font-bold text-yellow-400">{Math.floor(character.stats.wealth || 0)}г coins</span></div>
            <div className="flex justify-between"><span>Horses in Herd:</span> <span className="font-bold text-amber-400">{character.livestock.horses || 0}</span></div>
          </div>
        ),
        action: () => { openMenu(Tab.LIVESTOCK); setShowRecentsSwitcher(false); }
      },
      {
        id: 'memories',
        title: 'Recent Steppe Memoirs',
        icon: <History size={18} style={{ color: themeColor }} />,
        content: (
          <div className="space-y-1 text-[10px] text-gray-300 max-h-24 overflow-y-auto italic">
            {character.history.slice(-3).reverse().map((h, i) => (
              <p key={i} className="border-b border-white/5 pb-1 last:border-0">• Age {h.age}: {h.text}</p>
            ))}
            {character.history.length === 0 && <p className="text-gray-500">No memories recorded yet.</p>}
          </div>
        ),
        action: () => { setShowHistory(true); setShowRecentsSwitcher(false); }
      }
    ];

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#120701]/95 backdrop-blur-md flex flex-col justify-end p-6 z-[200]"
        >
          <div className="text-center mb-6">
            <h3 className="text-white text-lg font-bold tracking-wide">Android App Switcher</h3>
            <p className="text-gray-400 text-xs mt-1">Tap an active card to resume the task</p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-8 snap-x scroll-smooth select-none">
            {recents.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => {
                  playClickSound(settings.sound);
                  triggerVibration(30, settings.vibration);
                  item.action();
                }}
                className="w-64 bg-[#2b1d0e]/95 border border-[#c5a021]/30 rounded-3xl p-5 shrink-0 snap-center cursor-pointer flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[#c5a021]"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full flex items-center justify-center transition-all group-hover:bg-[#c5a021]/15">
                  {item.icon}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">Active Task</div>
                  <h4 className="text-white font-bold text-sm mb-4">{item.title}</h4>
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                    {item.content}
                  </div>
                </div>
                <div className="mt-5 text-center text-[10px] text-[#c5a021] font-bold uppercase tracking-wider group-hover:text-white transition-colors flex items-center justify-center gap-1">
                  Resume App <ChevronRight size={10} />
                </div>
              </motion.div>
            ))}
          </div>
          
          <button
            onClick={() => {
              playClickSound(settings.sound);
              triggerVibration(30, settings.vibration);
              setShowRecentsSwitcher(false);
            }}
            className="w-full py-4 bg-white/10 text-white rounded-2xl hover:bg-white/15 transition-all text-xs font-bold uppercase tracking-widest border border-white/5 mb-4"
          >
            Close Switcher
          </button>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className={`h-[100dvh] w-full flex items-center justify-center bg-[#120701] ${settings.deviceShell ? 'lg:p-6 lg:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] lg:from-[#2a1a0f] lg:to-[#0a0502]' : ''}`}>
      
      {/* Phone Shell mockup */}
      <div className={`w-full h-full max-h-[100dvh] flex flex-col relative transition-all duration-300 overflow-hidden bg-[#e8dab2]
        ${settings.deviceShell ? 'lg:w-[420px] lg:h-[860px] lg:max-h-[92vh] lg:rounded-[44px] lg:border-[10px] lg:border-[#221204] lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] lg:ring-4 lg:ring-[#c5a021]/30 lg:my-auto' : 'w-full h-full'}`}>
        
        {/* Physical hardware details on the phone shell (for lg screen) */}
        {settings.deviceShell && (
          <>
            <div className="absolute -left-[10px] top-32 w-[2px] h-14 bg-[#110802] rounded-l-md hidden lg:block border border-white/5" />
            <div className="absolute -left-[10px] top-48 w-[2px] h-14 bg-[#110802] rounded-l-md hidden lg:block border border-white/5" />
            <div className="absolute -right-[10px] top-40 w-[2px] h-18 bg-[#110802] rounded-r-md hidden lg:block border border-white/5" />
          </>
        )}

        {/* Dynamic Android OS Status Bar */}
        {settings.deviceShell && renderAndroidStatusBar()}

        {/* Viewport container */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#e8dab2] select-none">
          {renderRecentsSwitcher()}

          {/* Actual game layout content */}
          <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden select-none w-full h-full steppe-bg">
      {/* HUD / Top Bar */}
      <div className="w-full bg-[#2b1d0e]/95 text-[#e8dab2] py-1.5 px-4 flex justify-between items-center shrink-0 z-50 border-b border-[#c5a021]/30 shadow-2xl relative">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow shrink-0">
            {character?.avatarUrl ? (
              <img src={character.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={20} className="text-[#c5a021]/80" />
            )}
          </div>
          <div>
            <div className="font-display text-[10px] tracking-wide leading-tight">
              {character?.isGreatKhan ? `${character.name} (Khan of ${character.kingdomName})` : character?.name} 
              <span className="text-[#c5a021] italic">{character?.title}</span>
            </div>
            <div className="text-[8px] text-[#c57d21] uppercase font-bold tracking-tighter">{character?.role} • {Math.floor(character?.age || 0)} YR</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
           <button 
            onClick={() => { setActiveTab(Tab.MERCHANT); setIsMenuOpen(true); }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Silk Road Merchant"
           >
            <ShoppingBag size={14} className="text-[#c5a021]" />
           </button>
           <button 
            onClick={() => { setActiveTab(Tab.SETTINGS); setIsMenuOpen(true); }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Settings"
           >
            <Wand2 size={14} className="rotate-90" />
           </button>
           <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
           >
            <History size={14} />
           </button>
           <div className="flex flex-col items-end px-2 border-l border-white/5">
              <div className="text-[6px] uppercase opacity-60 leading-none mb-0.5">Military</div>
              <div className="flex items-center gap-1 font-bold text-red-500 text-xs">
                <WarIcon size={10} />
                {Number.isNaN(Number(character?.militaryPower)) ? 0 : Math.floor(character?.militaryPower || 0)}
              </div>
           </div>
           <div className="flex flex-col items-end px-2 border-l border-white/5">
              <div className="text-[6px] uppercase opacity-60 leading-none mb-0.5">Horde</div>
              <div className="flex items-center gap-1 font-bold text-blue-400 text-xs">
                <Users size={10} />
                {Number.isNaN(Number(character?.hordeSize)) ? 0 : Math.floor(character?.hordeSize || 0)}
              </div>
           </div>
           <div className="flex flex-col items-end pl-2 border-l border-white/5">
              <div className="text-[6px] uppercase opacity-60 leading-none mb-0.5">Wealth</div>
              <div className="flex items-center gap-1 font-bold text-[#c5a021] text-xs">
                <Coins size={10} />
                {Number.isNaN(Number(character?.stats.wealth)) ? 0 : Math.floor(character?.stats.wealth || 0)}
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`w-full flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#e8dab2]
        ${settings.deviceShell ? 'max-w-md mx-auto lg:shadow-[0_0_50px_rgba(0,0,0,0.5)] lg:my-2 lg:rounded-3xl border-x-4 border-[#8b7355]/20' : 'w-full h-full'}`}>
        
        {/* Candidate Selection Overlay */}
        <AnimatePresence>
          {character?.marriageCandidates && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[120] bg-[#2b1d0e] p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div className="text-center">
                <h3 className="text-[#c5a021] font-display text-2xl uppercase">
                  {character.marriageCandidates[0].type === 'Spouse Candidate' ? 'Select a Wife' : 'Choose a Companion'}
                </h3>
                <p className="text-[#e8dab2] text-xs opacity-80 mt-1 italic">
                  {character.marriageCandidates[0].type === 'Spouse Candidate' 
                    ? 'The elders have presented these candidates from neighboring clans.' 
                    : 'The foreign quarter offers many distractions for a weary warrior.'}
                </p>
              </div>

              <div className="space-y-4">
                {character.marriageCandidates.map((candidate, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/10 border border-[#c5a021]/30 rounded-2xl p-5 text-left relative overflow-hidden flex gap-4 group"
                  >
                    <div className="w-24 h-24 rounded-xl bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow shrink-0 transition-transform group-hover:scale-105">
                       {candidate.avatarUrl ? (
                         <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <User size={30} className="text-[#c5a021]/40" />
                         </div>
                       )}
                    </div>
                    <div className="relative z-10 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[#e8dab2] text-xl font-display">{candidate.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[#c5a021] text-[10px] font-bold uppercase tracking-widest">{candidate.clan} Clan</p>
                            {candidate.socialClass && (
                              <span className="text-[10px] text-[#e8dab2] opacity-50 px-1 border border-white/20 rounded">
                                {candidate.socialClass}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectCandidate(candidate)}
                          className="bg-[#c5a021] text-[#2b1d0e] px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#d4b54e] transition-all"
                        >
                          Select
                        </button>
                      </div>
                      
                      <p className="text-[11px] text-[#e8dab2] mt-3 leading-relaxed opacity-90">
                         <span className="text-[#c5a021] font-bold">Appearance:</span> {candidate.appearance}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {candidate.traits?.map(trait => (
                          <span key={trait} className="px-1.5 py-0.5 bg-white/5 text-[#c5a021] text-[9px] font-bold rounded-full border border-[#c5a021]/20">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Sparkles size={100} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => setCharacter({...character, marriageCandidates: undefined})}
                className="mt-2 text-[#e8dab2] text-xs uppercase opacity-60 hover:opacity-100 transition-all font-bold tracking-widest"
              >
                Cancel Selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pleasureTentCandidates && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[120] bg-[#1a120b] p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div className="text-center">
                <h3 className="text-pink-500 font-display text-2xl uppercase">Pleasure Tent Companions</h3>
                <p className="text-pink-100/60 text-xs mt-1 italic">
                  Choose someone to spend your evening with. You may even decide to take them as a mistress.
                </p>
              </div>

              {pleasureTentOutcome ? (
                /* RESULT PANEL */
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#2b1d0e]/95 border-2 border-pink-500/50 p-6 rounded-3xl flex flex-col gap-4 text-center max-w-md mx-auto shadow-2xl relative overflow-hidden"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-3xl">
                    {pleasureTentOutcome.success ? '💘' : '⚠️'}
                  </div>
                  <h3 className="text-xl font-display text-pink-200">
                    {pleasureTentOutcome.type === 'Mistress' ? 'Mistress Lodged (Updated)' : 'A Night of Passion'}
                  </h3>
                  <p className="text-xs text-pink-100/80 leading-relaxed font-serif italic">
                    "{pleasureTentOutcome.text}"
                  </p>
                  
                  <div className="bg-black/40 rounded-2xl p-4 text-left space-y-2 border border-pink-500/20">
                    <div className="text-[10px] text-pink-400 font-mono tracking-widest uppercase">Steppe Consequences:</div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-pink-100/90 font-mono">
                      <div>💰 Treasury Cost:</div>
                      <div className={`text-right font-bold ${pleasureTentOutcome.cost > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {pleasureTentOutcome.cost > 0 ? `-${pleasureTentOutcome.cost}г` : '0г'}
                      </div>

                      <div>💖 Happiness Gain:</div>
                      <div className="text-right text-green-400 font-bold">+{pleasureTentOutcome.happinessGain}</div>

                      <div>💔 Spouse Loyalty:</div>
                      <div className="text-right text-red-400 font-bold">{pleasureTentOutcome.spouseLoyaltyImpact}%</div>

                      <div>👥 Other Wives/Concubines:</div>
                      <div className="text-right text-red-400 font-bold">{pleasureTentOutcome.otherWivesLoyaltyImpact}%</div>

                      <div>🤒 Sickness Impact:</div>
                      <div className={`text-right font-bold ${pleasureTentOutcome.healthImpact < 0 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                        {pleasureTentOutcome.healthImpact < 0 ? `${pleasureTentOutcome.healthImpact} Health` : 'No Fever'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center mt-2">
                    <button
                      onClick={() => {
                        setPleasureTentOutcome(null);
                      }}
                      className="bg-[#8b7355]/30 text-white font-bold py-2.5 px-4 rounded-xl text-[10px] hover:bg-[#8b7355]/50 transition-all font-sans uppercase tracking-wider"
                    >
                      Choose Another
                    </button>
                    <button
                      onClick={() => {
                        setPleasureTentOutcome(null);
                        setPleasureTentCandidates(null);
                      }}
                      className="bg-pink-600 text-white font-bold py-2.5 px-5 rounded-xl text-[10px] hover:bg-pink-500 transition-all font-sans uppercase tracking-wider shadow-lg"
                    >
                      Return to Camp
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* WARNING PANEL */}
                  <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-5 text-left flex gap-4 backdrop-blur-md shadow-2xl leading-relaxed">
                    <div className="text-3xl select-none shrink-0">⚠️</div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-red-200 tracking-widest font-mono uppercase">TRIBAL LAW: RELATIONSHIP WARNING</h4>
                      <p className="text-[11px] text-red-100/70 mt-1 leading-normal">
                        Nomadic traditions govern domestic harmony strictly. Sneaking out to the caravans will have immediate consequences:
                      </p>
                      <ul className="text-[10px] text-red-300 font-mono mt-2 space-y-1 list-disc list-inside">
                        <li>Spouse loyalty: <span className="text-red-400 font-bold">-15% (Night)</span> or <span className="text-red-400 font-bold">-25% (Mistress)</span></li>
                        <li>Other Wives/Concubines loyalty: <span className="text-red-400 font-bold">-8% to -12%</span> out of jealousy</li>
                        <li>Taking a Mistress costs <span className="text-yellow-400 font-bold">150г</span> initial yurt establishment allowance</li>
                        <li>Fever risk: <span className="text-red-400 font-bold">20% chance</span> of contracting Steppe Rot (Health -15, Reputation -10)</li>
                      </ul>
                    </div>
                  </div>

                  {/* CANDIDATES LIST */}
                  <div className="space-y-4">
                    {pleasureTentCandidates.map((candidate, idx) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        className="bg-pink-950/20 border border-pink-500/30 rounded-2xl p-6 text-left relative overflow-hidden flex flex-col md:flex-row gap-5 group"
                      >
                        {/* Decorative background aura */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl pointer-events-none transition-all group-hover:bg-pink-500/10" />

                        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 shrink-0">
                          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#1d120c] border-2 border-pink-500/50 avatar-portrait avatar-inner-shadow shrink-0 shadow-xl transition-all group-hover:border-pink-500/80 group-hover:scale-105 duration-300">
                             {candidate.avatarUrl ? (
                               <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                  <User size={32} className="text-pink-500/40" />
                               </div>
                             )}
                          </div>
                          
                          {/* Allure rating gauge */}
                          {candidate.stats?.appearance && (
                            <div className="flex flex-col items-start md:items-center gap-1 mt-1">
                              <span className="text-[9px] text-pink-300 font-bold uppercase tracking-wider">Allure Rating</span>
                              <div className="flex items-center gap-1.5 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20 shadow-inner">
                                <span className="text-xs">✨</span>
                                <span className="text-xs text-pink-200 font-extrabold font-mono leading-none">
                                  {candidate.stats.appearance}
                                </span>
                                <span className="text-[9px] text-pink-400 font-bold">/100</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                              <div>
                                <h4 className="text-pink-100 text-2xl font-display">{candidate.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-pink-400 text-[10px] font-black uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                                    🔞 Pleasure Tent Companion
                                  </span>
                                  <span className="text-pink-200 text-[10px] font-mono opacity-80">
                                    Age 18
                                  </span>
                                </div>
                              </div>
                              <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                                <button 
                                  onClick={() => handlePleasureTentChoice(candidate, 'OneNight')}
                                  className="flex-1 sm:flex-initial bg-pink-500/10 text-pink-100 px-5 py-2.5 rounded-xl font-black text-xs hover:bg-pink-500/20 transition-all border border-pink-500/40 hover:border-pink-400 shadow-md text-center uppercase tracking-wider"
                                >
                                  💋 One Night (Free)
                                </button>
                                <button 
                                  onClick={() => handlePleasureTentChoice(candidate, 'Mistress')}
                                  disabled={(character?.stats.wealth || 0) < 150}
                                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-xl text-center uppercase tracking-wider ${
                                    (character?.stats.wealth || 0) < 150 
                                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50 shadow-none opacity-60' 
                                      : 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-500 hover:to-pink-400 border border-pink-400 shadow-pink-950/40'
                                  }`}
                                >
                                  👑 Take Mistress {(character?.stats.wealth || 0) < 150 ? " (Need 150г)" : " (-150г)"}
                                </button>
                              </div>
                            </div>

                            {/* Narrative Quote block */}
                            <div className="mt-4 text-[12px] text-pink-100/90 leading-relaxed font-serif italic border-l-2 border-pink-500/40 bg-pink-500/[0.03] p-3 rounded-r-xl">
                              "{candidate.appearance}"
                            </div>

                            {/* Structured Appearance Badges */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 bg-black/40 border border-pink-500/20 rounded-2xl p-4 text-[11px] leading-relaxed">
                              {candidate.bodyStature && (
                                <div className="flex items-center gap-2">
                                  <span className="text-pink-400 font-extrabold w-20 shrink-0">💃 Physique:</span>
                                  <span className="text-pink-100/90 capitalize">{candidate.bodyStature}</span>
                                </div>
                              )}
                              {candidate.hairStyle && (
                                <div className="flex items-center gap-2">
                                  <span className="text-pink-400 font-extrabold w-20 shrink-0">💇 Hair:</span>
                                  <span className="text-pink-100/90 capitalize">{candidate.hairStyle}</span>
                                </div>
                              )}
                              {candidate.attire && (
                                <div className="flex items-start gap-2 sm:col-span-2 border-t border-pink-500/5 pt-1.5 mt-1">
                                  <span className="text-pink-400 font-extrabold w-20 shrink-0">👗 Garments:</span>
                                  <span className="text-pink-100/90 italic">{candidate.attire}</span>
                                </div>
                              )}
                              {candidate.expression && (
                                <div className="flex items-start gap-2 sm:col-span-2 border-t border-pink-500/5 pt-1.5">
                                  <span className="text-pink-400 font-extrabold w-20 shrink-0">👁️ Demeanor:</span>
                                  <span className="text-pink-100/90 italic">{candidate.expression}</span>
                                </div>
                              )}
                              {candidate.scent && (
                                <div className="flex items-start gap-2 sm:col-span-2 border-t border-pink-500/5 pt-1.5">
                                  <span className="text-pink-400 font-extrabold w-20 shrink-0">🌸 Scent:</span>
                                  <span className="text-pink-100/90 italic">{candidate.scent}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {candidate.traits?.map(trait => (
                              <span key={trait} className="px-2.5 py-0.5 bg-pink-500/10 text-pink-200 text-[10px] font-black uppercase tracking-wider rounded-full border border-pink-500/20 shadow-sm">
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              <button 
                onClick={() => {
                  setPleasureTentOutcome(null);
                  setPleasureTentCandidates(null);
                }}
                className="mt-2 text-pink-100/40 text-xs uppercase hover:text-pink-100/80 transition-all font-bold tracking-widest text-center"
              >
                Leave Tents
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {friendCandidates && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[120] bg-[#1a120b] p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div className="text-center">
                <h3 className="text-[#c5a021] font-display text-2xl uppercase tracking-wider">Socialize & Seek Friends</h3>
                <p className="text-[#e8dab2]/60 text-xs mt-1 italic">
                  Meet the nomads of other yurts and seek fellow souls to form tight friendships with.
                </p>
              </div>

              <div className="space-y-4">
                {friendCandidates.map((candidate, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#2b1d0e]/20 border border-[#8b7355]/30 rounded-2xl p-5 text-left relative overflow-hidden flex gap-4 group"
                  >
                    <div className="h-20 w-20 rounded-xl bg-[#2b1d0e] border-2 border-[#8b7355]/40 avatar-portrait avatar-inner-shadow shrink-0 shadow-lg transition-transform group-hover:scale-105">
                       {candidate.avatarUrl ? (
                         <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <User size={24} className="text-[#c5a021]/40" />
                         </div>
                       )}
                    </div>
                    <div className="relative z-10 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white text-xl font-display">{candidate.name}</h4>
                          <p className="text-[#c5a021] text-[10px] font-bold uppercase tracking-widest flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{candidate.gender === Gender.MALE ? 'Nomad' : 'Heardess'}</span>
                            <span>&bull;</span>
                            <span>Age {candidate.age}</span>
                          </p>
                          {candidate.originName && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#c5a021]/10 text-[#c5a021] border border-[#c5a021]/20 text-[8px] font-black rounded uppercase tracking-wide">
                              🧭 {candidate.originName} ({candidate.originType})
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleSelectFriend(candidate)}
                            className="bg-[#8b7355] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#5d4037] transition-all shadow-lg"
                          >
                            Befriend
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-[#e8dab2]/80 mt-3 leading-relaxed">
                         <span className="text-[#c5a021] font-bold">Appearance:</span> {candidate.appearance}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {candidate.traits?.map(trait => (
                          <span key={trait} className="px-1.5 py-0.5 bg-[#2b1d0e] text-[#e8dab2]/80 text-[9px] font-bold rounded-full border border-[#8b7355]/20">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => setFriendCandidates(null)}
                className="mt-2 text-[#e8dab2]/40 text-xs uppercase hover:text-[#e8dab2]/80 transition-all font-bold tracking-widest text-center"
              >
                Go Back to Camp
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Area */}
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 pb-32 overflow-y-auto custom-scrollbar">
          
          {/* Top Hero Stat Card (Current Life) */}
          <div className="shrink-0">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="parchment-texture p-3 rounded-xl border border-[#8b7355]/30 shadow-sm"
            >
            <div className="flex justify-between items-center mb-2">
               <div className="h-16 w-16 rounded-xl bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow shrink-0 shadow-lg">
                   {character?.avatarUrl ? (
                     <img src={character.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <User size={32} className="text-[#c5a021]/70" />
                   )}
               </div>
               <div className="flex-1 pl-3">
                  <h2 className="text-lg font-display text-[#2b1d0e] leading-none">
                    {character?.name} <span className="text-[#c57d21] italic text-base">{character?.title}</span>
                  </h2>
                  <div className="text-[9px] font-bold text-[#c57d21] uppercase tracking-wider mt-0.5">{character?.role}</div>
                  <div className="text-[8px] text-[#5d4037] opacity-60 leading-none">{character?.tribe}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
              <div className="flex items-center justify-between text-[8px] uppercase font-bold text-[#5d4037]">
                <span>❤️ Health</span>
                <span className={character!.stats.health < 30 ? 'text-red-600' : ''}>{Math.floor(character?.stats.health || 0)}%</span>
              </div>
              <div className="flex items-center justify-between text-[8px] uppercase font-bold text-[#5d4037]">
                <span>😊 Happiness</span>
                <span className={character!.stats.happiness < 30 ? 'text-red-600' : ''}>{Math.floor(character?.stats.happiness || 0)}%</span>
              </div>
              <div className="col-span-1 h-1 bg-black/5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${character!.stats.health < 30 ? 'bg-red-600' : 'bg-green-700'}`} style={{ width: `${character?.stats.health}%` }} />
              </div>
              <div className="col-span-1 h-1 bg-black/5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${character!.stats.happiness < 30 ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${character?.stats.happiness}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-[#8b7355]/10">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase font-bold text-[#c57d21]">👶 Children</span>
                  <span className="text-sm font-display text-[#2b1d0e]">{Number.isNaN(Number(character?.children)) ? 0 : (character?.children || 0)}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[8px] uppercase font-bold text-[#c57d21]">💍 Spouses</span>
                  <span className="text-sm font-display text-[#2b1d0e]">
                    {(character?.relationships || []).filter(r => r.type === 'Spouse' || r.type === 'Second Wife').length}
                  </span>
                </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 py-2 border-t border-[#8b7355]/10">
               <div className="bg-black/5 p-2 rounded-lg flex flex-col items-center">
                  <WarIcon size={14} className="text-[#c57d21] mb-0.5" />
                  <span className="text-[6px] uppercase font-bold text-[#5d4037] text-center leading-none mb-0.5">⚔️ Power</span>
                  <span className="text-xs font-display text-[#2b1d0e]">{Number.isNaN(Number(character?.militaryPower)) ? 0 : (character?.militaryPower || 0)}</span>
               </div>
               <div className="bg-black/5 p-2 rounded-lg flex flex-col items-center">
                  <Users size={14} className="text-[#c57d21] mb-0.5" />
                  <span className="text-[6px] uppercase font-bold text-[#5d4037] text-center leading-none mb-0.5">👥 Warriors</span>
                  <span className="text-xs font-display text-[#2b1d0e]">{Number.isNaN(Number(character?.hordeSize)) ? 0 : (character?.hordeSize || 0)}</span>
               </div>
               <div className="bg-black/5 p-2 rounded-lg flex flex-col items-center">
                  <Globe size={14} className="text-[#c57d21] mb-0.5" />
                  <span className="text-[6px] uppercase font-bold text-[#5d4037] text-center leading-none mb-0.5">🚩 Vassals</span>
                  <span className="text-xs font-display text-[#2b1d0e]">{(character?.conqueredTribes || []).length}</span>
               </div>
            </div>

            {/* Detailed Attributes Toggle-style list */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 pt-2 border-t border-[#8b7355]/10">
                <StatProgressBar label="💪 Strength" value={character?.stats.strength || 0} color="bg-orange-800" icon={<Sword size={8} />} />
                <StatProgressBar label="🏹 Archery" value={character?.stats.archery || 0} color="bg-emerald-800" icon={<Target size={8} />} />
                <StatProgressBar label="🧠 Intelligence" value={character?.stats.intelligence || 0} color="bg-blue-800" icon={<Brain size={8} />} />
                <StatProgressBar label="🛡️ Leadership" value={character?.stats.leadership || 0} color="bg-purple-800" icon={<Shield size={8} />} />
                <StatProgressBar label="🏆 Reputation" value={character?.stats.reputation || 0} color="bg-yellow-800" icon={<Trophy size={8} />} />
                <StatProgressBar label="🌍 Realm Renown" value={character?.stats.realmReputation || 0} color="bg-[#c57d21]" icon={<Globe size={8} />} />
                <StatProgressBar label="🏇 Riding" value={character?.stats.horseRiding || 0} color="bg-amber-800" icon={<MapIcon size={8} />} />
                <StatProgressBar label="👁️ Perception" value={character?.stats.perception || 0} color="bg-cyan-800" icon={<MapPin size={8} />} />
                <StatProgressBar label="✨ Appearance" value={character?.stats.appearance || 0} color="bg-pink-800" icon={<Sparkles size={8} />} />
            </div>
          </motion.div>

          {/* Victory Goals Indicator */}
          {!hasWon && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#2b1d0e]/5 border border-[#8b7355]/20 p-3 rounded-xl flex items-center justify-between group cursor-help"
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#c5a021]/20 p-2 rounded-lg">
                  <Trophy size={16} className="text-[#c5a021]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#2b1d0e]">Path to Glory</h4>
                  <p className="text-[9px] text-[#5d4037] opacity-70">Achieve one to secure your legacy</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                   <div className={`h-1.5 w-1.5 rounded-full ${character?.isGreatKhan ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-[#8b7355]/30'}`} />
                   <span className="text-[8px] font-bold text-[#5d4037]">KHAN</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className={`h-1.5 w-1.5 rounded-full ${character?.conqueredTribes && character?.conqueredTribes.length >= 5 ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-[#8b7355]/30'}`} />
                   <span className="text-[8px] font-bold text-[#5d4037]">5 TRIBES</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className={`h-1.5 w-1.5 rounded-full ${(character?.age || 0) >= 80 && (character?.stats.happiness || 0) >= 80 ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-[#8b7355]/30'}`} />
                   <span className="text-[8px] font-bold text-[#5d4037]">AGE 80</span>
                </div>
              </div>
            </motion.div>
          )}

          {hasWon && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-[#c5a021]/20 to-transparent border-l-4 border-[#c5a021] p-3 rounded-r-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Trophy size={18} className="text-[#c5a021]" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#c57d21]">A Living Legend</h4>
                  <p className="text-[9px] text-[#5d4037]">Your saga is complete, but your story continues.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVictoryModal(true)}
                className="text-[8px] font-bold uppercase tracking-tighter text-[#c57d21] bg-[#c5a021]/10 px-2 py-1 rounded hover:bg-[#c5a021]/20 transition-all underline decoration-dotted"
              >
                Review Glory
              </button>
            </motion.div>
          )}
        </div>

          {/* Life History Feed - ENLARGED UNIFIED BOXED STYLE */}
          <div className="flex flex-col shrink-0 bg-white/40 rounded-t-3xl border-x-2 border-t-2 border-[#8b7355]/30 shadow-2xl relative">
             <div className="px-6 py-4 border-b border-[#8b7355]/20 flex justify-between items-center bg-[#2b1d0e]/10 shrink-0">
                <div className="flex items-center gap-3 text-[#2b1d0e] font-display text-base uppercase tracking-[0.2em] font-black">
                   <ScrollText size={20} className="text-[#c57d21]" />
                   The Chronicle
                </div>
                <div className="text-[10px] font-mono font-bold bg-[#2b1d0e] text-[#e8dab2] px-2 py-0.5 rounded shadow-sm">
                   LEGACY ENTRIES: {character?.history.length}
                </div>
             </div>
             
             <div className="p-6 space-y-5 bg-[#e8dab2]/10 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {character?.history.map((h, i) => {
                   const isNewest = i === (character?.history.length || 0) - 1;
                   return (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       key={`history-${i}`} 
                       className={`relative pl-10 border-l-4 transition-all ${isNewest ? 'border-[#c5a021] pb-2' : 'border-[#8b7355]/10 opacity-75'}`}
                     >
                       {/* Timeline Dot */}
                       <div className={`absolute -left-[11px] top-1.5 h-4.5 w-4.5 rounded-full border-2 ${isNewest ? 'bg-[#c5a021] border-[#2b1d0e] scale-125 shadow-[0_0_15px_rgba(197,160,33,0.6)]' : 'bg-[#e8dab2] border-[#8b7355]/40'}`} />
                       
                       <div className="flex items-baseline gap-3 mb-1.5">
                          <span className={`text-[11px] font-mono font-black tracking-tight px-2.5 py-0.5 rounded shadow-sm ${isNewest ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'bg-[#8b7355]/20 text-[#5d4037]'}`}>
                            {h.age === 0 ? 'BIRTH' : `AGE ${h.age}`}
                          </span>
                       </div>
                       <p className={`text-base leading-relaxed text-[#2b1d0e] ${isNewest ? 'font-serif italic font-bold' : 'font-sans opacity-95'}`}>
                         {isNewest ? `"${h.text}"` : h.text}
                       </p>
                     </motion.div>
                   );
                 })}
                <div ref={historyEndRef} />
             </div>
          </div>
        </div>

        {/* Current Event Overlay (Floating Modal Style) */}
        <AnimatePresence>
          {currentEvent && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <EventCard 
                  key={currentEvent.id}
                  event={currentEvent} 
                  onChoice={handleChoice} 
                />
            </div>
          )}
        </AnimatePresence>

        {/* Victory Modal */}
        <AnimatePresence>
          {showVictoryModal && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="parchment-texture p-8 rounded-3xl border-4 border-[#c5a021] shadow-[0_0_50px_rgba(197,160,33,0.5)] max-w-sm w-full"
               >
                  <Trophy size={64} className="text-[#c5a021] mx-auto mb-6" />
                  <h2 className="text-3xl font-display text-[#2b1d0e] mb-4 uppercase tracking-tighter">Victory!</h2>
                  <div className="h-1 w-20 bg-[#c5a021] mx-auto mb-6" />
                  <p className="text-xl font-display text-[#c57d21] mb-6 leading-tight">
                    {victoryType}
                  </p>
                  <p className="text-sm text-[#5d4037] mb-8 font-serif opacity-80">
                    Your name will echo through the ages. You have achieved greatness that few can imagine.
                  </p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowVictoryModal(false)}
                      className="w-full py-4 bg-[#2b1d0e] text-[#e8dab2] rounded-xl font-display text-lg shadow-lg hover:brightness-125 transition-all"
                    >
                      CONTINUE MY SAGA
                    </button>
                    <button 
                      onClick={() => {
                        const updatedChar = { ...character! };
                        updatedChar.isAlive = false;
                        updatedChar.history = [...updatedChar.history, { age: character!.age, text: "Having achieved ultimate victory, you have retired to the high mountains to spend your final days in peace." }];
                        setCharacter(updatedChar);
                        recordLegacy(updatedChar);
                        setShowVictoryModal(false);
                      }}
                      className="w-full py-3 border-2 border-[#8b7355] text-[#8b7355] rounded-xl font-display text-sm tracking-widest hover:text-[#2b1d0e] hover:border-[#2b1d0e] transition-all"
                    >
                      RETIRE & START NEW LIFE
                    </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Action Result Modal Overlay */}
        <AnimatePresence>
          {genericActionResult && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[280] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn"
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 15 }}
                 className="parchment-texture p-6 rounded-3xl border-4 border-[#8b7355]/40 shadow-[0_15px_40px_rgba(0,0,0,0.6)] max-w-sm w-full relative max-h-[90vh] overflow-y-auto custom-scrollbar text-center"
               >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#c5a021]/60 animate-pulse" />
                  
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-[#2b1d0e]/10 border border-[#8b7355]/40 flex items-center justify-center text-3xl mb-3 shadow-inner relative overflow-hidden">
                     {genericActionResult.avatarUrl ? (
                       <img 
                         src={genericActionResult.avatarUrl} 
                         alt={genericActionResult.subtitle || 'avatar'}
                         className="w-full h-full object-cover"
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       '🐎'
                     )}
                  </div>

                  <h3 className="text-xl font-display text-[#2b1d0e] uppercase tracking-tighter font-black leading-tight mb-1">
                    {genericActionResult.title}
                  </h3>

                  {genericActionResult.subtitle && (
                    <p className="text-[10px] text-[#c57d21] uppercase font-bold tracking-widest leading-none mb-1">
                      {genericActionResult.subtitle}
                    </p>
                  )}

                  <div className="h-0.5 w-12 bg-[#8b7355]/20 mx-auto my-3" />

                  <p className="text-xs text-[#5d4037] leading-relaxed font-serif italic mb-5 px-2">
                    "{genericActionResult.storySnippet}"
                  </p>

                  {genericActionResult.effects && genericActionResult.effects.length > 0 ? (
                    <div className="bg-[#2b1d0e]/5 rounded-2xl p-4 text-left space-y-2.5 border border-[#8b7355]/20 mb-5">
                      <div className="text-[9px] text-[#c57d21] font-mono tracking-widest uppercase font-black">Steppe Consequences:</div>
                      <div className="grid grid-cols-1 gap-1.5 text-xs text-[#5d4037] font-mono">
                        {genericActionResult.effects.map((eff, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-[#8b7355]/10 pb-1.5 last:border-0 last:pb-0">
                            <span className="opacity-80">{eff.label}:</span>
                            <span className={`font-black ${eff.isPositive ? 'text-emerald-700 font-extrabold' : eff.isNegative ? 'text-red-700 font-extrabold' : 'text-[#2b1d0e]'}`}>
                              {eff.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#2b1d0e]/5 rounded-2xl py-3 px-4 text-[10px] font-mono text-[#5d4037]/60 italic mb-5 border border-dashed border-[#8b7355]/20">
                      No status variations occurred.
                    </div>
                  )}

                  <button 
                    onClick={() => setGenericActionResult(null)}
                    className="w-full py-3 bg-[#2b1d0e] hover:bg-black text-[#e8dab2] rounded-xl font-display text-xs uppercase tracking-widest transition-all shadow-md font-black active:scale-[0.98]"
                  >
                    CONTINUE
                  </button>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Child Birth Modal */}
        <AnimatePresence>
          {childBirthPending && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn"
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="parchment-texture p-6 rounded-3xl border-4 border-[#c5a021] shadow-[0_0_50px_rgba(197,160,33,0.4)] max-w-md w-full"
               >
                  <div className="text-3xl mb-3">👶</div>
                  <h2 className="text-2xl font-display text-[#2b1d0e] uppercase tracking-tighter">Child Birth</h2>
                  <p className="text-xs text-[#5d4037] opacity-60 uppercase font-bold mt-1 tracking-widest">
                    A New Life Under the Eternal Sky
                  </p>
                  
                  <div className="h-0.5 w-16 bg-[#8b7355]/30 mx-auto my-3" />

                  {/* Baby Avatar preview */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-2xl bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow shadow-lg">
                       <img 
                          src={getNomadAvatar(newChildName || 'baby', newChildGender, character?.clan || 'Unknown', 0, undefined, character?.socialClass)} 
                          alt="Baby Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                       />
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div className="mb-4">
                    <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1">Gender</label>
                    <div className="flex gap-1 p-1 bg-white/30 rounded-xl border border-[#8b7355]/20 max-w-xs mx-auto">
                      {(['Male', 'Female'] as const).map(g => {
                        const genderEnum = g === 'Male' ? Gender.MALE : Gender.FEMALE;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setNewChildGender(genderEnum);
                              const randomNames = genderEnum === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
                              setNewChildName(randomNames[Math.floor(Math.random() * randomNames.length)]);
                            }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${newChildGender === genderEnum ? 'bg-[#2b1d0e] text-[#e8dab2] shadow-sm' : 'text-[#5d4037] hover:bg-white/40'}`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name field */}
                  <div className="mb-5">
                    <label className="block text-[10px] uppercase font-bold text-[#c57d21] mb-1">Name of Your Child</label>
                    <div className="flex gap-2 max-w-xs mx-auto">
                      <input 
                        type="text" 
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        placeholder="Enter baby name"
                        maxLength={20}
                        className="flex-1 bg-white/50 border border-[#8b7355]/30 rounded-xl px-3 py-2 text-[#2b1d0e] text-xs font-bold focus:outline-none focus:border-[#c5a021] transition-all text-center"
                      />
                      <button 
                        onClick={() => {
                          const names = newChildGender === Gender.MALE ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
                          setNewChildName(names[Math.floor(Math.random() * names.length)]);
                        }}
                        className="p-2 bg-[#2b1d0e] text-[#e8dab2] rounded-xl hover:bg-black transition-colors"
                        title="Random Name"
                      >
                        <Wand2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#5d4037] mb-5 italic font-serif px-4">
                    "Welcome, child of {childBirthPending.motherName} & {childBirthPending.partnerName}. May the mountain spirits bless you, and your name shine brightly across the endless steppe."
                  </p>

                  <button 
                    onClick={() => handleChildBirthSubmit(newChildName, newChildGender)}
                    className="w-full py-3 bg-[#8b7355] text-white rounded-xl font-display text-md shadow-lg hover:brightness-110 transition-all uppercase tracking-wider"
                  >
                    Welcome to the Clan
                  </button>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Age Up Button - BITLIFE STYLE */}
        {!currentEvent && !isMenuOpen && !showHistory && character?.isAlive && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAgeUp}
              className="h-24 w-24 rounded-full border-4 border-[#c5a021] bg-[#2b1d0e] text-[#e8dab2] font-display flex flex-col items-center justify-center transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(197,160,33,0.5)]"
            >
              <ChevronRight size={32} />
              <span className="text-[10px] font-bold tracking-tighter mt-[-4px]">AGE</span>
            </motion.button>
          </div>
        )}

        {/* Death Screen Overlay */}
        {!character?.isAlive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[200] bg-[#1a120b] flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="text-6xl mb-6">⚒️</div>
             <h2 className="text-4xl font-display text-[#e8dab2] mb-2 uppercase tracking-tighter">Your Spirit Returns to the Sky</h2>
             {character?.deathCause && (
               <div className="text-[#c5a021] text-xs font-bold mb-4 uppercase tracking-[0.2em] bg-[#c5a021]/10 px-4 py-1.5 rounded-full border border-[#c5a021]/30 mx-auto max-w-max">
                 Cause: {character.deathCause}
               </div>
             )}
             <p className="text-[#8b7355] italic mb-8 px-4 font-serif">"{character?.history[character!.history.length-1].text}"</p>
             
             <div className="w-full max-w-sm space-y-4">
                {character?.relationships.some(r => (r.type === 'Child' || r.type === 'Adult Child' || r.type === 'Relative') && r.status !== 'Deceased') && !isSuccessionMode ? (
                  <button 
                    onClick={() => setIsSuccessionMode(true)}
                    className="w-full py-4 bg-[#c5a021] text-[#2b1d0e] rounded-xl font-display text-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <Users size={20} />
                    CONTINUE LEGACY
                  </button>
                ) : null}

                {isSuccessionMode ? (
                  <div className="space-y-3 max-h-[40dvh] overflow-y-auto w-full p-2">
                    <p className="text-[#e8dab2] text-xs uppercase font-bold mb-2">Select an Heir</p>
                    {character?.heirId && character?.relationships.find(r => r.id === character.heirId) && (
                       <button
                         onClick={() => startNewLife(character?.relationships.find(r => r.id === character.heirId))}
                         className="w-full p-4 bg-[#c5a021]/20 hover:bg-[#c5a021]/30 border-2 border-[#c5a021] rounded-xl text-[#e8dab2] flex justify-between items-center transition-all shadow-[0_0_15px_rgba(197,160,33,0.3)] relative"
                       >
                         <div className="absolute -top-2 left-4 bg-[#c5a021] text-[#2b1d0e] text-[8px] font-black px-2 py-0.5 rounded-full z-10">DESIGNATED HEIR</div>
                         <div className="text-left">
                           <div className="font-black text-lg">{character.relationships.find(r => r.id === character.heirId)?.name}</div>
                           <div className="text-[10px] opacity-70">Will inherit your full legacy and clan respect</div>
                         </div>
                         <ChevronRight size={24} className="text-[#c5a021]" />
                       </button>
                    )}
                    {character?.relationships.filter(r => (r.type === 'Child' || r.type === 'Adult Child' || r.type === 'Relative') && r.id !== character.heirId).map((child, idx) => (
                      <button
                        key={idx}
                        onClick={() => startNewLife(child)}
                        className="w-full p-4 bg-white/10 hover:bg-white/20 border border-[#c5a021]/30 rounded-xl text-[#e8dab2] flex justify-between items-center transition-all"
                      >
                        <div className="text-left">
                          <div className="font-bold">{child.name}</div>
                          <div className="text-[10px] opacity-60">Successor of the {character.clan} Clan ({child.type})</div>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                ) : null}

                {!isSuccessionMode && (
                  <button 
                    onClick={() => startNewLife()}
                    className="w-full py-4 border-2 border-[#8b7355] text-[#8b7355] hover:text-[#e8dab2] hover:border-[#e8dab2] rounded-xl font-display text-lg transition-all"
                  >
                    START NEW SAGA
                  </button>
                )}

                <button 
                  onClick={fullReset}
                  className="w-full py-3 text-red-500/60 hover:text-red-500 text-xs uppercase tracking-widest font-bold transition-all"
                >
                  Return to Main Menu
                </button>

                {isSuccessionMode && (
                  <button 
                    onClick={() => setIsSuccessionMode(false)}
                    className="text-[#8b7355] text-xs uppercase hover:underline"
                  >
                    Go Back
                  </button>
                )}
             </div>
             
             <div className="mt-12 pt-8 border-t border-white/5 w-full max-w-xs">
                <div className="text-[10px] uppercase font-bold text-[#c5a021] mb-2 opacity-60">Final Standing</div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <div className="text-2xl text-[#e8dab2] font-display">{Math.floor(character?.age || 0)}</div>
                     <div className="text-[8px] uppercase text-[#8b7355]">Years Lived</div>
                   </div>
                   <div>
                     <div className="text-2xl text-[#e8dab2] font-display">{Number.isNaN(Number(character?.stats.wealth)) ? 0 : Math.floor(character?.stats.wealth || 0)}г</div>
                     <div className="text-[8px] uppercase text-[#8b7355]">Wealth Amassed</div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </div>


      <MenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        title={
          activeTab === Tab.RELATIONSHIPS ? "Relationships" :
          activeTab === Tab.ACTIVITIES ? "Activities" :
          activeTab === Tab.ASSETS ? "Assets" : 
          activeTab === Tab.DIPLOMACY ? "Tribes & Diplomacy" : 
          activeTab === Tab.MAP ? "Steppe World Map" :
          activeTab === Tab.LIVESTOCK ? "Livestock & Lifestyle" : 
          activeTab === Tab.COMBAT_SIM ? "Combat Simulator" :
          activeTab === Tab.SETTINGS ? "Game Settings" :
          activeTab === Tab.MERCHANT ? "Silk Road Merchant" :
          activeTab === Tab.HERITAGE ? "Dynasty & Heritage" :
          activeTab === Tab.PREMIUM ? "Legacy Premium" : "Clan & Rank"
        }
      >
        {activeTab === Tab.RELATIONSHIPS && renderRelationships()}
        {activeTab === Tab.ACTIVITIES && renderActivities()}
        {activeTab === Tab.ASSETS && renderAssets()}
        {activeTab === Tab.CLAN && renderClan()}
        {activeTab === Tab.DIPLOMACY && renderDiplomacy()}
        {activeTab === Tab.LIVESTOCK && renderLivestock()}
        {activeTab === Tab.HERITAGE && renderHeritage()}
        {activeTab === Tab.PREMIUM && renderPremium()}
        {activeTab === Tab.COMBAT_SIM && <CombatSimulator character={character!} onClose={() => setActiveTab(Tab.ACTIVITIES)} onComplete={handleCombatComplete} />}
        {activeTab === Tab.SETTINGS && renderSettings()}
        {activeTab === Tab.MERCHANT && renderMerchant()}
        {activeTab === Tab.MAP && character && <WorldMap character={character} />}
      </MenuOverlay>

      <AnimatePresence>
        {isCouncilOpen && currentCouncilDecision && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative parchment-texture p-8 rounded-2xl max-w-2xl w-full border-4 border-[#8b7355] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-[#8b7355]/20 pb-4">
                <div className="p-3 bg-[#2b1d0e] rounded-lg text-[#c5a021]">
                  <Users size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-[#2b1d0e]">{currentCouncilDecision.title}</h2>
                  <p className="text-sm font-serif italic text-[#5d4037]">{currentCouncilDecision.description}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#5d4037]/60 mb-4">Council Advice</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentCouncilDecision.members.map((member: any, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white/40 border border-[#8b7355]/20 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-[#2b1d0e] avatar-frame-gold avatar-portrait avatar-inner-shadow rounded-full shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={24} className="text-[#c5a021]/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#2b1d0e] truncate">{member.name}</div>
                        <div className="text-[10px] text-[#5d4037] flex flex-col">
                            <span className="font-bold opacity-70">{member.councilRole || member.type}</span>
                            <span className="italic text-[#c57d21] mt-1">"{member.reason}"</span>
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#5d4037]/60">Your Final Command</h3>
                <div className="grid grid-cols-1 gap-3">
                  {currentCouncilDecision.options.map((option: any, idx: number) => {
                    const supporters = currentCouncilDecision.members.filter((m: any) => m.preference === idx);
                    const isConsensusChoice = supporters.length > currentCouncilDecision.members.length / 2;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleCouncilDecision(idx)}
                        className={`p-5 text-left border-2 rounded-xl transition-all group relative overflow-hidden ${
                          isConsensusChoice 
                            ? 'bg-[#2b1d0e] border-[#c5a021] shadow-[0_0_15px_rgba(197,160,33,0.3)]' 
                            : 'bg-white/40 border-[#8b7355]/20 hover:border-[#8b7355] hover:bg-white/60'
                        }`}
                      >
                        {isConsensusChoice && (
                          <div className="absolute top-0 right-0 bg-[#c5a021] text-[#2b1d0e] text-[8px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-bl-lg">
                            Council Consensus
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold ${isConsensusChoice ? 'text-[#e8dab2]' : 'text-[#2b1d0e]'}`}>
                            {option.text}
                          </span>
                          <ChevronRight className={isConsensusChoice ? 'text-[#c5a021]' : 'text-[#2b1d0e]/40'} size={20} />
                        </div>
                        <p className={`text-xs font-serif italic mb-3 ${isConsensusChoice ? 'text-[#e8dab2]/60' : 'text-[#5d4037]/60'}`}>
                          {option.outcome}
                        </p>
                        
                        <div className="flex -space-x-2 overflow-hidden mt-2">
                           {supporters.map((s: any, si: number) => (
                             <div 
                               key={si}
                               className={`inline-block h-6 w-6 rounded-full ring-2 ${isConsensusChoice ? 'ring-[#2b1d0e]' : 'ring-white'} bg-[#2b1d0e] overflow-hidden`}
                               title={`${s.name} (${s.councilRole})`}
                             >
                               {s.avatarUrl ? (
                                 <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-[8px] text-[#c5a021]">
                                   {s.name.charAt(0)}
                                 </div>
                               )}
                             </div>
                           ))}
                           {supporters.length > 0 && (
                             <span className={`ml-3 text-[9px] font-bold self-center uppercase tracking-tighter ${isConsensusChoice ? 'text-[#c5a021]' : 'text-[#5d4037]'}`}>
                               {supporters.length} Supporters
                             </span>
                           )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isSuccessionCouncilOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsSuccessionCouncilOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative parchment-texture p-8 rounded-2xl max-w-4xl w-full border-4 border-[#8b7355] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsSuccessionCouncilOpen(false)}
                className="absolute top-4 right-4 text-[#5d4037] hover:text-[#2b1d0e] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-[#8b7355]/20 pb-4">
                <div className="p-3 bg-[#2b1d0e] rounded-lg text-[#c5a021]">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-[#2b1d0e] uppercase tracking-wide">Succession Council</h2>
                  <p className="text-sm font-serif italic text-[#5d4037]">
                    "The future of the clan hinges upon who holds the high whip next. Choose wisely, or face fracture."
                  </p>
                </div>
              </div>

              {/* Grid Layout: Left is advisors & comments, right is the heir options */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Advisor Columns */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-[#5d4037] border-b border-[#8b7355]/10 pb-1">Advisors Panel</h3>
                  <div className="space-y-3">
                    {successionCouncilOpinions.map((opinion, idx) => {
                      // Find which candidate they prefer
                      const candidateName = character?.relationships.find(r => r.id === opinion.preferredHeirId)?.name || "No one";
                      return (
                        <div 
                          key={idx}
                          className="p-4 bg-white/45 border border-[#8b7355]/25 rounded-xl space-y-2 relative"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2b1d0e] avatar-frame-gold rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                              {opinion.avatarUrl ? (
                                <img src={opinion.avatarUrl} alt={opinion.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={20} className="text-[#c5a021]/60" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#2b1d0e]">{opinion.name}</div>
                              <div className="text-[9px] text-[#c57d21] uppercase font-black">{opinion.councilRole || opinion.type}</div>
                            </div>
                          </div>
                          
                          <div className="bg-[#2b1d0e]/5 p-2.5 rounded-lg border border-[#8b7355]/15 text-xs font-serif italic text-[#5d4037] relative">
                            <span className="text-[#c57d21] font-sans font-bold block text-[9px] uppercase tracking-wider mb-1">
                              Supports: {candidateName.split(' ')[0]}
                            </span>
                            "{opinion.reason}"
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Heir Selection Columns */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-[#5d4037] border-b border-[#8b7355]/10 pb-1 flex justify-between items-center">
                    <span>Eligible Succession Heirs</span>
                    <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Active Kin</span>
                  </h3>

                  {(() => {
                    const potentialHeirs = character?.relationships.filter(r => 
                      (r.type === 'Child' || r.type === 'Adult Child' || r.type === 'Relative') && 
                      r.status === 'Active' && 
                      (r.age || 0) >= 5
                    ) || [];

                    if (potentialHeirs.length === 0) {
                      return (
                        <div className="p-8 text-center bg-white/30 border border-dashed border-[#8b7355]/30 rounded-2xl space-y-4">
                          <Users size={40} className="mx-auto text-[#5d4037]/30" />
                          <p className="text-xs text-[#5d4037] italic leading-relaxed">
                            "No eligible sons, daughters, or relatives in your immediate bloodline are of age to withstand the crown's burden (Minimum Age: 5, Active status)."
                          </p>
                          
                          <div className="border-t border-[#8b7355]/20 pt-4 max-w-md mx-auto">
                            <h4 className="font-bold text-xs text-[#2b1d0e] mb-1">Draft a Distant Kin Sibling</h4>
                            <p className="text-[10px] text-[#5d4037] opacity-80 mb-3">
                              Dispatch horse messengers into the outlying pastures to recruit an eager cousin, nephew, or niece (Age 15-20) into the direct family line. This costs <span className="font-bold text-[#c57d21]">300г</span>.
                            </p>
                            <button
                              disabled={(character?.stats.wealth || 0) < 300}
                              onClick={handleDraftSuccessionKin}
                              className={`py-2 px-4 rounded-lg font-bold text-xs uppercase transition-all inline-flex items-center gap-2 ${
                                (character?.stats.wealth || 0) >= 300
                                  ? 'bg-[#c5a021] text-[#2b1d0e] hover:brightness-110 cursor-pointer shadow-md'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              🐎 Adopt Outer Kin (-300г)
                            </button>
                            {(character?.stats.wealth || 0) < 300 && (
                              <p className="text-[9px] text-red-600 mt-1">Insufficient wealth (Requires 300г - You hold {(character?.stats.wealth || 0)}г)</p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Count total votes
                    const totalVotes = successionCouncilOpinions.length;
                    const voteCounts: Record<string, number> = {};
                    successionCouncilOpinions.forEach(o => {
                      if (o.preferredHeirId) {
                        voteCounts[o.preferredHeirId] = (voteCounts[o.preferredHeirId] || 0) + 1;
                      }
                    });

                    // Find max votes ID
                    let maxVotes = 0;
                    let maxVoteId = "";
                    Object.entries(voteCounts).forEach(([id, vt]) => {
                      if (vt > maxVotes) {
                        maxVotes = vt;
                        maxVoteId = id;
                      }
                    });

                    return (
                      <div className="space-y-3">
                        {potentialHeirs.map((candidate, ci) => {
                          const votes = voteCounts[candidate.id || ""] || 0;
                          const isConsensus = candidate.id === maxVoteId && votes > 0;
                          
                          // Look at the traits of candidate
                          const traits = candidate.traits || [];

                          const str = candidate.stats?.strength || 15;
                          const intel = candidate.stats?.intelligence || 15;
                          const lead = candidate.stats?.leadership || 15;
                          const arch = candidate.stats?.archery || 15;

                          // Advisors supporting this candidate
                          const supporters = successionCouncilOpinions.filter(o => o.preferredHeirId === candidate.id);

                          return (
                            <div 
                              key={ci} 
                              className={`p-4 rounded-xl border-2 transition-all space-y-3 relative ${
                                isConsensus 
                                  ? 'bg-[#2b1d0e] border-[#c5a021] text-[#e8dab2] shadow-[0_0_15px_rgba(197,160,33,0.15)]' 
                                  : 'bg-white/40 border-[#8b7355]/20 text-[#2b1d0e]'
                              }`}
                            >
                              {isConsensus && (
                                <span className="absolute top-0 right-0 p-1.5 bg-[#c5a021] text-[#2b1d0e] text-[8px] uppercase tracking-wider font-extrabold rounded-bl-lg">
                                  ⭐ Council Consensus
                                </span>
                              )}

                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl border border-[#c5a021]/30 bg-black/25 overflow-hidden shrink-0 flex items-center justify-center">
                                  {candidate.avatarUrl ? (
                                    <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <User size={30} className={isConsensus ? "text-[#c5a021]" : "text-[#5d4037]/40"} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                                    <span>{candidate.name}</span>
                                    {character?.heirId === candidate.id && (
                                      <span className="text-[8px] bg-[#c5a021] text-[#2b1d0e] px-1.5 py-0.5 rounded font-black uppercase">Active Heir</span>
                                    )}
                                  </div>
                                  <div className={`text-[10px] uppercase font-black ${isConsensus ? 'text-[#c5a021]' : 'text-[#8b7355]'}`}>
                                    {candidate.type} (Age: {candidate.age || 5})
                                  </div>
                                  {traits.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {traits.map((tr, ti) => (
                                        <span 
                                          key={ti} 
                                          className={`text-[8px] rounded px-1.5 py-0.5 font-bold uppercase tracking-tighter ${
                                            isConsensus ? 'bg-white/10 text-white' : 'bg-[#2b1d0e]/10 text-[#2b1d0e]'
                                          }`}
                                        >
                                          {tr}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Candidate mini-stats */}
                              <div className="grid grid-cols-4 gap-2 border-t border-b py-2 border-[#8b7355]/15 text-center">
                                <div>
                                  <div className="text-[9px] uppercase opacity-70">Str</div>
                                  <div className="font-bold text-xs">{str}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] uppercase opacity-70">Int</div>
                                  <div className="font-bold text-xs">{intel}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] uppercase opacity-70">Ldr</div>
                                  <div className="font-bold text-xs">{lead}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] uppercase opacity-70">Arc</div>
                                  <div className="font-bold text-xs">{arch}</div>
                                </div>
                              </div>

                              {/* Approvals and buttons */}
                              <div className="flex items-center justify-between gap-4 mt-1">
                                <div className="flex items-center gap-1.5 py-1">
                                  <span className="text-[9px] uppercase font-bold opacity-75">Backing:</span>
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    {supporters.map((s, si) => (
                                      <div 
                                        key={si}
                                        className="h-5 w-5 rounded-full border border-[#c5a021] bg-[#2b1d0e] overflow-hidden"
                                        title={`${s.name} (${s.councilRole})`}
                                      >
                                        {s.avatarUrl ? (
                                          <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[7px] text-[#c5a021]">
                                            {s.name.charAt(0)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold">
                                    {supporters.length} / {totalVotes}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleSuccessionCouncilSelectHeir(candidate.id || "")}
                                  className={`px-3 py-1.5 text-[9px] font-extrabold uppercase rounded-lg transition-all border ${
                                    isConsensus
                                      ? 'bg-[#c5a021] text-[#2b1d0e] hover:bg-white hover:text-[#2b1d0e] border-[#c5a021]'
                                      : 'bg-white hover:bg-[#2b1d0e] hover:text-[#e8dab2] border-[#2b1d0e] text-[#2b1d0e]'
                                  }`}
                                >
                                  {character?.heirId === candidate.id ? "Re-Designate" : "Appoint Heir"}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Extra Action inside candidates block when you already have heirs but want to draft more */}
                        <div className="pt-4 border-t border-[#8b7355]/20 flex flex-col sm:flex-row justify-between items-center bg-[#2b1d0e]/5 p-3 rounded-xl border border-dashed border-[#8b7355]/30 gap-2">
                          <div className="text-left">
                            <h4 className="font-black text-[10px] text-[#2b1d0e] uppercase tracking-wide">Recruit Distant Blood-Kin</h4>
                            <p className="text-[9px] text-[#5d4037] opacity-80 max-w-sm">
                              Need a stronger pool of talent? Adopt a nephew or cousin (Age 15-20) from outlying pastures into the clan center for <span className="font-bold text-[#c57d21]">300г</span>.
                            </p>
                          </div>
                          <button
                            disabled={(character?.stats.wealth || 0) < 300}
                            onClick={handleDraftSuccessionKin}
                            className={`py-2 px-3.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all inline-flex items-center gap-1.5 shrink-0 ${
                              (character?.stats.wealth || 0) >= 300
                                ? 'bg-[#c5a021] text-[#2b1d0e] hover:brightness-110 cursor-pointer shadow-md'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            🐎 Adopt Cousin/Nephew (-300г)
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MenuOverlay 
        isOpen={showAdOptions} 
        onClose={() => setShowAdOptions(false)} 
        title="Silk Road Opportunities"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5d4037] mb-6 italic">
            "The travelers have come far from the sunset lands. They bring more than just silks; they bring wisdom, maps, and ancient secrets."
          </p>
          
          <button 
            id="ad-option-gold"
            onClick={() => handleAdReward('GOLD')}
            className="w-full bg-[#fdf8e1] p-4 rounded-xl border-2 border-[#c5a021] flex items-center gap-4 hover:bg-white transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 group-hover:scale-110 transition-transform shadow-inner">
              <Coins size={24} />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-[#2b1d0e]">Trade Expertise</div>
              <div className="text-xs text-[#5d4037]/60">Receive a substantial grant of 350г from successful trading tips.</div>
            </div>
          </button>

          <button 
            id="ad-option-vision"
            onClick={() => handleAdReward('VISION')}
            className="w-full bg-[#fdf8e1] p-4 rounded-xl border-2 border-[#c5a021] flex items-center gap-4 hover:bg-white transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform shadow-inner">
              <MapIcon size={24} />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-[#2b1d0e]">Geographic Intelligence</div>
              <div className="text-xs text-[#5d4037]/60">Reveal the hidden movements and territories of rival tribes (+Vision).</div>
            </div>
          </button>

          <button 
            id="ad-option-strength"
            onClick={() => handleAdReward('STRENGTH')}
            className="w-full bg-[#fdf8e1] p-4 rounded-xl border-2 border-[#c5a021] flex items-center gap-4 hover:bg-white transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 group-hover:scale-110 transition-transform shadow-inner">
              <Target size={24} />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-[#2b1d0e]">Martial Discipline</div>
              <div className="text-xs text-[#5d4037]/60">Learn advanced physical conditioning to permanently boost Strength & Health.</div>
            </div>
          </button>
        </div>
      </MenuOverlay>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 w-full parchment-texture border-t-2 border-[#c5a021] shadow-2xl z-[180] flex justify-center p-1 pb-2">
        <div className="w-full max-w-4xl flex">
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); setActiveTab(Tab.LIFE); setIsMenuOpen(false); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${activeTab === Tab.LIFE && !isMenuOpen ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Tent size={22} className={activeTab === Tab.LIFE && !isMenuOpen ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">🏠 Life</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.RELATIONSHIPS); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.RELATIONSHIPS ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Users size={22} className={isMenuOpen && activeTab === Tab.RELATIONSHIPS ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">👥 People</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.ACTIVITIES); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.ACTIVITIES ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Trophy size={22} className={isMenuOpen && activeTab === Tab.ACTIVITIES ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">🏹 Paths</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.ASSETS); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.ASSETS ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Coins size={22} className={isMenuOpen && activeTab === Tab.ASSETS ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">💰 Assets</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.CLAN); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.CLAN ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Briefcase size={22} className={isMenuOpen && activeTab === Tab.CLAN ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">🎖️ Rank</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.LIVESTOCK); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.LIVESTOCK ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Utensils size={22} className={isMenuOpen && activeTab === Tab.LIVESTOCK ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">🐎 Herds</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.MAP); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.MAP ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <MapIcon size={22} className={isMenuOpen && activeTab === Tab.MAP ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">🗺️ Map</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.DIPLOMACY); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.DIPLOMACY ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <Globe size={22} className={isMenuOpen && activeTab === Tab.DIPLOMACY ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">🌍 Tribes</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.HERITAGE); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.HERITAGE ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5 text-[#5d4037]'}`}
          >
            <ScrollText size={22} className={isMenuOpen && activeTab === Tab.HERITAGE ? 'text-[#c5a021]' : ''} />
            <span className="text-[10px] uppercase font-bold mt-1">📜 Legacy</span>
          </button>
          <button 
            onClick={() => { playClickSound(settings.sound); triggerVibration(30, settings.vibration); openMenu(Tab.PREMIUM); }}
            className={`flex-1 flex flex-col items-center py-3 transition-colors rounded-xl ${isMenuOpen && activeTab === Tab.PREMIUM ? 'bg-[#2b1d0e] text-[#e8dab2]' : 'hover:bg-black/5'}`}
          >
            <Sparkles size={22} className={activeTab === Tab.PREMIUM ? 'text-[#c5a021]' : 'text-[#c57d21]'} />
            <span className={`text-[10px] uppercase font-bold mt-1 ${activeTab === Tab.PREMIUM ? 'text-[#e8dab2]' : 'text-[#c57d21]'}`}>Premium</span>
          </button>
        </div>
      </div>
          </div>
          {settings.deviceShell && renderAndroidNavigationBar()}
        </div>
      </div>
    </div>
  );
}
