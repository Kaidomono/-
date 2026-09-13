package com.example.steppenomad.data

import com.example.steppenomad.model.*

object Constants {

    val INITIAL_STATS: Map<SocialClass, CharacterStats> = mapOf(
        SocialClass.NOMAD to CharacterStats(
            health = 80, happiness = 80, appearance = 50, strength = 40,
            intelligence = 30, perception = 60, leadership = 10, loyalty = 50,
            reputation = 5, realmReputation = 0, horseRiding = 20, archery = 15, wealth = 10
        ),
        SocialClass.NOBLE to CharacterStats(
            health = 70, happiness = 80, appearance = 50, strength = 30,
            intelligence = 60, perception = 50, leadership = 70, loyalty = 40,
            reputation = 80, realmReputation = 40, horseRiding = 50, archery = 40, wealth = 500
        ),
        SocialClass.MERCHANT to CharacterStats(
            health = 75, happiness = 80, appearance = 50, strength = 25,
            intelligence = 70, perception = 75, leadership = 40, loyalty = 60,
            reputation = 50, realmReputation = 25, horseRiding = 30, archery = 10, wealth = 1000
        ),
        SocialClass.WARRIOR to CharacterStats(
            health = 90, happiness = 80, appearance = 50, strength = 70,
            intelligence = 40, perception = 55, leadership = 50, loyalty = 90,
            reputation = 40, realmReputation = 15, horseRiding = 60, archery = 70, wealth = 50
        ),
        SocialClass.BLACKSMITH to CharacterStats(
            health = 85, happiness = 80, appearance = 50, strength = 80,
            intelligence = 50, perception = 45, leadership = 20, loyalty = 70,
            reputation = 30, realmReputation = 10, horseRiding = 20, archery = 10, wealth = 100
        )
    )

    val MONGOL_SURNAMES = listOf(
        "Borgijin", "Jalayir", "Tayichiud", "Kereid", "Naiman", "Merkid", "Tatar", "Ongud"
    )

    val MONGOL_NAMES_MALE = listOf(
        "Temujin", "Jochi", "Chagatai", "Ogedei", "Tolui", "Subutai", "Jebe", "Muqali", "Batu", "Hulagu", "Kublai", "Berke"
    )

    val MONGOL_NAMES_FEMALE = listOf(
        "Borte", "Hoelun", "Yesugen", "Yesui", "Khutulun", "Sorkhotani", "Oghul", "Chabi", "Mandukhai"
    )

    val TRIBES = listOf(
        "Khamag Mongol", "Kereid", "Naiman", "Merkid", "Tatar", "Tayichiud",
        "Jalayir", "Ongud", "Oirats", "Khongirad", "Buryats", "Uriankhai"
    )

    val KINGDOMS = listOf(
        "Jin Dynasty", "Western Xia", "Kara-Khitan", "Khwarazmian Empire", "Sultanate of Delhi"
    )

    data class TraitDef(val id: String, val name: String, val description: String, val statBonus: (CharacterStats) -> CharacterStats)

    val STARTING_TRAITS = listOf(
        TraitDef("brawny", "Brawny", "Born with unusual physical strength.") { it.copy(strength = it.strength + 15) },
        TraitDef("wise", "Wise", "A sharp mind from an early age.") { it.copy(intelligence = it.intelligence + 15) },
        TraitDef("eagle_eye", "Eagle Eye", "Superior vision and awareness.") { it.copy(perception = it.perception + 15) },
        TraitDef("charming", "Charming", "People are naturally drawn to you.") { it.copy(appearance = it.appearance + 15) },
        TraitDef("fearless", "Fearless", "Unwavering courage in battle.") { it.copy(leadership = it.leadership + 10, reputation = it.reputation + 5) },
        TraitDef("destined", "Destined", "The spirits of the ancestors watch over you.") { it.copy(health = it.health + 10, happiness = it.happiness + 10) }
    )

    val APPEARANCE_HAIR_COLORS = listOf("Black", "Dark Brown", "Chestnut", "Gray")
    val APPEARANCE_EYE_COLORS = listOf("Dark Brown", "Black", "Amber", "Hazel")

