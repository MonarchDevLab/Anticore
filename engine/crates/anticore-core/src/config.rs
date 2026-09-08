//! Blacklist (hedef domain listesi) yönetimi ve eşleşme.
//!
//! Format: satır başına bir domain; `#` yorum; boş satır atlanır.
//! Eşleşme suffix bazlıdır: "discord.com" -> "cdn.discord.com" da eşleşir.

use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Clone, Default)]
pub struct Blacklist {
    domains: HashSet<String>,
}

impl Blacklist {
    pub fn from_lines(text: &str) -> Self {
        let mut domains = HashSet::new();
        for line in text.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            // Olası önek temizliği ("*.example.com" -> "example.com")
            let d = line.trim_start_matches("*.").to_ascii_lowercase();
            if !d.is_empty() {
                domains.insert(d);
            }
        }
        Self { domains }
    }

    pub fn from_file(path: &Path) -> std::io::Result<Self> {
        let text = std::fs::read_to_string(path)?;
        Ok(Self::from_lines(&text))
    }

    /// SNI/Host değerinin listedeki herhangi bir domaine (veya alt alanına)
    /// denk gelip gelmediği.
    pub fn matches(&self, hostname: &[u8]) -> bool {
        let host = String::from_utf8_lossy(hostname).to_ascii_lowercase();
        if host.is_empty() {
            return false;
        }
        if self.domains.contains(&host) {
            return true;
        }
        // Alt alan kontrolü: a.b.discord.com -> b.discord.com -> discord.com
        let mut rest = host.as_str();
        while let Some(dot) = rest.find('.') {
            rest = &rest[dot + 1..];
            if self.domains.contains(rest) {
                return true;
            }
        }
        false
    }

    pub fn len(&self) -> usize {
        self.domains.len()
    }

    pub fn is_empty(&self) -> bool {
        self.domains.is_empty()
    }

    /// Tüm domainler (rastgele sıra).
    pub fn iter(&self) -> impl Iterator<Item = &String> {
        self.domains.iter()
    }
}

/// Türkiye ve küresel engelli siteler için genişletilmiş varsayılan hedef listesi.
pub const DEFAULT_BLACKLIST: &str = r#"# Anticore Varsayılan Hedef Listesi (Türkiye & Global Sansür Atlatma)

# --- Discord Ekosistemi ---
discord.com
gateway.discord.gg
cdn.discordapp.com
discordapp.net
discordapp.com
discord.gg
discord.media
discordstatus.com
media.discordapp.net
images-ext-1.discordapp.net
images-ext-2.discordapp.net
dis.gd

# --- Roblox Ekosistemi ---
roblox.com
rbxcdn.com
roblox.cn
setup.rbxcdn.com
api.roblox.com
assetdelivery.roblox.com
clientsettings.roblox.com
clientsettingscdn.roblox.com
versioncompatibility.api.roblox.com

# --- Wattpad & Yayıncılık ---
wattpad.com
wp-assets.emu.io
wattpad.net

# --- Ekşi Sözlük ve Aynaları ---
eksisozluk.com
eksisozluk1923.com
eksisozluk2023.com
eksisozluk42.com
eksisozluk111.com
eksisozluk.org

# --- Resim & Dosya Depolama ---
imgur.com
i.imgur.com
imgur.io
upload.ee

# --- Arşiv & Paste Servisleri ---
archive.org
web.archive.org
wayback.org
pastebin.com
ghostbin.com
justpaste.it

# --- Gizlilik, Mail & VPN Servisleri ---
proton.me
protonmail.com
protonvpn.com
mullvad.net
mullvad.com
nordvpn.com
surfshark.com
torproject.org
bridges.torproject.org
tailscale.com
wireguard.com

# --- Oyun, Akış ve Topluluk ---
steamcommunity.com
steampowered.com
geforcenow.com
nvidiagrid.net
kick.com
nyaa.si
nyaa.land
torrentfreak.com
1337x.to
thepiratebay.org
rutracker.org
fitgirl-repacks.site
dodi-repacks.site

# --- Sosyal Medya & Ağ ---
instagram.com
cdninstagram.com
threads.net

# --- Bağımsız Haber & Bilgi Kaynakları ---
dw.com
voaturkce.com
amerikaninsesi.com
artigercek.com
habersol.org.tr

# --- Yetişkin & Kısıtlı İçerik ---
pornhub.com
xvideos.com
xnxx.com
redtube.com
youporn.com
onlyfans.com
"#;


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_and_ignores_comments() {
        let bl = Blacklist::from_lines("# yorum\n\nexample.com\n*.foo.org\n");
        assert_eq!(bl.len(), 2);
    }

    #[test]
    fn suffix_matching_includes_subdomains() {
        let bl = Blacklist::from_lines("discord.com\n");
        assert!(bl.matches(b"discord.com"));
        assert!(bl.matches(b"cdn.discord.com"));
        assert!(bl.matches(b"a.b.c.discord.com"));
        assert!(!bl.matches(b"notdiscord.com"));
        assert!(!bl.matches(b"discord.com.evil.tld")); // son ek değil, ön ek tuzağı
    }

    #[test]
    fn empty_host_never_matches() {
        let bl = Blacklist::from_lines("discord.com\n");
        assert!(!bl.matches(b""));
    }
}
