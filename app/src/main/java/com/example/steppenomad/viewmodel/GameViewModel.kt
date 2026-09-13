package com.example.steppenomad.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.steppenomad.audio.SoundEffectManager
import com.example.steppenomad.data.Constants
import com.example.steppenomad.data.GameDataStore
import com.example.steppenomad.data.SaveSlotSummary
import com.example.steppenomad.data.SavedGameState
import com.example.steppenomad.logic.CoreGameEngine
import com.example.steppenomad.logic.GameEngine
import com.example.steppenomad.logic.Season
import com.example.steppenomad.logic.TurnReport
import com.example.steppenomad.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.min

class GameViewModel(application: Application) : AndroidViewModel(application) {

    private val dataStore = GameDataStore(application)
    private val engine = CoreGameEngine()

    val savedGameState: StateFlow<SavedGameState?> = dataStore.savedGameState
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val activeSlotId: StateFlow<String> = dataStore.activeSlotIdFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, "slot_1")

    val saveSlots: StateFlow<List<SaveSlotSummary>> = dataStore.saveSlotsFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val character: StateFlow<Character?> = engine.characterState
    val currentSeason: StateFlow<Season> = engine.currentSeason
    val turnNumber: StateFlow<Int> = engine.turnNumber
    val lastTurnReport: StateFlow<TurnReport?> = engine.lastTurnReport

    private val _currentEvent = MutableStateFlow<GameEvent?>(null)
    val currentEvent: StateFlow<GameEvent?> = _currentEvent.asStateFlow()

    private val _currentTab = MutableStateFlow(0)
    val currentTab: StateFlow<Int> = _currentTab.asStateFlow()

    private val _gamePhase = MutableStateFlow("INTRO") // "INTRO" | "CREATION" | "PLAYING" | "GAME_OVER"
    val gamePhase: StateFlow<String> = _gamePhase.asStateFlow()

    private val _marriageCandidates = MutableStateFlow<List<Relationship>>(emptyList())
    val marriageCandidates: StateFlow<List<Relationship>> = _marriageCandidates.asStateFlow()

    private val _pleasureCandidates = MutableStateFlow<List<Relationship>>(emptyList())
    val pleasureCandidates: StateFlow<List<Relationship>> = _pleasureCandidates.asStateFlow()

    private val _friendCandidates = MutableStateFlow<List<Relationship>>(emptyList())
    val friendCandidates: StateFlow<List<Relationship>> = _friendCandidates.asStateFlow()

    private val _combatOutcome = MutableStateFlow<CombatOutcome?>(null)
    val combatOutcome: StateFlow<CombatOutcome?> = _combatOutcome.asStateFlow()

    private val _combatantEnemy = MutableStateFlow<Combatant?>(null)
    val combatantEnemy: StateFlow<Combatant?> = _combatantEnemy.asStateFlow()

    private val _combatDifficulty = MutableStateFlow(3)
    val combatDifficulty: StateFlow<Int> = _combatDifficulty.asStateFlow()

    private val _feedbackMessage = MutableStateFlow<String?>(null)
    val feedbackMessage: StateFlow<String?> = _feedbackMessage.asStateFlow()

    private val _isSoundEnabled = MutableStateFlow(SoundEffectManager.isSoundEnabled())
    val isSoundEnabled: StateFlow<Boolean> = _isSoundEnabled.asStateFlow()

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val _lastSaveTime = MutableStateFlow<Long?>(null)
    val lastSaveTime: StateFlow<Long?> = _lastSaveTime.asStateFlow()

    init {
        // Observe and optionally restore simulation state
        viewModelScope.launch {
            savedGameState.collect { saved ->
                if (saved != null && _character.value == null && _gamePhase.value == "INTRO") {
                    // Saved simulation state is available to resume
                }
            }
        }
    }

    private val _character = engine.characterState

    fun toggleSound() {
        SoundEffectManager.toggleMute()
        _isSoundEnabled.value = SoundEffectManager.isSoundEnabled()
    }

    fun saveGameManually(customTitle: String? = null) {
        persistState(showConfirmationToast = true, targetSlotId = activeSlotId.value, customTitle = customTitle)
    }

    fun saveToSpecificSlot(slotId: String, customTitle: String? = null) {
        persistState(showConfirmationToast = true, targetSlotId = slotId, customTitle = customTitle)
    }

    private fun persistState(
        showConfirmationToast: Boolean = false,
        targetSlotId: String = activeSlotId.value,
        customTitle: String? = null
    ) {
        val char = character.value ?: return
        val turn = turnNumber.value
        val season = currentSeason.value
        val phase = _gamePhase.value
        viewModelScope.launch {
            _isSaving.value = true
            try {
                dataStore.saveSimulationState(
                    slotId = targetSlotId,
                    turnCount = turn,
                    season = season,
                    gamePhase = phase,
                    character = char,
                    customTitle = customTitle
                )
                _lastSaveTime.value = System.currentTimeMillis()
                if (showConfirmationToast) {
                    _feedbackMessage.value = "💾 Game state saved to ${targetSlotId.uppercase()} (Turn $turn • ${season.displayName})!"
                }
            } catch (e: Exception) {
                if (showConfirmationToast) {
                    _feedbackMessage.value = "Failed to save game state: ${e.localizedMessage}"
                }
            } finally {
                _isSaving.value = false
            }
        }
    }

    fun resumeSavedSimulation(slotId: String? = null) {
        viewModelScope.launch {
            val targetSlot = slotId ?: activeSlotId.value
            val saved = dataStore.loadSlotState(targetSlot)
            if (saved != null) {
                dataStore.setActiveSlotId(targetSlot)
                val seasonEnum = try {
                    Season.valueOf(saved.season)
                } catch (e: Exception) {
                    Season.SPRING
                }
                engine.restoreState(
                    character = saved.character,
                    turnNumber = saved.turnCount,
                    season = seasonEnum
                )
                _gamePhase.value = if (saved.character.isAlive) "PLAYING" else "GAME_OVER"
                _currentTab.value = 0
                refreshCandidates(saved.character)
                SoundEffectManager.playTurnEnd()
                _feedbackMessage.value = "Loaded ${saved.character.name}'s dynasty from ${targetSlot.uppercase()}!"
            } else {
                _feedbackMessage.value = "No saved data found in ${targetSlot.uppercase()}."
            }
        }
    }

    fun deleteSlot(slotId: String) {
        viewModelScope.launch {
            dataStore.deleteSlot(slotId)
            _feedbackMessage.value = "Deleted save in ${slotId.uppercase()}."
        }
    }

    fun switchActiveSlot(slotId: String) {
        viewModelScope.launch {
            dataStore.setActiveSlotId(slotId)
        }
    }

    fun startCreation(targetSlotId: String? = null) {
        if (targetSlotId != null) {
            viewModelScope.launch {
                dataStore.setActiveSlotId(targetSlotId)
            }
        }
        _gamePhase.value = "CREATION"
    }

    fun setTab(index: Int) {
        _currentTab.value = index
    }

    fun clearFeedback() {
        _feedbackMessage.value = null
    }

    fun createCharacter(
        name: String,
        gender: Gender,
        tribe: String,
        clan: String,
        socialClass: SocialClass,
        appearance: AppearanceOptions,
        traits: List<String>
    ) {
        val newChar = GameEngine.generateCharacter(
            name = name,
            gender = gender,
            tribe = tribe,
            clan = clan,
            socialClass = socialClass,
            appearanceOptions = appearance,
            traits = traits
        )
        engine.initialize(newChar)
        _gamePhase.value = "PLAYING"
        _currentTab.value = 0
        refreshCandidates(newChar)
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    private fun refreshCandidates(char: Character) {
        _marriageCandidates.value = GameEngine.generateMarriageCandidates(3)
        _pleasureCandidates.value = GameEngine.generatePleasureTentCandidates(3)
        _friendCandidates.value = GameEngine.generateFriendCandidates(3, char.age)
    }

    fun ageUp() {
        val char = character.value ?: return
        if (!char.isAlive) {
            _gamePhase.value = "GAME_OVER"
            persistState()
            return
        }

        val report = engine.advanceTurn()
        val aged = character.value ?: return
        refreshCandidates(aged)

        SoundEffectManager.playTurnEnd()

        if (!aged.isAlive) {
            _gamePhase.value = "GAME_OVER"
            persistState()
            return
        }

        if (report.triggeredEvent != null) {
            _currentEvent.value = report.triggeredEvent
        }
        persistState()
    }

    fun resolveEventChoice(choice: GameChoice) {
        engine.resolveChoice(choice)
        _currentEvent.value = null
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun buyMarketItem(item: AvailableMarketItem) {
        val char = character.value ?: return
        if (char.stats.wealth < item.price) {
            _feedbackMessage.value = "Not enough gold! Requires ${item.price}г."
            return
        }

        val newWealth = char.stats.wealth - item.price
        val newAsset = Asset(
            id = GameEngine.generateId(),
            name = item.name,
            type = item.type,
            value = item.basePrice,
            quality = item.quality,
            stats = AssetStats(
                attackBonus = if (item.type == "Weapon") (item.quality / 10) else 0,
                defenseBonus = if (item.type == "Armor") (item.quality / 10) else 0,
                speed = if (item.type == "Horse") item.quality else 0,
                loyalty = 80
            )
        )

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = newWealth),
                assets = current.assets + newAsset,
                availableMarketItems = current.availableMarketItems.filter { it.id != item.id },
                history = current.history + HistoryEntry(current.age, "Purchased ${item.name} for ${item.price}г.")
            )
        }
        _feedbackMessage.value = "Successfully purchased ${item.name}!"
        persistState()
        if (item.type == "Horse") {
            SoundEffectManager.playHorseSound()
        } else {
            SoundEffectManager.playCoinClink()
        }
    }

    fun sellAsset(asset: Asset) {
        val char = character.value ?: return
        val mult = Constants.MARKET_MULTIPLIERS[char.marketCondition]?.sell ?: 1.0
        val sellPrice = max(5, (asset.value * 0.7 * mult).toInt())

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth + sellPrice),
                assets = current.assets.filter { it.id != asset.id },
                history = current.history + HistoryEntry(current.age, "Sold ${asset.name} for ${sellPrice}г.")
            )
        }
        _feedbackMessage.value = "Sold ${asset.name} for ${sellPrice}г."
        persistState()
        SoundEffectManager.playCoinClink()
    }

    fun buyLivestock(type: String, count: Int = 1) {
        val char = character.value ?: return
        val pair = Constants.LIVESTOCK_PRICES[type] ?: return
        val mult = Constants.MARKET_MULTIPLIERS[char.marketCondition]?.livestock ?: 1.0
        val totalCost = (pair.buy * mult * count).toInt()

        if (char.stats.wealth < totalCost) {
            _feedbackMessage.value = "Not enough gold! Cost: ${totalCost}г."
            return
        }

        engine.updateCharacter { current ->
            val curLive = current.livestock
            val newLive = when (type) {
                "horses" -> curLive.copy(horses = curLive.horses + count)
                "sheep" -> curLive.copy(sheep = curLive.sheep + count)
                "cattle" -> curLive.copy(cattle = curLive.cattle + count)
                "goats" -> curLive.copy(goats = curLive.goats + count)
                "yaks" -> curLive.copy(yaks = curLive.yaks + count)
                "camels" -> curLive.copy(camels = curLive.camels + count)
                else -> curLive
            }
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - totalCost),
                livestock = newLive,
                history = current.history + HistoryEntry(current.age, "Bought $count $type for ${totalCost}г.")
            )
        }
        _feedbackMessage.value = "Purchased $count $type!"
        persistState()
        if (type == "horses") {
            SoundEffectManager.playHorseSound()
        } else {
            SoundEffectManager.playCoinClink()
        }
    }

    fun sellLivestock(type: String, count: Int = 1) {
        val char = character.value ?: return
        val pair = Constants.LIVESTOCK_PRICES[type] ?: return
        val mult = Constants.MARKET_MULTIPLIERS[char.marketCondition]?.livestock ?: 1.0
        val totalGold = (pair.sell * mult * count).toInt()

        val curLive = char.livestock
        val currentCount = when (type) {
            "horses" -> curLive.horses
            "sheep" -> curLive.sheep
            "cattle" -> curLive.cattle
            "goats" -> curLive.goats
            "yaks" -> curLive.yaks
            "camels" -> curLive.camels
            else -> 0
        }

        if (currentCount < count) {
            _feedbackMessage.value = "You do not own enough $type."
            return
        }

        engine.updateCharacter { current ->
            val cl = current.livestock
            val newLive = when (type) {
                "horses" -> cl.copy(horses = cl.horses - count)
                "sheep" -> cl.copy(sheep = cl.sheep - count)
                "cattle" -> cl.copy(cattle = cl.cattle - count)
                "goats" -> cl.copy(goats = cl.goats - count)
                "yaks" -> cl.copy(yaks = cl.yaks - count)
                "camels" -> cl.copy(camels = cl.camels - count)
                else -> cl
            }
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth + totalGold),
                livestock = newLive,
                history = current.history + HistoryEntry(current.age, "Sold $count $type for ${totalGold}г.")
            )
        }
        _feedbackMessage.value = "Sold $count $type for ${totalGold}г."
        persistState()
        SoundEffectManager.playCoinClink()
    }

    fun upgradePasture() {
        val char = character.value ?: return
        val cost = 200 + (char.pastureUpgrades * 150)
        if (char.stats.wealth < cost) {
            _feedbackMessage.value = "Expanding grazing lands requires ${cost}г."
            return
        }

        engine.updateCharacter { current ->
            val newCapacity = current.pastureCapacity + 200
            val newUpgrades = current.pastureUpgrades + 1
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - cost),
                pastureCapacity = newCapacity,
                pastureUpgrades = newUpgrades,
                history = current.history + HistoryEntry(current.age, "Expanded seasonal grazing capacity to $newCapacity animals.")
            )
        }
        _feedbackMessage.value = "Pasture expanded!"
        persistState()
        SoundEffectManager.playHarvestSound()
    }

    fun performCareerAction(branch: CareerBranch) {
        val char = character.value ?: return
        val action = branch.action
        if (char.stats.wealth < action.cost) {
            _feedbackMessage.value = "Requires ${action.cost}г to organize this action."
            return
        }

        engine.updateCharacter { current ->
            var newStats = current.stats.copy(wealth = current.stats.wealth - action.cost)
            action.statGains.forEach { (stat, gain) ->
                newStats = when (stat) {
                    "strength" -> newStats.copy(strength = min(100, newStats.strength + gain))
                    "intelligence" -> newStats.copy(intelligence = min(100, newStats.intelligence + gain))
                    "perception" -> newStats.copy(perception = min(100, newStats.perception + gain))
                    "leadership" -> newStats.copy(leadership = min(100, newStats.leadership + gain))
                    "loyalty" -> newStats.copy(loyalty = min(100, newStats.loyalty + gain))
                    "reputation" -> newStats.copy(reputation = min(100, newStats.reputation + gain))
                    "horseRiding" -> newStats.copy(horseRiding = min(100, newStats.horseRiding + gain))
                    "archery" -> newStats.copy(archery = min(100, newStats.archery + gain))
                    else -> newStats
                }
            }
            current.copy(
                stats = newStats,
                history = current.history + HistoryEntry(current.age, "🎯 ${action.successMsg}")
            )
        }
        _feedbackMessage.value = action.successMsg
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun promoteRole(newRoleName: String) {
        engine.updateCharacter { current ->
            current.copy(
                role = newRoleName,
                stats = current.stats.copy(reputation = current.stats.reputation + 10),
                history = current.history + HistoryEntry(current.age, "🎖️ Assumed the esteemed rank of $newRoleName!")
            )
        }
        _feedbackMessage.value = "Promoted to $newRoleName!"
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun recruitHordeSoldiers(count: Int = 50) {
        val char = character.value ?: return
        val cost = count * 5
        if (char.stats.wealth < cost) {
            _feedbackMessage.value = "Recruiting $count warriors requires ${cost}г."
            return
        }

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - cost),
                customRecruitedSoldiers = current.customRecruitedSoldiers + count,
                history = current.history + HistoryEntry(current.age, "Enlisted $count steppe riders into your personal banner.")
            )
        }
        _feedbackMessage.value = "Recruited $count riders!"
        persistState()
        SoundEffectManager.playWarDrum()
    }

    fun buildWorkshop(type: String, name: String, cost: Int = 200, income: Int = 50) {
        val char = character.value ?: return
        if (char.stats.wealth < cost) {
            _feedbackMessage.value = "Requires ${cost}г to establish $name."
            return
        }

        val newWorkshop = Workshop(
            id = GameEngine.generateId(),
            name = name,
            type = type,
            level = 1,
            passiveIncome = income,
            costToUpgrade = (cost * 1.5).toInt(),
            description = "Produces steady passive trade goods and income."
        )

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - cost),
                workshops = current.workshops + newWorkshop,
                history = current.history + HistoryEntry(current.age, "Established workshop: $name.")
            )
        }
        _feedbackMessage.value = "Established $name!"
        persistState()
        SoundEffectManager.playCoinClink()
    }

    fun upgradeWorkshop(workshop: Workshop) {
        val char = character.value ?: return
        if (char.stats.wealth < workshop.costToUpgrade) {
            _feedbackMessage.value = "Requires ${workshop.costToUpgrade}г to upgrade."
            return
        }

        engine.updateCharacter { current ->
            val updatedWorkshops = current.workshops.map { w ->
                if (w.id == workshop.id) {
                    w.copy(
                        level = w.level + 1,
                        passiveIncome = w.passiveIncome + 35,
                        costToUpgrade = (w.costToUpgrade * 1.6).toInt()
                    )
                } else w
            }
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - workshop.costToUpgrade),
                workshops = updatedWorkshops,
                history = current.history + HistoryEntry(current.age, "Upgraded ${workshop.name} to Level ${workshop.level + 1}.")
            )
        }
        _feedbackMessage.value = "Upgraded ${workshop.name}!"
        persistState()
        SoundEffectManager.playCoinClink()
    }

    fun dispatchCaravan(destination: String, investment: Int, guards: Int, duration: Int) {
        val char = character.value ?: return
        val totalCost = investment + (guards * 15)
        if (char.stats.wealth < totalCost) {
            _feedbackMessage.value = "Requires ${totalCost}г for expedition cargo and guards."
            return
        }

        val returnMin = (investment * 1.5).toInt()
        val returnMax = (investment * 2.8).toInt()

        val newCaravan = CaravanVoyage(
            id = GameEngine.generateId(),
            destination = destination,
            investment = investment,
            guards = guards,
            cargo = "Steppe pelts, horse saddles, and silver ingots",
            durationYears = duration,
            progressYears = 0,
            expectedReturnMin = returnMin,
            expectedReturnMax = returnMax,
            status = "Traveling"
        )

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - totalCost),
                caravans = current.caravans + newCaravan,
                history = current.history + HistoryEntry(current.age, "Dispatched a Silk Road trade caravan to $destination (Investment: ${investment}г).")
            )
        }
        _feedbackMessage.value = "Caravan dispatched to $destination!"
        persistState()
        SoundEffectManager.playHorseSound()
    }

    fun marryCandidate(candidate: Relationship) {
        val char = character.value ?: return
        val bridePrice = 100
        if (char.stats.wealth < bridePrice) {
            _feedbackMessage.value = "Marrying requires paying a traditional bride price of ${bridePrice}г."
            return
        }

        val spouseRel = candidate.copy(
            id = GameEngine.generateId(),
            type = "Spouse",
            loyalty = 90,
            status = "Active"
        )

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - bridePrice, happiness = min(100, current.stats.happiness + 20)),
                relationships = current.relationships + spouseRel,
                history = current.history + HistoryEntry(current.age, "💍 Wed ${candidate.name} in a grand ceremony across the steppe.")
            )
        }
        _marriageCandidates.value = _marriageCandidates.value.filter { it.id != candidate.id }
        _feedbackMessage.value = "Congratulations! Wed to ${candidate.name}."
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun befriendCandidate(candidate: Relationship) {
        val friendRel = candidate.copy(
            id = GameEngine.generateId(),
            type = "Friend",
            loyalty = 80,
            status = "Active"
        )
        engine.updateCharacter { current ->
            current.copy(
                relationships = current.relationships + friendRel,
                history = current.history + HistoryEntry(current.age, "Swore an oath of friendship with ${candidate.name}.")
            )
        }
        _friendCandidates.value = _friendCandidates.value.filter { it.id != candidate.id }
        _feedbackMessage.value = "Became close friends with ${candidate.name}!"
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun visitPleasureTent(candidate: Relationship) {
        val char = character.value ?: return
        val cost = 50
        if (char.stats.wealth < cost) {
            _feedbackMessage.value = "Visiting the pleasure tent requires ${cost}г."
            return
        }

        engine.updateCharacter { current ->
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - cost, happiness = min(100, current.stats.happiness + 25)),
                history = current.history + HistoryEntry(current.age, "Spent an enchanting evening in the pleasure pavilion with ${candidate.name}.")
            )
        }
        _feedbackMessage.value = "Spent a restful, lavish evening with ${candidate.name}."
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun giftRelationship(rel: Relationship) {
        val char = character.value ?: return
        val cost = 40
        if (char.stats.wealth < cost) {
            _feedbackMessage.value = "Requires ${cost}г for gifts."
            return
        }

        engine.updateCharacter { current ->
            val updatedRels = current.relationships.map {
                if (it.id == rel.id) it.copy(loyalty = min(100, it.loyalty + 15)) else it
            }
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - cost),
                relationships = updatedRels,
                history = current.history + HistoryEntry(current.age, "Gave fine gifts of silk and silver to ${rel.name}.")
            )
        }
        _feedbackMessage.value = "Gifted ${rel.name} (Loyalty +15)!"
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun sendDiplomaticGift(relation: TribeRelation) {
        val char = character.value ?: return
        val cost = 150
        if (char.stats.wealth < cost) {
            _feedbackMessage.value = "Requires ${cost}г for a diplomatic gift caravan."
            return
        }

        val newStanding = min(100, relation.standing + 25)
        val newLevel = if (newStanding >= 50) "Allied" else if (newStanding >= 20) "Friendly" else if (newStanding >= -20) "Neutral" else "Hostile"

        engine.updateCharacter { current ->
            val updatedTribeRels = current.tribeRelations.map {
                if (it.name == relation.name) it.copy(standing = newStanding, level = newLevel) else it
            }
            val updatedKingdomRels = current.kingdomRelations.map {
                if (it.name == relation.name) it.copy(standing = newStanding, level = newLevel) else it
            }
            current.copy(
                stats = current.stats.copy(wealth = current.stats.wealth - cost),
                tribeRelations = updatedTribeRels,
                kingdomRelations = updatedKingdomRels,
                history = current.history + HistoryEntry(current.age, "Sent diplomatic embassy and gifts to ${relation.name}.")
            )
        }
        _feedbackMessage.value = "Relations with ${relation.name} improved to $newLevel!"
        persistState()
        SoundEffectManager.playInfluenceSound()
    }

    fun declareWar(relation: TribeRelation) {
        engine.updateCharacter { current ->
            val updatedTribeRels = current.tribeRelations.map {
                if (it.name == relation.name) it.copy(standing = -100, level = "At War") else it
            }
            val updatedKingdomRels = current.kingdomRelations.map {
                if (it.name == relation.name) it.copy(standing = -100, level = "At War") else it
            }
            current.copy(
                tribeRelations = updatedTribeRels,
                kingdomRelations = updatedKingdomRels,
                history = current.history + HistoryEntry(current.age, "⚔️ Declared open war on ${relation.name}!")
            )
        }
        _feedbackMessage.value = "You are now at war with ${relation.name}!"
        persistState()
        SoundEffectManager.playWarDrum()
    }

    fun conquerTribe(relation: TribeRelation) {
        val char = character.value ?: return
        if (char.militaryPower < relation.militaryPower) {
            _feedbackMessage.value = "Your military power (${char.militaryPower}) is weaker than ${relation.name} (${relation.militaryPower})!"
            return
        }

        val isKingdom = Constants.KINGDOMS.contains(relation.name)
        val lootGold = relation.militaryPower / 2

        engine.updateCharacter { current ->
            val newConqueredTribes = if (!isKingdom && !current.conqueredTribes.contains(relation.name)) current.conqueredTribes + relation.name else current.conqueredTribes
            val newConqueredKingdoms = if (isKingdom && !current.conqueredKingdoms.contains(relation.name)) current.conqueredKingdoms + relation.name else current.conqueredKingdoms
            val isGreatKhanNow = (newConqueredTribes.size >= 6)

            val updatedTribeRels = current.tribeRelations.map {
                if (it.name == relation.name) it.copy(standing = 80, level = "Vassal") else it
            }
            val updatedKingdomRels = current.kingdomRelations.map {
                if (it.name == relation.name) it.copy(standing = 80, level = "Vassal") else it
            }

            current.copy(
                stats = current.stats.copy(
                    wealth = current.stats.wealth + lootGold,
                    reputation = current.stats.reputation + 25,
                    realmReputation = current.stats.realmReputation + 15
                ),
                conqueredTribes = newConqueredTribes,
                conqueredKingdoms = newConqueredKingdoms,
                isGreatKhan = isGreatKhanNow,
                tribeRelations = updatedTribeRels,
                kingdomRelations = updatedKingdomRels,
                history = current.history + HistoryEntry(current.age, "👑 Subjugated ${relation.name}! Claimed ${lootGold}г in war spoils.")
            )
        }
        _feedbackMessage.value = "Glorious Victory! ${relation.name} has submitted as your vassal."
        persistState()
        SoundEffectManager.playWarDrum()
    }

    fun negotiateTreaty(
        relation: TribeRelation,
        treatyType: TreatyType,
        sweetenGold: Int = 0,
        sweetenHorses: Int = 0,
        sweetenGrain: Int = 0,
        envoyStrategy: String = "Balanced"
    ): Boolean {
        val char = character.value ?: return false
        val totalGoldCost = treatyType.goldCost + sweetenGold
        val totalInfluenceCost = treatyType.influenceCost
        val totalHorseCost = treatyType.horseCost + sweetenHorses
        val totalGrainCost = treatyType.grainCost + sweetenGrain

        // Cost Checks
        if (char.stats.wealth < totalGoldCost) {
            _feedbackMessage.value = "Insufficient gold! Treaty requires ${totalGoldCost}г."
            return false
        }
        if (char.influence < totalInfluenceCost) {
            _feedbackMessage.value = "Insufficient Influence! Treaty requires ${totalInfluenceCost} Influence."
            return false
        }
        if (char.livestock.horses < totalHorseCost) {
            _feedbackMessage.value = "Insufficient horses! Treaty requires ${totalHorseCost} horses from your herds."
            return false
        }
        if (char.grain < totalGrainCost) {
            _feedbackMessage.value = "Insufficient grain stores! Treaty requires ${totalGrainCost} sacks of provisions."
            return false
        }
        if (char.militaryPower < treatyType.requiredMilitaryPower) {
            _feedbackMessage.value = "Your military power (${char.militaryPower}) is too low! Requires at least ${treatyType.requiredMilitaryPower} power."
            return false
        }

        // Standing & Strategy calculation
        val strategyBonus = when (envoyStrategy) {
            "Gifts & Luxury" -> (char.stats.intelligence / 10) + (sweetenGold / 15)
            "Military Deterrence" -> (char.stats.leadership / 10) + (char.militaryPower / 500)
            "Steppe Blood Kinship" -> (char.stats.reputation / 10) + (char.stats.loyalty / 15)
            else -> (char.stats.perception / 10)
        }

        val sweetenBonus = (sweetenGold / 10) + (sweetenHorses * 6) + (sweetenGrain / 5)
        val effectiveStanding = relation.standing + sweetenBonus + strategyBonus

        if (effectiveStanding < treatyType.requiredStanding) {
            val needed = treatyType.requiredStanding - effectiveStanding
            _feedbackMessage.value = "${relation.name} rejected the proposal! Standing too low (needs +$needed more via gifts or higher reputation)."
            return false
        }

        // Treaty Accepted!
        val newStanding = min(100, max(-100, relation.standing + treatyType.targetStandingBonus + (sweetenBonus / 2)))
        val newLevel = treatyType.resultLevel

        val isAnda = (treatyType == TreatyType.BLOOD_ALLIANCE)
        val bonusSoldiers = if (isAnda) 100 else 0
        val bonusRep = if (isAnda) 10 else 3

        val updatedLivestock = char.livestock.copy(
            horses = max(0, char.livestock.horses - totalHorseCost)
        )

        engine.updateCharacter { current ->
            val updatedTribeRels = current.tribeRelations.map {
                if (it.name == relation.name) {
                    it.copy(
                        standing = newStanding,
                        level = newLevel,
                        activeTreaty = treatyType.code,
                        influencePerSeason = treatyType.influenceGainPerSeason,
                        goldPerSeason = treatyType.goldGainPerSeason,
                        isTrading = (treatyType == TreatyType.TRADE_AGREEMENT || it.isTrading)
                    )
                } else it
            }
            val updatedKingdomRels = current.kingdomRelations.map {
                if (it.name == relation.name) {
                    it.copy(
                        standing = newStanding,
                        level = newLevel,
                        activeTreaty = treatyType.code,
                        influencePerSeason = treatyType.influenceGainPerSeason + 2,
                        goldPerSeason = treatyType.goldGainPerSeason + 30,
                        isTrading = (treatyType == TreatyType.TRADE_AGREEMENT || it.isTrading)
                    )
                } else it
            }

            val histEntry = HistoryEntry(
                current.age,
                "📜 Sealed ${treatyType.displayName} with ${relation.name} (${relation.leaderName}). Influencing seasonal growth by +${treatyType.influenceGainPerSeason} Influence."
            )

            current.copy(
                stats = current.stats.copy(
                    wealth = max(0, current.stats.wealth - totalGoldCost),
                    reputation = current.stats.reputation + bonusRep,
                    realmReputation = current.stats.realmReputation + (bonusRep / 2)
                ),
                influence = max(0, current.influence - totalInfluenceCost),
                grain = max(0, current.grain - totalGrainCost),
                livestock = updatedLivestock,
                customRecruitedSoldiers = current.customRecruitedSoldiers + bonusSoldiers,
                tribeRelations = updatedTribeRels,
                kingdomRelations = updatedKingdomRels,
                history = current.history + histEntry
            )
        }

        _feedbackMessage.value = "🤝 Successfully sealed ${treatyType.displayName} with ${relation.name}! (+${treatyType.influenceGainPerSeason} Influence/season)"
        persistState()
        SoundEffectManager.playInfluenceSound()
        return true
    }

    fun renounceTreaty(relation: TribeRelation) {
        val treatyName = relation.treatyType.displayName
        engine.updateCharacter { current ->
            val updatedTribeRels = current.tribeRelations.map {
                if (it.name == relation.name) {
                    it.copy(
                        activeTreaty = "NONE",
                        influencePerSeason = 0,
                        goldPerSeason = 0,
                        standing = max(-100, it.standing - 25),
                        level = if (it.standing - 25 < -20) "Hostile" else "Neutral"
                    )
                } else it
            }
            val updatedKingdomRels = current.kingdomRelations.map {
                if (it.name == relation.name) {
                    it.copy(
                        activeTreaty = "NONE",
                        influencePerSeason = 0,
                        goldPerSeason = 0,
                        standing = max(-100, it.standing - 25),
                        level = if (it.standing - 25 < -20) "Hostile" else "Neutral"
                    )
                } else it
            }

            current.copy(
                tribeRelations = updatedTribeRels,
                kingdomRelations = updatedKingdomRels,
                history = current.history + HistoryEntry(current.age, "⚠️ Renounced $treatyName with ${relation.name}.")
            )
        }
        _feedbackMessage.value = "Renounced diplomatic treaty with ${relation.name}. Standing dropped by 25."
        persistState()
        SoundEffectManager.playWarDrum()
    }

    fun setCombatDifficulty(diff: Int) {
        _combatDifficulty.value = diff
        _combatantEnemy.value = GameEngine.generateEnemy(diff)
        _combatOutcome.value = null
    }

    fun startCombatSimulation() {
        val char = character.value ?: return
        val diff = _combatDifficulty.value
        val enemy = _combatantEnemy.value ?: GameEngine.generateEnemy(diff)

        val playerWeapon = char.assets.find { it.type == "Weapon" }?.let {
            Equipment(id = it.id, name = it.name, type = "Weapon", attackBonus = it.stats?.attackBonus ?: 10)
        }
        val playerArmor = char.assets.find { it.type == "Armor" }?.let {
            Equipment(id = it.id, name = it.name, type = "Armor", defenseBonus = it.stats?.defenseBonus ?: 10)
        }
        val playerMount = char.assets.find { it.type == "Horse" }?.let {
            Equipment(id = it.id, name = it.name, type = "Mount", attackBonus = 5, defenseBonus = 5)
        }

        val player = Combatant(
            name = char.name,
            stats = CombatantStats(
                strength = char.stats.strength,
                skill = (char.stats.archery + char.stats.horseRiding) / 2,
                endurance = char.stats.health
            ),
            weapon = playerWeapon,
            armor = playerArmor,
            mount = playerMount
        )

        val outcome = GameEngine.simulateBattle(player, enemy)
        _combatOutcome.value = outcome

        if (outcome.winner == player.name) {
            val rewardGold = diff * 40
            engine.updateCharacter { current ->
                current.copy(
                    stats = current.stats.copy(
                        wealth = current.stats.wealth + rewardGold,
                        reputation = current.stats.reputation + 5,
                        strength = min(100, current.stats.strength + 2)
                    ),
                    history = current.history + HistoryEntry(current.age, "⚔️ Defeated ${enemy.name} in single combat (Earned ${rewardGold}г).")
                )
            }
            _feedbackMessage.value = "Victory in single combat against ${enemy.name}!"
            SoundEffectManager.playCoinClink()
        } else {
            engine.updateCharacter { current ->
                current.copy(
                    stats = current.stats.copy(health = max(10, current.stats.health - 15)),
                    history = current.history + HistoryEntry(current.age, "⚔️ Sustained battle wounds in a duel with ${enemy.name}.")
                )
            }
            _feedbackMessage.value = "Defeated in duel! Suffered injuries."
            SoundEffectManager.playWarDrum()
        }
        persistState()
    }

    fun restartGame() {
        viewModelScope.launch {
            dataStore.deleteSlot(activeSlotId.value)
        }
        _currentEvent.value = null
        _currentTab.value = 0
        _gamePhase.value = "INTRO"
        _combatOutcome.value = null
    }
}
