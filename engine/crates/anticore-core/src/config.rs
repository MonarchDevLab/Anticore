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

/// Türkiye ve küresel erişim kısıtlaması uygulanan siteler için genişletilmiş varsayılan hedef listesi.
pub const DEFAULT_BLACKLIST: &str = r#"# Anticore Varsayılan Hedef Listesi (Erişim Kısıtlı & DPI Filtreli Alan Adları)

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

# --- Yetişkin & Kısıtlı İçerik ve Video CDN'leri ---
pornhub.com
phncdn.com
phprcdn.com
rncdn7.com
pornhubpremium.com
modelhub.com
trafficjunky.com
trafficjunky.net
ptncdn.com
brazzers.com
brazzers-cdn.com
realitykings.com
mofos.com
babes.com

xvideos.com
xvideos2.com
xvideos3.com
xvideos-cdn.com
xv-cdn.com
xvideos.es
static-assets-xv.com

xnxx.com
xnxx2.com
xnxx3.com
xnxx-cdn.com
xnxx.tv

xhamster.com
xhamster2.com
xhamster3.com
xhamsterlive.com
xhamster.desi
xhcdn.com

redtube.com
redtube.net
rdtcdn.com
youporn.com
ypncdn.com
youporn.ph

spankbang.com
spankbang.party
sb-cd.com

stripchat.com
stripcdn.com
strpcdn.com

chaturbate.com
cbimg.org

eporner.com
eporner-cdn.com

beeg.com
tube8.com
porn.com
hqporner.com
heavy-r.com
motherless.com
bravotube.net
erome.com
erome-cdn.com

onlyfans.com
of-media.com
onlyfans-media.com
fansly.com
fanslycdn.com
coomer.party
coomer.su
kemono.party
kemono.su

rule34.xxx
rule34.paheal.net
e-hentai.org
exhentai.org
nhentai.net
gelbooru.com
danbooru.donmai.us
civitai.com
civitai.work
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
        assert!(bl.matches(b"cdn.discordapp.com") == false); // farklı kök
        assert!(bl.matches(b"cdn.discord.com"));
        assert!(bl.matches(b"a.b.c.discord.com"));
        assert!(!bl.matches(b"notdiscord.com"));
        assert!(!bl.matches(b"discord.com.evil.tld")); // son ek değil, ön ek tuzağı
    }

    #[test]
    fn video_cdn_matching_covers_streaming_subdomains() {
        let bl = Blacklist::from_lines(DEFAULT_BLACKLIST);
        // Pornhub & MindGeek video CDNs
        assert!(bl.matches(b"pornhub.com"));
        assert!(bl.matches(b"www.pornhub.com"));
        assert!(bl.matches(b"phncdn.com"));
        assert!(bl.matches(b"ci.phncdn.com"));
        assert!(bl.matches(b"ev.phncdn.com"));
        assert!(bl.matches(b"ei.phncdn.com"));
        assert!(bl.matches(b"di.phncdn.com"));
        assert!(bl.matches(b"ev.phncdn.com.lds.rncdn7.com"));
        assert!(bl.matches(b"rncdn7.com"));

        // XVideos & XNXX video CDNs
        assert!(bl.matches(b"xvideos.com"));
        assert!(bl.matches(b"xvideos-cdn.com"));
        assert!(bl.matches(b"cdn77-vid.xvideos-cdn.com"));
        assert!(bl.matches(b"img-egc.xvideos-cdn.com"));
        assert!(bl.matches(b"xv-cdn.com"));
        assert!(bl.matches(b"hls.xv-cdn.com"));
        assert!(bl.matches(b"xnxx.com"));
        assert!(bl.matches(b"xnxx-cdn.com"));

        // XHamster & Stripchat & SpankBang CDNs
        assert!(bl.matches(b"xhamster.com"));
        assert!(bl.matches(b"xhcdn.com"));
        assert!(bl.matches(b"ic-vt-n0.xhcdn.com"));
        assert!(bl.matches(b"spankbang.com"));
        assert!(bl.matches(b"sb-cd.com"));
        assert!(bl.matches(b"sp.sb-cd.com"));
        assert!(bl.matches(b"stripchat.com"));
        assert!(bl.matches(b"stripcdn.com"));
        assert!(bl.matches(b"img.stripcdn.com"));
        assert!(bl.matches(b"eporner.com"));
        assert!(bl.matches(b"eporner-cdn.com"));
    }

    #[test]
    fn empty_host_never_matches() {
        let bl = Blacklist::from_lines("discord.com\n");
        assert!(!bl.matches(b""));
    }
}
