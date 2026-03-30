# Hardware-Analyse: 3-Node Home Server Cluster

**Stand: Maerz 2026** | Anforderung: K3s, YugabyteDB, ~60 Container (Go, Node/Bun, Python, SvelteKit)

## Referenz: Apple Mac Mini M4 (24 GB)

| Eigenschaft | Wert |
|---|---|
| CPU | Apple M4, 10-Core (4P + 6E), ARM64 |
| RAM | 24 GB unified (nicht aufruestbar) |
| SSD | 256 GB / 512 GB NVMe (nicht aufruestbar) |
| Netzwerk | 1x Gigabit Ethernet (10 GbE als Option: +30 EUR Thunderbolt-Adapter) |
| Leistungsaufnahme | **3-4 W idle / 25-35 W Last** |
| Preis (DE) | **929 EUR** (Apple Store), ab ~870 EUR (Geizhals, 24 GB / 512 GB) |
| Linux | Asahi Linux (Fedora-basiert), experimentell. macOS + Colima/Docker Desktop funktioniert |
| K3s | Nativ nur via Asahi Linux oder VM. Praxis: Colima + k3s in Lima-VM |

### Staerken
- Unschlagbare Energieeffizienz (3-4 W idle)
- Hervorragende Single- und Multi-Core-Performance
- Kompaktestes Gehaeuse am Markt (12.7 x 12.7 cm)
- Leise (passiv bei niedrigem Last)

### Schwaechen
- **Kein natives Linux** (Asahi experimentell, kein offizieller Support)
- **RAM und SSD nicht aufruestbar** (bei Kauf festgelegt)
- K3s laeuft nicht nativ auf macOS -- Virtualisierung noetig
- ARM64: ~20% der Helm Charts liefern nur x86-Images
- Kein 10 GbE onboard

---

## 1. ASUS NUC 14 Pro / Pro+

### ASUS NUC 14 Pro (Barebone)

| Eigenschaft | Wert |
|---|---|
| CPU | Intel Core Ultra 5 125H / Ultra 7 155H / Ultra 9 185H (Meteor Lake) |
| Kerne | 14C/18T (Ultra 7) bzw. 16C/22T (Ultra 9) |
| RAM | Bis 96 GB DDR5-5600 SO-DIMM (2 Slots, aufruestbar) |
| SSD | 1x M.2 2280 PCIe 4.0, 1x M.2 2242 |
| Netzwerk | 1x 2.5 GbE Intel i226-V |
| Leistungsaufnahme | **8-10 W idle / 45-88 W Last** |
| Preis (DE) | Barebone ab **235 EUR** (Geizhals), Komplettsystem ab **879 EUR** |
| Linux | Hervorragend (Ubuntu, Fedora nativ) |
| Verfuegbarkeit | Sofort lieferbar |

### ASUS NUC 14 Pro+ (Komplettsystem)

| Eigenschaft | Wert |
|---|---|
| CPU | Intel Core Ultra 7 155H / Ultra 9 185H |
| RAM | 16-32 GB DDR5 (aufruestbar bis 96 GB) |
| Preis (DE) | ab **879 EUR** (Komplettsystem mit 16 GB / 512 GB) |
| Besonderheit | Thunderbolt 4, WiFi 6E, vPro (manche Modelle) |

**Kalkulation fuer 32 GB Variante:**
- Barebone Ultra 7 155H: ~450 EUR
- 32 GB DDR5 SO-DIMM Kit: ~80 EUR
- 1 TB NVMe SSD: ~70 EUR
- **Gesamt: ~600 EUR pro Node**

### Bewertung vs. Mac Mini M4

| Kriterium | NUC 14 Pro | Mac Mini M4 |
|---|---|---|
| Preis (32 GB) | ~600 EUR | ~929 EUR |
| Idle-Verbrauch | 8-10 W | 3-4 W |
| Multi-Core | Vergleichbar (14C) | Leicht besser (effizienter) |
| RAM aufruestbar | Ja (bis 96 GB) | Nein |
| Linux nativ | Ja | Nein (Asahi experimentell) |
| 10 GbE | Nein (2.5 GbE) | Nein (1 GbE) |

**Fazit:** Bester Kompromiss aus Preis, Performance und Linux-Kompatibilitaet. Klare Empfehlung.

---

## 2. AMD Mini PCs

