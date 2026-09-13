package com.example.steppenomad.logic

import com.example.steppenomad.data.Constants
import com.example.steppenomad.model.*
import kotlin.math.max
import kotlin.random.Random

object LocalEvents {

    val LOCAL_SUMMARIES = listOf(
        "A peaceful year on the steppe under the Eternal Blue Sky.",
        "You spent the bitter winter huddling for warmth around the glowing embers.",
        "The herds grew strong this spring with sweet prairie grass.",
        "You practiced your riding and archery drills under the high summer sun.",
        "Autumn brought crisp howling winds and vigorous preparations for the snow.",
        "You shared many rich meals and airag with your trusted kin in the ger.",
        "The tribe moved seasonal pastures across the rolling river valley.",
        "You spent long evenings repairing lamellar armor and fletching birch arrows.",
        "The night sky was filled with countless blazing constellations over the plateau.",
        "You helped milk the spirited mares during the busy foaling season."
    )

    fun getRandomLocalSummary(): String = LOCAL_SUMMARIES.random()

    data class EventTemplate(
        val title: String,
        val description: String,
        val minAge: Int = 0,
        val maxAge: Int = 100,
        val condition: ((Character) -> Boolean)? = null,
        val choices: List<GameChoice>
    )

    val EVENT_TEMPLATES = listOf(
        EventTemplate(
            title = "🐐 Stray Steppe Goat",
            description = "You found a stray mountain goat wandering far from the main flock near the rocky slopes. What do you do?",
            minAge = 3,
            maxAge = 10,
            choices = listOf(
                GameChoice(
                    text = "🏠 Bring it back to the flock",
                    storySnippet = "Your father praised your sharp eyes and diligence.",
                    effect = { it.stats.copy(loyalty = it.stats.loyalty + 5, reputation = it.stats.reputation + 2) }
                ),
                GameChoice(
                    text = "🏇 Try to ride it",
                    storySnippet = "The goat fiercely bucked you headfirst into the mud. You look hilarious.",
                    effect = { it.stats.copy(health = it.stats.health - 5, reputation = it.stats.reputation - 2) }
                )
            )
        ),
        EventTemplate(
            title = "🤼 The Bökh Wrestling Match",
            description = "A sturdy youth from a neighboring clan challenges you to a friendly Bökh wrestling match on the soft grass.",
            minAge = 6,
            maxAge = 16,
            choices = listOf(
                GameChoice(
                    text = "💪 Accept the challenge",
                    storySnippet = "You grappled fiercely. Regardless of the outcome, you earned deep respect among the elders.",
                    effect = { it.stats.copy(strength = it.stats.strength + 6, reputation = it.stats.reputation + 5) }
                ),
                GameChoice(
                    text = "🚶 Walk away gracefully",
                    storySnippet = "He jeers at your caution, but you save your energy for tending the horses.",
                    effect = { it.stats.copy(intelligence = it.stats.intelligence + 3, reputation = it.stats.reputation - 3) }
                )
            )
        ),
        EventTemplate(
            title = "🐎 Your First Pony",
            description = "Your clan elders present you with a young, spirited steppe pony. Its dark eyes shine with raw untamed energy.",
            minAge = 3,
            maxAge = 8,
            choices = listOf(
                GameChoice(
                    text = "🎠 Mount with fearless courage",
                    storySnippet = "You gripped the thick mane tight and rode with the wind! The nomads cheered.",
                    effect = { it.stats.copy(horseRiding = it.stats.horseRiding + 12, reputation = it.stats.reputation + 5) }
                ),
                GameChoice(
                    text = "😟 Approach cautiously with sugar treats",
                    storySnippet = "You gained the colt's quiet trust before gently mounting. A sensible bond is formed.",
                    effect = { it.stats.copy(intelligence = it.stats.intelligence + 4, horseRiding = it.stats.horseRiding + 6) }
                )
            )
        ),
        EventTemplate(
            title = "🏹 The Great Nerge Hunt",
            description = "The entire tribe organizes the massive 'Nerge' circular hunting formation. You are assigned to hold the outer eastern wing.",
            minAge = 13,
            maxAge = 50,
            choices = listOf(
                GameChoice(
                    text = "🛡️ Maintain formation with strict discipline",
                    storySnippet = "Your iron discipline was commended by the old captains. Not a single gazelle slipped through.",
                    effect = { it.stats.copy(leadership = it.stats.leadership + 6, loyalty = it.stats.loyalty + 5) }
                ),
                GameChoice(
                    text = "🏇 Gallop ahead for the first glory kill",
                    storySnippet = "You brought down a massive wild stag with an arrow through the neck, though your wing shifted slightly.",
                    effect = { it.stats.copy(archery = it.stats.archery + 10, reputation = it.stats.reputation + 8, leadership = it.stats.leadership - 3) }
                )
            )
        ),
        EventTemplate(
            title = "⛈️ The Wrath of Tengri",
            description = "Steam rises from the horses' coats as a violent lightning storm rolls across the plateau. The tribal shaman chants in the wind.",
            minAge = 10,
            maxAge = 70,
            choices = listOf(
                GameChoice(
                    text = "✨ Perform a reverent milk offering to Tengri",
                    storySnippet = "You poured fermented mare's milk to the four winds. A sense of calm and spiritual clarity enveloped the camp.",
                    effect = { it.stats.copy(loyalty = it.stats.loyalty + 6, intelligence = it.stats.intelligence + 4) }
                ),
                GameChoice(
                    text = "🐎 Bravely corral the panicked herd",
                    storySnippet = "Through the sheets of rain and thunderclaps, your steady hand kept all horses from stampeding.",
                    effect = { it.stats.copy(horseRiding = it.stats.horseRiding + 8, strength = it.stats.strength + 3) }
                )
            )
        ),
        EventTemplate(
            title = "🐪 Silk Road Caravan Encampment",
            description = "A merchant caravan from Samarkand encamps near your river crossing, displaying glistening glass, jade, and scented spices.",
            minAge = 14,
            maxAge = 80,
            choices = listOf(
                GameChoice(
                    text = "📖 Inquire about foreign kingdoms & languages",
                    storySnippet = "You spent hours listening to tales of stone cities, irrigation wonders, and royal courts.",
                    effect = { it.stats.copy(intelligence = it.stats.intelligence + 10, perception = it.stats.perception + 5) }
                ),
                GameChoice(
                    text = "💰 Trade surplus wool and pelts for silver coins",
                    storySnippet = "You struck a shrewd deal, pocketing 75 silver coins and gaining respect among traders.",
                    effect = { it.stats.copy(wealth = it.stats.wealth + 75, intelligence = it.stats.intelligence + 3) }
                )
            )
        ),
        EventTemplate(
            title = "⚔️ Masterless Veterans Seek a Banner",
            description = "A contingent of hardened steppe veterans approach your yurt, impressed by your rising name and clan wealth.",
            minAge = 18,
            condition = { it.stats.reputation >= 40 && it.stats.wealth >= 300 },
            choices = listOf(
                GameChoice(
                    text = "📜 Swear them to a blood oath (Cost: 200г)",
                    storySnippet = "They drink fermented mare's milk and swear eternal loyalty to your standard. 40 veteran cavalrymen join your horde.",
                    effect = { it.stats.copy(wealth = it.stats.wealth - 200, reputation = it.stats.reputation + 15) },
                    customEffect = {
                        val newChar = it.copy(
                            customRecruitedSoldiers = it.customRecruitedSoldiers + 40,
                            stats = it.stats.copy(wealth = it.stats.wealth - 200, reputation = it.stats.reputation + 15)
                        )
                        val (power, soldiers) = GameEngine.calculateMilitaryPower(newChar)
                        newChar.copy(militaryPower = power, hordeSize = soldiers)
                    }
                ),
                GameChoice(
                    text = "✋ Respectfully decline",
                    storySnippet = "You advise them to seek fortune with neighboring chieftains.",
                    effect = { it.stats.copy(intelligence = it.stats.intelligence + 2) }
                )
            )
        ),
        EventTemplate(
            title = "🌙 Night Raid on the Herds",
            description = "Hostile raiders from a rival clan attack the perimeter horse pens in the dead of midnight!",
            minAge = 16,
            choices = listOf(
                GameChoice(
                    text = "🏹 Take your recurve bow and loose arrows from the yurt",
                    storySnippet = "Your piercing arrows found their targets in the darkness. You repelled the raiders and protected the herds.",
                    effect = { it.stats.copy(archery = it.stats.archery + 8, leadership = it.stats.leadership + 5) }
                ),
                GameChoice(
                    text = "⚔️ Draw your saber and charge the intruders on foot",
                    storySnippet = "You engaged in desperate hand-to-hand combat, slaying their captain in a fierce duel!",
                    effect = { it.stats.copy(strength = it.stats.strength + 8, health = max(10, it.stats.health - 10), reputation = it.stats.reputation + 12) }
                )
            )
        ),
        EventTemplate(
            title = "👑 Kurultai Gathering",
            description = "All the respected clan elders and chieftains gather for a grand Kurultai council to deliberate on the future of the steppe.",
            minAge = 20,
            condition = { it.stats.reputation >= 50 || it.role.contains("General") || it.role.contains("Khan") || it.role.contains("Elder") },
            choices = listOf(
                GameChoice(
                    text = "🗣️ Deliver an impassioned speech on unity",
                    storySnippet = "Your booming voice echoed across the white tents. The chieftains nodded in solemn agreement.",
                    effect = { it.stats.copy(leadership = it.stats.leadership + 12, reputation = it.stats.reputation + 15) }
                ),
                GameChoice(
                    text = "🍖 Host a lavish banquet with roast mutton and airag",
                    storySnippet = "You spared no expense. The clan leaders pledged goodwill to your family.",
                    effect = { it.stats.copy(wealth = max(0, it.stats.wealth - 150), reputation = it.stats.reputation + 20, happiness = it.stats.happiness + 10) }
                )
            )
        )
    )

    fun getEventForCharacter(character: Character): GameEvent? {
        val eligible = EVENT_TEMPLATES.filter { t ->
            character.age >= t.minAge &&
            character.age <= t.maxAge &&
            (t.condition == null || t.condition.invoke(character))
        }

        if (eligible.isEmpty() || Random.nextDouble() > 0.65) return null

        val chosen = eligible.random()
        return GameEvent(
            id = GameEngine.generateId(),
            title = chosen.title,
            description = chosen.description,
            choices = chosen.choices,
            minAge = chosen.minAge,
            maxAge = chosen.maxAge
        )
    }
}
