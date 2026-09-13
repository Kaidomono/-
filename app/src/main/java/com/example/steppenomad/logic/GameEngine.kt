package com.example.steppenomad.logic

import com.example.steppenomad.data.Constants
import com.example.steppenomad.model.*
import java.util.UUID
import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random

object GameEngine {

    fun generateId(): String = UUID.randomUUID().toString().take(8)

    fun calculateTitle(character: Character): String? {
        val stats = character.stats
        val age = character.age
        val role = character.role
        val conqueredTribes = character.conqueredTribes
        val isGreatKhan = character.isGreatKhan

        if (age < 5) return null
        if (age < 15) {
            if (stats.strength >= 70) return "the Brawny"
            if (stats.archery >= 70) return "the Sparrow-Hunter"
            if (stats.horseRiding >= 70) return "the Colt-Tamer"
            if (stats.intelligence >= 70) return "the Quick-Witted"
            if (stats.appearance >= 80) return "the Bright-Eyed"
            if (stats.leadership >= 50) return "the Young Khan"
            if (stats.reputation >= 50) return "the Promising"
            return null
        }

        if (isGreatKhan) return "the Universal Ruler"
        if (conqueredTribes.size >= 8) return "the World-Eater"
        if (conqueredTribes.size >= 5) return "Scourge of the Steppe"
        if (conqueredTribes.size >= 3) return "the Conqueror"

        if (role == "High Shaman" || role == "Oracle of the Eternal Sky") return "the Spirit-Speaker"
        if (role == "Merchant Prince" || role == "Guild Master") {
            if (stats.wealth > 100000) return "the Golden"
            if (stats.wealth > 50000) return "the Wealthy"
        }
        if (role == "Warlord" || role == "Marshal of the Empire") return "the Wolf"
        if (role == "General" && stats.strength > 80) return "the Unyielding"
        if (role == "Imperial Guard (Kheshig)") return "the Loyal"
        if (role == "Tribal Judge (Jarghuchi)") return "the Lawgiver"
        if (role == "Vizier" || role == "Khagan's Advisor") return "the Wise"

        if (stats.archery >= 95) return "Eagle-Eye"
        if (stats.perception >= 95) return "the Seer"
        if (stats.strength >= 95) return "Iron-Will"
        if (stats.horseRiding >= 95) return "Master of the Winds"
        if (stats.intelligence >= 95) return "the Sage"
        if (stats.leadership >= 95) return "the Great"

        if (stats.reputation >= 80) return "the Illustrious"
        if (stats.strength >= 80) return "the Iron"
        if (stats.horseRiding >= 80) return "the Wind-Rider"
        if (stats.appearance >= 85) return "the Radiant"
        if (stats.reputation >= 60) return "the Renowned"

        return null
    }

    fun calculateMilitaryPower(character: Character): Pair<Int, Int> {
        val baseSoldiers = when (character.role) {
            "Horseback Recruit" -> 10
            "Warrior" -> 30
            "Vanguard" -> 50
            "Squad Leader (Arban)" -> 10
            "Centurion (Zuun)" -> 100
            "Commander of Thousand (Mingghan)" -> 1000
            "General" -> 5000
            "Warlord" -> 10000
            "Marshal of the Empire" -> 25000
            "Kheshig Aspirant" -> 1
            "Imperial Guard (Kheshig)" -> 10
            "Noyan (Noble Commander)" -> 2000
            "Khagan's Advisor" -> 500
            "Great Khan" -> 100000
            "Imperial Spymaster" -> 500
            "Nomad" -> 5
            "Herder" -> 2
            "Master Herder" -> 20
            "Clan Scout" -> 15
            "Master Hunter" -> 25
            "Hunter" -> 10
            "Child", "Infant" -> 0
            else -> 5
        }

        val statsBonus = (character.stats.leadership / 10.0) + (character.stats.reputation / 20.0)
        var soldiers = (baseSoldiers * (1.0 + statsBonus / 10.0)).toInt()
        soldiers += character.customRecruitedSoldiers
        soldiers += character.conqueredTribes.size * 200

        val idealHorses = max(1, soldiers * 2)
        val mobilityBonus = min(1.5, max(0.5, character.livestock.horses.toDouble() / idealHorses))

        val stats = character.stats
        val combatSkill = (stats.archery + stats.horseRiding + stats.strength + stats.perception) / 400.0

        val trainingFactor = 1.0 + (character.warriorTraining / 200.0)
        val equipmentFactor = 1.0 + ((character.warriorEquipmentLevel - 1) * 0.20)
        val moraleFactor = 0.5 + (character.warriorMorale / 100.0)

        val power = (soldiers * (1.0 + combatSkill) * mobilityBonus * trainingFactor * equipmentFactor * moraleFactor).toInt()
        return Pair(max(0, power), max(0, soldiers))
    }

