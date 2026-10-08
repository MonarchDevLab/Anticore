package com.anticore.desktop

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import android.util.Log
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts

class MainActivity : TauriActivity() {

    companion object {
        const val TAG = "AnticoreMainActivity"

        @Volatile
        var instance: MainActivity? = null
            private set

        @Volatile
        var appContext: Context? = null
            private set

        @JvmStatic
        fun prepareAndStartVpn(): Boolean {
            return try {
                val act = instance
                if (act != null) {
                    act.runOnUiThread {
                        act.requestVpnPermissionAndStart()
                    }
                    true
                } else {
                    val ctx = appContext ?: return false
                    val prepareIntent = VpnService.prepare(ctx)
                    if (prepareIntent == null) {
                        Log.i(TAG, "Aktivite örneği yok fakat VPN izni mevcut; servis başlatılıyor")
                        AnticoreVpnService.startVpnService(ctx)
                        true
                    } else {
                        Log.w(TAG, "VPN izni gerekiyor ancak MainActivity örneği hazır değil")
                        false
                    }
                }
            } catch (e: Throwable) {
                Log.e(TAG, "prepareAndStartVpn hatası: ${e.message}", e)
                false
            }
        }

        @JvmStatic
        fun stopVpn(): Boolean {
            return try {
                val act = instance
                if (act != null) {
                    act.runOnUiThread {
                        AnticoreVpnService.stopVpnService(act)
                    }
                    true
                } else {
                    val ctx = appContext ?: return false
                    AnticoreVpnService.stopVpnService(ctx)
                    true
                }
            } catch (e: Throwable) {
                Log.e(TAG, "stopVpn hatası: ${e.message}", e)
                false
            }
        }
    }

    private lateinit var vpnPermissionLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        instance = this
        appContext = applicationContext

        // JNI köprüsünü ve yerel kütüphaneyi erken yükle
        AnticoreBridge.initBridge()

        // Geri tuşu/hareketi ile aktivitenin yok edilmesini (finish) engelle;
        // uygulamayı arka plana taşıyarak VPN tünelinin ve arayüz durumunun
        // kullanıcı açıkça durdurana kadar kesintisiz çalışmasını sağla.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                moveTaskToBack(true)
            }
        })

        vpnPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            try {
                if (result.resultCode == Activity.RESULT_OK) {
                    Log.i(TAG, "VPN izni kullanıcı tarafından onaylandı")
                    AnticoreVpnService.startVpnService(this)
                } else {
                    Log.w(TAG, "VPN izni kullanıcı tarafından reddedildi")
                    try {
                        AnticoreBridge.onVpnPermissionDenied()
                    } catch (e: Throwable) {
                        Log.w(TAG, "onVpnPermissionDenied callback hatası: ${e.message}")
                    }
                }
            } catch (e: Throwable) {
                Log.e(TAG, "vpnPermissionLauncher sonucu işleme hatası: ${e.message}", e)
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        moveTaskToBack(true)
    }

    override fun onDestroy() {
        if (instance == this) {
            instance = null
        }
        super.onDestroy()
    }

    fun requestVpnPermissionAndStart() {
        try {
            val prepareIntent = VpnService.prepare(this)
            if (prepareIntent != null) {
                Log.i(TAG, "VPN izni gerekiyor, sistem iletişim kutusu açılıyor")
                vpnPermissionLauncher.launch(prepareIntent)
            } else {
                Log.i(TAG, "VPN izni zaten mevcut, servis başlatılıyor")
                AnticoreVpnService.startVpnService(this)
            }
        } catch (e: Throwable) {
            Log.e(TAG, "requestVpnPermissionAndStart hatası: ${e.message}", e)
        }
    }
}
