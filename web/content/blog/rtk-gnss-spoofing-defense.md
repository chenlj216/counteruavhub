---
title: "RTK-GNSS Spoofing and Defense: Precision Positioning as a Counter-Drone Target"
date: "2026-04-18"
excerpt: "How GNSS spoofing attacks disrupt precision agriculture and industrial drones; techniques for RTK/PPK position spoofing, detection defenses, and the evolving arms race in satellite-based counter-UAS."
keywords: "RTK spoofing, GNSS jamming, GPS spoofing, drone positioning, counter-UAS, Galileo, BeiDou, precision agriculture"
---

Modern industrial drones rely on **centimeter-level positioning accuracy** via Real-Time Kinematic (RTK) GNSS. Unlike consumer drones that gracefully degrade when GPS is lost, professional systems — mapping drones, surveying aircraft, precision agriculture platforms — become operationally worthless when RTK lock is compromised. This represents a critical vulnerability in counter-UAS operations.

## GNSS Architecture in Modern Drones

### Signal Chain

Every modern drone receives signals from multiple satellite constellations:

| System | Frequency | Signal Strength (dBm) | Footprint at Ground |
|--------|-----------|----------------------|-------------------|
| **GPS L1** | 1575.42 MHz | -160 to -150 dBm | 21 cm wavelength |
| **GPS L2** | 1227.60 MHz | -162 to -152 dBm | 24 cm wavelength |
| **GLONASS L1** | ~1602 MHz | -160 to -150 dBm | 19 cm wavelength |
| **BeiDou B1** | 1561.098 MHz | -160 to -150 dBm | 19 cm wavelength |
| **Galileo E1** | 1575.42 MHz | -160 to -150 dBm | 19 cm wavelength |

### RTK Positioning Accuracy

**Standard GPS (code-based):**
- Accuracy: ±5–10 m
- Convergence time: 5–10 seconds
- Failure mode: Drift in >5 seconds of signal loss

**RTK (carrier-phase based):**
- Accuracy: ±2–5 cm horizontal, ±5–10 cm vertical
- Convergence time: 30–300 seconds (depends on baseline distance)
- Failure mode: Loss of integer ambiguity resolution → reacquisition required (restart cycle)

**PPK (Post-Processing Kinematic):**
- Accuracy: ±1–3 cm
- Convergence time: Minutes to hours (offline processing)
- Failure mode: Incomplete data capture; mission recording useless

**Multi-constellation vs. Single Constellation:**

```
Single Constellation (GPS only):
- 4–6 visible satellites at any time
- Vulnerable to single-source jamming
- RTK ambiguity resolution: 200+ seconds

Multi-constellation (GPS + GLONASS + Galileo + BeiDou):
- 20–25 visible satellites simultaneously
- Redundancy improves to 8–12 constellation combinations
- RTK ambiguity resolution: 30–60 seconds
- Spoofing harder: attacker must spoof all constellations coherently
```

---

## GNSS Spoofing Techniques

### Basic Spoofing: Civilian GPS Denial

**Method 1: Narrowband Jamming (1575 ± 5 MHz)**

```
TX Power: 0.1–1 W (requires only 10–50 mW for 100 m range)
Modulation: CW tone (continuous wave) or chirp
Effect: Receiver cannot lock to legitimate satellite signals
Recovery Time: Immediate after jammer removed
Detectability: High (automatic by RF monitoring systems)
```

**Pros:**
- Lowest power requirement (~100 mW for 50 m)
- Immediately effective
- No spoofing complexity

**Cons:**
- Easily detected (broadband scan finds 1575 MHz disruption)
- Illegal in most countries without authorization
- Triggers automated alarm on defense systems

### Intermediate Spoofing: Civilian GPS Spoofing (Fake Signals)

**Method 2: GNSS Signal Spoofing**

Instead of jamming, transmit fake but valid-looking GPS signals:

```
Spoofing Timeline:
t=0-100 ms: Transmit military-grade GPS signals with false time
           (attacker controls satellite constellation position)
t=100-200 ms: Gradually walk position toward target location
           Drone receiver: Lock acquired to spoofed signals (looks valid)
t>200 ms: Hold drone at false position
         Drone thinks it's 50 m to the north when actually at true position
```

**Key Parameters:**

| Parameter | Spoofed vs. Legitimate | Impact |
|-----------|----------------------|--------|
| **C/N₀ (signal strength)** | Spoofer can exceed satellite strength | Receiver preferentially locks to spoofer |
| **Signal Timing** | Attacker-controlled | Receiver clock follows spoofed time |
| **Ephemeris (orbit data)** | Must match constellation geometry | Requires real-time computation |
| **Ionospheric Delay** | Attacker models atmosphere | Accuracy: ±1–3 m possible |