    fun refreshMarketItems(conditionName: String = "Stable", trends: Map<String, Double> = emptyMap()): List<AvailableMarketItem> {
        val multiplierSet = Constants.MARKET_MULTIPLIERS[conditionName] ?: Constants.MARKET_MULTIPLIERS["Stable"]!!
        val shuffled = Constants.MARKET_ITEMS.shuffled()
        val count = Random.nextInt(5, 9)

        return shuffled.take(count).map { item ->
            val jitter = 0.9 + Random.nextDouble(0.2)
            var basePrice = item.price.toDouble()
            val categoryTrend = trends[item.type] ?: 1.0
            basePrice *= categoryTrend

            when (item.type) {
                "Weapon", "Armor" -> basePrice *= multiplierSet.gear
                "Horse" -> basePrice *= multiplierSet.livestock
                "Commodity" -> basePrice *= multiplierSet.commodity
                "Luxury" -> basePrice *= multiplierSet.luxury
            }
            basePrice *= multiplierSet.buy

            AvailableMarketItem(
                id = "${item.id}-${generateId()}",
                originalId = item.id,
                name = item.name,
                type = item.type,
                category = item.category,
                price = max(5, (basePrice * jitter).toInt()),
                basePrice = item.price,
                quality = item.quality,
                desc = item.desc
            )
        }
    }

