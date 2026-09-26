import { useEffect, useState } from "react";
import { api, type DnsHealthDto, type Profile } from "../../lib/tauri";

export function useConnectionData() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [dns, setDns] = useState<DnsHealthDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);

    // 1. Kritik başlatıcı verileri (Profiller & Hedefler) DERHAL yükle.
    // DNS sağlık denetiminin (ISP timeout 3-5sn) profil yüklemesini ve başlat butonunu bloke etmesine izin verme.
    void Promise.allSettled([api.listProfiles(), api.getBlacklist()]).then(([p, h]) => {
      if (!alive) return;
      const profilesOk = p.status === "fulfilled";
      const hostsOk = h.status === "fulfilled";
      setProfiles(profilesOk ? p.value : []);
      setHosts(hostsOk ? h.value : []);
      if (!profilesOk || !hostsOk) {
        setError(true);
      }
      setLoading(false);
    });

    // 2. DNS sağlık denetimini asenkron arka planda yürüt (Arayüzü ve başlat butonunu asla kilitlemez)
    void api.checkDnsHealth()
      .then((d) => {
        if (!alive) return;
        setDns(d);
      })
      .catch(() => {
        if (!alive) return;
        setDns(null);
        setError(true);
      });

    return () => { alive = false; };
  }, [revision]);
  return { profiles, hosts, dns, loading, error, reload: () => setRevision((value) => value + 1) };
}
