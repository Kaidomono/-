package com.example.steppenomad.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.example.steppenomad.logic.Season
import com.example.steppenomad.model.Character
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.IOException

val Context.gameDataStore: DataStore<Preferences> by preferencesDataStore(name = "steppe_nomad_preferences")

@Serializable
data class SaveSlotSummary(
    val slotId: String,
    val slotNumber: Int,
    val hasData: Boolean,
    val slotTitle: String,
    val characterName: String,
    val clanAndTribe: String,
    val age: Int,
    val turnCount: Int,
    val season: String,
    val gamePhase: String,
    val wealth: Int,
    val hordeSize: Int,
    val savedTimestamp: Long,
    val isAlive: Boolean
)

@Serializable
data class SavedGameState(
    val slotId: String = "slot_1",
    val turnCount: Int,
    val season: String,
    val gamePhase: String,
    val character: Character,
    val savedTimestamp: Long = System.currentTimeMillis()
)

class GameDataStore(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        isLenient = true
    }

    companion object {
        val TOTAL_SLOTS = 5
        val DEFAULT_SLOT_ID = "slot_1"

        val KEY_ACTIVE_SLOT_ID = stringPreferencesKey("active_slot_id")

        // Legacy Keys for backwards compatibility
        val KEY_LEGACY_TURN_COUNT = intPreferencesKey("turn_count")
        val KEY_LEGACY_SEASON = stringPreferencesKey("season")
        val KEY_LEGACY_GAME_PHASE = stringPreferencesKey("game_phase")
        val KEY_LEGACY_CHARACTER_JSON = stringPreferencesKey("character_json")
        val KEY_LEGACY_HAS_ACTIVE_SAVE = booleanPreferencesKey("has_active_save")

        // Slot-specific key generators
        fun keyHasSave(slotId: String) = booleanPreferencesKey("slot_${slotId}_has_save")
        fun keyCharJson(slotId: String) = stringPreferencesKey("slot_${slotId}_character_json")
        fun keyTurnCount(slotId: String) = intPreferencesKey("slot_${slotId}_turn_count")
        fun keySeason(slotId: String) = stringPreferencesKey("slot_${slotId}_season")
        fun keyGamePhase(slotId: String) = stringPreferencesKey("slot_${slotId}_game_phase")
        fun keySavedTimestamp(slotId: String) = longPreferencesKey("slot_${slotId}_saved_timestamp")
        fun keySlotTitle(slotId: String) = stringPreferencesKey("slot_${slotId}_custom_title")
    }

    /**
     * Flow of active slot ID (e.g. "slot_1", "slot_2", ...)
     */
    val activeSlotIdFlow: Flow<String> = context.gameDataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs ->
            prefs[KEY_ACTIVE_SLOT_ID] ?: DEFAULT_SLOT_ID
        }

    /**
     * Flow of all available save slots with metadata
     */
    val saveSlotsFlow: Flow<List<SaveSlotSummary>> = context.gameDataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs ->
            (1..TOTAL_SLOTS).map { index ->
                val slotId = "slot_$index"
                readSlotSummary(prefs, slotId, index)
            }
        }

    /**
     * Reads summary for a specific slot, incorporating backwards compatibility for slot_1
     */
    private fun readSlotSummary(prefs: Preferences, slotId: String, slotNumber: Int): SaveSlotSummary {
        val hasSlotSave = prefs[keyHasSave(slotId)] ?: false
        var charJson = prefs[keyCharJson(slotId)]
        var turn = prefs[keyTurnCount(slotId)] ?: 1
        var seasonStr = prefs[keySeason(slotId)] ?: Season.SPRING.name
        var phase = prefs[keyGamePhase(slotId)] ?: "PLAYING"
        var timestamp = prefs[keySavedTimestamp(slotId)] ?: 0L
        val customTitle = prefs[keySlotTitle(slotId)]

        // Legacy fallback for slot_1
        if (!hasSlotSave && slotId == DEFAULT_SLOT_ID) {
            val legacyHasSave = prefs[KEY_LEGACY_HAS_ACTIVE_SAVE] ?: false
            if (legacyHasSave) {
                charJson = prefs[KEY_LEGACY_CHARACTER_JSON]
                turn = prefs[KEY_LEGACY_TURN_COUNT] ?: 1
                seasonStr = prefs[KEY_LEGACY_SEASON] ?: Season.SPRING.name
                phase = prefs[KEY_LEGACY_GAME_PHASE] ?: "PLAYING"
                timestamp = System.currentTimeMillis()
            }
        }

        if ((hasSlotSave || (slotId == DEFAULT_SLOT_ID && charJson != null)) && !charJson.isNullOrBlank()) {
            try {
                val char = json.decodeFromString<Character>(charJson)
                val defaultTitle = "${char.name} (${char.clan} / ${char.tribe})"
                return SaveSlotSummary(
                    slotId = slotId,
                    slotNumber = slotNumber,
                    hasData = true,
                    slotTitle = customTitle ?: defaultTitle,
                    characterName = char.name,
                    clanAndTribe = "${char.clan} • ${char.tribe}",
                    age = char.age,
                    turnCount = turn,
                    season = seasonStr,
                    gamePhase = phase,
                    wealth = char.stats.wealth,
                    hordeSize = char.hordeSize,
                    savedTimestamp = timestamp,
                    isAlive = char.isAlive
                )
            } catch (e: Exception) {
                // Ignore parse errors and treat as empty
            }
        }

        return SaveSlotSummary(
            slotId = slotId,
            slotNumber = slotNumber,
            hasData = false,
            slotTitle = "Empty Slot $slotNumber",
            characterName = "No Character",
            clanAndTribe = "None",
            age = 0,
            turnCount = 0,
            season = "SPRING",
            gamePhase = "NONE",
            wealth = 0,
            hordeSize = 0,
            savedTimestamp = 0L,
            isAlive = false
        )
    }

    /**
     * Flow of the current active slot's saved game state
     */
    val savedGameState: Flow<SavedGameState?> = context.gameDataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs ->
            val activeId = prefs[KEY_ACTIVE_SLOT_ID] ?: DEFAULT_SLOT_ID
            extractGameStateFromPrefs(prefs, activeId)
        }

    private fun extractGameStateFromPrefs(prefs: Preferences, slotId: String): SavedGameState? {
        val hasSave = prefs[keyHasSave(slotId)] ?: false
        var charJson = prefs[keyCharJson(slotId)]
        var turn = prefs[keyTurnCount(slotId)] ?: 1
        var seasonStr = prefs[keySeason(slotId)] ?: Season.SPRING.name
        var phase = prefs[keyGamePhase(slotId)] ?: "PLAYING"
        var timestamp = prefs[keySavedTimestamp(slotId)] ?: System.currentTimeMillis()

        // Backwards compatibility check
        if (!hasSave && slotId == DEFAULT_SLOT_ID) {
            val legacyHasSave = prefs[KEY_LEGACY_HAS_ACTIVE_SAVE] ?: false
            if (legacyHasSave) {
                charJson = prefs[KEY_LEGACY_CHARACTER_JSON]
                turn = prefs[KEY_LEGACY_TURN_COUNT] ?: 1
                seasonStr = prefs[KEY_LEGACY_SEASON] ?: Season.SPRING.name
                phase = prefs[KEY_LEGACY_GAME_PHASE] ?: "PLAYING"
            }
        }

        if (!charJson.isNullOrBlank()) {
            try {
                val char = json.decodeFromString<Character>(charJson)
                return SavedGameState(
                    slotId = slotId,
                    turnCount = turn,
                    season = seasonStr,
                    gamePhase = phase,
                    character = char,
                    savedTimestamp = timestamp
                )
            } catch (e: Exception) {
                return null
            }
        }
        return null
    }

    /**
     * Loads a specific slot's saved state synchronously within a coroutine
     */
    suspend fun loadSlotState(slotId: String): SavedGameState? {
        val prefs = context.gameDataStore.data.first()
        return extractGameStateFromPrefs(prefs, slotId)
    }

    /**
     * Switch the active slot ID
     */
    suspend fun setActiveSlotId(slotId: String) {
        context.gameDataStore.edit { prefs ->
            prefs[KEY_ACTIVE_SLOT_ID] = slotId
        }
    }

    /**
     * Save simulation state into a specified slot (or active slot if not specified)
     */
    suspend fun saveSimulationState(
        slotId: String,
        turnCount: Int,
        season: Season,
        gamePhase: String,
        character: Character,
        customTitle: String? = null
    ) {
        try {
            val charJson = json.encodeToString(character)
            val timestamp = System.currentTimeMillis()
            val title = customTitle ?: "${character.name} (${character.clan} / ${character.tribe})"

            context.gameDataStore.edit { prefs ->
                // Update Slot specific keys
                prefs[keyHasSave(slotId)] = true
                prefs[keyCharJson(slotId)] = charJson
                prefs[keyTurnCount(slotId)] = turnCount
                prefs[keySeason(slotId)] = season.name
                prefs[keyGamePhase(slotId)] = gamePhase
                prefs[keySavedTimestamp(slotId)] = timestamp
                prefs[keySlotTitle(slotId)] = title

                // Keep active slot updated
                prefs[KEY_ACTIVE_SLOT_ID] = slotId

                // Also maintain legacy keys if slot_1 for complete compatibility
                if (slotId == DEFAULT_SLOT_ID) {
                    prefs[KEY_LEGACY_HAS_ACTIVE_SAVE] = true
                    prefs[KEY_LEGACY_TURN_COUNT] = turnCount
                    prefs[KEY_LEGACY_SEASON] = season.name
                    prefs[KEY_LEGACY_GAME_PHASE] = gamePhase
                    prefs[KEY_LEGACY_CHARACTER_JSON] = charJson
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Delete/Clear a specific save slot
     */
    suspend fun deleteSlot(slotId: String) {
        context.gameDataStore.edit { prefs ->
            prefs[keyHasSave(slotId)] = false
            prefs.remove(keyCharJson(slotId))
            prefs.remove(keyTurnCount(slotId))
            prefs.remove(keySeason(slotId))
            prefs.remove(keyGamePhase(slotId))
            prefs.remove(keySavedTimestamp(slotId))
            prefs.remove(keySlotTitle(slotId))

            if (slotId == DEFAULT_SLOT_ID) {
                prefs[KEY_LEGACY_HAS_ACTIVE_SAVE] = false
                prefs.remove(KEY_LEGACY_CHARACTER_JSON)
                prefs.remove(KEY_LEGACY_TURN_COUNT)
                prefs.remove(KEY_LEGACY_SEASON)
                prefs.remove(KEY_LEGACY_GAME_PHASE)
            }
        }
    }

    suspend fun clearSavedSimulation() {
        deleteSlot(DEFAULT_SLOT_ID)
    }
}
