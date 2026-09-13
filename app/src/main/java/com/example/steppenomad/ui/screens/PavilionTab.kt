package com.example.steppenomad.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Celebration
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.WineBar
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.Relationship
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

/**
 * Steppe Pavilion & Courtship Screen (Цэнгэлийн Өргөө & Ургийн Холбоо)
 * Houses Marriage Alliances, Pleasure Tent feasting, and Sworn Brotherhood (Andas),
 * keeping the Family tab dedicated exclusively to household kin and descendants.
 */
@Composable
fun PavilionTab(
    character: Character,
    marriageCandidates: List<Relationship>,
    pleasureCandidates: List<Relationship>,
    friendCandidates: List<Relationship>,
    onMarry: (Relationship) -> Unit,
    onVisitPleasure: (Relationship) -> Unit,
    onBefriend: (Relationship) -> Unit
) {
    var selectedFilterIndex by remember { mutableStateOf(0) }
    val filters = listOf(
        "All (${marriageCandidates.size + pleasureCandidates.size + friendCandidates.size})",
        "💍 Marriage (${marriageCandidates.size})",
        "🍷 Pleasure Tent (${pleasureCandidates.size})",
        "🤝 Brotherhood (${friendCandidates.size})"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("pavilion_tab_content"),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Pavilion Hero Banner
        item {
            SteppeCard(
                borderColor = SteppeGold,
                backgroundColor = SteppeBrownDark
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
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
                                text = "Steppe Pavilion & Encampment",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Цэнгэлийн Өргөө, Хурим Зууч & Нөхөрлөл",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = SteppeSunlitDune
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Forge dynastic marriage alliances, relax with companions in the pleasure tent, and swear sacred oaths of brotherhood.",
                            fontSize = 12.sp,
                            lineHeight = 16.sp,
                            color = SteppeParchment
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        color = SteppeSurfaceVariant,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.MonetizationOn,
                                contentDescription = null,
                                tint = SteppeGold,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Gold: ${character.stats.wealth}г",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                        }
                    }

                    Surface(
                        color = SteppeSurfaceVariant,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Favorite,
                                contentDescription = null,
                                tint = SteppeRed,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Morale: ${character.stats.happiness}%",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeParchment
                            )
                        }
                    }
                }
            }
        }

        // Filter / Section Chips
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                filters.forEachIndexed { index, title ->
                    val isSelected = selectedFilterIndex == index
                    Surface(
                        onClick = { selectedFilterIndex = index },
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) SteppeGold else SteppeSurface,
                        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("pavilion_filter_$index")
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
                        ) {
                            Text(
                                text = title,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) SteppeBrownDark else SteppeParchment,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }

        // =====================================================================
        // SECTION 1: MARRIAGE ALLIANCES
        // =====================================================================
        if (selectedFilterIndex == 0 || selectedFilterIndex == 1) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "💍 Marriage Alliances & Suitors (Хурим Зууч)",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Dowry 100г • Brings spouse into your household dynasty",
                            fontSize = 11.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            }

            if (marriageCandidates.isEmpty()) {
                item {
                    SteppeCard {
                        Text(
                            text = "No suitor envoys are currently proposing an alliance. New candidates arrive when you age up or travel the steppe.",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            } else {
                items(marriageCandidates) { candidate ->
                    val canAfford = character.stats.wealth >= 100
                    SteppeCard(borderColor = SteppeGoldDark) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = candidate.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SteppeGold
                                )
                                Text(
                                    text = "Age ${candidate.age}${if (candidate.clan != null) " • ${candidate.clan} Clan" else ""}${if (!candidate.socialClass.isNullOrEmpty()) " • ${candidate.socialClass}" else ""}",
                                    fontSize = 12.sp,
                                    color = SteppeParchmentDark
                                )
                                if (candidate.traits.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        candidate.traits.forEach { trait ->
                                            Surface(
                                                color = SteppeBrownDark,
                                                shape = RoundedCornerShape(4.dp)
                                            ) {
                                                Text(
                                                    text = trait,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                                    fontSize = 10.sp,
                                                    color = SteppeGreenLight
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Button(
                                onClick = { onMarry(candidate) },
                                enabled = canAfford,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SteppeGold,
                                    contentColor = SteppeBrownDark,
                                    disabledContainerColor = SteppeSurfaceVariant,
                                    disabledContentColor = SteppeParchmentDark.copy(alpha = 0.5f)
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("wed_btn_${candidate.id}")
                            ) {
                                Icon(Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (canAfford) "Wed (100г)" else "100г Req.",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // =====================================================================
        // SECTION 2: PLEASURE PAVILION & FEASTING TENT
        // =====================================================================
        if (selectedFilterIndex == 0 || selectedFilterIndex == 2) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "🍷 Pleasure Pavilion & Feasting (Цэнгэлийн Өргөө)",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Entry 50г • Restores +25 Happiness & Morale",
                            fontSize = 11.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            }

            if (pleasureCandidates.isEmpty()) {
                item {
                    SteppeCard {
                        Text(
                            text = "The pleasure pavilion is closed for festival preparations. Envoys and performers return next season.",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            } else {
                items(pleasureCandidates) { candidate ->
                    val canAfford = character.stats.wealth >= 50
                    SteppeCard(borderColor = SteppeBronze) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = candidate.name,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SteppeParchment
                                )
                                if (candidate.appearance != null) {
                                    Text(
                                        text = candidate.appearance,
                                        fontSize = 11.sp,
                                        color = SteppeParchmentDark
                                    )
                                }
                                Text(
                                    text = "Feasting, kumis & melodious steppe songs",
                                    fontSize = 10.sp,
                                    color = SteppeGoldDark
                                )
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Button(
                                onClick = { onVisitPleasure(candidate) },
                                enabled = canAfford,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SteppeRed,
                                    contentColor = SteppeParchmentLight,
                                    disabledContainerColor = SteppeSurfaceVariant,
                                    disabledContentColor = SteppeParchmentDark.copy(alpha = 0.5f)
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("visit_pleasure_${candidate.id}")
                            ) {
                                Icon(Icons.Default.WineBar, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (canAfford) "Visit (50г)" else "50г Req.",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // =====================================================================
        // SECTION 3: SWORN BROTHERHOOD (ANDAS)
        // =====================================================================
        if (selectedFilterIndex == 0 || selectedFilterIndex == 3) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "🤝 Steppe Brotherhood & Friends (Анд Нөхөд)",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Swear sacred Anda oaths of lifelong steppe brotherhood",
                            fontSize = 11.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            }

            if (friendCandidates.isEmpty()) {
                item {
                    SteppeCard {
                        Text(
                            text = "No steppe warriors are currently seeking an Anda oath. Meet new comrades when aging up or traveling.",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            } else {
                items(friendCandidates) { friend ->
                    SteppeCard {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = friend.name,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SteppeParchment
                                )
                                Text(
                                    text = "Age ${friend.age} • ${friend.clan} Clan",
                                    fontSize = 11.sp,
                                    color = SteppeParchmentDark
                                )
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Button(
                                onClick = { onBefriend(friend) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SteppeBronze,
                                    contentColor = SteppeParchmentLight
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("swear_anda_${friend.id}")
                            ) {
                                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Swear Oath", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
