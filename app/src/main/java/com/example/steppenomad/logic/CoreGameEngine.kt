package com.example.steppenomad.logic

import com.example.steppenomad.data.Constants
import com.example.steppenomad.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random

/**
 * Seasonal phase of the steppe simulation turn.
 */
enum class Season(val displayName: String, val description: String) {
    SPRING("Spring", "Green pastures thaw; new foals and lambs are born."),
    SUMMER("Summer", "Lush grazing season, great tribal Naadam games, and trade caravans."),
    AUTUMN("Autumn", "Fat herds gathered for winter prep, seasonal tax collection, and warfare campaigns."),
    WINTER("Winter", "Freezing winds and zud blizzard hazards; requires sufficient fodder and shelter.")
}

/**
 * Encapsulates the turn summary report generated at the end of each simulation turn.
 */
data class TurnReport(
    val turnNumber: Int,
    val year: Int,
    val season: Season,
    val grossIncome: Int,
    val grossExpenses: Int,
    val netGoldChange: Int,
    val herdBirths: Int,
    val herdLosses: Int,
    val horseChange: Int = 0,
    val grainChange: Int = 0,
    val influenceChange: Int = 0,
    val newWarriorsRecruited: Int = 0,
    val messages: List<String>,
    val triggeredEvent: GameEvent? = null
)

/**
 * Core engine class managing the turn-based state and resources of the Steppe Nomad simulation.
 */
