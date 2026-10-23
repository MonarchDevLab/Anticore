import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const logoPath = path.join(rootDir, 'assets', 'anticore-3d-logo-transparent.png');
if (!fs.existsSync(logoPath)) {
  console.error('Logo file not found:', logoPath);
  process.exit(1);
}

const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

const tempDir = path.join(rootDir, 'temp_design');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 1. Banner HTML (1760 x 560 - 2x Retina for 880x280 display)
const bannerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1760px;
      height: 560px;
      background: radial-gradient(circle at 50% 35%, #0d1e33 0%, #08111d 40%, #05070b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    /* Cyber Matrix Grid */
    .grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(0, 229, 255, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 255, 157, 0.035) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }

    /* Outer Border & Accents */
    .frame-border {
      position: absolute;
      inset: 16px;
      border: 1.5px solid rgba(30, 41, 59, 0.8);
      border-radius: 24px;
      pointer-events: none;
    }
    .frame-border::before {
      content: '';
      position: absolute;
      top: -1.5px; left: 20%; right: 20%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00FF9D, #00E5FF, transparent);
      box-shadow: 0 0 15px #00FF9D;
    }

    /* Corner telemetry */
    .corner-tl, .corner-tr, .corner-bl, .corner-br {
      position: absolute;
      width: 32px;
      height: 32px;
      border-color: #00FF9D;
      border-style: solid;
      pointer-events: none;
    }
    .corner-tl { top: 32px; left: 32px; border-width: 2px 0 0 2px; }
    .corner-tr { top: 32px; right: 32px; border-width: 2px 2px 0 0; border-color: #00E5FF; }
    .corner-bl { bottom: 32px; left: 32px; border-width: 0 0 2px 2px; }
    .corner-br { bottom: 32px; right: 32px; border-width: 0 2px 2px 0; border-color: #00E5FF; }

    .telemetry-tag-l {
      position: absolute;
      top: 40px;
      left: 76px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #64748B;
    }
    .telemetry-tag-l span { color: #00FF9D; }

    .telemetry-tag-r {
      position: absolute;
      top: 40px;
      right: 76px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #64748B;
    }
    .telemetry-tag-r span { color: #00E5FF; }

    /* Top Status Pill */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: rgba(7, 19, 29, 0.85);
      border: 1px solid rgba(0, 229, 255, 0.3);
      padding: 6px 24px;
      border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      margin-bottom: 16px;
      z-index: 10;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      background: #00FF9D;
      border-radius: 50%;
      box-shadow: 0 0 12px #00FF9D;
    }
    .pill-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #E2E8F0;
    }
    .pill-text .c-green { color: #00FF9D; }
    .pill-text .c-cyan { color: #00E5FF; }
    .pill-text .c-sep { color: #475569; margin: 0 6px; }

    /* Central Hero Emblem & Typography */
    .hero-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 48px;
      margin-bottom: 28px;
      z-index: 10;
    }

    .emblem-wrapper {
      position: relative;
      width: 230px;
      height: 230px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ambient-glow {
      position: absolute;
      width: 280px;
      height: 280px;
      background: radial-gradient(circle, rgba(0, 255, 157, 0.35) 0%, rgba(0, 229, 255, 0.2) 45%, transparent 70%);
      filter: blur(35px);
      z-index: 1;
    }
    .emblem-img {
      position: relative;
      width: 215px;
      height: 215px;
      object-fit: contain;
      z-index: 2;
      filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 25px rgba(0, 255, 157, 0.45));
    }

    .brand-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 96px;
      font-weight: 900;
      letter-spacing: 20px;
      line-height: 1;
      background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 45%, #94A3B8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.9));
      margin-bottom: 16px;
    }
    .brand-subtitle {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 5px;
      color: #94A3B8;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-subtitle::before {
      content: '';
      display: inline-block;
      width: 28px;
      height: 2.5px;
      background: #00FF9D;
    }

    /* Hardware Dock Cards */
    .dock-cards {
      display: flex;
      gap: 24px;
      z-index: 10;
    }
    .dock-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(9, 14, 23, 0.85);
      border: 1px solid rgba(30, 41, 59, 0.95);
      padding: 12px 26px;
      border-radius: 14px;
      backdrop-filter: blur(12px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    }
    .card-indicator {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }
    .card-indicator.green { background: #00FF9D; box-shadow: 0 0 10px #00FF9D; }
    .card-indicator.cyan { background: #00E5FF; box-shadow: 0 0 10px #00E5FF; }

    .card-label {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 1.5px;
    }
    .card-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 600;
      color: #E2E8F0;
      letter-spacing: 1.2px;
    }

    .badge-card {
      background: linear-gradient(135deg, #00FF9D 0%, #00E5FF 100%);
      border: none;
      padding: 12px 32px;
      border-radius: 999px;
      box-shadow: 0 0 30px rgba(0, 255, 157, 0.45);
    }
    .badge-card .badge-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 16px;
      font-weight: 900;
      color: #05080E;
      letter-spacing: 2.2px;
    }
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="frame-border"></div>
  <div class="corner-tl"></div>
  <div class="corner-tr"></div>
  <div class="corner-bl"></div>
  <div class="corner-br"></div>

  <div class="telemetry-tag-l">SYS // <span>ACTIVE</span></div>
  <div class="telemetry-tag-r">ENGINE // <span>ONLINE</span></div>

  <!-- Status Pill -->
  <div class="status-pill">
    <div class="pulse-dot"></div>
    <div class="pill-text">
      <span class="c-green">TURKISH ISP CALIBRATED</span>
      <span class="c-sep">•</span>
      ZERO SPEED LOSS
      <span class="c-sep">•</span>
      <span class="c-cyan">MULTI-PLATFORM</span>
    </div>
  </div>

  <!-- Hero Center -->
  <div class="hero-center">
    <div class="emblem-wrapper">
      <div class="ambient-glow"></div>
      <img src="${logoDataUri}" class="emblem-img" alt="ANTICORE 3D Tactical Shield">
    </div>
    <div class="brand-content">
      <h1 class="brand-title">ANTICORE</h1>
      <div class="brand-subtitle">ZERO-LOSS DPI CIRCUMVENTION &amp; PACKET MANIPULATION SUITE</div>
    </div>
  </div>

  <!-- Dock Cards -->
  <div class="dock-cards">
    <div class="dock-card">
      <div class="card-indicator green"></div>
      <span class="card-label">KERNEL</span>
      <span class="card-val">L3 / L4 / L7</span>
    </div>
    <div class="dock-card">
      <div class="card-indicator cyan"></div>
      <span class="card-label">CORE</span>
      <span class="card-val">RUST + WINDIVERT</span>
    </div>
    <div class="dock-card">
      <div class="card-indicator green"></div>
      <span class="card-label">OS</span>
      <span class="card-val">WIN • MAC • ANDROID</span>
    </div>
    <div class="dock-card badge-card">
      <span class="badge-text">v0.4.0 STABLE</span>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(tempDir, 'banner.html'), bannerHtml, 'utf8');

// 2. Social Preview HTML (1280 x 640 - Standard GitHub OpenGraph)
const socialHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1280px;
      height: 640px;
      background: radial-gradient(circle at 65% 50%, #0e2238 0%, #08111d 45%, #05070b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      color: #fff;
    }

    .grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(0, 229, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 255, 157, 0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .frame-border {
      position: absolute;
      inset: 20px;
      border: 1.5px solid rgba(30, 41, 59, 0.9);
      border-radius: 20px;
      pointer-events: none;
    }
    .frame-border::before {
      content: '';
      position: absolute;
      top: -1.5px; left: 10%; right: 10%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00FF9D, #00E5FF, transparent);
      box-shadow: 0 0 15px #00FF9D;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      z-index: 10;
      max-width: 680px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(7, 19, 29, 0.9);
      border: 1px solid rgba(0, 229, 255, 0.4);
      padding: 6px 18px;
      border-radius: 999px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      margin-bottom: 24px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #00FF9D;
      border-radius: 50%;
      box-shadow: 0 0 10px #00FF9D;
    }
    .pill-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #00FF9D;
    }

    .brand-title {
      font-size: 82px;
      font-weight: 900;
      letter-spacing: 12px;
      line-height: 1;
      background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 50%, #94A3B8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.9));
      margin-bottom: 16px;
    }

    .brand-desc {
      font-size: 20px;
      font-weight: 500;
      line-height: 1.45;
      color: #CBD5E1;
      margin-bottom: 28px;
    }
    .brand-desc strong {
      color: #00FF9D;
    }

    .features-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 32px;
    }
    .feature-tag {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.8);
      color: #94A3B8;
      letter-spacing: 0.8px;
    }
    .feature-tag.highlight {
      border-color: rgba(0, 255, 157, 0.4);
      color: #00FF9D;
      background: rgba(0, 255, 157, 0.05);
    }
    .feature-tag.cyan {
      border-color: rgba(0, 229, 255, 0.4);
      color: #00E5FF;
      background: rgba(0, 229, 255, 0.05);
    }

    .platform-badges {
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 1px;
    }
    .platform-badges span {
      color: #F8FAFC;
    }

    .right-column {
      position: relative;
      width: 440px;
      height: 440px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .ambient-glow-large {
      position: absolute;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(0, 255, 157, 0.28) 0%, rgba(0, 229, 255, 0.18) 45%, transparent 70%);
      filter: blur(40px);
      z-index: 1;
    }
    .hero-shield {
      position: relative;
      width: 380px;
      height: 380px;
      object-fit: contain;
      z-index: 2;
      filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 35px rgba(0, 255, 157, 0.4));
    }
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="frame-border"></div>

  <div class="left-column">
    <div class="status-pill">
      <div class="pulse-dot"></div>
      <div class="pill-text">TURKISH ISP CALIBRATED // v0.4.0 STABLE</div>
    </div>
    <h1 class="brand-title">ANTICORE</h1>
    <p class="brand-desc">
      Zero-loss, high-performance open-source <strong>DPI circumvention &amp; packet manipulation engine</strong> for Windows, macOS &amp; Android.
    </p>

    <div class="features-list">
      <div class="feature-tag highlight">✓ 100% LINE THROUGHPUT</div>
      <div class="feature-tag cyan">✓ 0 MS PING PENALTY</div>
      <div class="feature-tag">NO REMOTE VPN SERVER</div>
      <div class="feature-tag">SURGICAL TLS SPLIT</div>
      <div class="feature-tag highlight">LAN SOCKS5 &amp; HOTSPOT</div>
    </div>

    <div class="platform-badges">
      PLATFORMS: <span>WINDOWS</span> • <span>MACOS</span> • <span>ANDROID</span>
    </div>
  </div>

  <div class="right-column">
    <div class="ambient-glow-large"></div>
    <img src="${logoDataUri}" class="hero-shield" alt="ANTICORE 3D Tactical Shield">
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(tempDir, 'social-preview.html'), socialHtml, 'utf8');

