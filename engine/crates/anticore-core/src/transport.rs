//! Platform-bağımsız ağ taşıyıcı (transport) arayüzü ve ortak veri tipleri.

/// Taşınan her bir ham pakete ait platform-özgü meta veri.
#[derive(Debug, Clone, Default)]
pub struct TransportMeta {
    /// İşletim sistemi / netfilter kuyruk paket tanıtıcısı (örn. Linux NFQUEUE id).
    pub packet_id: u64,
    /// Paketin yönü (true: gelen trafik / inbound, false: giden trafik / outbound).
    pub inbound: bool,
    /// Paket yönlendirme veya soket işareti (örn. Linux SO_MARK 0x40).
    pub mark: u32,
    /// Ağ arabirim indeksi (ifindex).
    pub interface_index: u32,
}

/// Çekirdek kuyruğundaki pakete verilecek nihaî karar.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportVerdict {
    /// Orijinal paket olduğu gibi çekirdekten geçer.
    Accept,
    /// Orijinal paket çekirdekte düşürülür (yerine sahte/bölünmüş segmentler basılır).
    Drop,
    /// Paketin yükü değiştirilerek iletilir.
    Modify,
}

/// İşletim sistemi bağımsız paket taşıyıcı sözleşmesi.
pub trait PacketTransport: Send + Sync {
    /// Sıradaki ham paketi tampona okur. Başarılıysa okunan bayt ve meta veriyi döner.
    fn recv(&self, buf: &mut [u8]) -> Option<(usize, TransportMeta)>;

    /// Oluşturulan sahte veya bölünmüş ham paketi ağ kartına iletir.
    fn send(&self, raw: &[u8], meta: &TransportMeta) -> Result<(), String>;

    /// Kuyrukta bekleyen orijinal paketin kararını çekirdeğe bildirir.
    fn set_verdict(&self, id: u64, verdict: TransportVerdict) -> Result<(), String>;

    /// Taşıyıcıyı kapatır ve sistem kurallarını kaldırır.
    fn close(&self);
}
