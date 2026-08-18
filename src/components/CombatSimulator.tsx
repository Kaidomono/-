import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Trophy, Activity, ChevronRight, User, Skull, Heart } from 'lucide-react';
import { Combatant, Equipment, CombatOutcome, Character } from '../types';
import { simulateBattle, generateEnemy } from '../logic/gameEngine';

interface CombatSimulatorProps {
  character: Character;
  onClose: () => void;
  onComplete?: (outcome: CombatOutcome, difficulty: number) => void;
}

const WEAPONS: Equipment[] = [
  { id: 'w_simple', name: 'Hunting Bow', type: 'Weapon', attackBonus: 8, defenseBonus: 0, rarity: 'Common' },
  { id: 'w1', name: 'Curved Saber', type: 'Weapon', attackBonus: 12, defenseBonus: 2, rarity: 'Common' },
  { id: 'w_spear', name: 'Tribal Spearman\'s Pike', type: 'Weapon', attackBonus: 15, defenseBonus: 4, rarity: 'Common' },
  { id: 'w2', name: 'Composite Bow', type: 'Weapon', attackBonus: 18, defenseBonus: 0, rarity: 'Common' },
  { id: 'w_scimitar', name: 'Fine Scimitar', type: 'Weapon', attackBonus: 22, defenseBonus: 4, rarity: 'Rare' },
  { id: 'w3', name: 'Spear of the Khan', type: 'Weapon', attackBonus: 28, defenseBonus: 5, rarity: 'Rare' },
  { id: 'w_mace', name: 'Heavy Iron Mace', type: 'Weapon', attackBonus: 32, defenseBonus: 0, rarity: 'Rare' },
  { id: 'w_lance', name: 'War Lance', type: 'Weapon', attackBonus: 35, defenseBonus: 2, rarity: 'Epic' },
  { id: 'w_meteor', name: 'Meteor Hammer', type: 'Weapon', attackBonus: 42, defenseBonus: 8, rarity: 'Epic' },
  { id: 'w_dao', name: 'Imperial Dao', type: 'Weapon', attackBonus: 45, defenseBonus: 5, rarity: 'Epic' },
  { id: 'w4', name: 'Legendary Jade Blade', type: 'Weapon', attackBonus: 48, defenseBonus: 15, rarity: 'Legendary' },
  { id: 'w_soul', name: 'Soul of the Blue Sky', type: 'Weapon', attackBonus: 55, defenseBonus: 20, rarity: 'Legendary' },
];

const ARMORS: Equipment[] = [
  { id: 'a_felt', name: 'Felt Padding', type: 'Armor', attackBonus: 0, defenseBonus: 5, rarity: 'Common' },
  { id: 'a1', name: 'Boiled Leather', type: 'Armor', attackBonus: 0, defenseBonus: 10, rarity: 'Common' },
  { id: 'a_brigandine', name: 'Brigandine Vest', type: 'Armor', attackBonus: 2, defenseBonus: 12, rarity: 'Common' },
  { id: 'a_silk', name: 'Silk Under-Armor', type: 'Armor', attackBonus: 0, defenseBonus: 15, rarity: 'Rare' },
  { id: 'a2', name: 'Lamellar Armor', type: 'Armor', attackBonus: 0, defenseBonus: 22, rarity: 'Rare' },
  { id: 'a_helmet', name: 'Spiked Iron Helmet', type: 'Armor', attackBonus: 2, defenseBonus: 8, rarity: 'Rare' },
  { id: 'a3', name: 'Heirloom Chainmail', type: 'Armor', attackBonus: 5, defenseBonus: 40, rarity: 'Epic' },
  { id: 'a_tengri', name: 'Blessing of Tengri', type: 'Armor', attackBonus: 15, defenseBonus: 35, rarity: 'Epic' },
  { id: 'a_golden', name: 'Golden Horde Plate', type: 'Armor', attackBonus: 10, defenseBonus: 55, rarity: 'Legendary' },
];