    fun generateCharacter(
        name: String? = null,
        gender: Gender = Gender.MALE,
        tribe: String = "Khamag Mongol",
        clan: String = "Borgijin",
        socialClass: SocialClass = SocialClass.NOMAD,
        appearanceOptions: AppearanceOptions = AppearanceOptions(),
        traits: List<String> = emptyList()
    ): Character {
        val baseStats = Constants.INITIAL_STATS[socialClass] ?: CharacterStats()
        var randomizedStats = baseStats.copy(
            health = max(10, min(100, baseStats.health + Random.nextInt(-10, 11))),
            happiness = max(10, min(100, baseStats.happiness + Random.nextInt(-10, 11))),
            strength = max(10, min(100, baseStats.strength + Random.nextInt(-10, 11))),
            intelligence = max(10, min(100, baseStats.intelligence + Random.nextInt(-10, 11))),
            perception = max(10, min(100, baseStats.perception + Random.nextInt(-10, 11))),
            leadership = max(5, min(100, baseStats.leadership + Random.nextInt(-10, 11))),
            loyalty = max(10, min(100, baseStats.loyalty + Random.nextInt(-10, 11))),
            horseRiding = max(5, min(100, baseStats.horseRiding + Random.nextInt(-10, 11))),
            archery = max(5, min(100, baseStats.archery + Random.nextInt(-10, 11))),
            wealth = max(0, baseStats.wealth + Random.nextInt(-5, 6) * 5)
        )

        traits.forEach { traitId ->
            val trait = Constants.STARTING_TRAITS.find { it.id == traitId }
            if (trait != null) {
                randomizedStats = trait.statBonus(randomizedStats)
            }
        }

        val charName = if (!name.isNullOrBlank()) name else {
            val names = if (gender == Gender.MALE) Constants.MONGOL_NAMES_MALE else Constants.MONGOL_NAMES_FEMALE
            "${names.random()} $clan"
        }

        val fatherName = "${Constants.MONGOL_NAMES_MALE.random()} $clan"
        val motherName = "${Constants.MONGOL_NAMES_FEMALE.random()} $clan"

        val initialRelationships = listOf(
            Relationship(
                id = generateId(),
                name = fatherName,
                type = "Father",
                loyalty = 85,
                clan = clan,
                socialClass = socialClass.displayName,
                gender = "Male",
                age = 25,
                traits = listOf("Brave", "Hardy")
            ),
            Relationship(
                id = generateId(),
                name = motherName,
                type = "Mother",
                loyalty = 90,
                clan = clan,
                socialClass = socialClass.displayName,
                gender = "Female",
                age = 22,
                traits = listOf("Kind", "Wise")
            )
        )

        val starterAssets = if (socialClass == SocialClass.NOMAD) emptyList() else listOf(
            Asset(
                id = "starter-horse",
                name = "Family Steppe Pony",
                type = "Horse",
                value = 60,
                quality = 35,
                stats = AssetStats(speed = 40, loyalty = 80, attackBonus = 2, defenseBonus = 2)
            )
        )

        val initialLivestock = when (socialClass) {
            SocialClass.NOMAD -> Livestock(horses = 2, sheep = 20, cattle = 5, goats = 10, yaks = 1, camels = 0)
            SocialClass.WARRIOR -> Livestock(horses = 5, sheep = 15, cattle = 3, goats = 5, yaks = 0, camels = 0)
            SocialClass.NOBLE -> Livestock(horses = 20, sheep = 100, cattle = 30, goats = 50, yaks = 10, camels = 5)
            SocialClass.MERCHANT -> Livestock(horses = 4, sheep = 10, cattle = 2, goats = 5, yaks = 0, camels = 5)
            SocialClass.BLACKSMITH -> Livestock(horses = 2, sheep = 15, cattle = 4, goats = 8, yaks = 2, camels = 0)
        }

        val tribeRelations = Constants.TRIBES.filter { it != tribe }.map {
            TribeRelation(
                name = it,
                level = "Neutral",
                standing = 0,
                isTrading = false,
                militaryPower = Random.nextInt(500, 2500),
                leaderName = "${Constants.MONGOL_NAMES_MALE.random()} Noyan",
                activeTreaty = "NONE",
                treatyTurnsRemaining = 0,
                influencePerSeason = 0,
                goldPerSeason = 0
            )
        }

        val kingdomRelations = Constants.KINGDOMS.map {
            TribeRelation(
                name = it,
                level = "Neutral",
                standing = 0,
                isTrading = false,
                militaryPower = Random.nextInt(5000, 25000),
                leaderName = "Emperor of $it",
                activeTreaty = "NONE",
                treatyTurnsRemaining = 0,
                influencePerSeason = 0,
                goldPerSeason = 0
            )
        }

        val initialWorkshops = if (socialClass == SocialClass.BLACKSMITH) listOf(
            Workshop(id = generateId(), name = "Clan Blacksmith Forge", type = "Forge", level = 1, passiveIncome = 60, costToUpgrade = 250, description = "Smelts steppe ore into heavy blades.")
        ) else emptyList()

        val char = Character(
            id = generateId(),
            name = charName,
            age = 0,
            gender = gender.displayName,
            socialClass = socialClass.displayName,
            stats = randomizedStats,
            role = "Child",
            tribe = tribe,
            clan = clan,
            relationships = initialRelationships,
            assets = starterAssets,
            isAlive = true,
            children = 0,
            clanWealth = if (socialClass == SocialClass.NOBLE) 5000 else if (socialClass == SocialClass.MERCHANT) 3000 else 1000,
            tribeRelations = tribeRelations,
            kingdomRelations = kingdomRelations,
            conqueredTribes = emptyList(),
            conqueredKingdoms = emptyList(),
            isGreatKhan = false,
            militaryPower = 0,
            hordeSize = 0,
            lifestyle = "Nomadic",
            pastureCapacity = if (socialClass == SocialClass.NOBLE) 600 else 300,
            pastureUpgrades = 0,
            livestock = initialLivestock,
            marketCondition = "Stable",
            availableMarketItems = refreshMarketItems("Stable"),
            history = listOf(HistoryEntry(0, "Born to the $clan clan in the $tribe tribe under the Eternal Blue Sky.")),
            traits = traits,
            appearanceOptions = appearanceOptions,
            weather = "Clear",
            workshops = initialWorkshops
        )

        val (milPower, soldiers) = calculateMilitaryPower(char)
        return char.copy(
            militaryPower = milPower,
            hordeSize = soldiers,
            title = calculateTitle(char)
        )
    }