    val ROLE_SALARIES: Map<String, Int> = mapOf(
        "Infant" to 0,
        "Child" to 0,
        "War-Ready Youth" to 40,
        "Outlaw" to 20,
        "Horseback Recruit" to 60,
        "Warrior" to 100,
        "Vanguard" to 180,
        "Squad Leader (Arban)" to 250,
        "Centurion (Zuun)" to 400,
        "Commander of Thousand (Mingghan)" to 600,
        "General" to 900,
        "Warlord" to 1200,
        "Marshal of the Empire" to 2500,
        "Kheshig Aspirant" to 300,
        "Imperial Guard (Kheshig)" to 550,
        "Noyan (Noble Commander)" to 1000,
        "Khagan's Advisor" to 1800,
        "Great Khan" to 5000,
        "Nomad" to 50,
        "Herder" to 70,
        "Master Herder" to 130,
        "Clan Scout" to 110,
        "Hunter" to 80,
        "Master Hunter" to 200,
        "Clan Elder" to 350,
        "Tribal Judge (Jarghuchi)" to 700,
        "Vizier" to 1500,
        "Apprentice Blacksmith" to 120,
        "Journeyman Smith" to 220,
        "Master Smith" to 450,
        "Royal Armorer" to 900,
        "Apprentice Bowyer" to 130,
        "Bowyer" to 280,
        "Master Bowyer" to 500,
        "Master of the Arsenal" to 1100,
        "Apprentice Trader" to 220,
        "Caravan Guard" to 180,
        "Merchant" to 450,
        "Caravan Master" to 750,
        "Guild Master" to 1300,
        "Merchant Prince" to 2500,
        "Scribe" to 180,
        "Imperial Librarian" to 350,
        "Imperial Scholar" to 750,
        "Grand Historian" to 1600,
        "Apprentice Builder" to 140,
        "Siege Engineer" to 320,
        "Master Architect" to 650,
        "Imperial Engineer" to 1500,
        "Tax Collector" to 280,
        "District Overseer (Darughachi)" to 700,
        "Imperial Chancellor" to 2200,
        "Steppe Spy" to 150,
        "Information Broker" to 350,
        "Master of Whispers" to 800,
        "Imperial Spymaster" to 2200,
        "Envoy" to 200,
        "Imperial Emissary" to 500,
        "Ambassador" to 850,
        "Chief Negotiator" to 1400,
        "Grand Vizier" to 2800,
        "Tengri-Seeker" to 150,
        "Shaman" to 250,
        "Tribal Healer" to 300,
        "Sage" to 650,
        "High Shaman" to 1600,
        "Oracle of the Eternal Sky" to 3000,
        "Bird-Catcher" to 90,
        "Falconer" to 220,
        "Master of the Hunt" to 550,
        "Imperial Falconer" to 1300,
        "Apprentice Groom" to 100,
        "Horse Breaker" to 250,
        "Stable Master" to 500,
        "Sa'is (Imperial Equerry)" to 1400
    )

    data class RawMarketItem(
        val id: String,
        val name: String,
        val type: String,
        val category: String,
        val price: Int,
        val quality: Int,
        val desc: String
    )

