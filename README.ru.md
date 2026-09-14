<div align="center">

<p align="center">
  <img src="assets/banner.svg" alt="ANTICORE - Zero-Loss DPI Circumvention Suite" width="100%" style="max-width: 880px;" />
</p>

# ANTICORE

### Высокопроизводительный комплекс обхода DPI и восстановления свободы сети для Windows и macOS без потери скорости

[![Версия](https://img.shields.io/github/v/release/MonarchDevLab/Anticore?style=for-the-badge&color=20ffa0&labelColor=08090D&logo=github)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Загрузки](https://img.shields.io/github/downloads/MonarchDevLab/Anticore/total?style=for-the-badge&color=20f2ff&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Платформы](https://img.shields.io/badge/Платформа-Windows%20%7C%20macOS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Ядро](https://img.shields.io/badge/Ядро-WinDivert%20%2B%20macOS%20UTUN-FF2A4D?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Интерфейс](https://img.shields.io/badge/Интерфейс-Tauri%202.0%20%2B%20React%2019-FFE600?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Тесты](https://img.shields.io/badge/Тесты-72%20Пройдено-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Безопасность](https://img.shields.io/badge/Защита-Zero%20Leakage%20PASS-20f2ff?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore)
[![Подпись](https://img.shields.io/badge/Подпись-Minisign%20Verified-20ffa0?style=for-the-badge&labelColor=08090D)](https://github.com/MonarchDevLab/Anticore/releases/latest)
[![Лицензия](https://img.shields.io/badge/Лицензия-MIT-FFFFFF?style=for-the-badge&labelColor=08090D)](LICENSE)

<br />

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/Türkçe-00FF9D?style=for-the-badge&labelColor=0C1017" alt="Türkçe" /></a>&nbsp;
  <a href="README.en.md"><img src="https://img.shields.io/badge/English-00E5FF?style=for-the-badge&labelColor=0C1017" alt="English" /></a>&nbsp;
  <a href="README.ru.md"><img src="https://img.shields.io/badge/Русский-FFE600?style=for-the-badge&labelColor=0C1017" alt="Русский" /></a>&nbsp;
  <a href="README.de.md"><img src="https://img.shields.io/badge/Deutsch-FF7733?style=for-the-badge&labelColor=0C1017" alt="Deutsch" /></a>&nbsp;
  <a href="README.fr.md"><img src="https://img.shields.io/badge/Français-FF2A55?style=for-the-badge&labelColor=0C1017" alt="Français" /></a>
</p>

<p align="center">
  <b><a href="README.md">Türkçe</a></b> &bull;
  <b><a href="README.en.md">English</a></b> &bull;
  <b><a href="README.ru.md">Русский</a></b> &bull;
  <b><a href="README.de.md">Deutsch</a></b> &bull;
  <b><a href="README.fr.md">Français</a></b>
</p>

<br />

**Локальный сетевой движок нового поколения для обхода систем глубокого анализа пакетов (DPI) и сетевых блокировок интернет-провайдеров (ТСПУ / DPI). Работает полностью на вашем устройстве без перенаправления трафика через сторонние прокси или VPN-серверы, сохраняя 100% пропускной способности канала и минимальный пинг.**

<br />

<table width="100%" align="center">
  <tr>
    <td width="25%" align="center">
      <a href="#варианты-загрузки-v036"><img src="https://img.shields.io/badge/01-ДИСТРИБУТИВЫ-20ffa0?style=for-the-badge&labelColor=08090D" alt="01 Дистрибутивы" /></a>
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

## Варианты загрузки (v0.3.6)

Все бинарные сборки скомпилированы напрямую из исходного кода, очищены от путей сборки (Zero Leakage) и подписаны цифровой подписью Minisign.

<table width="100%" align="center">
  <thead>
    <tr>
      <th width="33.3%" align="center">
        <img src="https://img.shields.io/badge/01-PORTABLE_ZIP-20ffa0?style=for-the-badge&labelColor=08090D" alt="Portable" /><br /><br />
        <b>Портативная версия (ZIP)</b><br />
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64-portable.zip"><img src="https://img.shields.io/badge/СКАЧАТЬ_.ZIP-6.6_MB-20ffa0?style=for-the-badge&labelColor=08090D" alt="Скачать ZIP" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64-setup.exe"><img src="https://img.shields.io/badge/СКАЧАТЬ_.EXE-4.6_MB-20f2ff?style=for-the-badge&labelColor=08090D" alt="Скачать EXE" /></a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64_en-US.msi"><img src="https://img.shields.io/badge/СКАЧАТЬ_.MSI-6.5_MB-FFE600?style=for-the-badge&labelColor=08090D" alt="Скачать MSI" /></a>
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore.exe"><img src="https://img.shields.io/badge/STANDALONE-Anticore.exe_(16.2_MB)-20ffa0?style=flat-square&labelColor=08090D" alt="Anticore.exe" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/anticore-cli.exe"><img src="https://img.shields.io/badge/CLI_ДВИЖОК-anticore--cli.exe_(385_KB)-20f2ff?style=flat-square&labelColor=08090D" alt="anticore-cli" /></a>
      </td>
      <td align="center" bgcolor="#161b22">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/latest"><img src="https://img.shields.io/badge/АРХИВ-Все_релизы_GitHub-FFFFFF?style=flat-square&labelColor=08090D" alt="Все релизы" /></a>
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
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_arm64.pkg"><img src="https://img.shields.io/badge/ИНСТАЛЛЯТОР_.PKG-arm64-20ffa0?style=for-the-badge&labelColor=08090D" alt="arm64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_aarch64.dmg"><img src="https://img.shields.io/badge/ОБРАЗ_.DMG-arm64-20f2ff?style=for-the-badge&labelColor=08090D" alt="arm64 DMG" /></a>
      </td>
      <td align="center">
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64.pkg"><img src="https://img.shields.io/badge/ИНСТАЛЛЯТОР_.PKG-x64-20ffa0?style=for-the-badge&labelColor=08090D" alt="x64 PKG" /></a>&nbsp;
        <a href="https://github.com/MonarchDevLab/Anticore/releases/download/v0.3.6/Anticore_0.3.6_x64.dmg"><img src="https://img.shields.io/badge/ОБРАЗ_.DMG-x64-20f2ff?style=for-the-badge&labelColor=08090D" alt="x64 DMG" /></a>
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
| `Anticore_0.3.6_x64-setup.exe` | 4.6 MB | `D4EF2CCA302D4845B49F8F3ED80EFEA28C1F3C8547B9A7B5A317FC72C47CA143` |
| `Anticore_0.3.6_x64-portable.zip` | 6.6 MB | `0964590824FFF5ADFAE04A092F6A5DADA3B76BA1C88B2BF8D984FC98CD87D43A` |
| `Anticore_0.3.6_x64_en-US.msi` | 6.5 MB | `123D83C2A3BE387FE90165602B895B4B2B47E0754EB44F68D63FBF704EB9A9B0` |
| `Anticore.exe` | 16.2 MB | `1234215E55C61CAE9836D6EEF0CBE3725702B7BAB3A3FF050699BD70B3BBB676` |
| `anticore-cli.exe` | 385 KB | `D8D60AEA2FB5A0B2C4EF7FAC7C810A2C49471CE19FA6D4FD499C430E180E0163` |
| `Anticore_0.3.6_arm64.pkg` | 5.8 MB | `A2FB220E4F9C5ECD1109C977903E21FFA16DE5A24B098EF823A8C801B18F837C` |
| `Anticore_0.3.6_aarch64.dmg` | 6.2 MB | `B774324462FA35C9A1B3B2B76BFA2976CE705D174A3CB611C64343D4E2A4152F` |
| `Anticore_0.3.6_x64.pkg` | 6.4 MB | `2EA284E231E7FE4F3A665E40A0E45B2BB8CA534FF430229DC6BF8C1EC73CBBD0` |
| `Anticore_0.3.6_x64.dmg` | 6.8 MB | `2026542CB88BDB22CAE8A6FCC81F1BF38A6B1EA42C2ECF066979890AB7144946` |

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