const MOUNTS: Equipment[] = [
  { id: 'm_takhi', name: 'Wild Takhi', type: 'Mount', attackBonus: 3, defenseBonus: 3, rarity: 'Common' },
  { id: 'm1', name: 'Steppe Pony', type: 'Mount', attackBonus: 2, defenseBonus: 2, rarity: 'Common' },
  { id: 'm_yak', name: 'Highland Yak', type: 'Mount', attackBonus: 1, defenseBonus: 8, rarity: 'Common' },
  { id: 'm_camel', name: 'Desert Camel', type: 'Mount', attackBonus: 4, defenseBonus: 6, rarity: 'Common' },
  { id: 'm_yak_mighty', name: 'Mighty Yak', type: 'Mount', attackBonus: 6, defenseBonus: 18, rarity: 'Rare' },
  { id: 'm2', name: 'Northern War Horse', type: 'Mount', attackBonus: 12, defenseBonus: 12, rarity: 'Rare' },
  { id: 'm_don', name: 'Russian Don', type: 'Mount', attackBonus: 15, defenseBonus: 15, rarity: 'Rare' },
  { id: 'm_akhal', name: 'Akhal-Teke', type: 'Mount', attackBonus: 24, defenseBonus: 10, rarity: 'Rare' },
  { id: 'm_yak_war', name: 'Armored War-Yak', type: 'Mount', attackBonus: 15, defenseBonus: 35, rarity: 'Epic' },
  { id: 'm_charger', name: 'Khanate Charger', type: 'Mount', attackBonus: 22, defenseBonus: 20, rarity: 'Epic' },
  { id: 'm_white', name: 'Sacred White Mare', type: 'Mount', attackBonus: 15, defenseBonus: 45, rarity: 'Epic' },
  { id: 'm_black', name: 'Nightshade Stallion', type: 'Mount', attackBonus: 35, defenseBonus: 25, rarity: 'Epic' },
  { id: 'm3', name: 'Golden Spirit Stallion', type: 'Mount', attackBonus: 45, defenseBonus: 45, rarity: 'Legendary' },
  { id: 'm_thunder', name: 'Heavenly Steed', type: 'Mount', attackBonus: 60, defenseBonus: 30, rarity: 'Legendary' },
];

