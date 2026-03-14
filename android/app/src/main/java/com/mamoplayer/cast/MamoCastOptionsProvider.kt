package com.mamoplayer.cast

import android.content.Context
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider

/**
 * Required by the Google Cast SDK.
 * Declared as `<meta-data>` in AndroidManifest.xml so the Cast framework can
 * discover it at runtime via reflection.
 *
 * Replace [DEFAULT_MEDIA_RECEIVER_APP_ID] with your own Cast Application ID
 * from the Google Cast SDK Developer Console if you have a custom receiver.
 */
class MamoCastOptionsProvider : OptionsProvider {

  companion object {
    /** The default Styled Media Receiver works without a custom receiver app. */
    private const val DEFAULT_MEDIA_RECEIVER_APP_ID = "CC1AD845"
  }

  override fun getCastOptions(context: Context): CastOptions =
    CastOptions.Builder()
      .setReceiverApplicationId(DEFAULT_MEDIA_RECEIVER_APP_ID)
      .build()

  override fun getAdditionalSessionProviders(context: Context): List<SessionProvider>? = null
}
