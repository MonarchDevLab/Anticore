package com.anticore.desktop

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import org.amnezia.awg.hevtunnel.TProxyService
import java.io.File

class AnticoreVpnService : VpnService() {

    private var wakeLock: PowerManager.WakeLock? = null

    companion object {
        const val TAG = "AnticoreVpnService"
        const val ACTION_START = "com.anticore.desktop.START_VPN"
        const val ACTION_STOP = "com.anticore.desktop.STOP_VPN"
        const val CHANNEL_ID = "anticore_vpn_channel"
        const val NOTIFICATION_ID = 1001

        @Volatile
        var instance: AnticoreVpnService? = null
            private set

        @Volatile
        var isRunning: Boolean = false
            private set

        @Volatile
        var vpnInterface: ParcelFileDescriptor? = null
            private set

        @JvmStatic
        fun getFd(): Int {
            return vpnInterface?.fd ?: -1
        }

        @JvmStatic
        fun protectSocket(fd: Int): Boolean {
            val s = instance ?: return false
            return s.protect(fd)
        }

        @JvmStatic
        fun startVpnService(context: Context) {
            try {
                val intent = Intent(context, AnticoreVpnService::class.java).apply {
                    action = ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Throwable) {
                Log.e(TAG, "startVpnService çağrısı başarısız: ${e.message}", e)
            }
        }

        @JvmStatic
        fun stopVpnService(context: Context) {
            try {
                val intent = Intent(context, AnticoreVpnService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (e: Throwable) {
                Log.e(TAG, "stopVpnService çağrısı başarısız: ${e.message}", e)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        if (action == ACTION_STOP) {
            stopVpnInternal()
            return START_NOT_STICKY
        }

        try {
            startForegroundServiceNotification()
            establishTunnel()
        } catch (e: Throwable) {
            Log.e(TAG, "onStartCommand başlatma hatası: ${e.message}", e)
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Anticore Ağ Koruması",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Anticore DPI Paket Filtreleme ve VPN Servisi"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun startForegroundServiceNotification() {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_MAIN
            addCategory(Intent.CATEGORY_LAUNCHER)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, AnticoreVpnService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Anticore Aktif")
            .setContentText("Ağ düzeyinde paket koruması ve DPI filtresi çalışıyor")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .addAction(0, "Durdur", stopPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Throwable) {
            Log.w(TAG, "startForeground başarısız, geriye dönük fallback deneniyor: ${e.message}")
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (fallbackError: Throwable) {
                Log.e(TAG, "startForeground fallback de başarısız oldu: ${fallbackError.message}", fallbackError)
            }
        }
    }

    private fun establishTunnel() {
        if (vpnInterface != null && isRunning) {
            Log.i(TAG, "VPN tüneli zaten kurulu, TUN fd yeniden bildiriliyor")
            vpnInterface?.let { AnticoreBridge.onTunReady(it.fd) }
            return
        }

        try {
            val builder = Builder()
                .setSession("Anticore")
                .setMtu(1500)
                .addAddress("10.10.10.10", 32)
                .addDnsServer("1.1.1.1")
                .addDnsServer("8.8.8.8")
                .addRoute("0.0.0.0", 0)

            // IPv6 desteği: rota ve DNS ekle (desteklenmeyen ağlarda sessizce devam et)
            try {
                builder.addAddress("fd00::1", 128)
                builder.addRoute("::", 0)
                builder.addDnsServer("2606:4700:4700::1111")
            } catch (e: Exception) {
                Log.w(TAG, "IPv6 tünel yapılandırması atlandı: ${e.message}")
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                builder.setMetered(false)
            }

            // Uygulamanın kendi dış soketlerinin döngüye girmemesi için paketi muaf tut
            try {
                builder.addDisallowedApplication(packageName)
            } catch (e: Exception) {
                Log.w(TAG, "addDisallowedApplication failed: ${e.message}")
            }

            val pfd = builder.establish()
            if (pfd == null) {
                Log.e(TAG, "VpnService.Builder.establish() null döndü")
                stopSelf()
                return
            }

            vpnInterface = pfd
            isRunning = true
            val fd = pfd.fd
            Log.i(TAG, "VPN tüneli başarıyla açıldı, TUN fd=$fd")

            val tun2socksConfig = """
                |misc:
                |  task-stack-size: 81920
                |tunnel:
                |  mtu: 1500
                |socks5:
                |  port: 10808
                |  address: 127.0.0.1
                |  udp: udp
            """.trimMargin("|")

            val configFile = File(cacheDir, "hevtunnel.yaml")
            configFile.writeText(tun2socksConfig)

            Log.i(TAG, "Starting hevtunnel with config: ${configFile.absolutePath} (fd=$fd)")
            try {
                TProxyService.TProxyStartService(configFile.absolutePath, fd)
                Log.i(TAG, "hevtunnel başarıyla başlatıldı")
            } catch (t: Throwable) {
                Log.e(TAG, "hevtunnel başlatma hatası: ${t.message}", t)
            }

            // TUN tanıtıcısını doğrudan yerel Rust motoruna aktar
            AnticoreBridge.onTunReady(fd)

            // Ekran kapalıyken veya uygulama arka plandayken CPU'nun uyutulmasını engelle
            try {
                val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
                wakeLock = powerManager?.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "Anticore::VpnWakeLock"
                )?.apply {
                    setReferenceCounted(false)
                    acquire()
                }
                Log.i(TAG, "WakeLock başarıyla alındı (Arka plan ve ekran kapalıyken kesintisiz çalışma aktif)")
            } catch (e: Throwable) {
                Log.w(TAG, "WakeLock edinme hatası: ${e.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "VPN tüneli kurulamadı: ${e.message}", e)
            stopSelf()
        }
    }

    private fun stopVpnInternal() {
        Log.i(TAG, "VPN tüneli durduruluyor...")
        isRunning = false

        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.i(TAG, "WakeLock serbest bırakıldı")
                }
            }
        } catch (e: Throwable) {
            Log.w(TAG, "WakeLock release hatası: ${e.message}")
        }
        wakeLock = null

        try {
            Log.i(TAG, "hevtunnel durduruluyor...")
            TProxyService.TProxyStopService()
        } catch (e: Throwable) {
            Log.w(TAG, "TProxyStopService hatası: ${e.message}")
        }

        try {
            File(cacheDir, "hevtunnel.yaml").delete()
        } catch (e: Throwable) {
            // sessiz
        }

        try {
            AnticoreBridge.onTunClosed()
        } catch (e: Exception) {
            Log.w(TAG, "onTunClosed callback hatası: ${e.message}")
        }

        try {
            vpnInterface?.close()
        } catch (e: Exception) {
            Log.w(TAG, "vpnInterface close hatası: ${e.message}")
        }
        vpnInterface = null

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        stopVpnInternal()
        if (instance == this) {
            instance = null
        }
        super.onDestroy()
    }
}
