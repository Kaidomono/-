package com.example.steppenomad.ui.components

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import com.example.steppenomad.R
import com.example.steppenomad.logic.Season
import com.example.steppenomad.ui.theme.SteppeBrownDark

/**
 * Dynamic atmospheric seasonal background that morphs between Spring, Summer, Autumn, and Winter
 * as turn count advances through the seasonal cycles.
 */
@Composable
fun SeasonalBackground(
    season: Season,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val (imageRes, overlayGradient) = when (season) {
        Season.SPRING -> Pair(
            R.drawable.img_bg_spring_1787231349983,
            Brush.verticalGradient(
                colors = listOf(
                    SteppeBrownDark.copy(alpha = 0.88f),
                    Color(0xFF142416).copy(alpha = 0.72f),
                    SteppeBrownDark.copy(alpha = 0.92f)
                )
            )
        )
        Season.SUMMER -> Pair(
            R.drawable.img_bg_summer_1787231364739,
            Brush.verticalGradient(
                colors = listOf(
                    SteppeBrownDark.copy(alpha = 0.86f),
                    Color(0xFF2E2412).copy(alpha = 0.68f),
                    SteppeBrownDark.copy(alpha = 0.92f)
                )
            )
        )
        Season.AUTUMN -> Pair(
            R.drawable.img_bg_autumn_1787231379434,
            Brush.verticalGradient(
                colors = listOf(
                    SteppeBrownDark.copy(alpha = 0.88f),
                    Color(0xFF331C0C).copy(alpha = 0.72f),
                    SteppeBrownDark.copy(alpha = 0.93f)
                )
            )
        )
        Season.WINTER -> Pair(
            R.drawable.img_bg_winter_1787231394237,
            Brush.verticalGradient(
                colors = listOf(
                    SteppeBrownDark.copy(alpha = 0.90f),
                    Color(0xFF131D28).copy(alpha = 0.74f),
                    SteppeBrownDark.copy(alpha = 0.94f)
                )
            )
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(SteppeBrownDark)
            .testTag("seasonal_background_container")
    ) {
        // Crossfade animation between seasonal backdrop images
        Crossfade(
            targetState = imageRes,
            animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
            label = "SeasonCrossfade"
        ) { resId ->
            Image(
                painter = painterResource(id = resId),
                contentDescription = "Steppe ${season.displayName} Landscape",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }

        // Atmospheric Scrim & Tint Overlay for contrast and readability
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(overlayGradient)
        )

        // Main Foreground UI Content
        content()
    }
}
