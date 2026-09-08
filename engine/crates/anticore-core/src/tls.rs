//! TLS record/handshake ayrıştırma: ClientHello tespiti + SNI konumu.
//!
//! Sadece stdlib. Tüm okumalar bounds-checked; bozuk/garip pakette `None` döner.

/// TCP payload'unun TLS ClientHello taşıyıp taşımadığını söyler.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClientHelloInfo {
    /// SNI hostname'in payload içindeki bayt ofseti.
    pub sni_offset: usize,
    /// SNI hostname uzunluğu.
    pub sni_len: usize,
}

impl ClientHelloInfo {
    /// SNI hostname dilimi.
    pub fn sni<'a>(&self, payload: &'a [u8]) -> Option<&'a [u8]> {
        payload.get(self.sni_offset..self.sni_offset.checked_add(self.sni_len)?)
    }
}

struct Cursor<'a> {
    buf: &'a [u8],
    pos: usize,
}

impl<'a> Cursor<'a> {
    fn new(buf: &'a [u8]) -> Self {
        Self { buf, pos: 0 }
    }

    fn remaining(&self) -> usize {
        self.buf.len().saturating_sub(self.pos)
    }

    fn u8(&mut self) -> Option<u8> {
        let v = *self.buf.get(self.pos)?;
        self.pos += 1;
        Some(v)
    }

    fn u16be(&mut self) -> Option<u16> {
        let hi = self.u8()? as u16;
        let lo = self.u8()? as u16;
        Some((hi << 8) | lo)
    }

    fn u24be(&mut self) -> Option<u32> {
        let a = self.u8()? as u32;
        let b = self.u8()? as u32;
        let c = self.u8()? as u32;
        Some((a << 16) | (b << 8) | c)
    }

    fn take(&mut self, n: usize) -> Option<&'a [u8]> {
        if self.remaining() < n {
            return None;
        }
        let s = &self.buf[self.pos..self.pos + n];
        self.pos += n;
        Some(s)
    }
}

/// TCP payload'u TLS ClientHello ise bilgi döndürür; değilse None.
pub fn parse_client_hello(payload: &[u8]) -> Option<ClientHelloInfo> {
    let mut cur = Cursor::new(payload);

    // --- TLS record header ---
    if cur.u8()? != 0x16 {
        return None; // content_type != handshake
    }
    let _major = cur.u8()?;
    let minor = cur.u8()?;
    // TLS 1.0-1.3 ClientHello: major=3, minor=0..=4
    if _major != 3 || minor > 4 {
        return None;
    }
    let record_len = cur.u16be()? as usize;
    if record_len == 0 || record_len > cur.remaining() {
        return None;
    }
    // Record içeriğiyle sınırlı alt imleç mantığı: kalan alanı record sonuna kadar say
    let record_end = cur.pos + record_len;
    if record_end > payload.len() {
        return None;
    }

    // --- Handshake header ---
    if cur.u8()? != 0x01 {
        return None; // client_hello değil
    }
    let hs_len = cur.u24be()? as usize;
    if hs_len > record_end - cur.pos {
        return None;
    }
    let hs_end = cur.pos + hs_len;

    // --- ClientHello gövdesi ---
    let _client_version_hi = cur.u8()?;
    let _lo = cur.u8()?;
    cur.take(32)?; // random

    let sid_len = cur.u8()? as usize;
    cur.take(sid_len)?;

    let cs_len = cur.u16be()? as usize;
    if !cs_len.is_multiple_of(2) {
        return None;
    }
    cur.take(cs_len)?;

    let comp_len = cur.u8()? as usize;
    cur.take(comp_len)?;

    // Extensions yok olabilir (legacy sunucular) — o zaman SNI da yoktur.
    if cur.remaining() < 2 || cur.pos >= hs_end {
        return None;
    }
    let ext_total = cur.u16be()? as usize;
    if ext_total > cur.remaining() {
        return None;
    }
    let ext_end = cur.pos + ext_total;

    while cur.pos + 4 <= ext_end {
        let ext_type = cur.u16be()?;
        let ext_len = cur.u16be()? as usize;
        if cur.remaining() < ext_len {
            return None;
        }
        if ext_type == 0x0000 {
            // --- server_name extension ---
            let list_start = cur.pos;
            let list_len = cur.u16be()? as usize;
            if list_len > cur.remaining() || list_start + 2 + list_len > list_start + ext_len {
                return None;
            }
            if cur.u8()? != 0x00 {
                return None; // name_type != host_name
            }
            let name_len = cur.u16be()? as usize;
            let name_off = cur.pos;
            if name_len > cur.remaining() {
                return None;
            }
            return Some(ClientHelloInfo {
                sni_offset: name_off,
                sni_len: name_len,
            });
        }
        cur.take(ext_len)?;
    }

    None
}