### Minisforum UM890 Pro

| Eigenschaft | Wert |
|---|---|
| CPU | AMD Ryzen 9 8945HS (8C/16T, Zen 4, bis 5.2 GHz) |
| RAM | Bis 64 GB DDR5-5600 SO-DIMM (2 Slots, aufruestbar) |
| SSD | 2x M.2 2280 PCIe 4.0 |
| Netzwerk | 1x 2.5 GbE |
| Leistungsaufnahme | **7-10 W idle / 80-95 W Last** |
| Preis (DE) | ab **463 EUR** (Geizhals), mit 32 GB/1 TB ca. **550-600 EUR** |
| Linux | Hervorragend (voller AMD-Support) |
| Verfuegbarkeit | Teilweise ausverkauft, Nachlieferung Mai 2026 |

### Beelink SER8

| Eigenschaft | Wert |
|---|---|
| CPU | AMD Ryzen 7 8845HS (8C/16T, Zen 4, bis 5.1 GHz) |
| RAM | 32 GB DDR5-5600 (aufruestbar) |
| SSD | 1 TB PCIe 4.0 |
| Netzwerk | 1x 2.5 GbE |
| Leistungsaufnahme | **8-10 W idle (Linux) / 85 W Last** |
| Preis (DE) | **399-450 EUR** (Amazon.de mit 32 GB/1 TB) |
| Linux | Hervorragend |
| Verfuegbarkeit | Sofort lieferbar |

### Beelink SER9 (Zen 5)

| Eigenschaft | Wert |
|---|---|
| CPU | AMD Ryzen AI 9 HX 370 (12C/24T, Zen 5) |
| RAM | Bis 64 GB DDR5 |
| Netzwerk | 1x 2.5 GbE |
| Leistungsaufnahme | ~10 W idle / ~95 W Last |
| Preis (DE) | ab ca. **650-750 EUR** (mit 32 GB) |

### Geekom A8 Max

| Eigenschaft | Wert |
|---|---|
| CPU | AMD Ryzen 9 8945HS (8C/16T) oder Ryzen 7 8745HS |
| RAM | Bis 64 GB DDR5 (aufruestbar) |
| SSD | Bis 2 TB |
| Netzwerk | **2x 2.5 GbE** (Dual-LAN!) |
| Leistungsaufnahme | ~8-10 W idle / ~85 W Last |
| Preis (DE) | ab **720 EUR** (mit Code), regulaer **849 EUR** |
| Besonderheit | USB4, Dual 2.5 GbE fuer LAG/Failover |

### Minisforum MS-A2 (Homelab-Spezialist)

| Eigenschaft | Wert |
|---|---|
| CPU | AMD Ryzen 9 9955HX (16C/32T, Zen 5) |
| RAM | Bis 96 GB DDR5 (2 Slots) |
| SSD | 3x M.2 (2280 + 22110 + U.2) |
| Netzwerk | **2x 10 GbE SFP+** + 2x 2.5 GbE |
| PCIe | 1x PCIe x16 Slot |
| Leistungsaufnahme | **25-30 W idle / 120+ W Last** |
| Preis (DE) | Barebone ab **839 EUR**, Komplett ab **975 EUR** |
| Linux | Hervorragend |
| Verfuegbarkeit | Teilweise ausverkauft |

**Fazit AMD:** Der **Beelink SER8** bietet das beste Preis-Leistungs-Verhaeltnis. Die **MS-A2** ist das Schweizer Taschenmesser fuer Homelabs mit 10 GbE, aber teuer und stromhungrig im Idle.

---

## 3. ARM-Alternativen

### Raspberry Pi 5 (8 GB)

| Eigenschaft | Wert |
|---|---|
| CPU | Broadcom BCM2712, 4x Cortex-A76 @ 2.4 GHz |
| RAM | 8 GB LPDDR4X (nicht aufruestbar) |
| SSD | Via M.2 HAT (NVMe) oder USB 3.0 SSD |
| Netzwerk | 1x Gigabit Ethernet |
| Leistungsaufnahme | **3-4 W idle / 10-12 W Last** |
| Preis (DE) | ca. **95 EUR** (Board + Gehaeuse + Kuehler + Netzteil) |
| Linux | Hervorragend (Raspberry Pi OS, Ubuntu) |

**Realistisch fuer diesen Workload? NEIN.**

