package com.example.steppenomad.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.data.Constants
import com.example.steppenomad.model.CareerBranch
import com.example.steppenomad.model.Character
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

@Composable
fun ActivitiesTab(
    character: Character,
    onPerformAction: (CareerBranch) -> Unit,
    onPromote: (String) -> Unit,
    onRecruitHorde: (Int) -> Unit
) {
    var selectedBranchId by remember { mutableStateOf(Constants.CAREER_BRANCHES.first().id) }
    val selectedBranch = Constants.CAREER_BRANCHES.find { it.id == selectedBranchId } ?: Constants.CAREER_BRANCHES.first()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Horde Recruitment Card
        item {
            SteppeCard(borderColor = SteppeGold) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Horde & Military Command",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                        Text(
                            text = "Warriors: ${character.hordeSize} • Tactical Power: ${character.militaryPower}",
                            fontSize = 13.sp,
                            color = SteppeParchment
                        )
                    }
                    Button(
                        onClick = { onRecruitHorde(50) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SteppeGold,
                            contentColor = SteppeBrownDark
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.GroupAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("+50 (250г)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Career Branch Selector
        item {
            Text(
                text = "Career Paths & Vocations",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
            Spacer(modifier = Modifier.height(8.dp))

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Constants.CAREER_BRANCHES.chunked(2).forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        row.forEach { branch ->
                            val isSelected = branch.id == selectedBranchId
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .border(1.dp, if (isSelected) SteppeGold else SteppeBorder, RoundedCornerShape(8.dp))
                                    .clickable { selectedBranchId = branch.id },
                                color = if (isSelected) SteppeGoldDark else SteppeSurfaceVariant
                            ) {
                                Box(
                                    modifier = Modifier.padding(10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = branch.name,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) SteppeParchment else SteppeParchmentDark
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Active Branch Overview & Action
        item {
            SteppeCard(borderColor = SteppeGoldDark) {
                Text(
                    text = selectedBranch.name,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Text(
                    text = selectedBranch.description,
                    fontSize = 12.sp,
                    color = SteppeParchmentDark
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Special Career Action Button
                val action = selectedBranch.action
                Button(
                    onClick = { onPerformAction(selectedBranch) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SteppeBronze,
                        contentColor = SteppeParchment
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.TrendingUp, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("${action.name} (${action.cost}г)", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = action.desc, fontSize = 11.sp, color = SteppeParchmentDark)
            }
        }

        // Hierarchy of Ranks in Branch
        item {
            Text(
                text = "Ranks & Promotions in ${selectedBranch.name}",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
        }

        items(selectedBranch.roles) { role ->
            val isCurrentRole = character.role == role.name
            SteppeCard(
                backgroundColor = if (isCurrentRole) SteppeGoldDark.copy(alpha = 0.3f) else SteppeSurface,
                borderColor = if (isCurrentRole) SteppeGold else SteppeBorder
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = role.name,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isCurrentRole) SteppeGold else SteppeParchment
                            )
                            if (isCurrentRole) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    color = SteppeGold,
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = "CURRENT",
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SteppeBrownDark
                                    )
                                }
                            }
                        }
                        Text(
                            text = "Annual Wage: ${role.salary}г • Requirements: ${role.reqs}",
                            fontSize = 11.sp,
                            color = SteppeParchmentDark
                        )
                    }

                    if (!isCurrentRole && character.age >= 15) {
                        Button(
                            onClick = { onPromote(role.name) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SteppeGold,
                                contentColor = SteppeBrownDark
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.MilitaryTech, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Promote", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