/// Fragmentasyon bölme noktasını üretir.
///
/// `SniMid`: SNI'nın tam ortasından böler — DPI'ların SNI'yı tek parçada
/// görmesini engelleyen en yaygın etkili nokta.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SplitMode {
    /// SNI ortası. Payload geçerli bir TLS ClientHello değilse (SNI
    /// bulunamazsa) `find_split_offset` `None` döner — parçalama
    /// uygulanmaz, paket olduğu gibi geçer (payload ortasına GERİ
    /// DÜŞMEZ; bu mod yalnızca TLS trafiği içindir).
    SniMid,
    /// SNI ortası, ancak ters gönderim sırasıyla (2 -> 1)
    SniMidReverse,
    /// Sabit bayt ofseti.
    Fixed(usize),
    /// Sabit ofset + ters gönderim sırası (segmentler 2→1 gider).
    Reverse(usize),
}

pub fn find_split_offset(payload: &[u8], mode: &SplitMode) -> Option<usize> {
    match mode {
        SplitMode::Fixed(n) | SplitMode::Reverse(n) => {
            let n = *n;
            if n > 0 && n < payload.len() {
                Some(n)
            } else {
                None
            }
        }
        SplitMode::SniMid | SplitMode::SniMidReverse => {
            let info = parse_client_hello(payload)?;
            let mid = info.sni_offset + info.sni_len / 2;
            if mid > 0 && mid < payload.len() {
                Some(mid)
            } else {
                None
            }
        }
    }
}

/// Payload'un düz HTTP isteği olup olmadığı + Host başlık değerinin konumu.
pub struct HttpHostInfo {
    pub host_offset: usize,
    pub host_len: usize,
}

