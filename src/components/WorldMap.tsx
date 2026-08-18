/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Character, TribeRelation } from '../types';
import { MapPin, Shield, Sword, Users } from 'lucide-react';

interface WorldMapProps {
  character: Character;
}

const TRIBE_COORDS: Record<string, { x: number; y: number }> = {
  'Khamag Mongol': { x: 50, y: 45 },
  'Kereid': { x: 35, y: 55 },
  'Naiman': { x: 20, y: 50 },
  'Merkid': { x: 45, y: 25 },
  'Tatar': { x: 75, y: 45 },
  'Tayichiud': { x: 60, y: 30 },
  'Jalayir': { x: 53, y: 53 },
  'Ongud': { x: 68, y: 65 },
  'Oirats': { x: 28, y: 35 },
  'Khongirad': { x: 72, y: 32 },
  'Buryats': { x: 50, y: 15 },
  'Uriankhai': { x: 38, y: 18 },
};

const KINGDOM_COORDS: Record<string, { x: number; y: number }> = {
  'Jin Dynasty': { x: 85, y: 70 },
  'Western Xia': { x: 65, y: 80 },
  'Kara-Khitan': { x: 15, y: 75 },
  'Khwarazmian Empire': { x: 5, y: 30 },
  'Sultanate of Delhi': { x: 30, y: 90 },
};

