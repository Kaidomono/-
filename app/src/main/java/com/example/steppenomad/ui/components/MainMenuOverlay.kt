package com.example.steppenomad.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.steppenomad.data.SaveSlotSummary
import com.example.steppenomad.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Route states representing the main menu overlay sections.
 * Mimics HashRouter route matching (#menu, #saves, #instructions, #settings, #newgame).
 */
enum class MenuRoute(val hash: String, val title: String) {
    ROOT("#menu", "Main Menu"),
    SAVE_SLOTS("#saves", "Manage Save Slots"),
    INSTRUCTIONS("#instructions", "Nomadic Guide & Lore"),
    SETTINGS("#settings", "Settings & Audio"),
    NEW_GAME_CONFIRM("#newgame", "Begin New Dynasty")
}

/**
 * Main Menu Overlay supporting hash-based screen routing (#menu, #saves, #instructions, #settings).
 * Enables starting a new game, managing multi-slot DataStore game saves, reviewing gameplay instructions,
 * and configuring app settings.
 */
@Composable
fun MainMenuOverlay(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onStartNewGame: (targetSlotId: String?) -> Unit,
    onResumeGame: (() -> Unit)? = null,
    isSoundEnabled: Boolean,
    onToggleSound: () -> Unit,
    onManualSave: (() -> Unit)? = null,
    saveSlots: List<SaveSlotSummary> = emptyList(),
    activeSlotId: String = "slot_1",
    onLoadSlot: (String) -> Unit = {},
    onSaveToSlot: ((String) -> Unit)? = null,
    onDeleteSlot: (String) -> Unit = {},
    initialRoute: MenuRoute = MenuRoute.ROOT
) {
    if (!isOpen) return

    var currentRoute by remember(isOpen) { mutableStateOf(initialRoute) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.75f))
                .padding(16.dp)
                .testTag("main_menu_overlay"),
            shape = RoundedCornerShape(16.dp),
            color = SteppeBrownDark,
            border = androidx.compose.foundation.BorderStroke(1.5.dp, SteppeGold),
            tonalElevation = 16.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Bar with Back/Close navigation
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (currentRoute != MenuRoute.ROOT) {
                        IconButton(
                            onClick = { currentRoute = MenuRoute.ROOT },
                            modifier = Modifier.testTag("menu_back_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back to Main Menu",
                                tint = SteppeGold
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.size(48.dp))
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = currentRoute.title.uppercase(),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = SteppeGold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Route: ${currentRoute.hash}",
                            fontSize = 10.sp,
                            color = SteppeParchmentDark
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("menu_close_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close Menu",
                            tint = SteppeParchmentDark
                        )
                    }
                }

                Divider(
                    color = SteppeGoldDark.copy(alpha = 0.4f),
                    modifier = Modifier.padding(vertical = 10.dp)
                )

                // Animated HashRouter Body Transition
                AnimatedContent(
                    targetState = currentRoute,
                    transitionSpec = {
                        slideInHorizontally { width -> width } + fadeIn() togetherWith
                                slideOutHorizontally { width -> -width } + fadeOut()
                    },
                    label = "MenuHashRouterTransition",
                    modifier = Modifier.weight(1f)
                ) { route ->
                    when (route) {
                        MenuRoute.ROOT -> MenuRootView(
                            onResumeGame = onResumeGame?.let { { it(); onDismiss() } },
                            onNewGameClick = { currentRoute = MenuRoute.NEW_GAME_CONFIRM },
                            onSaveSlotsClick = { currentRoute = MenuRoute.SAVE_SLOTS },
                            onInstructionsClick = { currentRoute = MenuRoute.INSTRUCTIONS },
                            onSettingsClick = { currentRoute = MenuRoute.SETTINGS },
                            onSaveClick = onManualSave,
                            saveSlotsCount = saveSlots.count { it.hasData }
                        )
                        MenuRoute.SAVE_SLOTS -> MenuSaveSlotsView(
                            saveSlots = saveSlots,
                            activeSlotId = activeSlotId,
                            onLoadSlot = { slotId ->
                                onLoadSlot(slotId)
                                onDismiss()
                            },
                            onSaveToSlot = onSaveToSlot,
                            onDeleteSlot = onDeleteSlot,
                            onStartNewInSlot = { slotId ->
                                onStartNewGame(slotId)
                                onDismiss()
                            }
                        )
                        MenuRoute.INSTRUCTIONS -> MenuInstructionsView()
                        MenuRoute.SETTINGS -> MenuSettingsView(
                            isSoundEnabled = isSoundEnabled,
                            onToggleSound = onToggleSound,
                            onManualSave = onManualSave
                        )
                        MenuRoute.NEW_GAME_CONFIRM -> MenuNewGameConfirmView(
                            onConfirm = {
                                onStartNewGame(null)
                                onDismiss()
                            },
                            onCancel = { currentRoute = MenuRoute.ROOT }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MenuRootView(
    onResumeGame: (() -> Unit)?,
    onNewGameClick: () -> Unit,
    onSaveSlotsClick: () -> Unit,
    onInstructionsClick: () -> Unit,
    onSettingsClick: () -> Unit,
    onSaveClick: (() -> Unit)?,
    saveSlotsCount: Int
) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "STEPPE NOMAD",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = SteppeGold,
            letterSpacing = 2.sp
        )
        Text(
            text = "13th-Century Nomadic Empire Simulator",
            fontSize = 12.sp,
            color = SteppeParchmentDark
        )

        Spacer(modifier = Modifier.height(6.dp))

        // Resume Game Action
        if (onResumeGame != null) {
            MenuNavigationButton(
                title = "Resume Active Dynasty",
                subtitle = "Continue currently active campaign",
                icon = Icons.Default.PlayArrow,
                accentColor = SteppeGold,
                onClick = onResumeGame,
                testTag = "menu_btn_resume"
            )
        }

        // Save Slots / Multi-Slot DataStore Action
        MenuNavigationButton(
            title = "Manage Save Slots",
            subtitle = "Switch, load, and manage up to 5 game saves ($saveSlotsCount/5 active)",
            icon = Icons.Default.FolderSpecial,
            accentColor = Color(0xFF56B6C2),
            onClick = onSaveSlotsClick,
            testTag = "menu_btn_save_slots"
        )

        // New Game Action
        MenuNavigationButton(
            title = "Start New Game",
            subtitle = "Begin a fresh nomadic dynasty",
            icon = Icons.Default.RestartAlt,
            accentColor = Color(0xFFE5C07B),
            onClick = onNewGameClick,
            testTag = "menu_btn_new_game"
        )

        // Instructions & Lore Action
        MenuNavigationButton(
            title = "Game Instructions & Lore",
            subtitle = "Learn mechanics, seasons, and military tactics",
            icon = Icons.Default.MenuBook,
            accentColor = Color(0xFF98C379),
            onClick = onInstructionsClick,
            testTag = "menu_btn_instructions"
        )

        // Settings Action
        MenuNavigationButton(
            title = "Settings & Audio",
            subtitle = "Volume, persistence & simulation options",
            icon = Icons.Default.Settings,
            accentColor = Color(0xFF61AFEF),
            onClick = onSettingsClick,
            testTag = "menu_btn_settings"
        )

        // Quick Save Option
        if (onSaveClick != null) {
            MenuNavigationButton(
                title = "Quick Save Game",
                subtitle = "Persist current progress to active DataStore slot",
                icon = Icons.Default.Save,
                accentColor = Color(0xFFC678DD),
                onClick = onSaveClick,
                testTag = "menu_btn_quick_save"
            )
        }
    }
}

/**
 * View showing all 5 DataStore save slots with detailed cards and management actions
 */
@Composable
private fun MenuSaveSlotsView(
    saveSlots: List<SaveSlotSummary>,
    activeSlotId: String,
    onLoadSlot: (String) -> Unit,
    onSaveToSlot: ((String) -> Unit)?,
    onDeleteSlot: (String) -> Unit,
    onStartNewInSlot: (String) -> Unit
) {
    val scrollState = rememberScrollState()
    var slotToDelete by remember { mutableStateOf<SaveSlotSummary?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "DATASTORE SAVE SLOTS",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold,
                letterSpacing = 1.sp
            )
            Text(
                text = "Active: ${activeSlotId.uppercase()}",
                fontSize = 11.sp,
                color = SteppeParchmentDark
            )
        }

        Text(
            text = "Each slot stores complete character stats, dynasty history, clan relationships, horde armies, and seasonal state on local DataStore.",
            fontSize = 11.sp,
            color = SteppeParchmentDark,
            lineHeight = 15.sp
        )

        Spacer(modifier = Modifier.height(4.dp))

        if (saveSlots.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = SteppeGold, modifier = Modifier.size(28.dp))
            }
        } else {
            saveSlots.forEach { slot ->
                SaveSlotCard(
                    slot = slot,
                    isActive = slot.slotId == activeSlotId,
                    onLoad = { onLoadSlot(slot.slotId) },
                    onSaveHere = onSaveToSlot?.let { { it(slot.slotId) } },
                    onDelete = { slotToDelete = slot },
                    onStartNewHere = { onStartNewInSlot(slot.slotId) }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }

    // Delete Confirmation Dialog
    if (slotToDelete != null) {
        val target = slotToDelete!!
        AlertDialog(
            onDismissRequest = { slotToDelete = null },
            title = {
                Text(
                    text = "Delete Save Slot ${target.slotNumber}?",
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
            },
            text = {
                Text(
                    text = "Are you sure you want to delete the save for ${target.characterName} (${target.clanAndTribe})? This action cannot be undone.",
                    color = SteppeParchment,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteSlot(target.slotId)
                        slotToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SteppeRed,
                        contentColor = Color.White
                    ),
                    modifier = Modifier.testTag("confirm_delete_slot_btn")
                ) {
                    Text("Delete Save", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { slotToDelete = null },
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder)
                ) {
                    Text("Cancel", color = SteppeParchment)
                }
            },
            containerColor = SteppeBrownDark,
            shape = RoundedCornerShape(12.dp)
        )
    }
}

@Composable
private fun SaveSlotCard(
    slot: SaveSlotSummary,
    isActive: Boolean,
    onLoad: () -> Unit,
    onSaveHere: (() -> Unit)?,
    onDelete: () -> Unit,
    onStartNewHere: () -> Unit
) {
    val formattedDate = remember(slot.savedTimestamp) {
        if (slot.savedTimestamp > 0) {
            val sdf = SimpleDateFormat("MMM dd, yyyy • HH:mm", Locale.getDefault())
            sdf.format(Date(slot.savedTimestamp))
        } else ""
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (isActive && slot.hasData) SteppeSurfaceVariant else SteppeSurface,
        border = androidx.compose.foundation.BorderStroke(
            if (isActive) 1.5.dp else 1.dp,
            if (isActive) SteppeGold else SteppeBorder
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("save_slot_card_${slot.slotId}")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // Header Row: Slot Number + Active Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        color = if (slot.hasData) SteppeGoldDark.copy(alpha = 0.3f) else SteppeSurfaceVariant,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "SLOT ${slot.slotNumber}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (slot.hasData) SteppeGold else SteppeParchmentDark,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }

                    if (isActive) {
                        Surface(
                            color = SteppeGold,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "ACTIVE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeBrownDark,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                if (slot.hasData && formattedDate.isNotEmpty()) {
                    Text(
                        text = formattedDate,
                        fontSize = 10.sp,
                        color = SteppeParchmentDark
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (slot.hasData) {
                // Character Dynasty Info
                Text(
                    text = slot.characterName,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeParchment
                )
                Text(
                    text = "${slot.clanAndTribe} • Age ${slot.age}",
                    fontSize = 12.sp,
                    color = SteppeParchmentDark
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    SlotStatBadge(icon = "⏳", label = "Turn ${slot.turnCount}")
                    SlotStatBadge(icon = "🍂", label = slot.season)
                    SlotStatBadge(icon = "💰", label = "${slot.wealth}г")
                    SlotStatBadge(icon = "🐎", label = "${slot.hordeSize} horde")
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Action Buttons Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Load Dynasty
                    Button(
                        onClick = onLoad,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SteppeGold,
                            contentColor = SteppeBrownDark
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(38.dp)
                            .testTag("load_slot_btn_${slot.slotId}")
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Load", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    // Save / Overwrite to here (if currently playing)
                    if (onSaveHere != null) {
                        OutlinedButton(
                            onClick = onSaveHere,
                            border = androidx.compose.foundation.BorderStroke(1.dp, SteppeGold),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp)
                                .testTag("save_to_slot_btn_${slot.slotId}")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null, tint = SteppeGold, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Overwrite", fontSize = 11.sp, color = SteppeGold, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Delete Slot
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier
                            .size(38.dp)
                            .testTag("delete_slot_btn_${slot.slotId}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteOutline,
                            contentDescription = "Delete Save Slot",
                            tint = SteppeRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            } else {
                // Empty Slot Content
                Text(
                    text = "Empty Save Slot",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = SteppeParchmentDark
                )
                Text(
                    text = "No recorded dynasty in this slot.",
                    fontSize = 11.sp,
                    color = SteppeParchmentDark.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onStartNewHere,
                        border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(36.dp)
                            .testTag("new_dynasty_slot_btn_${slot.slotId}")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp), tint = SteppeGold)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("New Dynasty Here", fontSize = 11.sp, color = SteppeParchment)
                    }

                    if (onSaveHere != null) {
                        Button(
                            onClick = onSaveHere,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGold,
                                contentColor = SteppeBrownDark
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(36.dp)
                                .testTag("save_new_slot_btn_${slot.slotId}")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Save Current", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SlotStatBadge(icon: String, label: String) {
    Surface(
        color = SteppeBrownDark.copy(alpha = 0.6f),
        shape = RoundedCornerShape(6.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, SteppeBorder)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(icon, fontSize = 10.sp)
            Text(label, fontSize = 10.sp, color = SteppeParchment, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun MenuInstructionsView() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        InstructionSection(
            icon = "🐎",
            title = "Four Steppe Seasons & Zud",
            content = "Time progresses one season per turn (Spring, Summer, Autumn, Winter). In Spring and Summer, herds reproduce and pasture is lush. In Winter, ensure adequate Grain stocks to prevent starvation during harsh freezing Zuds."
        )

        InstructionSection(
            icon = "⚔️",
            title = "Decimal Army & Warfare",
            content = "Command decimal units: Arban (10), Mingghan (1,000), and Tumen (10,000). Recruit warriors, forge steel composite bows, and conquer rival tribes on the World Map to claim tribute and cattle."
        )

        InstructionSection(
            icon = "🐪",
            title = "Caravans & Silk Road Markets",
            content = "Trade goods (horses, wool, dried curds, silk) across central trading hubs. Invest in workshops and fund Ortogh merchant caravans for passive seasonal dividends."
        )

        InstructionSection(
            icon = "💍",
            title = "Dynasty, Family & Kurultai",
            content = "Forge diplomatic marriage alliances, take concubines at the Pleasure Pavilion, and manage clan loyalty. Increase your Influence to ascend the throne as Great Khan."
        )

        InstructionSection(
            icon = "🛡️",
            title = "Resource Long-Press Lore",
            content = "Long-press any resource badge at the top bar at any time to inspect authentic 13th-century Mongolian historical details and tactical significance."
        )

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun MenuSettingsView(
    isSoundEnabled: Boolean,
    onToggleSound: () -> Unit,
    onManualSave: (() -> Unit)?
) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Audio Toggle Card
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = SteppeSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isSoundEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                        contentDescription = null,
                        tint = if (isSoundEnabled) SteppeGold else SteppeParchmentDark,
                        modifier = Modifier.size(24.dp)
                    )
                    Column {
                        Text(
                            text = "Sound Effects & Audio",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeParchment
                        )
                        Text(
                            text = if (isSoundEnabled) "Enabled (Synthesized & Ambience)" else "Muted",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }

                Switch(
                    checked = isSoundEnabled,
                    onCheckedChange = { onToggleSound() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = SteppeBrownDark,
                        checkedTrackColor = SteppeGold,
                        uncheckedThumbColor = SteppeParchmentDark,
                        uncheckedTrackColor = SteppeSurfaceVariant
                    ),
                    modifier = Modifier.testTag("sound_settings_switch")
                )
            }
        }

        // Manual DataStore Save Card
        if (onManualSave != null) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = SteppeSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Save,
                            contentDescription = null,
                            tint = SteppeGold,
                            modifier = Modifier.size(24.dp)
                        )
                        Column {
                            Text(
                                text = "DataStore Backup",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeParchment
                            )
                            Text(
                                text = "Instantly write simulation state to active save slot",
                                fontSize = 11.sp,
                                color = SteppeParchmentDark
                            )
                        }
                    }

                    Button(
                        onClick = onManualSave,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SteppeGold,
                            contentColor = SteppeBrownDark
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.testTag("manual_save_settings_btn")
                    ) {
                        Text("Save Now", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // About & Version Card
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = SteppeSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Historical Simulation Engine",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Steppe Nomad: Khan's Destiny v2.0 • 13th Century Mongolia. Features 5 offline DataStore save slots, dynamic procedural seasonal transitions, and authentic Yassa steppe lore.",
                    fontSize = 11.sp,
                    color = SteppeParchmentDark,
                    lineHeight = 16.sp
                )
            }
        }
    }
}

@Composable
private fun MenuNewGameConfirmView(
    onConfirm: () -> Unit,
    onCancel: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Warning,
            contentDescription = null,
            tint = SteppeGold,
            modifier = Modifier.size(48.dp)
        )

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            text = "START NEW DYNASTY?",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = SteppeGold,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "Starting a new game will begin a fresh campaign. You can also pick a specific empty save slot from the 'Manage Save Slots' menu.",
            fontSize = 13.sp,
            color = SteppeParchment,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onCancel,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .testTag("cancel_new_game_btn"),
                shape = RoundedCornerShape(10.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder)
            ) {
                Text("Cancel", color = SteppeParchment)
            }

            Button(
                onClick = onConfirm,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .testTag("confirm_new_game_btn"),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SteppeGold,
                    contentColor = SteppeBrownDark
                )
            ) {
                Text("Begin Anew", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun MenuNavigationButton(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit,
    testTag: String
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = SteppeSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
        modifier = Modifier
            .fillMaxWidth()
            .testTag(testTag)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Surface(
                color = accentColor.copy(alpha = 0.15f),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .size(42.dp)
                    .border(1.dp, accentColor.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeParchment
                )
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = SteppeParchmentDark
                )
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = SteppeParchmentDark,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun InstructionSection(
    icon: String,
    title: String,
    content: String
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = SteppeSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(icon, fontSize = 16.sp)
                Text(
                    text = title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = content,
                fontSize = 12.sp,
                color = SteppeParchment,
                lineHeight = 18.sp
            )
        }
    }
}