    fun ageUp(character: Character): Character {
        val newAge = character.age + 1
        val newHistory = character.history.toMutableList()
        var newStats = character.stats.copy()

        // Natural stat shifts
        newStats = newStats.copy(
            happiness = max(0, min(100, newStats.happiness + Random.nextInt(-5, 6))),
            health = max(0, min(100, newStats.health + Random.nextInt(-4, 3))),
            perception = max(0, min(100, newStats.perception + Random.nextInt(0, 3)))
        )

        // Unified Economy
        val militaryRoles = setOf(
            "Horseback Recruit", "Warrior", "Vanguard", "Squad Leader (Arban)",
            "Centurion (Zuun)", "Commander of Thousand (Mingghan)", "General",
            "Warlord", "Marshal of the Empire", "Kheshig Aspirant", "Imperial Guard (Kheshig)"
        )
        val isMilitary = character.role in militaryRoles
        val soldierSalaryReceived = if (isMilitary) (Constants.ROLE_SALARIES[character.role] ?: 0) else 0
        val baseRoleSalary = if (!isMilitary) (Constants.ROLE_SALARIES[character.role] ?: 0) else 0

        // Artisan & Trade income
        var artisanIncome = 0
        if (character.socialClass == SocialClass.BLACKSMITH.displayName) {
            artisanIncome = (newStats.strength * 2) + (newStats.intelligence * 2)
        } else if (character.socialClass == SocialClass.MERCHANT.displayName || character.role.contains("Merchant") || character.role.contains("Trader")) {
            val mult = if (character.role == "Merchant Prince") 0.10 else 0.05
            artisanIncome = (newStats.wealth * mult).toInt()
        }

        // Workshop passive income
        var workshopIncome = 0
        character.workshops.forEach { w ->
            workshopIncome += w.passiveIncome * w.level
        }

        // Taxes & Tributes collected
        var taxesCollected = 0
        if (character.role == "Great Khan") {
            character.tribeRelations.forEach { rel ->
                if (rel.standing >= 50) taxesCollected += 200
                else if (rel.standing >= 0) taxesCollected += 100
                else if (rel.level != "At War") taxesCollected += 30
            }
            taxesCollected += character.conqueredTribes.size * 750
            taxesCollected += character.conqueredKingdoms.size * 1500
        } else if (character.role in listOf("Warlord", "General", "Noyan (Noble Commander)", "Marshal of the Empire")) {
            taxesCollected += character.conqueredTribes.size * 350
            taxesCollected += character.assets.size * 25
        } else if (character.role in listOf("Clan Elder", "Tribal Judge (Jarghuchi)", "Master Herder", "Guild Master")) {
            taxesCollected += 120 + (newStats.reputation * 1.5).toInt()
        }

        // Taxes Paid
        var taxesPaid = 0
        val exemptFromTaxes = setOf("Great Khan", "Warlord", "Noyan (Noble Commander)", "Marshal of the Empire", "General")
        if (newAge >= 15 && character.role !in exemptFromTaxes) {
            when (character.socialClass) {
                SocialClass.NOMAD.displayName -> taxesPaid = 6 + (newStats.wealth * 0.02).toInt()
                SocialClass.BLACKSMITH.displayName -> taxesPaid = 12 + (newStats.wealth * 0.035).toInt()
                SocialClass.WARRIOR.displayName -> taxesPaid = 8 + (newStats.wealth * 0.025).toInt()
                SocialClass.MERCHANT.displayName -> taxesPaid = 35 + (newStats.wealth * 0.05).toInt()
                SocialClass.NOBLE.displayName -> taxesPaid = 80 + (newStats.wealth * 0.045).toInt()
            }
        }

        // Soldier Salary Paid for horde upkeep
        var soldierSalaryPaid = 0
        val commandRoles = setOf("Squad Leader (Arban)", "Centurion (Zuun)", "Commander of Thousand (Mingghan)", "General", "Warlord", "Marshal of the Empire", "Noyan (Noble Commander)", "Great Khan")
        if (character.hordeSize > 0 && character.role in commandRoles) {
            val wageRate = when (character.role) {
                "Squad Leader (Arban)" -> 1.0
                "Centurion (Zuun)" -> 0.75
                "Commander of Thousand (Mingghan)" -> 0.6
                "General" -> 0.5
                "Great Khan" -> 0.25
                else -> 0.4
            }
            soldierSalaryPaid = (character.hordeSize * wageRate).toInt()
        }

        // Lifestyle & Herd maintenance
        val nobleMaintenance = if (character.socialClass == SocialClass.NOBLE.displayName && newAge > 18 && character.role != "Great Khan") {
            character.assets.size * 30 + 120
        } else 0

        val grossIncome = baseRoleSalary + soldierSalaryReceived + taxesCollected + artisanIncome + workshopIncome
        val grossExpenses = taxesPaid + soldierSalaryPaid + nobleMaintenance
        val netIncome = grossIncome - grossExpenses

        newStats = newStats.copy(wealth = max(0, newStats.wealth + netIncome))

        if (soldierSalaryReceived > 0) {
            newHistory.add(HistoryEntry(newAge, "🛡️ Received army wage of ${soldierSalaryReceived}г as ${character.role}."))
        }
        if (taxesPaid > 0) {
            newHistory.add(HistoryEntry(newAge, "📥 Paid ${taxesPaid}г in seasonal taxes."))
        }
        if (taxesCollected > 0) {
            newHistory.add(HistoryEntry(newAge, "💰 Collected ${taxesCollected}г in vassal tributes and subject taxes."))
        }
        if (soldierSalaryPaid > 0) {
            newHistory.add(HistoryEntry(newAge, "✊ Disbursed ${soldierSalaryPaid}г to maintain your horde of ${character.hordeSize} warriors."))
        }

        // Livestock breeding & drought
        val inDrought = character.droughtYears > 0
        val droughtPenalty = if (inDrought) 0.2 else 1.0
        val currentCapacity = character.pastureCapacity
        val totalAnimals = character.livestock.totalCount()
        val capacityMult = if (totalAnimals > currentCapacity) 0.05 else 1.0

        var horses = character.livestock.horses
        var sheep = character.livestock.sheep
        var cattle = character.livestock.cattle
        var goats = character.livestock.goats
        var yaks = character.livestock.yaks
        var camels = character.livestock.camels

        if (horses > 0) horses += max(0, (horses * (0.10 + Random.nextDouble(0.05)) * droughtPenalty * capacityMult).toInt())
        if (sheep > 0) sheep += max(0, (sheep * (0.20 + Random.nextDouble(0.10)) * droughtPenalty * capacityMult).toInt())
        if (cattle > 0) cattle += max(0, (cattle * (0.08 + Random.nextDouble(0.05)) * droughtPenalty * capacityMult).toInt())
        if (goats > 0) goats += max(0, (goats * (0.15 + Random.nextDouble(0.08)) * droughtPenalty * capacityMult).toInt())
        if (yaks > 0) yaks += max(0, (yaks * (0.08 + Random.nextDouble(0.04)) * droughtPenalty * capacityMult).toInt())
        if (camels > 0) camels += max(0, (camels * (0.05 + Random.nextDouble(0.03)) * droughtPenalty * capacityMult).toInt())

        val updatedLivestock = Livestock(horses, sheep, cattle, goats, yaks, camels)

        // Random Market condition shift
        val possibleConditions = listOf("Stable", "Stable", "Economic Boom", "Recession", "Livestock Famine", "War Preparations", "Gold Rush", "Silk Road Blockade")
        val newMarketCondition = possibleConditions.random()
        val newMarketItems = refreshMarketItems(newMarketCondition)

        // Weather shift
        val weathers = listOf("Clear", "Clear", "Overcast", "Snow", "Dust Storm")
        val newWeather = weathers.random()

        // Aging relationships
        val updatedRelationships = character.relationships.map { rel ->
            val relAge = rel.age + 1
            var loyalty = rel.loyalty
            if (Random.nextDouble() < 0.1) loyalty = max(0, min(100, loyalty + Random.nextInt(-5, 6)))
            rel.copy(age = relAge, loyalty = loyalty)
        }

        // Check Caravan Progress
        val updatedCaravans = character.caravans.map { caravan ->
            if (caravan.status == "Traveling") {
                val newProgress = caravan.progressYears + 1
                if (newProgress >= caravan.durationYears) {
                    val returnGold = Random.nextInt(caravan.expectedReturnMin, caravan.expectedReturnMax + 1)
                    newStats = newStats.copy(wealth = newStats.wealth + returnGold)
                    newHistory.add(HistoryEntry(newAge, "🐪 Caravan to ${caravan.destination} completed safely! Earned ${returnGold}г profit."))
                    caravan.copy(status = "Completed", progressYears = newProgress, narrative = "Returned laden with foreign gold and exotic silk.")
                } else {
                    caravan.copy(progressYears = newProgress)
                }
            } else caravan
        }

        // Old age health checks
        var isAlive = true
        var deathCause: String? = null
        if (newAge >= 60) {
            val deathChance = (newAge - 55) * 0.03
            if (Random.nextDouble() < deathChance || newStats.health <= 0) {
                isAlive = false
                deathCause = if (newStats.health <= 0) "Succumbed to battle wounds and physical frailty." else "Passed away peacefully under the Eternal Sky at the age of $newAge."
                newHistory.add(HistoryEntry(newAge, "💀 $deathCause"))
            }
        }

        val updatedChar = character.copy(
            age = newAge,
            stats = newStats,
            livestock = updatedLivestock,
            marketCondition = newMarketCondition,
            availableMarketItems = newMarketItems,
            weather = newWeather,
            relationships = updatedRelationships,
            caravans = updatedCaravans,
            history = newHistory,
            isAlive = isAlive,
            deathCause = deathCause,
            taxReport = TaxReport(taxesPaid, taxesCollected, soldierSalaryPaid, soldierSalaryReceived, netIncome),
            droughtYears = max(0, character.droughtYears - 1)
        )

        val (power, soldiers) = calculateMilitaryPower(updatedChar)
        return updatedChar.copy(
            militaryPower = power,
            hordeSize = soldiers,
            title = calculateTitle(updatedChar)
        )
    }

