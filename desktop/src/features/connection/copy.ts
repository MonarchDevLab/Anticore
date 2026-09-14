import type { Language } from "../../lib/i18n";

export type ConnectionCopy = {
  eyebrow: string; title: string; subtitle: string; engineControl: string;
  ready: string; active: string; unknown: string;
  readyHint: string; activeHint: string; unknownHint: string;
  start: string; stop: string; busy: string; local: string; noTunnel: string;
  profile: string; profileHint: string; profileLocked: string;
  configure: string; profileEmpty: string; retry: string; targets: string; targetHint: string; cycleTargets: string;
  check: string; checking: string; unchecked: string; emptyTargets: string; manageTargets: string;
  reachable: string; blocked: string; filtered: string; error: string; stale: string;
  activity: string; activityHint: string; noActivity: string; sampleWindow: string; paused: string; resume: string;
  seen: string; processed: string; uptime: string; speed: string; speedHint: string;
  diagnostics: string; diagnosticsHint: string; repair: string; repairHint: string;
  logs: string; allLogs: string; noLogs: string; dnsWarning: string; dnsInspect: string;
  device: string; engine: string; destination: string; pathLabel: string; details: string; loadError: string;
  workspace: string; tools: string; support: string; localEngine: string; standby: string; online: string; unavailable: string;
};

