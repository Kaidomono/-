package com.example.steppenomad.ui.screens

import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.TreatyType
import com.example.steppenomad.model.TribeRelation
import com.example.steppenomad.ui.components.StatProgressBar
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.components.TreatyNegotiationDialog
import com.example.steppenomad.ui.theme.*

@Composable
fun DiplomacyTab(
    character: Character,
    onSendGift: (TribeRelation) -> Unit,
    onDeclareWar: (TribeRelation) -> Unit,
    onConquerTribe: (TribeRelation) -> Unit,
    onNegotiateTreaty: (TribeRelation, TreatyType, Int, Int, Int, String) -> Boolean,
    onRenounceTreaty: (TribeRelation) -> Unit
) {
    val totalTribes = 12
    val conqueredCount = character.conqueredTribes.size
    var activeNegotiatingRelation by remember { mutableStateOf<TribeRelation?>(null) }

    // Calculate total treaty influence yield
    val activeTribeTreaties = character.tribeRelations.filter { it.treatyType != TreatyType.NONE }
    val activeKingdomTreaties = character.kingdomRelations.filter { it.treatyType != TreatyType.NONE }
    val totalActiveTreaties = activeTribeTreaties.size + activeKingdomTreaties.size

    val seasonalTreatyInfluence = activeTribeTreaties.sumOf { if (it.influencePerSeason > 0) it.influencePerSeason else it.treatyType.influenceGainPerSeason } +
            activeKingdomTreaties.sumOf { if (it.influencePerSeason > 0) it.influencePerSeason else (it.treatyType.influenceGainPerSeason + 2) }

    val seasonalTreatyGold = activeTribeTreaties.sumOf { if (it.goldPerSeason > 0) it.goldPerSeason else it.treatyType.goldGainPerSeason } +
            activeKingdomTreaties.sumOf { if (it.goldPerSeason > 0) it.goldPerSeason else (it.treatyType.goldGainPerSeason + 30) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Great Khan Imperial Unification Progress
        item {
            SteppeCard(borderColor = SteppeGold) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (character.isGreatKhan) "👑 UNIVERSAL GREAT KHAN" else "Tribal Unification of Mongolia",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Conquered Tribes: $conqueredCount / $totalTribes • Vassals: ${conqueredCount + character.conqueredKingdoms.size}",
                            fontSize = 12.sp,
                            color = SteppeParchment
                        )
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                StatProgressBar("Subjugation Progress", conqueredCount, totalTribes, color = SteppeGold)
            }
        }

        // Dedicated Clan Treaties & Influence Growth Overview Card
        item {
            SteppeCard(borderColor = if (totalActiveTreaties > 0) Color(0xFF70D48B) else SteppeBorder) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "📜 Clan Treaties & Influence Yield",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                        }
                        Text(
                            text = "Active Treaties: $totalActiveTreaties • Seasonal Influence: +$seasonalTreatyInfluence / turn${if (seasonalTreatyGold > 0) " • Trade Gold: +${seasonalTreatyGold}г" else ""}",
                            fontSize = 12.sp,
                            color = SteppeParchment
                        )
                    }

                    Surface(
                        color = Color(0xFF2E4B33),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.border(1.dp, Color(0xFF70D48B), RoundedCornerShape(6.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.TrendingUp,
                                contentDescription = null,
                                tint = Color(0xFF70D48B),
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = "+$seasonalTreatyInfluence Inf",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF70D48B)
                            )
                        }
                    }
                }

                if (totalActiveTreaties > 0) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Your diplomatic pacts with ${activeTribeTreaties.joinToString { it.name }}${if (activeKingdomTreaties.isNotEmpty()) " and foreign kingdoms" else ""} expand your imperial prestige and influence each season.",
                        fontSize = 11.sp,
                        color = SteppeParchmentDark,
                        lineHeight = 15.sp
                    )
                }
            }
        }

        // Section: Steppe Tribes
        item {
            Text(
                text = "Neighboring Steppe Clans & Tribes (${character.tribeRelations.size})",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
        }

        items(character.tribeRelations) { rel ->
            val isConquered = character.conqueredTribes.contains(rel.name)
            val hasTreaty = rel.treatyType != TreatyType.NONE
            val treatyColor = when (rel.treatyType) {
                TreatyType.BLOOD_ALLIANCE -> Color(0xFFE5C07B)
                TreatyType.MUTUAL_DEFENSE -> Color(0xFF70D48B)
                TreatyType.TRADE_AGREEMENT -> SteppeGold
                TreatyType.NON_AGGRESSION -> Color(0xFF61AFEF)
                TreatyType.PROTECTORATE_VASSAL -> SteppeGoldDark
                TreatyType.NONE -> SteppeBorder
            }

            SteppeCard(
                borderColor = if (isConquered) SteppeGoldDark else if (rel.level == "At War") SteppeRed else if (hasTreaty) treatyColor else SteppeBorder
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = rel.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isConquered) SteppeGold else SteppeParchment
                                )
                                if (isConquered) {
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Surface(
                                        color = SteppeGold,
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = "VASSAL",
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SteppeBrownDark
                                        )
                                    }
                                }
                            }
                            Text(
                                text = "Leader: ${rel.leaderName} • Status: ${rel.level} • Standing: ${rel.standing} • Host: ${rel.militaryPower}",
                                fontSize = 11.sp,
                                color = SteppeParchmentDark
                            )
                        }

                        if (hasTreaty && !isConquered) {
                            Surface(
                                color = treatyColor.copy(alpha = 0.25f),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.border(1.dp, treatyColor, RoundedCornerShape(6.dp))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Handshake,
                                        contentDescription = null,
                                        tint = treatyColor,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Text(
                                        text = "+${rel.treatyType.influenceGainPerSeason} Inf",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = treatyColor
                                    )
                                }
                            }
                        }
                    }

                    if (hasTreaty && !isConquered) {
                        Surface(
                            color = SteppeSurface.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Active Pact: ${rel.treatyType.displayName}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = treatyColor
                                )
                                Text(
                                    text = "+${rel.treatyType.influenceGainPerSeason} Influence / season",
                                    fontSize = 10.sp,
                                    color = Color(0xFF70D48B)
                                )
                            }
                        }
                    }

                    if (!isConquered) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            // Negotiate Treaty Button
                            Button(
                                onClick = { activeNegotiatingRelation = rel },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (hasTreaty) SteppeGoldDark else SteppeGold,
                                    contentColor = SteppeBrownDark
                                ),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier
                                    .weight(1.3f)
                                    .testTag("negotiate_treaty_${rel.name.lowercase().replace(" ", "_")}")
                            ) {
                                Icon(Icons.Default.Handshake, contentDescription = null, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(
                                    text = if (hasTreaty) "Manage Pact" else "Treaty / Alliance",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            // Gift Button
                            Button(
                                onClick = { onSendGift(rel) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SteppeSurface,
                                    contentColor = SteppeParchment
                                ),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier.weight(0.9f)
                            ) {
                                Icon(Icons.Default.CardGiftcard, contentDescription = null, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(2.dp))
                                Text("Gift", fontSize = 11.sp)
                            }

                            if (rel.level != "At War") {
                                Button(
                                    onClick = { onDeclareWar(rel) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = SteppeBrownDark,
                                        contentColor = SteppeRed
                                    ),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                    modifier = Modifier.weight(0.8f)
                                ) {
                                    Icon(Icons.Default.Flag, contentDescription = null, modifier = Modifier.size(13.dp))
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text("War", fontSize = 11.sp)
                                }
                            } else {
                                Button(
                                    onClick = { onConquerTribe(rel) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = SteppeRed,
                                        contentColor = SteppeParchment
                                    ),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Gavel, contentDescription = null, modifier = Modifier.size(13.dp))
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text("Conquer", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Section: Imperial Sedentary Kingdoms
        item {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Imperial Sedentary Kingdoms (${character.kingdomRelations.size})",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
        }

        items(character.kingdomRelations) { rel ->
            val isConquered = character.conqueredKingdoms.contains(rel.name)
            val hasTreaty = rel.treatyType != TreatyType.NONE
            val treatyColor = if (hasTreaty) Color(0xFF70D48B) else SteppeBorder

            SteppeCard(
                borderColor = if (isConquered) SteppeGoldDark else if (rel.level == "At War") SteppeRed else if (hasTreaty) treatyColor else SteppeBorder
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = rel.name,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isConquered) SteppeGold else SteppeParchment
                            )
                            Text(
                                text = "Leader: ${rel.leaderName} • Status: ${rel.level} • Standing: ${rel.standing} • Imperial Host: ${rel.militaryPower}",
                                fontSize = 11.sp,
                                color = SteppeParchmentDark
                            )
                        }

                        if (hasTreaty && !isConquered) {
                            Surface(
                                color = Color(0xFF2E4B33),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.border(1.dp, Color(0xFF70D48B), RoundedCornerShape(6.dp))
                            ) {
                                Text(
                                    text = "+${rel.treatyType.influenceGainPerSeason + 2} Inf / turn",
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF70D48B)
                                )
                            }
                        }
                    }

                    if (hasTreaty && !isConquered) {
                        Text(
                            text = "Imperial Treaty: ${rel.treatyType.displayName} (+${rel.treatyType.influenceGainPerSeason + 2} Influence / season)",
                            fontSize = 11.sp,
                            color = Color(0xFF70D48B),
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    if (!isConquered) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Button(
                                onClick = { activeNegotiatingRelation = rel },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SteppeGold,
                                    contentColor = SteppeBrownDark
                                ),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Handshake, contentDescription = null, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(if (hasTreaty) "Manage Pact" else "Negotiate Pact", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = { onSendGift(rel) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SteppeGoldDark,
                                    contentColor = SteppeParchment
                                ),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Tribute (150г)", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    // Active Treaty Negotiation Dialog
    activeNegotiatingRelation?.let { rel ->
        // Fetch freshest relation state from character
        val latestRelation = character.tribeRelations.find { it.name == rel.name }
            ?: character.kingdomRelations.find { it.name == rel.name }
            ?: rel

        TreatyNegotiationDialog(
            relation = latestRelation,
            character = character,
            onNegotiateTreaty = { treatyType, gold, horses, grain, strategy ->
                onNegotiateTreaty(latestRelation, treatyType, gold, horses, grain, strategy)
            },
            onRenounceTreaty = {
                onRenounceTreaty(latestRelation)
            },
            onDismiss = {
                activeNegotiatingRelation = null
            }
        )
    }
}