    fun generateMarriageCandidates(count: Int = 3): List<Relationship> {
        return (0 until count).map {
            val name = Constants.MONGOL_NAMES_FEMALE.random()
            val clan = Constants.MONGOL_SURNAMES.random()
            val traits = listOf("Loyal", "Kind", "Wise", "Fertile", "Brave", "Ambitious").shuffled().take(2)
            Relationship(
                id = generateId(),
                name = "$name $clan",
                type = "Spouse Candidate",
                loyalty = Random.nextInt(60, 90),
                clan = clan,
                socialClass = SocialClass.values().random().displayName,
                gender = "Female",
                age = Random.nextInt(17, 26),
                traits = traits,
                appearance = "Radiant beauty with midnight hair and dark eyes."
            )
        }
    }

    fun generatePleasureTentCandidates(count: Int = 3): List<Relationship> {
        val attires = listOf("a form-fitting crimson silk robe", "flowing emerald silks with bronze belt", "fine Persian indigo linens with pearl accents")
        val scents = listOf("rosewater and sandalwood", "warm amber, musk and honey", "wild jasmine blossoms")
        return (0 until count).map {
            val name = Constants.MONGOL_NAMES_FEMALE.random()
            val attire = attires.random()
            val scent = scents.random()
            Relationship(
                id = generateId(),
                name = name,
                type = "Pleasure Candidate",
                loyalty = Random.nextInt(40, 70),
                socialClass = "Nomad",
                gender = "Female",
                age = Random.nextInt(18, 25),
                traits = listOf("Charismatic", "Beautiful"),
                appearance = "Wearing $attire, carrying the alluring fragrance of $scent."
            )
        }
    }

