package com.example.steppenomad.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.components.StatBadge
import com.example.steppenomad.ui.components.StatProgressBar
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

@Composable
fun LifeTab(
    character: Character,
    onAgeUp: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Hero Age Up Action
        item {
            Button(
                onClick = onAgeUp,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SteppeGold,
                    contentColor = SteppeBrownDark
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.HourglassTop, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "AGE UP +1 YEAR (Age: ${character.age})",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }

        // Identity & Titles Card
        item {
            SteppeCard(borderColor = SteppeGoldDark) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = character.name,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        if (character.title != null) {
                            Text(
                                text = "Title: ${character.title}",
                                fontSize = 12.sp,
                                color = SteppeParchmentDark
                            )
                        }
                    }
                    Surface(
                        color = SteppeGoldDark,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = character.role,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeParchment
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StatBadge("Tribe", character.tribe, color = SteppeGold, modifier = Modifier.weight(1f))
                    StatBadge("Clan", character.clan, color = SteppeParchment, modifier = Modifier.weight(1f))
                    StatBadge("Class", character.socialClass, color = SteppeSkyBlue, modifier = Modifier.weight(1.2f))
                }
            }
        }

        // Vital Stats Bars
        item {
            SteppeCard {
                Text(
                    text = "Vital Condition",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Spacer(modifier = Modifier.height(10.dp))
                StatProgressBar("Health", character.stats.health, color = SteppeRed)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Happiness", character.stats.happiness, color = SteppeGold)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Loyalty", character.stats.loyalty, color = SteppeGreen)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Reputation", character.stats.reputation, color = SteppeSkyBlue)
            }
        }

        // Steppe Martial & Civil Skills
        item {
            SteppeCard {
                Text(
                    text = "Skills & Attributes",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Spacer(modifier = Modifier.height(10.dp))
                StatProgressBar("Horse Riding", character.stats.horseRiding, color = SteppeGold)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Recurve Archery", character.stats.archery, color = SteppeBronze)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Martial Strength", character.stats.strength, color = SteppeRed)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Intelligence", character.stats.intelligence, color = SteppeSkyBlue)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Leadership", character.stats.leadership, color = SteppeGoldDark)
                Spacer(modifier = Modifier.height(6.dp))
                StatProgressBar("Perception", character.stats.perception, color = SteppeGreen)
            }
        }

        // Seasonal Tax Ledger
        item {
            val report = character.taxReport
            SteppeCard {
                Text(
                    text = "Annual Financial Ledger",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Taxes Paid:", fontSize = 12.sp, color = SteppeParchmentDark)
                    Text("-${report.taxesPaid}г", fontSize = 12.sp, color = SteppeRed)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Tributes & Subject Taxes Collected:", fontSize = 12.sp, color = SteppeParchmentDark)
                    Text("+${report.taxesCollected}г", fontSize = 12.sp, color = SteppeGreen)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Horde Upkeep Disbursed:", fontSize = 12.sp, color = SteppeParchmentDark)
                    Text("-${report.soldierSalaryPaid}г", fontSize = 12.sp, color = SteppeRed)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Military Rank Wage Received:", fontSize = 12.sp, color = SteppeParchmentDark)
                    Text("+${report.soldierSalaryReceived}г", fontSize = 12.sp, color = SteppeGreen)
                }
                Divider(modifier = Modifier.padding(vertical = 6.dp), color = SteppeBorder)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Net Seasonal Flow:", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeParchment)
                    val netColor = if (report.netIncome >= 0) SteppeGreen else SteppeRed
                    val sign = if (report.netIncome >= 0) "+" else ""
                    Text("$sign${report.netIncome}г", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = netColor)
                }
            }
        }

        // Historical Chronicle Header
        item {
            Text(
                text = "Chronicle of Life",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        // History Entries
        items(character.history.reversed()) { entry ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .border(1.dp, SteppeBorder, RoundedCornerShape(8.dp)),
                color = SteppeSurfaceVariant
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Surface(
                        color = SteppeBrownDark,
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "Age ${entry.age}",
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = entry.text,
                        fontSize = 13.sp,
                        color = SteppeParchment,
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}