    val MARKET_ITEMS = listOf(
        RawMarketItem("m_pony", "Steppe Pony", "Horse", "Mounts & Animals", 100, 30, "A basic but reliable companion for any nomad."),
        RawMarketItem("m_stallion", "War Stallion", "Horse", "Mounts & Animals", 500, 70, "Bred for the chaos of battle. Strong and brave."),
        RawMarketItem("m_white_horse", "White Spirit Horse", "Horse", "Mounts & Animals", 2000, 95, "A horse fit for a Khan. Said to be blessed by Tengri."),
        RawMarketItem("m_camel_ride", "Desert Camel", "Horse", "Mounts & Animals", 600, 65, "Ideal for long journeys across the Gobi desert."),
        RawMarketItem("m_bow_simple", "Hunting Bow", "Weapon", "Combat Gear", 50, 40, "A standard bow for hunting marmots and small game."),
        RawMarketItem("m_bow_composite", "Composite Recurve Bow", "Weapon", "Combat Gear", 400, 85, "The pride of the steppe. Laminated horn, wood, and sinew."),
        RawMarketItem("m_scimitar", "Curved Scimitar", "Weapon", "Combat Gear", 250, 70, "A sharp, curved blade perfect for slashing from horseback."),
        RawMarketItem("m_obsidian_blade", "Obsidian Ritual Blade", "Weapon", "Combat Gear", 1200, 90, "A volcanic glass dagger that never loses its edge."),
        RawMarketItem("m_mace", "Heavy Iron Mace", "Weapon", "Combat Gear", 300, 75, "Designed to crush even the strongest enemy armor."),
        RawMarketItem("m_lance", "Tipped Lance", "Weapon", "Combat Gear", 150, 60, "Essential for the first charge of the heavy cavalry."),
        RawMarketItem("m_felt_armor", "Reinforced Felt Armor", "Armor", "Combat Gear", 120, 45, "Layers of hardened wool that offer decent protection."),
        RawMarketItem("m_lamellar", "Steel Lamellar Armor", "Armor", "Combat Gear", 800, 80, "Hundreds of small steel plates laced together."),
        RawMarketItem("m_silk_under", "Silk Under-Armor", "Armor", "Combat Gear", 400, 60, "Drawn into wounds by arrowheads for easy extraction."),
        RawMarketItem("m_helmet", "Iron Spiked Helmet", "Armor", "Combat Gear", 200, 70, "A sturdy helmet with a protective neck guard."),
        RawMarketItem("m_basic_yurt", "Small Ger", "Yurt", "Estate & Home", 300, 40, "A modest felt tent for a starting family."),
        RawMarketItem("m_deluxe_yurt", "Spacious Ger", "Yurt", "Estate & Home", 1000, 75, "Well-insulated with fine carvings. Sign of prosperity."),
        RawMarketItem("m_iron_stove", "Cast Iron Stove", "Commodity", "Estate & Home", 500, 75, "Retains heat long into the frozen night."),
        RawMarketItem("m_palace_yurt", "Golden Horde Ordu", "Yurt", "Estate & Home", 5000, 100, "A massive palace-yurt. The pinnacle of steppe living."),
        RawMarketItem("m_silk_bolts", "Raw Silk Bolts", "Commodity", "Trade Goods", 600, 80, "Rich fabric from the southern empires. Desired by nobles."),
        RawMarketItem("m_silk_gold", "Gold-Threaded Silk", "Luxury", "Rare Luxuries", 1500, 95, "Worth a fortune across Silk Road markets."),
        RawMarketItem("m_chinese_gown", "Dragon Embroidered Gown", "Luxury", "Rare Luxuries", 2500, 98, "A symbol of imperial favor from the Middle Kingdom."),
        RawMarketItem("m_persian_map", "Al-Khwarizmi Map", "Luxury", "Rare Luxuries", 1800, 92, "A complex map that broadens your horizons."),
        RawMarketItem("m_ceramics_blue", "Blue-White Porcelain", "Commodity", "Trade Goods", 450, 85, "Delicate vessels from southern kilns. Highly prized."),
        RawMarketItem("m_spices_pepper", "Black Pepper Bags", "Commodity", "Trade Goods", 300, 70, "Exotic pepper from distant tropical lands."),
        RawMarketItem("m_spices_saffron", "Persian Saffron", "Luxury", "Rare Luxuries", 2000, 100, "The most expensive spice known to man."),
        RawMarketItem("m_fine_wine", "Persian Wine", "Commodity", "Trade Goods", 150, 60, "Rare fermented drink. Increases prestige when gifted."),
        RawMarketItem("m_silver_mirror", "Tangled Silver Mirror", "Luxury", "Rare Luxuries", 950, 85, "A polished silver disk that reflects the soul."),
        RawMarketItem("m_tea_blocks", "Pressed Tea Blocks", "Commodity", "Trade Goods", 100, 50, "Used as currency across remote Silk Road outposts."),
        RawMarketItem("m_ivory_chess", "Walrus Ivory Chess Set", "Luxury", "Rare Luxuries", 1600, 92, "Hand-carved pieces depicting eternal war."),
        RawMarketItem("m_gold_jewelry", "Gold Filigree Belt", "Luxury", "Rare Luxuries", 1200, 90, "Exquisite craftsmanship that radiates prestige."),
        RawMarketItem("m_eagle", "Golden Eagle", "Bird", "Mounts & Animals", 800, 85, "A majestic hunter's bird. Greatly expands vision on the map."),
        RawMarketItem("m_falcon", "Hunting Falcon", "Bird", "Mounts & Animals", 300, 60, "A swift predator that aids in scouting nearby tribes.")
    )

