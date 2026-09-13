package com.example.steppenomad.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.CombatOutcome
import com.example.steppenomad.model.Combatant
import com.example.steppenomad.ui.components.StatBadge
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

@Composable
fun CombatSimulatorScreen(
    character: Character,
    difficulty: Int,
    enemy: Combatant?,
    outcome: CombatOutcome?,
    onSetDifficulty: (Int) -> Unit,
    onSimulateCombat: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            SteppeCard(borderColor = SteppeGold) {
                Text(
                    text = "Steppe Single Combat & Duels",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Text(
                    text = "Test your weapons, armor, archery, and raw endurance against rival steppe warriors in honor duels.",
                    fontSize = 12.sp,
                    color = SteppeParchmentDark
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Select Opponent Tier (Tier $difficulty):",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeParchment
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    (1..6).forEach { diff ->
                        val isSelected = diff == difficulty
                        Button(
                            onClick = { onSetDifficulty(diff) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) SteppeGold else SteppeSurfaceVariant,
                                contentColor = if (isSelected) SteppeBrownDark else SteppeParchment
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("T$diff", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Versus Matchup Card
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Player Side
                SteppeCard(
                    modifier = Modifier.weight(1f),
                    borderColor = SteppeGreen
                ) {
                    Text(text = "🛡️ ${character.name}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeGreen)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Health: ${character.stats.health}", fontSize = 11.sp, color = SteppeParchment)
                    Text("Strength: ${character.stats.strength}", fontSize = 11.sp, color = SteppeParchment)
                    Text("Archery: ${character.stats.archery}", fontSize = 11.sp, color = SteppeParchment)
                }

                // Enemy Side
                SteppeCard(
                    modifier = Modifier.weight(1f),
                    borderColor = SteppeRed
                ) {
                    val enemyName = enemy?.name ?: "Opponent (Tier $difficulty)"
                    Text(text = "⚔️ $enemyName", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeRed)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Endurance: ${enemy?.stats?.endurance ?: (40 + difficulty * 7)}", fontSize = 11.sp, color = SteppeParchment)
                    Text("Strength: ${enemy?.stats?.strength ?: (30 + difficulty * 6)}", fontSize = 11.sp, color = SteppeParchment)
                    Text("Skill: ${enemy?.stats?.skill ?: (20 + difficulty * 5)}", fontSize = 11.sp, color = SteppeParchment)
                }
            }
        }

        // Engage in Duel Button
        item {
            Button(
                onClick = onSimulateCombat,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SteppeRed,
                    contentColor = SteppeParchment
                ),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.FlashOn, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "ENGAGE IN DUEL (Tier $difficulty)",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }

        // Combat Outcome & Log
        if (outcome != null) {
            val isPlayerWinner = outcome.winner == character.name
            item {
                SteppeCard(
                    borderColor = if (isPlayerWinner) SteppeGreen else SteppeRed
                ) {
                    Text(
                        text = if (isPlayerWinner) "🏆 VICTORY!" else "💀 DEFEAT!",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isPlayerWinner) SteppeGreen else SteppeRed
                    )
                    Text(
                        text = "Duel resolved in ${outcome.rounds} exchanges. Win Probability was estimated at ${outcome.probability}%.",
                        fontSize = 12.sp,
                        color = SteppeParchment
                    )
                }
            }

            item {
                Text(
                    text = "Round-by-Round Combat Exchanges",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
            }

            items(outcome.log) { logEntry ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .border(1.dp, SteppeBorder, RoundedCornerShape(6.dp)),
                    color = SteppeSurfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "R${logEntry.turn}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = logEntry.message,
                            fontSize = 12.sp,
                            color = SteppeParchment
                        )
                    }
                }
            }
        }
    }
}
