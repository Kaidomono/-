package com.example.steppenomad.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin

/**
 * Procedural synthesizer generating subtle, organic sound effects for simulation events:
 * - Turn end / seasonal transition chime
 * - Coin clinking for gold transactions
 * - Harvest resonance for grain changes
 * - Steppe hoof resonance for horse/livestock changes
 * - Prestige harmonic tone for influence changes
 * - War drum impact for military actions
 */
object SoundEffectManager {

    private val sampleRate = 22050
    private var isMuted = false
    private val audioScope = CoroutineScope(Dispatchers.Default)

    // Pre-computed PCM wave caches for instantaneous latency-free playback
    private val turnEndPcm: ByteArray by lazy { generateTurnEndTone() }
    private val coinClinkPcm: ByteArray by lazy { generateCoinTone() }
    private val harvestPcm: ByteArray by lazy { generateHarvestTone() }
    private val horsePcm: ByteArray by lazy { generateHoofTone() }
    private val influencePcm: ByteArray by lazy { generateInfluenceTone() }
    private val warDrumPcm: ByteArray by lazy { generateWarDrumTone() }

    fun toggleMute(): Boolean {
        isMuted = !isMuted
        return isMuted
    }

    fun isSoundEnabled(): Boolean = !isMuted

    fun playTurnEnd() {
        if (isMuted) return
        audioScope.launch { playPcm(turnEndPcm) }
    }

    fun playCoinClink() {
        if (isMuted) return
        audioScope.launch { playPcm(coinClinkPcm) }
    }

    fun playHarvestSound() {
        if (isMuted) return
        audioScope.launch { playPcm(harvestPcm) }
    }

    fun playHorseSound() {
        if (isMuted) return
        audioScope.launch { playPcm(horsePcm) }
    }

    fun playInfluenceSound() {
        if (isMuted) return
        audioScope.launch { playPcm(influencePcm) }
    }

    fun playWarDrum() {
        if (isMuted) return
        audioScope.launch { playPcm(warDrumPcm) }
    }

    private fun playPcm(pcmData: ByteArray) {
        try {
            val audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(pcmData.size)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            audioTrack.write(pcmData, 0, pcmData.size)
            audioTrack.play()
            audioTrack.setNotificationMarkerPosition(pcmData.size / 2)
            audioTrack.setPlaybackPositionUpdateListener(object : AudioTrack.OnPlaybackPositionUpdateListener {
                override fun onMarkerReached(track: AudioTrack?) {
                    track?.release()
                }

                override fun onPeriodicNotification(track: AudioTrack?) {}
            })
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Subtle, low bronze/wooden bell chime for seasonal turn completion.
     */
    private fun generateTurnEndTone(): ByteArray {
        val durationMs = 380
        val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
        val pcm = ByteArray(numSamples * 2)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            val envelope = exp(-7.0 * t)
            // Bronze gong harmonics: 220Hz fundamental + 440Hz + 660Hz overtones
            val wave = 0.5 * sin(2.0 * PI * 220.0 * t) +
                    0.3 * sin(2.0 * PI * 440.0 * t) +
                    0.2 * sin(2.0 * PI * 660.0 * t)
            val sample = (wave * envelope * 0.35 * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()

            pcm[i * 2] = (sample.toInt() and 0xFF).toByte()
            pcm[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        return pcm
    }

    /**
     * Crisp, metallic double-clink for coins.
     */
    private fun generateCoinTone(): ByteArray {
        val durationMs = 180
        val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
        val pcm = ByteArray(numSamples * 2)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            // Two high-pitch metallic strikes at t=0 and t=0.04
            val env1 = exp(-28.0 * t)
            val env2 = if (t > 0.04) exp(-30.0 * (t - 0.04)) else 0.0
            val wave1 = sin(2.0 * PI * 1850.0 * t) + 0.5 * sin(2.0 * PI * 2400.0 * t)
            val wave2 = sin(2.0 * PI * 2100.0 * t) + 0.5 * sin(2.0 * PI * 2800.0 * t)

            val wave = (wave1 * env1 * 0.4) + (wave2 * env2 * 0.4)
            val sample = (wave * 0.3 * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()

            pcm[i * 2] = (sample.toInt() and 0xFF).toByte()
            pcm[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        return pcm
    }

    /**
     * Warm wooden plucked tone for grain/harvest.
     */
    private fun generateHarvestTone(): ByteArray {
        val durationMs = 240
        val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
        val pcm = ByteArray(numSamples * 2)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            val env = exp(-12.0 * t)
            // Warm pentatonic marimba chord: F# (370Hz) & C# (554Hz)
            val wave = 0.6 * sin(2.0 * PI * 370.0 * t) + 0.4 * sin(2.0 * PI * 554.0 * t)
            val sample = (wave * env * 0.35 * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()

            pcm[i * 2] = (sample.toInt() and 0xFF).toByte()
            pcm[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        return pcm
    }

    /**
     * Gentle steppe hoofbeat tone for horse herd changes.
     */
    private fun generateHoofTone(): ByteArray {
        val durationMs = 200
        val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
        val pcm = ByteArray(numSamples * 2)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            val env1 = exp(-35.0 * t)
            val env2 = if (t > 0.06) exp(-35.0 * (t - 0.06)) else 0.0

            val wave1 = sin(2.0 * PI * 180.0 * t) + 0.3 * sin(2.0 * PI * 120.0 * t)
            val wave2 = sin(2.0 * PI * 220.0 * (t - 0.06)) + 0.3 * sin(2.0 * PI * 150.0 * (t - 0.06))

            val wave = (wave1 * env1) + (wave2 * env2)
            val sample = (wave * 0.35 * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()

            pcm[i * 2] = (sample.toInt() and 0xFF).toByte()
            pcm[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        return pcm
    }

    /**
     * Resonant rising overtone chime for influence and prestige.
     */
    private fun generateInfluenceTone(): ByteArray {
        val durationMs = 300
        val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
        val pcm = ByteArray(numSamples * 2)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            val env = exp(-8.0 * t)
            // Rising arpeggio harmonic
            val freq = 440.0 + (t * 200.0)
            val wave = 0.5 * sin(2.0 * PI * freq * t) + 0.3 * sin(2.0 * PI * (freq * 1.5) * t)
            val sample = (wave * env * 0.3 * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()

            pcm[i * 2] = (sample.toInt() and 0xFF).toByte()
            pcm[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        return pcm
    }

    /**
     * Deep war drum impact.
     */
    private fun generateWarDrumTone(): ByteArray {
        val durationMs = 350
        val numSamples = (sampleRate * (durationMs / 1000.0)).toInt()
        val pcm = ByteArray(numSamples * 2)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            val env = exp(-10.0 * t)
            // Low thumping drum with pitch drop
            val freq = 120.0 * exp(-15.0 * t) + 55.0
            val wave = sin(2.0 * PI * freq * t)
            val sample = (wave * env * 0.45 * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()

            pcm[i * 2] = (sample.toInt() and 0xFF).toByte()
            pcm[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
        }
        return pcm
    }
}
