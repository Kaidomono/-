package com.example.steppenomad.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.R
import com.example.steppenomad.data.SaveSlotSummary
import com.example.steppenomad.data.SavedGameState
import com.example.steppenomad.ui.components.MainMenuOverlay
import com.example.steppenomad.ui.components.MenuRoute
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.components.SteppeHeader
import com.example.steppenomad.ui.theme.*

@Composable
fun IntroScreen(
    savedGameState: SavedGameState? = null,
    saveSlots: List<SaveSlotSummary> = emptyList(),
    activeSlotId: String = "slot_1",
    onResumeJourney: () -> Unit = {},
    onBeginJourney: (targetSlotId: String?) -> Unit,
    onLoadSlot: (String) -> Unit = {},
    onDeleteSlot: (String) -> Unit = {},
    isSoundEnabled: Boolean = true,
    onToggleSound: () -> Unit = {}
) {
    val scrollState = rememberScrollState()
    var isMenuOpen by remember { mutableStateOf(false) }
    var menuInitialRoute by remember { mutableStateOf(MenuRoute.ROOT) }

    val occupiedSlotsCount = remember(saveSlots) { saveSlots.count { it.hasData } }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(SteppeBrownDark)
                .padding(20.dp)
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Quick Menu Bar (Top right menu trigger)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Save Slots Shortcut
                OutlinedButton(
                    onClick = {
                        menuInitialRoute = MenuRoute.SAVE_SLOTS
                        isMenuOpen = true
                    },
                    modifier = Modifier.testTag("intro_slots_shortcut_btn"),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = SteppeSurface,
                        contentColor = SteppeGold
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.FolderSpecial,
                        contentDescription = "Save Slots",
                        modifier = Modifier.size(16.dp),
                        tint = Color(0xFF56B6C2)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "SLOTS ($occupiedSlotsCount/5)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = SteppeParchment
                    )
                }

                // Main Menu Shortcut
                OutlinedButton(
                    onClick = {
                        menuInitialRoute = MenuRoute.ROOT
                        isMenuOpen = true
                    },
                    modifier = Modifier.testTag("intro_main_menu_button"),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeGold),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = SteppeSurface,
                        contentColor = SteppeGold
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = "Main Menu",
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("MENU (#)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Hero App Icon
            Image(
                painter = painterResource(id = R.drawable.steppe_khan_icon_1787051379617),
                contentDescription = "Steppe Khan Emblem",
                modifier = Modifier
                    .size(120.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .border(2.dp, SteppeGold, RoundedCornerShape(24.dp))
            )

            Spacer(modifier = Modifier.height(18.dp))

            SteppeHeader(
                title = "STEPPE LEGACY",
                subtitle = "KHAN'S DESTINY • 13TH CENTURY MONGOLIA"
            )

            Spacer(modifier = Modifier.height(10.dp))

            Surface(
                color = SteppeGoldDark.copy(alpha = 0.35f),
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SteppeGold),
                modifier = Modifier.fillMaxWidth().testTag("version_update_banner")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = SteppeGold,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "✨ ШИНЭЧЛЭЛТ: BitLife 5-Tab & Assets Hub бүрэн орсон!",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = SteppeGold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            SteppeCard(
                backgroundColor = SteppeSurface,
                borderColor = SteppeGoldDark
            ) {
                Text(
                    text = "Under the Eternal Blue Sky, fractured nomadic tribes contest the endless grasslands. From humble pastures to the white felt throne of the Great Khan, your decisions will forge an empire.",
                    fontSize = 14.sp,
                    color = SteppeParchment,
                    lineHeight = 22.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                Divider(color = SteppeBorder)

                Spacer(modifier = Modifier.height(16.dp))

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    FeatureBullet(icon = "🐎", title = "Dynamic Steppe Life", desc = "Herds, pastures, weather, seasonal migrations, and lifespans.")
                    FeatureBullet(icon = "⚔️", title = "Warfare & The Horde", desc = "Recruit tumens, train heavy horse archers, and conquer 12 tribes.")
                    FeatureBullet(icon = "🐪", title = "Silk Road Trade", desc = "Workshops, dynamic market fluctuations, and transcontinental caravans.")
                    FeatureBullet(icon = "💍", title = "Clan Dynasty & Politics", desc = "Marriage alliances, council succession, and royal lineages.")
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Active Game Card
            if (savedGameState != null && savedGameState.character.isAlive) {
                SteppeCard(
                    backgroundColor = SteppeSurfaceVariant,
                    borderColor = SteppeGold
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ACTIVE DYNASTY (${activeSlotId.uppercase()})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Turn ${savedGameState.turnCount} • ${savedGameState.season}",
                            fontSize = 11.sp,
                            color = SteppeParchmentDark
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${savedGameState.character.name} (${savedGameState.character.role})",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = SteppeParchment
                    )
                    Text(
                        text = "${savedGameState.character.clan} • ${savedGameState.character.tribe} • Age ${savedGameState.character.age} • ${savedGameState.character.stats.wealth} Gold • ${savedGameState.character.hordeSize} Warriors",
                        fontSize = 12.sp,
                        color = SteppeParchmentDark
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onResumeJourney,
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                                .testTag("resume_dynasty_button"),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGold,
                                contentColor = SteppeBrownDark
                            ),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "RESUME DYNASTY",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        OutlinedButton(
                            onClick = {
                                menuInitialRoute = MenuRoute.SAVE_SLOTS
                                isMenuOpen = true
                            },
                            modifier = Modifier
                                .height(46.dp)
                                .testTag("intro_switch_slot_button"),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.SwapHoriz, contentDescription = null, tint = SteppeGold, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Slots", color = SteppeParchment, fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }

            // Primary Start Button
            Button(
                onClick = { onBeginJourney(null) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("begin_journey_button"),
                colors = if (savedGameState != null) {
                    ButtonDefaults.buttonColors(
                        containerColor = SteppeSurfaceVariant,
                        contentColor = SteppeParchment
                    )
                } else {
                    ButtonDefaults.buttonColors(
                        containerColor = SteppeGold,
                        contentColor = SteppeBrownDark
                    )
                },
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.RestartAlt, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (savedGameState != null) "START NEW DYNASTY" else "BEGIN NEW DYNASTY",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Quick Navigation Buttons: Saves, Guide, Settings
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        menuInitialRoute = MenuRoute.SAVE_SLOTS
                        isMenuOpen = true
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("intro_saves_btn"),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = SteppeSurface,
                        contentColor = SteppeParchment
                    )
                ) {
                    Icon(Icons.Default.FolderSpecial, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFF56B6C2))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Saves (#)", fontSize = 11.sp)
                }

                OutlinedButton(
                    onClick = {
                        menuInitialRoute = MenuRoute.INSTRUCTIONS
                        isMenuOpen = true
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("intro_instructions_btn"),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = SteppeSurface,
                        contentColor = SteppeParchment
                    )
                ) {
                    Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFF98C379))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Guide (#)", fontSize = 11.sp)
                }

                OutlinedButton(
                    onClick = {
                        menuInitialRoute = MenuRoute.SETTINGS
                        isMenuOpen = true
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .testTag("intro_settings_btn"),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = SteppeSurface,
                        contentColor = SteppeParchment
                    )
                ) {
                    Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFF61AFEF))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Settings (#)", fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }

        // HashRouter Main Menu Overlay
        MainMenuOverlay(
            isOpen = isMenuOpen,
            onDismiss = { isMenuOpen = false },
            onStartNewGame = onBeginJourney,
            onResumeGame = if (savedGameState != null && savedGameState.character.isAlive) onResumeJourney else null,
            isSoundEnabled = isSoundEnabled,
            onToggleSound = onToggleSound,
            saveSlots = saveSlots,
            activeSlotId = activeSlotId,
            onLoadSlot = onLoadSlot,
            onDeleteSlot = onDeleteSlot,
            initialRoute = menuInitialRoute
        )
    }
}

@Composable
private fun FeatureBullet(icon: String, title: String, desc: String) {
    Row(
        verticalAlignment = Alignment.Top,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(text = icon, fontSize = 18.sp)
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
            Text(text = desc, fontSize = 12.sp, color = SteppeParchmentDark)
        }
    }
}
