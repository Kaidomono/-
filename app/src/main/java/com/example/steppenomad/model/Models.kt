package com.example.steppenomad.model

import kotlinx.serialization.Serializable

enum class Gender(val displayName: String) {
    MALE("Male"),
    FEMALE("Female")
}

enum class SocialClass(val displayName: String) {
    NOMAD("Poor Nomad"),
    NOBLE("Noble Clan"),
    MERCHANT("Merchant Family"),
    WARRIOR("Warrior Bloodline"),
    BLACKSMITH("Blacksmith family")
}

enum class RelationLevel(val displayName: String) {
    AT_WAR("At War"),
    HOSTILE("Hostile"),
    NEUTRAL("Neutral"),
    FRIENDLY("Friendly"),
    ALLIED("Allied")
}

enum class MarketCondition(val displayName: String) {
    BOOM("Economic Boom"),
    STABLE("Stable"),
    RECESSION("Recession"),
    FAMINE("Livestock Famine"),
    WAR_PREP("War Preparations"),
    GOLD_RUSH("Gold Rush"),
    BLOCKADE("Silk Road Blockade")
}

@Serializable
data class CharacterStats(
    val health: Int = 80,
    val happiness: Int = 80,
    val appearance: Int = 50,
    val strength: Int = 40,
    val intelligence: Int = 30,
    val perception: Int = 60,
    val leadership: Int = 10,
    val loyalty: Int = 50,
    val reputation: Int = 5,
    val realmReputation: Int = 0,
    val horseRiding: Int = 20,
    val archery: Int = 15,
    val wealth: Int = 10
)

@Serializable
enum class TreatyType(
    val code: String,
    val displayName: String,
    val mongolTitle: String,
    val description: String,
    val requiredStanding: Int,
    val requiredMilitaryPower: Int,
    val goldCost: Int,
    val influenceCost: Int,
    val horseCost: Int,
    val grainCost: Int,
    val influenceGainPerSeason: Int,
    val goldGainPerSeason: Int,
    val militarySupport: Int,
    val targetStandingBonus: Int,
    val resultLevel: String
) {
    NONE(
        code = "NONE",
        displayName = "No Formal Treaty",
        mongolTitle = "Geregui",
        description = "Standard neutral or tense tribal relations without formal diplomatic pacts.",
        requiredStanding = -100,
        requiredMilitaryPower = 0,
        goldCost = 0,
        influenceCost = 0,
        horseCost = 0,
        grainCost = 0,
        influenceGainPerSeason = 0,
        goldGainPerSeason = 0,
        militarySupport = 0,
        targetStandingBonus = 0,
        resultLevel = "Neutral"
    ),
    NON_AGGRESSION(
        code = "NON_AGGRESSION",
        displayName = "Non-Aggression Pact",
        mongolTitle = "Tsoroltol • Border Truce",
        description = "A mutual border peace treaty pledging to cease seasonal pasture raids and respect clan migration corridors.",
        requiredStanding = -10,
        requiredMilitaryPower = 0,
        goldCost = 40,
        influenceCost = 10,
        horseCost = 0,
        grainCost = 10,
        influenceGainPerSeason = 2,
        goldGainPerSeason = 0,
        militarySupport = 0,
        targetStandingBonus = 15,
        resultLevel = "Friendly"
    ),
    TRADE_AGREEMENT(
        code = "TRADE_AGREEMENT",
        displayName = "Ortogh Trade Agreement",
        mongolTitle = "Khudaldaany Gere • Caravan Pact",
        description = "A formal commercial treaty granting merchant immunity, joint caravan escorts, and reciprocal trade concessions.",
        requiredStanding = 15,
        requiredMilitaryPower = 0,
        goldCost = 80,
        influenceCost = 15,
        horseCost = 1,
        grainCost = 20,
        influenceGainPerSeason = 4,
        goldGainPerSeason = 40,
        militarySupport = 0,
        targetStandingBonus = 20,
        resultLevel = "Friendly"
    ),
    MUTUAL_DEFENSE(
        code = "MUTUAL_DEFENSE",
        displayName = "Mutual Defense Coalition",
        mongolTitle = "Hamgaalaltyn Gere • Steppe League",
        description = "A defensive military alliance binding both clans to ride to the other's defense if assaulted by hostile warlords or foreign empires.",
        requiredStanding = 40,
        requiredMilitaryPower = 300,
        goldCost = 140,
        influenceCost = 25,
        horseCost = 2,
        grainCost = 25,
        influenceGainPerSeason = 6,
        goldGainPerSeason = 0,
        militarySupport = 150,
        targetStandingBonus = 30,
        resultLevel = "Allied"
    ),
    BLOOD_ALLIANCE(
        code = "BLOOD_ALLIANCE",
        displayName = "Anda Blood Brotherhood Alliance",
        mongolTitle = "Andaa Bololtsoh • Sacred Blood Oath",
        description = "The highest sacred nomadic oath. Chieftains drink mare's milk mingled with drops of blood before the sacred hearth, swearing eternal clan brotherhood.",
        requiredStanding = 60,
        requiredMilitaryPower = 500,
        goldCost = 220,
        influenceCost = 40,
        horseCost = 4,
        grainCost = 40,
        influenceGainPerSeason = 9,
        goldGainPerSeason = 0,
        militarySupport = 350,
        targetStandingBonus = 45,
        resultLevel = "Allied (Anda)"
    ),
    PROTECTORATE_VASSAL(
        code = "PROTECTORATE_VASSAL",
        displayName = "Imperial Protectorate & Vassalage",
        mongolTitle = "Alba Uriankhai • Fealty Submission",
        description = "Demand the clan submit their banners to your supreme authority, paying quarterly tribute and supplying auxiliary cavalry.",
        requiredStanding = 10,
        requiredMilitaryPower = 1000,
        goldCost = 0,
        influenceCost = 50,
        horseCost = 0,
        grainCost = 0,
        influenceGainPerSeason = 12,
        goldGainPerSeason = 120,
        militarySupport = 200,
        targetStandingBonus = 20,
        resultLevel = "Vassal"
    );

    companion object {
        fun fromCode(code: String): TreatyType {
            return entries.find { it.code.equals(code, ignoreCase = true) } ?: NONE
        }
    }
}