- 8 GB RAM reicht nicht fuer YugabyteDB + K3s + Container
- Nur 4 Kerne -- ~60 Container werden sehr eng
- ~20% der Container-Images sind nur x86
- SD-Karten-IO ist ungeeignet (NVMe-HAT hilft, aber PCIe 2.0 x1)
- Kein ECC, instabil unter Dauerlast
- Muesste 5-6 Nodes statt 3 nutzen = mehr Komplexitaet

**Einsatz:** Gut als dedizierter K3s-Agent fuer leichte Workloads, nicht als Hauptknoten.

### Orange Pi 5 Plus / Rock 5B

| Eigenschaft | Orange Pi 5 Plus | Rock 5B |
|---|---|---|
| CPU | RK3588 8C (4x A76 + 4x A55) | RK3588 8C |
| RAM | 16 GB / 32 GB | 16 GB |
| Netzwerk | 2x 2.5 GbE | 1x 2.5 GbE |
| Preis | ~170 EUR (32 GB) | ~130 EUR (16 GB) |
| Leistungsaufnahme | 5-8 W idle | 5-8 W idle |

**Bewertung:** Mehr RAM als Pi 5, aber gleiche Grundprobleme: ARM-Image-Kompatibilitaet, begrenzte CPU-Leistung, kein ECC. Fuer 60 Container nicht empfohlen.

### Ampere Altra

| Eigenschaft | Wert |
|---|---|
| CPU | Ampere Altra (bis 128 ARM-Kerne) |
| RAM | Server-DDR5 ECC, bis 512 GB |
| Preis | ab **3.000+ EUR** fuer komplettes System |

**Bewertung:** Overkill und weit ueber Budget. Interessant fuer Datacenter, nicht fuer Home-Cluster.

---

## 4. Refurbished Enterprise Micro Server

### Lenovo ThinkCentre M75q Gen 5 Tiny

| Eigenschaft | Wert |
|---|---|
| CPU | AMD Ryzen 7 PRO 8700GE (8C/16T, 35W TDP) |
| RAM | Bis 64 GB DDR5 (2 Slots) |
| SSD | 1x M.2 2280 |
| Netzwerk | 1x 1 GbE (kein 2.5 GbE!) |
| Leistungsaufnahme | ~8-12 W idle / 35-50 W Last |
| Preis (DE, neu) | ab ca. **600-800 EUR** |
| Preis (refurbished) | ab ca. **350-500 EUR** |
| Linux | Hervorragend (Business-Hardware, gut getestet) |

### HP Elite Mini 800 G9

| Eigenschaft | Wert |
|---|---|
| CPU | Intel Core i5-12500T / i7-12700T (12./13. Gen) |
| RAM | Bis 64 GB DDR5 |
| SSD | 1x M.2 NVMe |
| Netzwerk | 1x 1 GbE |
| Leistungsaufnahme | ~10-15 W idle / 35-65 W Last |
| Preis (DE, refurbished) | ab ca. **300-450 EUR** (32 GB, refurbed.de) |
| Linux | Hervorragend |

### Dell OptiPlex 7010/7020 Micro

| Eigenschaft | Wert |
|---|---|
| CPU | Intel Core i5-13500T / i7-13700T |
| RAM | Bis 64 GB DDR5 (ab Gen 13) |
| Netzwerk | 1x 1 GbE |
| Preis (DE, refurbished) | ab ca. **280-400 EUR** |
| Linux | Hervorragend |

**Fazit Refurbished:** Extrem guenstig, aber nur 1 GbE Netzwerk und aeltere CPUs. Gut fuer Budget-Cluster, weniger fuer Zukunftssicherheit.

---

## 5. Ultra-Low-Power Mini PCs

### Intel N100 Mini PCs (z.B. Beelink S12 Pro, CWWK)

| Eigenschaft | Wert |
|---|---|
| CPU | Intel N100 (4C/4T, Alder Lake-N, bis 3.4 GHz) |
| RAM | 8-16 GB DDR5 (meistens geloetet, nicht aufruestbar) |
| SSD | 1x M.2 2280 |
| Netzwerk | 1x 2.5 GbE (CWWK: bis 6x 2.5 GbE) |
| Leistungsaufnahme | **6-8 W idle / 25 W Last** |
| Preis (DE) | ab **130-200 EUR** |
| Linux | Hervorragend |

