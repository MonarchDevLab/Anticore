import { Globe2, Monitor, Split } from "lucide-react";
import type { ConnectionCopy } from "./copy";

export default function ConnectionVisual({ active, copy }: { active: boolean; copy: ConnectionCopy }) {
  return (
    <div className={`connection-path ${active ? "is-active" : ""}`} role="img" aria-label={copy.pathLabel}>
      <svg viewBox="0 0 440 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="path-guide" d="M40 60H145C180 60 180 25 220 25S260 60 295 60H400" />
        <path className="path-guide" d="M40 60H145C180 60 180 95 220 95S260 60 295 60H400" />
        <path className="path-signal" d="M40 60H145C180 60 180 25 220 25S260 60 295 60H400" />
        <path className="path-signal path-secondary" d="M40 60H145C180 60 180 95 220 95S260 60 295 60H400" />
      </svg>
      <div className="path-node path-device"><Monitor size={20} /><span>{copy.device}</span></div>
      <div className="path-node path-engine"><Split size={28} strokeWidth={1.7} /><span>{copy.engine}</span></div>
      <div className="path-node path-destination"><Globe2 size={20} /><span>{copy.destination}</span></div>
    </div>
  );
}