console.log('HTML templates generated in temp_design/');

// 3. Render using Chrome Headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(chromePath)) {
  console.error('Chrome executable not found at:', chromePath);
  process.exit(1);
}

const bannerHtmlPath = path.join(tempDir, 'banner.html');
const bannerPngPath = path.join(rootDir, 'assets', 'banner.png');
console.log('Rendering assets/banner.png (1760x560)...');
execSync(`"${chromePath}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1760,560 --screenshot="${bannerPngPath}" "file:///${bannerHtmlPath.replace(/\\\\/g, '/')}"`);

const socialHtmlPath = path.join(tempDir, 'social-preview.html');
const socialPngPath = path.join(rootDir, 'assets', 'social-preview.png');
console.log('Rendering assets/social-preview.png (1280x640)...');
execSync(`"${chromePath}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1280,640 --screenshot="${socialPngPath}" "file:///${socialHtmlPath.replace(/\\\\/g, '/')}"`);

console.log('PNG files rendered successfully!');

// 4. Update banner.svg with full-resolution 3D emblem
const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 280" width="100%" height="100%" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05070B"/>
      <stop offset="35%" stop-color="#090E17"/>
      <stop offset="70%" stop-color="#0B1320"/>
      <stop offset="100%" stop-color="#05080E"/>
    </linearGradient>

    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00FF9D" stop-opacity="0.6"/>
      <stop offset="20%" stop-color="#1E293B" stop-opacity="0.4"/>
      <stop offset="80%" stop-color="#1E293B" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#00E5FF" stop-opacity="0.6"/>
    </linearGradient>

    <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00FF9D"/>
      <stop offset="50%" stop-color="#00E5FF"/>
      <stop offset="100%" stop-color="#38EF7D"/>
    </linearGradient>

    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#F8FAFC"/>
      <stop offset="75%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>

    <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00FF9D" stop-opacity="0.3"/>
      <stop offset="30%" stop-color="#00E5FF" stop-opacity="0.15"/>
      <stop offset="70%" stop-color="#0A1628" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="versionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00FF9D"/>
      <stop offset="100%" stop-color="#00E5FF"/>
    </linearGradient>

    <pattern id="cyberGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.015"/>
      <circle cx="24" cy="0" r="0.75" fill="#00FF9D" fill-opacity="0.08"/>
      <circle cx="0" cy="24" r="0.75" fill="#00E5FF" fill-opacity="0.08"/>
    </pattern>

    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="880" height="280" rx="16" fill="url(#bgGrad)"/>
  <rect width="880" height="280" rx="16" fill="url(#cyberGrid)"/>
  <rect width="880" height="280" rx="16" stroke="url(#borderGrad)" stroke-width="1"/>
  <rect x="1" y="1" width="878" height="278" rx="15" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

  <path d="M 180 1 L 700 1" stroke="url(#coreGrad)" stroke-width="1.5" stroke-opacity="0.45"/>
  <circle cx="440" cy="98" r="160" fill="url(#heroGlow)"/>

  <!-- Telemetry Bus Lines -->
  <g opacity="0.3">
    <line x1="60" y1="98" x2="360" y2="98" stroke="#1E293B" stroke-width="1"/>
    <line x1="520" y1="98" x2="820" y2="98" stroke="#1E293B" stroke-width="1"/>
    <circle cx="60" cy="98" r="2" fill="#00FF9D"/>
    <circle cx="820" cy="98" r="2" fill="#00E5FF"/>
    <line x1="200" y1="94" x2="200" y2="102" stroke="#00FF9D" stroke-width="1"/>
    <line x1="680" y1="94" x2="680" y2="102" stroke="#00E5FF" stroke-width="1"/>
  </g>

  <!-- Corner Brackets -->
  <g>
    <path d="M 18 34 L 18 18 L 34 18" stroke="#00FF9D" stroke-width="1.5" stroke-opacity="0.6" fill="none"/>
    <text x="40" y="24" fill="#64748B" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8.5" font-weight="600" letter-spacing="1">SYS // READY</text>

    <path d="M 862 34 L 862 18 L 846 18" stroke="#00E5FF" stroke-width="1.5" stroke-opacity="0.6" fill="none"/>
    <text x="840" y="24" text-anchor="end" fill="#64748B" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8.5" font-weight="600" letter-spacing="1">DPI // CIRCUMVENTION</text>

    <path d="M 18 246 L 18 262 L 34 262" stroke="#00FF9D" stroke-width="1.5" stroke-opacity="0.6" fill="none"/>
    <path d="M 862 246 L 862 262 L 846 262" stroke="#00E5FF" stroke-width="1.5" stroke-opacity="0.6" fill="none"/>
  </g>

  <!-- Status Pill -->
  <g transform="translate(440, 32)">
    <rect x="-225" y="-13" width="450" height="26" rx="13" fill="#07131D" fill-opacity="0.9" stroke="url(#coreGrad)" stroke-opacity="0.35" stroke-width="1"/>
    <circle cx="-204" cy="0" r="6" fill="#00FF9D" fill-opacity="0.2"/>
    <circle cx="-204" cy="0" r="3" fill="#00FF9D"/>
    <circle cx="-204" cy="0" r="1.2" fill="#FFFFFF"/>
    <text x="-188" y="4" text-anchor="start" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="10" letter-spacing="1.4">
      <tspan fill="#00FF9D" font-weight="700">TURKISH ISP CALIBRATED</tspan>
      <tspan fill="#475569" font-weight="400">  &#8226;  </tspan>
      <tspan fill="#F1F5F9" font-weight="700">ZERO SPEED LOSS</tspan>
      <tspan fill="#475569" font-weight="400">  &#8226;  </tspan>
      <tspan fill="#00E5FF" font-weight="700">MULTI-PLATFORM</tspan>
    </text>
  </g>

  <!-- Hero 3D Shield Emblem & Core -->
  <g transform="translate(440, 96)">
    <circle cx="0" cy="0" r="54" fill="#00FF9D" fill-opacity="0.22" filter="url(#neonGlow)"/>
    <circle cx="0" cy="0" r="36" fill="#00E5FF" fill-opacity="0.3" filter="url(#neonGlow)"/>

    <ellipse cx="0" cy="0" rx="60" ry="18" fill="none" stroke="url(#coreGrad)" stroke-width="1.2" stroke-opacity="0.8" transform="rotate(-26, 0, 0)"/>
    <ellipse cx="0" cy="0" rx="60" ry="18" fill="none" stroke="#00E5FF" stroke-width="1.2" stroke-opacity="0.8" transform="rotate(26, 0, 0)"/>

    <circle cx="-48" cy="-14" r="2.2" fill="#FFFFFF" filter="url(#subtleGlow)"/>
    <circle cx="48" cy="20" r="2.2" fill="#00FF9D"/>
    <circle cx="52" cy="-4" r="1.8" fill="#00E5FF"/>
    <circle cx="-44" cy="18" r="1.8" fill="#38EF7D"/>

    <!-- High-Definition 3D Emblem (110x110) -->
    <image x="-55" y="-55" width="110" height="110" href="${logoDataUri}"/>
  </g>

  <!-- Brand Typography: ANTICORE -->
  <text x="440" y="174" text-anchor="middle" fill="url(#brandGrad)"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        font-size="46" font-weight="900" letter-spacing="12">ANTICORE</text>

  <!-- Subtitle -->
  <g transform="translate(440, 198)">
    <line x1="-390" y1="-3.5" x2="-310" y2="-3.5" stroke="#1E293B" stroke-width="1"/>
    <circle cx="-310" cy="-3.5" r="1.5" fill="#00FF9D" fill-opacity="0.6"/>
    <text x="0" y="0" text-anchor="middle" fill="#94A3B8"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          font-size="10.5" font-weight="600" letter-spacing="3.2">
      ZERO-LOSS DPI CIRCUMVENTION &amp; PACKET MANIPULATION SUITE
    </text>
    <circle cx="310" cy="-3.5" r="1.5" fill="#00E5FF" fill-opacity="0.6"/>
    <line x1="310" y1="-3.5" x2="390" y2="-3.5" stroke="#1E293B" stroke-width="1"/>
  </g>

  <!-- Hardware Dock Cards -->
  <g transform="translate(40, 226)">
    <g transform="translate(0, 0)">
      <rect width="190" height="28" rx="7" fill="#090E17" stroke="#1E293B" stroke-width="1"/>
      <circle cx="18" cy="14" r="2.5" fill="#00FF9D"/>
      <text x="28" y="17.5" fill="#64748B" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9" font-weight="700" letter-spacing="0.8">KERNEL</text>
      <text x="76" y="17.5" fill="#CBD5E1" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9" font-weight="600" letter-spacing="0.8">L3 / L4 / L7</text>
    </g>

    <g transform="translate(204, 0)">
      <rect width="190" height="28" rx="7" fill="#090E17" stroke="#1E293B" stroke-width="1"/>
      <circle cx="16" cy="14" r="2.5" fill="#00E5FF"/>
      <text x="25" y="17.5" fill="#64748B" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9" font-weight="700" letter-spacing="0.8">CORE</text>
      <text x="58" y="17.5" fill="#CBD5E1" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8.5" font-weight="600" letter-spacing="0.6">RUST + WINDIVERT</text>
    </g>

    <g transform="translate(408, 0)">
      <rect width="190" height="28" rx="7" fill="#090E17" stroke="#1E293B" stroke-width="1"/>
      <circle cx="14" cy="14" r="2.5" fill="#38EF7D"/>
      <text x="23" y="17.5" fill="#64748B" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="9" font-weight="700" letter-spacing="0.8">OS</text>
      <text x="44" y="17.5" fill="#CBD5E1" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="8.5" font-weight="600" letter-spacing="0.6">WIN &#8226; MAC &#8226; ANDROID</text>
    </g>

    <g transform="translate(612, 0)">
      <rect width="188" height="28" rx="14" fill="url(#versionGrad)" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1" filter="url(#subtleGlow)"/>
      <circle cx="28" cy="14" r="3.5" fill="#05080E"/>
      <text x="100" y="18" text-anchor="middle" fill="#05080E" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="11" font-weight="900" letter-spacing="1.2">v0.4.0 STABLE</text>
    </g>
  </g>
</svg>`;

const bannerSvgPath = path.join(rootDir, 'assets', 'banner.svg');
fs.writeFileSync(bannerSvgPath, bannerSvg, 'utf8');
console.log('assets/banner.svg updated with 1024x1024 base64 3D logo!');

