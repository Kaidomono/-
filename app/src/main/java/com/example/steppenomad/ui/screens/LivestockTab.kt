package com.example.steppenomad.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Terrain
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.data.Constants
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.components.StatProgressBar
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

@Composable
fun LivestockTab(
    character: Character,
    onBuyLivestock: (type: String, count: Int) -> Unit,
    onSellLivestock: (type: String, count: Int) -> Unit,
    onUpgradePasture: () -> Unit
) {
    val totalAnimals = character.livestock.totalCount()
    val isOvergrazed = totalAnimals > character.pastureCapacity
    val pastureCost = 200 + (character.pastureUpgrades * 150)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Grazing Capacity Card
        item {
            SteppeCard(
                borderColor = if (isOvergrazed) SteppeRed else SteppeGoldDark
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Pasture Grazing Capacity",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isOvergrazed) SteppeRed else SteppeGold
                        )
                        Text(
                            text = if (isOvergrazed) "⚠️ OVERGRAZING: Animal breeding halts!" else "Lush steppe pasture. Animals breed every spring.",
                            fontSize = 12.sp,
                            color = if (isOvergrazed) SteppeRed else SteppeGreen
                        )
                    }
                    Button(
                        onClick = onUpgradePasture,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SteppeGold,
                            contentColor = SteppeBrownDark
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Terrain, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Expand (${pastureCost}г)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                StatProgressBar(
                    label = "Pasture Load",
                    value = totalAnimals,
                    maxValue = character.pastureCapacity,
                    color = if (isOvergrazed) SteppeRed else SteppeGold
                )
            }
        }

        // Animal rows
        val livestockTypes = listOf(
            Triple("horses", "🐎 Steppe Horses", character.livestock.horses),
            Triple("sheep", "🐑 Wool Sheep", character.livestock.sheep),
            Triple("cattle", "🐂 Horned Cattle", character.livestock.cattle),
            Triple("goats", "🐐 Mountain Goats", character.livestock.goats),
            Triple("yaks", "🦬 Highland Yaks", character.livestock.yaks),
            Triple("camels", "🐫 Desert Camels", character.livestock.camels)
        )

        item {
            Text(
                text = "Herds & Livestock Holdings",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
        }

        items(livestockTypes.size) { index ->
            val (key, label, count) = livestockTypes[index]
            val pricePair = Constants.LIVESTOCK_PRICES[key]!!
            val mult = Constants.MARKET_MULTIPLIERS[character.marketCondition]?.livestock ?: 1.0
            val buyPrice = (pricePair.buy * mult).toInt()
            val sellPrice = (pricePair.sell * mult).toInt()

            val loreText = when (key) {
                "horses" -> "Steppe horses: Military mobility, airag (fermented mare's milk), and nomadic wealth indicator."
                "sheep" -> "Fat-tailed sheep: Primary source of food, mutton fat, winter deels, and felt insulation for gers."
                "cattle" -> "Horned cattle: Heavy ox-cart draft power for moving nomadic encampments, meat, and leather."
                "goats" -> "Steppe goats: Resilient foragers, cashmere wool, milk, and leaders of mixed sheep herds."
                "yaks" -> "Highland yaks: Cold-resistant high mountain pack beasts, rich yak butter (tsagaan idee), and heavy hides."
                "camels" -> "Bactrian two-humped camels: Silk Road Gobi caravans, high-payload desert transport, and warm camel hair."
                else -> "Essential nomadic livestock."
            }

            SteppeCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                        Text(
                            text = label,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Owned: $count • Buy: ${buyPrice}г / Sell: ${sellPrice}г",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                        Text(
                            text = loreText,
                            fontSize = 10.sp,
                            color = SteppeParchment.copy(alpha = 0.7f),
                            lineHeight = 13.sp,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(
                            onClick = { onSellLivestock(key, 1) },
                            enabled = count > 0,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeSurfaceVariant,
                                contentColor = SteppeRed,
                                disabledContainerColor = SteppeSurfaceVariant.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Remove, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(2.dp))
                            Text("Sell", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = { onBuyLivestock(key, 1) },
                            enabled = character.stats.wealth >= buyPrice,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGold,
                                contentColor = SteppeBrownDark,
                                disabledContainerColor = SteppeSurfaceVariant.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(2.dp))
                            Text("Buy", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
