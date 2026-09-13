package com.example.steppenomad.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.GameEvent
import com.example.steppenomad.ui.components.MainMenuOverlay
import com.example.steppenomad.ui.components.MenuRoute
import com.example.steppenomad.ui.components.ResourceStatusBar
import com.example.steppenomad.ui.components.SeasonalBackground
import com.example.steppenomad.ui.theme.*
import com.example.steppenomad.viewmodel.GameViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainGameScreen(
    viewModel: GameViewModel,
    character: Character
) {
    val turnNumber by viewModel.turnNumber.collectAsState()
    val currentSeason by viewModel.currentSeason.collectAsState()
    val lastTurnReport by viewModel.lastTurnReport.collectAsState()
    val currentTab by viewModel.currentTab.collectAsState()
    val currentEvent by viewModel.currentEvent.collectAsState()
    val feedbackMessage by viewModel.feedbackMessage.collectAsState()
    val marriageCandidates by viewModel.marriageCandidates.collectAsState()
    val pleasureCandidates by viewModel.pleasureCandidates.collectAsState()
    val friendCandidates by viewModel.friendCandidates.collectAsState()
    val combatDifficulty by viewModel.combatDifficulty.collectAsState()
    val combatEnemy by viewModel.combatantEnemy.collectAsState()
    val combatOutcome by viewModel.combatOutcome.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val lastSaveTime by viewModel.lastSaveTime.collectAsState()

    var isMenuOpen by remember { mutableStateOf(false) }
    var menuInitialRoute by remember { mutableStateOf(MenuRoute.ROOT) }
    var activitiesSubScreen by remember { mutableStateOf<String?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(feedbackMessage) {
        feedbackMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearFeedback()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            Column(
                modifier = Modifier
                    .background(SteppeBrownDark)
                    .fillMaxWidth()
            ) {
                TopAppBar(
                    title = {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = character.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SteppeGold
                                )
                                if (character.isGreatKhan) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("👑", fontSize = 12.sp)
                                }
                            }
                            Text(
                                text = "Age ${character.age} • ${character.role} • ${character.tribe}",
                                fontSize = 11.sp,
                                color = SteppeParchmentDark
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = SteppeBrownDark,
                        titleContentColor = SteppeGold
                    ),
                    actions = {
                        val isSoundEnabled by viewModel.isSoundEnabled.collectAsState()
                        IconButton(
                            onClick = { viewModel.saveGameManually() },
                            modifier = Modifier.testTag("save_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Save,
                                contentDescription = "Save Game to DataStore",
                                tint = SteppeGold
                            )
                        }

                        IconButton(
                            onClick = { viewModel.toggleSound() },
                            modifier = Modifier.testTag("sound_toggle_button")
                        ) {
                            Icon(
                                imageVector = if (isSoundEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                                contentDescription = if (isSoundEnabled) "Mute Sound" else "Unmute Sound",
                                tint = if (isSoundEnabled) SteppeGold else SteppeParchmentDark
                            )
                        }

                        IconButton(
                            onClick = {
                                menuInitialRoute = MenuRoute.ROOT
                                isMenuOpen = true
                            },
                            modifier = Modifier.testTag("main_menu_open_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "Open Main Menu",
                                tint = SteppeGold
                            )
                        }
                    }
                )

                // Top Resource & Turn Status Component
                ResourceStatusBar(
                    turnNumber = turnNumber,
                    season = currentSeason,
                    character = character,
                    lastTurnReport = lastTurnReport,
                    isSaving = isSaving,
                    lastSaveTime = lastSaveTime
                )
            }
        },
        bottomBar = {
            Surface(
                color = SteppeBrownDark,
                tonalElevation = 8.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("bottom_nav_bar")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val navItems = listOf(
                        Triple(0, "Life", Icons.Default.Person),
                        Triple(1, "Careers", Icons.Default.Work),
                        Triple(2, "Assets", Icons.Default.Inventory2),
                        Triple(3, "Family", Icons.Default.Favorite),
                        Triple(4, "Activities", Icons.Default.Celebration)
                    )

                    navItems.forEach { (index, label, icon) ->
                        val isSelected = currentTab == index
                        Surface(
                            onClick = {
                                if (index == 4 && currentTab == 4) {
                                    activitiesSubScreen = null
                                }
                                viewModel.setTab(index)
                            },
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) SteppeGold else SteppeSurface,
                            border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder.copy(alpha = 0.5f)),
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp)
                                .testTag("nav_tab_$index")
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 2.dp, vertical = 4.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = label,
                                    modifier = Modifier.size(20.dp),
                                    tint = if (isSelected) SteppeBrownDark else SteppeParchmentDark
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = label,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                                    color = if (isSelected) SteppeBrownDark else SteppeParchment,
                                    maxLines = 1,
                                    softWrap = false,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        },
        containerColor = SteppeBrownDark
    ) { innerPadding ->
        SeasonalBackground(
            season = currentSeason,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentTab) {
                0 -> LifeTab(character = character, onAgeUp = { viewModel.ageUp() })
                1 -> OccupationTab(
                    character = character,
                    onPerformAction = { viewModel.performCareerAction(it) },
                    onPromote = { viewModel.promoteRole(it) },
                    onRecruitHorde = { viewModel.recruitHordeSoldiers(it) }
                )
                2 -> AssetsTab(
                    character = character,
                    onSellAsset = { viewModel.sellAsset(it) },
                    onBuildWorkshop = { type, name, cost, inc -> viewModel.buildWorkshop(type, name, cost, inc) },
                    onUpgradeWorkshop = { viewModel.upgradeWorkshop(it) },
                    onDispatchCaravan = { dest, inv, g, d -> viewModel.dispatchCaravan(dest, inv, g, d) },
                    onBuyMarketItem = { viewModel.buyMarketItem(it) },
                    onBuyLivestock = { t, c -> viewModel.buyLivestock(t, c) },
                    onSellLivestock = { t, c -> viewModel.sellLivestock(t, c) },
                    onUpgradePasture = { viewModel.upgradePasture() }
                )
                3 -> RelationshipsTab(
                    character = character,
                    onGift = { viewModel.giftRelationship(it) },
                    onNavigateToPavilion = {
                        activitiesSubScreen = "pavilion"
                        viewModel.setTab(4)
                    }
                )
                4 -> ActivitiesHubTab(
                    character = character,
                    initialSubScreen = activitiesSubScreen,
                    marriageCandidates = marriageCandidates,
                    pleasureCandidates = pleasureCandidates,
                    friendCandidates = friendCandidates,
                    onMarry = { viewModel.marryCandidate(it) },
                    onVisitPleasure = { viewModel.visitPleasureTent(it) },
                    onBefriend = { viewModel.befriendCandidate(it) },
                    onSendGift = { viewModel.sendDiplomaticGift(it) },
                    onDeclareWar = { viewModel.declareWar(it) },
                    onConquerTribe = { viewModel.conquerTribe(it) },
                    onNegotiateTreaty = { rel, treatyType, gold, horses, grain, strategy ->
                        viewModel.negotiateTreaty(rel, treatyType, gold, horses, grain, strategy)
                    },
                    onRenounceTreaty = { viewModel.renounceTreaty(it) },
                    combatDifficulty = combatDifficulty,
                    combatEnemy = combatEnemy,
                    combatOutcome = combatOutcome,
                    onSetDifficulty = { viewModel.setCombatDifficulty(it) },
                    onSimulateCombat = { viewModel.startCombatSimulation() }
                )
                else -> LifeTab(character = character, onAgeUp = { viewModel.ageUp() })
            }
        }
    }

    // Active Event Dialog
    currentEvent?.let { event ->
        AlertDialog(
            onDismissRequest = { /* Modal choice required */ },
            title = {
                Text(
                    text = event.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = SteppeGold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = event.description,
                        fontSize = 13.sp,
                        color = SteppeParchment,
                        lineHeight = 20.sp
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    event.choices.forEach { choice ->
                        Button(
                            onClick = { viewModel.resolveEventChoice(choice) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGoldDark,
                                contentColor = SteppeParchment
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = choice.text,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            },
            confirmButton = {},
            containerColor = SteppeSurface,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.border(2.dp, SteppeGold, RoundedCornerShape(12.dp))
        )
    }

    val saveSlots by viewModel.saveSlots.collectAsState()
    val activeSlotId by viewModel.activeSlotId.collectAsState()

    // Main Menu HashRouter Overlay with Multi-Slot DataStore Support
    MainMenuOverlay(
        isOpen = isMenuOpen,
        onDismiss = { isMenuOpen = false },
        onStartNewGame = { targetSlotId -> viewModel.startCreation(targetSlotId) },
        onResumeGame = { isMenuOpen = false },
        isSoundEnabled = viewModel.isSoundEnabled.collectAsState().value,
        onToggleSound = { viewModel.toggleSound() },
        onManualSave = { viewModel.saveGameManually() },
        saveSlots = saveSlots,
        activeSlotId = activeSlotId,
        onLoadSlot = { slotId -> viewModel.resumeSavedSimulation(slotId) },
        onSaveToSlot = { slotId -> viewModel.saveToSpecificSlot(slotId) },
        onDeleteSlot = { slotId -> viewModel.deleteSlot(slotId) },
        initialRoute = menuInitialRoute
    )
}