export const connectionCopy: Record<Language, ConnectionCopy> = {
  tr: {
    eyebrow: "ANTICORE / AĞ OPERASYONLARI", title: "Kontrol konsolu", subtitle: "Çekirdek, trafik ve erişim denetimi.", engineControl: "PAKET İŞLEME ÇEKİRDEĞİ",
    ready: "Çekirdek beklemede.", active: "Çekirdek devrede.", unknown: "Durum alınamıyor.",
    readyHint: "Profilini seç ve çekirdeği başlat. Hedef erişimini bağlantı testleriyle doğrula.",
    activeHint: "Paket işleme etkin. Hedef erişimini aşağıdaki testlerle doğrula.",
    unknownHint: "Masaüstü çekirdeğinden yanıt bekleniyor. Durum doğrulandığında bağlantı kontrolü açılır.",
    start: "Bağlantıyı başlat", stop: "Çekirdeği durdur", busy: "İşlem sürüyor…", local: "Yerel işleme", noTunnel: "VPN tüneli kullanmaz",
    profile: "Bağlantı profili", profileHint: "Ağında çalışan stratejiyi seç.", profileLocked: "Profil kilitli. Değiştirmek için çekirdeği durdur.",
    configure: "Profilleri yönet", profileEmpty: "Profil yüklenemedi", retry: "Tekrar dene", targets: "Erişim denetimi", targetHint: "Yasaklı servisler rotasyonu · TLS bağlantı testi", cycleTargets: "Farklı hedefleri göster",
    check: "Hedefleri test et", checking: "Test ediliyor…", unchecked: "Test edilmedi", emptyTargets: "Henüz hedef eklenmedi.", manageTargets: "Tüm hedefler",
    reachable: "Erişim açık", blocked: "DPI engeli (RST)", filtered: "Zaman aşımı (Drop)", error: "Ulaşılamadı", stale: "Önceki oturum sonucu",
    activity: "Paket etkinliği", activityHint: "İşlenen paketler / saniye", noActivity: "Henüz paket örneği yok", sampleWindow: "Son 30 örnek", paused: "Grafiği duraklat", resume: "Grafiği sürdür",
    seen: "Yakalanan", processed: "İşlenen", uptime: "Çalışma süresi", speed: "Paket telemetrisi", speedHint: "Paket sayısı aktarım hızını göstermez.",
    diagnostics: "Bağlantı testleri", diagnosticsHint: "Hedefleri ve profilleri karşılaştır.", repair: "Ağ onarımı", repairHint: "DNS ve bağlantı sorunlarını incele.",
    logs: "Son etkinlik", allLogs: "Günlükleri aç", noLogs: "Yeni çekirdek olayları burada görünür.", dnsWarning: "DNS yanıtında sorun bulundu", dnsInspect: "DNS durumunu incele",
    device: "Cihazın", engine: "Anticore", destination: "Hedef", pathLabel: "Paket işleme yolu", details: "Profilin teknik adımları", loadError: "Bağlantı bilgileri yüklenemedi.",
    workspace: "ÇALIŞMA ALANI", tools: "ARAÇLAR", support: "TERCİHLER", localEngine: "Yerel çekirdek", standby: "Beklemede", online: "Çalışıyor", unavailable: "Doğrulanamadı",
  },
  en: {
    eyebrow: "ANTICORE / NETWORK OPERATIONS", title: "Control console", subtitle: "Engine, traffic and access inspection.", engineControl: "PACKET PROCESSING ENGINE",
    ready: "Engine on standby.", active: "Engine engaged.", unknown: "Status unavailable.",
    readyHint: "Select a profile and start the engine. Verify target access with connection tests.",
    activeHint: "Packet processing is active. Verify target access with the tests below.",
    unknownHint: "Waiting for the desktop engine. Connection controls become available once status is verified.",
    start: "Start connection", stop: "Stop engine", busy: "Working…", local: "Local processing", noTunnel: "No VPN tunnel",
    profile: "Connection profile", profileHint: "Choose a strategy that works on your network.", profileLocked: "Stop the engine before changing profiles.",
    configure: "Manage profiles", profileEmpty: "Profiles unavailable", retry: "Try again", targets: "Access inspection", targetHint: "Rotating blocked services · TLS connection test", cycleTargets: "Rotate targets",
    check: "Test targets", checking: "Testing…", unchecked: "Not tested", emptyTargets: "No targets added yet.", manageTargets: "All targets",
    reachable: "Access open", blocked: "DPI blocked (RST)", filtered: "Timeout (Drop)", error: "Unreachable", stale: "Previous session result",
    activity: "Packet activity", activityHint: "Processed packets / second", noActivity: "No packet samples yet", sampleWindow: "Last 30 samples", paused: "Pause chart", resume: "Resume chart",
    seen: "Captured", processed: "Processed", uptime: "Uptime", speed: "Packet telemetry", speedHint: "Packet counts do not measure transfer speed.",
    diagnostics: "Connection tests", diagnosticsHint: "Compare targets and profiles.", repair: "Network repair", repairHint: "Inspect DNS and connection issues.",
    logs: "Recent activity", allLogs: "Open logs", noLogs: "New engine events appear here.", dnsWarning: "A problem was found in the DNS response", dnsInspect: "Inspect DNS status",
    device: "Your device", engine: "Anticore", destination: "Destination", pathLabel: "Packet processing path", details: "Profile technical steps", loadError: "Connection details could not be loaded.",
    workspace: "WORKSPACE", tools: "TOOLS", support: "PREFERENCES", localEngine: "Local engine", standby: "Standby", online: "Running", unavailable: "Unverified",
  },
  ru: {
    eyebrow: "ANTICORE / СЕТЕВЫЕ ОПЕРАЦИИ", title: "Консоль управления", subtitle: "Инспекция ядра, трафика и доступа.", engineControl: "ЯДРО ОБРАБОТКИ ПАКЕТОВ",
    ready: "Ядро в режиме ожидания.", active: "Ядро активно.", unknown: "Статус недоступен.",
    readyHint: "Выберите профиль и запустите ядро. Проверьте доступность тестами соединения.",
    activeHint: "Обработка пакетов активна. Проверьте доступность целями ниже.",
    unknownHint: "Ожидание ответа ядра. Управление соединением станет доступно после проверки.",
    start: "Запустить соединение", stop: "Остановить ядро", busy: "Выполняется…", local: "Локальная обработка", noTunnel: "Без VPN-туннеля",
    profile: "Профиль подключения", profileHint: "Выберите стратегию для вашей сети.", profileLocked: "Остановите ядро для смены профиля.",
    configure: "Управление профилями", profileEmpty: "Профили недоступны", retry: "Повторить", targets: "Проверка доступа", targetHint: "Ротация заблокированных сервисов · TLS тест", cycleTargets: "Сменить цели",
    check: "Проверить цели", checking: "Проверка…", unchecked: "Не проверено", emptyTargets: "Цели еще не добавлены.", manageTargets: "Все цели",
    reachable: "Доступ открыт", blocked: "DPI блокировка (RST)", filtered: "Таймаут (Drop)", error: "Недоступно", stale: "Результат прошлой сессии",
    activity: "Активность пакетов", activityHint: "Обработано пакетов / сек", noActivity: "Нет пакетов", sampleWindow: "Последние 30 отсчетов", paused: "График на паузе", resume: "Возобновить график",
    seen: "Перехвачено", processed: "Обработано", uptime: "Время работы", speed: "Телеметрия пакетов", speedHint: "Количество пакетов не отражает скорость передачи.",
    diagnostics: "Тесты соединения", diagnosticsHint: "Сравнить цели и профили.", repair: "Восстановление сети", repairHint: "Проверить DNS и проблемы сети.",
    logs: "Недавняя активность", allLogs: "Открыть логи", noLogs: "Новые события ядра появятся здесь.", dnsWarning: "Обнаружена проблема в ответе DNS", dnsInspect: "Проверить статус DNS",
    device: "Устройство", engine: "Anticore", destination: "Назначение", pathLabel: "Путь обработки пакетов", details: "Технические шаги профиля", loadError: "Не удалось загрузить данные соединения.",
    workspace: "РАБОЧАЯ ОБЛАСТЬ", tools: "ИНСТРУМЕНТЫ", support: "НАСТРОЙКИ", localEngine: "Локальное ядро", standby: "Ожидание", online: "Работает", unavailable: "Не подтверждено",
  },
  de: {
    eyebrow: "ANTICORE / NETZWERKOPERATIONEN", title: "Steuerungskonsole", subtitle: "Engine-, Verkehrs- und Zugriffsprüfung.", engineControl: "PAKETVERARBEITUNGS-ENGINE",
    ready: "Engine im Standby.", active: "Engine aktiv.", unknown: "Status nicht verfügbar.",
    readyHint: "Profil auswählen und Engine starten. Zielzugriff mit Verbindungstests prüfen.",
    activeHint: "Paketverarbeitung aktiv. Zielzugriff mit den unten stehenden Tests prüfen.",
    unknownHint: "Warten auf die Desktop-Engine. Steuerelemente werden nach Statusüberprüfung aktiv.",
    start: "Verbindung starten", stop: "Engine stoppen", busy: "In Bearbeitung…", local: "Lokale Verarbeitung", noTunnel: "Kein VPN-Tunnel",
    profile: "Verbindungsprofil", profileHint: "Wählen Sie eine funktionierende Strategie für Ihr Netzwerk.", profileLocked: "Stoppen Sie die Engine vor dem Profilwechsel.",
    configure: "Profile verwalten", profileEmpty: "Profile nicht verfügbar", retry: "Wiederholen", targets: "Zugriffsprüfung", targetHint: "Rotierende blockierte Dienste · TLS-Verbindungstest", cycleTargets: "Ziele wechseln",
    check: "Ziele testen", checking: "Wird getestet…", unchecked: "Nicht getestet", emptyTargets: "Noch keine Ziele hinzugefügt.", manageTargets: "Alle Ziele",
    reachable: "Zugriff frei", blocked: "DPI blockiert (RST)", filtered: "Zeitüberschreitung (Drop)", error: "Nicht erreichbar", stale: "Ergebnis der letzten Sitzung",
    activity: "Paketaktivität", activityHint: "Verarbeitete Pakete / Sekunde", noActivity: "Noch keine Pakete", sampleWindow: "Letzte 30 Abtastungen", paused: "Diagramm pausiert", resume: "Diagramm fortsetzen",
    seen: "Erfasst", processed: "Verarbeitet", uptime: "Betriebszeit", speed: "Pakettelemetrie", speedHint: "Paketzahlen spiegeln nicht die Übertragungsgeschwindigkeit wider.",
    diagnostics: "Verbindungstests", diagnosticsHint: "Ziele und Profile vergleichen.", repair: "Netzwerkreparatur", repairHint: "DNS- und Verbindungsprobleme analysieren.",
    logs: "Letzte Aktivität", allLogs: "Protokolle öffnen", noLogs: "Neue Engine-Ereignisse erscheinen hier.", dnsWarning: "Problem in der DNS-Antwort festgestellt", dnsInspect: "DNS-Status prüfen",
    device: "Ihr Gerät", engine: "Anticore", destination: "Ziel", pathLabel: "Paketverarbeitungspfad", details: "Technische Schritte des Profils", loadError: "Verbindungsdetails konnten nicht geladen werden.",
    workspace: "ARBEITSBEREICH", tools: "WERKZEUGE", support: "EINSTELLUNGEN", localEngine: "Lokale Engine", standby: "Standby", online: "Läuft", unavailable: "Nicht bestätigt",
  },
  fr: {
    eyebrow: "ANTICORE / OPÉRATIONS RÉSEAU", title: "Console de contrôle", subtitle: "Inspection du moteur, du trafic et des accès.", engineControl: "MOTEUR DE TRAITEMENT DES PAQUETS",
    ready: "Moteur en attente.", active: "Moteur actif.", unknown: "État indisponible.",
    readyHint: "Sélectionnez un profil et démarrez le moteur. Vérifiez l'accès aux cibles par les tests.",
    activeHint: "Traitement des paquets actif. Vérifiez l'accès aux cibles avec les tests ci-dessous.",
    unknownHint: "En attente du moteur de bureau. Les commandes s'activent une fois l'état vérifié.",
    start: "Démarrer la connexion", stop: "Arrêter le moteur", busy: "En cours…", local: "Traitement local", noTunnel: "Pas de tunnel VPN",
    profile: "Profil de connexion", profileHint: "Choisissez la stratégie adaptée à votre réseau.", profileLocked: "Arrêtez le moteur avant de changer de profil.",
    configure: "Gérer les profils", profileEmpty: "Profils indisponibles", retry: "Réessayer", targets: "Contrôle d'accès", targetHint: "Services bloqués tournants · Test de connexion TLS", cycleTargets: "Changer de cibles",
    check: "Tester les cibles", checking: "Test en cours…", unchecked: "Non testé", emptyTargets: "Aucune cible ajoutée.", manageTargets: "Toutes les cibles",
    reachable: "Accès ouvert", blocked: "DPI bloqué (RST)", filtered: "Délai dépassé (Drop)", error: "Inaccessible", stale: "Résultat session précédente",
    activity: "Activité des paquets", activityHint: "Paquets traités / seconde", noActivity: "Aucun paquet pour le moment", sampleWindow: "30 derniers échantillons", paused: "Graphique en pause", resume: "Reprendre le graphique",
    seen: "Capturés", processed: "Traités", uptime: "Temps de fonctionnement", speed: "Télémétrie paquets", speedHint: "Le nombre de paquets ne reflète pas la vitesse de transfert.",
    diagnostics: "Tests de connexion", diagnosticsHint: "Comparer les cibles et profils.", repair: "Réparation réseau", repairHint: "Analyser les problèmes DNS et réseau.",
    logs: "Activité récente", allLogs: "Ouvrir les journaux", noLogs: "Les nouveaux événements du moteur apparaîtront ici.", dnsWarning: "Un problème a été détecté dans la réponse DNS", dnsInspect: "Examiner l'état DNS",
    device: "Votre appareil", engine: "Anticore", destination: "Destination", pathLabel: "Chemin de traitement", details: "Étapes techniques du profil", loadError: "Impossible de charger les détails de connexion.",
    workspace: "ESPACE DE TRAVAIL", tools: "OUTILS", support: "PRÉFÉRENCES", localEngine: "Moteur local", standby: "En attente", online: "En cours", unavailable: "Non vérifié",
  },
};
