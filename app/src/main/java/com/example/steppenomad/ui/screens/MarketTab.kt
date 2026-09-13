package com.example.steppenomad.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.AvailableMarketItem
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

@Composable
fun MarketTab(
    character: Character,
    onBuyItem: (AvailableMarketItem) -> Unit
) {
    var selectedCategory by remember { mutableStateOf("All") }
    val categories = listOf("All", "Combat Gear", "Mounts & Animals", "Estate & Home", "Trade Goods", "Rare Luxuries")

    val filteredItems = if (selectedCategory == "All") {
        character.availableMarketItems
    } else {
        character.availableMarketItems.filter { it.category == selectedCategory }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Market Economic Condition Banner
        item {
            SteppeCard(borderColor = SteppeGold) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Steppe Bazaar & Silk Road",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Market Condition: ${character.marketCondition}",
                            fontSize = 12.sp,
                            color = SteppeParchment
                        )
                    }
                    Surface(
                        color = when (character.marketCondition) {
                            "Economic Boom" -> SteppeGreen
                            "Recession" -> SteppeRed
                            "War Preparations" -> SteppeBronze
                            else -> SteppeGoldDark
                        },
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = character.marketCondition.uppercase(),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeParchment
                        )
                    }
                }
            }
        }

        // Category Filter Chips
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.chunked(3).forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        row.forEach { cat ->
                            val isSelected = selectedCategory == cat
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .border(1.dp, if (isSelected) SteppeGold else SteppeBorder, RoundedCornerShape(6.dp))
                                    .clickable { selectedCategory = cat },
                                color = if (isSelected) SteppeGoldDark else SteppeSurfaceVariant
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 6.dp, horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = cat,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) SteppeParchment else SteppeParchmentDark,
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Items in Stock
        if (filteredItems.isEmpty()) {
            item {
                SteppeCard {
                    Text(
                        text = "No goods available in this category for this season. Merchants restock every year!",
                        fontSize = 13.sp,
                        color = SteppeParchmentDark
                    )
                }
            }
        } else {
            items(filteredItems) { item ->
                val canAfford = character.stats.wealth >= item.price
                SteppeCard(borderColor = if (canAfford) SteppeGoldDark else SteppeBorder) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.name,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeGold
                            )
                            Text(
                                text = "${item.category} • Quality: ${item.quality}%",
                                fontSize = 11.sp,
                                color = SteppeParchmentDark
                            )
                            Text(
                                text = item.desc,
                                fontSize = 11.sp,
                                color = SteppeParchment,
                                lineHeight = 16.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = { onBuyItem(item) },
                            enabled = canAfford,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGold,
                                contentColor = SteppeBrownDark,
                                disabledContainerColor = SteppeSurfaceVariant,
                                disabledContentColor = SteppeParchmentDark
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${item.price}г",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
