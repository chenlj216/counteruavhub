---
title: "What Frequencies Do Drones Use? A Complete RF Guide"
date: "2026-04-15"
excerpt: "A technical breakdown of the RF frequency bands used by consumer, industrial, and FPV drones — including control links, video transmission, and GPS."
keywords: "drone frequency, what frequency do drones use, drone RF bands, UAV frequency spectrum"
---

Understanding the RF frequencies drones use is foundational for anyone working in counter-drone detection, electronic warfare, or airspace security. This guide covers every major frequency band used across consumer, industrial, and FPV drone systems.

## The Four Signal Systems on a Drone

Every drone relies on up to four distinct RF systems:

1. **Command & Control (C2) Link** — the uplink from pilot to drone
2. **Video downlink** — live camera feed from drone to pilot
3. **GPS/GNSS receiver** — passive receive-only positioning
4. **Telemetry** — data feedback (altitude, battery, attitude)

Each system may operate on a different frequency. A complete counter-drone picture requires understanding all four.

---

## 2.4 GHz — The Universal Control Band

**Used by:** DJI (all consumer models), Autel, Parrot, Skydio, most RC systems

2.4 GHz is the dominant control link frequency for commercial drones. It offers a good balance of range, penetration, and antenna size. DJI's OcuSync and O3/O4 protocols use adaptive frequency hopping within the 2.4 GHz ISM band (2400–2483.5 MHz).

**Key characteristics:**
- 13 channels (2401–2473 MHz, 5 MHz spacing)
- Frequency hopping spread spectrum (FHSS) — makes jamming harder
- Typical range: 1–15 km depending on protocol and environment
- Shared with Wi-Fi, Bluetooth, and ZigBee

**Counter-drone implication:** Any effective jamming solution must cover the full 2.4 GHz ISM band, not just a single channel.

---

## 5.8 GHz — Video Downlink and Dual-Band Control

**Used by:** DJI O3/O4 video, FPV analog/digital video, Autel SkyLink, Parrot Wi-Fi mode

5.8 GHz is primarily the video transmission band. DJI's newer protocols (O3, O4) use both 2.4 GHz and 5.8 GHz simultaneously — 2.4 GHz for control and 5.8 GHz for video, with automatic switching based on interference.

**Key characteristics:**
- Band: 5725–5850 MHz (FPV use) / 5150–5850 MHz (Wi-Fi UNII bands)
- Higher bandwidth than 2.4 GHz — supports HD and 4K video
- Shorter range than 2.4 GHz due to higher propagation loss
- FPV video transmitters: 25 mW to 1000 mW

**Counter-drone implication:** Disrupting video only (5.8 GHz) may not stop the drone — the pilot retains control on 2.4 GHz. For effective interdiction, both bands must be covered.

---

## 900 MHz — Long-Range and Penetration

**Used by:** Autel industrial drones (900 MHz mode), ExpressLRS 900 MHz, TBS Crossfire, some tactical systems

900 MHz (868 MHz in Europe, 915 MHz in North America) offers superior range and obstacle penetration compared to 2.4 GHz. It is increasingly used in industrial and military UAVs where range is critical.

**Key characteristics:**
- EU: 863–870 MHz / US: 902–928 MHz
- Typical range: 10–40 km (line of sight)
- Better penetration through foliage and urban structures
- Lower bandwidth than 2.4 GHz — suitable for control, not video

**Counter-drone implication:** Standard 2.4/5.8 GHz jammers will not affect 900 MHz systems. Detecting and jamming this band requires separate hardware coverage.

---

## 433 MHz — Legacy and Low-Data-Rate Links

**Used by:** Older RC systems, some low-cost commercial drones, telemetry modules

433 MHz (ISM band, 433.050–434.790 MHz) is a legacy control frequency still used in some commercial and hobbyist systems. It offers exceptional range but is limited to low data rates.

**Key characteristics:**
- Very long range (50+ km achievable with high-power systems)
- Low bandwidth — typically used for telemetry or basic control only
- Highly susceptible to interference from other ISM users

---

## 4G LTE / 5G — Cellular Control Links

**Used by:** Parrot ANAFI Ai, some enterprise and military drones

A growing number of industrial drones use cellular networks for beyond-visual-line-of-sight (BVLOS) operations. The Parrot ANAFI Ai is the most notable commercial example.

**Key characteristics:**
- Uses standard cellular frequency bands (varies by carrier/region)
- No fixed frequency — uses any available LTE/5G band
- Very long range (limited only by cellular coverage)
- Encrypted by default

**Counter-drone implication:** Cellular-linked drones cannot be disrupted by standard RF jammers without also disrupting all cellular service in the area — a significant collateral effect.

---

## GPS and GNSS — Passive Positioning

**Used by:** All modern drones

Drones do not transmit on GPS frequencies — they only receive. The key frequencies are:

| System | Frequency |
|--------|-----------|
| GPS L1 | 1575.42 MHz |
| GPS L2 | 1227.60 MHz |
| GPS L5 | 1176.45 MHz |
| GLONASS L1 | ~1602 MHz |
| BeiDou B1 | 1561.098 MHz |
| Galileo E1 | 1575.42 MHz |

**Counter-drone implication:** GPS jamming or spoofing is a common counter-drone technique. Disrupting L1 (1575 MHz) affects all GPS-dependent positioning. However, many military and industrial drones use multi-constellation, multi-frequency GNSS that is harder to spoof.

---

## Summary: Frequency Coverage by Drone Type

| Drone Type | Control | Video | Key Frequencies to Cover |
|-----------|---------|-------|--------------------------|
| DJI Consumer | 2.4 / 5.8 GHz | 2.4 / 5.8 GHz | 2.4 GHz, 5.8 GHz |
| DJI Industrial | 2.4 / 5.8 GHz | 2.4 / 5.8 GHz | 2.4 GHz, 5.8 GHz |
| Autel Industrial | 900 MHz / 2.4 / 5.8 GHz | 2.4 / 5.8 GHz | 900 MHz, 2.4 GHz, 5.8 GHz |
| FPV (ELRS/Crossfire) | 868 / 915 MHz | 5.8 GHz (analog/digital) | 868/915 MHz, 5.8 GHz |
| Cellular-linked | LTE/5G bands | LTE/5G bands | Not jamable without collateral |

For the full signal parameters of specific drone models, use our [Drone Signal Database](/tools/drone-frequency-database).

---

*Data sourced from official manufacturer specifications and FCC filings. Always verify before operational deployment.*
