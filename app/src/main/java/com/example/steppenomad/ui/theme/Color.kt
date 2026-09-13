package com.example.steppenomad.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

// =========================================================================
// STEPPE PALETTE: Earthy Tones, Deep Greens, and Golds
// =========================================================================

// --- Earthy Tones (Soils, Yurts, Wood, Loam & Parchment) ---
val SteppeEarthDark = Color(0xFF191008)          // Deep night earth / deepest shadow
val SteppeBrownDark = Color(0xFF26190E)          // Main Steppe dark canvas / rich yurt wood
val SteppeSoil = Color(0xFF332014)               // Warm nomad loam
val SteppeWarmLoam = Color(0xFF452D1C)           // Rich leather & saddle tone
val SteppeBronze = Color(0xFF8C6239)             // Burnished bronze & stirrup brass
val SteppeRawUmber = Color(0xFF634832)           // Raw earth umber
val SteppeParchment = Color(0xFFF4ECD8)          // Aged sheepskin parchment (primary readable light)
val SteppeParchmentLight = Color(0xFFFCF8EE)     // Crisp sunlit parchment
val SteppeParchmentDark = Color(0xFFE2D3B3)      // Weathered parchment / secondary text
val SteppeSand = Color(0xFFCBB892)               // Gobi desert dunes
val SteppeBorder = Color(0xFF5A432F)             // Standard card & divider border
val SteppeBorderSubtle = Color(0xFF3F2D1F)       // Soft ambient container outline
val SteppeSurface = Color(0xFF2F2116)            // Elevated card & dialog surface
val SteppeSurfaceVariant = Color(0xFF3D2C1E)     // Higher elevation component surface
val SteppeSurfaceContainer = Color(0xFF362518)   // M3 Surface Container
val SteppeSurfaceContainerHigh = Color(0xFF422F20)// M3 Surface Container High
val SteppeSurfaceContainerHighest = Color(0xFF4E3727) // M3 Surface Container Highest
val SteppeInk = Color(0xFF1E140A)                // Nomad calligraphy ink

// --- Deep Greens (Pine Taiga, Prairie Grasslands & Sage Pastures) ---
val SteppeGreenDeep = Color(0xFF1B382B)          // Deep mountain pine & sacred Burkhan Khaldun spruce
val SteppeGreen = Color(0xFF2E5A44)              // Steppe sagebrush & highland grass
val SteppeGreenEmerald = Color(0xFF386641)       // Lush summer pasture & fertile river valley
val SteppeGreenLight = Color(0xFF70D48B)         // Spring pasture growth & positive yields
val SteppeGreenContainer = Color(0xFF142B20)     // Dark atmospheric green container
val SteppeGreenOnContainer = Color(0xFFAFE8BE)   // High-contrast legible text on deep green

// --- Golds & Solar Bronzes (Imperial Khagan, Solar Sun & Ornaments) ---
val SteppeGold = Color(0xFFD4AF37)               // Imperial Khagan Gold (Primary action/focus)
val SteppeGoldBright = Color(0xFFF5C542)         // Radiant Sun Gold (Golden Eagle badge)
val SteppeGoldDark = Color(0xFFA67C1E)           // Antique Steppe Bronze-Gold (Muted container)
val SteppeGoldContainer = Color(0xFF4A370A)      // Deep gold-tinted container background
val SteppeGoldOnContainer = Color(0xFFFFDF94)    // Radiant golden text on dark gold
val SteppeSunlitDune = Color(0xFFE5C07B)         // Sun-drenched steppe dust & silk

// --- Atmospheric Steppe Accents ---
val SteppeRed = Color(0xFF9E2A2B)                // Tug War Banner Crimson & danger / zud
val SteppeRedContainer = Color(0xFF4A1011)       // Crimson alert container
val SteppeRedOnContainer = Color(0xFFFFB4AB)     // Alert text
val SteppeSkyBlue = Color(0xFF2B5B84)            // Tengri Eternal Blue Sky (Möngke Tengri)
val SteppeSkyBlueLight = Color(0xFF61AFEF)       // Cloudless nomad sky

/**
 * Extended Steppe Theme Palette holder for custom components needing direct access
 * to deep steppe semantic color tokens alongside Material3.
 */
@Immutable
data class SteppeExtendedColors(
    val earthDark: Color = SteppeEarthDark,
    val brownDark: Color = SteppeBrownDark,
    val parchment: Color = SteppeParchment,
    val parchmentDark: Color = SteppeParchmentDark,
    val gold: Color = SteppeGold,
    val goldBright: Color = SteppeGoldBright,
    val goldDark: Color = SteppeGoldDark,
    val greenDeep: Color = SteppeGreenDeep,
    val green: Color = SteppeGreen,
    val greenLight: Color = SteppeGreenLight,
    val red: Color = SteppeRed,
    val skyBlue: Color = SteppeSkyBlue,
    val border: Color = SteppeBorder
)

val LocalSteppeExtendedColors = staticCompositionLocalOf { SteppeExtendedColors() }
