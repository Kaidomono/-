package com.example.steppenomad

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.components.SteppeHeader
import com.example.steppenomad.ui.screens.CharacterCreationScreen
import com.example.steppenomad.ui.screens.IntroScreen
import com.example.steppenomad.ui.screens.MainGameScreen
import com.example.steppenomad.ui.theme.*
import com.example.steppenomad.viewmodel.GameViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Immersive Fullscreen Mode (hide system status and navigation bars, transient on swipe)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        setContent {
            SteppeNomadTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val gamePhase by viewModel.gamePhase.collectAsState()
                    val character by viewModel.character.collectAsState()
                    val savedGameState by viewModel.savedGameState.collectAsState()

                    when (gamePhase) {
                        "INTRO" -> {
                            val isSoundEnabled by viewModel.isSoundEnabled.collectAsState()
                            val saveSlots by viewModel.saveSlots.collectAsState()
                            val activeSlotId by viewModel.activeSlotId.collectAsState()
                            IntroScreen(
                                savedGameState = savedGameState,
                                saveSlots = saveSlots,
                                activeSlotId = activeSlotId,
                                onResumeJourney = { viewModel.resumeSavedSimulation() },
                                onBeginJourney = { targetSlotId -> viewModel.startCreation(targetSlotId) },
                                onLoadSlot = { slotId -> viewModel.resumeSavedSimulation(slotId) },
                                onDeleteSlot = { slotId -> viewModel.deleteSlot(slotId) },
                                isSoundEnabled = isSoundEnabled,
                                onToggleSound = { viewModel.toggleSound() }
                            )
                        }
                        "CREATION" -> CharacterCreationScreen(
                            onCreateCharacter = { name, gender, tribe, clan, socialClass, appearance, traits ->
                                viewModel.createCharacter(name, gender, tribe, clan, socialClass, appearance, traits)
                            }
                        )
                        "PLAYING" -> {
                            character?.let {
                                MainGameScreen(viewModel = viewModel, character = it)
                            }
                        }
                        "GAME_OVER" -> {
                            character?.let {
                                GameOverScreen(
                                    character = it,
                                    onRestart = { viewModel.restartGame() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController.hide(WindowInsetsCompat.Type.systemBars())
        }
    }
}

@Composable
fun GameOverScreen(
    character: Character,
    onRestart: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SteppeBrownDark)
            .padding(20.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        SteppeHeader(
            title = "THE ETERNAL BLUE SKY RECEIVES YOU",
            subtitle = "YOUR NOMADIC JOURNEY HAS CONCLUDED"
        )

        Spacer(modifier = Modifier.height(20.dp))

        SteppeCard(borderColor = SteppeGold) {
            Text(
                text = character.name,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            if (character.title != null) {
                Text(
                    text = "Known as ${character.title}",
                    fontSize = 13.sp,
                    color = SteppeParchmentDark,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = character.deathCause ?: "Lived a proud and storied life across the great steppe.",
                fontSize = 13.sp,
                color = SteppeParchment,
                lineHeight = 20.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))
            Divider(color = SteppeBorder)
            Spacer(modifier = Modifier.height(16.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("• Reached the Age of ${character.age} years", fontSize = 13.sp, color = SteppeParchment)
                Text("• Final Role: ${character.role}", fontSize = 13.sp, color = SteppeParchment)
                Text("• Conquered Tribes: ${character.conqueredTribes.size}", fontSize = 13.sp, color = SteppeParchment)
                Text("• Clan Wealth Accumulated: ${character.stats.wealth}г", fontSize = 13.sp, color = SteppeParchment)
                Text("• Children & Descendants: ${character.children}", fontSize = 13.sp, color = SteppeParchment)
                if (character.isGreatKhan) {
                    Text("• 👑 Ascended as Universal Great Khan of the Steppe", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                }
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        Button(
            onClick = onRestart,
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = SteppeGold,
                contentColor = SteppeBrownDark
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.Refresh, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "START NEW LIFE",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}
