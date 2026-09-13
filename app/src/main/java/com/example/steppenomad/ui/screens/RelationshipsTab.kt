package com.example.steppenomad.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Celebration
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.Relationship
import com.example.steppenomad.ui.components.StatProgressBar
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

/**
 * Family & Household Tab (Гэр Бүл & Өрх)
 * Focused exclusively on the player's immediate family: spouses, children, parents,
 * elders, and sworn household members.
 * Marriage matchmaking and pleasure tent activities are placed in the Steppe Pavilion tab.
 */
@Composable
fun RelationshipsTab(
    character: Character,
    onGift: (Relationship) -> Unit,
    onNavigateToPavilion: () -> Unit
) {
    val spouses = remember(character.relationships) {
        character.relationships.filter {
            it.type.equals("Spouse", ignoreCase = true) ||
            it.type.equals("Wife", ignoreCase = true) ||
            it.type.equals("Husband", ignoreCase = true)
        }
    }

    val children = remember(character.relationships) {
        character.relationships.filter {
            it.type.equals("Child", ignoreCase = true) ||
            it.type.equals("Son", ignoreCase = true) ||
            it.type.equals("Daughter", ignoreCase = true)
        }
    }

    val parentsAndKin = remember(character.relationships) {
        character.relationships.filter {
            it.type.equals("Father", ignoreCase = true) ||
            it.type.equals("Mother", ignoreCase = true) ||
            it.type.equals("Parent", ignoreCase = true) ||
            it.type.equals("Sibling", ignoreCase = true) ||
            it.type.equals("Brother", ignoreCase = true) ||
            it.type.equals("Sister", ignoreCase = true) ||
            it.type.equals("Kin", ignoreCase = true) ||
            it.type.equals("Elder", ignoreCase = true)
        }
    }

    val swornFriends = remember(character.relationships) {
        character.relationships.filter {
            it.type.equals("Friend", ignoreCase = true) ||
            it.type.equals("Anda", ignoreCase = true)
        }
    }

    var selectedSection by remember { mutableStateOf(0) }
    val sectionNames = listOf(
        "All (${character.relationships.size})",
        "Spouses (${spouses.size})",
        "Children (${children.size})",
        "Kin (${parentsAndKin.size})",
        "Andas (${swornFriends.size})"
    )

    val displayedRelationships = when (selectedSection) {
        1 -> spouses
        2 -> children
        3 -> parentsAndKin
        4 -> swornFriends
        else -> character.relationships
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("family_tab_content"),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Family Dynasty Banner
        item {
            SteppeCard(
                borderColor = SteppeGoldDark,
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
                                imageVector = Icons.Default.Groups,
                                contentDescription = null,
                                tint = SteppeGold,
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = "Family, Kin & Household",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Гэр Бүл, Ураг Төрөл & Үр Залгамж",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = SteppeSunlitDune
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Manage your household loyalty, nurture your children, and honor ancestral kin.",
                            fontSize = 12.sp,
                            color = SteppeParchment
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Lineage Summary Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        color = SteppeSurfaceVariant,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Spouses", fontSize = 10.sp, color = SteppeParchmentDark)
                            Text("${spouses.size}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                        }
                    }

                    Surface(
                        color = SteppeSurfaceVariant,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Children", fontSize = 10.sp, color = SteppeParchmentDark)
                            Text("${character.children.coerceAtLeast(children.size)}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SteppeGreenLight)
                        }
                    }

                    Surface(
                        color = SteppeSurfaceVariant,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Household", fontSize = 10.sp, color = SteppeParchmentDark)
                            Text("${character.relationships.size}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SteppeParchment)
                        }
                    }
                }
            }
        }

        // Dedicated Matchmaker & Pavilion Redirection Banner (if unwed or seeking alliances)
        if (spouses.isEmpty()) {
            item {
                SteppeCard(
                    borderColor = SteppeGold,
                    backgroundColor = SteppeSurfaceVariant
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Favorite,
                                    contentDescription = null,
                                    tint = SteppeGold,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = "Seeking a Marriage Alliance?",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SteppeGold
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "You do not have a spouse yet. Visit the Steppe Pavilion to find noble suitors from allied clans and begin your dynasty.",
                                fontSize = 11.sp,
                                lineHeight = 15.sp,
                                color = SteppeParchment
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Button(
                            onClick = onNavigateToPavilion,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGold,
                                contentColor = SteppeBrownDark
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.testTag("nav_to_pavilion_btn")
                        ) {
                            Text("Pavilion", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    }
                }
            }
        } else {
            // Unwed / additional alliances or pleasure tent quick shortcut
            item {
                Surface(
                    onClick = onNavigateToPavilion,
                    shape = RoundedCornerShape(8.dp),
                    color = SteppeSurface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorderSubtle),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("quick_pavilion_shortcut")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Celebration, contentDescription = null, tint = SteppeGold, modifier = Modifier.size(16.dp))
                            Text("Looking for Marriage Alliances or Pleasure Tent?", fontSize = 11.sp, color = SteppeParchment)
                        }
                        Text("Visit Pavilion →", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                    }
                }
            }
        }

        // Filter / Section Chips
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                sectionNames.forEachIndexed { index, name ->
                    val isSelected = selectedSection == index
                    Surface(
                        onClick = { selectedSection = index },
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) SteppeGold else SteppeSurface,
                        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("family_filter_$index")
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 2.dp)
                        ) {
                            Text(
                                text = name,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) SteppeBrownDark else SteppeParchment,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }

        // Family Members List
        if (displayedRelationships.isEmpty()) {
            item {
                SteppeCard {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "No household members in this category.",
                            fontSize = 13.sp,
                            color = SteppeParchmentDark
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Visit the Steppe Pavilion tab to arrange marriages, take oaths, or feast with companions.",
                            fontSize = 11.sp,
                            color = SteppeGold
                        )
                    }
                }
            }
        } else {
            items(displayedRelationships) { rel ->
                val roleColor = when (rel.type.lowercase()) {
                    "spouse", "wife", "husband" -> SteppeGold
                    "child", "son", "daughter" -> SteppeGreenLight
                    "mother", "father", "parent" -> SteppeSunlitDune
                    "friend", "anda" -> SteppeSkyBlueLight
                    else -> SteppeParchment
                }

                SteppeCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = rel.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SteppeParchment
                                )
                                Surface(
                                    color = SteppeBrownDark,
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = rel.type,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = roleColor
                                    )
                                }
                            }
                            Text(
                                text = "Age ${rel.age}${if (rel.clan != null) " • ${rel.clan} Clan" else ""}${if (!rel.socialClass.isNullOrEmpty()) " • ${rel.socialClass}" else ""}",
                                fontSize = 12.sp,
                                color = SteppeGoldDark
                            )
                        }

                        Button(
                            onClick = { onGift(rel) },
                            enabled = character.stats.wealth >= 40,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGoldDark,
                                contentColor = SteppeParchment,
                                disabledContainerColor = SteppeSurfaceVariant,
                                disabledContentColor = SteppeParchmentDark.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.testTag("gift_rel_${rel.id}")
                        ) {
                            Icon(Icons.Default.CardGiftcard, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (character.stats.wealth >= 40) "Gift (40г)" else "40г Req.",
                                fontSize = 11.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    StatProgressBar(
                        label = "Loyalty & Household Devotion",
                        value = rel.loyalty,
                        color = if (rel.loyalty >= 60) SteppeGreen else SteppeBronze
                    )

                    if (rel.traits.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            rel.traits.forEach { trait ->
                                Surface(
                                    color = SteppeBrownDark,
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = trait,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        fontSize = 10.sp,
                                        color = SteppeGold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
