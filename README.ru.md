<div align="center">

<p align="center">
  <img src="assets/banner.svg?v=0.3.9" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

<p align="center">
  <img src="assets/anticore-3d-logo-transparent.png" alt="ANTICORE 3D Tactical Shield Emblem" width="150" />
</p>

# ANTICORE

### Высокопроизводительный комплекс обхода DPI и восстановления свободы сети для Windows и macOS без потери скорости

[![Версия](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Загрузки](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Платформы](https://img.shields.io/badge/Платформа-Windows%20%7C%20macOS%20%7C%20Android-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Ядро](https://img.shields.io/badge/Ядро-WinDivert%20%2B%20macOS%20UTUN-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Интерфейс](https://img.shields.io/badge/Интерфейс-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Тесты](https://img.shields.io/badge/Тесты-72%20Пройдено-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Безопасность](https://img.shields.io/badge/Защита-Zero%20Leakage%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Подпись](https://img.shields.io/badge/Подпись-Minisign%20Verified-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Лицензия](https://img.shields.io/badge/Лицензия-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

<p align="center">
  <a href="README.md"><img src="assets/languages/badge-tr.svg" alt="Türkçe" height="28" /></a>&nbsp;
  <a href="README.en.md"><img src="assets/languages/badge-en.svg" alt="English" height="28" /></a>&nbsp;
  <a href="README.ru.md"><img src="assets/languages/badge-ru.svg" alt="Русский" height="28" /></a>&nbsp;
  <a href="README.de.md"><img src="assets/languages/badge-de.svg" alt="Deutsch" height="28" /></a>&nbsp;
  <a href="README.fr.md"><img src="assets/languages/badge-fr.svg" alt="Français" height="28" /></a>
</p>

<br />

**Локальный сетевой движок нового поколения для обхода систем глубокого анализа пакетов (DPI) и сетевых блокировок интернет-провайдеров (ТСПУ / DPI). Работает полностью на вашем устройстве без перенаправления трафика через сторонние прокси или VPN-серверы, сохраняя 100% пропускной способности канала и минимальный пинг.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#варианты-загрузки-v039"><img src="https://img.shields.io/badge/01-ДИСТРИБУТИВЫ-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Дистрибутивы" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#что-такое-anticore"><img src="https://img.shields.io/badge/02-АРХИТЕКТУРА-20f2ff?style=for-the-badge&labelColor=08090D" alt="02 Архитектура" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#ключевые-возможности"><img src="https://img.shields.io/badge/03-ВОЗМОЖНОСТИ-FFE600?style=for-the-badge&labelColor=08090D" alt="03 Возможности" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#принцип-работы"><img src="https://img.shields.io/badge/04-ПРИНЦИП_РАБОТЫ-FF7733?style=for-the-badge&labelColor=08090D" alt="04 Принцип работы" /></a>
    </td>
  </tr>
  <tr>
    <td width="25%" align="center">
      <a href="#тактики-обхода-dpi"><img src="https://img.shields.io/badge/05-ТАКТИКИ_DPI-20ffa0?style=for-the-badge&labelColor=08090D" alt="05 Тактики DPI" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#сравнение-с-аналогами"><img src="https://img.shields.io/badge/06-СРАВНЕНИЕ-20f2ff?style=for-the-badge&labelColor=08090D" alt="06 Сравнение" /></a>
    </td>
    <td width="25%" align="center">
      <a href="#часто-задаваемые-вопросы"><img src="https://img.shields.io/badge/07-FAQ_ВОПРОСЫ-FFE600?style=for-the-badge&labelColor=08090D" alt="07 FAQ" /></a>
    </td>
    <td width="25%" align="center">
      <a href="README.md"><img src="https://img.shields.io/badge/TR-TÜRKÇE_KILAVUZ-FFFFFF?style=for-the-badge&labelColor=08090D" alt="TR Guide" /></a>
    </td>
  </tr>
</table>

</div>

---

## Варианты загрузки (v0.3.9)

Все бинарные сборки скомпилированы напрямую из исходного кода, очищены от путей сборки (Zero Leakage) и подписаны цифровой подписью Minisign.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_EXE-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Портативная версия (EXE)</b><br />
        <small>Запуск без установки из любой папки или USB-накопителя. Не вносит изменений в системный реестр.</small>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/02-SETUP_EXE-20f2ff?style=for-the-badge&labelColor=08090D" alt="Setup EXE" /><br /><br />
        <b>Инсталлятор NSIS (EXE)</b><br />
        <small>Ярлыки в меню «Пуск» и на рабочем столе, интеграция автообновлений и корректное удаление.</small>
      </th>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/03-MSI_ENTERPRISE-FFE600?style=for-the-badge&labelColor=08090D" alt="MSI Enterprise" /><br /><br />
        <b>Корпоративный пакет (MSI)</b><br />
        <small>Для централизованного развертывания через Active Directory GPO, Microsoft Intune и SCCM.</small>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore.exe"><img src="https://img.shields.io/badge/СКАЧАТЬ_.EXE-17.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Скачать EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64-setup.exe"><img src="https://img.shields.io/badge/СКАЧАТЬ_.EXE-4.79_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Скачать EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64_en-US.msi"><img src="https://img.shields.io/badge/СКАЧАТЬ_.MSI-6.88_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Скачать MSI" /></a>
      </td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/АРХИТЕКТУРА-x64_%E2%80%A2_БЕЗ_СЛЕДОВ-20ffa0?style=flat-square&labelColor=08090D" alt="x64 Portable" />
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/АРХИТЕКТУРА-x64_%E2%80%A2_АВТООБНОВЛЕНИЕ-20f2ff?style=flat-square&labelColor=08090D" alt="x64 OTA" />
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/АРХИТЕКТУРА-x64_%E2%80%A2_GPO_INTUNE-FFE600?style=flat-square&labelColor=08090D" alt="x64 MSI" />
      </td>
    </tr>
    <tr>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(17.6_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64-setup.exe"><img src="https://img.shields.io/badge/SETUP_ИНСТАЛЛЯТОР-Anticore__0.3.9__x64--setup.exe-20f2ff?style=flat-square&labelColor=08090D" alt="Setup" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/АРХИВ-Все_релизы_GitHub-FFFFFF?style=flat-square&labelColor=08090D" alt="Все релизы" /></a>
      </td>
    </tr>
  </tbody>
</table>

### Мобильная станция Android (v0.3.9)

Нативный клиент обхода DNS и DPI для Android (API 26 / Android 8.0+):

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/01-ANDROID_APK-20ffa0?style=for-the-badge&labelColor=08090D" alt="Android APK" /><br /><br />
        <b>Универсальный пакет APK</b><br />
        <small>Поддержка архитектур ARM64 (aarch64), ARMv7 и x86_64.</small>
      </th>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/02-МОБИЛЬНАЯ_БЕЗОПАСНОСТЬ-20f2ff?style=for-the-badge&labelColor=08090D" alt="Мобильная безопасность" /><br /><br />
        <b>Без Root и Локальная обработка</b><br />
        <small>Не требует Root-прав; обходит блокировки оператора непосредственно на устройстве через локальный туннель.</small>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore-v0.3.9.apk"><img src="https://img.shields.io/badge/СКАЧАТЬ_.APK-Universal_(Android_8.0+)-20ffa0?style=for-the-badge&labelColor=08090D" alt="Скачать APK" /></a>
      </td>
      <td align="center" valign="middle">
        <img src="https://img.shields.io/badge/БЕЗОПАСНОСТЬ-БЕЗ_ROOT_%E2%80%A2_ZERO_LOG-20f2ff?style=flat-square&labelColor=08090D" alt="Без Root" />
      </td>
    </tr>
  </tbody>
</table>

<br />

### macOS Сборки (Apple Silicon & Intel)

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/APPLE_SILICON-M1_/_M2_/_M3_/_M4-20ffa0?style=for-the-badge&labelColor=08090D" alt="Apple Silicon" /><br /><br />
        <b>Пакеты для Apple Silicon (arm64)</b>
      </th>
      <th width="50%" align="center">
        <img src="https://img.shields.io/badge/INTEL_MAC-x86__64-20f2ff?style=for-the-badge&labelColor=08090D" alt="Intel Mac" /><br /><br />
        <b>Пакеты для Intel Mac (x64)</b>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_arm64.pkg"><img src="https://img.shields.io/badge/ИНСТАЛЛЯТОР_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_aarch64.dmg"><img src="https://img.shields.io/badge/ОБРАЗ_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64.pkg"><img src="https://img.shields.io/badge/ИНСТАЛЛЯТОР_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.9/Anticore_0.3.9_x64.dmg"><img src="https://img.shields.io/badge/ОБРАЗ_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
      </td>
    </tr>
  </tbody>
</table>

#### Быстрая установка macOS в одну строку (Терминал)
```bash
curl -fsSL https://raw.githubusercontent.com/MonarchDevLab/Anticore/main/scripts/macos-quick-install.sh | bash
```

---

## Таблица криптографических контрольных сумм (SHA-256)

| Файл дистрибутива | Размер | Контрольная сумма SHA-256 |
|---|---|---|
| `Anticore_0.3.9_x64-setup.exe` | 4.79 MB | `71E8339C74E0A88ED914FA88904B65AB91480D92328D2D7597E33F86A7AB4154` |
| `Anticore.exe` | 17.58 MB | `7DB1FABC148190FA35E00BB3875E2D7946C9FC841775148C38C3655C1BB63B4B` |
| `Anticore_0.3.9_x64_en-US.msi` | 6.88 MB | `5354DEAD398E1BD2CCBAC567D75BF05818F37CA633C9E89B2F5810DB91D45AD0` |
| `Anticore_0.3.9_x64-portable.zip` | 6.77 MB | `9E42DCD01342E75399F051EFDF9F013DCF8E3027AEE91F409608E20C79F25517` |
| `Anticore-v0.3.9.apk` (Android) | 47.40 MB | `8FC1775A54B7F0632ABC0B30C4133C62FB6CD6A6732D299BDE4C9703EC93E278` |
| `Anticore_0.3.9_arm64.pkg` | 6.69 MB | `752645914DA7DB08CCA4C3FA278C9269FD4CC8E75DF61FAB8B31D7A7CFC4A67E` |
| `Anticore_0.3.9_aarch64.dmg` | 6.67 MB | `3718950D281A3ADB3338E2B6D6B6C37BCFBA400C73BBB22C7D3E01A04855E0CA` |
| `Anticore_0.3.9_x64.pkg` | 6.99 MB | `BB3E7ED3B1CEC5F875B23D2369820BB3C43269FF9AEC19707E4794197205F4D3` |
| `Anticore_0.3.9_x64.dmg` | 6.93 MB | `EF6FE6B305AAA66ECEADF362B65B89F77F62BBF0D5A4616A473548774CE3E60E` |

---

## Что такое Anticore?

Anticore — это локальный программный комплекс обхода систем фильтрации и инспекции трафика (DPI), написанный на **Rust** с графическим интерфейсом на **Tauri 2.0 + React 19**.

### Чем Anticore отличается от VPN и Прокси?
- **VPN:** Направляет весь ваш трафик на удаленный сервер в другой стране. Это увеличивает пинг (latency), режет скорость канала и делает вас зависимым от надежности чужого сервера.
- **Anticore:** Не использует удаленные серверы. Пакеты модифицируются прямо в сетевом стеке операционной системы (через драйвер ядра WinDivert в Windows и интерфейс UTUN/pfctl в macOS). DPI-комплекс провайдера не может распознать запрашиваемый домен (SNI) или сбрасывает проверку из-за фрагментации, а целевой веб-сервер собирает пакеты обратно без каких-либо искажений.

---

## Ключевые возможности

1. **Многоуровневая фрагментация пакетов:** Разделение TLS ClientHello на уровне SNI (SNI Mid Split), смещение заголовков HTTP, OOB (Out-Of-Band) байты.
2. **Пассивная защита от RST:** Блокировка и подавление поддельных пакетов `TCP RST`, вводимых провайдером для сброса соединения.
3. **Блокировка QUIC (UDP 443):** Принудительный перевод веб-браузеров на TCP TLS 1.3 для предотвращения «черного экрана» при воспроизведении видео.
4. **Раздача на устройства в локальной сети (LAN Share & Proxy):** Проксирование на порту `10808` для консолей (PlayStation, Xbox, Nintendo Switch) и смартфонов (iOS, Android). Включает встроенный отказоустойчивый DNS-резолвер (Cloudflare 1.1.1.1 / Google 8.8.8.8) для защиты от DNS-спуфинга.
5. **Встроенный центр обратной связи:** Возможность отправки отчетов о недоступных сайтах или предложений прямо из интерфейса приложения.
6. **Полная многоязычность:** Поддержка 5 языков (Русский, Английский, Турецкий, Немецкий, Французский).

---

## Принцип работы

```
[ Браузер ]
    │
    ▼ (TCP / TLS ClientHello: blocked-site.com)
[ Ядро Anticore (WinDivert / UTUN) ]
    │  ──► Фрагментация SNI: ["blo", "cked-site.com"]
    │  ──► Fake TTL / Bad Checksum инъекция
    │  ──► Подавление поддельных RST
    ▼
[ Сетевая карта ] ──────────► [ DPI провайдера ] ──────────► [ Сервер сайта ]
                              (Не видит SNI,                  (Собирает TCP поток,
                               пропускает пакет)               открывает страницу)
```

---

## Лицензия и правовая информация

Проект распространяется под открытой лицензией MIT.
Все права на код и архитектуру принадлежат **Monolith Works**. Публикация осуществляется через организацию **MonarchDevLab**.
