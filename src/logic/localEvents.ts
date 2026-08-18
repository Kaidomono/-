/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameEvent, Character, CharacterStats, MarketCondition, Gender, SocialClass } from "../types";
import { MONGOL_NAMES_MALE, MONGOL_NAMES_FEMALE } from "../constants";
import { getNomadAvatar } from "./gameEngine";

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

const LOCAL_SUMMARIES = [
  "A peaceful year on the steppe.",
  "You spent the winter huddling for warmth.",
  "The herds grew slightly this spring.",
  "You practiced your riding skills under the summer sun.",
  "Autumn brought cold winds and more preparation for winter.",
  "You shared many meals with your kin.",
  "The tribe moved to new grazing lands.",
  "You spent time repairing gear and sharpening arrows.",
  "The night sky was particularly clear this season.",
  "You helped milk the mares during the foaling season.",
];

export function getRandomLocalSummary(): string {
  return LOCAL_SUMMARIES[Math.floor(Math.random() * LOCAL_SUMMARIES.length)];
}

interface RawEvent {
  title: string;
  description: string;
  minAge: number;
  maxAge?: number;
  condition?: (char: Character) => boolean;
  choices: {
    text: string;
    storySnippet: string;
    effect?: (char: Character) => Partial<CharacterStats>;
    customEffect?: (char: Character) => Character;
  }[];
}