class CoreGameEngine(
    initialCharacter: Character? = null
) {
    private var _turnNumber = MutableStateFlow(1)
    val turnNumber: StateFlow<Int> = _turnNumber.asStateFlow()

    private var _currentSeason = MutableStateFlow(Season.SPRING)
    val currentSeason: StateFlow<Season> = _currentSeason.asStateFlow()

    private var _characterState = MutableStateFlow<Character?>(initialCharacter)
    val characterState: StateFlow<Character?> = _characterState.asStateFlow()

    private var _lastTurnReport = MutableStateFlow<TurnReport?>(null)
    val lastTurnReport: StateFlow<TurnReport?> = _lastTurnReport.asStateFlow()

    private var _pendingEvent = MutableStateFlow<GameEvent?>(null)
    val pendingEvent: StateFlow<GameEvent?> = _pendingEvent.asStateFlow()

    /**
     * Initializes the simulation with a newly generated or selected character.
     */
    fun initialize(character: Character) {
        val (milPower, soldiers) = GameEngine.calculateMilitaryPower(character)
        val refreshed = character.copy(
            militaryPower = milPower,
            hordeSize = soldiers,
            title = GameEngine.calculateTitle(character),
            availableMarketItems = GameEngine.refreshMarketItems(character.marketCondition)
        )
        _characterState.value = refreshed
        _turnNumber.value = 1
        _currentSeason.value = Season.SPRING
        _pendingEvent.value = null
        _lastTurnReport.value = null
    }

    /**
     * Restores simulation state from persistent DataStore.
     */
    fun restoreState(character: Character, turnNumber: Int, season: Season) {
        val (milPower, soldiers) = GameEngine.calculateMilitaryPower(character)
        val restored = character.copy(
            militaryPower = milPower,
            hordeSize = soldiers,
            title = GameEngine.calculateTitle(character)
        )
        _characterState.value = restored
        _turnNumber.value = turnNumber
        _currentSeason.value = season
        _pendingEvent.value = null
        _lastTurnReport.value = null
    }

    /**
     * Executes a complete turn-based cycle of the simulation.
     * Advances season/year, calculates resources, updates herds, checks life conditions, and selects events.
     */
    fun advanceTurn(): TurnReport {
        val current = _characterState.value ?: throw IllegalStateException("GameEngine not initialized with character.")
        val turn = _turnNumber.value
        val season = _currentSeason.value

        val messages = mutableListOf<String>()
        var newCharacter = current

        // 1. Advance Season & Year
        val nextSeason = when (season) {
            Season.SPRING -> Season.SUMMER
            Season.SUMMER -> Season.AUTUMN
            Season.AUTUMN -> Season.WINTER
            Season.WINTER -> Season.SPRING
        }
        val advancesYear = (season == Season.WINTER)
        val newAge = if (advancesYear) current.age + 1 else current.age

        // 2. Resource & Fiscal Balance (Divided seasonally or annually)
        var grossIncome = 0
        var grossExpenses = 0

        // Role & Rank Wage
        val roleSalary = (Constants.ROLE_SALARIES[current.role] ?: 0) / 4
        if (roleSalary > 0) {
            grossIncome += roleSalary
            messages.add("Received seasonal rank wage: +${roleSalary}г")
        }

        // Workshop Passive Revenue
        var workshopTotal = 0
        current.workshops.forEach { w ->
            val yield = (w.passiveIncome * w.level) / 4
            workshopTotal += yield
        }
        if (workshopTotal > 0) {
            grossIncome += workshopTotal
            messages.add("Workshop production revenue: +${workshopTotal}г")
        }

        // Tributary & Vassal Collections (Collected primarily in Autumn/Winter)
        var tributes = 0
        if (season == Season.AUTUMN || season == Season.WINTER) {
            tributes += current.conqueredTribes.size * 200
            tributes += current.conqueredKingdoms.size * 400
            if (tributes > 0) {
                grossIncome += tributes
                messages.add("Collected tributary dues: +${tributes}г")
            }
        }

        // Taxes & Expenses
        var taxes = 0
        if (newAge >= 15 && current.role !in setOf("Great Khan", "Warlord", "Marshal of the Empire")) {
            taxes = when (current.socialClass) {
                SocialClass.NOBLE.displayName -> 25
                SocialClass.MERCHANT.displayName -> 15
                SocialClass.WARRIOR.displayName -> 5
                else -> 3
            }
            grossExpenses += taxes
        }

        // Horde Maintenance (Quarterly wage)
        var hordeUpkeep = 0
        if (current.hordeSize > 0) {
            hordeUpkeep = max(1, (current.hordeSize * 0.1).toInt())
            grossExpenses += hordeUpkeep
        }

        val netGold = grossIncome - grossExpenses
        val updatedWealth = max(0, current.stats.wealth + netGold)
        var updatedStats = current.stats.copy(wealth = updatedWealth)

        // 3. Herd Dynamics (Spring breeding, Winter freeze)
        var herdBirths = 0
        var herdLosses = 0
        val live = current.livestock
        val initialHorses = live.horses
        var horses = live.horses
        var sheep = live.sheep
        var cattle = live.cattle
        var goats = live.goats
        var yaks = live.yaks
        var camels = live.camels

        val totalAnimals = live.totalCount()
        val isOvergrazed = totalAnimals > current.pastureCapacity

        if (season == Season.SPRING && !isOvergrazed) {
            val horseBirth = max(0, (horses * 0.12).toInt())
            val sheepBirth = max(0, (sheep * 0.20).toInt())
            val cattleBirth = max(0, (cattle * 0.10).toInt())
            val goatBirth = max(0, (goats * 0.18).toInt())

            horses += horseBirth
            sheep += sheepBirth
            cattle += cattleBirth
            goats += goatBirth

            herdBirths = horseBirth + sheepBirth + cattleBirth + goatBirth
            if (herdBirths > 0) {
                messages.add("Spring breeding season brought $herdBirths new livestock to the herds.")
            }
        } else if (season == Season.WINTER) {
            // Cold winter attrition
            val lossRate = if (current.weather == "Snow") 0.08 else 0.03
            val sheepLost = (sheep * lossRate).toInt()
            val horseLost = (horses * (lossRate * 0.5)).toInt()

            sheep = max(0, sheep - sheepLost)
            horses = max(0, horses - horseLost)
            herdLosses = sheepLost + horseLost
            if (herdLosses > 0) {
                messages.add("Winter freeze took $herdLosses animals from the steppe herds.")
            }
        }

        val horseChange = horses - initialHorses
        val updatedLivestock = Livestock(horses, sheep, cattle, goats, yaks, camels)

        // 4. Grain & Influence Resource Cycles
        val seasonalGrainYield = when (season) {
            Season.SUMMER -> 35 + (current.pastureUpgrades * 15)
            Season.AUTUMN -> 50 + (current.pastureUpgrades * 20)
            Season.SPRING -> 15
            Season.WINTER -> 0
        }
        val seasonalGrainConsumption = when (season) {
            Season.WINTER -> 25 + (horses / 15) + (current.hordeSize / 25)
            Season.AUTUMN -> 15
            else -> 10
        }
        val grainChange = seasonalGrainYield - seasonalGrainConsumption
        val updatedGrain = max(0, current.grain + grainChange)

        val baseInfluenceGrowth = (current.stats.reputation / 20) + (current.conqueredTribes.size * 2) + if (current.isGreatKhan) 5 else 1
        
        // Calculate Treaty & Alliance seasonal influence & gold yield
        var treatyInfluenceGrowth = 0
        var treatyGoldGrowth = 0
        var activeTreatiesCount = 0

        current.tribeRelations.forEach { rel ->
            val treaty = rel.treatyType
            if (treaty != TreatyType.NONE) {
                activeTreatiesCount++
                treatyInfluenceGrowth += if (rel.influencePerSeason > 0) rel.influencePerSeason else treaty.influenceGainPerSeason
                treatyGoldGrowth += if (rel.goldPerSeason > 0) rel.goldPerSeason else treaty.goldGainPerSeason
            }
        }
        current.kingdomRelations.forEach { rel ->
            val treaty = rel.treatyType
            if (treaty != TreatyType.NONE) {
                activeTreatiesCount++
                treatyInfluenceGrowth += if (rel.influencePerSeason > 0) rel.influencePerSeason else (treaty.influenceGainPerSeason + 2)
                treatyGoldGrowth += if (rel.goldPerSeason > 0) rel.goldPerSeason else (treaty.goldGainPerSeason + 30)
            }
        }

        if (activeTreatiesCount > 0 && treatyInfluenceGrowth > 0) {
            val goldMsg = if (treatyGoldGrowth > 0) " and +${treatyGoldGrowth}г trade/tribute" else ""
            messages.add("📜 Diplomatic Treaties & Alliances ($activeTreatiesCount active) generated +$treatyInfluenceGrowth Influence$goldMsg.")
            grossIncome += treatyGoldGrowth
            updatedStats = updatedStats.copy(wealth = updatedStats.wealth + treatyGoldGrowth)
        }

        val totalInfluenceGain = baseInfluenceGrowth + treatyInfluenceGrowth
        val updatedInfluence = max(0, current.influence + totalInfluenceGain)

        // 5. Weather & Silk Road Conditions
        val weatherList = when (nextSeason) {
            Season.WINTER -> listOf("Snow", "Overcast", "Clear")
            Season.SUMMER -> listOf("Clear", "Clear", "Overcast", "Dust Storm")
            else -> listOf("Clear", "Clear", "Overcast")
        }
        val newWeather = weatherList.random()

        // 6. Caravan Progress
        val updatedCaravans = current.caravans.map { caravan ->
            if (caravan.status == "Traveling") {
                val newProg = caravan.progressYears + 1
                if (newProg >= caravan.durationYears) {
                    val profit = Random.nextInt(caravan.expectedReturnMin, caravan.expectedReturnMax + 1)
                    updatedStats = updatedStats.copy(wealth = updatedStats.wealth + profit)
                    messages.add("Caravan to ${caravan.destination} arrived with ${profit}г profit!")
                    caravan.copy(status = "Completed", progressYears = newProg)
                } else {
                    caravan.copy(progressYears = newProg)
                }
            } else caravan
        }

        // 7. Natural Lifespan & Health
        var isAlive = true
        var deathCause: String? = null
        if (newAge >= 60 && advancesYear) {
            val mortality = (newAge - 55) * 0.03
            if (Random.nextDouble() < mortality || updatedStats.health <= 0) {
                isAlive = false
                deathCause = "Ascended to the Eternal Blue Sky at age $newAge."
                messages.add(deathCause)
            }
        }

        // 8. Event Triggering
        val potentialEvent = LocalEvents.getEventForCharacter(current)

        // Build turn history entry
        val historyList = current.history.toMutableList()
        if (advancesYear) {
            historyList.add(HistoryEntry(newAge, "Reached age $newAge. Season transitioned to ${nextSeason.displayName}."))
        }

        newCharacter = current.copy(
            age = newAge,
            stats = updatedStats,
            livestock = updatedLivestock,
            grain = updatedGrain,
            influence = updatedInfluence,
            weather = newWeather,
            caravans = updatedCaravans,
            isAlive = isAlive,
            deathCause = deathCause,
            history = historyList,
            taxReport = TaxReport(taxes, tributes, hordeUpkeep, roleSalary, netGold)
        )

        val (power, soldiers) = GameEngine.calculateMilitaryPower(newCharacter)
        val finalCharacter = newCharacter.copy(
            militaryPower = power,
            hordeSize = soldiers,
            title = GameEngine.calculateTitle(newCharacter),
            availableMarketItems = if (advancesYear) GameEngine.refreshMarketItems(newCharacter.marketCondition) else newCharacter.availableMarketItems
        )

        _characterState.value = finalCharacter
        _currentSeason.value = nextSeason
        _turnNumber.value = turn + 1
        _pendingEvent.value = potentialEvent

        val report = TurnReport(
            turnNumber = turn,
            year = 1200 + (newAge),
            season = season,
            grossIncome = grossIncome,
            grossExpenses = grossExpenses,
            netGoldChange = netGold,
            herdBirths = herdBirths,
            herdLosses = herdLosses,
            horseChange = horseChange,
            grainChange = grainChange,
            influenceChange = totalInfluenceGain,
            newWarriorsRecruited = 0,
            messages = messages,
            triggeredEvent = potentialEvent
        )
        _lastTurnReport.value = report
        return report
    }

    /**
     * Resolves a user's choice for an active event.
     */
    fun resolveChoice(choice: GameChoice): Character {
        val current = _characterState.value ?: throw IllegalStateException("No active character")
        var updated = current

        if (choice.effect != null) {
            val newStats = choice.effect.invoke(updated)
            updated = updated.copy(stats = newStats)
        }
        if (choice.customEffect != null) {
            updated = choice.customEffect.invoke(updated)
        }

        val newHistory = updated.history + HistoryEntry(updated.age, "📜 ${choice.storySnippet}")
        val (power, soldiers) = GameEngine.calculateMilitaryPower(updated)
        val resolved = updated.copy(
            history = newHistory,
            militaryPower = power,
            hordeSize = soldiers,
            title = GameEngine.calculateTitle(updated)
        )

        _characterState.value = resolved
        _pendingEvent.value = null
        return resolved
    }

    /**
     * Modifies resources directly (e.g. buying assets, recruiting warriors, tributes).
     */
    fun updateCharacter(updater: (Character) -> Character): Character {
        val current = _characterState.value ?: throw IllegalStateException("No active character")
        val modified = updater(current)
        val (power, soldiers) = GameEngine.calculateMilitaryPower(modified)
        val finalResult = modified.copy(
            militaryPower = power,
            hordeSize = soldiers,
            title = GameEngine.calculateTitle(modified)
        )
        _characterState.value = finalResult
        return finalResult
    }
}
