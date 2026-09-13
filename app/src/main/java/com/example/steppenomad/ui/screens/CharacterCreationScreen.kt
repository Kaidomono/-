package com.example.steppenomad.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Casino
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.data.Constants
import com.example.steppenomad.model.AppearanceOptions
import com.example.steppenomad.model.Gender
import com.example.steppenomad.model.SocialClass
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.components.SteppeHeader
import com.example.steppenomad.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CharacterCreationScreen(
    onCreateCharacter: (
        name: String,
        gender: Gender,
        tribe: String,
        clan: String,
        socialClass: SocialClass,
        appearance: AppearanceOptions,
        traits: List<String>
    ) -> Unit
) {
    var gender by remember { mutableStateOf(Gender.MALE) }
    var clan by remember { mutableStateOf(Constants.MONGOL_SURNAMES.first()) }
    var name by remember { mutableStateOf("${Constants.MONGOL_NAMES_MALE.first()} $clan") }
    var selectedTribe by remember { mutableStateOf(Constants.TRIBES.first()) }
    var selectedClass by remember { mutableStateOf(SocialClass.NOMAD) }
    var hairColor by remember { mutableStateOf("Black") }
    var eyeColor by remember { mutableStateOf("Dark Brown") }
    var build by remember { mutableStateOf("Athletic") }
    var selectedTraits by remember { mutableStateOf(listOf("brawny")) }

    val scrollState = rememberScrollState()

    fun randomizeName() {
        val names = if (gender == Gender.MALE) Constants.MONGOL_NAMES_MALE else Constants.MONGOL_NAMES_FEMALE
        clan = Constants.MONGOL_SURNAMES.random()
        name = "${names.random()} $clan"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SteppeBrownDark)
            .padding(16.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        SteppeHeader(
            title = "CHARACTER CREATION",
            subtitle = "CHOOSE YOUR ORIGINS & BLOODLINE"
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Name & Gender Card
        SteppeCard {
            Text(
                text = "Identity & Lineage",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Gender.values().forEach { g ->
                    val isSelected = gender == g
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(1.dp, if (isSelected) SteppeGold else SteppeBorder, RoundedCornerShape(8.dp))
                            .clickable {
                                gender = g
                                randomizeName()
                            },
                        color = if (isSelected) SteppeGoldDark else SteppeSurfaceVariant
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = if (g == Gender.MALE) "♂ Male" else "♀ Female",
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) SteppeParchment else SteppeParchmentDark
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Character Full Name", color = SteppeParchmentDark) },
                trailingIcon = {
                    IconButton(onClick = { randomizeName() }) {
                        Icon(Icons.Default.Casino, contentDescription = "Randomize Name", tint = SteppeGold)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = SteppeGold,
                    unfocusedBorderColor = SteppeBorder,
                    focusedTextColor = SteppeParchment,
                    unfocusedTextColor = SteppeParchment
                )
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Tribe & Clan Card
        SteppeCard {
            Text(
                text = "Birth Tribe",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
            Spacer(modifier = Modifier.height(8.dp))

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Constants.TRIBES.chunked(3).forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        row.forEach { tribe ->
                            val isSelected = selectedTribe == tribe
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .border(1.dp, if (isSelected) SteppeGold else SteppeBorder, RoundedCornerShape(6.dp))
                                    .clickable { selectedTribe = tribe },
                                color = if (isSelected) SteppeGoldDark else SteppeSurfaceVariant
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = tribe,
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

        Spacer(modifier = Modifier.height(12.dp))

        // Social Class Card
        SteppeCard {
            Text(
                text = "Social Class & Background",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = SteppeGold
            )
            Spacer(modifier = Modifier.height(8.dp))

            SocialClass.values().forEach { sc ->
                val isSelected = selectedClass == sc
                val desc = when (sc) {
                    SocialClass.NOMAD -> "Standard herds and sturdy yurt. Resilient to steppe hardship."
                    SocialClass.NOBLE -> "High clan prestige, large herds, starting estate wealth, and political influence."
                    SocialClass.MERCHANT -> "Heavily capitalized starting purse, keen trade intellect, Silk Road access."
                    SocialClass.WARRIOR -> "High martial strength, superior archery, starting war stallion."
                    SocialClass.BLACKSMITH -> "Forging expertise, starting workshop income, high strength."
                }
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, if (isSelected) SteppeGold else SteppeBorder, RoundedCornerShape(8.dp))
                        .clickable { selectedClass = sc },
                    color = if (isSelected) SteppeGoldDark.copy(alpha = 0.4f) else SteppeSurfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { selectedClass = sc },
                            colors = RadioButtonDefaults.colors(selectedColor = SteppeGold)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(text = sc.displayName, fontWeight = FontWeight.Bold, color = SteppeGold, fontSize = 14.sp)
                            Text(text = desc, color = SteppeParchmentDark, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Starting Traits (Pick up to 2)
        SteppeCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Starting Traits (Pick up to 2)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteppeGold
                )
                Text(
                    text = "${selectedTraits.size}/2",
                    fontSize = 12.sp,
                    color = SteppeParchmentDark
                )
            }
            Spacer(modifier = Modifier.height(8.dp))

            Constants.STARTING_TRAITS.forEach { trait ->
                val isSelected = selectedTraits.contains(trait.id)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, if (isSelected) SteppeGold else SteppeBorder, RoundedCornerShape(8.dp))
                        .clickable {
                            if (isSelected) {
                                selectedTraits = selectedTraits.filter { it != trait.id }
                            } else if (selectedTraits.size < 2) {
                                selectedTraits = selectedTraits + trait.id
                            }
                        },
                    color = if (isSelected) SteppeGoldDark.copy(alpha = 0.3f) else SteppeSurfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isSelected,
                            onCheckedChange = { checked ->
                                if (checked && selectedTraits.size < 2) {
                                    selectedTraits = selectedTraits + trait.id
                                } else if (!checked) {
                                    selectedTraits = selectedTraits.filter { it != trait.id }
                                }
                            },
                            colors = CheckboxDefaults.colors(checkedColor = SteppeGold)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(text = trait.name, fontWeight = FontWeight.Bold, color = SteppeParchment, fontSize = 13.sp)
                            Text(text = trait.description, color = SteppeParchmentDark, fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Embark Button
        Button(
            onClick = {
                onCreateCharacter(
                    name.ifBlank { "Temujin $clan" },
                    gender,
                    selectedTribe,
                    clan,
                    selectedClass,
                    AppearanceOptions(hairColor, eyeColor, build),
                    selectedTraits
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = SteppeGold,
                contentColor = SteppeBrownDark
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.Check, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "ENTER THE STEPPE",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}