### Intel N305 Mini PCs (z.B. CWWK F7)

| Eigenschaft | Wert |
|---|---|
| CPU | Intel i3-N305 (8C/8T, Alder Lake-N, bis 3.8 GHz) |
| RAM | Bis 32 GB DDR5 |
| SSD | 1-2x M.2 NVMe |
| Netzwerk | Bis 6x 2.5 GbE (CWWK/Topton Modelle) |
| Leistungsaufnahme | **10-14 W idle / 34-50 W Last** |
| Preis (DE) | ab **200-350 EUR** (mit 32 GB/1 TB) |
| Linux | Hervorragend |
| Besonderheit | Fanless-Modelle verfuegbar (24/7 Betrieb, lautlos) |

**Bewertung N100:** Nur 4 Kerne und max 16 GB RAM -- fuer YugabyteDB + 20 Container pro Node zu knapp.

**Bewertung N305:** 8 Kerne und 32 GB moeglich -- minimal ausreichend. Fanless und extrem stromsparend. Aber Single-Thread-Leistung weit unter Ryzen/Apple Silicon.

---

## Gesamtvergleich

### Performance und Effizienz

| System | Kerne | Idle (W) | Last (W) | Multi-Core (rel.) | Perf/Watt |
|---|---|---|---|---|---|
| **Mac Mini M4** | 10 (4P+6E) | 3-4 | 25-35 | 100% (Referenz) | Exzellent |
| ASUS NUC 14 Pro (Ultra 7) | 14 (6P+8E) | 8-10 | 45-88 | ~90-100% | Gut |
| Beelink SER8 (8845HS) | 8 (8P) | 8-10 | 85 | ~85% | Gut |
| Minisforum UM890 Pro | 8 (8P) | 7-10 | 80-95 | ~90% | Gut |
| Minisforum MS-A2 (9955HX) | 16 (16P) | 25-30 | 120+ | ~170% | Maessig |
| Lenovo M75q (8700GE) | 8 (8P) | 8-12 | 35-50 | ~75% | Gut |
| Intel N305 (CWWK) | 8 (8E) | 10-14 | 34-50 | ~35% | Gut (fuer idle) |
| Raspberry Pi 5 | 4 | 3-4 | 10-12 | ~15% | Gut (fuer idle) |

### Stromkosten ueber 3 Jahre (0,35 EUR/kWh, 3 Nodes)

| System | Idle (W, 3 Nodes) | Jahreskosten (idle) | 3-Jahres-Strom |
|---|---|---|---|
| **Mac Mini M4** | 9-12 W | 28-37 EUR | **84-110 EUR** |
| ASUS NUC 14 Pro | 24-30 W | 74-92 EUR | **221-276 EUR** |
| Beelink SER8 | 24-30 W | 74-92 EUR | **221-276 EUR** |
| Minisforum MS-A2 | 75-90 W | 230-276 EUR | **690-828 EUR** |
| Intel N305 | 30-42 W | 92-129 EUR | **276-387 EUR** |
| Raspberry Pi 5 | 9-12 W | 28-37 EUR | **84-110 EUR** |

*Annahme: Server laeuft 24/7, Grossteil der Zeit im Idle/Low-Load.*

### Total Cost of Ownership (3 Jahre: Hardware + Strom)

| System | Hardware (3x) | Strom (3 J.) | **TCO Gesamt** |
|---|---|---|---|
| **Mac Mini M4 (24 GB)** | 2.787 EUR | ~100 EUR | **~2.887 EUR** |
| ASUS NUC 14 Pro (32 GB) | 1.800 EUR | ~250 EUR | **~2.050 EUR** |
| Beelink SER8 (32 GB) | 1.200-1.350 EUR | ~250 EUR | **~1.500 EUR** |
| Minisforum UM890 Pro (32 GB) | 1.650 EUR | ~250 EUR | **~1.900 EUR** |
| Minisforum MS-A2 (32 GB) | 2.925 EUR | ~760 EUR | **~3.685 EUR** |
| Lenovo M75q refurb (32 GB) | 1.050-1.500 EUR | ~250 EUR | **~1.500 EUR** |
| Intel N305 CWWK (32 GB) | 750-1.050 EUR | ~330 EUR | **~1.200 EUR** |

---

