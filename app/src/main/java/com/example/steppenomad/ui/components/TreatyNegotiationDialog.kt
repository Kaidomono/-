package com.example.steppenomad.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.TreatyType
import com.example.steppenomad.model.TribeRelation
import com.example.steppenomad.ui.theme.*
import kotlin.math.max
import kotlin.math.min

/**
 * Material 3 Clan Treaty and Alliance Negotiation Interaction Panel.
 * Allows the player to propose treaties, offer envoys and sweetening gifts,
 * and seal alliances to boost seasonal Influence resource growth.
 */
@Composable
fun TreatyNegotiationDialog(
    relation: TribeRelation,
    character: Character,
    onNegotiateTreaty: (TreatyType, Int, Int, Int, String) -> Boolean,
    onRenounceTreaty: () -> Unit,
    onDismiss: () -> Unit
) {
    var selectedTreaty by remember {
        mutableStateOf(
            if (relation.treatyType != TreatyType.NONE) relation.treatyType else TreatyType.NON_AGGRESSION
        )
    }

    var envoyStrategy by remember { mutableStateOf("Steppe Blood Kinship") }
    var sweetenGold by remember { mutableIntStateOf(0) }
    var sweetenHorses by remember { mutableIntStateOf(0) }
    var sweetenGrain by remember { mutableIntStateOf(0) }
    var showRenounceConfirm by remember { mutableStateOf(false) }

    // Strategy Bonus Calculation
    val strategyBonus = when (envoyStrategy) {
        "Gifts & Luxury" -> (character.stats.intelligence / 10) + (sweetenGold / 15)
        "Military Deterrence" -> (character.stats.leadership / 10) + (character.militaryPower / 500)
        "Steppe Blood Kinship" -> (character.stats.reputation / 10) + (character.stats.loyalty / 15)
        else -> (character.stats.perception / 10)
    }

    val sweetenBonus = (sweetenGold / 10) + (sweetenHorses * 6) + (sweetenGrain / 5)
    val effectiveStanding = relation.standing + sweetenBonus + strategyBonus

    val totalGoldCost = selectedTreaty.goldCost + sweetenGold
    val totalInfluenceCost = selectedTreaty.influenceCost
    val totalHorseCost = selectedTreaty.horseCost + sweetenHorses
    val totalGrainCost = selectedTreaty.grainCost + sweetenGrain

    val canAffordGold = character.stats.wealth >= totalGoldCost
    val canAffordInfluence = character.influence >= totalInfluenceCost
    val canAffordHorses = character.livestock.horses >= totalHorseCost
    val canAffordGrain = character.grain >= totalGrainCost
    val hasMilitaryPower = character.militaryPower >= selectedTreaty.requiredMilitaryPower
    val hasStanding = effectiveStanding >= selectedTreaty.requiredStanding

    val canSealTreaty = canAffordGold && canAffordInfluence && canAffordHorses && canAffordGrain && hasMilitaryPower && hasStanding && (selectedTreaty != TreatyType.NONE)

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.92f)
                .clip(RoundedCornerShape(16.dp))
                .border(2.dp, SteppeGold, RoundedCornerShape(16.dp))
                .testTag("treaty_negotiation_dialog"),
            color = SteppeBrownDark,
            tonalElevation = 12.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "📜 Clan Diplomacy & Treaties",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                        }
                        Text(
                            text = "${relation.name} • Leader: ${relation.leaderName}",
                            fontSize = 12.sp,
                            color = SteppeParchment
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("close_treaty_dialog_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close Dialog",
                            tint = SteppeParchmentDark
                        )
                    }
                }

                Divider(
                    color = SteppeBorder.copy(alpha = 0.5f),
                    modifier = Modifier.padding(vertical = 10.dp)
                )

                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Clan Standing & Active Treaty Summary Card
                    item {
                        SteppeCard(borderColor = SteppeGoldDark) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "${relation.name} (${relation.level})",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = SteppeGold
                                    )
                                    Text(
                                        text = "Military Host: ${relation.militaryPower} warriors • Standing: ${relation.standing}",
                                        fontSize = 12.sp,
                                        color = SteppeParchment
                                    )
                                }

                                if (relation.treatyType != TreatyType.NONE) {
                                    Surface(
                                        color = SteppeGoldDark.copy(alpha = 0.3f),
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.border(1.dp, SteppeGold, RoundedCornerShape(6.dp))
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text(
                                                text = "ACTIVE TREATY",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = SteppeGold
                                            )
                                            Text(
                                                text = "+${relation.treatyType.influenceGainPerSeason} Inf / turn",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF70D48B)
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Standing Progress Meter
                            val standingProgress = ((effectiveStanding + 100).toFloat() / 200f).coerceIn(0f, 1f)
                            val standingColor = if (effectiveStanding >= 40) Color(0xFF70D48B) else if (effectiveStanding >= 0) SteppeGold else SteppeRed

                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "Negotiation Standing (with terms)",
                                        fontSize = 11.sp,
                                        color = SteppeParchmentDark
                                    )
                                    Text(
                                        text = "$effectiveStanding / 100",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = standingColor
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                LinearProgressIndicator(
                                    progress = { standingProgress },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(7.dp)
                                        .clip(RoundedCornerShape(4.dp)),
                                    color = standingColor,
                                    trackColor = SteppeBrownDark
                                )
                            }
                        }
                    }

                    // Diplomatic Chieftain Dialogue / Steppe Quote
                    item {
                        Surface(
                            color = SteppeSurface.copy(alpha = 0.6f),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, SteppeBorder.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(text = "🗣️", fontSize = 16.sp)
                                Column {
                                    Text(
                                        text = "${relation.leaderName} remarks:",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SteppeGold
                                    )
                                    val dialogue = when {
                                        relation.standing >= 50 -> "\"The ties of blood and honor hold fast as a yak-hair tether. Let our banners unite upon the steppe.\""
                                        relation.standing >= 20 -> "\"Our caravans travel safely when our chieftains share meat and kumis in good faith.\""
                                        relation.standing >= 0 -> "\"We watch your warriors carefully. Show us generosity and respect our pasture boundaries.\""
                                        else -> "\"Your riders have ridden too close to our herds. Convince us why we should not loose arrows upon your scouts.\""
                                    }
                                    Text(
                                        text = dialogue,
                                        fontSize = 11.sp,
                                        color = SteppeParchment,
                                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                    )
                                }
                            }
                        }
                    }

                    // Section 1: Envoy Strategy Selection
                    item {
                        Text(
                            text = "1. Choose Diplomatic Envoy Stance",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        val strategies = listOf(
                            Triple("Steppe Blood Kinship", "Honor & Oaths", "Uses Reputation (+${character.stats.reputation / 10})"),
                            Triple("Gifts & Luxury", "Silk & Silver", "Uses Intelligence (+${character.stats.intelligence / 10})"),
                            Triple("Military Deterrence", "Horde Might", "Uses Leadership (+${character.stats.leadership / 10})")
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            strategies.forEach { (name, label, detail) ->
                                val isSelected = envoyStrategy == name
                                Surface(
                                    onClick = { envoyStrategy = name },
                                    modifier = Modifier
                                        .weight(1f)
                                        .border(
                                            1.dp,
                                            if (isSelected) SteppeGold else SteppeBorder.copy(alpha = 0.5f),
                                            RoundedCornerShape(8.dp)
                                        )
                                        .testTag("strategy_${name.lowercase().replace(" ", "_")}"),
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (isSelected) SteppeGoldDark.copy(alpha = 0.35f) else SteppeSurface
                                ) {
                                    Column(
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 8.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = label,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isSelected) SteppeGold else SteppeParchment,
                                            textAlign = TextAlign.Center
                                        )
                                        Text(
                                            text = detail,
                                            fontSize = 9.sp,
                                            color = SteppeParchmentDark,
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Section 2: Sweeten Terms / Extra Gifts
                    item {
                        Text(
                            text = "2. Sweeten Proposal with Gifts (Increases Standing)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Gold Gift
                            GiftStepper(
                                label = "Gold (г)",
                                count = sweetenGold,
                                step = 50,
                                maxVal = character.stats.wealth,
                                onIncrement = { if (character.stats.wealth >= sweetenGold + 50) sweetenGold += 50 },
                                onDecrement = { if (sweetenGold >= 50) sweetenGold -= 50 },
                                modifier = Modifier.weight(1f)
                            )

                            // Horses Gift
                            GiftStepper(
                                label = "Horses",
                                count = sweetenHorses,
                                step = 2,
                                maxVal = character.livestock.horses,
                                onIncrement = { if (character.livestock.horses >= sweetenHorses + 2) sweetenHorses += 2 },
                                onDecrement = { if (sweetenHorses >= 2) sweetenHorses -= 2 },
                                modifier = Modifier.weight(1f)
                            )

                            // Grain Gift
                            GiftStepper(
                                label = "Grain (sacks)",
                                count = sweetenGrain,
                                step = 15,
                                maxVal = character.grain,
                                onIncrement = { if (character.grain >= sweetenGrain + 15) sweetenGrain += 15 },
                                onDecrement = { if (sweetenGrain >= 15) sweetenGrain -= 15 },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Section 3: Treaty Options
                    item {
                        Text(
                            text = "3. Select Treaty or Alliance Agreement",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                    }

                    val availableTreaties = listOf(
                        TreatyType.NON_AGGRESSION,
                        TreatyType.TRADE_AGREEMENT,
                        TreatyType.MUTUAL_DEFENSE,
                        TreatyType.BLOOD_ALLIANCE,
                        TreatyType.PROTECTORATE_VASSAL
                    )

                    items(availableTreaties) { treaty ->
                        val isSelected = selectedTreaty == treaty
                        val isCurrentActive = relation.treatyType == treaty
                        val reqStandingMet = effectiveStanding >= treaty.requiredStanding
                        val reqMilMet = character.militaryPower >= treaty.requiredMilitaryPower

                        TreatyOptionCard(
                            treaty = treaty,
                            isSelected = isSelected,
                            isCurrentActive = isCurrentActive,
                            reqStandingMet = reqStandingMet,
                            reqMilMet = reqMilMet,
                            playerWealth = character.stats.wealth,
                            playerInfluence = character.influence,
                            playerHorses = character.livestock.horses,
                            playerGrain = character.grain,
                            onClick = { selectedTreaty = treaty }
                        )
                    }

                    // Active Treaty Management: Renounce Action
                    if (relation.treatyType != TreatyType.NONE) {
                        item {
                            Spacer(modifier = Modifier.height(4.dp))
                            if (!showRenounceConfirm) {
                                OutlinedButton(
                                    onClick = { showRenounceConfirm = true },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = SteppeRed),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("renounce_treaty_prompt_button")
                                ) {
                                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Renounce Active Treaty (${relation.treatyType.displayName})", fontSize = 12.sp)
                                }
                            } else {
                                Surface(
                                    color = SteppeRed.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(1.dp, SteppeRed, RoundedCornerShape(8.dp))
                                        .padding(10.dp)
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Text(
                                            text = "⚠️ Are you sure? Renouncing the treaty will penalize standing by -25 and cease seasonal Influence growth.",
                                            fontSize = 11.sp,
                                            color = SteppeParchment
                                        )
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.End,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            TextButton(onClick = { showRenounceConfirm = false }) {
                                                Text("Cancel", color = SteppeParchmentDark, fontSize = 11.sp)
                                            }
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Button(
                                                onClick = {
                                                    onRenounceTreaty()
                                                    onDismiss()
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = SteppeRed),
                                                modifier = Modifier.testTag("confirm_renounce_treaty_button")
                                            ) {
                                                Text("Confirm Renunciation", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Divider(
                    color = SteppeBorder.copy(alpha = 0.5f),
                    modifier = Modifier.padding(vertical = 10.dp)
                )

                // Action Footer
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Total Cost Summary Bar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Total Proposal Cost:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = SteppeParchment
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            if (totalGoldCost > 0) {
                                Text(
                                    text = "💰 ${totalGoldCost}г",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (canAffordGold) SteppeGold else SteppeRed
                                )
                            }
                            if (totalInfluenceCost > 0) {
                                Text(
                                    text = "🎖️ ${totalInfluenceCost} Inf",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (canAffordInfluence) Color(0xFF98C379) else SteppeRed
                                )
                            }
                            if (totalHorseCost > 0) {
                                Text(
                                    text = "🐎 ${totalHorseCost} Horses",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (canAffordHorses) SteppeParchment else SteppeRed
                                )
                            }
                            if (totalGrainCost > 0) {
                                Text(
                                    text = "🌾 ${totalGrainCost} Grain",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (canAffordGrain) Color(0xFFE5C07B) else SteppeRed
                                )
                            }
                        }
                    }

                    // Seal Treaty Action Button
                    Button(
                        onClick = {
                            val success = onNegotiateTreaty(
                                selectedTreaty,
                                sweetenGold,
                                sweetenHorses,
                                sweetenGrain,
                                envoyStrategy
                            )
                            if (success) {
                                onDismiss()
                            }
                        },
                        enabled = canSealTreaty,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SteppeGold,
                            contentColor = SteppeBrownDark,
                            disabledContainerColor = SteppeSurface,
                            disabledContentColor = SteppeParchmentDark
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("seal_treaty_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Handshake,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (relation.treatyType == selectedTreaty) "Re-negotiate & Solidify ${selectedTreaty.displayName}" else "Seal ${selectedTreaty.displayName} (+${selectedTreaty.influenceGainPerSeason} Inf/season)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun GiftStepper(
    label: String,
    count: Int,
    step: Int,
    maxVal: Int,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = SteppeSurface,
        shape = RoundedCornerShape(8.dp),
        modifier = modifier.border(1.dp, SteppeBorder.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = label, fontSize = 10.sp, color = SteppeParchmentDark)
            Text(
                text = if (count > 0) "+$count" else "0",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = if (count > 0) SteppeGold else SteppeParchment
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onDecrement,
                    modifier = Modifier.size(24.dp),
                    enabled = count > 0
                ) {
                    Text("-", fontWeight = FontWeight.Bold, color = SteppeParchment, fontSize = 14.sp)
                }
                IconButton(
                    onClick = onIncrement,
                    modifier = Modifier.size(24.dp),
                    enabled = maxVal >= count + step
                ) {
                    Text("+", fontWeight = FontWeight.Bold, color = SteppeGold, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
private fun TreatyOptionCard(
    treaty: TreatyType,
    isSelected: Boolean,
    isCurrentActive: Boolean,
    reqStandingMet: Boolean,
    reqMilMet: Boolean,
    playerWealth: Int,
    playerInfluence: Int,
    playerHorses: Int,
    playerGrain: Int,
    onClick: () -> Unit
) {
    val borderColor = if (isSelected) SteppeGold else if (isCurrentActive) SteppeGoldDark else SteppeBorder.copy(alpha = 0.4f)
    val cardBackground = if (isSelected) SteppeGoldDark.copy(alpha = 0.25f) else SteppeSurface

    Surface(
        onClick = onClick,
        color = cardBackground,
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(if (isSelected) 2.dp else 1.dp, borderColor, RoundedCornerShape(10.dp))
            .testTag("treaty_card_${treaty.code.lowercase()}")
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = isSelected,
                        onClick = onClick,
                        colors = RadioButtonDefaults.colors(
                            selectedColor = SteppeGold,
                            unselectedColor = SteppeParchmentDark
                        ),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = treaty.displayName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) SteppeGold else SteppeParchment
                        )
                        Text(
                            text = treaty.mongolTitle,
                            fontSize = 10.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }

                // Growth Badge
                Surface(
                    color = Color(0xFF2E4B33),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.border(1.dp, Color(0xFF70D48B), RoundedCornerShape(6.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.TrendingUp,
                            contentDescription = null,
                            tint = Color(0xFF70D48B),
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = "+${treaty.influenceGainPerSeason} Inf / season",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF70D48B)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = treaty.description,
                fontSize = 11.sp,
                color = SteppeParchment,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Bonus and Cost Tags
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Requirements
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Req Standing: ${if (treaty.requiredStanding > 0) "+${treaty.requiredStanding}" else "${treaty.requiredStanding}"}",
                        fontSize = 10.sp,
                        color = if (reqStandingMet) Color(0xFF70D48B) else SteppeRed
                    )
                    if (treaty.requiredMilitaryPower > 0) {
                        Text(
                            text = "Req Power: ${treaty.requiredMilitaryPower}",
                            fontSize = 10.sp,
                            color = if (reqMilMet) Color(0xFF70D48B) else SteppeRed
                        )
                    }
                }

                // Costs
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (treaty.goldCost > 0) Text("${treaty.goldCost}г", fontSize = 10.sp, color = SteppeGold)
                    if (treaty.influenceCost > 0) Text("${treaty.influenceCost} Inf", fontSize = 10.sp, color = Color(0xFF98C379))
                    if (treaty.horseCost > 0) Text("${treaty.horseCost} 🐎", fontSize = 10.sp, color = SteppeParchment)
                    if (treaty.grainCost > 0) Text("${treaty.grainCost} 🌾", fontSize = 10.sp, color = Color(0xFFE5C07B))
                }
            }
        }
    }
}