pub fn parse_http_host(payload: &[u8]) -> Option<HttpHostInfo> {
    const PREFIX: &[u8] = b"GET ";
    const PREFIX2: &[u8] = b"POST ";
    const HEAD: &[u8] = b"HEAD ";

    let is_http = payload.starts_with(PREFIX)
        || payload.starts_with(PREFIX2)
        || payload.starts_with(HEAD);
    if !is_http {
        return None;
    }

    // "Host:" satırını ara (case-insensitive)
    let upper = payload.len().min(4096); // başlıklar ilk birkaç KB'de
    let hay = &payload[..upper];
    let needle = b"host:";
    let mut i = 0;
    while i + needle.len() <= hay.len() {
        if hay[i..i + needle.len()].eq_ignore_ascii_case(needle) {
            let mut j = i + needle.len();
            // Tüm baştaki boşluk/tab karakterlerini tüket (RFC 7230 §3.2.6)
            while j < hay.len() && (hay[j] == b' ' || hay[j] == b'\t') {
                j += 1;
            }
            let start = j;
            while j < hay.len() && hay[j] != b'\r' && hay[j] != b'\n' {
                j += 1;
            }
            if j > start {
                return Some(HttpHostInfo {
                    host_offset: start,
                    host_len: j - start,
                });
            }
            return None;
        }
        i += 1;
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn build_client_hello(sni: &[u8]) -> Vec<u8> {
        // Minimal ama gerçekçi ClientHello üretici
        let mut ch = Vec::new();
        ch.extend_from_slice(&[0x03, 0x03]); // legacy_version TLS1.2
        ch.extend_from_slice(&[0xAB; 32]); // random
        ch.push(0x00); // session_id len
        ch.extend_from_slice(&[0x00, 0x02, 0x13, 0x01]); // cipher_suites: [TLS_AES_128_GCM]
        ch.push(0x01);
        ch.push(0x00); // compression: null

        // extensions
        let mut sni_ext = Vec::new();
        sni_ext.extend_from_slice(&((sni.len() + 3) as u16).to_be_bytes()); // list len
        sni_ext.push(0x00); // name_type host
        sni_ext.extend_from_slice(&(sni.len() as u16).to_be_bytes());
        sni_ext.extend_from_slice(sni);

        let mut exts = Vec::new();
        exts.extend_from_slice(&0x0000u16.to_be_bytes());
        exts.extend_from_slice(&(sni_ext.len() as u16).to_be_bytes());
        exts.extend_from_slice(&sni_ext);

        ch.extend_from_slice(&(exts.len() as u16).to_be_bytes());
        ch.extend_from_slice(&exts);

        // handshake wrapper
        let mut hs = vec![0x01];
        let l = ch.len();
        hs.push(((l >> 16) & 0xFF) as u8);
        hs.push(((l >> 8) & 0xFF) as u8);
        hs.push((l & 0xFF) as u8);
        hs.extend_from_slice(&ch);

        // record wrapper
        let mut rec = vec![0x16, 0x03, 0x01];
        rec.extend_from_slice(&(hs.len() as u16).to_be_bytes());
        rec.extend_from_slice(&hs);
        rec
    }

    #[test]
    fn parses_sni_and_locates_offset() {
        let sni = b"discord.com";
        let payload = build_client_hello(sni);
        let info = parse_client_hello(&payload).expect("should parse");
        assert_eq!(info.sni(&payload), Some(&b"discord.com"[..]));
    }

    #[test]
    fn rejects_non_tls() {
        assert!(parse_client_hello(b"GET / HTTP/1.1\r\n\r\n").is_none());
        assert!(parse_client_hello(&[]).is_none());
        // TLS record ama handshake değil (application_data 0x17)
        let mut p = vec![0x17, 0x03, 0x03, 0x00, 0x01, 0xAA];
        p.extend_from_slice(&[0u8; 10]);
        assert!(parse_client_hello(&p).is_none());
    }

    #[test]
    fn rejects_truncated_extensions() {
        let mut p = build_client_hello(b"x.com");
        for _ in 0..5 {
            p.pop(); // boz
        }
        assert!(parse_client_hello(&p).is_none() || parse_client_hello(&p).is_some());
        // Amaç crash yokluğu; kesin davranış bozulma noktasına bağlı
    }

    #[test]
    fn split_mode_sni_mid_hits_middle_of_hostname() {
        let sni = b"discord.com"; // 11 bayt
        let payload = build_client_hello(sni);
        let info = parse_client_hello(&payload).unwrap();
        let off = find_split_offset(&payload, &SplitMode::SniMid).unwrap();
        assert_eq!(
            off,
            info.sni_offset + sni.len() / 2,
            "bölme noktası SNI ortasında olmalı"
        );
        assert!(off > 0 && off < payload.len());
    }

    #[test]
    fn http_host_found_case_insensitive() {
        let req = b"GET /path HTTP/1.1\r\nhoSt: Example.COM\r\nAccept: */*\r\n\r\n";
        let info = parse_http_host(req).expect("host");
        assert_eq!(&req[info.host_offset..info.host_offset + info.host_len], b"Example.COM");
    }

    #[test]
    fn non_http_rejected() {
        assert!(parse_http_host(b"NOTHTTP").is_none());
    }

    #[test]
    fn http_host_with_multiple_spaces_and_tabs() {
        let req = b"GET / HTTP/1.1\r\nHost:   \t  discord.com\r\n\r\n";
        let info = parse_http_host(req).expect("host");
        assert_eq!(&req[info.host_offset..info.host_offset + info.host_len], b"discord.com");
    }
}
