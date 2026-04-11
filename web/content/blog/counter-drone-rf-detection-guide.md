---
title: "Counter-Drone RF Detection: A Practical Configuration Guide"
date: "2026-04-17"
excerpt: "How to configure RF-based drone detection systems — covering scan ranges, sensitivity requirements, false positive mitigation, and integration with counter-drone response."
keywords: "RF drone detection, counter drone detection, drone RF sensor, UAV detection system, drone detection frequency"
---

RF detection is the most widely deployable drone detection technology — it requires no line of sight, works at night and in poor weather, and is passive (it transmits nothing). But its effectiveness depends entirely on correct configuration. This guide covers the key parameters for building a reliable RF-based drone detection capability.

## How RF Detection Works

RF detection systems (also called drone RF sensors or RF scanners) monitor the electromagnetic spectrum for signals associated with drone operation. Unlike radar, they do not transmit — they only receive and analyze.

The core workflow:
1. **Scan** the target frequency range with a wideband receiver
2. **Detect** signals that exceed a noise floor threshold
3. **Classify** signals by comparing against a library of known drone RF signatures
4. **Alert** when a drone protocol signature is identified

The quality of step 3 (classification) is what separates a capable system from a false-alarm generator.

---

## Required Frequency Scan Range

The minimum scan range for comprehensive consumer drone detection:

| Band | Range | Drones Covered |
|------|-------|----------------|
| 433 MHz | 430–435 MHz | Legacy RC, some FPV |
| 868/900 MHz | 863–928 MHz | ExpressLRS, TBS Crossfire, Autel industrial |
| 2.4 GHz | 2400–2483 MHz | DJI (all), Autel, Parrot, Skydio |
| 5.8 GHz | 5725–5875 MHz | DJI video, FPV video |
| GPS L1 | 1575 MHz | Detection of GPS spoofing/jamming activity |

A system covering only 2.4 GHz and 5.8 GHz will miss any drone using 900 MHz control links — including ExpressLRS-based DIY and tactical systems, and Autel industrial drones in long-range mode.

---

## Receiver Sensitivity Requirements

Sensitivity determines the maximum range at which a drone can be detected.

For a 100 mW (20 dBm) transmitter at 1 km:
- Free-space path loss at 2.4 GHz: ~100 dB
- Signal level at receiver: approximately -80 dBm

To detect this reliably, the receiver noise floor must be below -80 dBm with adequate margin. Most professional RF detection systems spec a noise floor of -100 to -110 dBm, providing 20–30 dB of margin.

**Practical implication:** A system with insufficient sensitivity may fail to detect low-power drones (FPV video transmitters at 25 mW) or drones at the edge of their range. Spec the system against your required detection range, not just "drone detection capability."

---

## Handling Frequency-Hopping Protocols

DJI's OcuSync and O3/O4 protocols use adaptive frequency hopping — the control link moves rapidly between channels to avoid interference. This creates two detection challenges:

**1. Dwell time:** A scanning receiver that spends only 1 ms per channel may miss a hopping signal entirely. Detection requires either:
- A **wideband simultaneous receiver** (captures the full band at once)
- A **fast-scanning receiver** with dwell time matched to the hopping rate
- A **dedicated 2.4 GHz channel** receiver that monitors all channels simultaneously

**2. Energy averaging:** A hopping signal appears at any single channel much less often than a fixed signal. Classification algorithms must account for this — looking for periodic appearances across multiple channels rather than a sustained signal on one channel.

DJI's O4 protocol hops at a rate that makes single-channel or slow-scan approaches unreliable. Wideband instantaneous capture (typically requiring a real-time spectrum analyzer architecture) is the recommended approach.

---

## Antenna Configuration

**Omnidirectional vs. directional:**

- **Omnidirectional:** Covers 360°, detects drones from any direction. Lower gain means shorter effective range. Recommended for perimeter monitoring.
- **Directional (sector):** Higher gain in the target sector, longer range, provides bearing information. Requires multiple antennas for 360° coverage. Recommended for sites with known threat corridors.

**Antenna height:**  
RF propagation is line-of-sight. Place antennas at the highest available point to maximize detection range. Each 10m of additional height extends the radio horizon by approximately 11 km at 100m drone altitude.

**Antenna separation:**  
For bearing/angle-of-arrival (AoA) estimation, antennas must be separated. Typical minimum separation is 0.5× wavelength (approximately 6 cm at 2.4 GHz for phase comparison methods, or several meters for time-difference-of-arrival systems).

---

## False Positive Mitigation

An RF detection system that alarms every time a phone connects to Wi-Fi is useless in urban environments. The primary false positive sources at 2.4 GHz:

- Wi-Fi (802.11b/g/n/ac/ax)
- Bluetooth
- Baby monitors, wireless cameras
- Microwave ovens (broadband interference)
- Cordless phones

**Mitigation strategies:**

1. **Protocol-specific classification:** Filter for known drone RF signatures (DJI OcuSync burst pattern, ELRS packet structure) rather than signal presence alone. This requires a signature library.

2. **Power thresholds:** Drones at typical threat distances (100–500m) will appear at specific power levels. Signals well below or above the expected range are likely not drones at the specified distance.

3. **Directional correlation:** If using multiple antennas, require detection from a consistent bearing over multiple scans. Random RF noise tends to appear from multiple directions.

4. **Frequency combination rules:** Require simultaneous detection on both control and video frequencies to confirm a drone (rather than just a stray Wi-Fi signal on 2.4 GHz).

---

## Integration with Counter-Measures

RF detection is most valuable as the first stage of a counter-drone kill chain:

```
RF Detection → Classification → Bearing → Confirm → Respond
```

The response depends on the threat level and authorization:

- **Soft:** Alert security personnel for visual confirmation
- **Medium:** Activate directional RF jamming toward the detected bearing
- **Hard:** Cue directed energy or kinetic systems (restricted to military/law enforcement)

The key integration parameter is **alert-to-response time**. A fast-moving drone at 20 m/s covers 1 km in 50 seconds. Your detection-to-response loop must complete well within that window.

For automated response integration, the output from the RF detection system typically needs to provide:
- Detection confidence (probability score, not binary alarm)
- Estimated bearing or 2D location
- Drone type / protocol identification
- Time to first detection and sustained track duration

---

## Frequency Parameters for Specific Drone Models

For the exact control and video frequencies of specific drone models — which determine what bands your detection system must cover — see the [Drone Signal Database](/tools/drone-frequency-database).

Each record includes control frequency, video protocol, GPS bands, and recommended detection/jamming frequency ranges.

---

*Information provided for security professional and research use. Verify parameters against current official specifications before deployment.*