@Serializable
data class TribeRelation(
    val name: String,
    val level: String = "Neutral",
    val standing: Int = 0, // -100 to 100
    val isTrading: Boolean = false,
    val militaryPower: Int = 1000,
    val leaderName: String = "Chieftain",
    val activeTreaty: String = "NONE",
    val treatyTurnsRemaining: Int = 0,
    val influencePerSeason: Int = 0,
    val goldPerSeason: Int = 0
) {
    val treatyType: TreatyType
        get() = TreatyType.fromCode(activeTreaty)
}

@Serializable
data class Pregnancy(
    val isPregnant: Boolean = true,
    val motherName: String,
    val partnerName: String,
    val isPlayerMother: Boolean,
    val expectedYear: Int,
    val spouseId: String? = null
)

@Serializable
data class Relationship(
    val id: String,
    val name: String,
    val type: String,
    val loyalty: Int = 70,
    val status: String = "Active",
    val traits: List<String> = emptyList(),
    val clan: String? = null,
    val socialClass: String? = null,
    val isMarriageAlliance: Boolean = false,
    val appearance: String? = null,
    val attire: String? = null,
    val expression: String? = null,
    val scent: String? = null,
    val bodyStature: String? = null,
    val hairStyle: String? = null,
    val age: Int = 20,
    val gender: String = "Female",
    val stats: CharacterStats? = null,
    val originType: String? = null,
    val originName: String? = null,
    val pregnancy: Pregnancy? = null
)

@Serializable
data class AssetStats(
    val speed: Int = 0,
    val loyalty: Int = 0,
    val attackBonus: Int = 0,
    val defenseBonus: Int = 0
)

@Serializable
data class Asset(
    val id: String,
    val name: String,
    val type: String, // 'Horse' | 'Weapon' | 'Armor' | 'Livestock' | 'Property' | 'Luxury' | 'Commodity'
    val value: Int,
    val quality: Int,
    val stats: AssetStats? = null
)

@Serializable
data class HistoryEntry(
    val age: Int,
    val text: String
)

@Serializable
data class Livestock(
    val horses: Int = 2,
    val sheep: Int = 20,
    val cattle: Int = 5,
    val goats: Int = 10,
    val yaks: Int = 1,
    val camels: Int = 0
) {
    fun totalCount(): Int = horses + sheep + cattle + goats + yaks + camels
}

@Serializable
data class AppearanceOptions(
    val hairColor: String = "Black",
    val eyeColor: String = "Dark Brown",
    val build: String = "Athletic" // 'Slender' | 'Athletic' | 'Robust' | 'Towering'
)

@Serializable
data class TaxReport(
    val taxesPaid: Int = 0,
    val taxesCollected: Int = 0,
    val soldierSalaryPaid: Int = 0,
    val soldierSalaryReceived: Int = 0,
    val netIncome: Int = 0
)

@Serializable
data class Workshop(
    val id: String,
    val name: String,
    val type: String, // 'Forge' | 'Saddle' | 'Dairy' | 'Weaving'
    val level: Int = 1,
    val passiveIncome: Int = 50,
    val costToUpgrade: Int = 200,
    val description: String = ""
)

@Serializable
data class CaravanVoyage(
    val id: String,
    val destination: String,
    val investment: Int,
    val guards: Int,
    val cargo: String,
    val durationYears: Int,
    val progressYears: Int = 0,
    val expectedReturnMin: Int,
    val expectedReturnMax: Int,
    val status: String = "Traveling", // 'Traveling' | 'Completed' | 'Plundered'
    val narrative: String? = null
)

@Serializable
data class AvailableMarketItem(
    val id: String,
    val originalId: String,
    val name: String,
    val type: String,
    val category: String,
    val price: Int,
    val basePrice: Int,
    val quality: Int,
    val desc: String
)

