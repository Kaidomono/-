package com.example.steppenomad.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.steppenomad.logic.Season
import com.example.steppenomad.logic.TurnReport
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.theme.*

data class ResourceHistoricalInfo(
    val title: String,
    val subtitle: String,
    val historicalContext: String,
    val icon: ImageVector,
    val accentColor: Color
)

/**
 * Top simulation status component displaying the active turn number, season,
 * and the player's core resource counts (horses, grain, influence, gold, warriors)
 * enhanced with long-press tooltips showcasing 13th-century nomadic life context.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResourceStatusBar(
    turnNumber: Int,
    season: Season,
    character: Character,
    lastTurnReport: TurnReport? = null,
    isSaving: Boolean = false,
    lastSaveTime: Long? = null,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    var selectedResourceInfo by remember { mutableStateOf<ResourceHistoricalInfo?>(null) }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .testTag("resource_status_bar"),
        color = SteppeBrownDark,
        tonalElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 6.dp)
        ) {
            // Turn, Seasonal Year Header and DataStore Save Status Indicator
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        color = SteppeGoldDark.copy(alpha = 0.35f),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.border(1.dp, SteppeGold, RoundedCornerShape(6.dp))
                    ) {
                        Text(
                            text = "TURN $turnNumber",
                            modifier = Modifier
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                                .testTag("turn_counter_badge"),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                    }

                    Text(
                        text = "•  ${season.displayName} ${1200 + character.age} CE",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = SteppeParchment
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // DataStore Persistence Status Indicator
                    Surface(
                        color = SteppeSurface,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier
                            .border(1.dp, if (isSaving) SteppeGoldDark else SteppeBorder, RoundedCornerShape(6.dp))
                            .testTag("save_status_indicator")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = if (isSaving) Icons.Default.Sync else Icons.Default.CheckCircle,
                                contentDescription = "DataStore Persistence Status",
                                tint = if (isSaving) SteppeGold else Color(0xFF70D48B),
                                modifier = Modifier.size(11.dp)
                            )
                            Text(
                                text = if (isSaving) "Saving..." else "Saved",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSaving) SteppeGold else SteppeParchmentDark
                            )
                        }
                    }

                    Text(
                        text = "${character.weather} Steppe",
                        fontSize = 11.sp,
                        color = SteppeParchmentDark,
                        fontWeight = FontWeight.Normal
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Resource Badges Strip with Material Icons and +/- Deltas (Horses, Grain, Influence, Gold, Warriors)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(scrollState),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. Horses Resource (with delta & 13th-century tooltip)
                ResourcePill(
                    icon = Icons.Default.Pets,
                    label = "Horses",
                    value = "${character.livestock.horses}",
                    delta = lastTurnReport?.horseChange,
                    accentColor = SteppeGold,
                    testTag = "resource_horses",
                    historicalInfo = ResourceHistoricalInfo(
                        title = "🐎 Horses (Адуу • Morin)",
                        subtitle = "13th-Century Steppe Lifeline & Military Backbone",
                        historicalContext = "In the 13th century, horses were the ultimate measure of nomadic power and wealth. They provided nutritious airag (fermented mare's milk), leather, and unmatched mobility across the Eurasian steppe. Every Mongol warrior maintained 4–5 remount horses to travel vast distances without exhausting their mounts.",
                        icon = Icons.Default.Pets,
                        accentColor = SteppeGold
                    ),
                    onShowInfo = { selectedResourceInfo = it }
                )

                // 2. Grain / Fodder Resource (with delta & 13th-century tooltip)
                ResourcePill(
                    icon = Icons.Default.Grain,
                    label = "Grain",
                    value = "${character.grain}",
                    delta = lastTurnReport?.grainChange,
                    accentColor = Color(0xFFE5C07B),
                    testTag = "resource_grain",
                    historicalInfo = ResourceHistoricalInfo(
                        title = "🌾 Grain & Fodder (Өвс, Тариа • Tejeel)",
                        subtitle = "Emergency Provisions & Winter Zud Survival",
                        historicalContext = "While livestock grazed on open pastures, stored barley, millet, and hay were vital for enduring the deadly winter Zud (ice-crust freeze). Stockpiled grain preserved war horses during lengthy sieges and sustained nomad encampments during lean springs.",
                        icon = Icons.Default.Grain,
                        accentColor = Color(0xFFE5C07B)
                    ),
                    onShowInfo = { selectedResourceInfo = it }
                )

                // 3. Influence / Tribal Prestige Resource (with delta & 13th-century tooltip)
                ResourcePill(
                    icon = Icons.Default.MilitaryTech,
                    label = "Influence",
                    value = "${character.influence}",
                    delta = lastTurnReport?.influenceChange,
                    accentColor = Color(0xFF98C379),
                    testTag = "resource_influence",
                    historicalInfo = ResourceHistoricalInfo(
                        title = "🎖️ Influence & Prestige (Нэр Хүнд • Erhem Aldar)",
                        subtitle = "Kurultai Authority, Treaties & Alliances",
                        historicalContext = "Steppe diplomacy depended entirely on honor, blood ties, and vows of brotherhood (Anda). Negotiating non-aggression pacts, trade agreements, defense leagues, and blood brotherhood alliances directly expands seasonal Influence growth, enabling chieftains to summon the grand Kurultai and command vast nomadic confederations.",
                        icon = Icons.Default.MilitaryTech,
                        accentColor = Color(0xFF98C379)
                    ),
                    onShowInfo = { selectedResourceInfo = it }
                )

                // 4. Gold / Wealth Resource (with delta & 13th-century tooltip)
                ResourcePill(
                    icon = Icons.Default.MonetizationOn,
                    label = "Gold",
                    value = "${character.stats.wealth}г",
                    delta = lastTurnReport?.netGoldChange,
                    accentColor = SteppeGold,
                    testTag = "resource_gold",
                    historicalInfo = ResourceHistoricalInfo(
                        title = "💰 Gold & Silver Ingots (Алт • Altan Zoos)",
                        subtitle = "Silk Road Bullion & Imperial Treasury",
                        historicalContext = "Nomads used gold ingots, silver balish, and Silk Road currency to reward brave soldiers, patronize Ortogh merchant caravans, purchase steel weaponry from artisans, and secure alliances across Central Asia.",
                        icon = Icons.Default.MonetizationOn,
                        accentColor = SteppeGold
                    ),
                    onShowInfo = { selectedResourceInfo = it }
                )

                // 5. Warriors / Horde Size (with delta & 13th-century tooltip)
                ResourcePill(
                    icon = Icons.Default.Shield,
                    label = "Warriors",
                    value = "${character.hordeSize}",
                    delta = lastTurnReport?.newWarriorsRecruited?.takeIf { it != 0 },
                    accentColor = Color(0xFFE06C75),
                    testTag = "resource_warriors",
                    historicalInfo = ResourceHistoricalInfo(
                        title = "🛡️ Warriors & Horde (Цэрэг • Cherig)",
                        subtitle = "Decimal Cavalry (Arban, Mingghan, Tumen)",
                        historicalContext = "The Mongol army was organized under Genghis Khan's strict decimal command structure: Arban (10), Jagun (100), Mingghan (1,000), and Tumen (10,000). Mounted composite archers executed synchronized feigned retreats and hunting battues (Nerge) with devastating discipline.",
                        icon = Icons.Default.Shield,
                        accentColor = Color(0xFFE06C75)
                    ),
                    onShowInfo = { selectedResourceInfo = it }
                )
            }
        }
    }

    // Historical Context Modal Dialog on Long-press / Tap
    selectedResourceInfo?.let { info ->
        ResourceHistoricalDialog(
            info = info,
            onDismiss = { selectedResourceInfo = null }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun ResourcePill(
    icon: ImageVector,
    label: String,
    value: String,
    delta: Int? = null,
    accentColor: Color,
    testTag: String,
    historicalInfo: ResourceHistoricalInfo,
    onShowInfo: (ResourceHistoricalInfo) -> Unit,
    modifier: Modifier = Modifier
) {
    val tooltipState = rememberTooltipState(isPersistent = false)

    TooltipBox(
        positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
        tooltip = {
            PlainTooltip(
                containerColor = SteppeSurface,
                contentColor = SteppeParchment,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .border(1.dp, SteppeGoldDark, RoundedCornerShape(8.dp))
                    .padding(4.dp)
            ) {
                Column(modifier = Modifier.padding(6.dp)) {
                    Text(
                        text = historicalInfo.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = SteppeGold
                    )
                    Text(
                        text = historicalInfo.subtitle,
                        fontSize = 10.sp,
                        color = SteppeParchmentDark
                    )
                }
            }
        },
        state = tooltipState
    ) {
        Surface(
            modifier = modifier
                .testTag(testTag)
                .border(1.dp, SteppeBorder, RoundedCornerShape(8.dp))
                .combinedClickable(
                    onClick = { onShowInfo(historicalInfo) },
                    onLongClick = { onShowInfo(historicalInfo) }
                ),
            shape = RoundedCornerShape(8.dp),
            color = SteppeSurface
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = "$label (Long-press for 13th-century history)",
                    tint = accentColor,
                    modifier = Modifier.size(16.dp)
                )
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = label,
                            fontSize = 9.sp,
                            color = SteppeParchmentDark,
                            fontWeight = FontWeight.Medium,
                            lineHeight = 10.sp
                        )

                        // Change delta indicator (+/-) since previous turn
                        if (delta != null && delta != 0) {
                            val deltaText = if (delta > 0) "+$delta" else "$delta"
                            val deltaColor = if (delta > 0) Color(0xFF70D48B) else Color(0xFFF27878)
                            Text(
                                text = deltaText,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = deltaColor,
                                lineHeight = 9.sp
                            )
                        }
                    }
                    Text(
                        text = value,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = accentColor,
                        lineHeight = 13.sp
                    )
                }
            }
        }
    }
}

@Composable
fun ResourceHistoricalDialog(
    info: ResourceHistoricalInfo,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = SteppeSurface,
            border = androidx.compose.foundation.BorderStroke(1.5.dp, SteppeGold),
            tonalElevation = 12.dp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .testTag("resource_historical_dialog")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header with Icon
                Surface(
                    color = info.accentColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .size(52.dp)
                        .border(1.dp, info.accentColor.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = info.icon,
                            contentDescription = info.title,
                            tint = info.accentColor,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = info.title,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )

                Text(
                    text = info.subtitle,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = SteppeParchmentDark,
                    modifier = Modifier.padding(top = 2.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Steppe 13th-century historical nomadic lore card
                Surface(
                    color = SteppeBrownDark,
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.HistoryEdu,
                                contentDescription = null,
                                tint = SteppeGold,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "13th-Century Steppe Context",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = info.historicalContext,
                            fontSize = 13.sp,
                            color = SteppeParchment,
                            lineHeight = 19.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SteppeGold,
                        contentColor = SteppeBrownDark
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("dismiss_historical_dialog_button")
                ) {
                    Text(
                        text = "Understood (Мэдлээ)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