    val MARKET_MULTIPLIERS: Map<String, MarketMultiplierSet> = mapOf(
        "Economic Boom" to MarketMultiplierSet(sell = 1.5, buy = 1.2, livestock = 1.3, luxury = 1.6, commodity = 1.4),
        "Stable" to MarketMultiplierSet(sell = 1.0, buy = 1.0, livestock = 1.0),
        "Recession" to MarketMultiplierSet(sell = 0.7, buy = 0.8, livestock = 0.6, luxury = 0.5, commodity = 0.6),
        "Livestock Famine" to MarketMultiplierSet(sell = 0.5, buy = 2.0, livestock = 3.0),
        "War Preparations" to MarketMultiplierSet(sell = 1.2, buy = 1.5, gear = 2.0, commodity = 1.8),
        "Gold Rush" to MarketMultiplierSet(sell = 1.3, buy = 1.6, luxury = 2.5, commodity = 1.4),
        "Silk Road Blockade" to MarketMultiplierSet(sell = 0.8, buy = 2.5, luxury = 1.8, commodity = 3.2)
    )

    data class PricePair(val buy: Int, val sell: Int)
    val LIVESTOCK_PRICES: Map<String, PricePair> = mapOf(
        "horses" to PricePair(buy = 150, sell = 120),
        "sheep" to PricePair(buy = 20, sell = 15),
        "cattle" to PricePair(buy = 60, sell = 45),
        "goats" to PricePair(buy = 15, sell = 12),
        "yaks" to PricePair(buy = 80, sell = 65),
        "camels" to PricePair(buy = 250, sell = 200)
    )

