package com.example.steppenomad.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

data class MapNode(
    val name: String,
    val x: Float, // 0.0 to 1.0
    val y: Float, // 0.0 to 1.0
    val isKingdom: Boolean = false,
    val description: String
)

@Composable
fun WorldMapScreen(
    character: Character
) {
    var selectedNode by remember { mutableStateOf<MapNode?>(null) }

    val nodes = listOf(
        MapNode("Khamag Mongol", 0.50f, 0.40f, false, "Homeland of Genghis Khan along the Onon and Kherlen rivers."),
        MapNode("Kereid", 0.35f, 0.45f, false, "Powerful central tribe adhering to Nestorian Christianity."),
        MapNode("Naiman", 0.18f, 0.38f, false, "Western tribe known for literate scribes and mountain fortresses."),
        MapNode("Merkid", 0.42f, 0.22f, false, "Northern forest and taiga horsemen, fierce rivals."),
        MapNode("Tatar", 0.72f, 0.35f, false, "Eastern steppe masters in league with the Jin court."),
        MapNode("Tayichiud", 0.58f, 0.30f, false, "Aristocratic nomadic clan guarding the sacred Burkhan Khaldun."),
        MapNode("Jalayir", 0.55f, 0.52f, false, "Steppe warriors famed for unyielding personal loyalty."),
        MapNode("Ongud", 0.45f, 0.68f, false, "Guardians of the southern desert border walls."),
        MapNode("Oirats", 0.20f, 0.25f, false, "Western forest peoples of Lake Baikal and Altai."),
        MapNode("Khongirad", 0.68f, 0.48f, false, "Famed for beautiful noble brides and diplomatically shrewd chieftains."),
        MapNode("Buryats", 0.48f, 0.15f, false, "Northern Siberian nomads and great eagle hunters."),
        MapNode("Uriankhai", 0.30f, 0.18f, false, "Taiga reindeer herders and fearless trackers."),
        MapNode("Jin Dynasty", 0.75f, 0.78f, true, "Imperial Jurchen empire dominating northern China with massive stone cities."),
        MapNode("Western Xia", 0.30f, 0.80f, true, "Tangut empire guarding the western Silk Road river oasis."),
        MapNode("Kara-Khitan", 0.10f, 0.65f, true, "Central Asian empire bridging nomadic horsemen with Islamic urban centers.")
    )

    val playerPerception = character.stats.perception
    val visionRadiusFraction = (0.25f + (playerPerception / 200f)).coerceIn(0.25f, 0.70f)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            SteppeCard(borderColor = SteppeGold) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Steppe World & Silk Road Map",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Weather: ${character.weather} • Scouting Vision: ${playerPerception}%",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                    }
                }
            }
        }

        // Steppe Map Canvas
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(SteppeBrownDark)
                    .border(2.dp, SteppeGoldDark, RoundedCornerShape(12.dp))
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height

                    // Draw river paths
                    drawLine(
                        color = SteppeSkyBlue.copy(alpha = 0.4f),
                        start = Offset(w * 0.3f, h * 0.1f),
                        end = Offset(w * 0.55f, h * 0.45f),
                        strokeWidth = 4f
                    )
                    drawLine(
                        color = SteppeSkyBlue.copy(alpha = 0.4f),
                        start = Offset(w * 0.55f, h * 0.45f),
                        end = Offset(w * 0.8f, h * 0.5f),
                        strokeWidth = 3f
                    )

                    // Draw player vision circle
                    drawCircle(
                        color = SteppeGold.copy(alpha = 0.12f),
                        radius = w * visionRadiusFraction,
                        center = Offset(w * 0.5f, h * 0.4f)
                    )
                    drawCircle(
                        color = SteppeGold.copy(alpha = 0.3f),
                        radius = w * visionRadiusFraction,
                        center = Offset(w * 0.5f, h * 0.4f),
                        style = Stroke(width = 2f)
                    )
                }

                // Node markers
                nodes.forEach { node ->
                    val isConquered = character.conqueredTribes.contains(node.name) || character.conqueredKingdoms.contains(node.name)
                    val isHome = node.name == character.tribe
                    val isSelected = selectedNode?.name == node.name

                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = (280 * node.y - 12).dp, start = ((node.x * 0.9f) * 320).dp)
                    ) {
                        Surface(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .border(
                                    2.dp,
                                    if (isSelected) SteppeParchment else if (isHome) SteppeGold else if (isConquered) SteppeGreen else if (node.isKingdom) SteppeRed else SteppeBronze,
                                    CircleShape
                                )
                                .clickable { selectedNode = node },
                            color = if (isHome) SteppeGold else if (isConquered) SteppeGreen else if (node.isKingdom) SteppeRed.copy(alpha = 0.7f) else SteppeSurfaceVariant
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = if (isHome) "⛺" else if (isConquered) "👑" else if (node.isKingdom) "🏛️" else "🏹",
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Selected Territory Details Card
        item {
            val node = selectedNode ?: nodes.first { it.name == character.tribe }
            val isConquered = character.conqueredTribes.contains(node.name) || character.conqueredKingdoms.contains(node.name)
            val relation = character.tribeRelations.find { it.name == node.name } ?: character.kingdomRelations.find { it.name == node.name }

            SteppeCard(borderColor = SteppeGold) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = node.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = if (node.isKingdom) "Imperial Sedentary Power" else "Steppe Nomadic Tribe",
                            fontSize = 12.sp,
                            color = SteppeParchmentDark
                        )
                    }
                    if (isConquered) {
                        Surface(color = SteppeGreen, shape = RoundedCornerShape(4.dp)) {
                            Text(
                                text = "SUBJUGATED",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = SteppeParchment
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = node.description,
                    fontSize = 12.sp,
                    color = SteppeParchment,
                    lineHeight = 18.sp
                )

                if (relation != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Divider(color = SteppeBorder)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Diplomatic Status: ${relation.level}", fontSize = 12.sp, color = SteppeGoldDark)
                        Text("Estimated Host: ${relation.militaryPower} warriors", fontSize = 12.sp, color = SteppeParchment)
                    }
                }
            }
        }
    }
}