## ARM vs. x86 Ueberlegungen fuer Docker/K8s

| Aspekt | ARM64 (Mac Mini, Pi) | x86_64 (Intel, AMD) |
|---|---|---|
| Container-Image-Verfuegbarkeit | ~80% (multi-arch nimmt zu) | 99%+ |
| Offizielle K3s-Unterstuetzung | Ja (ARM64 Builds) | Ja (primaer) |
| YugabyteDB | Offiziell nur x86! ARM experimentell | Voll unterstuetzt |
| Go-Services | Kein Problem (Cross-Compile) | Kein Problem |
| Node.js/Bun | Kein Problem | Kein Problem |
| Python | Kein Problem (manche C-Extensions langsamer) | Kein Problem |
| Helm Charts (Community) | ~80% kompatibel | ~99% kompatibel |

**Kritisch: YugabyteDB hat keinen offiziellen ARM64-Support.** Das allein disqualifiziert reine ARM-Setups fuer das geplante Setup, es sei denn man baut selbst oder nutzt einen Fork.

---

## Empfehlungen

### Empfehlung 1: Beelink SER8 (Bestes Preis-Leistungs-Verhaeltnis)

**3x Beelink SER8 (32 GB DDR5 / 1 TB SSD)**

| | |
|---|---|
| Preis pro Node | ~400-450 EUR |
| Gesamtpreis (3 Nodes) | ~1.200-1.350 EUR |
| TCO (3 Jahre) | ~1.500 EUR |
| Idle-Verbrauch (3 Nodes) | ~24-30 W |

- Sofort auf Amazon.de verfuegbar
- Linux-Support perfekt
- YugabyteDB laeuft nativ
- 8C/16T pro Node = 24C/48T gesamt -- mehr als genug fuer 60 Container
- 2.5 GbE Netzwerk
- Aufruestbar auf 64 GB RAM pro Node bei Bedarf
- **Spart ~1.400 EUR gegenueber 3x Mac Mini M4**

### Empfehlung 2: ASUS NUC 14 Pro (Bester Kompromiss)

**3x ASUS NUC 14 Pro Barebone (Ultra 7 155H) + 32 GB + 1 TB**

| | |
|---|---|
| Preis pro Node | ~600 EUR |
| Gesamtpreis (3 Nodes) | ~1.800 EUR |
| TCO (3 Jahre) | ~2.050 EUR |

- Bewaeehrte NUC-Qualitaet (Intel/ASUS)
- 14 Kerne pro Node = 42 Kerne gesamt
- Aufruestbar bis 96 GB RAM
- Thunderbolt 4 fuer 10 GbE Adapter
- Business-Hardware mit laengerer Verfuegbarkeit von Ersatzteilen

### Empfehlung 3: Minisforum MS-A2 (Maximum Homelab)

**Nur wenn 10 GbE zwingend noetig.**

| | |
|---|---|
| Preis pro Node | ~975 EUR |
| Gesamtpreis (3 Nodes) | ~2.925 EUR |
| TCO (3 Jahre) | ~3.685 EUR |

- 16 Kerne + 10 GbE SFP+ onboard
- PCIe x16 Slot fuer GPU/NIC-Erweiterung
- Aber: Hoher Idle-Verbrauch (25-30 W), teuer, oft ausverkauft

### Empfehlung 4: Hybrid (Budget + Zukunftssicherheit)

**2x Beelink SER8 + 1x ASUS NUC 14 Pro (als Control Plane)**

| | |
|---|---|
| Gesamtpreis | ~1.500 EUR |
| TCO (3 Jahre) | ~1.750 EUR |

---

## Nicht empfohlen

| Option | Grund |
|---|---|
| **Mac Mini M4** | Kein natives Linux, YugabyteDB nicht ARM-offiziell, RAM nicht aufruestbar, teuer |
| **Raspberry Pi 5** | Zu wenig RAM (8 GB), zu wenig CPU, ARM-Image-Probleme |
| **Intel N100** | Nur 4 Kerne, max 16 GB RAM -- zu schwach |
| **Ampere Altra** | Weit ueber Budget |
| **Minisforum MS-A2** | Nur wenn 10 GbE Pflicht (sonst zu teuer und zu stromhungrig) |

---

## Fazit