    val CAREER_BRANCHES = listOf(
        CareerBranch(
            id = "Military",
            name = "🗡️ Military Command",
            iconName = "Sword",
            entryRole = "Horseback Recruit",
            description = "Lead fast horse archers and deploy massive tactical heavy cavalry units across the Gobi and beyond.",
            roles = listOf(
                CareerRole("Horseback Recruit", 60, "Age 15+"),
                CareerRole("Warrior", 100, "Strength 45+, Archery 40+"),
                CareerRole("Vanguard", 180, "Strength 60+, Archery 60+"),
                CareerRole("Squad Leader (Arban)", 250, "Leadership 40+"),
                CareerRole("Centurion (Zuun)", 400, "Leadership 60+, Reputation 50+"),
                CareerRole("Commander of Thousand (Mingghan)", 600, "Leadership 80+, Reputation 80+"),
                CareerRole("General", 900, "Leadership 90+, Conquer 1 Tribe"),
                CareerRole("Warlord", 1200, "Conquer 3 Tribes"),
                CareerRole("Marshal of the Empire", 2500, "Conquer 5 Tribes, Leadership 95+")
            ),
            action = CareerAction(
                name = "🏹 Cavalry Archery Maneuver",
                cost = 15,
                desc = "Form up the squadrons and execute circular high-speed drills.",
                successMsg = "You lead your cohorts in continuous circular archery drills. Bowstrings twang in unison, boosting tactical readiness.",
                statGains = mapOf("archery" to 3, "strength" to 2, "reputation" to 1)
            )
        ),
        CareerBranch(
            id = "Kheshig",
            name = "⚜️ Imperial Guard",
            iconName = "Shield",
            entryRole = "Kheshig Aspirant",
            description = "The Emperor's elite bodyguard and noble inner circle administrators.",
            roles = listOf(
                CareerRole("Kheshig Aspirant", 300, "Age 15+, Leadership 40+"),
                CareerRole("Imperial Guard (Kheshig)", 550, "Leadership 65+, Strength 60+"),
                CareerRole("Noyan (Noble Commander)", 1000, "Leadership 80+, Reputation 70+"),
                CareerRole("Khagan's Advisor", 1800, "Intelligence 85+, Leadership 85+"),
                CareerRole("Great Khan", 5000, "Conquer 6 Tribes, Leadership 95+")
            ),
            action = CareerAction(
                name = "🛡️ Stand Imperial Sentry",
                cost = 20,
                desc = "Guard the central palace-ger and counsel senior chiefs.",
                successMsg = "With glistening saber in hand, you stood guard over the sacred threshold, eavesdropping on major military debates.",
                statGains = mapOf("leadership" to 2, "perception" to 2, "reputation" to 2)
            )
        ),
        CareerBranch(
            id = "Nomad",
            name = "🐑 Civil & Herding",
            iconName = "Herding",
            entryRole = "Nomad",
            description = "Secure the pastures, gather supplies, and guide the traditional nomadic lifestyle.",
            roles = listOf(
                CareerRole("Nomad", 50, "Age 15+"),
                CareerRole("Herder", 70, "Strength 40+ or Riding 50+"),
                CareerRole("Master Herder", 130, "Strength 60+, Riding 70+"),
                CareerRole("Clan Scout", 110, "Riding 65+, Perception 50+"),
                CareerRole("Hunter", 80, "Archery 50+, Perception 50+"),
                CareerRole("Master Hunter", 200, "Archery 75+, Perception 70+"),
                CareerRole("Clan Elder", 350, "Intelligence 60+, Reputation 55+"),
                CareerRole("Tribal Judge (Jarghuchi)", 700, "Intelligence 80+, Reputation 75+"),
                CareerRole("Vizier", 1500, "Intelligence 90+, Leadership 80+")
            ),
            action = CareerAction(
                name = "🐎 Drive Herds to New Grazing",
                cost = 10,
                desc = "Scout fresh lush pastures and guide the animals over meadows.",
                successMsg = "Your migration avoids deep river marshes and local wolf zones. The livestock is fat and secure.",
                statGains = mapOf("horseRiding" to 3, "perception" to 2)
            )
        ),
        CareerBranch(
            id = "Crafts",
            name = "⚒️ Blacksmithing & Bowyers",
            iconName = "Hammer",
            entryRole = "Apprentice Blacksmith",
            description = "Forge flexible steel sabers and construct the fabled layered horn bows.",
            roles = listOf(
                CareerRole("Apprentice Blacksmith", 120, "Age 15+"),
                CareerRole("Journeyman Smith", 220, "Strength 50+, Intelligence 40+"),
                CareerRole("Master Smith", 450, "Strength 70+, Intelligence 60+"),
                CareerRole("Royal Armorer", 900, "Strength 80+, Reputation 80+"),
                CareerRole("Apprentice Bowyer", 130, "Intelligence 45+, Perception 45+"),
                CareerRole("Bowyer", 280, "Intelligence 60+, Archery 60+"),
                CareerRole("Master Bowyer", 500, "Intelligence 80+, Archery 80+"),
                CareerRole("Master of the Arsenal", 1100, "Intelligence 85+, Conquer 1 Tribe")
            ),
            action = CareerAction(
                name = "⚒️ Forge Steel & Splice Horns",
                cost = 25,
                desc = "Heat the charcoal furnace and splice composite layers to craft heavy gear.",
                successMsg = "The bellows whined and hot iron sparks filled your workshop. You designed superior weapons.",
                statGains = mapOf("strength" to 2, "intelligence" to 2, "reputation" to 1)
            )
        ),
        CareerBranch(
            id = "Trade",
            name = "🐪 Silk Road Commerce",
            iconName = "Coins",
            entryRole = "Apprentice Trader",
            description = "Journey across treacherous caravan routes to accumulate immense merchant wealth.",
            roles = listOf(
                CareerRole("Apprentice Trader", 220, "Age 15+"),
                CareerRole("Caravan Guard", 180, "Strength 45+, Archery 40+"),
                CareerRole("Merchant", 450, "Intelligence 65+, Wealth 500"),
                CareerRole("Caravan Master", 750, "Wealth 2000, Intelligence 75+"),
                CareerRole("Guild Master", 1300, "Wealth 10000, Leadership 50+"),
                CareerRole("Merchant Prince", 2500, "Wealth 50000, Reputation 80+")
            ),
            action = CareerAction(
                name = "🐫 Broker Regional Caravan Barter",
                cost = 30,
                desc = "Open trade chests and convince local tribal agents to exchange furs for porcelain.",
                successMsg = "You hosted several tea ceremonies and smoothly pocketed a substantial trade arbitrage margin!",
                statGains = mapOf("intelligence" to 2, "perception" to 2)
            )
        ),
        CareerBranch(
            id = "Spiritual",
            name = "✨ Shamanic Rites & Tengri",
            iconName = "Sparkles",
            entryRole = "Tengri-Seeker",
            description = "Commune with high heavenly spirits and guide clan fortunes.",
            roles = listOf(
                CareerRole("Tengri-Seeker", 150, "Age 15+"),
                CareerRole("Shaman", 250, "Intelligence 70+"),
                CareerRole("Tribal Healer", 300, "Reputation 60+"),
                CareerRole("Sage", 650, "Intelligence 90+"),
                CareerRole("High Shaman", 1600, "Reputation 90+"),
                CareerRole("Oracle of the Eternal Sky", 3000, "Conquer 5 Tribes")
            ),
            action = CareerAction(
                name = "🔥 Beat Sacred Ot-Drums",
                cost = 40,
                desc = "Throw sacred incense needles onto embers to seek sky ancestors' blessings.",
                successMsg = "The camp falls into a trance as dry smoke coils toward the stars. The sky father beams on your lineage.",
                statGains = mapOf("intelligence" to 3, "appearance" to 2)
            )
        )
    )
}
