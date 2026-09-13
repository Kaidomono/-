package com.example.steppenomad.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// =========================================================================
// MATERIAL 3 COLOR SCHEMES: STEPPE PALETTE
// Earthy Tones, Deep Greens, and Golds
// =========================================================================

/**
 * Steppe Dark Color Scheme (Primary Game Aesthetic):
 * Evokes the vast Mongolian night steppe, warm yurt hearth fire,
 * sacred Burkhan Khaldun pine forests, and burnished Khagan gold ornaments.
 */
val SteppeDarkColorScheme = darkColorScheme(
    // Primary: Imperial Khagan Gold
    primary = SteppeGold,
    onPrimary = SteppeBrownDark,
    primaryContainer = SteppeGoldContainer,
    onPrimaryContainer = SteppeGoldOnContainer,
    inversePrimary = SteppeGoldDark,

    // Secondary: Steppe Bronze & Saddle Leather
    secondary = SteppeBronze,
    onSecondary = SteppeParchmentLight,
    secondaryContainer = SteppeSurfaceContainerHigh,
    onSecondaryContainer = SteppeParchment,

    // Tertiary: Deep Sacred Pine & Steppe Pasture Green
    tertiary = SteppeGreenEmerald,
    onTertiary = SteppeParchmentLight,
    tertiaryContainer = SteppeGreenContainer,
    onTertiaryContainer = SteppeGreenOnContainer,

    // Canvas Backgrounds & Surfaces: Rich Earth & Dark Nomad Timber
    background = SteppeBrownDark,
    onBackground = SteppeParchment,
    surface = SteppeSurface,
    onSurface = SteppeParchment,
    surfaceVariant = SteppeSurfaceVariant,
    onSurfaceVariant = SteppeParchmentDark,
    surfaceTint = SteppeGold,
    inverseSurface = SteppeParchment,
    inverseOnSurface = SteppeBrownDark,

    // M3 Surface Containers for elevated hierarchy
    surfaceContainerLowest = SteppeEarthDark,
    surfaceContainerLow = SteppeBrownDark,
    surfaceContainer = SteppeSurfaceContainer,
    surfaceContainerHigh = SteppeSurfaceContainerHigh,
    surfaceContainerHighest = SteppeSurfaceContainerHighest,

    // Borders & Dividers
    outline = SteppeBorder,
    outlineVariant = SteppeBorderSubtle,

    // Error & Crimson Alert
    error = SteppeRed,
    onError = SteppeParchmentLight,
    errorContainer = SteppeRedContainer,
    onErrorContainer = SteppeRedOnContainer,

    // Scrim
    scrim = SteppeEarthDark
)

/**
 * Steppe Light Color Scheme (Parchment & Sunlit Steppe):
 * Evokes daytime sun on golden prairie grass, bleached sheep wool,
 * deep green oasis pastures, and warm sand dunes.
 */
val SteppeLightColorScheme = lightColorScheme(
    // Primary: Antique Steppe Gold
    primary = SteppeGoldDark,
    onPrimary = SteppeParchmentLight,
    primaryContainer = SteppeSunlitDune,
    onPrimaryContainer = SteppeBrownDark,
    inversePrimary = SteppeGold,

    // Secondary: Nomad Raw Umber & Leather
    secondary = SteppeRawUmber,
    onSecondary = SteppeParchmentLight,
    secondaryContainer = SteppeParchmentDark,
    onSecondaryContainer = SteppeBrownDark,

    // Tertiary: Deep Steppe Sage Green
    tertiary = SteppeGreenDeep,
    onTertiary = SteppeParchmentLight,
    tertiaryContainer = Color(0xFFC7EBD2),
    onTertiaryContainer = SteppeGreenDeep,

    // Background & Surfaces: Warm Sunlit Parchment
    background = SteppeParchmentLight,
    onBackground = SteppeInk,
    surface = SteppeParchment,
    onSurface = SteppeInk,
    surfaceVariant = SteppeParchmentDark,
    onSurfaceVariant = SteppeWarmLoam,
    surfaceTint = SteppeGoldDark,
    inverseSurface = SteppeBrownDark,
    inverseOnSurface = SteppeParchment,

    // Containers
    surfaceContainerLowest = Color(0xFFFFFFFF),
    surfaceContainerLow = SteppeParchmentLight,
    surfaceContainer = SteppeParchment,
    surfaceContainerHigh = SteppeParchmentDark,
    surfaceContainerHighest = SteppeSand,

    // Outlines
    outline = SteppeRawUmber,
    outlineVariant = SteppeSand,

    // Error
    error = SteppeRed,
    onError = SteppeParchmentLight,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),

    scrim = SteppeEarthDark
)

/**
 * Extended accessor for Steppe-specific theme tokens directly via MaterialTheme.
 */
val MaterialTheme.steppeExtendedColors: SteppeExtendedColors
    @Composable
    @ReadOnlyComposable
    get() = LocalSteppeExtendedColors.current

/**
 * Steppe Nomad Material 3 Theme wrapper.
 * Applies the customized Steppe palette (earthy tones, deep greens, and golds),
 * typography, shapes, and system bar styling.
 */
@Composable
fun SteppeNomadTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) SteppeDarkColorScheme else SteppeLightColorScheme
    val extendedColors = SteppeExtendedColors()

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.background.toArgb()
                window.navigationBarColor = colorScheme.background.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    CompositionLocalProvider(
        LocalSteppeExtendedColors provides extendedColors
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = SteppeTypography,
            shapes = SteppeShapes,
            content = content
        )
    }
}