export const WorldMap: React.FC<WorldMapProps> = ({ character }) => {
  const { 
    tribeRelations, 
    conqueredTribes, 
    conqueredKingdoms = [], 
    kingdomRelations = [], 
    tribe: homeTribe, 
    stats, 
    weather, 
    visionBonus = 0 
  } = character;
  const perception = stats.perception || 50;
  
  // Base vision radius calculation
  const [pulse, setPulse] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const fluctuation = Math.sin(pulse) * 2;
  let baseRadius = 20 + (perception * 0.4) + visionBonus + fluctuation;
  
  // Weather modifiers
  let weatherColor = "rgba(43, 29, 14, 0.95)";
  let fogOpacity = 1;
  let weatherLabel = "Clear Skies";
  
  switch(weather) {
    case 'Overcast':
      baseRadius *= 0.8;
      weatherColor = "rgba(60, 60, 60, 0.95)";
      weatherLabel = "Overcast";
      break;
    case 'Dust Storm':
      baseRadius *= 0.4;
      weatherColor = "rgba(100, 80, 50, 0.98)";
      weatherLabel = "Dust Storm";
      break;
    case 'Snow':
      baseRadius *= 0.6;
      weatherColor = "rgba(200, 210, 220, 0.95)";
      weatherLabel = "Snowfall";
      break;
  }

  // Vision Beacons (Home + Conquered)
  const beacons = [
    { name: homeTribe, ...(TRIBE_COORDS[homeTribe] || { x: 50, y: 50 }), r: baseRadius * 1.5 },
    ...conqueredTribes.map(name => {
      const coords = TRIBE_COORDS[name] || KINGDOM_COORDS[name] || { x: 50, y: 50 };
      return { name, ...coords, r: baseRadius };
    }),
    ...conqueredKingdoms.map(name => ({ name, ...(KINGDOM_COORDS[name] || { x: 50, y: 50 }), r: baseRadius * 2 }))
  ];

  const allLocations = [
    ...Object.entries(TRIBE_COORDS).map(([name, coords]) => ({ name, coords, isKingdom: false })),
    ...Object.entries(KINGDOM_COORDS).map(([name, coords]) => ({ name, coords, isKingdom: true })),
  ];

  return (
    <div className="relative w-full aspect-[16/10] bg-[#e8dab2] rounded-2xl border-4 border-[#8b7355] shadow-xl overflow-hidden group">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")' }} />
      
      {/* Dynamic Background Effects (Weather) */}
      {weather === 'Snow' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 opacity-30 animate-pulse bg-white/20" />
        </div>
      )}
      {weather === 'Dust Storm' && (
        <motion.div 
          animate={{ x: [-10, 10, -10], y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 z-10 bg-amber-900/10 pointer-events-none backdrop-blur-[1px]" 
        />
      )}

      {/* Rivers & Mountains Decoration */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Mountains North */}
        <path d="M5,10 L15,0 L25,10 L35,0 L45,10 L55,0 L65,10" fill="none" stroke="#8b7355" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.6" />
        <path d="M80,20 L85,15 L90,20 L95,15" fill="none" stroke="#8b7355" strokeWidth="0.4" opacity="0.5" />
        
        {/* Major River */}
        <path d="M30,0 Q35,20 20,40 T30,70 T40,100" fill="none" stroke="#4a6fa5" strokeWidth="0.6" opacity="0.3" />
        <path d="M70,0 Q65,20 75,40 T85,60" fill="none" stroke="#4a6fa5" strokeWidth="0.4" opacity="0.2" />

        {/* Steppe Grass patches */}
        <g opacity="0.15" stroke="#5d4037" strokeWidth="0.1">
          <path d="M10,80 L12,78 L14,80 M11,82 L13,80 L15,82" />
          <path d="M80,85 L82,83 L84,85 M81,87 L83,85 L85,87" />
          <path d="M50,15 L52,13 L54,15" />
        </g>
      </svg>

      {/* Atmospheric Cloud Layer */}
      <motion.div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 40%)',
          backgroundSize: '200px 200px'
        }}
      />

      {/* FOG OF WAR MASKED SYSTEM */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask id="vision-mask">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {beacons.map((beacon, i) => (
              <radialGradient id={`grad-${i}`} key={i}>
                <stop offset="0%" stopColor="black" />
                <stop offset="60%" stopColor="black" />
                <stop offset="100%" stopColor="white" />
              </radialGradient>
            ))}
            {beacons.map((beacon, i) => (
              <circle 
                key={i} 
                cx={beacon.x} 
                cy={beacon.y} 
                r={beacon.r} 
                fill={`url(#grad-${i})`} 
              />
            ))}
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          fill={weatherColor} 
          mask="url(#vision-mask)" 
          className="transition-colors duration-1000"
        />
      </svg>

      {/* Location Markers */}
      {allLocations.map(({ name, coords, isKingdom }) => {
        const relation = isKingdom 
          ? kingdomRelations.find(r => r.name === name)
          : tribeRelations.find(r => r.name === name);
        
        const isConquered = isKingdom 
          ? conqueredKingdoms.includes(name)
          : conqueredTribes.includes(name);
          
        const isHome = homeTribe === name;
        
        // Calculate combined visibility from any beacon
        const isVisible = beacons.some(b => {
          const dx = coords.x - b.x;
          const dy = coords.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          return dist < b.r;
        });

        // Partially visible check (outer ring)
        const isPartiallyVisible = beacons.some(b => {
          const dx = coords.x - b.x;
          const dy = coords.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          return dist < b.r + 15;
        });

        if (!isVisible && !isPartiallyVisible && !isHome) return null;

        let markerColor = "#2b1d0e"; // Neutral
        if (isConquered) markerColor = "#c5a021"; // Vassal/Conquered
        else if (isHome) markerColor = "#166534"; // Home
        else if (relation?.level === 'At War') markerColor = "#991b1b"; // War
        else if (relation?.level === 'Allied') markerColor = "#1e40af"; // Allied
        else if (relation?.level === 'Friendly') markerColor = "#15803d"; // Friendly

        return (
          <motion.div
            key={name}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isVisible ? 1 : 0.8, 
              opacity: isVisible ? 1 : 0.4
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-help group/marker z-30"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            <div className="relative">
              <div 
                className={`${isKingdom ? 'w-7 h-7' : 'w-4 h-4'} rounded-full shadow-lg flex items-center justify-center border-2 border-[#e8dab2] transition-colors`}
                style={{ backgroundColor: markerColor }}
              >
                {isHome && <Users size={isKingdom ? 14 : 8} className="text-white" />}
                {isConquered && <Shield size={isKingdom ? 14 : 8} className="text-white" />}
                {relation?.level === 'At War' && <Sword size={isKingdom ? 14 : 8} className="text-white" />}
              </div>

              {/* Label */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span 
                  className={`text-[10px] font-bold font-display uppercase tracking-wider text-[#2b1d0e] bg-[#e8dab2]/80 px-1.5 rounded-sm transition-opacity ${isVisible ? 'opacity-100' : 'opacity-30'}`}
                >
                  {name} {isKingdom ? "👑" : ""}
                </span>
              </div>

              {/* Tooltip */}
              {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="parchment-texture p-3 rounded-lg border-2 border-[#8b7355] shadow-xl min-w-[150px]">
                    <div className="font-display text-sm text-[#2b1d0e] border-b border-[#8b7355]/20 mb-1">{name}</div>
                    <div className="text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="opacity-60">Status:</span>
                        <span className="font-bold" style={{ color: markerColor }}>
                          {isHome ? 'Home Tribe' : isConquered ? 'Vassal' : relation?.level || 'Neutral'}
                        </span>
                      </div>
                      {!isHome && !isConquered && (
                        <div className="flex justify-between">
                          <span className="opacity-60">Standing:</span>
                          <span className="font-bold">{relation?.standing || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Vision Status Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-40">
        <div className="flex items-center gap-2 bg-[#2b1d0e]/60 text-[#e8dab2] px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest backdrop-blur-sm border border-[#e8dab2]/20">
          <MapPin size={10} className="animate-pulse" />
          Vision: {Math.floor(perception)}%
        </div>
        <div className="flex items-center gap-2 bg-amber-900/60 text-[#e8dab2] px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest backdrop-blur-sm border border-[#e8dab2]/20">
          <div className="w-2 h-2 rounded-full animate-pulse bg-amber-400" />
          {weatherLabel}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 parchment-texture p-3 rounded-lg border border-[#8b7355]/30 text-[9px] font-bold space-y-1.5 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#166534]" /> <span>Your Clan Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c5a021]" /> <span>Conquered / Vassal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#991b1b]" /> <span>At War</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1e40af]" /> <span>Diplomatic Alliance</span>
        </div>
      </div>

      {/* Compass Rose */}
      <div className="absolute top-4 right-4 opacity-40">
        <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border border-[#2b1d0e] rounded-full" />
            <div className="absolute w-[1px] h-full bg-[#2b1d0e]" />
            <div className="absolute h-[1px] w-full bg-[#2b1d0e]" />
            <div className="text-[8px] font-bold absolute -top-1">N</div>
            <div className="text-[8px] font-bold absolute -bottom-1">S</div>
            <div className="text-[8px] font-bold absolute -left-1">W</div>
            <div className="text-[8px] font-bold absolute -right-1">E</div>
        </div>
      </div>
    </div>
  );
};
