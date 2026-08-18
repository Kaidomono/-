/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gender } from '../types';

/**
 * Generates a high-quality, polished BitLife-style cartoon Mongolian avatar.
 * Features expressive big eyes, stylish outfits, cultural hats, customizable
 * facial accessories, and vibrant background gradients.
 * Returns a data URL string.
 */
export function generateNomadSVG(
  name: string, 
  gender: Gender, 
  age: number, 
  isNoble: boolean = false,
  appearance?: { hairColor?: string; eyeColor?: string }
): string {
  // Deterministic randomness based on name hash and age
  const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash = charSum + Math.floor(age);
  const isMale = gender === Gender.MALE;
  const isChild = age < 12;
  const isElder = age >= 60;

  // 1. Skin Tone (Vibrant and warm tones)
  const skinColors = ['#ffd5b4', '#fbc093', '#f0b080', '#e59560', '#fceade'];
  const skinColor = skinColors[hash % skinColors.length];

  // 2. Eye Colors Map
  const eyeColorNames = (appearance?.eyeColor || 'Dark Brown').toLowerCase();
  let eyeHex = '#4e342e'; // Default warm dark brown
  if (eyeColorNames.includes('black')) eyeHex = '#1a1a1a';
  else if (eyeColorNames.includes('amber')) eyeHex = '#c58d01';
  else if (eyeColorNames.includes('hazel')) eyeHex = '#6d7042';
  else if (eyeColorNames.includes('blue')) eyeHex = '#1976d2';

  // 3. Hair Colors Map
  const hairColorName = (appearance?.hairColor || 'Black').toLowerCase();
  let hairColor = '#1e1e1e'; // Default rich dark black
  if (isElder) {
    hairColor = '#e0e0e0'; // Respected elder white/gray hair
  } else if (hairColorName.includes('dark brown')) {
    hairColor = '#422213';
  } else if (hairColorName.includes('chestnut')) {
    hairColor = '#703615';
  } else if (hairColorName.includes('gray') || hairColorName.includes('grey')) {
    hairColor = '#808080';
  } else if (hairColorName.includes('blonde') || hairColorName.includes('gold')) {
    hairColor = '#d4af37';
  }

  // 4. Vibrant Background Gradients (The BitLife signature)
  const bgGradId = `bgGrad_${hash}`;
  const gradients = [
    // Celestial Sky Blue
    { stop1: '#4fc3f7', stop2: '#0288d1' },
    // Imperial Golden Aura
    { stop1: '#ffd54f', stop2: '#ff8f00' },
    // Emerald Steppe
    { stop1: '#81c784', stop2: '#2e7d32' },
    // Twilight Orchid
    { stop1: '#f06292', stop2: '#ad1457' },
    // Royal Indigo
    { stop1: '#7986cb', stop2: '#283593' },
    // Velvet Sunset
    { stop1: '#ff8a65', stop2: '#c62828' }
  ];
  // Nobles get the golden aura or orchid twilight by default, others cycle
  const selectedGrad = isNoble 
    ? gradients[1] 
    : gradients[hash % gradients.length];

  // 5. Traditional Apparel & Outer Robe (Deel) Colors
  const robeColors = isMale 
    ? ['#b71c1c', '#0d47a1', '#1b5e20', '#4e342e', '#4a148c'] 
    : ['#d81b60', '#8e24aa', '#3949ab', '#00acc1', '#00897b'];
  const robeColor = robeColors[hash % robeColors.length];

  const collarColors = ['#ffd700', '#cfd8dc', '#b0bec5', '#ffb74d', '#ff5252', '#80deea'];
  const collarColor = collarColors[(hash + 1) % collarColors.length];
  const lapelColor = collarColors[(hash + 2) % collarColors.length];

  // 6. Character Assets / Accessories based on Social Class & Job
  // Traditional jewellery for ladies & noble gents
  const hasJewelry = !isMale || isNoble;
  const earrings = hasJewelry && age >= 12 ? `
    <!-- Dangling coral beads and pearls earrings -->
    <path d="M52,122 L52,136 Q52,142 48,142 Q52,142 52,145" stroke="#211510" stroke-width="2" fill="none" stroke-linecap="round" />
    <circle cx="52" cy="130" r="3.5" fill="#f44336" stroke="#211510" stroke-width="1.2" />
    <circle cx="52" cy="138" r="2.5" fill="#00bcd4" stroke="#211510" stroke-width="1" />
    <circle cx="52" cy="144" r="4" fill="#ffd700" stroke="#211510" stroke-width="1.2" />

    <path d="M148,122 L148,136 Q148,142 152,142 Q148,142 148,145" stroke="#211510" stroke-width="2" fill="none" stroke-linecap="round" />
    <circle cx="148" cy="130" r="3.5" fill="#f44336" stroke="#211510" stroke-width="1.2" />
    <circle cx="148" cy="138" r="2.5" fill="#00bcd4" stroke="#211510" stroke-width="1" />
    <circle cx="148" cy="144" r="4" fill="#ffd700" stroke="#211510" stroke-width="1.2" />
  ` : '';

  // Scholar glasses (30% chance for kids/scholars)
  const isScholar = name.includes('Scholar') || name.includes('Scribe') || hash % 10 === 7;
  const glasses = (isScholar && age >= 10) ? `
    <!-- Round scholar glasses -->
    <circle cx="83" cy="111" r="13" fill="none" stroke="#5d4037" stroke-width="3" opacity="0.9" />
    <circle cx="117" cy="111" r="13" fill="none" stroke="#5d4037" stroke-width="3" opacity="0.9" />
    <path d="M96,111 L104,111" stroke="#5d4037" stroke-width="3.5" stroke-linecap="round" />
    <path d="M70,111 L58,113 M130,111 L142,113" stroke="#5d4037" stroke-width="2.5" stroke-linecap="round" />
    <!-- Lens reflection -->
    <path d="M76,105 Q85,100 89,112" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round" />
    <path d="M110,105 Q119,100 123,112" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round" />
  ` : '';

  // Warrior Scar (20% chance for active soldiers/warlords)
  const isWarrior = (hash % 5 === 2 || name.includes('Warrior') || name.includes('General')) && age > 14;
  const battleScar = isWarrior ? `
    <!-- Classic badass warrior cheek/eye scar -->
    <path d="M118,97 L126,117" stroke="#e57373" stroke-width="3" stroke-linecap="round" opacity="0.85" />
    <path d="M115,107 L129,105" stroke="#e57373" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />
  ` : '';

  // 7. Expressive Eyebrows
  const leftBrowY = isElder ? 99 : 96;
  const rightBrowY = isElder ? 99 : 96;
  const eyebrows = `
    <!-- Solid expressive cartoon brows -->
    <path d="M71,${leftBrowY} Q82,90 91,95" stroke="#211510" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M109,95 Q118,90 129,${rightBrowY}" stroke="#211510" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M71,${leftBrowY} Q82,90 91,95" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M109,95 Q118,90 129,${rightBrowY}" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round" />
  `;

  // 8. Eyes Design (Enormous anime-style BitLife-inspired round cartoon eyes)
  const leftEyeCenter = 83;
  const rightEyeCenter = 117;
  const eyeRadius = isChild ? 10 : 8.5;

  const eyesPart = `
    <!-- Big white eyeballs with bold outline -->
    <circle cx="${leftEyeCenter}" cy="111" r="${eyeRadius}" fill="#ffffff" stroke="#211510" stroke-width="3" />
    <circle cx="${rightEyeCenter}" cy="111" r="${eyeRadius}" fill="#ffffff" stroke="#211510" stroke-width="3" />
    
    <!-- Colored Irises -->
    <circle cx="${leftEyeCenter}" cy="111" r="5" fill="${eyeHex}" />
    <circle cx="${rightEyeCenter}" cy="111" r="5" fill="${eyeHex}" />
    
    <!-- Deep Pupils -->
    <circle cx="${leftEyeCenter}" cy="111" r="2.8" fill="#211510" />
    <circle cx="${rightEyeCenter}" cy="111" r="2.8" fill="#211510" />
    
    <!-- Double gleaming white light highlights (Extremely lively!) -->
    <circle cx="${leftEyeCenter - 2}" cy="109" r="1.8" fill="#ffffff" />
    <circle cx="${rightEyeCenter - 2}" cy="109" r="1.8" fill="#ffffff" />
    <circle cx="${leftEyeCenter + 2}" cy="113" r="0.8" fill="#ffffff" opacity="0.8" />
    <circle cx="${rightEyeCenter + 2}" cy="113" r="0.8" fill="#ffffff" opacity="0.8" />
  `;

  // Elegant eyelashes for female characters
  const eyelashes = !isMale ? `
    <!-- Top winged lash frames -->
    <path d="M72,109 C72,101 94,101 94,109" stroke="#211510" stroke-width="3" fill="none" stroke-linecap="round" />
    <path d="M106,109 C106,101 128,101 128,109" stroke="#211510" stroke-width="3" fill="none" stroke-linecap="round" />
    <!-- Fine side lashes -->
    <path d="M71,108 L66,105 M73,104 L69,99" stroke="#211510" stroke-width="2.2" stroke-linecap="round" />
    <path d="M129,108 L134,105 M127,104 L131,99" stroke="#211510" stroke-width="2.2" stroke-linecap="round" />
  ` : '';

  // 9. Facial Features: Nose & Rosy Cheeks
  // Highly characteristic rosy cold-weather "steppe blush" (red peaches)
  const cheeksBlush = `
    <ellipse cx="73" cy="123" rx="9" ry="6" fill="#e91e63" opacity="0.32" />
    <ellipse cx="127" cy="123" rx="9" ry="6" fill="#e91e63" opacity="0.32" />
  `;

  const noseCurve = `
    <!-- Cute outline button nose -->
    <path d="M99,114 Q103,121 99,124" stroke="#8d6e63" stroke-width="3" fill="none" stroke-linecap="round" />
  `;

  // 10. Cute Expressions / Mouth (Grinning, happy, smiling, or regal lipstick)
  const mouthY = 132;
  let mouthPart = '';

  if (isChild) {
    // Joyous wide-open laughing open mouth with cute tongue
    mouthPart = `
      <path d="M87,130 Q100,150 113,130 Z" fill="#b71c1c" stroke="#211510" stroke-width="3" stroke-linejoin="round" />
      <path d="M92,130 Q100,135 108,130" fill="#ffffff" /> <!-- Top tooth -->
      <path d="M94,142 Q100,136 106,142" fill="#ff8a80" /> <!-- Tongue -->
    `;
  } else if (!isMale) {
    // Beautiful plump red traditional lips
    mouthPart = `
      <path d="M88,131 Q100,144 112,131 Q100,136 88,131" fill="#d81b60" stroke="#211510" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Dimple smiles -->
      <path d="M86,130 Q84,132 86,134" stroke="#211510" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <path d="M114,130 Q116,132 114,134" stroke="#211510" stroke-width="1.5" fill="none" stroke-linecap="round" />
    `;
  } else {
    // Strong, warm grin with dimples
    mouthPart = `
      <path d="M88,132 Q100,143 112,132" stroke="#211510" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <path d="M86,131 Q84,133 86,135" stroke="#211510" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <path d="M114,131 Q116,133 114,135" stroke="#211510" stroke-width="1.8" fill="none" stroke-linecap="round" />
    `;
  }

  // 11. Facial Hair (Only for adult males)
  let mustacheBeard = '';
  if (isMale && age >= 16) {
    if (isElder) {
      // Magnificent Wise Elder long white beard + classic handlebar mustache
      mustacheBeard = `
        <!-- Flowing long beard -->
        <path d="M76,132 C74,175 92,194 100,194 C108,194 126,175 124,132 C120,154 80,154 76,132 Z" fill="${hairColor}" stroke="#211510" stroke-width="3" stroke-linejoin="round" />
        <!-- Iconic thin dangled mustache -->
        <path d="M86,128 Q100,134 114,128 C108,132 92,132 86,128 Z" fill="${hairColor}" stroke="#211510" stroke-width="2" />
        <path d="M86,128 Q78,138 77,148" stroke="#211510" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M114,128 Q122,138 123,148" stroke="#211510" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M86,128 Q78,138 77,148" stroke="${hairColor}" stroke-width="1.8" fill="none" stroke-linecap="round" />
        <path d="M114,128 Q122,138 123,148" stroke="${hairColor}" stroke-width="1.8" fill="none" stroke-linecap="round" />
      `;
    } else if (age >= 30) {
      // Solid classic dark Mongolian goatee and mustache
      mustacheBeard = `
        <!-- Mustache -->
        <path d="M85,127 Q100,135 115,127 C108,129 92,129 85,127" fill="${hairColor}" stroke="#211510" stroke-width="2.5" />
        <!-- Goatee -->
        <path d="M92,138 L100,165 L108,138 Z" fill="${hairColor}" stroke="#211510" stroke-width="2.5" stroke-linejoin="round" />
      `;
    }
  }

  // 12. Majestic Hair styles (Distinctive Traditional Steppe haircuts)
  let hairStyle = '';
  if (isMale) {
    if (isChild) {
      // Cute toddler single tuft hair knot with ribbon
      hairStyle = `
        <circle cx="100" cy="71" r="5" fill="#f44336" />
        <path d="M100,71 Q90,60 88,52" stroke="${hairColor}" stroke-width="6" stroke-linecap="round" fill="none" />
        <path d="M100,71 Q110,60 112,52" stroke="${hairColor}" stroke-width="6" stroke-linecap="round" fill="none" />
        <path d="M100,71 Q90,60 88,52 M100,71 Q110,60 112,52" stroke="#211510" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.3" />
      `;
    } else {
      // Traditional Mongolian Side Ponytails/Top braind combo (Shaved on top or sides)
      hairStyle = `
        <path d="M80,74 Q100,55 120,74" stroke="#211510" stroke-width="5" fill="none" />
        <!-- Back side braids that curl around the shoulders -->
        <path d="M60,110 Q46,134 50,166" stroke="#211510" stroke-width="7" fill="none" stroke-linecap="round" />
        <path d="M60,110 Q46,134 50,166" stroke="${hairColor}" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M140,110 Q154,134 150,166" stroke="#211510" stroke-width="7" fill="none" stroke-linecap="round" />
        <path d="M140,110 Q154,134 150,166" stroke="${hairColor}" stroke-width="5" fill="none" stroke-linecap="round" />
        <!-- Braids hair ties -->
        <circle cx="49" cy="140" r="3.5" fill="#e91e63" />
        <circle cx="151" cy="140" r="3.5" fill="#e91e63" />
      `;
    }
  } else {
    // Girls/Women hair
    if (isChild) {
      // Cute symmetric round side buns with pink bows!
      hairStyle = `
        <g stroke="#211510" stroke-width="2.5">
          <circle cx="62" cy="76" r="11" fill="${hairColor}" />
          <circle cx="138" cy="76" r="11" fill="${hairColor}" />
          <!-- Ribbons -->
          <circle cx="62" cy="84" r="4.5" fill="#ff4081" />
          <circle cx="138" cy="84" r="4.5" fill="#ff4081" />
        </g>
      `;
    } else {
      // Gorgeous traditional looped braids with ornate high silver caps (Toortog / Princess loop)
      hairStyle = `
        <!-- High volume back hair profile -->
        <path d="M57,110 C54,70 146,70 143,110" fill="${hairColor}" stroke="#211510" stroke-width="3" />
        <!-- Large elegant circular side loop braids -->
        <path d="M60,105 C38,105 32,145 42,175 C52,205 66,195 64,155 Z" fill="${hairColor}" stroke="#211510" stroke-width="3" stroke-linejoin="round" />
        <path d="M140,105 C162,105 168,145 158,175 C148,205 134,195 136,155 Z" fill="${hairColor}" stroke="#211510" stroke-width="3" stroke-linejoin="round" />
        
        <!-- Coral & Silver ornaments on the loops -->
        <line x1="42" y1="135" x2="52" y2="135" stroke="#ffd700" stroke-width="3" />
        <circle cx="47" cy="135" r="5" fill="#f44336" stroke="#211510" stroke-width="1.5" />
        <circle cx="47" cy="155" r="4.5" fill="#00e5ff" stroke="#211510" stroke-width="1" />
        
        <line x1="158" y1="135" x2="148" y2="135" stroke="#ffd700" stroke-width="3" />
        <circle cx="153" cy="135" r="5" fill="#f44336" stroke="#211510" stroke-width="1.5" />
        <circle cx="153" cy="155" r="4.5" fill="#00e5ff" stroke="#211510" stroke-width="1" />
      `;
    }
  }

  // 13. Elite Headwear: Pointed Malgai, Helmet, and Imperial Crown
  let headwear = '';
  // Determine hat style:
  // - Level 1: Under age 5 (Rarely have hat, just hair)
  if (age >= 4) {
    if (isNoble) {
      // Beautiful imperial golden beaded crown (Shanaavch-crown) with high peak
      headwear = `
        <!-- High pointed gold dome -->
        <path d="M65,82 C65,36 135,36 135,82 Z" fill="#ffd700" stroke="#211510" stroke-width="3" />
        <path d="M92,36 L100,15 L108,36 Z" fill="#b71c1c" stroke="#211510" stroke-width="1.5" />
        <circle cx="100" cy="15" r="6" fill="#e91e63" stroke="#211510" stroke-width="1.5" /> <!-- Giant Ruby top -->
        
        <!-- Velvet and fur rim binding -->
        <path d="M54,82 C54,102 146,102 146,82 Q100,77 54,82" fill="#ad1457" stroke="#211510" stroke-width="3" />
        <!-- Detailed gold trim band -->
        <path d="M57,80 C57,94 143,94 143,80" stroke="#ffd700" stroke-width="2" fill="none" />
        
        <!-- Forehead jewel decorations -->
        <circle cx="85" cy="88" r="3" fill="#f44336" stroke="#211510" stroke-width="0.8" />
        <circle cx="100" cy="86" r="4" fill="#00e5ff" stroke="#211510" stroke-width="1" />
        <circle cx="115" cy="88" r="3" fill="#f44336" stroke="#211510" stroke-width="0.8" />
      `;
    } else if (isMale && (hash % 3 === 0 || name.includes('Warrior') || name.includes('General') || name.includes('Commander') || name.includes('Marshal'))) {
      // A glorious armored heavy soldier helmet ("Duulga" style)
      headwear = `
        <!-- Silver iron curved plate -->
        <path d="M60,82 C60,40 140,40 140,82 Z" fill="#90a4ae" stroke="#211510" stroke-width="3" stroke-linejoin="round" />
        <!-- Golden ornamental reinforcing stripes -->
        <path d="M100,40 L100,82" stroke="#ffca28" stroke-width="3.5" stroke-linecap="round" />
        <path d="M60,82 Q100,74 140,82" stroke="#ffca28" stroke-width="4.5" fill="none" />
        <!-- High top spike spire -->
        <path d="M96,40 L100,24 L104,40 Z" fill="#ffca28" stroke="#211510" stroke-width="1.5" />
        <!-- Majestic red horsehair plume floating behind -->
        <path d="M100,24 Q124,36 148,34" stroke="#d50000" stroke-width="6" stroke-linecap="round" fill="none" />
        <!-- Protective chainmail/leather ear coverings -->
        <path d="M56,82 L49,114 L62,110 Z" fill="#455a64" stroke="#211510" stroke-width="2.5" />
        <path d="M144,82 L151,114 L138,110 Z" fill="#455a64" stroke="#211510" stroke-width="2.5" />
      `;
    } else {
      // Standard iconic pointy-coned Mongolian fur hat ("Malgai")
      headwear = `
        <!-- Rolled up brown thick fur brim -->
        <path d="M54,84 C54,103 146,103 146,84 Q100,79 54,84" fill="#5d4037" stroke="#211510" stroke-width="3.2" stroke-linejoin="round" />
        <!-- Bright colored cap cone (red for male, blue/purple for female) -->
        <path d="M63,82 L100,40 L137,82 Z" fill="${isMale ? '#c62828' : '#1565c0'}" stroke="#211510" stroke-width="3" stroke-linejoin="round" />
        <!-- Golden hat node & dual floating ribbons -->
        <line x1="100" y1="40" x2="108" y2="60" stroke="#ffeb3b" stroke-width="2" />
        <circle cx="100" cy="40" r="3.5" fill="#ffa726" stroke="#211510" stroke-width="1.2" />
      `;
    }
  }

  // 14. Floating Magical Sparkle Aura (Signature BitLife indicator of extreme power or nobility)
  const prestigeStars = isNoble ? `
    <!-- Floating star outlines for that gamey high-tier reward aesthetic -->
    <g fill="#ffd700" stroke="#211510" stroke-width="1" opacity="0.9">
      <!-- Star Left -->
      <path d="M165,35 L167,40 L172,41 L167,43 L165,49 L162,43 L157,41 L162,40 Z" />
      <!-- Star Right -->
      <path d="M35,50 L37,55 L42,56 L37,58 L35,63 L32,58 L27,56 L32,55 Z" />
      <!-- Tiny star -->
      <path d="M48,25 L49,28 L52,29 L49,30 L48,33 L47,30 L44,29 L47,28 Z" transform="scale(0.85) translate(10, 5)" />
    </g>
  ` : '';

  // Construct final SVG dynamically with all details
  const svg = `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background linear gradient -->
        <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${selectedGrad.stop1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${selectedGrad.stop2};stop-opacity:1" />
        </linearGradient>
        <clipPath id="circleClip">
          <circle cx="100" cy="100" r="94" />
        </clipPath>
      </defs>
      
      <!-- Safe Outer Circular Border Frame (Like a real Sticker badge) -->
      <circle cx="100" cy="100" r="95" fill="none" stroke="#211510" stroke-width="4.5" />
      <!-- Inner Background Circle -->
      <circle cx="100" cy="100" r="94" fill="url(#${bgGradId})" />
      
      <!-- All main components wrapped inside the clipping area -->
      <g clip-path="url(#circleClip)">
        <!-- 1. The Shoulders & Deel Outfit -->
        <!-- Broad shoulders path -->
        <path d="M22,198 C26,152 60,140 100,140 C140,140 174,152 178,198 Z" fill="${robeColor}" stroke="#211510" stroke-width="3.5" />
        
        <!-- Overlapping authentic right-sided chest panel -->
        <path d="M100,140 C114,142 128,149 133,166 L141,198" stroke="#211510" stroke-width="4" stroke-linecap="round" fill="none" />
        
        <!-- Secondary colorful Lapel borders -->
        <path d="M100,140 C114,142 128,149 133,166" stroke="${collarColor}" stroke-width="3" stroke-linecap="round" fill="none" />
        
        <!-- Golden round metal clasp buttons (Tradional buttons) -->
        <circle cx="123" cy="149" r="3.2" fill="#ffd700" stroke="#211510" stroke-width="1.5" />
        <circle cx="129" cy="161" r="3.2" fill="#ffd700" stroke="#211510" stroke-width="1.5" />

        <!-- High-neck collar choker band -->
        <rect x="85" y="132" width="30" height="9" fill="${robeColor}" stroke="#211510" stroke-width="3" />
        <!-- Gold rim for noble collar -->
        ${isNoble ? `<rect x="85" y="132" width="30" height="3" fill="#ffd700" />` : ''}

        <!-- 2. The Neck -->
        <rect x="85" y="120" width="30" height="15" fill="${skinColor}" stroke="#211510" stroke-width="3.2" />

        <!-- 3. Hair (Back Profile) -->
        ${hairStyle}

        <!-- 4. The Head Base & Ears -->
        <!-- Left Ear -->
        <circle cx="56" cy="116" r="10" fill="${skinColor}" stroke="#211510" stroke-width="3.2" />
        <!-- Right Ear -->
        <circle cx="144" cy="116" r="10" fill="${skinColor}" stroke="#211510" stroke-width="3.2" />
        <!-- Ear detailing inner curves -->
        <path d="M55,112 Q58,116 55,120" stroke="#211510" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M145,112 Q142,116 145,120" stroke="#211510" stroke-width="1.5" fill="none" stroke-linecap="round" />
        
        <!-- Dangling Earrings if applicable -->
        ${earrings}

        <!-- The main oval Head -->
        <circle cx="100" cy="115" r="41" fill="${skinColor}" stroke="#211510" stroke-width="3.5" />

        <!-- 5. Cheeks wind-blush -->
        ${cheeksBlush}

        <!-- 6. Eyebrows & Lashes -->
        ${eyebrows}
        ${eyelashes}

        <!-- 7. Big Shiny Pupils & Eyes -->
        ${eyesPart}

        <!-- 8. Scholar glasses / Warrior scars -->
        ${glasses}
        ${battleScar}

        <!-- 9. Nose curve -->
        ${noseCurve}

        <!-- 10. Facial Hair (Mustache, Goatees) -->
        ${mustacheBeard}

        <!-- 11. Expressive Lips/Mouth -->
        ${mouthPart}

        <!-- 12. Headwear (Pointed Malgai, Helmet, Crown) -->
        ${headwear}

        <!-- 13. Noble Auras -->
        ${prestigeStars}
      </g>
    </svg>
  `;

  // Safe unicode-compliant Base64 converter to prevent crash on non-ASCII chars
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}