**Attack Complexity:**

- **Civil GPS Only:** C/A code (coarse/acquisition) is unencrypted → spoofable with commodity hardware (HackRF, USRP)
- **Encrypted Military GPS (M-code, P-code):** Requires knowledge of encryption keys → nation-state only
- **Multi-Constellation Coherence:** Spoofing GPS + GLONASS + Galileo simultaneously requires coordinated signal generation from three independent satellite geometries

**Effect on Drone:**

1. RTK ambiguity resolution locks to false position
2. Drone holds position based on spoofed GNSS
3. If spoofing is removed suddenly, drone has stale position estimate
4. Recovery to true position: 30+ seconds

### Advanced Spoofing: Civil Drone "Relocation"

**Scenario: Precision Agriculture Drone**

```
Legitimate Mission: Survey 100-acre field
Actual Position: Farm A (coordinates: 40.001°N, 105.001°W)
Spoofed Position: Farm B, 5 km away (40.050°N, 104.950°W)

Drone thinks it's at Farm B, but physically at Farm A
Result: Mapping data is georegistered to wrong location
Impact: $10K–100K in crop treatment wasted (over/under fertilization)
```

**Attacker Requirements:**

1. Commodity spoofing equipment: ~$5–10K (USRP + antenna)
2. Real-time constellation ephemeris: Available free (EGNOS, WAAS data)
3. Target location: GPS +4°, relative accuracy ±5 m sufficient
4. Transmission range: 100–500 m (extended with directional antenna)

---

## GNSS Defense Mechanisms

### Level 1: Basic Jamming Detection

**Technique: C/N₀ Monitoring**

```python
# Pseudocode for receiver-side detection
for satellite in visible_satellites:
    cn0_current = measure_signal_strength()
    cn0_baseline = historical_average()
    
    if cn0_current < cn0_baseline - 5 dB:
        # Signal unusually weak; possible jamming
        trigger_alarm("GNSS Jamming Detected")
        fallback_mode = "dead_reckoning"  # Use IMU until recovery
```

**Limitation:** Can only detect large-power jamming (>0.5 W at 100 m). Low-power, narrowband jamming (<100 mW) may not be detected if signal strength is naturally variable.

### Level 2: Spoofing Detection (Civil GNSS)

**Technique 1: Rapid Time Discontinuity Detection**

```
Monitor receiver time correction between epochs:
Normal: Time advances by 1 second per second (±10 ns tolerance)
Spoofed: Time can jump by ±1–10 seconds as attacker walks position
Action: If discontinuity > 100 ns without satellite geometry change → reject as spoofing
```

**Sensitivity:** ~50% effective against amateur spoofing; fails against sophisticated attackers who smoothly transition time.

**Technique 2: Satellite Geometry Coherence**

```
Check that satellite geometry is physically possible:
1. Compute expected Dilution of Precision (DOP) from satellite positions
2. Measure actual DOP from time/position errors
3. If measured DOP >> expected DOP → possible spoofing

Example:
Expected DOP: 2.0 (good geometry)
Measured DOP: 50 (terrible geometry)
Interpretation: Position error doesn't match satellite arrangement
Action: Flag as possible spoofing, fall back to IMU + barometer
```

### Level 3: Multi-Constellation Verification

**Technique: Cross-Constellation Consistency**

The most effective defense against spoofing is requiring **agreement across independent constellations:**

```
GPS Solution (4 satellites):        Position = 40.0010°N, 105.0010°W, 1.2 s offset
GLONASS Solution (4 satellites):    Position = 40.0015°N, 105.0012°W, 1.1 s offset
Galileo Solution (4 satellites):    Position = 40.0009°N, 105.0008°W, 1.3 s offset

Cross-check:
- Position RMS scatter: 6 meters → acceptable (within expected error)
- Time offset agreement: All within 0.3 s → legitimate signals

vs.

GPS Spoofed:                        Position = 45.0000°N, 100.0000°W (far away)
GLONASS Legitimate:                 Position = 40.0010°N, 105.0010°W (true)
Galileo Legitimate:                 Position = 40.0009°N, 105.0009°W (true)

Cross-check:
- Position RMS scatter: 400+ kilometers → ALARM
- Time offset: GPS offset by 1000 ns from others → GPS signal rejected
```

**Why this works:** Spoofing all three constellations coherently requires:
- Modeling three independent satellite geometries simultaneously
- Real-time computation of three ephemeris sets
- Generating three separate RF waveforms with phase-coherent timing