@Serializable
data class CampaignState(
    val targetTribe: String,
    val year: Int,
    val playerProgress: Int = 0, // 0 to 100
    val playerCasualties: Int = 0,
    val enemyCasualties: Int = 0,
    val enemyPower: Int = 1000,
    val enemyInitialPower: Int = 1000,
    val combatLog: List<String> = emptyList(),
    val currentStrategy: String? = null,
    val resolvedForThisYear: Boolean = false
)

@Serializable
data class Character(
    val id: String,
    val name: String,
    val title: String? = null,
    val age: Int = 0,
    val gender: String = "Male",
    val socialClass: String = "Poor Nomad",
    val stats: CharacterStats = CharacterStats(),
    val role: String = "Child",
    val tribe: String = "Khamag Mongol",
    val clan: String = "Borgijin",
    val relationships: List<Relationship> = emptyList(),
    val assets: List<Asset> = emptyList(),
    val isAlive: Boolean = true,
    val children: Int = 0,
    val clanWealth: Int = 1000,
    val tribeRelations: List<TribeRelation> = emptyList(),
    val kingdomRelations: List<TribeRelation> = emptyList(),
    val conqueredTribes: List<String> = emptyList(),
    val conqueredKingdoms: List<String> = emptyList(),
    val isGreatKhan: Boolean = false,
    val militaryPower: Int = 0,
    val hordeSize: Int = 0,
    val successionLaw: String = "Tanistry",
    val heirId: String? = null,
    val lifestyle: String = "Nomadic", // 'Nomadic' | 'Settled'
    val pastureCapacity: Int = 300,
    val pastureUpgrades: Int = 0,
    val livestock: Livestock = Livestock(),
    val droughtYears: Int = 0,
    val marketCondition: String = "Stable",
    val marketTrends: Map<String, Double> = emptyMap(),
    val availableMarketItems: List<AvailableMarketItem> = emptyList(),
    val history: List<HistoryEntry> = emptyList(),
    val traits: List<String> = emptyList(),
    val appearanceOptions: AppearanceOptions = AppearanceOptions(),
    val weather: String = "Clear",
    val visionBonus: Int = 0,
    val designatedHeir: String? = null,
    val deathCause: String? = null,
    val pregnancy: Pregnancy? = null,
    val taxReport: TaxReport = TaxReport(),
    val customRecruitedSoldiers: Int = 0,
    val warriorTraining: Int = 40,
    val warriorEquipmentLevel: Int = 1,
    val warriorMorale: Int = 75,
    val grain: Int = 150, // Stored grain, dried curd & winter provisions (sacks)
    val influence: Int = 20, // Tribal diplomatic influence, prestige & clan sway
    val workshops: List<Workshop> = emptyList(),
    val caravans: List<CaravanVoyage> = emptyList()
)

@Serializable
data class WorldState(
    val year: Int = 1206,
    val activeTribes: List<String> = listOf("Khamag Mongol"),
    val currentKhan: String = "Temujin",
    val worldEvents: List<String> = listOf("The Unification of the Tribes")
)

data class GameChoice(
    val text: String,
    val storySnippet: String,
    val effect: ((Character) -> CharacterStats)? = null,
    val customEffect: ((Character) -> Character)? = null
)

data class GameEvent(
    val id: String,
    val title: String,
    val description: String,
    val choices: List<GameChoice>,
    val minAge: Int = 0,
    val maxAge: Int = 100
)

@Serializable
data class Equipment(
    val id: String,
    val name: String,
    val type: String, // 'Weapon' | 'Armor' | 'Mount'
    val attackBonus: Int = 0,
    val defenseBonus: Int = 0,
    val rarity: String = "Common"
)

data class CombatantStats(
    val strength: Int,
    val skill: Int,
    val endurance: Int
)

data class Combatant(
    val name: String,
    val stats: CombatantStats,
    val weapon: Equipment? = null,
    val armor: Equipment? = null,
    val mount: Equipment? = null
)

data class CombatLogEntry(
    val turn: Int,
    val attacker: String,
    val damage: Int,
    val message: String
)

data class CombatOutcome(
    val winner: String,
    val rounds: Int,
    val log: List<CombatLogEntry>,
    val probability: Int
)

data class CareerRole(
    val name: String,
    val salary: Int,
    val reqs: String
)

data class CareerAction(
    val name: String,
    val cost: Int,
    val desc: String,
    val successMsg: String,
    val statGains: Map<String, Int>
)

data class CareerBranch(
    val id: String,
    val name: String,
    val iconName: String,
    val entryRole: String,
    val description: String,
    val roles: List<CareerRole>,
    val action: CareerAction
)

data class MarketMultiplierSet(
    val sell: Double,
    val buy: Double,
    val livestock: Double = 1.0,
    val gear: Double = 1.0,
    val commodity: Double = 1.0,
    val luxury: Double = 1.0
)
