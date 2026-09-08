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
    setLoading(true); setError(false);
    void Promise.allSettled([api.listProfiles(), api.getBlacklist(), api.checkDnsHealth()]).then(([p, h, d]) => {
      if (!alive) return;
      if (p.status === "fulfilled") setProfiles(p.value);
      if (h.status === "fulfilled") setHosts(h.value);
      if (d.status === "fulfilled") setDns(d.value);
      setError(p.status === "rejected" || h.status === "rejected" || d.status === "rejected");
      setLoading(false);
    });
    return () => { alive = false; };
  }, [revision]);
  return { profiles, hosts, dns, loading, error, reload: () => setRevision((value) => value + 1) };
}
