package com.example.steppenomad.ui.screens

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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.steppenomad.model.Asset
import com.example.steppenomad.model.AvailableMarketItem
import com.example.steppenomad.model.Character
import com.example.steppenomad.model.Workshop
import com.example.steppenomad.ui.components.SteppeCard
import com.example.steppenomad.ui.theme.*

/**
 * BitLife-style Assets Hub (Хөрөнгө & Өмч)
 * Centralizes all player wealth, herds & livestock, market shopping,
 * workshops, silk road caravans, and personal equipment into a clean, unified menu.
 */
@Composable
fun AssetsTab(
    character: Character,
    onSellAsset: (Asset) -> Unit,
    onBuildWorkshop: (type: String, name: String, cost: Int, income: Int) -> Unit,
    onUpgradeWorkshop: (Workshop) -> Unit,
    onDispatchCaravan: (destination: String, investment: Int, guards: Int, duration: Int) -> Unit,
    onBuyMarketItem: (AvailableMarketItem) -> Unit,
    onBuyLivestock: (type: String, count: Int) -> Unit,
    onSellLivestock: (type: String, count: Int) -> Unit,
    onUpgradePasture: () -> Unit
) {
    // Current category: null = Overview Menu (BitLife style), or "herds", "market", "workshops", "caravans", "gear"
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var showCaravanDialog by remember { mutableStateOf(false) }

    // Valuation calculations
    val totalAnimals = character.livestock.totalCount()
    val herdEstimatedValue = remember(character.livestock) {
        character.livestock.horses * 60 +
        character.livestock.sheep * 12 +
        character.livestock.cattle * 45 +
        character.livestock.camels * 90 +
        character.livestock.goats * 10 +
        character.livestock.yaks * 50
    }
    val workshopsEstimatedValue = remember(character.workshops) {
        character.workshops.sumOf { it.level * 200 }
    }
    val gearEstimatedValue = remember(character.assets) {
        character.assets.sumOf { it.value }
    }
    val netWorth = character.stats.wealth + herdEstimatedValue + workshopsEstimatedValue + gearEstimatedValue
    val passiveIncome = remember(character.workshops) {
        character.workshops.sumOf { it.passiveIncome * it.level }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Back header when viewing a specific sub-category
        if (selectedCategory != null) {
            Surface(
                color = SteppeBrownDark,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextButton(
                        onClick = { selectedCategory = null },
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp),
                        modifier = Modifier.testTag("back_to_assets_btn")
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", modifier = Modifier.size(16.dp), tint = SteppeGold)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("← Assets Hub", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                    }

                    val titleText = when (selectedCategory) {
                        "herds" -> "🐎 Herds & Livestock"
                        "market" -> "🛒 Steppe Bazaar"
                        "workshops" -> "⚒️ Manufactories"
                        "caravans" -> "🐫 Silk Road Caravans"
                        "gear" -> "🗡️ Equipment & Relics"
                        else -> "Assets"
                    }

                    Text(
                        text = titleText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = SteppeParchment
                    )
                }
            }
            HorizontalDivider(color = SteppeBorder, thickness = 1.dp)
        }

        // Subcategory views
        when (selectedCategory) {
            "herds" -> {
                LivestockTab(
                    character = character,
                    onBuyLivestock = onBuyLivestock,
                    onSellLivestock = onSellLivestock,
                    onUpgradePasture = onUpgradePasture
                )
            }
            "market" -> {
                MarketTab(
                    character = character,
                    onBuyItem = onBuyMarketItem
                )
            }
            "workshops" -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Clan Manufactories (${character.workshops.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                            Text(text = "Total Yield: +${passiveIncome}г / year", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SteppeGreenLight)
                        }
                    }

                    if (character.workshops.isEmpty()) {
                        item {
                            SteppeCard {
                                Text(
                                    text = "No workshops established yet. Build forges, dairies, and weaveries for steady annual passive income.",
                                    fontSize = 12.sp,
                                    color = SteppeParchmentDark
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = { onBuildWorkshop("Forge", "Weaponsmith Forge", 250, 65) },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = SteppeGoldDark)
                                    ) {
                                        Text("Forge (250г)", fontSize = 11.sp)
                                    }
                                    Button(
                                        onClick = { onBuildWorkshop("Dairy", "Airag Dairy", 180, 45) },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = SteppeGoldDark)
                                    ) {
                                        Text("Dairy (180г)", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    } else {
                        items(character.workshops) { ws ->
                            SteppeCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = ws.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                                        Text(text = "Level ${ws.level} • Yield: +${ws.passiveIncome * ws.level}г / year", fontSize = 12.sp, color = SteppeGreen)
                                        Text(text = ws.description, fontSize = 11.sp, color = SteppeParchmentDark)
                                    }
                                    Button(
                                        onClick = { onUpgradeWorkshop(ws) },
                                        enabled = character.stats.wealth >= ws.costToUpgrade,
                                        colors = ButtonDefaults.buttonColors(containerColor = SteppeGold, contentColor = SteppeBrownDark),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Icon(Icons.Default.ArrowUpward, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Upgrade (${ws.costToUpgrade}г)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        item {
                            Button(
                                onClick = { onBuildWorkshop("Weaving", "Silk & Felt Weavery", 300, 80) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = SteppeSurfaceVariant)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("+ Build New Silk & Felt Weavery (300г)", fontSize = 12.sp, color = SteppeParchment)
                            }
                        }
                    }
                }
            }
            "caravans" -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Silk Road Expeditions", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                            Button(
                                onClick = { showCaravanDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = SteppeGold, contentColor = SteppeBrownDark),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("dispatch_caravan_btn")
                            ) {
                                Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Dispatch New", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    if (character.caravans.isEmpty()) {
                        item {
                            SteppeCard {
                                Text(
                                    text = "No caravans currently dispatched. Invest gold and guards to trade with distant Silk Road oasis cities.",
                                    fontSize = 12.sp,
                                    color = SteppeParchmentDark
                                )
                            }
                        }
                    } else {
                        items(character.caravans) { caravan ->
                            SteppeCard(borderColor = if (caravan.status == "Completed") SteppeGreen else SteppeGoldDark) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(text = "Caravan to ${caravan.destination}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                                        Text(text = "Investment: ${caravan.investment}г • Guards: ${caravan.guards}", fontSize = 11.sp, color = SteppeParchmentDark)
                                    }
                                    Surface(
                                        color = if (caravan.status == "Completed") SteppeGreen else SteppeGoldDark,
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = caravan.status,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SteppeParchment
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            "gear" -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    item {
                        Text(text = "Equipped Gear & Steppe Relics (${character.assets.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                    }

                    if (character.assets.isEmpty()) {
                        item {
                            SteppeCard {
                                Text(text = "You do not own any weapons, armor, or special steeds. Visit the Steppe Bazaar to purchase gear.", fontSize = 12.sp, color = SteppeParchmentDark)
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = { selectedCategory = "market" },
                                    colors = ButtonDefaults.buttonColors(containerColor = SteppeGold, contentColor = SteppeBrownDark)
                                ) {
                                    Text("Go to Bazaar", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else {
                        items(character.assets) { asset ->
                            SteppeCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = asset.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                                        Text(text = "${asset.type} • Quality: ${asset.quality}% • Value: ${asset.value}г", fontSize = 11.sp, color = SteppeParchmentDark)
                                        if (asset.stats != null) {
                                            val statStr = buildString {
                                                if (asset.stats.attackBonus > 0) append("Atk +${asset.stats.attackBonus} ")
                                                if (asset.stats.defenseBonus > 0) append("Def +${asset.stats.defenseBonus} ")
                                                if (asset.stats.speed > 0) append("Spd +${asset.stats.speed}")
                                            }
                                            if (statStr.isNotBlank()) {
                                                Text(text = statStr, fontSize = 11.sp, color = SteppeGreen)
                                            }
                                        }
                                    }
                                    Button(
                                        onClick = { onSellAsset(asset) },
                                        colors = ButtonDefaults.buttonColors(containerColor = SteppeBrownDark, contentColor = SteppeRed),
                                        shape = RoundedCornerShape(6.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                        modifier = Modifier.testTag("sell_gear_${asset.id}")
                                    ) {
                                        Text("Sell", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            null -> {
                // =================================================================
                // MAIN BITLIFE ASSETS MENU LIST
                // =================================================================
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp)
                        .testTag("assets_tab_content"),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    // Header: Net Worth & Finances
                    item {
                        SteppeCard(
                            borderColor = SteppeGold,
                            backgroundColor = SteppeBrownDark
                        ) {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "ESTIMATED NET WORTH",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SteppeSunlitDune,
                                            letterSpacing = 1.sp
                                        )
                                        Text(
                                            text = "${netWorth}г",
                                            fontSize = 26.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = SteppeGold
                                        )
                                    }

                                    Surface(
                                        color = SteppeGoldDark,
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = "Liquid: ${character.stats.wealth}г",
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SteppeParchment
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Breakdown chips
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Surface(
                                        color = SteppeSurfaceVariant,
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 4.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("Herds", fontSize = 10.sp, color = SteppeParchmentDark)
                                            Text("${totalAnimals} hd", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SteppeParchment)
                                        }
                                    }

                                    Surface(
                                        color = SteppeSurfaceVariant,
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 4.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("Income", fontSize = 10.sp, color = SteppeParchmentDark)
                                            Text("+${passiveIncome}г/yr", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SteppeGreenLight)
                                        }
                                    }

                                    Surface(
                                        color = SteppeSurfaceVariant,
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 4.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("Caravans", fontSize = 10.sp, color = SteppeParchmentDark)
                                            Text("${character.caravans.size} act", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SteppeParchment)
                                        }
                                    }

                                    Surface(
                                        color = SteppeSurfaceVariant,
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 4.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("Relics", fontSize = 10.sp, color = SteppeParchmentDark)
                                            Text("${character.assets.size} itm", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SteppeGold)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Text(
                            text = "Asset Holdings & Commerce (Өмч Хөрөнгө)",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SteppeGold
                        )
                    }

                    // 1. Herds & Livestock Row
                    item {
                        val pastureCapacity = character.pastureCapacity
                        val isOvergrazed = totalAnimals > pastureCapacity
                        BitLifeAssetRow(
                            icon = Icons.Default.Pets,
                            title = "Herds & Livestock (Таван Хошуу Мал)",
                            subtitle = "${character.livestock.horses} Horses, ${character.livestock.sheep} Sheep, ${character.livestock.cattle} Cattle, ${character.livestock.camels} Camels",
                            badge = if (isOvergrazed) "⚠️ OVERGRAZING (${totalAnimals}/$pastureCapacity)" else "${totalAnimals} head ($pastureCapacity max)",
                            badgeColor = if (isOvergrazed) SteppeRed else SteppeGreenLight,
                            testTag = "asset_category_herds",
                            onClick = { selectedCategory = "herds" }
                        )
                    }

                    // 2. Steppe Market & Bazaar Row
                    item {
                        BitLifeAssetRow(
                            icon = Icons.Default.ShoppingCart,
                            title = "Steppe Bazaar & Market (Зах Зээл)",
                            subtitle = "Purchase weapons, protective armor, swift steeds, and fine luxury trade goods",
                            badge = "${character.availableMarketItems.size} items • ${character.marketCondition}",
                            badgeColor = SteppeGold,
                            testTag = "asset_category_market",
                            onClick = { selectedCategory = "market" }
                        )
                    }

                    // 3. Workshops & Manufactories Row
                    item {
                        BitLifeAssetRow(
                            icon = Icons.Default.Build,
                            title = "Clan Workshops & Manufactories (Дархны Газар)",
                            subtitle = if (character.workshops.isEmpty()) "No active manufactories. Build forges and dairies for passive income." else "${character.workshops.size} workshops generating steady annual revenue",
                            badge = if (passiveIncome > 0) "+${passiveIncome}г / year" else "0г / year",
                            badgeColor = if (passiveIncome > 0) SteppeGreenLight else SteppeParchmentDark,
                            testTag = "asset_category_workshops",
                            onClick = { selectedCategory = "workshops" }
                        )
                    }

                    // 4. Silk Road Caravans Row
                    item {
                        val activeCaravans = character.caravans.count { it.status != "Completed" }
                        val completedCaravans = character.caravans.count { it.status == "Completed" }
                        BitLifeAssetRow(
                            icon = Icons.Default.Send,
                            title = "Silk Road Caravans (Жингийн Цуваа)",
                            subtitle = "Merchant expeditions to Samarkand, Bukhara, and Chang'an",
                            badge = when {
                                completedCaravans > 0 -> "✨ $completedCaravans Ready!"
                                activeCaravans > 0 -> "$activeCaravans on Road"
                                else -> "Idle"
                            },
                            badgeColor = if (completedCaravans > 0) SteppeGreenLight else SteppeParchmentDark,
                            testTag = "asset_category_caravans",
                            onClick = { selectedCategory = "caravans" }
                        )
                    }

                    // 5. Personal Gear & Equipment Row
                    item {
                        BitLifeAssetRow(
                            icon = Icons.Default.Shield,
                            title = "Personal Equipment & Relics (Зэр Зэвсэг)",
                            subtitle = if (character.assets.isEmpty()) "No weapons or armor owned. Visit the Bazaar to equip." else "${character.assets.size} owned equipment items and ancestral relics",
                            badge = "${character.assets.size} items",
                            badgeColor = SteppeGold,
                            testTag = "asset_category_gear",
                            onClick = { selectedCategory = "gear" }
                        )
                    }
                }
            }
        }
    }

    // Caravan Dispatch Dialog
    if (showCaravanDialog) {
        var caravanDestination by remember { mutableStateOf("Samarkand") }
        var caravanInvestment by remember { mutableStateOf("300") }
        var caravanGuards by remember { mutableStateOf("10") }

        AlertDialog(
            onDismissRequest = { showCaravanDialog = false },
            title = { Text("Dispatch Silk Road Caravan", color = SteppeGold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Destination:", fontSize = 12.sp, color = SteppeParchment)
                    listOf("Samarkand", "Bukhara", "Chang'an", "Baghdad").forEach { dest ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth().clickable { caravanDestination = dest }
                        ) {
                            RadioButton(selected = caravanDestination == dest, onClick = { caravanDestination = dest })
                            Text(dest, color = SteppeParchment, fontSize = 13.sp)
                        }
                    }
                    OutlinedTextField(
                        value = caravanInvestment,
                        onValueChange = { caravanInvestment = it },
                        label = { Text("Investment Gold") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = caravanGuards,
                        onValueChange = { caravanGuards = it },
                        label = { Text("Guards Hired") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val inv = caravanInvestment.toIntOrNull() ?: 200
                        val guards = caravanGuards.toIntOrNull() ?: 5
                        onDispatchCaravan(caravanDestination, inv, guards, 2)
                        showCaravanDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SteppeGold, contentColor = SteppeBrownDark)
                ) {
                    Text("Dispatch")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCaravanDialog = false }) {
                    Text("Cancel", color = SteppeParchmentDark)
                }
            },
            containerColor = SteppeBrownDark
        )
    }
}

/**
 * BitLife-style clean asset category row with icon, title, subtitle, count badge and chevron
 */
@Composable
private fun BitLifeAssetRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    badge: String,
    badgeColor: androidx.compose.ui.graphics.Color = SteppeGold,
    testTag: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        color = SteppeSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, SteppeBorder),
        modifier = Modifier
            .fillMaxWidth()
            .testTag(testTag)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = SteppeGoldDark.copy(alpha = 0.3f),
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = SteppeGold,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                Column {
                    Text(
                        text = title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = SteppeParchment
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = subtitle,
                        fontSize = 11.sp,
                        color = SteppeParchmentDark,
                        maxLines = 2
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = badge,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor
                    )
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Open",
                tint = SteppeGoldDark,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
