package com.anticore.desktop

import android.util.Log

object AnticoreBridge {
    private const val TAG = "AnticoreBridge"

    init {
        try {
            System.loadLibrary("anticore_desktop_lib")
            Log.i(TAG, "anticore_desktop_lib native library loaded successfully")
        } catch (e: UnsatisfiedLinkError) {
            Log.e(TAG, "Failed to load anticore_desktop_lib: ${e.message}")
        }
    }

    @JvmStatic
    fun initBridge() {
        try {
            initNativeBridge()
            Log.d(TAG, "AnticoreBridge initialized and native JVM bridge connected")
        } catch (e: Throwable) {
            Log.w(TAG, "initNativeBridge warning: ${e.message}")
        }
    }

    @JvmStatic
    fun startVpnFromNative(): Boolean {
        return MainActivity.prepareAndStartVpn()
    }

    @JvmStatic
    fun stopVpnFromNative(): Boolean {
        return MainActivity.stopVpn()
    }

    @JvmStatic
    fun protectSocketFromNative(fd: Int): Boolean {
        return AnticoreVpnService.protectSocket(fd)
    }

    @JvmStatic
    fun isVpnRunning(): Boolean {
        return AnticoreVpnService.isRunning
    }

    @JvmStatic
    fun getTunFdFromNative(): Int {
        return AnticoreVpnService.getFd()
    }

    // Native callbacks implemented in Rust
    @JvmStatic
    external fun initNativeBridge(): Boolean

    @JvmStatic
    external fun onTunReady(fd: Int): Boolean

    @JvmStatic
    external fun onTunClosed()

    @JvmStatic
    external fun onVpnPermissionDenied()
}