export const CombatSimulator: React.FC<CombatSimulatorProps> = ({ character, onClose, onComplete }) => {
  const [player, setPlayer] = useState<Combatant>({
    name: character.name,
    stats: {
      strength: (character.stats.strength || 0) * (0.9 + Math.random() * 0.2),
      skill: (((character.stats.archery || 0) + (character.stats.horseRiding || 0)) / 2) * (0.9 + Math.random() * 0.2),
      endurance: ((character.stats.health || 0) / 2 + 20) * (0.9 + Math.random() * 0.2),
    },
    equipment: {},
  });

  const [enemy, setEnemy] = useState<Combatant>(generateEnemy(1));
  const [difficulty, setDifficulty] = useState(1);
  const [outcome, setOutcome] = useState<CombatOutcome | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);

  const handleSimulate = () => {
    const res = simulateBattle(player, enemy);
    setOutcome(res);
    setIsSimulating(true);
    setCurrentTurn(0);
  };

  useEffect(() => {
    if (isSimulating && outcome && currentTurn < outcome.log.length) {
      const timer = setTimeout(() => {
        setCurrentTurn(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isSimulating && outcome && currentTurn >= outcome.log.length) {
      setIsSimulating(false);
    }
  }, [isSimulating, currentTurn, outcome]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-orange-600 border-orange-400 bg-orange-50';
      case 'Epic': return 'text-purple-600 border-purple-400 bg-purple-50';
      case 'Rare': return 'text-blue-600 border-blue-400 bg-blue-50';
      default: return 'text-slate-600 border-slate-300 bg-slate-50';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-orange-600 text-white';
      case 'Epic': return 'bg-purple-600 text-white';
      case 'Rare': return 'bg-blue-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const selectEquipment = (type: 'Weapon' | 'Armor' | 'Mount', item: Equipment) => {
    setPlayer(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [type.toLowerCase()]: item
      }
    }));
    setOutcome(null);
  };

  const getAttackPower = (c: Combatant) => {
    let power = c.stats.strength + c.stats.skill;
    if (c.equipment.weapon) power += c.equipment.weapon.attackBonus;
    if (c.equipment.mount) power += c.equipment.mount.attackBonus;
    return Math.floor(power);
  };

  const getDefensePower = (c: Combatant) => {
    let defense = (c.stats.skill * 0.8) + (c.stats.strength * 0.2);
    if (c.equipment.armor) defense += c.equipment.armor.defenseBonus;
    if (c.equipment.mount) defense += c.equipment.mount.defenseBonus;
    return Math.floor(defense);
  };

  const renderStatBox = (label: string, value: number, bonus: number = 0, color: 'brown' | 'red') => {
    const isRed = color === 'red';
    const safeValue = isNaN(value) ? 0 : value;
    return (
      <div className={`${isRed ? 'bg-red-50 border-red-200' : 'bg-white/50 border-[#c5a021]/10'} p-2 rounded-lg border`}>
        <p className={`text-[9px] uppercase font-bold ${isRed ? 'text-red-700' : 'text-[#5d4037]'}`}>{label}</p>
        <div className="flex items-center justify-center gap-1">
          <p className={`text-lg font-display ${isRed ? 'text-red-900' : 'text-[#2b1d0e]'}`}>{Math.floor(safeValue)}</p>
          {bonus > 0 && (
            <span className={`text-[10px] font-bold ${isRed ? 'text-red-600' : 'text-green-600'}`}>+{Math.floor(bonus)}</span>
          )}
        </div>
      </div>
    );
  };

  const getPenalties = (diff: number) => {
    return {
      health: 10 + (2 * diff),
      reputation: 2 * diff,
      happiness: 5
    };
  };

  const getRewards = (diff: number) => {
    return {
      reputation: 5 * diff,
      wealth: 20 * diff,
      strength: 1,
      archery: 1,
      horseRiding: 1
    };
  };

  const rewards = getRewards(difficulty);
  const penalties = getPenalties(difficulty);

  const handleFinish = () => {
    if (onComplete && outcome) {
      onComplete(outcome, difficulty);
    }
  };

  const winProbability = outcome?.probability || 0;

  const playerAttackBonus = (player.equipment.weapon?.attackBonus || 0) + (player.equipment.mount?.attackBonus || 0);
  const playerDefenseBonus = (player.equipment.armor?.defenseBonus || 0) + (player.equipment.mount?.defenseBonus || 0);
  const enemyAttackBonus = (enemy.equipment.weapon?.attackBonus || 0) + (enemy.equipment.mount?.attackBonus || 0);
  const enemyDefenseBonus = (enemy.equipment.armor?.defenseBonus || 0) + (enemy.equipment.mount?.defenseBonus || 0);

  return (
    <div className="flex flex-col h-full bg-[#f4e4bc] p-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center bg-[#2b1d0e] text-[#e8dab2] p-4 rounded-xl shadow-lg border border-[#c5a021]/50">
        <h2 className="text-2xl font-display uppercase tracking-widest flex items-center gap-3">
          <Sword className="text-[#c5a021]" /> Combat Simulator
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronRight className="rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PLAYER SETUP */}
        <div className="space-y-4 parchment-texture p-5 rounded-2xl border border-[#c5a021]/30 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#2b1d0e] rounded-full flex items-center justify-center border-2 border-[#c5a021]">
              <User size={24} className="text-[#c5a021]" />
            </div>
            <div>
              <h3 className="font-bold text-[#2b1d0e]">{player.name}</h3>
              <p className="text-[10px] uppercase font-bold text-[#c57d21]">Your Champion</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            {renderStatBox('Strength', Math.floor(player.stats.strength), 0, 'brown')}
            {renderStatBox('Skill', Math.floor(player.stats.skill), 0, 'brown')}
            {renderStatBox('Health', Math.floor(player.stats.endurance * 10), 0, 'brown')}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#2b1d0e] p-3 rounded-xl border border-[#c5a021]/30 text-center">
              <p className="text-[10px] uppercase font-bold text-[#c5a021]/70 mb-1">Total Attack</p>
              <div className="flex items-center justify-center gap-2">
                <Sword size={16} className="text-[#c5a021]" />
                <span className="text-2xl font-display text-[#e8dab2]">{getAttackPower(player)}</span>
              </div>
              <p className="text-[9px] text-[#e8dab2]/50 mt-1">Base {Math.floor(player.stats.strength + player.stats.skill)} + Gear {playerAttackBonus}</p>
            </div>
            <div className="bg-[#2b1d0e] p-3 rounded-xl border border-[#c5a021]/30 text-center">
              <p className="text-[10px] uppercase font-bold text-[#c5a021]/70 mb-1">Total Defense</p>
              <div className="flex items-center justify-center gap-2">
                <Shield size={16} className="text-[#c5a021]" />
                <span className="text-2xl font-display text-[#e8dab2]">{getDefensePower(player)}</span>
              </div>
              <p className="text-[9px] text-[#e8dab2]/50 mt-1">Base {Math.floor(player.stats.skill)} + Gear {playerDefenseBonus}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#c57d21] flex items-center gap-2">
              <Sword size={12} /> Armory
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#5d4037] mb-1">Weapons</p>
                <div className="flex flex-wrap gap-2">
                  {WEAPONS.map(w => (
                    <button
                      key={w.id}
                      onClick={() => selectEquipment('Weapon', w)}
                      className={`px-3 py-1.5 text-[10px] rounded-lg border transition-all flex flex-col items-start gap-0.5 ${
                        player.equipment.weapon?.id === w.id 
                          ? 'bg-[#2b1d0e] text-[#e8dab2] border-[#c5a021] ring-2 ring-[#c5a021]/50' 
                          : 'bg-white/50 border-[#c5a021]/30 hover:border-[#c5a021]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-bold">{w.name}</span>
                        <span className={`px-1 rounded-[2px] text-[7px] font-black uppercase ${getRarityBadge(w.rarity)}`}>
                          {w.rarity}
                        </span>
                      </div>
                      <span className="opacity-70">Attack +{w.attackBonus}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5d4037] mb-1">Armor</p>
                <div className="flex flex-wrap gap-2">
                  {ARMORS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => selectEquipment('Armor', a)}
                      className={`px-3 py-1.5 text-[10px] rounded-lg border transition-all flex flex-col items-start gap-0.5 ${
                        player.equipment.armor?.id === a.id 
                          ? 'bg-[#2b1d0e] text-[#e8dab2] border-[#c5a021] ring-2 ring-[#c5a021]/50' 
                          : 'bg-white/50 border-[#c5a021]/30 hover:border-[#c5a021]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-bold">{a.name}</span>
                        <span className={`px-1 rounded-[2px] text-[7px] font-black uppercase ${getRarityBadge(a.rarity)}`}>
                          {a.rarity}
                        </span>
                      </div>
                      <span className="opacity-70">Defense +{a.defenseBonus}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5d4037] mb-1">Mounts</p>
                <div className="flex flex-wrap gap-2">
                  {MOUNTS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => selectEquipment('Mount', m)}
                      className={`px-3 py-1.5 text-[10px] rounded-lg border transition-all flex flex-col items-start gap-0.5 ${
                        player.equipment.mount?.id === m.id 
                          ? 'bg-[#2b1d0e] text-[#e8dab2] border-[#c5a021] ring-2 ring-[#c5a021]/50' 
                          : 'bg-white/50 border-[#c5a021]/30 hover:border-[#c5a021]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-bold">{m.name}</span>
                        <span className={`px-1 rounded-[2px] text-[7px] font-black uppercase ${getRarityBadge(m.rarity)}`}>
                          {m.rarity}
                        </span>
                      </div>
                      <span className="opacity-70">+{m.attackBonus}A / +{m.defenseBonus}D</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENEMY SETUP */}
        <div className="space-y-4 parchment-texture p-5 rounded-2xl border border-[#c5a021]/30 shadow-sm opacity-90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-900 rounded-full flex items-center justify-center border-2 border-red-500">
                <Skull size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-red-900">{enemy.name}</h3>
                <p className="text-[10px] uppercase font-bold text-red-600">Level {difficulty} Challenger</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const newDiff = difficulty + 1;
                setDifficulty(newDiff);
                setEnemy(generateEnemy(newDiff));
                setOutcome(null);
              }}
              className="px-3 py-1 bg-red-900 text-white text-[10px] font-bold rounded-lg hover:bg-red-800 transition-colors"
            >
              UP DIFFICULTY
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            {renderStatBox('Strength', enemy.stats.strength, 0, 'red')}
            {renderStatBox('Skill', enemy.stats.skill, 0, 'red')}
            {renderStatBox('Health', enemy.stats.endurance * 10, 0, 'red')}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-950 p-3 rounded-xl border border-red-500/30 text-center">
              <p className="text-[10px] uppercase font-bold text-red-500/70 mb-1">Total Attack</p>
              <div className="flex items-center justify-center gap-2">
                <Sword size={16} className="text-red-500" />
                <span className="text-2xl font-display text-red-100">{getAttackPower(enemy)}</span>
              </div>
              <p className="text-[9px] text-red-100/50 mt-1">Base {Math.floor(enemy.stats.strength + enemy.stats.skill)} + Gear {enemyAttackBonus}</p>
            </div>
            <div className="bg-red-950 p-3 rounded-xl border border-red-500/30 text-center">
              <p className="text-[10px] uppercase font-bold text-red-500/70 mb-1">Total Defense</p>
              <div className="flex items-center justify-center gap-2">
                <Shield size={16} className="text-red-500" />
                <span className="text-2xl font-display text-red-100">{getDefensePower(enemy)}</span>
              </div>
              <p className="text-[9px] text-red-100/50 mt-1">Base {Math.floor(enemy.stats.skill)} + Gear {enemyDefenseBonus}</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-[10px] uppercase font-bold text-[#5d4037]">Equipment Spotted</p>
            <div className="flex flex-wrap gap-2">
              {enemy.equipment.weapon && (
                <div className={`px-2 py-1 rounded text-[9px] font-bold border flex flex-col ${getRarityColor(enemy.equipment.weapon.rarity)}`}>
                  <span className="text-[7px] uppercase opacity-70">Weapon ({enemy.equipment.weapon.rarity})</span>
                  {enemy.equipment.weapon.name}
                </div>
              )}
              {enemy.equipment.armor && (
                <div className={`px-2 py-1 rounded text-[9px] font-bold border flex flex-col ${getRarityColor(enemy.equipment.armor.rarity)}`}>
                  <span className="text-[7px] uppercase opacity-70">Armor ({enemy.equipment.armor.rarity})</span>
                  {enemy.equipment.armor.name}
                </div>
              )}
              {enemy.equipment.mount && (
                <div className={`px-2 py-1 rounded text-[9px] font-bold border flex flex-col ${getRarityColor(enemy.equipment.mount.rarity)}`}>
                  <span className="text-[7px] uppercase opacity-70">Mount ({enemy.equipment.mount.rarity})</span>
                  {enemy.equipment.mount.name}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-red-200 text-center">
            <button 
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full py-4 bg-red-950 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 border border-red-500/30 disabled:opacity-50"
            >
              {isSimulating ? 'SIMULATING...' : 'COMMENCE TRIAL BY COMBAT'}
              <Sword size={20} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* OUTCOME & PROBABILITY */}
      <AnimatePresence>
        {outcome && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#2b1d0e] p-6 rounded-2xl border border-[#c5a021]/40 flex flex-col items-center justify-center text-center">
                <Trophy size={48} className="text-[#c5a021] mb-2" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#c5a021]/70 mb-1">Win Probability</p>
                <h4 className="text-4xl font-display text-[#e8dab2]">{winProbability}%</h4>
                <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${winProbability}%` }}
                    className={`h-full ${winProbability > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>

              <div className="md:col-span-2 parchment-texture p-6 rounded-2xl border border-[#c5a021]/30 max-h-[400px] overflow-y-auto shadow-inner">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#5d4037] mb-6 flex items-center gap-2 sticky top-0 bg-[#f4e4bc]/80 backdrop-blur-sm py-2">
                  <Activity size={16} /> Battle Log
                </h4>
                <div className="space-y-3">
                  {outcome.log.slice(0, currentTurn).map((entry, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-4 p-3 rounded-xl border ${entry.attacker === player.name ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${entry.attacker === player.name ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-red-500 shadow-[0_0_8px_red]'}`} />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Turn {entry.turn}</p>
                        <p className="text-sm text-[#2b1d0e]">{entry.message}</p>
                      </div>
                    </motion.div>
                  ))}
                  {currentTurn >= outcome.log.length && (
                      <div className={`mt-6 p-6 rounded-2xl text-center border-2 ${outcome.winner === player.name ? 'bg-green-500/10 border-green-500 text-green-900' : 'bg-red-500/10 border-red-500 text-red-900'}`}>
                        <Trophy size={32} className="mx-auto mb-2" />
                        <h3 className="text-2xl font-display uppercase tracking-widest">
                          {outcome.winner === player.name ? 'VICTORY' : 'DEFEAT'}
                        </h3>
                        <p className="text-sm font-bold opacity-80">
                          {outcome.winner === player.name 
                            ? 'Your champion stood defiant upon the bloodstained steppe.' 
                            : 'Weakness was your undoing. Train harder, warrior.'}
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-black/10">
                          <p className="text-[10px] uppercase font-bold mb-2">Consequences</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {outcome.winner === player.name ? (
                              <>
                                <span className="px-2 py-1 bg-green-200 rounded text-[10px] font-bold">+{rewards.reputation} Rep</span>
                                <span className="px-2 py-1 bg-green-200 rounded text-[10px] font-bold">+{rewards.wealth}г Wealth</span>
                                <span className="px-2 py-1 bg-green-200 rounded text-[10px] font-bold">+1 Strength</span>
                                <span className="px-2 py-1 bg-green-200 rounded text-[10px] font-bold">+1 Skill</span>
                              </>
                            ) : (
                              <>
                                <span className="px-2 py-1 bg-red-200 rounded text-[10px] font-bold">-{penalties.health} Health</span>
                                <span className="px-2 py-1 bg-red-200 rounded text-[10px] font-bold">-{penalties.reputation} Rep</span>
                                <span className="px-2 py-1 bg-red-200 rounded text-[10px] font-bold">-{penalties.happiness} Happy</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={handleFinish}
                          className={`w-full mt-6 py-3 rounded-xl font-bold uppercase transition-all ${outcome.winner === player.name ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                          {outcome.winner === player.name ? 'Claim Rewards & Return' : 'Accept Defeat & Return'}
                        </button>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