This is feasible for nation-state actors but extremely difficult for non-state adversaries.

### Level 4: Encrypted GNSS (Military Grade)

**GPS M-Code (Military Civilian Code, available post-2023):**

- Encryption: Government-issued keys (no open civilian spoofing possible)
- Power: 3 dB stronger than C/A code
- Availability: Limited to authorized government receivers
- Spoofing resistance: Extremely high (nation-state only)

**Current Status (2026):** Most commercial drones still use civil-only GNSS. M-code adoption in consumer drones is not yet widespread due to cost and availability constraints.

---

## Countermeasures in Field Operations

### For Drone Operators (Defense)

**Immediate:**
1. Monitor GNSS signal strength in flight telemetry
2. Cross-check multiple constellations (request multi-constellation receiver)
3. Use PPK mode with offline verification for mission-critical surveys

**Medium-term:**
4. Upgrade to M-code receivers (where approved)
5. Implement IMU + barometer dead-reckoning with GNSS-aiding (not pure GNSS reliance)
6. Geotagged imagery verification against ground truth

**Long-term:**
7. Adopt encrypted GNSS when commercially available
8. Use non-GPS positioning where feasible (SLAM, visual odometry for indoor/GPS-denied areas)

### For Counter-UAS Operators (Attack)

**Spoofing Industrial Drones:**

```
Target: Phantom 4 RTK conducting cadastral survey
Attacker: Co-located 200 m away with USRP spoofing equipment

Timeline:
t=0: Detect RTK lock (receiver is in ambiguity-fixed mode)
t=0-30 sec: Transmit fake GPS signals; gradually walk position east 50 m
t=30-60 sec: Maintain false position; drone continues survey
Result: 2-acre area mapped to wrong location; $20K+ in remediation
```

**Difficulty:** Requires real-time access to drone's RTK base station coordinates (normally transmitted encrypted). Some drones transmit base station position in-the-clear.

---

## The Multi-Constellation Arms Race

### Current Status (2026)

| Constellation | Encryption | Civil Spoofing Risk | Defense Notes |
|---------------|-----------|-------------------|--------------|
| **GPS (USA)** | Partial (M-code available) | High (C/A unencrypted) | Most vulnerable |
| **GLONASS (Russia)** | Partial | Medium (FDMA aids detection) | Harder to spoof due to frequency-division |
| **Galileo (EU)** | Encrypted (OpenService) | Medium | Better civilian encryption than GPS |
| **BeiDou (China)** | Encrypted (B1C signal) | Low | Most resistant to civil spoofing |

**Implications:** Drones using GPS-only are 5–10× more vulnerable to spoofing than drones using GPS + BeiDou + Galileo.

### Future Defenses

**Receiver-Autonomous Integrity Monitoring (RAIM):**
```
Monitor: Do satellite range measurements agree with a consistent solution?
If one satellite consistently produces errors → exclude it (possible spoofed signal)
Effectiveness: 70–80% against single-satellite spoofing
Limitation: Fails if >1 satellite is spoofed
```

**Advanced Spoofing Detection (ASD):**
- Monitor signal phase as well as amplitude
- Verify ionospheric delay corrections
- Cross-check with non-GNSS sensors (IMU, lidar)
- Emerging: AI-based anomaly detection

---

## Summary: GNSS as Counter-UAS Vector

| Vector | Difficulty | Power Required | Detectability | Effectiveness |
|--------|-----------|----------------|--------------|--------------|
| **GNSS Jamming** | Easy | 100 mW–1 W | High | Temporary (RTH) |
| **Civil GPS Spoofing** | Medium | 0.5–5 W | Medium | Permanent (until reset) |
| **Multi-Constellation Spoofing** | Hard | 5–20 W | Low | Effective if coherent |
| **Military GNSS (M-code) Spoofing** | Very Hard | >20 W | Very Low | Nation-state only |

**Implications for Counter-UAS:**

1. **Jamming alone is insufficient** — RTH brings drone to GPS-denied zone; not effective for fixed-area denial
2. **Spoofing is underutilized** — Few counter-UAS systems employ GNSS spoofing; offers unique tactical advantage
3. **Multi-vector attack is necessary** — Combine RF jamming (2.4/5.8 GHz) + GNSS spoofing for reliable interdiction
4. **Defense is operator-dependent** — Drone manufacturers must implement multi-constellation validation; most don't yet

For industrial counter-UAS deployment, GNSS attack vectors deserve equal priority to RF suppression.

---

*Technical specifications derived from GPS SPS Performance Standard, ICAO documentation, and published spoofing defense literature. GNSS jamming and spoofing may be illegal without proper authorization in many jurisdictions.*
