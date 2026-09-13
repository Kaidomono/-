package com.example.steppenomad.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.CombatOutcome
import com.example.steppenomad.model.Combatant
import com.example.steppenomad.model.Relationship
import com.example.steppenomad.model.TreatyType
import com.example.steppenomad.model.TribeRelation
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

/**
 * BitLife-style Activities Hub (Үйл Ажиллагаа & Аян Зам)
 * Consolidates all nomadic endeavors: Pleasure Pavilion & Courtship,
 * World Map migration, Kurultai Diplomacy, and Martial Duels into a single menu.
 */
@Composable
fun ActivitiesHubTab(
    character: Character,
    initialSubScreen: String? = null,
    // Pavilion & Courtship
    marriageCandidates: List<Relationship>,
    pleasureCandidates: List<Relationship>,
    friendCandidates: List<Relationship>,
    onMarry: (Relationship) -> Unit,
    onVisitPleasure: (Relationship) -> Unit,
    onBefriend: (Relationship) -> Unit,
    // Diplomacy
    onSendGift: (TribeRelation) -> Unit,
    onDeclareWar: (TribeRelation) -> Unit,
    onConquerTribe: (TribeRelation) -> Unit,
    onNegotiateTreaty: (TribeRelation, TreatyType, Int, Int, Int, String) -> Boolean,
    onRenounceTreaty: (TribeRelation) -> Unit,
    // Combat / Duel
    combatDifficulty: Int,
    combatEnemy: Combatant?,
    combatOutcome: CombatOutcome?,
    onSetDifficulty: (Int) -> Unit,
    onSimulateCombat: () -> Unit
) {
    // Current sub-screen: null = Activities List, "pavilion", "map", "diplomacy", "duel"
    var activeSubScreen by remember { mutableStateOf<String?>(initialSubScreen) }

    LaunchedEffect(initialSubScreen) {
        if (initialSubScreen != null) {
            activeSubScreen = initialSubScreen
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Top Back Header when a sub-activity is active
        if (activeSubScreen != null) {
            Surface(
                color = SteppeBrownDark,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextButton(
                        onClick = { activeSubScreen = null },
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp),
                        modifier = Modifier.testTag("back_to_activities_btn")
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", modifier = Modifier.size(16.dp), tint = SteppeGold)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("← Activities", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                    }

                    val titleText = when (activeSubScreen) {
                        "pavilion" -> "🍷 Pleasure Pavilion & Courtship"
                        "map" -> "🗺️ Steppe World Map"
                        "diplomacy" -> "📜 Kurultai Diplomacy"
                        "duel" -> "⚔️ Trial by Combat"
                        else -> "Activity"
                    }

                    Text(
                        text = titleText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = SteppeParchment
                    )
                }
            }
            HorizontalDivider(color = SteppeBorder, thickness = 1.dp)
        }

        // Sub-screen rendering
        when (activeSubScreen) {
            "pavilion" -> {
                PavilionTab(
                    character = character,
                    marriageCandidates = marriageCandidates,
                    pleasureCandidates = pleasureCandidates,
                    friendCandidates = friendCandidates,
                    onMarry = onMarry,
                    onVisitPleasure = onVisitPleasure,
                    onBefriend = onBefriend
                )
            }
            "map" -> {
                WorldMapScreen(character = character)
            }
            "diplomacy" -> {
                DiplomacyTab(
                    character = character,
                    onSendGift = onSendGift,
                    onDeclareWar = onDeclareWar,
                    onConquerTribe = onConquerTribe,
                    onNegotiateTreaty = onNegotiateTreaty,
                    onRenounceTreaty = onRenounceTreaty
                )
            }
            "duel" -> {
                CombatSimulatorScreen(
                    character = character,
                    difficulty = combatDifficulty,
                    enemy = combatEnemy,
                    outcome = combatOutcome,
                    onSetDifficulty = onSetDifficulty,
                    onSimulateCombat = onSimulateCombat
                )
            }
            null -> {
                // =================================================================
                // MAIN BITLIFE-STYLE ACTIVITIES MENU LIST
                // =================================================================
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp)
                        .testTag("activities_tab_content"),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    item {
                        SteppeCard(
                            borderColor = SteppeGold,
                            backgroundColor = SteppeBrownDark
                        ) {
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Celebration,
                                        contentDescription = null,
                                        tint = SteppeGold,
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Text(
                                        text = "Steppe Activities & Ventures",
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SteppeGold
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Үйл Ажиллагаа, Эртний Найр & Их Аян",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = SteppeSunlitDune
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Partake in grand steppe festivities, forge marriage alliances, migrate across the open steppe, manage clan diplomacy, and engage in honorable duels.",
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp,
                                    color = SteppeParchment
                                )
                            }
                        }
                    }

                    item {
                        Text(
                            text = "Life Activities (Үйл Ажиллагаанууд)",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                    }

                    // 1. Pavilion, Feasting & Courtship
                    item {
                        BitLifeActivityRow(
                            icon = Icons.Default.Celebration,
                            title = "Pleasure Pavilion & Courtship (Цэнгэл & Хурим)",
                            subtitle = "Drink kumis, enjoy musical feasting, find suitors, and swear Anda oaths",
                            badge = "${marriageCandidates.size} Suitors • ${pleasureCandidates.size} Feasts",
                            badgeColor = SteppeGold,
                            testTag = "activity_pavilion",
                            onClick = { activeSubScreen = "pavilion" }
                        )
                    }

                    // 2. World Map & Encampments
                    item {
                        BitLifeActivityRow(
                            icon = Icons.Default.Map,
                            title = "World Map & Territory (Нүүдлийн Газрын Зураг)",
                            subtitle = "Survey tribal pastures, regional encampments, and seasonal migration routes",
                            badge = "Steppe Regions",
                            badgeColor = SteppeSkyBlueLight,
                            testTag = "activity_map",
                            onClick = { activeSubScreen = "map" }
                        )
                    }

                    // 3. Diplomacy & Kurultai
                    item {
                        val atWarCount = character.tribeRelations.count { it.level.contains("War", ignoreCase = true) || it.standing < -50 }
                        val alliedCount = character.tribeRelations.count { it.treatyType != TreatyType.NONE }
                        BitLifeActivityRow(
                            icon = Icons.Default.Public,
                            title = "Diplomacy & Kurultai (Их Хуралдай & Харилцаа)",
                            subtitle = "Negotiate non-aggression treaties, tributes, alliances, or declare war",
                            badge = if (atWarCount > 0) "⚔️ $atWarCount Wars • $alliedCount Treaties" else "$alliedCount Treaties • ${character.tribeRelations.size} Tribes",
                            badgeColor = if (atWarCount > 0) SteppeRed else SteppeGreenLight,
                            testTag = "activity_diplomacy",
                            onClick = { activeSubScreen = "diplomacy" }
                        )
                    }

                    // 4. Trial by Combat & Duels
                    item {
                        BitLifeActivityRow(
                            icon = Icons.Default.SportsMartialArts,
                            title = "Trial by Combat & Duels (Эрийн Гурван Наадам & Тулаан)",
                            subtitle = "Challenge steppe champions in traditional archery, wrestling, and saber combat",
                            badge = if (combatEnemy != null) "🔥 Combat Ready" else "Enter Arena",
                            badgeColor = if (combatEnemy != null) SteppeRed else SteppeGold,
                            testTag = "activity_duel",
                            onClick = { activeSubScreen = "duel" }
                        )
                    }
                }
            }
        }
    }
}

/**
 * BitLife-style clean activity row
 */
@Composable
private fun BitLifeActivityRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    badge: String,
    badgeColor: androidx.compose.ui.graphics.Color = SteppeGold,
    testTag: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        color = SteppeSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
        modifier = Modifier
            .fillMaxWidth()
            .testTag(testTag)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = SteppeGoldDark.copy(alpha = 0.3f),
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = SteppeGold,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                Column {
                    Text(
                        text = title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = SteppeParchment
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = subtitle,
                        fontSize = 11.sp,
                        color = SteppeParchmentDark,
                        maxLines = 2
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = badge,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor
                    )
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Open",
                tint = SteppeGoldDark,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