Fuer den geplanten Cluster mit K3s, YugabyteDB und ~60 Containern ist der **Beelink SER8** die wirtschaftlich beste Wahl: 3 Nodes fuer ~1.300 EUR, perfekter Linux-Support, ausreichend Leistung, und moderate Stromkosten. Die ~150 EUR mehr Stromkosten gegenueber Mac Minis werden durch ~1.400 EUR Hardware-Ersparnis mehr als kompensiert.

Falls die Anforderungen wachsen (mehr RAM, 10 GbE), ist ein spaeterer Umstieg auf ASUS NUC 14 Pro oder Minisforum MS-A2 Nodes moeglich -- K3s macht das Hinzufuegen und Entfernen von Nodes trivial.

**Wichtigster Grund gegen den Mac Mini M4:** YugabyteDB hat keinen offiziellen ARM64-Support. Das ist fuer eine produktive Datenbank ein No-Go.

---

## Quellen

- [Mac Mini M4 Effizienz - Jeff Geerling](https://www.jeffgeerling.com/blog/2024/m4-mac-minis-efficiency-incredible/)
- [Mac Mini M4 Review - NotebookCheck](https://www.notebookcheck.net/Apple-Mac-Mini-M4-review-Smaller-faster-and-louder.918832.0.html)
- [Mac Mini M4 Review - ServeTheHome](https://www.servethehome.com/the-apple-mac-mini-m4-sets-the-mini-computer-standard/3/)
- [ASUS NUC 14 Pro Review - ServeTheHome](https://www.servethehome.com/asus-nuc-14-pro-review-intel-core/4/)
- [ASUS NUC 14 Pro Geizhals](https://geizhals.de/asus-nuc-14-pro-kit-barebone-v158051.html)
- [Minisforum UM890 Pro Review - NotebookCheck](https://www.notebookcheck.net/Minisforum-EliteMini-UM890-Pro-review-A-powerful-mini-PC-with-AMD-Ryzen-9-and-whisper-quiet-cooling.982755.0.html)
- [Minisforum UM890 Pro Review - ServeTheHome](https://www.servethehome.com/minisforum-um890-pro-review-re-architected-amd-ryzen-8945hs-mini-pc/4/)
- [Minisforum MS-A2 Review - ServeTheHome](https://www.servethehome.com/minisforum-ms-a2-review-an-almost-perfect-amd-ryzen-intel-10gbe-homelab-system/4/)
- [Minisforum MS-A2 Geizhals](https://geizhals.de/minisforum-ms-a2-a3504299.html)
- [Beelink SER8 Review - ServeTheHome](https://www.servethehome.com/beelink-ser8-review-amd-ryzen-7-8845hs-powered-mini-pc/3/)
- [Beelink SER8 Review - Hardwareluxx](https://www.hardwareluxx.de/index.php/artikel/hardware/komplettsysteme/63918-mit-ryzen-7-8845hs-und-im-kompakten-geh%C3%A4use-beelink-ser8-im-test.html)
- [Beelink SER7 Amazon.de](https://www.amazon.de/Beelink-Ryzen-Threads-PCIe4-0-Display/dp/B0CH7VJZ94)
- [Geekom A8 Max - NotebookCheck](https://www.notebookcheck.net/Best-value-with-AMD-Ryzen-7-8845HS-The-Geekom-A8-Max-mini-PC-review.1005224.0.html)
- [Geekom DE Shop](https://www.geekom.de/geekom-a8-mini-pc/)
- [HP Elite Mini 800 G9 - refurbed.de](https://www.refurbed.de/p/hp-elite-mini-800-g9/)
- [Lenovo M75q Gen 2 Geizhals](https://geizhals.de/lenovo-thinkcentre-m75q-gen-2-v46509.html)
- [CWWK N305 Benchmarks](https://rovingclimber.com/2025/01/05/cwwk-i3-n305-benchmarks-power-consumption/)
- [N100 vs Pi - Jeff Geerling](https://www.jeffgeerling.com/blog/2025/intel-n100-better-value-raspberry-pi/)
- [N100 vs N305 Home Server](https://www.lowerhomeserver.vip/blog/hardware/intel-n100-vs-n305-home-server-2026)
- [K3s auf Raspberry Pi 5](https://www.picocluster.com/blogs/picocluster-software-engineering/installing-k3s-on-the-raspberry-pi-5-a-step-by-step-guide)
