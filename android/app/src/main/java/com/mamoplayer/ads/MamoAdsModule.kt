package com.mamoplayer.ads

import android.net.Uri
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.ext.ima.ImaAdsLoader
import com.google.android.exoplayer2.source.DefaultMediaSourceFactory
import com.google.android.exoplayer2.ui.AdOverlayInfo
import com.google.android.exoplayer2.ui.AdViewProvider

class MamoAdsModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var player: ExoPlayer? = null
  private var adsLoader: ImaAdsLoader? = null
  private var adContainer: FrameLayout? = null
  private var hasStartedEventEmitted = false

  private val playerListener = object : Player.Listener {
    override fun onPlaybackStateChanged(playbackState: Int) {
      when (playbackState) {
        Player.STATE_READY -> emitEvent("mamo_ads_loaded")
        Player.STATE_ENDED -> emitEvent("mamo_ads_completed")
      }
    }

    override fun onIsPlayingChanged(isPlaying: Boolean) {
      if (isPlaying && !hasStartedEventEmitted) {
        hasStartedEventEmitted = true
        emitEvent("mamo_ads_started")
      }
    }

    override fun onPlayerError(error: com.google.android.exoplayer2.PlaybackException) {
      emitError(error.message ?: "Unknown player error")
    }
  }

  override fun getName(): String = "MamoAdsModule"

  @ReactMethod
  fun loadAds(adTagUrl: String) {
    reactContext.runOnUiQueueThread {
      try {
        releaseInternal()

        hasStartedEventEmitted = false
        adContainer = FrameLayout(reactContext)

        val adViewProvider = object : AdViewProvider {
          override fun getAdViewGroup() = adContainer

          override fun getAdOverlayInfos(): MutableList<AdOverlayInfo> = mutableListOf()
        }

        adsLoader = ImaAdsLoader.Builder(reactContext).build()

        val mediaSourceFactory = DefaultMediaSourceFactory(reactContext)
          .setLocalAdInsertionComponents({ unusedAdTag -> adsLoader }, adViewProvider)

        player = ExoPlayer.Builder(reactContext)
          .setMediaSourceFactory(mediaSourceFactory)
          .build()
          .also { exoPlayer ->
            exoPlayer.addListener(playerListener)
            adsLoader?.setPlayer(exoPlayer)

            // TODO: Replace fallback content URL with app-provided stream URL.
            val contentUri = Uri.parse("https://storage.googleapis.com/gvabox/media/samples/stock.mp4")
            val mediaItem = MediaItem.Builder()
              .setUri(contentUri)
              .setAdsConfiguration(
                MediaItem.AdsConfiguration.Builder(Uri.parse(adTagUrl)).build()
              )
              .build()

            exoPlayer.setMediaItem(mediaItem)
            exoPlayer.prepare()
          }
      } catch (exception: Exception) {
        emitError(exception.message ?: "Failed to load ads")
      }
    }
  }

  @ReactMethod
  fun startAds() {
    reactContext.runOnUiQueueThread {
      player?.playWhenReady = true
      player?.play()
    }
  }

  @ReactMethod
  fun stopAds() {
    reactContext.runOnUiQueueThread {
      player?.pause()
    }
  }

  @ReactMethod
  fun releaseAds() {
    reactContext.runOnUiQueueThread {
      releaseInternal()
    }
  }

  override fun invalidate() {
    releaseInternal()
    super.invalidate()
  }

  private fun releaseInternal() {
    player?.removeListener(playerListener)
    player?.release()
    player = null

    adsLoader?.setPlayer(null)
    adsLoader?.release()
    adsLoader = null

    adContainer = null
    hasStartedEventEmitted = false
  }

  private fun emitEvent(eventName: String) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, null)
  }

  private fun emitError(message: String) {
    val errorPayload = Arguments.createMap().apply {
      putString("message", message)
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("mamo_ads_error", errorPayload)
  }
}