const EVENT_POOL: RawEvent[] = [
  {
    title: "🐐 A Stray Goat",
    description: "You found a stray goat far from the herd. What do you do?",
    minAge: 4,
    maxAge: 10,
    choices: [
      { text: "🏠 Bring it back to the flock", storySnippet: "Your father praised your diligence.", effect: () => ({ loyalty: 5, reputation: 2 }) },
      { text: "🏇 Try to ride it", storySnippet: "The goat bucked you into the mud. You look ridiculous.", effect: () => ({ health: -5, reputation: -2 }) }
    ]
  },
  {
    title: "🤼 The Wrestler",
    description: "A boy from a rival clan challenges you to a wrestling match.",
    minAge: 6,
    maxAge: 16,
    choices: [
      { text: "💪 Accept the challenge", storySnippet: "You fought hard. Win or lose, you gained respect.", effect: () => ({ strength: 5, reputation: 5 }) },
      { text: "🚶 Walk away", storySnippet: "He calls you a coward.", effect: () => ({ intelligence: 2, reputation: -5 }) }
    ]
  },
  {
    title: "🐎 First Pony",
    description: "Your father offers you your first real mount. The pony is spirited and small.",
    minAge: 3,
    maxAge: 6,
    choices: [
      { text: "🎠 Mount with courage", storySnippet: "You gripped the mane tight and felt the wind.", effect: () => ({ horseRiding: 10, reputation: 5 }) },
      { text: "😟 Hesitate", storySnippet: "Your father sighing, helps you up gently.", effect: () => ({ intelligence: 2 }) }
    ]
  },
  {
    title: "🏹 The Great Hunt",
    description: "The tribe organizes a massive 'Nerge' hunt. You are assigned a position on the wing.",
    minAge: 14,
    choices: [
      { text: "🛡️ Maintain the circle perfectly", storySnippet: "Your discipline was noticed by the captains.", effect: () => ({ leadership: 5, discipline: 5 }) },
      { text: "🏇 Gallop ahead for the first kill", storySnippet: "You brought down a buck, but left a gap in the line.", effect: () => ({ archery: 10, reputation: 10, leadership: -5 }) }
    ]
  },
  {
    title: "⛈️ Distant Thunder",
    description: "Steam rises from the horses' coats as a massive storm rolls across the plateau. The Shaman says the Sky Father is angry.",
    minAge: 10,
    choices: [
      { text: "✨ Perform a ritual offering", storySnippet: "You felt a sense of peace amidst the chaos.", effect: () => ({ loyalty: 5, intelligence: 5 }) },
      { text: "🐎 Calm the panicked horses", storySnippet: "Your steady hand kept the herd together.", effect: () => ({ horseRiding: 8, strength: 2 }) }
    ]
  },
  {
    title: "🐪 Silk Road Caravan",
    description: "A caravan of merchants from the far south passes near your camp. They have strange goods and stranger stories.",
    minAge: 12,
    choices: [
      { text: "📖 Listen to their tales", storySnippet: "Your mind expanded as you heard of stone cities and spice seas.", effect: () => ({ intelligence: 10 }) },
      { text: "💰 Trade some furs for iron", storySnippet: "A fair trade. Your equipment is now of better quality.", effect: () => ({ wealth: 50, strength: 5 }) }
    ]
  },
  {
    title: "⚔️ The Iron Banner",
    description: "A group of masterless warriors approach your camp, seeking a strong leader to follow.",
    minAge: 18,
    condition: (char) => char.stats.reputation > 50 && char.stats.wealth > 500,
    choices: [
      { 
        text: "📜 Take them into your service", 
        storySnippet: "They swear a blood oath. Fifty veteran blades join your banner.", 
        effect: () => ({ wealth: -200, reputation: 15 }),
        customEffect: (char) => ({ ...char, hordeSize: char.hordeSize + 50, militaryPower: char.militaryPower + 100 })
      },
      { 
        text: "✋ Politely decline", 
        storySnippet: "They move on, seeking another captain.", 
        effect: () => ({ intelligence: 2 }) 
      }
    ]
  },
  {
    title: "🐎 Master of Horse",
    description: "An expert horse breeder offers you prime mounts from the western plains.",
    minAge: 16,
    choices: [
      { 
        text: "💰 Purchase the herd", 
        storySnippet: "Your cavalry is now the envy of the steppe.", 
        effect: () => ({ wealth: -500, horseRiding: 10 }),
        customEffect: (char) => ({ ...char, livestock: { ...char.livestock, horses: char.livestock.horses + 20 } })
      },
      { text: "❌ Too expensive", storySnippet: "You stick with your current stock.", effect: () => ({}) }
    ]
  },
  {
    title: "⚖️ Tribal Dispute",
    description: "Two families are arguing over a watering hole. The atmosphere is tense.",
    minAge: 20,
    choices: [
      { text: "🤝 Mediate the conflict", storySnippet: "Your fair words prevented bloodshed today.", effect: () => ({ leadership: 10, reputation: 10 }) },
      { text: "🩸 Side with your own kin", storySnippet: "Blood is thicker than water. Your family's loyalty is secured.", effect: () => ({ loyalty: 15, reputation: -5 }) }
    ]
  },
  {
    title: "🌙 Ambush in the Night",
    description: "The dogs bark. Shadows move near the horse lines. Merit-seekers from the West have come to raid.",
    minAge: 16,
    choices: [
      { 
        text: "🏹 Sound the alarm and draw your bow", 
        storySnippet: "Your arrows found their marks in the dark. You drove them off before they could make off with many animals, but 5 sheep were taken in the chaos.", 
        effect: () => ({ archery: 10, leadership: 5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: Math.max(0, char.livestock.sheep - 5)
          }
        })
      },
      { 
        text: "⚔️ Charge into the fray with a blade", 
        storySnippet: "It was a bloody, desperate fight on foot. You slew their champion, but while you fought, they managed to steal 2 horses and 3 sheep.", 
        effect: () => ({ strength: 10, health: -15, reputation: 15 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            horses: Math.max(0, char.livestock.horses - 2),
            sheep: Math.max(0, char.livestock.sheep - 3)
          }
        })
      },
      {
        text: "🛡️ Defend the main yurts and protect the families",
        storySnippet: "You guarded the women and children. The raiders plundered your outer pastures, stealing 4 horses, 8 sheep, and 2 cattle.",
        effect: () => ({ loyalty: 15, perception: 5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            horses: Math.max(0, char.livestock.horses - 4),
            sheep: Math.max(0, char.livestock.sheep - 8),
            cattle: Math.max(0, char.livestock.cattle - 2)
          }
        })
      }
    ]
  },
  {
    title: "🌅 The Path Ahead",
    description: "The elders gather the youth for the Rite of Passage. You must choose which path you will follow on the great steppe.",
    minAge: 12,
    maxAge: 13,
    condition: (char) => char.role === 'Child',
    choices: [
      { 
        text: "⚔️ The Way of the Warrior", 
        storySnippet: "You took up the composite bow and the curved blade. Your life will be one of steel and conquest.", 
        effect: () => ({ strength: 10, archery: 10, reputation: 10 }),
        customEffect: (char) => ({ ...char, role: 'War-Ready Youth' })
      },
      { 
        text: "💰 The Way of the Merchant", 
        storySnippet: "You chose to study the routes of the Silk Road and the value of goods. Wealth will be your weapon.", 
        effect: () => ({ intelligence: 10, wealth: 200 }),
        customEffect: (char) => ({ ...char, role: 'Apprentice Trader' })
      },
      { 
        text: "✨ The Way of the Shaman", 
        storySnippet: "You spent the night alone on the peak, listening to the spirits of the wind. You have seen the unseen.", 
        effect: () => ({ intelligence: 15, loyalty: 10 }),
        customEffect: (char) => ({ ...char, role: 'Tengri-Seeker' })
      }
    ]
  },
  {
    title: "🎖️ Adulthood",
    description: "You have reached the age of eighteen years. It is time to be recognized as a full member of the tribe.",
    minAge: 18,
    maxAge: 19,
    condition: (char) => char.role === 'Child' || char.role === 'Infant',
    choices: [
      { 
        text: "⛺ Become a Nomad", 
        storySnippet: "You are now a respected member of the clan, tending to the herds and protecting the yurt.", 
        effect: () => ({ reputation: 5, horseRiding: 5 }),
        customEffect: (char) => ({ ...char, role: 'Nomad' })
      }
    ]
  },
  {
    title: "The Blacksmith's Pact",
    description: "A master blacksmith of the Khamag Mongol offers his eldest daughter in marriage. He promises a dowry not of silver, but of hardened iron and master-crafted stirrups.",
    minAge: 18,
    maxAge: 35,
    condition: (char) => !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "Accept the Iron Dowry", 
        storySnippet: "Your warriors are now equipped with the finest blades and stirrups. The clan's strength is undeniable.", 
        effect: () => ({ strength: 15, wealth: 100, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 500,
          relationships: [
            ...char.relationships,
            { 
              id: generateId(),
              name: "Saran (Smith)", 
              type: "Spouse", 
              loyalty: 90, 
              status: "Active", 
              clan: "Khamag Mongol",
              isMarriageAlliance: true,
              traits: ["Loyal", "Hardworking"],
              age: 20
            }
          ]
        })
      },
      { 
        text: "Decline the Offer", 
        storySnippet: "You seek a more noble connection. The blacksmith looks insulted.", 
        effect: () => ({ reputation: -5, intelligence: 2 }) 
      }
    ]
  },
  {
    title: "The Jin Scholar's Kin",
    description: "A former official from the Jin Dynasty, now living among the nomads, offers his ward. She is learned in the ways of administration and medicine.",
    minAge: 18,
    maxAge: 40,
    condition: (char) => !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "Value Knowledge over Steel", 
        storySnippet: "She helps organize your household records and treats the sick. Your influence grows through order and wisdom.", 
        effect: () => ({ intelligence: 20, health: 10, reputation: 5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 300,
          relationships: [
            ...char.relationships,
            { 
              name: "Lin (Scholar)", 
              type: "Spouse", 
              loyalty: 75, 
              status: "Active", 
              clan: "Jin Expatriates",
              isMarriageAlliance: true,
              traits: ["Wise", "Elegant"]
            }
          ]
        })
      },
      { 
        text: "Decline a 'Soft' Marriage", 
        storySnippet: "Knowledge is for those who live in stone houses. You need a partner for the steppe.", 
        effect: () => ({ strength: 5 }) 
      }
    ]
  },
  {
    title: "A Strategic Widow",
    description: "The widow of a fallen Merkit chief seeks a new husband to protect her herds. Marrying her would unify two fractured clans, but her ambition is well-known.",
    minAge: 20,
    maxAge: 50,
    condition: (char) => char.gender === 'Male' && !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "Seize the Merkit Herds", 
        storySnippet: "You gain immediate control over hundreds of horses and cattle. However, her former kin watch you with suspicion.", 
        effect: () => ({ wealth: 800, leadership: 15, happiness: -5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 3000,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Merkit' ? { ...rel, level: 'Friendly', standing: rel.standing + 50 } : rel
          ),
          relationships: [
            ...char.relationships,
            { 
              name: "Gua (Chief's Widow)", 
              type: "Spouse", 
              loyalty: 50, 
              status: "Active", 
              clan: "Merkit",
              isMarriageAlliance: true,
              traits: ["Ambitious", "Deceitful"]
            }
          ]
        })
      },
      { 
        text: "Avoid the Feud", 
        storySnippet: "The Merkit's internal struggles are not yours to solve. You decline the union.", 
        effect: () => ({ intelligence: 10, reputation: 5 }) 
      }
    ]
  },
  {
    title: "🐑 The Shepherd's Daughter",
    description: "While traveling, you meet a spirited shepherdess from a poor but honest family. She has no dowry and her status is low, but your heart is stirred.",
    minAge: 16,
    maxAge: 25,
    condition: (char) => !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "❤️ Marry for Love", 
        storySnippet: "You pay a small bride price to her grateful father. The clan elders whisper of your 'waste', but your yurt is full of laughter.", 
        effect: () => ({ happiness: 40, reputation: -15, wealth: -50 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 100,
          relationships: [
            ...char.relationships,
            { 
              name: "Oyun", 
              type: "Spouse", 
              loyalty: 100, 
              status: "Active", 
              clan: char.tribe,
              isMarriageAlliance: false,
              traits: ["Loyal", "Kind"]
            }
          ]
        })
      },
      { 
        text: "🛡️ Duty over Desire", 
        storySnippet: "You cannot afford a marriage that brings no power to your lineage. You ride on.", 
        effect: () => ({ leadership: 5, happiness: -15 }) 
      }
    ]
  },
  {
    title: "💍 Marriage Choice",
    description: "Your family and elders have narrow down two potential candidates for a marriage alliance. Each brings different strengths to your future.",
    minAge: 18,
    maxAge: 30,
    condition: (char) => !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "💰 Marry the daughter of the Merchant Guild", 
        storySnippet: "She brings a massive dowry rich in silver and silk. The clan treasury overflows.", 
        effect: () => ({ wealth: 500, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 1500,
          relationships: [
            ...char.relationships,
            { 
              name: "Enebish", 
              type: "Spouse", 
              loyalty: 80, 
              status: "Active", 
              clan: "Sartuul",
              isMarriageAlliance: true,
              traits: ["Greedy", "Wise"]
            }
          ]
        })
      },
      { 
        text: "🏹 Marry the daughter of the Great Archer", 
        storySnippet: "An alliance of blood and steel. Your family pays a modest bride price, but your fame grows across the realm.", 
        effect: () => ({ archery: 15, reputation: 25, realmReputation: 5, wealth: -100 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 200,
          relationships: [
            ...char.relationships,
            { 
              name: "Naran", 
              type: "Spouse", 
              loyalty: 85, 
              status: "Active", 
              clan: "Kiyat",
              isMarriageAlliance: true,
              traits: ["Brave", "Loyal"]
            }
          ]
        })
      }
    ]
  },
  {
    title: "👰 A Second Wife",
    description: "As your reputation and wealth grow, your advisors suggest taking a second wife to further your lineage and clan connections.",
    minAge: 25,
    maxAge: 50,
    condition: (char) => char.gender === 'Male' && char.relationships.filter(r => r.type === 'Spouse').length === 1 && char.stats.wealth > 1000 && char.stats.reputation > 50,
    choices: [
      { 
        text: "💍 Take a Second Wife", 
        storySnippet: "You paid a significant bride price to the Merkit tribal elders. Your household and influence grow.", 
        effect: () => ({ wealth: -500, reputation: 15, leadership: 5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 1000,
          relationships: [
            ...char.relationships,
            { 
              name: "Khulan", 
              type: "Second Wife", 
              loyalty: 60, 
              status: "Active", 
              clan: "Merkit",
              isMarriageAlliance: true,
              traits: ["Ambitious", "Envious"]
            }
          ]
        })
      },
      { 
        text: "🤝 Remain with one wife", 
        storySnippet: "You decide against the tradition, focusing your devotion on your first wife.", 
        effect: () => ({ intelligence: 5 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.map(r => r.type === 'Spouse' ? { ...r, loyalty: Math.min(100, r.loyalty + 20) } : r)
        })
      }
    ]
  },
  {
    title: "👶 Birth of a Sacred Son",
    description: "The air hums with anticipation as your firstborn enters the world. The Shamans speak of great omens in the sky Father's gaze.",
    minAge: 17,
    maxAge: 40,
    condition: (char) => char.children === 0 && char.relationships.some(r => r.type === 'Spouse' || r.type === 'Second Wife') && Math.random() < 0.15,
    choices: [
      { 
        text: "🍖 Host a Grand Naming Ceremony", 
        storySnippet: "You invite all the nearby clans to a massive feast. The child is named after your legendary grandfather. The tribe looks on with renewed hope.", 
        effect: () => ({ reputation: 25, wealth: -200, happiness: 15 }),
        customEffect: (char) => {
          const isMale = Math.random() > 0.5;
          const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
          const name = names[Math.floor(Math.random() * names.length)];
          return {
            ...char,
            children: (Number(char.children) || 0) + 1,
            stats: { ...char.stats, reputation: char.stats.reputation + 25, wealth: char.stats.wealth - 200, happiness: char.stats.happiness + 15 },
            relationships: [
              ...char.relationships,
              { 
                name: `${name} (Firstborn)`, 
                type: "Child", 
                loyalty: 100, 
                status: "Active", 
                clan: char.clan,
                traits: ["Brave", "Loyal"]
              }
            ]
          };
        }
      },
      { 
        text: "✨ Seek a Shaman's Blessing", 
        storySnippet: "The Shaman performs the ancient rites, declaring the child has the spirit of a lion. Your influence with the spirit world grows.", 
        effect: () => ({ intelligence: 10, reputation: 10, happiness: 10 }),
        customEffect: (char) => {
          const isMale = Math.random() > 0.5;
          const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
          const name = names[Math.floor(Math.random() * names.length)];
          return {
            ...char,
            children: (Number(char.children) || 0) + 1,
            stats: { ...char.stats, intelligence: char.stats.intelligence + 10, reputation: char.stats.reputation + 10, happiness: char.stats.happiness + 10 },
            relationships: [
              ...char.relationships,
              { 
                name: `${name} (Gifted)`, 
                type: "Child", 
                loyalty: 100, 
                status: "Active", 
                clan: char.clan,
                traits: ["Wise", "Kind"]
              }
            ]
          };
        }
      }
    ]
  },
  {
    title: "🍼 The Legacy Continues",
    description: "Another child is born to your household. The yurt is becoming crowded with the sounds of a growing lineage.",
    minAge: 18,
    maxAge: 45,
    condition: (char) => char.children > 0 && char.relationships.some(r => r.type === 'Spouse' || r.type === 'Second Wife') && Math.random() < 0.1,
    choices: [
      {
        text: "🍖 Host a Great Tribal Celebration",
        storySnippet: "A day of wrestling and horse racing marks the birth. You distribute silks and horses to the elders, securing their favor.",
        effect: () => ({ reputation: 25, happiness: 15, wealth: -150 }),
        customEffect: (char) => {
          const isMale = Math.random() > 0.5;
          const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
          const name = names[Math.floor(Math.random() * names.length)];
          return {
            ...char,
            children: (Number(char.children) || 0) + 1,
            stats: { ...char.stats, reputation: char.stats.reputation + 25, happiness: char.stats.happiness + 15, wealth: char.stats.wealth - 150 },
            relationships: [
              ...char.relationships,
              { name, type: "Child", loyalty: 100, status: "Active", clan: char.clan, traits: [isMale ? "Vibrant" : "Kind"] }
            ]
          };
        }
      },
      {
        text: "✨ Perform the Naming Ceremony",
        storySnippet: "The child's birth is marked by a solar eclipse. The Shamans are divided on its meaning, but the child seems unusually perceptive.",
        effect: () => ({ intelligence: 10, health: -5, happiness: 5 }),
        customEffect: (char) => {
          const isMale = Math.random() > 0.5;
          const name = (isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE)[0];
          return {
            ...char,
            children: (Number(char.children) || 0) + 1,
            stats: { ...char.stats, intelligence: char.stats.intelligence + 10, health: char.stats.health - 5, happiness: char.stats.happiness + 5 },
            relationships: [
              ...char.relationships,
              { name, type: "Child", loyalty: 100, status: "Active", clan: char.clan, traits: ["Wise", "Enigmatic"] }
            ]
          };
        }
      }
    ]
  },
  {
    title: "🔥 A Wife's Ambition",
    description: "One of your wives has been seen meeting secretly with elders from a rival clan. Her eyes hold a fire that makes you uneasy.",
    minAge: 20,
    condition: (char) => char.relationships.some(r => (r.type === 'Spouse' || r.type === 'Second Wife') && r.traits?.includes('Ambitious') && r.loyalty < 50),
    choices: [
      {
        text: "🗣️ Confront Her Directly",
        storySnippet: "She mocks your leadership, claiming you've grown soft on the white felt throne. The argument is bitter.",
        effect: () => ({ reputation: -10, happiness: -15 }),
        customEffect: (char) => {
          return {
            ...char,
            relationships: char.relationships.map(r => 
              (r.type === 'Spouse' || r.type === 'Second Wife') && r.traits?.includes('Ambitious') ? { ...r, loyalty: Math.max(0, r.loyalty - 20) } : r
            )
          };
        }
      }
    ]
  },
  {
    title: "⚔️ A Warrior's Heir",
    description: "The sound of clash of steel outside matches the strong cries of your newborn. This child was born with the spirit of the horde.",
    minAge: 25,
    condition: (char) => (char.role === 'General' || char.role === 'Warlord') && char.relationships.some(r => r.type === 'Spouse' || r.type === 'Second Wife') && Math.random() < 0.1,
    choices: [
      { 
        text: "🎖️ Present the Child to the Army", 
        storySnippet: "You lift the infant high before your thousands of warriors. They strike their shields in roar of approval. The child's destiny is forged in battle.", 
        effect: () => ({ reputation: 30, leadership: 10, happiness: 10 }),
        customEffect: (char) => {
          const isMale = Math.random() > 0.5;
          const names = isMale ? MONGOL_NAMES_MALE : MONGOL_NAMES_FEMALE;
          const name = names[Math.floor(Math.random() * names.length)];
          return {
            ...char,
            children: (Number(char.children) || 0) + 1,
            stats: { ...char.stats, reputation: char.stats.reputation + 30, leadership: char.stats.leadership + 10, happiness: char.stats.happiness + 10 },
            relationships: [
              ...char.relationships,
              { 
                name: `${name} (Iron-Born)`, 
                type: "Child", 
                loyalty: 100, 
                status: "Active", 
                clan: char.clan,
                traits: ["Brave", "Rash"]
              }
            ]
          };
        }
      }
    ]
  },
  {
    title: "🤝 Marriage Proposal",
    description: "A prestigious clan from a neighboring tribe seeks to strengthen their position. They offer a union through marriage.",
    minAge: 16,
    maxAge: 35,
    condition: (char) => !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "💍 Accept the Alliance", 
        storySnippet: "A massive feast is held. The Barlas clan sends a generous dowry to seal the pact.", 
        effect: () => ({ reputation: 20, wealth: 200, leadership: 10 }),
        customEffect: (char) => {
          const spouseFirstName = MONGOL_NAMES_FEMALE[Math.floor(Math.random() * MONGOL_NAMES_FEMALE.length)];
          const spouseName = `${spouseFirstName} of Barlas`;
          return {
            ...char,
            clanWealth: char.clanWealth + 800,
            tribeRelations: char.tribeRelations.map(rel => 
              rel.name === 'Barlas' ? { ...rel, level: 'Allied', standing: rel.standing + 70 } : rel
            ),
            relationships: [
              ...char.relationships,
              { 
                id: generateId(),
                name: spouseName, 
                type: "Spouse", 
                loyalty: 70, 
                status: "Active", 
                clan: "Barlas",
                gender: Gender.FEMALE,
                age: Math.max(16, char.age + (Math.floor(Math.random() * 5) - 2)),
                avatarUrl: getNomadAvatar(spouseFirstName, Gender.FEMALE, "Barlas", char.age || 20, undefined, SocialClass.NOBLE),
                isMarriageAlliance: true,
                traits: ["Loyal", "Ambitious"]
              }
            ]
          };
        }
      },
      { 
        text: "✋ Respectfully Decline", 
        storySnippet: "The messenger leaves with a cold look. Your independence is preserved, but relations are cooled.", 
        effect: () => ({ reputation: -5, intelligence: 5 }) 
      }
    ]
  },
  {
    title: "🤴 The Chieftain's Daughter",
    description: "The chieftain of the Tayichiud tribe wishes to unite your peoples against the rising southern threat. He proposes his daughter for marriage.",
    minAge: 18,
    maxAge: 30,
    condition: (char) => char.gender === 'Male' && !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "💍 Marry the Chieftain's Daughter", 
        storySnippet: "A royal union. The Tayichiud provide a kingly dowry of 500 horses (valuated in silver) to your clan. Your name is spoken in every yurt.", 
        effect: () => ({ reputation: 35, realmReputation: 15, wealth: 100, leadership: 15 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 2000,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Tayichiud' ? { ...rel, level: 'Allied', standing: rel.standing + 80 } : rel
          ),
          relationships: [
            ...char.relationships,
            { 
              name: "Altani (Tayichiud)", 
              type: "Spouse", 
              loyalty: 80, 
              status: "Active", 
              clan: "Tayichiud",
              isMarriageAlliance: true,
              traits: ["Wise", "Brave"]
            }
          ]
        })
      },
      { 
        text: "🚶 Choose a Different Path", 
        storySnippet: "You politely explain that your destiny lies elsewhere.", 
        effect: () => ({ intelligence: 5, reputation: -10 }) 
      }
    ]
  },
  {
    title: "⚔️ Mercenary Captain's Offer",
    description: "A powerful captain from the Kereit tribe, impressed by your lineage, asks for your hand in marriage to forge a military bond.",
    minAge: 18,
    maxAge: 30,
    condition: (char) => char.gender === 'Female' && !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      { 
        text: "🩸 Forge the Military Bond", 
        storySnippet: "Your clan sends a substantial bride price to the Kereit, but gains an invincible military ally.", 
        effect: () => ({ reputation: 30, wealth: -200, strength: 10 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 1500,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Kereit' ? { ...rel, level: 'Allied', standing: rel.standing + 60 } : rel
          ),
          relationships: [
            ...char.relationships,
            { 
              name: "Jamukha (Kereit)", 
              type: "Spouse", 
              loyalty: 75, 
              status: "Active", 
              clan: "Kereit",
              isMarriageAlliance: true,
              traits: ["Ambitious", "Rash"]
            }
          ]
        })
      },
      { 
        text: "✋ Decline the Captain", 
        storySnippet: "You have no need for Kereit steel. Your own clan will stand alone.", 
        effect: () => ({ intelligence: 5, reputation: 5 }) 
      }
    ]
  },
  {
    title: "🚩 The Call of Destiny",
    description: "Your experience and reputation have brought you to a crossroads. How will you lead your people into the next era?",
    minAge: 25,
    maxAge: 26,
    condition: (char) => ['War-Ready Youth', 'Apprentice Trader', 'Tengri-Seeker'].includes(char.role),
    choices: [
      { 
        text: "⚔️ Command the Hordes", 
        storySnippet: "You have been given command of a thousand warriors. The world will tremble at your approach.", 
        effect: () => ({ leadership: 15, reputation: 25 }),
        customEffect: (char) => ({ ...char, role: char.role === 'War-Ready Youth' ? 'General' : 'Warlord' })
      },
      { 
        text: "💰 Master the Silk Road", 
        storySnippet: "Your commercial empire spans from the yellow sea to the black sea. You control the flow of the world's wealth.", 
        effect: () => ({ intelligence: 15, wealth: 1000 }),
        customEffect: (char) => ({ ...char, role: char.role === 'Apprentice Trader' ? 'Merchant Prince' : 'Guild Master' })
      },
      { 
        text: "✨ Guide the Tribal Soul", 
        storySnippet: "You have become the voice of the spirits. Your word is law in matters of the soul and tradition.", 
        effect: () => ({ intelligence: 20, loyalty: 15 }),
        customEffect: (char) => ({ ...char, role: char.role === 'Tengri-Seeker' ? 'High Shaman' : 'Sage' })
      }
    ]
  },
  {
    title: "🍵 The Poisoned Cup",
    description: "Your evening broth tastes strangely of bitter almonds. You catch your ambitious spouse watching you from the shadows with a cold, expectant gaze.",
    minAge: 25,
    condition: (char) => char.relationships.some(r => (r.type === 'Spouse' || r.type === 'Second Wife') && r.traits?.includes('Ambitious') && r.loyalty < 40),
    choices: [
      { 
        text: "🗣️ Accuse them publicly", 
        storySnippet: "The council elders are horrified. Your spouse is exiled, but your clan's unity is fractured.", 
        effect: () => ({ reputation: -10, happiness: -20, health: 5 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.filter(r => !(r.traits?.includes('Ambitious') && r.loyalty < 40))
        })
      },
      { 
        text: "💪 Drink a small amount to prove strength", 
        storySnippet: "You survive the poison through sheer iron will. Your spouse is terrified of your 'invulnerability', but the sickness lingers.", 
        effect: () => ({ health: -40, strength: 15, reputation: 20 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.map(r => (r.traits?.includes('Ambitious') && r.loyalty < 40) ? { ...r, loyalty: 10 } : r)
        })
      }
    ]
  },
  {
    title: "👤 Shadow in the Yurt",
    description: "You discover your deceitful spouse meeting in secret with messengers from a rival tribe. They seem to be discussing the layout of your horse lines.",
    minAge: 22,
    condition: (char) => char.relationships.some(r => (r.type === 'Spouse' || r.type === 'Second Wife') && r.traits?.includes('Deceitful') && r.loyalty < 50),
    choices: [
      { 
        text: "🛡️ Tighten Security", 
        storySnippet: "You double the guards around the herds. The messengers are captured and executed. Your spouse claims innocence, but trust is gone.", 
        effect: () => ({ wealth: -100, leadership: 10, happiness: -15 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.map(r => (r.traits?.includes('Deceitful') && r.loyalty < 50) ? { ...r, loyalty: Math.max(0, r.loyalty - 30) } : r)
        })
      },
      { 
        text: "❄️ Banish the Betrayer", 
        storySnippet: "You cast them out into the cold night without a horse. Your heart is heavy, but your clan is safe.", 
        effect: () => ({ reputation: 15, happiness: -30 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.filter(r => !(r.traits?.includes('Deceitful') && r.loyalty < 50))
        })
      }
    ]
  },
  {
    title: "📉 The Usurper's Whisper",
    description: "Your ambitious spouse has been spreading rumors that you have lost favor with Tengri. Some of your younger warriors are beginning to listen.",
    minAge: 30,
    condition: (char) => char.relationships.some(r => (r.type === 'Spouse' || r.type === 'Second Wife') && r.traits?.includes('Ambitious') && r.loyalty < 60),
    choices: [
      { 
        text: "⚔️ Challenge the dissenters", 
        storySnippet: "You face the bravest young warrior in single combat. You crush him, silencing the whispers, but the tension remains.", 
        effect: () => ({ strength: 10, leadership: 15, health: -10, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.map(r => (r.traits?.includes('Ambitious') && r.loyalty < 60) ? { ...r, loyalty: Math.max(0, r.loyalty - 10) } : r)
        })
      },
      { 
        text: "💰 Offer gifts to the warriors", 
        storySnippet: "Silver buys silence. The whispers stop, but your spouse smiles, knowing they weakened your treasury.", 
        effect: () => ({ wealth: -400, reputation: -10, leadership: -5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 1000
        })
      }
    ]
  },
  {
    title: "🐏 Bumper Breeding Season",
    description: "The spring rains have been kind, and the pastures are lush. Your animals are breeding at an incredible rate.",
    minAge: 15,
    condition: (char) => (char.livestock.sheep > 10 || char.livestock.horses > 5),
    choices: [
      { 
        text: "🍖 Celebrate with the tribe", 
        storySnippet: "You host a feast to thank Tengri for the bounty. Your reputation grows.", 
        effect: () => ({ reputation: 10, happiness: 10, wealth: -50 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: char.livestock.sheep + Math.floor(char.livestock.sheep * 0.2),
            horses: char.livestock.horses + Math.floor(char.livestock.horses * 0.1)
          }
        })
      },
      { 
        text: "🐎 Quietly expand the herds", 
        storySnippet: "You focus on securing the young animals. Your wealth grows steadily.", 
        effect: () => ({ happiness: 5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: char.livestock.sheep + Math.floor(char.livestock.sheep * 0.3),
            horses: char.livestock.horses + Math.floor(char.livestock.horses * 0.15),
            cattle: char.livestock.cattle + Math.floor(char.livestock.cattle * 0.1)
          }
        })
      }
    ]
  },
  {
    title: "🌾 The Golden Harvest",
    description: "Your fields are heavy with grain. It is time to harvest the fruits of your settled labor.",
    minAge: 20,
    condition: (char) => char.lifestyle === 'Settled',
    choices: [
      { 
        text: "💰 Sell the surplus", 
        storySnippet: "You trade the extra grain for cold silver. Your granaries are full and your purse is heavy.", 
        effect: () => ({ wealth: 500, intelligence: 5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 1000
        })
      },
      { 
        text: "🏠 Store for the winter", 
        storySnippet: "You prioritize safety over profit. Your tribe feels secure against any coming famine.", 
        effect: () => ({ happiness: 15, health: 10, reputation: 5 })
      }
    ]
  },
  {
    title: "🦗 Locust Swarm",
    description: "A dark cloud appears on the horizon, but it is not rain. Thousands of locusts descend upon your crops.",
    minAge: 20,
    condition: (char) => char.lifestyle === 'Settled',
    choices: [
      { 
        text: "🔥 Try to smoke them out", 
        storySnippet: "You light massive fires, but the wind is against you. Most of the harvest is lost.", 
        effect: () => ({ wealth: -200, happiness: -20, health: -5 })
      },
      { 
        text: "✨ Offer sacrifices to the earth", 
        storySnippet: "The rituals are performed. The swarm passes quickly, sparing half your fields, but the cost was high.", 
        effect: () => ({ wealth: -100, reputation: 5, happiness: -5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 500
        })
      }
    ]
  },
  {
    title: "💰 Tribute from the Vassals",
    description: "Your subjugated tribes have sent a caravan of gold, horses, and silver to acknowledge your supremacy.",
    minAge: 25,
    condition: (char) => char.conqueredTribes.length > 0,
    choices: [
      { 
        text: "👑 Accept the bounty", 
        storySnippet: "The caravan arrives at your camp. Your wealth and global reputation reach new heights.", 
        effect: () => ({ wealth: 1000, reputation: 15, realmReputation: 10 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 2000,
          livestock: {
            ...char.livestock,
            horses: char.livestock.horses + 5,
            sheep: char.livestock.sheep + 20
          }
        })
      }
    ]
  },
  {
    title: "🚩 Vassal Rebellion",
    description: "One of your conquered tribes is whispering of independence. They are withholding this year's tribute.",
    minAge: 25,
    condition: (char) => char.conqueredTribes.length > 0 && Math.random() < 0.1,
    choices: [
      { 
        text: "⚔️ Crush them immediately", 
        storySnippet: "You lead your army into their camp. The rebellion is broken before it begins, but many lives are lost.", 
        effect: () => ({ strength: 5, leadership: 10, health: -15, reputation: -5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: char.livestock.sheep - 10
          }
        })
      },
      { 
        text: "🤝 Negotiate a new settlement", 
        storySnippet: "You listen to their grievances. They return to the fold, but your authority is slightly weakened.", 
        effect: () => ({ intelligence: 10, leadership: -5, reputation: 5, wealth: -200 })
      }
    ]
  },
  {
    title: "👑 The Golden Throne",
    description: "As a Great Khan, you must decide the future of your empire. Envoys from distant lands arrive to seek your favor.",
    minAge: 30,
    condition: (char) => char.isGreatKhan,
    choices: [
      { 
        text: "🐪 Promote trade along the silk roads", 
        storySnippet: "Wealth flows into your coffers as trade routes stabilize. Your kingdom becomes a center of the world.", 
        effect: () => ({ wealth: 1500, intelligence: 15, reputation: 10, realmReputation: 20 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 5000
        })
      },
      { 
        text: "⚔️ Focus on further expansion", 
        storySnippet: "Your army grows in size and discipline. The world and its neighbors live in fear of your name.", 
        effect: () => ({ strength: 20, leadership: 20, reputation: 20, realmReputation: 25, happiness: -10 })
      }
    ]
  },
  {
    title: "💔 Broken Alliance",
    description: "The alliance with the neighboring clan has deteriorated beyond repair. They have declared a blood feud against you.",
    minAge: 18,
    condition: (char) => char.relationships.some(r => r.isMarriageAlliance && r.loyalty < 30),
    choices: [
      { 
        text: "⚔️ Prepare for War", 
        storySnippet: "You muster your warriors. The steppe will drink blood today.", 
        effect: () => ({ reputation: 10, health: -20, wealth: -200, happiness: -10 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.filter(r => !r.isMarriageAlliance || r.loyalty >= 30)
        })
      },
      { 
        text: "💰 Try to Buy Peace", 
        storySnippet: "You send a king's ransom in silver and livestock to avoid war.", 
        effect: () => ({ wealth: -500, reputation: -20, happiness: -5 }),
        customEffect: (char) => ({
          ...char,
          relationships: char.relationships.map(r => r.isMarriageAlliance && r.loyalty < 30 ? { ...r, loyalty: 50 } : r)
        })
      }
    ]
  },
  {
    title: "☀️ The Great Drought",
    description: "The summer heat has been merciless. The watering holes have dried up, and the grass has withered into dust. Your livestock are weakened and beginning to die.",
    minAge: 18,
    choices: [
      {
        text: "🏔️ Move the clan to the northern mountains",
        storySnippet: "It was a grueling trek, but you found greener pastures. Many weak animals were lost on the way, but the rest survived.",
        effect: () => ({ health: -10, happiness: -5 }),
        customEffect: (char) => ({
          ...char,
          droughtYears: 0,
          livestock: {
            ...char.livestock,
            horses: Math.floor(char.livestock.horses * 0.8),
            sheep: Math.floor(char.livestock.sheep * 0.8),
            cattle: Math.floor(char.livestock.cattle * 0.7),
            goats: Math.floor(char.livestock.goats * 0.8),
            yaks: Math.floor(char.livestock.yaks * 0.7),
            camels: Math.floor(char.livestock.camels * 0.9),
          },
          history: [...char.history, { age: char.age, text: "You led the clan north to escape the great drought." }]
        })
      },
      {
        text: "💰 Sacrifice wealth to buy grain from the south",
        storySnippet: "You depleted the treasury to keep the herds fed. The animals are healthy, but the coffers are light.",
        effect: () => ({ wealth: -500, happiness: 10 }),
        customEffect: (char) => ({
          ...char,
          droughtYears: 0,
          history: [...char.history, { age: char.age, text: "You bought foreign grain to sustain the livestock through the drought." }]
        })
      }
    ]
  },
  {
    title: "❄️ The Great Zud",
    description: "A legendary winter has fallen across the steppe. The snow is belly-deep on the horses and the temperature is lethal. Your herds are dying.",
    minAge: 15,
    condition: () => Math.random() < 0.05, // Rare but deadly
    choices: [
      { 
        text: "🍖 Sacrifice own food for the animals", 
        storySnippet: "You kept most of your animals alive, but you have grown thin and weak.", 
        effect: () => ({ health: -30, wealth: -100, happiness: -10, reputation: 10 }) 
      },
      { 
        text: "🥩 Eat the dying livestock", 
        storySnippet: "You stayed fed, but your wealth has vanished as the herds were decimated.", 
        effect: () => ({ health: 10, wealth: -500, happiness: -20 }) 
      },
      { 
        text: "🏔️ Move the camp to a sheltered valley", 
        storySnippet: "The trek was brutal and many elders were lost, but some of the herd survived.", 
        effect: () => ({ health: -15, wealth: -200, happiness: -30, leadership: 10 }) 
      }
    ]
  },
  {
    title: "☀️ A Golden Summer",
    description: "The rains have been perfect and the grass is high. The spirits are smiling on your clan.",
    minAge: 5,
    condition: () => Math.random() < 0.1,
    choices: [
      { 
        text: "🏹 Host a Naadam festival", 
        storySnippet: "The tribe celebrated with horse racing and archery. Your fame and happiness soar.", 
        effect: () => ({ reputation: 25, happiness: 30, wealth: -100, archery: 5 }) 
      },
      { 
        text: "🐴 Focus on breeding the herds", 
        storySnippet: "Your livestock numbers have doubled. You are a wealthy man.", 
        effect: () => ({ wealth: 300, happiness: 10 }) 
      }
    ]
  },
  {
    title: "⚔️ The Champion's Challenge",
    description: "A renowned champion from a rival tribe ridden into your camp, challenging you to a duel to the death for your honor and your herds.",
    minAge: 18,
    condition: (char) => char.stats.reputation > 60,
    choices: [
      {
        text: "🩸 Accept the Duel (LETHAL RISK)",
        storySnippet: "You faced him on the open steppe. It was a brutal dance of steel.",
        customEffect: (char) => {
          const winChance = (char.stats.strength + char.stats.horseRiding) / 200;
          if (Math.random() > winChance) {
            return {
              ...char,
              isAlive: false,
              history: [...char.history, { age: char.age, text: "You were struck down in the duel. Your spirit joined the ancestors." }]
            };
          }
          return {
            ...char,
            stats: { ...char.stats, reputation: char.stats.reputation + 40, strength: char.stats.strength + 10 },
            history: [...char.history, { age: char.age, text: "You emerged victorious, your blade stained with the champion's blood." }]
          };
        }
      },
      {
        text: "💰 Refuse and pay the blood price",
        storySnippet: "You avoided the fight, but your reputation in the eyes of the warriors has crumbled.",
        effect: () => ({ reputation: -40, happiness: -20, wealth: -300 })
      }
    ]
  },
  {
    title: "🐎 The Stampede",
    description: "In the middle of a moonless night, a sudden thunderclap panics the great horse herd. Thousands of hooves are heading straight for your yurt!",
    minAge: 12,
    choices: [
      {
        text: "🏇 Ride out and lead them (LETHAL RISK)",
        storySnippet: "You galloped into the sea of madness.",
        customEffect: (char) => {
          const successChance = char.stats.horseRiding / 100;
          if (Math.random() > successChance + 0.1) {
            return {
              ...char,
              isAlive: false,
              history: [...char.history, { age: char.age, text: "Your horse stumbled. You were trampled by the panicking herd." }]
            };
          }
          return {
            ...char,
            stats: { ...char.stats, horseRiding: char.stats.horseRiding + 15, leadership: char.stats.leadership + 10 },
            history: [...char.history, { age: char.age, text: "With masterful riding, you turned the herd and saved the camp." }]
          };
        }
      },
      {
        text: "⛺ Huddle inside the yurt and pray",
        storySnippet: "The herd passed over the camp edges. You survived, but lost many valuable animals.",
        effect: () => ({ happiness: -10 }),
        customEffect: (char) => ({
          ...char,
          livestock: { ...char.livestock, horses: Math.floor(char.livestock.horses * 0.5) }
        })
      }
    ]
  },
  {
    title: "🗡️ The Assassin's Visit",
    description: "You wake to the cold silk of a garrote pressing against your throat. An assassin from the Jin dynasty has found you in the dark.",
    minAge: 20,
    condition: (char) => char.stats.reputation > 50 || char.isGreatKhan,
    choices: [
      {
        text: "🔪 Fight back with your dagger (LETHAL RISK)",
        storySnippet: "A desperate struggle in the dark.",
        customEffect: (char) => {
          const defenseChance = (char.stats.strength + char.stats.intelligence) / 200;
          if (Math.random() > defenseChance) {
            return {
              ...char,
              isAlive: false,
              history: [...char.history, { age: char.age, text: "The assassin's blade found its mark. You died in your sleep." }]
            };
          }
          return {
            ...char,
            stats: { ...char.stats, intelligence: char.stats.intelligence + 10, reputation: char.stats.reputation + 5 },
            history: [...char.history, { age: char.age, text: "You overpowered the shadow, proving your vigilance." }]
          };
        }
      },
      {
        text: "💰 Offer them double their price",
        storySnippet: "The assassin pauses. Gold speaks louder than blood for some.",
        customEffect: (char) => {
          if (char.stats.wealth >= 500) {
            return {
              ...char,
              stats: { ...char.stats, wealth: char.stats.wealth - 500, intelligence: char.stats.intelligence + 5 },
              history: [...char.history, { age: char.age, text: "The assassin took your silver and vanished into the night." }]
            };
          }
          return {
            ...char,
            isAlive: false,
            history: [...char.history, { age: char.age, text: "You didn't have enough gold. The assassin did not appreciate the bargaining." }]
          };
        }
      }
    ]
  },
  {
    title: "✨ The Cursed Ovoo",
    description: "You find a mysterious altar in the high mountains, stained with ancient blood. The wind whispers promises of ultimate power to whoever completes the ritual.",
    minAge: 16,
    choices: [
      {
        text: "⚡ Perform the Ritual (LETHAL RISK)",
        storySnippet: "You began the forbidden chants. The ground trembles.",
        customEffect: (char) => {
          const ritualChance = char.stats.intelligence / 100;
          if (Math.random() > ritualChance - 0.1) {
            return {
              ...char,
              isAlive: false,
              history: [...char.history, { age: char.age, text: "The spirits were offended by your hubris. You were struck down by lightning." }]
            };
          }
          return {
            ...char,
            stats: { 
              ...char.stats, 
              intelligence: Math.min(100, char.stats.intelligence + 30),
              reputation: Math.min(100, char.stats.reputation + 20)
            },
            history: [...char.history, { age: char.age, text: "You have been touched by the divine. Your mind is filled with the secrets of the world." }]
          };
        }
      },
      {
        text: "✋ Leave an offering and back away",
        storySnippet: "Some things are best left to the spirits.",
        effect: () => ({ loyalty: 10, intelligence: 2 })
      }
    ]
  },
  {
    title: "⚔️ Border Skirmish",
    description: "A group of Merkit warriors has crossed into your winter pastures, claiming the land has always belonged to them. Tensions are at a breaking point.",
    minAge: 18,
    condition: (char) => char.tribeRelations.some(r => r.name === 'Merkit' && (r.level === 'Hostile' || r.level === 'At War')),
    choices: [
      {
        text: "🐎 Drive them out by force",
        storySnippet: "You led a small band of riders to push the Merkit back. It was a sharp, bloody encounter.",
        effect: () => ({ reputation: 15, strength: 5, health: -10 }),
        customEffect: (char) => ({
          ...char,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Merkit' ? { ...rel, standing: rel.standing - 20 } : rel
          ),
          history: [...char.history, { age: char.age, text: "You fought a skirmish against Merkit interlopers in your pastures." }]
        })
      },
      {
        text: "🤝 Negotiate a peaceful withdrawal",
        storySnippet: "You met with their leader under a flag of truce. Through careful words, you convinced them to leave without further bloodshed.",
        effect: () => ({ intelligence: 10, leadership: 5, reputation: 5 }),
        customEffect: (char) => ({
          ...char,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Merkit' ? { ...rel, standing: rel.standing + 5 } : rel
          ),
          history: [...char.history, { age: char.age, text: "You peacefully resolved a border dispute with the Merkit." }]
        })
      }
    ]
  },
  {
    title: "📜 Diplomatic Insult",
    description: "A messenger from the Tayichiud tribe arrives, but instead of greetings, he delivers a mocking poem questioning your clan's heritage and courage.",
    minAge: 20,
    condition: (char) => char.stats.reputation > 40,
    choices: [
      {
        text: "🔪 Execute the messenger",
        storySnippet: "You sent back his head as a reply. The insult is answered, but war is now inevitable.",
        effect: () => ({ reputation: 25, leadership: 10, loyalty: 15 }),
        customEffect: (char) => ({
          ...char,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Tayichiud' ? { ...rel, level: 'At War', standing: -100 } : rel
          ),
          history: [...char.history, { age: char.age, text: "You executed a Tayichiud messenger in response to an insult." }]
        })
      },
      {
        text: "🗣️ Send a witty and scathing reply",
        storySnippet: "Your response was so clever that even the Tayichiud chieftain's own warriors laughed. Your wit is matched only by your wisdom.",
        effect: () => ({ intelligence: 15, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "You countered a diplomatic insult with superior wit." }]
        })
      }
    ]
  },
  {
    title: "🐎 Stolen Livestock",
    description: "In the morning fog, several prime mares are missing from your herd. Tracks lead directly towards the Tartar border.",
    minAge: 16,
    choices: [
      {
        text: "🏇 Ride out and take them back",
        storySnippet: "You pursued the thieves deep into Tartar territory and reclaimed your stock at the edge of a blade.",
        effect: () => ({ strength: 5, horseRiding: 10, reputation: 15, health: -5 }),
        customEffect: (char) => ({
          ...char,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Tartars' ? { ...rel, standing: rel.standing - 15 } : rel
          ),
          history: [...char.history, { age: char.age, text: "You reclaimed stolen mares from Tartar raiders." }]
        })
      },
      {
        text: "💰 Demand compensation",
        storySnippet: "You sent an envoy demanding a 'blood price' for the theft. To avoid a feud, the chief sent back triple the number of sheep.",
        effect: () => ({ intelligence: 10, reputation: 5 }),
        customEffect: (char) => ({
          ...char,
          livestock: { ...char.livestock, sheep: char.livestock.sheep + 30 },
          history: [...char.history, { age: char.age, text: "You successfully negotiated compensation for stolen livestock from the Tartars." }]
        })
      },
      {
        text: "❌ Maintain peace and let them go",
        storySnippet: "You decide not to risk starting a bloody feud over a few mares. While your relations remain intact, your pasture has suffered a loss of 5 horses.",
        effect: () => ({ reputation: -10 }),
        customEffect: (char) => ({
          ...char,
          livestock: { ...char.livestock, horses: Math.max(0, char.livestock.horses - 5) },
          history: [...char.history, { age: char.age, text: "You permitted Tartar thieves to escape without pursuit to preserve peace." }]
        })
      }
    ]
  },
  {
    title: "🆘 Plea for Aid",
    description: "The Kereit tribe, normally strong, has been ravaged by a mysterious pestilence. Their elders beg for your help, offering loyalty in exchange for medicine and food.",
    minAge: 25,
    condition: (char) => char.lifestyle === 'Settled' || char.stats.wealth > 1000,
    choices: [
      {
        text: "📦 Send supplies and healers",
        storySnippet: "Your generosity saved many Kereit lives. They will not forget that you were there in their hour of need.",
        effect: () => ({ wealth: -500, reputation: 20, happiness: 10 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth - 1000,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Kereit' ? { ...rel, level: 'Friendly', standing: rel.standing + 40 } : rel
          ),
          history: [...char.history, { age: char.age, text: "You sent aid to the Kereit tribe during a deadly pestilence." }]
        })
      },
      {
        text: "🛑 Stay within your borders",
        storySnippet: "You prioritize the health of your own clan. The Kereit suffer greatly, and they look upon your closed gates with bitterness.",
        effect: () => ({ health: 10, happiness: -10 }),
        customEffect: (char) => ({
          ...char,
          tribeRelations: char.tribeRelations.map(rel => 
            rel.name === 'Kereit' ? { ...rel, standing: rel.standing - 30 } : rel
          ),
          history: [...char.history, { age: char.age, text: "You chose isolation during the Kereit pestilence." }]
        })
      }
    ]
  },
  {
    title: "🦅 The Eagle's Gift",
    description: "During a solo trek, you rescue a golden eagle trapped in a rocky crevice. It watches you with an intelligence that seems almost human.",
    minAge: 12,
    choices: [
      {
        text: "🏹 Nurse it back to health",
        storySnippet: "The bird has become your shadow. From its high vantage point, it screams warnings and spots game long before you do.",
        effect: () => ({ perception: 15, intelligence: 5 }),
        customEffect: (char) => ({
          ...char,
          visionBonus: (char.visionBonus || 0) + 10,
          history: [...char.history, { age: char.age, text: "You tamed a Golden Eagle, expanding your vision across the plains." }]
        })
      },
      {
        text: "🥩 Free it and move on",
        storySnippet: "The bird takes flight, circling once above you before vanishing. You feel a sense of respect for the wild.",
        effect: () => ({ happiness: 5 })
      }
    ]
  },
  {
    title: "⛰️ The Summit of Tengri",
    description: "You have reached the highest peak in the Khentii mountains. Below, the entire world seems to unfold like a silk map.",
    minAge: 18,
    condition: (char) => char.stats.perception > 50,
    choices: [
      {
        text: "👁️ Study the lands for days",
        storySnippet: "You memorized every fold, river, and camp of the rival tribes. The fog of the unknown has been peeled back.",
        effect: () => ({ perception: 20, intelligence: 10 }),
        customEffect: (char) => ({
          ...char,
          visionBonus: (char.visionBonus || 0) + 20,
          history: [...char.history, { age: char.age, text: "From the High Summit, you mapped the territories of your rivals." }]
        })
      }
    ]
  },
  {
    title: "🌪️ The Dust Storm's Secret",
    description: "A terrifying wall of sand consumes the camp. Visibility is zero, and the wind howls like a wounded beast.",
    minAge: 10,
    choices: [
      {
        text: "👂 Listen for the heartbeat of the steppe",
        storySnippet: "Instead of relying on your eyes, you learned to 'feel' the terrain through sound and vibration. Your senses have sharpened to a razor's edge.",
        effect: () => ({ perception: 25, intelligence: 5, health: -10 }),
        customEffect: (char) => ({
          ...char,
          visionBonus: (char.visionBonus || 0) + 5,
          weather: 'Dust Storm',
          history: [...char.history, { age: char.age, text: "You survived the Great Dust Storm, emerging with senses keener than any warrior." }]
        })
      }
    ]
  },
  {
    title: "🦴 Shagai Champion",
    description: "The children of the camp gather for a game of knucklebones. The competition is fierce.",
    minAge: 5,
    maxAge: 12,
    choices: [
      { 
        text: "🎯 Aim with precision", 
        storySnippet: "You flicked the 'horse' bone perfectly, striking the 'sheep' and winning the round. Your focus is praised.", 
        effect: () => ({ intelligence: 8, perception: 5, happiness: 10 }) 
      },
      { 
        text: "🍀 Rely on luck", 
        storySnippet: "You tossed the bones high. Luck was with you today, but you learned little of skill.", 
        effect: () => ({ happiness: 15, intelligence: 2 }) 
      }
    ]
  },
  {
    title: "🏇 The Orphaned Foal",
    description: "A mare has died in the night, leaving a weak foal. Your father says it is likely to perish.",
    minAge: 8,
    maxAge: 15,
    choices: [
      { 
        text: "🥛 Nurse it by hand", 
        storySnippet: "You spent weeks tending to the creature, sharing your own small milk ration. It survived and has bonded to you for life.", 
        effect: () => ({ loyalty: 15, health: -5, horseRiding: 10 }),
        customEffect: (char) => ({ ...char, livestock: { ...char.livestock, horses: char.livestock.horses + 1 } })
      },
      { 
        text: "🌑 Let nature take its course", 
        storySnippet: "It is the way of the steppe. You felt a cold weight in your heart, but learned the harsh reality of life.", 
        effect: () => ({ intelligence: 5, happiness: -10 }) 
      }
    ]
  },
  {
    title: "🤝 The Anda Oath",
    description: "You have spent the summer with a youth from another clan. You feel a bond deeper than blood.",
    minAge: 14,
    maxAge: 25,
    condition: (char) => char.relationships.length < 10,
    choices: [
      { 
        text: "🩸 Swear a Blood Oath", 
        storySnippet: "You mingled blood and exchanged belts. You are now 'Anda' - blood brothers till death. His clan's strength is now yours.", 
        effect: () => ({ loyalty: 20, reputation: 10, leadership: 5 }),
        customEffect: (char) => ({
          ...char,
          relationships: [
            ...char.relationships,
            { name: "Temujin (Anda)", type: "Blood Brother", loyalty: 100, status: "Active", traits: ["Loyal", "Legendary"] }
          ]
        })
      },
      { 
        text: "🚶 Maintain a casual friendship", 
        storySnippet: "You shared a meal and parted as friends. No oaths were broken today.", 
        effect: () => ({ intelligence: 5 }) 
      }
    ]
  },
  {
    title: "🦠 The Blue Sickness",
    description: "A strange foam appears at the mouths of your prize horses. A local plague is spreading through the valley.",
    minAge: 20,
    condition: (char) => char.livestock.horses > 10,
    choices: [
      { 
        text: "🏔️ Drive the healthy horses to the high peaks", 
        storySnippet: "The isolation worked. You lost the infected animals, but saved the foundation of your wealth.", 
        effect: () => ({ wealth: -200, horseRiding: 5 }),
        customEffect: (char) => ({
          ...char,
          livestock: { ...char.livestock, horses: Math.floor(char.livestock.horses * 0.7) }
        })
      },
      { 
        text: "✨ Seek a Shaman's healing ritual", 
        storySnippet: "The spirits were fickle. Many died, but those that survived seem remarkably resilient.", 
        effect: () => ({ loyalty: 10, wealth: -100, health: -5 }),
        customEffect: (char) => ({
          ...char,
          livestock: { ...char.livestock, horses: Math.floor(char.livestock.horses * 0.5) }
        })
      }
    ]
  },
  {
    title: "🥛 The Airag Conflict",
    description: "During a great feast, a drunken warrior from a rival family spills his fermented mare's milk on your finest boots and mocks your clan.",
    minAge: 18,
    choices: [
      { 
        text: "👊 Demand a wrestling match for honor", 
        storySnippet: "You threw him into the dust in front of the elders. Honor is satisfied, but he will not forget the humiliation.", 
        effect: () => ({ strength: 10, reputation: 15, happiness: 10 }) 
      },
      { 
        text: "🍷 Laugh it off as a joke", 
        storySnippet: "You prevented a blood feud with a clever quip. The elders noted your restraint.", 
        effect: () => ({ intelligence: 10, leadership: 5, reputation: -5 }) 
      }
    ]
  },
  {
    title: "🏞️ The Hidden Valley",
    description: "While pursuing a stray yak, you discover a lush valley hidden by high cliffs. It is a perfect defensive position with a year-round spring.",
    minAge: 20,
    choices: [
      { 
        text: "📍 Keep the location a secret", 
        storySnippet: "You now have a private sanctuary. Your knowledge of the land is unparalleled.", 
        effect: () => ({ perception: 15, intelligence: 10 }) 
      },
      { 
        text: "⛺ Move the entire clan there", 
        storySnippet: "The clan is safe and the herds prosper. Your leadership is hailed by all.", 
        effect: () => ({ leadership: 20, reputation: 15, happiness: 10 }) 
      }
    ]
  },
  {
    title: "🏹 Ancestor's Bow",
    description: "In an old burial mound uncovered by the wind, you find a composite bow of strange, black wood. It feels warm to the touch.",
    minAge: 16,
    choices: [
      { 
        text: "🏹 Take up the heirloom", 
        storySnippet: "The bow is stiff and ancient, but your arrows fly with unnatural speed. You feel the weight of generations behind every shot.", 
        effect: () => ({ archery: 20, reputation: 10, loyalty: 5 }) 
      },
      { 
        text: "⛰️ Re-bury it with respect", 
        storySnippet: "You left the dead to their rest. You felt a wave of spiritual peace.", 
        effect: () => ({ loyalty: 15, happiness: 5 }) 
      }
    ]
  },
  {
    title: "🦅 The Eagle's Nest",
    description: "High on a sheer cliff, you spot a pair of golden eagles. A young bird is visible, ready to be taken for training.",
    minAge: 12,
    maxAge: 18,
    choices: [
      { 
        text: "🧗 Climb the dangerous cliff", 
        storySnippet: "Your fingers bled and your heart hammered, but you reached the nest. You are now a berkutchi - an eagle hunter.", 
        effect: () => ({ strength: 10, perception: 15, reputation: 10, health: -10 }) 
      },
      { 
        text: "🏹 Watch them from afar", 
        storySnippet: "You observed their flight for hours, learning the secrets of the wind.", 
        effect: () => ({ intelligence: 10, perception: 5 }) 
      }
    ]
  },
  {
    title: "🎻 Wandering Minstrel",
    description: "A man with a horse-head fiddle (Morin Khuur) arrives at your campfire. He offers to play songs of the south and the west.",
    minAge: 12,
    choices: [
      { 
        text: "🎶 Listen to his melodies", 
        storySnippet: "The music moved your soul. You dreamed of vast cities and deep oceans.", 
        effect: () => ({ happiness: 20, intelligence: 5 }) 
      },
      { 
        text: "🗣️ Learn the art of throat singing", 
        storySnippet: "You spent many nights practicing the deep, resonant tones. Your voice now carries the power of the steppe.", 
        effect: () => ({ appearance: 10, intelligence: 5, reputation: 5 }) 
      }
    ]
  },
  {
    title: "🧤 The Stolen Bridle",
    description: "A valuable silver-studded bridle has gone missing. You have found it hidden in the gear of a respected elder's son.",
    minAge: 15,
    maxAge: 30,
    choices: [
      { 
        text: "🗣️ Accuse him publicly", 
        storySnippet: "Justice was served, but you have made a powerful enemy for life.", 
        effect: () => ({ reputation: 15, loyalty: 10, happiness: -10 }) 
      },
      { 
        text: "🤫 Return it secretly to save his face", 
        storySnippet: "He knows what you did. He now owes you a debt of silence and gratitude.", 
        effect: () => ({ intelligence: 15, leadership: 5, happiness: 5 }) 
      }
    ]
  },
  {
    title: "🐀 The Marmot Fever",
    description: "The Marmots are plentiful this year, but some look listless. The elders warn of the 'sleeping death' that can jump to men.",
    minAge: 12,
    maxAge: 25,
    choices: [
      { 
        text: "🏹 Hunt them for their valuable furs", 
        storySnippet: "You made a small fortune, but you spent the winter shivering with a mild fever.", 
        effect: () => ({ wealth: 300, health: -20, appearance: -5 }) 
      },
      { 
        text: "🚫 Strictly forbid the hunt", 
        storySnippet: "Your clan remained healthy while neighbors perished. Your wisdom is recognized.", 
        effect: () => ({ leadership: 15, health: 10, reputation: 5 }) 
      }
    ]
  },
  {
    title: "🏔️ The Hidden Pass",
    description: "While scouting, you find a narrow goat path that bypasses the main mountain fortress of the Jin border.",
    minAge: 18,
    condition: (char) => char.stats.perception > 40,
    choices: [
      { 
        text: "🗺️ Map it for the Horde", 
        storySnippet: "This knowledge is worth more than its weight in gold. The generals are impressed.", 
        effect: () => ({ reputation: 30, leadership: 10, intelligence: 5 }) 
      },
      { 
        text: "💰 Sell the secret to a merchant caravan", 
        storySnippet: "A dangerous game, but one that paid off in heavy silver.", 
        effect: () => ({ wealth: 1000, reputation: -10, intelligence: 10 }) 
      }
    ]
  },
  {
    title: "🐪 The White Camel",
    description: "A rare white camel has been born in your herd. This is seen by many as a supreme omen from Tengri.",
    minAge: 20,
    choices: [
      { 
        text: "✨ Dedicate it to the Sky Father", 
        storySnippet: "You left it free to roam. The people believe you are divinely favored.", 
        effect: () => ({ reputation: 40, loyalty: 20, happiness: 10 }) 
      },
      { 
        text: "👑 Keep it as your personal mount", 
        storySnippet: "You look legendary atop the beast, but some whisper of your ego.", 
        effect: () => ({ appearance: 20, reputation: 10, happiness: 15, loyalty: -5 }) 
      }
    ]
  },
  {
    title: "🌪️ Desert Wind's Whisper",
    description: "A day of absolute stillness on the Gobi edge. You sit alone, watching the horizon. Your life's choices weigh heavy on your mind.",
    minAge: 30,
    choices: [
      { 
        text: "🧘 Meditate on your triumphs", 
        storySnippet: "You find peace in your legacy. Your mind is clear.", 
        effect: () => ({ intelligence: 15, happiness: 15 }) 
      },
      { 
        text: "⚔️ Meditate on your regrets", 
        storySnippet: "The pain of the past tempers your soul like steel. You are ready for what comes next.", 
        effect: () => ({ strength: 10, leadership: 10, happiness: -10 }) 
      }
    ]
  },
  {
    title: "❄️ The Great Zud",
    description: "The 'White Death' has arrived. A winter of unprecedented cold has frozen the steppe solid. Your herds are dying by the hundred as they cannot reach the grass beneath the deep ice.",
    minAge: 20,
    choices: [
      { 
        text: "🐑 Sacrifice the weak animals to feed the clan", 
        storySnippet: "You made the hard choice. The people are fed, but your wealth has been decimated. The elders praise your pragmatism.", 
        effect: () => ({ leadership: 15, happiness: 5, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: Math.floor(char.livestock.sheep * 0.4),
            horses: Math.floor(char.livestock.horses * 0.6),
            cattle: Math.floor(char.livestock.cattle * 0.3)
          }
        })
      },
      { 
        text: "🏔️ Drive the herds into the southern valleys", 
        storySnippet: "A dangerous trek through mountain passes. You saved more animals, but many warriors froze to death protecting the herds.", 
        effect: () => ({ leadership: 10, reputation: 15, health: -15, strength: -5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: Math.floor(char.livestock.sheep * 0.7),
            horses: Math.floor(char.livestock.horses * 0.8)
          }
        })
      }
    ]
  },
  {
    title: "🤝 The Great Kurultai",
    description: "The banners of dozens of clans are gathered at the source of the Onon River. They seek a leader to unite the fractured tribes against the empires of the South.",
    minAge: 25,
    condition: (char) => char.stats.reputation > 70 && char.stats.leadership > 60,
    choices: [
      { 
        text: "👑 Claim the title of 'Khan of Khans'", 
        storySnippet: "You stood before the assembly and spoke of destiny. Nine white banners were raised in your honor. You are now the supreme leader of the steppe.", 
        effect: () => ({ reputation: 50, leadership: 40, wealth: 2000 }),
        customEffect: (char) => ({
          ...char,
          isGreatKhan: true,
          role: "Great Khan",
          title: "Genghis-like Conqueror",
          hordeSize: char.hordeSize + 5000
        })
      },
      { 
        text: "✋ Support a rival for stability", 
        storySnippet: "You put aside your ambition for the good of the people. The new Khan owes you a massive debt of gratitude.", 
        effect: () => ({ loyalty: 30, reputation: 20, intelligence: 15 }) 
      }
    ]
  },
  {
    title: "⚔️ War Preparations",
    description: "Tensions between the tribes and the southern empires are reaching a boiling point. Everyone is arming themselves for a massive conflict.",
    minAge: 15,
    choices: [
      {
        text: "🛠️ Supply the war effort",
        storySnippet: "Gear prices have skyrocketed. Your connections in the smithing and trading circles report a massive surge in demand for steel and horses.",
        effect: () => ({ reputation: 10, intelligence: 5 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.WAR_PREP,
          marketTrends: {
            ...char.marketTrends,
            'Weapon': 2.0,
            'Armor': 1.8,
            'Horse': 1.5
          }
        })
      },
      {
        text: "🛡️ Focus on defense",
        storySnippet: "You prioritize hoarding supplies for your own clan's safety. While you miss out on the profit, your yurt feels secure.",
        effect: () => ({ leadership: 10, loyalty: 5 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.WAR_PREP,
          marketTrends: { ...char.marketTrends, 'Weapon': 1.5, 'Armor': 1.5 }
        })
      }
    ]
  },
  {
    title: "🐪 Silk Road Blockade",
    description: "A series of raids by lawless gangs and shifting borders has completely shut down the southern trade routes. Silk, spices, and exotic items are nowhere to be found.",
    minAge: 18,
    choices: [
      {
        text: "📦 Hoard your current luxuries",
        storySnippet: "Luxury goods have become rare as gold. You decide to hold onto your stock, waiting for the prices to peak even further.",
        effect: () => ({ intelligence: 10, wealth: -100 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.BLOCKADE,
          marketTrends: {
            ...char.marketTrends,
            'Luxury': 2.5,
            'Commodity': 2.0
          }
        })
      },
      {
        text: "🤝 Find alternative routes",
        storySnippet: "You spend a fortune bribe local chieftains to open secret mountain paths. You manage to keep some goods flowing.",
        effect: () => ({ wealth: -500, reputation: 15, intelligence: 15 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.BLOCKADE,
          marketTrends: {
            ...char.marketTrends,
            'Luxury': 1.8,
            'Commodity': 1.6
          }
        })
      }
    ]
  },
  {
    title: "🐎 The Horse Plague",
    description: "A mysterious respiratory illness is sweeping through the steppe. Horses are dying in the thousands, and the survivors are being sold for astronomical sums.",
    minAge: 15,
    choices: [
      {
        text: "🛡️ Quarantine your herd",
        storySnippet: "You isolated your horses in a high valley. You lost a few, but you now own some of the only healthy mounts for leagues.",
        effect: () => ({ leadership: 10, intelligence: 10, health: -5 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.FAMINE,
          marketTrends: {
            ...char.marketTrends,
            'Horse': 3.0
          },
          livestock: { ...char.livestock, horses: Math.floor(char.livestock.horses * 0.8) }
        })
      },
      {
        text: "💰 Sell what you can before they die",
        storySnippet: "You offloaded many animals at high prices before the symptoms showed. A cold calculation that filled your purse.",
        effect: () => ({ wealth: 1000, reputation: -20, happiness: -10 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.FAMINE,
          marketTrends: { ...char.marketTrends, 'Horse': 2.5 },
          livestock: { ...char.livestock, horses: Math.floor(char.livestock.horses * 0.4) }
        })
      }
    ]
  },
  {
    title: "📈 Economic Boom",
    description: "The Great Khan has declared a era of Pax Mongolica. Trade is flourishing, and prosperity is spreading to even the most remote clans.",
    minAge: 10,
    choices: [
      {
        text: "💎 Invest in luxury assets",
        storySnippet: "The markets are vibrant. Everything you touch seems to turn to gold as the value of assets grows daily.",
        effect: () => ({ wealth: 500, reputation: 15, happiness: 20 }),
        customEffect: (char) => ({
          ...char,
          marketCondition: MarketCondition.BOOM,
          marketTrends: {
            ...char.marketTrends,
            'Horse': 1.3,
            'Weapon': 1.2,
            'Armor': 1.2,
            'Commodity': 1.5,
            'Luxury': 1.8
          }
        })
      }
    ]
  },
  {
    title: "🐎 The Ghost Mare of the Gobi",
    description: "A legendary feral horse with eyes like burning embers and a silver mane has been spotted on a misty dune. The herders say she cannot be tamed.",
    minAge: 15,
    maxAge: 60,
    choices: [
      {
        text: "🎯 Chase her down with a leather lasso",
        storySnippet: "You galloped across the rocky dunes, your bowstring screaming in the wind. With a masterful toss, your lasso secured around her neck! She bucked furiously, but eventually bowed to your iron will. You now ride a beast of legend.",
        effect: () => ({ horseRiding: 15, strength: 5, reputation: 25, happiness: 20 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            horses: (char.livestock.horses || 0) + 1
          }
        })
      },
      {
        text: "🎶 Sing a soft, ancient herding melody",
        storySnippet: "Instead of drawing weapons, you hummed an old, forgotten lullaby of the high grasslands. Intrigued by the warm melody, the wild mare took several slow paces forward, brushing her velvet nose against your shoulder. The sky father smiles on your gentle wisdom.",
        effect: () => ({ perception: 10, intelligence: 10, loyalty: 15, happiness: 25 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            horses: (char.livestock.horses || 0) + 1
          }
        })
      }
    ]
  },
  {
    title: "🦌 Sacred Deer of Khentii",
    description: "Deep inside the sacred, pine-locked forests of Khan Khentii, you come face to face with a colossal stag. Its towering white antlers look like polished river pearls. The elders warn that shedding its blood brings curses, but its hide is worth a fortune.",
    minAge: 12,
    choices: [
      {
        text: "🏹 Hunt it down for legendary composite horn blocks",
        storySnippet: "You silenced your breathing, drawing your bone-tipped arrow to its absolute limit. The bow twanged and the majestic beast fell. You fashioned exquisite bow-splicer parts, but a deep spiritual malaise settles over your yurt.",
        effect: () => ({ archery: 20, strength: 5, wealth: 400, loyalty: -20, happiness: -15 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Hunted the sacred stag of Khan Khentii, trading its horn blocks for fine goods." }]
        })
      },
      {
        text: "💨 Bow your head and place a blue silk scarf (Khadag) on the pine branch",
        storySnippet: "You dismounted, falling to your knees and gently leaving a blue ceremonial scarf and dry mountain tobacco as an offering. The stag stared into your soul with old, intelligent eyes, releasing a deep snort of blessing before vanishing into the morning fog.",
        effect: () => ({ loyalty: 25, intelligence: 10, perception: 15, happiness: 30, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Made a sacred offering to the great stag of the mountain forests." }]
        })
      }
    ]
  },
  {
    title: "🎤 Throat Singing Duel",
    description: "At the regional Naadam festival, a renowned throat singer from the western Altai mountains dares you to a vocal duel. A massive circle of nomads gathers to hear the resonance of the chest.",
    minAge: 12,
    choices: [
      {
        text: "🗣️ Unleash a deep mountain-vibrating bass overtone (Kargyraa)",
        storySnippet: "You widened your throat and exhaled a tone so deep and gravelly that it mimicked dry earth shifting in an earthquake. The crowd erupted, pounding their chests in absolute awe. You won the gold-rimmed belt!",
        effect: () => ({ appearance: 15, reputation: 20, happiness: 15, intelligence: 5 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Won the legendary Throat Singing belt at Naadam with a flawless Kargyraa bass." }]
        })
      },
      {
        text: "🍶 Share your personal skin of fermented kumis (Airag)",
        storySnippet: "You laughed off the challenge and offered him a massive horn cup of your finest fermented mare's milk. Touched by your humility, the master singer raised his fiddle and composed a beautiful verse praising your honorable lineage.",
        effect: () => ({ loyalty: 15, intelligence: 10, happiness: 20, reputation: 10, wealth: -10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Befriended a master throat singer by sharing premium fermented kumis." }]
        })
      }
    ]
  },
  {
    title: "📜 The Stolen Imperial Ledger",
    description: "While patrolling the western borders, you find a charred leather cylinder dropped by a spy. Inside lies a detailed Jin Dynasty tax ledger outlining local gold reserves and merchant bribe targets.",
    minAge: 16,
    choices: [
      {
        text: "📖 Study the tax patterns and trade figures",
        storySnippet: "You spent weeks decoding the complex Han brushstrokes. Your understanding of Silk Road commercial systems and currency values becomes unmatched.",
        effect: () => ({ intelligence: 20, perception: 10, wealth: 250 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 600,
          history: [...char.history, { age: char.age, text: "Decoded a stolen foreign accounting ledger, boosting herding trade arbitrage." }]
        })
      },
      {
        text: "👑 Deliver it directly to the Khan's generals",
        storySnippet: "You rode three days without rest to hand the scroll to the vanguard generals. With this intelligence, they outflanked three border garrisons. Your reputation among the elite command sky-rockets.",
        effect: () => ({ leadership: 15, reputation: 35, realmReputation: 20 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Handed high-level imperial military documents to the military staff." }]
        })
      }
    ]
  },
  {
    title: "☄️ The Star-Iron Meteorite",
    description: "A blinding streak of fire crashed into the hills at midnight, causing the horses to shriek in terror. Next morning, you locate a dense, smoking crater containing a heavy nugget of sky-iron glowing with a deep blue sheen.",
    minAge: 14,
    choices: [
      {
        text: "⚒️ Hire a master smith to forge an unbreakable battle saber",
        storySnippet: "The bellows roared for weeks. The weapon forged is exceptionally strong, slicing through wooden practice shields with zero resistance. Word of your legendary blade spreads.",
        effect: () => ({ strength: 15, archery: 5, reputation: 20, wealth: -150 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Forged a sterling star-iron saber of unparalleled sharpness." }]
        })
      },
      {
        text: "✨ Bury it underneath your family-yurt as a sacred totem",
        storySnippet: "You wrapped the heavy sky-stone in sheepskin and buried it directly beneath the central ash-pit of your family ger. The shamans state this acts as an anchor of divine favor, shielding your herd from future plagues.",
        effect: () => ({ loyalty: 25, happiness: 15, health: 15, intelligence: 10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Consecrated a holy sky-stone deep beneath the hearth of the family yurt." }]
        })
      }
    ]
  },
  {
    title: "⛸️ The Frozen Tuul River Derby",
    description: "In the depth of winter, the river Tuul freezes into a solid sheet of sapphire ice. The young hot-headed riders of the clan arrange a horse race over the slipperiest sections.",
    minAge: 12,
    maxAge: 35,
    choices: [
      {
        text: "🏇 Push your mount to full speed across the slick ice",
        storySnippet: "Hooves sparked against the rock-hard ice as the wind roared in your ears! Your horse slipped slightly but you leaned low, maintaining center of gravity perfectly to cross the finish line first. A legendary feat!",
        effect: () => ({ horseRiding: 20, reputation: 15, happiness: 15, health: -5 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Won the dangerous Frozen Tuul River Derby with a daring breakneck dash." }]
        })
      },
      {
        text: "🛡️ Ride at a calculated, rhythmic gallop",
        storySnippet: "You focused on precise footing and horse posture, bypassing several reckless competitors who ended up sliding into the frozen reeds. You didn't win first place, but you secured second, and your horse remains perfectly healthy.",
        effect: () => ({ horseRiding: 10, perception: 15, intelligence: 5, happiness: 10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Successfully finished the winter ice race with careful riding tactics." }]
        })
      }
    ]
  },
  {
    title: "🦅 The Lost White Gyrfalcon",
    description: "While setting traps, you come across a massive, majestic white gyrfalcon with its wing caught in heavy brambles. It glares at you with royal, unyielding pride.",
    minAge: 10,
    choices: [
      {
        text: "🥩 Free it and apply soothing pine-salve to its wing",
        storySnippet: "You patiently extracted its delicate feathers from the briars, soothing its cries and applying healing fat. Over the next months, the white bird grew attached to you, perching proudly on your leather guard brace. Its keen eyes will help your hunts.",
        effect: () => ({ perception: 20, archery: 10, happiness: 15, reputation: 15 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Tamed an exquisite white hunting gyrfalcon, sharpening your scouting senses." }]
        })
      },
      {
        text: "🏹 Collect its valuable tail feathers for archery arrow-guides",
        storySnippet: "The feathers of the white gyrfalcon provide the ultimate wind stability. You plucked five long, rare glossy plumes to fletch your steel arrows. Your shots fly straighter than ever.",
        effect: () => ({ archery: 20, strength: 5, reputation: 5, happiness: -5 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Harvested gyrfalcon plumes to construct ultra-stable precision arrow shafts." }]
        })
      }
    ]
  },
  {
    title: "💍 The Uriankhai Clan's Marriage Alliance",
    description: "A nomadic trade delegation from the forest-dwelling Uriankhai tribe arrives with sledges piled with premium furs, high-quality timber, and black hunting bows. They propose joining their lineage to yours through a matrimonial bond.",
    minAge: 18,
    maxAge: 35,
    condition: (char) => !char.relationships.some(r => r.type === 'Spouse'),
    choices: [
      {
        text: "💍 Formalize the marriage pact",
        storySnippet: "You accepted their wedding chests. They hosted a five-day wedding feast where hundreds of jars of black forest berry-mead were consumed. Your spouse is exceedingly skilled at archery, and their clan's support is unmatched.",
        effect: () => ({ archery: 10, wealth: 300, reputation: 20, happiness: 15 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 1000,
          relationships: [
            ...char.relationships,
            {
              id: generateId(),
              name: "Odgerel (Uriankhai)",
              type: "Spouse",
              loyalty: 85,
              status: "Active",
              clan: "Uriankhai",
              isMarriageAlliance: true,
              traits: ["Wise", "Brave"],
              age: 21
            }
          ],
          history: [...char.history, { age: char.age, text: "Married Odgerel of the forest-dwelling Uriankhai, cementing a valuable wilderness treaty." }]
        })
      },
      {
        text: "🤝 Establish a blood-brotherhood pact (Anda) instead",
        storySnippet: "Instead of a wedding, you proposed a holy Anda vow. You sliced your palms and mingled blood over the hearth-fire. While there's no dowry, fifty veteran Uriankhai woodsmen pledge to ride to your war-calls.",
        effect: () => ({ loyalty: 30, reputation: 15, leadership: 10, archery: 10 }),
        customEffect: (char) => ({
          ...char,
          hordeSize: char.hordeSize + 50,
          militaryPower: char.militaryPower + 120,
          history: [...char.history, { age: char.age, text: "Forced a lifelong blood brotherhood (Anda) with the Uriankhai chieftains." }]
        })
      }
    ]
  },
  {
    title: "🧠 The Ingenious Puzzle Box",
    description: "A merchant from the distant southern kingdoms presents you with an 'Onson' box - a hollow wooden block locked with twenty overlapping sliding panels. He bets his fine Arabian horse you cannot open it in a single day.",
    minAge: 12,
    choices: [
      {
        text: "🧩 Methodically study the grain of the interlocking wood",
        storySnippet: "You sat alone in your yurt, ignoring the feast outside, observing the microscopic layout of the timber layers. With a soft wooden click, the twentieth block slid back, revealing a raw emerald worth hundreds of coins! The merchant is stunned.",
        effect: () => ({ intelligence: 20, perception: 10, wealth: 350, happiness: 15 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            horses: (char.livestock.horses || 0) + 1
          },
          history: [...char.history, { age: char.age, text: "Solved the complex Onson puzzle box, winning an Arabian stallion." }]
        })
      },
      {
        text: "🔨 Shatter the box with a heavy iron smithing mallet",
        storySnippet: "You brought the steel sledge down in a blinding fury! The box shattered into thousands of splinters. Inside lay a crushed emerald of diminished value. The merchant laughed at your raw, heavy force, but you still kept the broken gems.",
        effect: () => ({ strength: 15, intelligence: -10, reputation: -5, wealth: 100 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Smashed open an exotic locked box with a mallet in front of your peers." }]
        })
      }
    ]
  },
  {
    title: "🐺 The Black-Pelted Wolf of the Red Ravines",
    description: "A colossal wolf with a pitch-black pelt has been attacking your horse enclosures, biting through the throats of your prized mares. The herders refuse to venture out alone.",
    minAge: 16,
    choices: [
      {
        text: "⚔️ Hunt the beast on foot inside its dark cave",
        storySnippet: "You crawl into the narrow granite crevice, holding a short iron spear. In the pitch blackness, yellow eyes gleam! You thrust forward, pinning the heavy wolf to the wall. It shredded your winter tunic and arm, but you emerged victorious with its pelt.",
        effect: () => ({ strength: 20, reputation: 25, health: -20, appearance: -5 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Killed the legendary black wolf of the Red Ravines in hand-to-hand combat." }]
        })
      },
      {
        text: "🏹 Set a ring of concealed leather foot-traps and wait",
        storySnippet: "You laid out iron-toothed traps concealed by soft dirt and horse-manure. Four days later, you found the black beast pinned and helpless. You dispatched it with a single clean arrow from fifty yards. Clear and calculated hunting.",
        effect: () => ({ archery: 15, intelligence: 15, perception: 10, reputation: 10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Trapped and dispatched the rogue black wolf without taking a single scratch." }]
        })
      }
    ]
  },
  {
    title: "👶 The Orphaned Golden Colt",
    description: "Following a vicious spring blizzard, you discover a tiny golden colt shivering next to its deceased mother in a dry mountain wash. Its ribs are showing, and it can barely stand.",
    minAge: 6,
    maxAge: 18,
    choices: [
      {
        text: "🧥 Wrap it in your own sheepskin coat and carry it back on your back",
        storySnippet: "You carried the heavy colt to your family yurt, sacrificing your favorite coat to keep it warm. You fed it fresh warm mare's milk using a leather pouch. The colt survived, and its loyalty to you is absolute. It will grow into an exceptional racer.",
        effect: () => ({ horseRiding: 15, loyalty: 20, happiness: 15, health: -5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            horses: (char.livestock.horses || 0) + 1
          },
          history: [...char.history, { age: char.age, text: "Rescued an orphaned golden colt, hand-raising it near the yurt hearth." }]
        })
      },
      {
        text: "🚫 Leave it to the wolves; such is the harsh law of the plains",
        storySnippet: "You rode past, steeling your heart. Survival on the Gobi edge goes only to the strong. You saved your coat and milk supplies, but you feel a heavy coldness in your chest.",
        effect: () => ({ strength: 10, loyalty: -10, happiness: -15, intelligence: 5 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Steeled your mind against a weak horse, leaving it behind to respect the plain's law." }]
        })
      }
    ]
  },
  {
    title: "🏺 The Tomb of the Ancestors",
    description: "A landslide in the sandy canyons reveals a timber chamber of an ancient Xiongnu (Hun) warrior chieftain. Inside lie rusted iron spurs, gold plaques of fighting beasts, and high-quality jade cups.",
    minAge: 18,
    choices: [
      {
        text: "💰 Loot the ancient gold and silver",
        storySnippet: "You loaded your saddlebags with precious metals and exquisite bronze carvings, selling them to Silk Road caravans. You generated immese wealth, though some say the sky father will curse your lineage.",
        effect: () => ({ wealth: 1500, reputation: -15, happiness: 10, loyalty: -10 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 3500,
          history: [...char.history, { age: char.age, text: "Excavated a hidden ancient Xiongnu tomb and liquidated its treasures." }]
        })
      },
      {
        text: "✨ Respectfully re-seal the chamber and seek Shaman's blessings",
        storySnippet: "You refused to touch the sacred relics. Along with the Shamans, you built an ovoo (sacred stone heap) above the site to protect the dead. The spirits appear to whisper sweet fortunes to your bloodline in your dreams.",
        effect: () => ({ loyalty: 30, reputation: 20, health: 15, happiness: 15, intelligence: 10 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Constructed an ovoo shrine over a discovered ancient warrior tomb." }]
        })
      }
    ]
  },
  {
    title: "🐫 Caravan of the Whispering Sands",
    description: "A rich caravan master, whose camels are loaded with Persian turquoise and blue porcelain, is terrified of bandit raids on the upcoming pass. He offers 400г if you personally command his caravan guard scout detachment.",
    minAge: 16,
    choices: [
      {
        text: "🛡️ Command the guard and lead the defense",
        storySnippet: "Bandits ambushed you near a rocky pass! You commanded the archers and fired continuous arrows from horseback, breaking their charge. The grateful caravan master paid you in full, adding extra rare dyes to your name.",
        effect: () => ({ leadership: 15, archery: 10, wealth: 400, reputation: 15, health: -5 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 1000,
          history: [...char.history, { age: char.age, text: "Protected a wealthy merchant caravan through a perilous Gobi mountain pass." }]
        })
      },
      {
        text: "👥 Secretly tip off the local bandits for a 50% split",
        storySnippet: "You sent a silent runner to the bandits, coordinates of the camp included. The ambush was absolute, leaving the merchant ruined. You pocketed a huge bag of coins in the dark, though your dirty secrets eat at your honor.",
        effect: () => ({ wealth: 1200, reputation: -30, loyalty: -25, intelligence: 15 }),
        customEffect: (char) => ({
          ...char,
          clanWealth: char.clanWealth + 2500,
          history: [...char.history, { age: char.age, text: "Plotted a secret ambush on a passing trade caravan in exchange for silver." }]
        })
      }
    ]
  },
  {
    title: "🏔️ The Sacred Springs of Otgontenger",
    description: "The joints in your knees are aching from decades of hard riding. The elders tell you of the bubbling hot springs near the holy peak of Otgontenger, high above the clouds.",
    minAge: 30,
    choices: [
      {
        text: "⛰️ Undertake a difficult pilgrimage to soak in the springs",
        storySnippet: "You spent two weeks climbing the mountain trails. The steaming, mineral-rich sulfur pools soothe your aching muscles and clear your lungs. You feel twenty years younger!",
        effect: () => ({ health: 25, appearance: 10, happiness: 20, strength: 5 }),
        customEffect: (char) => ({
          ...char,
          history: [...char.history, { age: char.age, text: "Bathed in the boiling sacred sulfur waters of Otgontenger, healing ancient wounds." }]
        })
      },
      {
        text: "🚫 Focus on your duties; there is no time to rest",
        storySnippet: "You stayed at your campsite, directing horse movements. Your body continues to ache, but your herds grow through your hands-on daily surveillance.",
        effect: () => ({ leadership: 10, health: -10, happiness: -5 }),
        customEffect: (char) => ({
          ...char,
          livestock: {
            ...char.livestock,
            sheep: (char.livestock.sheep || 0) + 10
          }
        })
      }
    ]
  }
];

export function getLocalEvent(character: Character): GameEvent | null {
  // 60% chance of an event every year
  if (Math.random() > 0.6) return null;

  const validEvents = EVENT_POOL.filter(e => 
    character.age >= e.minAge && 
    (!e.maxAge || character.age <= e.maxAge) &&
    (!e.condition || e.condition(character))
  );

  if (validEvents.length === 0) return null;

  const raw = validEvents[Math.floor(Math.random() * validEvents.length)];
  
  return {
    id: `local-${Date.now()}`,
    title: raw.title,
    description: raw.description,
    choices: raw.choices.map(c => ({
      ...c
    }))
  };
}