    fun generateFriendCandidates(count: Int = 3, playerAge: Int = 20): List<Relationship> {
        return (0 until count).map {
            val isMale = Random.nextBoolean()
            val names = if (isMale) Constants.MONGOL_NAMES_MALE else Constants.MONGOL_NAMES_FEMALE
            val name = names.random()
            val clan = Constants.MONGOL_SURNAMES.random()
            val age = max(10, playerAge + Random.nextInt(-4, 5))
            Relationship(
                id = generateId(),
                name = "$name $clan",
                type = "Potential Friend",
                loyalty = Random.nextInt(50, 80),
                clan = clan,
                gender = if (isMale) "Male" else "Female",
                age = age,
                traits = listOf("Loyal", "Brave", "Wise").shuffled().take(2),
                originType = "Tribe",
                originName = Constants.TRIBES.random()
            )
        }
    }

    fun simulateBattle(player: Combatant, enemy: Combatant): CombatOutcome {
        var turn = 1
        val log = mutableListOf<CombatLogEntry>()
        var playerHealth = player.stats.endurance * 10
        var enemyHealth = enemy.stats.endurance * 10

        fun getAtk(c: Combatant): Int {
            var power = c.stats.strength + c.stats.skill
            if (c.weapon != null) power += c.weapon.attackBonus
            if (c.mount != null) power += c.mount.attackBonus
            return power
        }

        fun getDef(c: Combatant): Int {
            var defense = (c.stats.skill * 0.8 + c.stats.strength * 0.2).toInt()
            if (c.armor != null) defense += c.armor.defenseBonus
            if (c.mount != null) defense += c.mount.defenseBonus
            return defense
        }

        while (playerHealth > 0 && enemyHealth > 0 && turn <= 30) {
            val pAtk = getAtk(player)
            val eDef = getDef(enemy)
            val dmgToEnemy = max(1, (pAtk * (0.8 + Random.nextDouble(0.4)) - eDef * 0.5).toInt())
            enemyHealth -= dmgToEnemy
            log.add(CombatLogEntry(turn, player.name, dmgToEnemy, "${player.name} strikes with fierce skill for $dmgToEnemy damage!"))

            if (enemyHealth <= 0) break

            val eAtk = getAtk(enemy)
            val pDef = getDef(player)
            val dmgToPlayer = max(1, (eAtk * (0.8 + Random.nextDouble(0.4)) - pDef * 0.5).toInt())
            playerHealth -= dmgToPlayer
            log.add(CombatLogEntry(turn, enemy.name, dmgToPlayer, "${enemy.name} counters aggressively for $dmgToPlayer damage!"))

            turn++
        }

        val winner = if (playerHealth > enemyHealth) player.name else enemy.name
        val pStr = getAtk(player) + getDef(player)
        val eStr = getAtk(enemy) + getDef(enemy)
        val prob = if (pStr + eStr == 0) 50 else min(100, max(0, ((pStr.toDouble() / (pStr + eStr)) * 100).toInt()))

        return CombatOutcome(winner, turn, log, prob)
    }

    fun generateEnemy(difficulty: Int): Combatant {
        val titles = listOf("Light Steppe Archer", "Tribal Spearman", "Bökh Wrestler", "Mountain Bandit", "Mangudai Skirmisher", "Heavy Lancer", "Merkid Vanguard", "Naiman Duelist", "Kheshig Elite Guard")
        val title = titles[min(titles.size - 1, difficulty - 1)]
        val tribe = Constants.TRIBES.random()

        val baseStr = 30 + difficulty * 6
        val baseSkill = 20 + difficulty * 5
        val baseEnd = 40 + difficulty * 7

        return Combatant(
            name = "$title of the $tribe",
            stats = CombatantStats(strength = baseStr, skill = baseSkill, endurance = baseEnd),
            weapon = Equipment(id = "e_w", name = "Steel Blade", type = "Weapon", attackBonus = 10 + difficulty * 3),
            armor = Equipment(id = "e_a", name = "Nomad Armor", type = "Armor", defenseBonus = 8 + difficulty * 3),
            mount = Equipment(id = "e_m", name = "Battle Horse", type = "Mount", attackBonus = 5 + difficulty, defenseBonus = 5 + difficulty)
        )
    }
}
