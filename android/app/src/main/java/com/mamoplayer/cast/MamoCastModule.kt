package com.mamoplayer.cast

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastState
import com.google.android.gms.cast.framework.CastStateListener
import androidx.mediarouter.app.MediaRouteChooserDialog
import androidx.mediarouter.media.MediaControlIntent
import androidx.mediarouter.media.MediaRouteSelector

/**
 * React Native module that exposes Google Cast (Chromecast) to the JS layer.
 *
 * Functionality:
 *  - [showCastPicker] — shows the system MediaRouteChooserDialog.
 *  - [getCastState]   — resolves with the current cast session state.
 *  - Emits `mamo_cast_state_changed` whenever the Cast state changes.
 *
 * Requires:
 *  - `play-services-cast-framework` and `mediarouter` in app/build.gradle.
 *  - `MamoCastOptionsProvider` declared as `<meta-data>` in AndroidManifest.xml.
 *  - The package registered in `MainApplication.kt`.
 */
class MamoCastModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var castContext: CastContext? = null
  private var castStateListener: CastStateListener? = null

  override fun getName(): String = "MamoCastModule"

  override fun initialize() {
    super.initialize()
    try {
      castContext = CastContext.getSharedInstance(reactContext)
      val listener = CastStateListener { state -> emitCastState(state) }
      castStateListener = listener
      castContext?.addCastStateListener(listener)
    } catch (e: Exception) {
      // Google Play Services / Cast SDK not available on this device — degrade gracefully.
    }
  }

  // ── NativeEventEmitter contract ──────────────────────────────────────────
  // React Native's NativeEventEmitter requires these no-ops to avoid a JS warning.

  @ReactMethod
  fun addListener(@Suppress("UNUSED_PARAMETER") eventType: String) { /* no-op */ }

  @ReactMethod
  fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) { /* no-op */ }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Present the MediaRouteChooserDialog so the user can select a cast device. */
  @ReactMethod
  fun showCastPicker() {
    val activity = currentActivity ?: return
    activity.runOnUiThread {
      try {
        val selector = MediaRouteSelector.Builder()
          .addControlCategory(MediaControlIntent.CATEGORY_REMOTE_PLAYBACK)
          .build()
        val dialog = MediaRouteChooserDialog(activity)
        dialog.routeSelector = selector
        dialog.show()
      } catch (e: Exception) {
        // Cast SDK not available — silently ignore.
      }
    }
  }

  /** Resolve with the current cast state string understood by the JS layer. */
  @ReactMethod
  fun getCastState(promise: Promise) {
    try {
      val state = castContext?.castState ?: CastState.NO_DEVICES_AVAILABLE
      promise.resolve(castStateToString(state))
    } catch (e: Exception) {
      promise.resolve("unavailable")
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override fun onCatalystInstanceDestroy() {
    castStateListener?.let { castContext?.removeCastStateListener(it) }
    castStateListener = null
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private fun emitCastState(state: Int) {
    val params = Arguments.createMap().apply { putString("state", castStateToString(state)) }
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("mamo_cast_state_changed", params)
  }

  private fun castStateToString(state: Int): String = when (state) {
    CastState.NO_DEVICES_AVAILABLE -> "unavailable"
    CastState.NOT_CONNECTED -> "idle"
    CastState.CONNECTING -> "connecting"
    CastState.CONNECTED -> "connected"
    else -> "idle"
  }
}
