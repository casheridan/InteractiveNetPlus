import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from "react";
import { OSISection, AppliancesSection } from "./sections/fundamentals";
import { ALL_SECTIONS, SECTION_ICONS } from "./constants/navigation";

// ─── Constant Data ───────────────────────────────────────────────────────────

const PORTS_PROTOCOLS = [
  { name: "FTP", ports: "20 (data), 21 (control)", transport: "TCP", desc: "File Transfer Protocol — transfers files. Unencrypted. Active mode uses port 20 for data; passive mode uses random high port." },
  { name: "SFTP", ports: "22", transport: "TCP", desc: "SSH File Transfer Protocol — secure file transfer over SSH tunnel. Encrypts both commands and data." },
  { name: "SSH", ports: "22", transport: "TCP", desc: "Secure Shell — encrypted remote CLI access. Replaces Telnet. Used for secure device management." },
  { name: "Telnet", ports: "23", transport: "TCP", desc: "Unencrypted remote CLI access. INSECURE — sends credentials in plaintext. Use SSH instead." },
  { name: "SMTP", ports: "25, 587 (submission)", transport: "TCP", desc: "Simple Mail Transfer Protocol — sends email between servers. Port 587 for authenticated submission with STARTTLS." },
  { name: "DNS", ports: "53", transport: "TCP & UDP", desc: "Domain Name System — resolves names to IPs. UDP for queries <512 bytes; TCP for zone transfers and large responses." },
  { name: "DHCP", ports: "67 (server), 68 (client)", transport: "UDP", desc: "Dynamic Host Configuration Protocol — auto-assigns IP config. DORA process: Discover → Offer → Request → Acknowledge." },
  { name: "HTTP", ports: "80", transport: "TCP", desc: "HyperText Transfer Protocol — unencrypted web traffic. Stateless request/response protocol." },
  { name: "HTTPS", ports: "443", transport: "TCP", desc: "HTTP Secure — encrypted web traffic using TLS. Provides confidentiality, integrity, and authentication via certificates (PKI)." },
  { name: "SNMP", ports: "161 (agent), 162 (traps)", transport: "UDP", desc: "Simple Network Management Protocol — monitors/manages network devices. v3 adds encryption & authentication. Used for network monitoring." },
  { name: "LDAP", ports: "389, 636 (LDAPS)", transport: "TCP", desc: "Lightweight Directory Access Protocol — queries directory services (e.g., Active Directory). LDAPS uses SSL/TLS on port 636." },
  { name: "RDP", ports: "3389", transport: "TCP & UDP", desc: "Remote Desktop Protocol — graphical remote access to Windows systems." },
  { name: "SIP", ports: "5060, 5061 (TLS)", transport: "TCP & UDP", desc: "Session Initiation Protocol — initiates, maintains, and terminates VoIP sessions." },
  { name: "NTP", ports: "123", transport: "UDP", desc: "Network Time Protocol — synchronizes clocks across network devices. Critical for logging, certificates, and authentication." },
  { name: "Syslog", ports: "514", transport: "UDP", desc: "Sends log messages to a centralized server for log aggregation and analysis." },
  { name: "RADIUS", ports: "1812 (auth), 1813 (acct)", transport: "UDP", desc: "Remote Authentication Dial-In User Service — centralized AAA. Encrypts only the password." },
  { name: "TACACS+", ports: "49", transport: "TCP", desc: "Terminal Access Controller Access-Control System Plus — Cisco's AAA protocol. Encrypts entire payload. Separates authentication, authorization, accounting." }
];

const TRAFFIC_TYPES = [
  { name: "Unicast", icon: "➡️", desc: "One-to-one communication. A single source sends data to a single specific destination. Most common traffic type.", example: "Your computer loading a web page from a server." },
  { name: "Broadcast", icon: "📢", desc: "One-to-all communication within a broadcast domain. Sent to all devices on the local network segment. Uses broadcast address (255.255.255.255 or subnet broadcast). Limited to L2 domain — routers do NOT forward broadcasts.", example: "ARP request: 'Who has 192.168.1.1? Tell 192.168.1.100'" },
  { name: "Multicast", icon: "📡", desc: "One-to-many communication to a group of interested receivers. Uses Class D addresses (224.0.0.0 – 239.255.255.255). Devices must join the multicast group (IGMP). More efficient than broadcast for group communication.", example: "IPTV streaming to subscribed users, OSPF routing updates (224.0.0.5)." },
  { name: "Anycast", icon: "🎯", desc: "One-to-nearest communication. Multiple servers share the same IP address. Network routes traffic to the topologically closest server. Used primarily in IPv6 and CDN/DNS infrastructure.", example: "DNS root servers — multiple servers worldwide share the same anycast IP." }
];

const CABLE_TYPES = [
  { name: "Cat5e", type: "Copper UTP", speed: "1 Gbps", distance: "100m", connector: "RJ45", desc: "Enhanced Category 5. Most common for basic Gigabit Ethernet." },
  { name: "Cat6", type: "Copper UTP/STP", speed: "10 Gbps (55m)", distance: "100m (1G) / 55m (10G)", connector: "RJ45", desc: "Better crosstalk protection. Supports 10G at shorter distances." },
  { name: "Cat6a", type: "Copper STP", speed: "10 Gbps", distance: "100m", connector: "RJ45", desc: "Augmented Cat6. Full 10G at 100m. Thicker shielded cable." },
  { name: "Cat7", type: "Copper STP", speed: "10 Gbps", distance: "100m", connector: "GG45/TERA", desc: "Individually shielded pairs. Not TIA/EIA recognized." },
  { name: "Cat8", type: "Copper STP", speed: "25/40 Gbps", distance: "30m", connector: "RJ45", desc: "Data center use. Short distance, very high speed." },
  { name: "Single-Mode Fiber (SMF)", type: "Fiber Optic", speed: "100+ Gbps", distance: "Up to 80+ km", connector: "LC, SC, ST, MPO", desc: "Small core (8-10μm). Laser light source. Long distance. Yellow jacket." },
  { name: "Multi-Mode Fiber (MMF)", type: "Fiber Optic", speed: "Up to 100 Gbps", distance: "Up to 550m (OM4)", connector: "LC, SC, ST, MPO", desc: "Larger core (50/62.5μm). LED/VCSEL source. Shorter distance. Orange/aqua jacket." },
  { name: "Coaxial (RG-6)", type: "Coax", speed: "Varies (DOCSIS)", distance: "500m+", connector: "F-type", desc: "Cable TV and internet (DOCSIS). Shielded single conductor." },
  { name: "Coaxial (RG-59)", type: "Coax", speed: "Lower", distance: "Shorter", connector: "BNC, F-type", desc: "Older CCTV and analog video. Thinner, less shielding than RG-6." },
  { name: "Direct Attach Copper (DAC)", type: "Twinax", speed: "10/25/40/100 Gbps", distance: "Up to 7m", connector: "SFP+/QSFP+", desc: "Short-range data center interconnects. Lower cost/power than optics." },
  { name: "Rollover (Console)", type: "Copper", speed: "N/A", distance: "Short", connector: "RJ45 to DB9/USB", desc: "Console cable for out-of-band device management. Pins reversed end to end." }
];

const CONNECTORS = [
  { name: "RJ45", use: "Ethernet (Cat5e–Cat8)", desc: "8-pin modular connector. Most common network connector. Used with UTP/STP copper cables." },
  { name: "RJ11", use: "Telephone / DSL", desc: "6-pin (typically 2 or 4 wires used). Smaller than RJ45. Phone lines and some DSL connections." },
  { name: "LC", use: "Fiber Optic", desc: "Lucent Connector — small form factor, push-pull. Most common fiber connector in data centers. 1.25mm ferrule." },
  { name: "SC", use: "Fiber Optic", desc: "Subscriber/Standard Connector — push-pull square design. 2.5mm ferrule. Common in telecom." },
  { name: "ST", use: "Fiber Optic", desc: "Straight Tip — bayonet twist-lock. 2.5mm ferrule. Older, still found in some installations." },
  { name: "MPO/MTP", use: "Fiber Optic (multi-fiber)", desc: "Multi-fiber Push On — 12, 24, or 72 fibers in one connector. Used for high-density data center runs and 40G/100G links." },
  { name: "F-type", use: "Coaxial (cable TV)", desc: "Threaded coax connector. Used with RG-6 for cable TV, internet (DOCSIS), and satellite." },
  { name: "BNC", use: "Coaxial (older)", desc: "Bayonet Neill–Concelman. Twist-lock coax connector. Legacy Ethernet (10BASE2), CCTV, test equipment." },
  { name: "SFP/SFP+", use: "Transceiver module", desc: "Small Form-factor Pluggable. Hot-swappable. SFP = 1G, SFP+ = 10G. Takes LC fiber or DAC." },
  { name: "QSFP/QSFP+/QSFP28", use: "Transceiver module", desc: "Quad SFP. 4 channels. QSFP+ = 40G, QSFP28 = 100G. Used for high-speed uplinks and spine-leaf." }
];

const TOPOLOGIES = [
  { name: "Star / Hub-and-Spoke", desc: "All nodes connect to a central device (switch/hub). Easy to manage, single point of failure at center. Most common LAN topology.", pros: "Easy to add/remove devices, fault isolation", cons: "Central device is SPOF, more cabling" },
  { name: "Mesh (Full)", desc: "Every node connects to every other node. Maximum redundancy. Formula: n(n-1)/2 links. Common in WAN core.", pros: "Maximum redundancy, no SPOF", cons: "Expensive, complex, many cables" },
  { name: "Mesh (Partial)", desc: "Some nodes have multiple connections but not all-to-all. Balances redundancy and cost.", pros: "Good redundancy, more practical", cons: "More complex than star" },
  { name: "Hybrid", desc: "Combines two or more topologies. E.g., star-mesh or star-bus. Most real networks are hybrid.", pros: "Flexible, scalable", cons: "Complex to design and manage" },
  { name: "Point-to-Point", desc: "Direct link between exactly two devices. WAN links, serial connections, direct fiber runs.", pros: "Simple, dedicated bandwidth", cons: "Only connects two endpoints" },
  { name: "Spine-and-Leaf", desc: "Modern data center topology. Every leaf switch connects to every spine switch. No leaf-to-leaf or spine-to-spine links. Consistent hop count.", pros: "Predictable latency, easy to scale, no STP needed", cons: "Requires many cables, all spine-to-leaf" },
  { name: "Three-Tier", desc: "Traditional enterprise: Core → Distribution → Access. Core handles fast transport, Distribution handles policy/routing, Access connects endpoints.", pros: "Scalable, hierarchical, role separation", cons: "More devices, higher latency than collapsed" },
  { name: "Collapsed Core", desc: "Combines Core and Distribution into one tier. Two tiers: Core/Distribution + Access. Used in smaller networks.", pros: "Lower cost, simpler, fewer devices", cons: "Less scalable than three-tier" }
];

const CLOUD_CONCEPTS = {
  deployment: [
    { name: "Public Cloud", desc: "Shared infrastructure owned by a provider (AWS, Azure, GCP). Multi-tenant. Pay-as-you-go. Accessible over internet." },
    { name: "Private Cloud", desc: "Dedicated infrastructure for a single organization. Can be on-premises or hosted. Greater control and security." },
    { name: "Hybrid Cloud", desc: "Combination of public and private clouds. Data and apps can move between them. Balances security and scalability." },
    { name: "Community Cloud", desc: "Shared by organizations with common concerns (compliance, security). Managed by one or more of the organizations or a third party." }
  ],
  service: [
    { name: "IaaS", full: "Infrastructure as a Service", desc: "Provider manages hardware, hypervisor. You manage OS, middleware, apps, data. Example: AWS EC2, Azure VMs.", you: "OS, Middleware, Runtime, Apps, Data", provider: "Hardware, Networking, Storage, Virtualization" },
    { name: "PaaS", full: "Platform as a Service", desc: "Provider manages up through runtime. You manage apps and data only. Example: Heroku, Azure App Service, Google App Engine.", you: "Apps, Data", provider: "Hardware, Networking, OS, Middleware, Runtime" },
    { name: "SaaS", full: "Software as a Service", desc: "Provider manages everything. You just use the application. Example: Microsoft 365, Salesforce, Gmail.", you: "Just use it", provider: "Everything — Hardware through Application" }
  ],
  networking: [
    { name: "VPC", full: "Virtual Private Cloud", desc: "Logically isolated network within a public cloud. You define subnets, route tables, gateways. Your own private network space in the cloud." },
    { name: "NFV", full: "Network Functions Virtualization", desc: "Replaces hardware network appliances with software running on standard servers. Virtual routers, firewalls, load balancers." },
    { name: "Network Security Groups", desc: "Cloud-based stateful firewall rules applied to VPC subnets or individual instances. Allow/deny traffic by port, protocol, source/destination." },
    { name: "Cloud Gateway", desc: "Connects your on-premises network to the cloud VPC. Types: VPN Gateway (encrypted tunnel over internet), Direct Connect/ExpressRoute (dedicated private link)." }
  ]
};

const IPV4_DATA = {
  classes: [
    { cls: "A", range: "1.0.0.0 – 126.255.255.255", mask: "/8 (255.0.0.0)", hosts: "16,777,214", purpose: "Large networks", private: "10.0.0.0/8" },
    { cls: "B", range: "128.0.0.0 – 191.255.255.255", mask: "/16 (255.255.0.0)", hosts: "65,534", purpose: "Medium networks", private: "172.16.0.0/12" },
    { cls: "C", range: "192.0.0.0 – 223.255.255.255", mask: "/24 (255.255.255.0)", hosts: "254", purpose: "Small networks", private: "192.168.0.0/16" },
    { cls: "D", range: "224.0.0.0 – 239.255.255.255", mask: "N/A", hosts: "N/A", purpose: "Multicast", private: "N/A" },
    { cls: "E", range: "240.0.0.0 – 255.255.255.255", mask: "N/A", hosts: "N/A", purpose: "Experimental / Reserved", private: "N/A" }
  ],
  special: [
    { name: "Loopback", range: "127.0.0.0/8", desc: "Testing local TCP/IP stack. 127.0.0.1 most common. Never leaves the host." },
    { name: "APIPA", range: "169.254.0.0/16", desc: "Automatic Private IP Addressing. Self-assigned when DHCP fails. Link-local only." },
    { name: "RFC 1918 (Private)", range: "10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16", desc: "Non-routable on the internet. Used internally. Require NAT to reach the internet." }
  ],
  subnetting: "VLSM (Variable Length Subnet Masking): Allows subnets of different sizes within the same network — efficient IP use. CIDR (Classless Inter-Domain Routing): Uses prefix notation (e.g., /22) instead of classful boundaries. Enables route aggregation (supernetting). To calculate hosts: 2^(32 - prefix) - 2. To calculate subnets from a classful network: 2^(new bits borrowed)."
};

const ROUTING_TECH = [
  { name: "Static Routing", type: "Manual", desc: "Manually configured routes. Admin defines next-hop for each destination. Good for small/stub networks. No overhead, but doesn't adapt to changes." },
  { name: "OSPF", type: "Dynamic – Link State", desc: "Open Shortest Path First. Uses Dijkstra's algorithm. Area-based hierarchy (Area 0 = backbone). AD: 110. Metric: cost (bandwidth). Open standard." },
  { name: "BGP", type: "Dynamic – Path Vector", desc: "Border Gateway Protocol. THE internet routing protocol. Routes between autonomous systems (AS). AD: eBGP=20, iBGP=200. Uses path attributes for selection." },
  { name: "EIGRP", type: "Dynamic – Hybrid/Advanced DV", desc: "Enhanced Interior Gateway Routing Protocol. Cisco-originated (now open). AD: 90. Metric: composite (bandwidth, delay, reliability, load). Fast convergence (DUAL algorithm)." },
  { name: "NAT/PAT", type: "Address Translation", desc: "NAT: Maps private IPs to public IPs (one-to-one or pool). PAT (Port Address Translation / NAT overload): Many private IPs share ONE public IP using different port numbers. Most home routers use PAT." },
  { name: "FHRP", type: "Redundancy", desc: "First Hop Redundancy Protocol. Provides gateway redundancy. HSRP (Cisco), VRRP (open standard), GLBP (Cisco, load balancing). Multiple routers share a VIP (Virtual IP) as the default gateway." }
];

const SWITCHING_TECH = [
  { name: "VLANs", desc: "Virtual LANs segment a switch into multiple broadcast domains. Each VLAN = separate broadcast domain. Traffic between VLANs requires a router (inter-VLAN routing). Default VLAN is 1. Management, native, and voice VLANs should be configured." },
  { name: "Trunk Ports (802.1Q)", desc: "Carry traffic for multiple VLANs between switches. 802.1Q inserts a VLAN tag (4 bytes) into the Ethernet frame. Native VLAN traffic is untagged." },
  { name: "STP (Spanning Tree Protocol)", desc: "Prevents Layer 2 loops. Elects a Root Bridge (lowest Bridge ID). Ports: Root, Designated, Blocked. RSTP (802.1w) converges faster. STP uses BPDUs to communicate." },
  { name: "Port Security", desc: "Limits MAC addresses per port. Violation modes: Protect (drop), Restrict (drop + log), Shutdown (err-disable port). Prevents MAC flooding attacks." },
  { name: "MTU / Jumbo Frames", desc: "Maximum Transmission Unit — largest frame size. Standard Ethernet MTU: 1500 bytes. Jumbo frames: up to 9000+ bytes. Must be configured on ALL devices in the path. Reduces overhead for large transfers." },
  { name: "EtherChannel / Link Aggregation", desc: "Bundles multiple physical links into one logical link. Increases bandwidth and provides redundancy. LACP (802.3ad, open standard) or PAgP (Cisco). STP sees it as a single link." }
];

const SECURITY_DATA = {
  terminology: [
    { term: "Risk", def: "The potential for loss or damage. Risk = Threat × Vulnerability × Impact." },
    { term: "Vulnerability", def: "A weakness in a system that can be exploited (e.g., unpatched software, open port, misconfiguration)." },
    { term: "Exploit", def: "A method or tool used to take advantage of a vulnerability." },
    { term: "Threat", def: "Any potential danger to an asset (e.g., attacker, malware, natural disaster)." },
    { term: "CIA Triad", def: "Confidentiality (only authorized access), Integrity (data is accurate and unmodified), Availability (systems are accessible when needed)." }
  ],
  attacks: [
    { name: "DoS/DDoS", desc: "Overwhelms a target to deny service. DDoS uses many sources (botnets). Types: volumetric, protocol, application layer." },
    { name: "VLAN Hopping", desc: "Attacker gains access to other VLANs. Methods: switch spoofing (pretending to be a trunk) or double tagging. Mitigate: disable DTP, set native VLAN to unused." },
    { name: "MAC Flooding", desc: "Floods switch with fake MACs to overflow CAM table. Switch fails open and acts like a hub (sends traffic everywhere). Mitigate: port security." },
    { name: "ARP Poisoning/Spoofing", desc: "Sends fake ARP replies to associate attacker's MAC with a target IP. Enables on-path (MITM) attacks. Mitigate: Dynamic ARP Inspection (DAI)." },
    { name: "DNS Poisoning/Spoofing", desc: "Corrupts DNS cache to redirect users to malicious sites. Mitigate: DNSSEC, secure DNS configurations." },
    { name: "Rogue Devices/Services", desc: "Unauthorized devices (rogue AP, DHCP server) on network. Mitigate: 802.1X NAC, DHCP snooping, wireless surveys." },
    { name: "Evil Twin", desc: "Rogue AP mimics a legitimate SSID. Users connect thinking it's real. Attacker intercepts traffic. Mitigate: wireless surveys, 802.1X, VPN." },
    { name: "On-Path Attack (MITM)", desc: "Attacker positions between two parties, intercepting/altering traffic. Often combined with ARP poisoning. Mitigate: encryption (HTTPS, VPN), certificate validation." },
    { name: "Social Engineering", desc: "Phishing (email), vishing (voice), smishing (SMS), dumpster diving, shoulder surfing, tailgating/piggybacking. Mitigate: security awareness training." }
  ],
  defenses: [
    { name: "Device Hardening", desc: "Disable unused ports/services, change defaults, strong passwords, firmware updates, banner messages." },
    { name: "NAC (Network Access Control)", desc: "Controls who/what can access the network. 802.1X authentication. Checks device health/posture before granting access." },
    { name: "ACLs", desc: "Access Control Lists — permit/deny traffic based on source/dest IP, port, protocol. Applied inbound or outbound on interfaces." },
    { name: "URL/Content Filtering", desc: "Blocks access to categories of websites or specific URLs. Can be on firewall, proxy, or DNS level." },
    { name: "Screened Subnet (DMZ)", desc: "Network segment between trusted (internal) and untrusted (internet) zones. Hosts public-facing servers (web, email, DNS)." },
    { name: "Honeypot / Honeynet", desc: "Deception technology. Honeypot: single decoy system. Honeynet: network of honeypots. Attracts attackers to study methods and divert from real assets." }
  ],
  logical: [
    { name: "Encryption", desc: "Data in transit: TLS/SSL, IPSec, VPN. Data at rest: AES, BitLocker, dm-crypt. Protects confidentiality." },
    { name: "PKI", desc: "Public Key Infrastructure. Certificate Authority (CA) issues digital certificates. Enables HTTPS, code signing, email encryption. Chain of trust." },
    { name: "IAM", desc: "Identity & Access Management. Manages user identities and their access permissions." },
    { name: "MFA", desc: "Multi-Factor Authentication. Combines: something you know (password), something you have (token/phone), something you are (biometric)." },
    { name: "SSO", desc: "Single Sign-On. One login grants access to multiple applications. Uses SAML, OAuth, OpenID Connect." },
    { name: "RADIUS", desc: "Centralized AAA. Encrypts password only. UDP. Common for network device and Wi-Fi authentication." },
    { name: "TACACS+", desc: "Cisco AAA. Encrypts full payload. TCP. Separates authentication, authorization, and accounting." },
    { name: "SAML", desc: "Security Assertion Markup Language. XML-based SSO protocol. Identity provider asserts user identity to service provider." },
    { name: "RBAC", desc: "Role-Based Access Control. Permissions assigned to roles, users assigned to roles. Implements least privilege." },
    { name: "Geofencing", desc: "Restricts access based on geographic location. Uses GPS, IP geolocation, or Wi-Fi positioning." }
  ]
};

const WIRELESS_DATA = {
  standards: [
    { std: "802.11a", freq: "5 GHz", speed: "54 Mbps", range: "~35m indoor", note: "First 5 GHz standard. Less interference." },
    { std: "802.11b", freq: "2.4 GHz", speed: "11 Mbps", range: "~38m indoor", note: "Early consumer Wi-Fi." },
    { std: "802.11g", freq: "2.4 GHz", speed: "54 Mbps", range: "~38m indoor", note: "Backward compatible with 802.11b." },
    { std: "802.11n (Wi-Fi 4)", freq: "2.4 & 5 GHz", speed: "600 Mbps", range: "~70m indoor", note: "MIMO. Dual band. Channel bonding (40 MHz)." },
    { std: "802.11ac (Wi-Fi 5)", freq: "5 GHz", speed: "6.9 Gbps", range: "~35m indoor", note: "MU-MIMO. 80/160 MHz channels. Beamforming." },
    { std: "802.11ax (Wi-Fi 6/6E)", freq: "2.4, 5, 6 GHz", speed: "9.6 Gbps", range: "Similar", note: "OFDMA. Target Wake Time. BSS Coloring. 6E adds 6 GHz." }
  ],
  encryption: ["Open (none)", "WEP (broken — never use)", "WPA (TKIP — deprecated)", "WPA2 (AES/CCMP — current standard)", "WPA3 (SAE — newest, strongest)"],
  auth: ["PSK (Pre-Shared Key) — shared password for all users", "802.1X / Enterprise — individual credentials via RADIUS", "Open — no authentication", "Captive Portal — web-based login (guest networks)"],
  antennas: ["Omnidirectional — radiates 360°, general coverage", "Directional (Yagi/Parabolic) — focused beam, long range", "MIMO — multiple antennas for spatial multiplexing"]
};

const MONITORING_DATA = [
  { name: "SNMP", desc: "Polls devices for status (OIDs/MIBs). v1/v2c use community strings; v3 adds encryption/auth. Agents on devices, NMS collects data. Traps for alerts." },
  { name: "Flow Data (NetFlow/sFlow/IPFIX)", desc: "Collects traffic flow statistics: source/dest IPs, ports, protocols, byte counts. Identifies top talkers, traffic patterns, anomalies." },
  { name: "Packet Capture", desc: "Full traffic capture for deep analysis. Tools: Wireshark, tcpdump. Port mirroring (SPAN port) to copy traffic to analyzer." },
  { name: "Port Mirroring (SPAN)", desc: "Switch copies traffic from one or more ports to an analysis port. Used for IDS, packet capture, and monitoring without inline devices." },
  { name: "Baseline Metrics", desc: "Normal operating parameters: bandwidth utilization, latency, CPU/memory usage, error rates. Deviations from baseline indicate problems." },
  { name: "Log Aggregation (Syslog/SIEM)", desc: "Centralize logs from all devices. Syslog (port 514). SIEM correlates events across sources for security analysis. Severity levels 0-7." },
  { name: "API Integration", desc: "Programmatic access to network devices and monitoring platforms. REST APIs for automation, configuration, and data retrieval." }
];

const DR_DATA = {
  metrics: [
    { name: "RPO", full: "Recovery Point Objective", desc: "Maximum acceptable data loss measured in time. How far back in time can you afford to lose data? Determines backup frequency." },
    { name: "RTO", full: "Recovery Time Objective", desc: "Maximum acceptable downtime. How quickly must systems be restored? Determines recovery strategy investment." },
    { name: "MTTR", full: "Mean Time To Repair", desc: "Average time to fix a failed component and restore service. Lower MTTR = faster recovery." },
    { name: "MTBF", full: "Mean Time Between Failures", desc: "Average time between system failures. Higher MTBF = more reliable. Used to predict failure rates." }
  ],
  sites: [
    { name: "Cold Site", desc: "Empty facility with power and space. No equipment pre-installed. Cheapest but longest recovery time (days/weeks).", rto: "Days – Weeks" },
    { name: "Warm Site", desc: "Facility with some equipment and connectivity. Data may need to be restored from backups. Medium cost and recovery.", rto: "Hours – Days" },
    { name: "Hot Site", desc: "Fully equipped mirror of production. Real-time or near-real-time data replication. Most expensive but fastest recovery.", rto: "Minutes – Hours" }
  ],
  ha: [
    { name: "Active-Active", desc: "Both sites handle traffic simultaneously. Load is shared. If one fails, the other absorbs all traffic. Best performance and fastest failover." },
    { name: "Active-Passive", desc: "Primary site handles all traffic. Secondary site is on standby. Failover occurs when primary fails. Simpler but idle resources." }
  ]
};

const TROUBLESHOOTING = {
  methodology: [
    "1. Identify the problem — gather info, question users, determine scope, verify the issue",
    "2. Establish a theory of probable cause — consider multiple possibilities, question the obvious, use OSI model (top-down, bottom-up, or divide-and-conquer)",
    "3. Test the theory — confirm/deny. If confirmed, determine next steps. If not, re-establish theory",
    "4. Establish a plan of action — identify potential effects, get approval if needed, plan implementation",
    "5. Implement the solution — or escalate as necessary",
    "6. Verify full system functionality — test, implement preventive measures",
    "7. Document findings, actions, outcomes, and lessons learned"
  ],
  cable: [
    { issue: "Incorrect Cable Type", desc: "Using straight-through where crossover needed (or vice versa). Wrong category for speed requirement." },
    { issue: "Signal Degradation / Attenuation", desc: "Signal weakens over distance. Exceeding maximum cable length. EMI from power cables or fluorescent lights." },
    { issue: "Improper Termination", desc: "Incorrect pin-out (T568A vs T568B mismatch). Loose crimps. Split pairs. Use cable tester to verify." },
    { issue: "TX/RX Transposed", desc: "Transmit and receive wires crossed. Can cause no link. Modern devices often have Auto-MDI/MDI-X to auto-detect." },
    { issue: "Crosstalk (NEXT/FEXT)", desc: "Signal interference between wire pairs. Near-End (NEXT) and Far-End (FEXT). Mitigate with proper twisting and shielding." }
  ],
  interface: [
    { issue: "CRC Errors", desc: "Frame check sequence failures. Indicates data corruption. Could be cable issue, duplex mismatch, or EMI." },
    { issue: "Giants / Runts", desc: "Giants: frames larger than max MTU. Runts: frames smaller than 64 bytes. Usually hardware or configuration issues." },
    { issue: "Duplex Mismatch", desc: "One side full-duplex, other half-duplex. Causes late collisions and poor performance. Ensure auto-negotiation or manual match." },
    { issue: "Port Status: err-disabled", desc: "Port shut down by switch due to security violation, BPDU guard, or other protective mechanism. Must be re-enabled." },
    { issue: "Speed Mismatch", desc: "Devices negotiated different speeds. Check auto-negotiation settings. Hardcode speed/duplex on both ends if issues." }
  ],
  tools: [
    { name: "ping", desc: "Tests IP connectivity using ICMP echo. Verifies L3 reachability. Shows RTT and packet loss." },
    { name: "traceroute / tracert", desc: "Shows each hop to destination. Uses TTL increments. Identifies where packets are being dropped or delayed." },
    { name: "nslookup / dig", desc: "DNS query tools. Tests name resolution. nslookup is interactive; dig provides detailed DNS responses." },
    { name: "ipconfig / ifconfig / ip", desc: "Shows IP configuration. ipconfig (Windows), ifconfig/ip (Linux). /release and /renew for DHCP." },
    { name: "netstat / ss", desc: "Shows active connections, listening ports, routing tables. ss is modern replacement for netstat." },
    { name: "arp -a", desc: "Displays ARP cache — IP-to-MAC mappings. Useful for troubleshooting L2/L3 issues." },
    { name: "Wireshark / tcpdump", desc: "Protocol analyzers for packet capture. Wireshark has GUI; tcpdump is CLI. Deep packet inspection." },
    { name: "Cable Tester / Certifier", desc: "Tests cable for continuity, wire map, length, crosstalk. Certifier verifies cable meets category specifications." },
    { name: "Wi-Fi Analyzer", desc: "Shows signal strength, channel usage, SSIDs, interference. Used for wireless site surveys and troubleshooting." },
    { name: "nmap", desc: "Network mapper — discovers hosts and services. Port scanning. OS detection. Security auditing." }
  ]
};

const SERVICES_DATA = [
  { name: "DHCP", desc: "Dynamic Host Configuration Protocol. Automatically assigns IP, mask, gateway, DNS. DORA: Discover (broadcast) → Offer → Request → Acknowledge. Lease time. DHCP relay for cross-subnet." },
  { name: "SLAAC", desc: "Stateless Address Autoconfiguration (IPv6). Host generates its own IPv6 address using network prefix from Router Advertisement + interface ID (EUI-64 or random). No DHCP server needed." },
  { name: "DNS", desc: "Domain Name System. Hierarchical: Root → TLD → Authoritative. Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), PTR (reverse), TXT, SRV, NS, SOA. Recursive vs iterative queries." },
  { name: "NTP", desc: "Network Time Protocol (port 123). Synchronizes clocks. Stratum levels: 0 (atomic clock) → 15 (max). Critical for logging, authentication, certificates." },
  { name: "PTP", desc: "Precision Time Protocol (IEEE 1588). Sub-microsecond accuracy. Used in financial trading, telecom, industrial automation. More precise than NTP." },
  { name: "NTS", desc: "Network Time Security. Adds authentication and encryption to NTP. Prevents time-based attacks." }
];

const DOCUMENTATION = [
  { name: "Physical Network Diagram", desc: "Shows actual hardware: devices, cable runs, rack locations, patch panels, port assignments. Used for installation and maintenance." },
  { name: "Logical Network Diagram", desc: "Shows IP addressing, VLANs, subnets, routing, logical connections. Doesn't show physical layout. Used for design and troubleshooting." },
  { name: "Rack Diagram", desc: "Visual layout of equipment in a rack. Shows U-spaces, power connections, cable routing. Used for data center planning." },
  { name: "Cable Map / Wiring Diagram", desc: "Documents every cable run: endpoints, labels, type, length, path. Essential for moves, adds, and changes." },
  { name: "Asset Inventory", desc: "Database of all network equipment: model, serial, location, firmware, purchase date, warranty, EOL dates. Used for lifecycle management." },
  { name: "IPAM", desc: "IP Address Management. Tracks all IP assignments, subnets, DHCP scopes, DNS records. Prevents conflicts and tracks utilization." },
  { name: "SLA", desc: "Service Level Agreement. Defines uptime guarantees, response times, performance metrics, penalties. Contractual obligation." },
  { name: "Wireless Survey / Heat Map", desc: "Maps wireless coverage and signal strength. Identifies dead zones, interference, optimal AP placement. Site surveys before and after deployment." }
];

const LIFECYCLE = [
  { name: "EOL (End of Life)", desc: "Vendor stops selling the product. No new features. May still receive security patches for a time." },
  { name: "EOS (End of Support)", desc: "Vendor stops ALL support — no patches, no bug fixes, no security updates. CRITICAL to replace before EOS." },
  { name: "Software/Firmware Management", desc: "Regular updates for security patches, bug fixes, features. Test in lab before production. Maintain rollback plan." },
  { name: "Decommissioning", desc: "Properly retire equipment: wipe data, remove configurations, update documentation, recycle responsibly, remove from monitoring." }
];

const SEGMENTATION = [
  { name: "IoT / IIoT", desc: "Internet of Things / Industrial IoT. Isolate on separate VLAN/segment. Often insecure — limited patching capability. Use ACLs to restrict access." },
  { name: "SCADA / ICS / OT", desc: "Supervisory Control and Data Acquisition / Industrial Control Systems / Operational Technology. Critical infrastructure. Air-gap or heavily segment from IT network. Prioritize availability." },
  { name: "Guest Network", desc: "Isolated network for visitors. No access to internal resources. Often uses captive portal authentication. Bandwidth limits." },
  { name: "BYOD", desc: "Bring Your Own Device. Employee personal devices. Segment from corporate network. Use NAC, MDM, and conditional access policies." }
];

// ─── Section definitions ───────────────────────────────────────────────────
// ─── Components ──────────────────────────────────────────────────────────────

const Pill = ({children, active, onClick, color}) => (
  <button onClick={onClick} style={{
    padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? color || "#00e5ff" : "rgba(255,255,255,0.15)"}`,
    background: active ? `${color || "#00e5ff"}22` : "rgba(255,255,255,0.04)",
    color: active ? color || "#00e5ff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
    transition: "all 0.2s", fontWeight: active ? 600 : 400, whiteSpace: "nowrap"
  }}>{children}</button>
);

const Card = ({children, title, color, onClick, style}) => (
  <div onClick={onClick} style={{
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
    padding: "18px 20px", cursor: onClick ? "pointer" : "default", transition: "all 0.25s",
    borderLeft: color ? `3px solid ${color}` : undefined, ...style,
    ...(onClick ? {} : {})
  }}
  onMouseEnter={e => { if(onClick) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = color || "rgba(255,255,255,0.2)"; }}}
  onMouseLeave={e => { if(onClick) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}}
  >
    {title && <div style={{ fontSize: 14, fontWeight: 700, color: color || "#e2e8f0", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>{title}</div>}
    {children}
  </div>
);

const Badge = ({children, color}) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 6, background: `${color}22`,
    color, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", marginRight: 6
  }}>{children}</span>
);

const InfoRow = ({label, value}) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
    <span style={{ color: "#64748b" }}>{label}</span>
    <span style={{ color: "#cbd5e1", textAlign: "right", maxWidth: "60%" }}>{value}</span>
  </div>
);

const SectionHeader = ({icon, title, subtitle}) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 28 }}>{icon}</span> {title}
    </div>
    {subtitle && <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.6 }}>{subtitle}</div>}
  </div>
);

// ─── Section Renderers ───────────────────────────────────────────────────────

function PortsSection() {
  const [filter, setFilter] = useState("");
  const filtered = PORTS_PROTOCOLS.filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.ports.includes(filter));
  return (
    <div>
      <SectionHeader icon="🔌" title="Ports & Protocols" subtitle="Search by name or port number. Memorize these for the exam!" />
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search protocols or ports..."
        style={{ width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16, outline: "none", boxSizing: "border-box" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {filtered.map(p => (
          <Card key={p.name} color="#a78bfa" title={p.name}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Badge color="#c084fc">Port {p.ports}</Badge>
              <Badge color="#38bdf8">{p.transport}</Badge>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{p.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TrafficSection() {
  return (
    <div>
      <SectionHeader icon="📡" title="Traffic Types" subtitle="How data is addressed and delivered on a network." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {TRAFFIC_TYPES.map(t => (
          <Card key={t.name} color="#fbbf24" title={`${t.icon} ${t.name}`}>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>{t.desc}</div>
            <div style={{ fontSize: 11, color: "#fbbf24", padding: "8px 10px", background: "rgba(251,191,36,0.08)", borderRadius: 6 }}>
              <strong>Example:</strong> {t.example}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CablingSection() {
  const [tab, setTab] = useState("cables");
  return (
    <div>
      <SectionHeader icon="🔗" title="Cabling & Connectors" subtitle="Transmission media, cable categories, fiber types, and connector types." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Pill active={tab==="cables"} onClick={() => setTab("cables")} color="#10b981">Cables & Media</Pill>
        <Pill active={tab==="conn"} onClick={() => setTab("conn")} color="#10b981">Connectors & Transceivers</Pill>
      </div>
      {tab === "cables" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
          {CABLE_TYPES.map(c => (
            <Card key={c.name} color="#10b981" title={c.name}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                <Badge color="#34d399">{c.type}</Badge>
                <Badge color="#06b6d4">{c.speed}</Badge>
                <Badge color="#818cf8">{c.distance}</Badge>
              </div>
              <InfoRow label="Connector" value={c.connector} />
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginTop: 6 }}>{c.desc}</div>
            </Card>
          ))}
        </div>
      )}
      {tab === "conn" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {CONNECTORS.map(c => (
            <Card key={c.name} color="#06b6d4" title={c.name}>
              <Badge color="#22d3ee">{c.use}</Badge>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginTop: 8 }}>{c.desc}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TopologySection() {
  return (
    <div>
      <SectionHeader icon="🕸️" title="Network Topologies" subtitle="Physical and logical arrangements of network devices." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {TOPOLOGIES.map(t => (
          <Card key={t.name} color="#f472b6" title={t.name}>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>{t.desc}</div>
            <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 2 }}>✓ {t.pros}</div>
            <div style={{ fontSize: 11, color: "#f87171" }}>✗ {t.cons}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CloudSection() {
  const [tab, setTab] = useState("deploy");
  return (
    <div>
      <SectionHeader icon="☁️" title="Cloud Concepts" subtitle="Deployment models, service models, and cloud networking." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="deploy"} onClick={() => setTab("deploy")} color="#818cf8">Deployment Models</Pill>
        <Pill active={tab==="service"} onClick={() => setTab("service")} color="#818cf8">Service Models</Pill>
        <Pill active={tab==="net"} onClick={() => setTab("net")} color="#818cf8">Cloud Networking</Pill>
      </div>
      {tab === "deploy" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {CLOUD_CONCEPTS.deployment.map(c => <Card key={c.name} color="#818cf8" title={c.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{c.desc}</div></Card>)}
      </div>}
      {tab === "service" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {CLOUD_CONCEPTS.service.map(c => (
          <Card key={c.name} color="#a78bfa" title={`${c.name} — ${c.full}`}>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 10 }}>{c.desc}</div>
            <InfoRow label="You manage" value={c.you} />
            <InfoRow label="Provider manages" value={c.provider} />
          </Card>
        ))}
      </div>}
      {tab === "net" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {CLOUD_CONCEPTS.networking.map(c => <Card key={c.name} color="#c084fc" title={c.full ? `${c.name} — ${c.full}` : c.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{c.desc}</div></Card>)}
      </div>}
    </div>
  );
}

function IPv4Section() {
  const [tab, setTab] = useState("classes");
  return (
    <div>
      <SectionHeader icon="🏷️" title="IPv4 Addressing" subtitle="Address classes, private ranges, special addresses, CIDR, and VLSM." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="classes"} onClick={() => setTab("classes")} color="#fb923c">Address Classes</Pill>
        <Pill active={tab==="special"} onClick={() => setTab("special")} color="#fb923c">Special Addresses</Pill>
        <Pill active={tab==="subnet"} onClick={() => setTab("subnet")} color="#fb923c">Subnetting / CIDR</Pill>
      </div>
      {tab === "classes" && <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          <thead><tr>{["Class","Range","Default Mask","Hosts","Purpose","Private Range"].map(h => <th key={h} style={{ padding: "10px 12px", borderBottom: "2px solid #fb923c44", color: "#fb923c", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>)}</tr></thead>
          <tbody>{IPV4_DATA.classes.map(c => (
            <tr key={c.cls} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700, color: "#e2e8f0" }}>{c.cls}</td>
              <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{c.range}</td>
              <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{c.mask}</td>
              <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{c.hosts}</td>
              <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{c.purpose}</td>
              <td style={{ padding: "10px 12px", color: "#fb923c" }}>{c.private}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>}
      {tab === "special" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {IPV4_DATA.special.map(s => <Card key={s.name} color="#fb923c" title={s.name}><Badge color="#fb923c">{s.range}</Badge><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginTop: 8 }}>{s.desc}</div></Card>)}
      </div>}
      {tab === "subnet" && <Card color="#fb923c" title="Subnetting, VLSM, & CIDR"><div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{IPV4_DATA.subnetting}</div></Card>}
    </div>
  );
}

function RoutingSection() {
  return (
    <div>
      <SectionHeader icon="🔀" title="Routing Technologies" subtitle="Static, dynamic routing protocols, NAT/PAT, and first-hop redundancy." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {ROUTING_TECH.map(r => (
          <Card key={r.name} color="#22d3ee" title={r.name}>
            <Badge color="#06b6d4">{r.type}</Badge>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginTop: 8 }}>{r.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SwitchingSection() {
  return (
    <div>
      <SectionHeader icon="🔳" title="Switching Technologies" subtitle="VLANs, trunking, STP, port security, and MTU." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {SWITCHING_TECH.map(s => (
          <Card key={s.name} color="#a78bfa" title={s.name}>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WirelessSection() {
  const [tab, setTab] = useState("std");
  return (
    <div>
      <SectionHeader icon="📶" title="Wireless Technologies" subtitle="802.11 standards, encryption, authentication, and antenna types." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="std"} onClick={() => setTab("std")} color="#fbbf24">Standards</Pill>
        <Pill active={tab==="sec"} onClick={() => setTab("sec")} color="#fbbf24">Security</Pill>
        <Pill active={tab==="ant"} onClick={() => setTab("ant")} color="#fbbf24">Antennas & Misc</Pill>
      </div>
      {tab === "std" && <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          <thead><tr>{["Standard","Frequency","Max Speed","Range","Notes"].map(h => <th key={h} style={{ padding: "10px 12px", borderBottom: "2px solid #fbbf2444", color: "#fbbf24", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>)}</tr></thead>
          <tbody>{WIRELESS_DATA.standards.map(s => (
            <tr key={s.std} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {[s.std, s.freq, s.speed, s.range, s.note].map((v,i) => <td key={i} style={{ padding: "10px 12px", color: i === 0 ? "#e2e8f0" : "#94a3b8", fontWeight: i === 0 ? 600 : 400 }}>{v}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>}
      {tab === "sec" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        <Card color="#fbbf24" title="Encryption Standards">{WIRELESS_DATA.encryption.map(e => <div key={e} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{e}</div>)}</Card>
        <Card color="#f59e0b" title="Authentication Methods">{WIRELESS_DATA.auth.map(a => <div key={a} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{a}</div>)}</Card>
      </div>}
      {tab === "ant" && <Card color="#fbbf24" title="Antenna Types">
        {WIRELESS_DATA.antennas.map(a => <div key={a} style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{a}</div>)}
        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          <strong style={{ color: "#fbbf24" }}>Channels:</strong> 2.4 GHz has 11 channels (US), non-overlapping: 1, 6, 11. 5 GHz has 24+ non-overlapping channels (DFS/non-DFS). 6 GHz (Wi-Fi 6E) adds 59 more channels.
          <br/><strong style={{ color: "#fbbf24" }}>SSID:</strong> Service Set Identifier — the network name. Can be hidden (not broadcast) but still discoverable.
          <br/><strong style={{ color: "#fbbf24" }}>Guest Networks:</strong> Isolated SSID with separate VLAN, captive portal, bandwidth limits, no internal access.
        </div>
      </Card>}
    </div>
  );
}

function ServicesSection() {
  return (
    <div>
      <SectionHeader icon="⚙️" title="Network Services" subtitle="Essential services that make networks functional." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {SERVICES_DATA.map(s => <Card key={s.name} color="#2dd4bf" title={s.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s.desc}</div></Card>)}
      </div>
    </div>
  );
}

function MonitoringSection() {
  return (
    <div>
      <SectionHeader icon="📊" title="Network Monitoring" subtitle="SNMP, flow data, packet capture, and log aggregation." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
        {MONITORING_DATA.map(m => <Card key={m.name} color="#38bdf8" title={m.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{m.desc}</div></Card>)}
      </div>
    </div>
  );
}

function DRSection() {
  const [tab, setTab] = useState("metrics");
  return (
    <div>
      <SectionHeader icon="🔥" title="Disaster Recovery & HA" subtitle="Recovery metrics, site types, and high-availability configurations." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="metrics"} onClick={() => setTab("metrics")} color="#ef4444">Recovery Metrics</Pill>
        <Pill active={tab==="sites"} onClick={() => setTab("sites")} color="#ef4444">Site Types</Pill>
        <Pill active={tab==="ha"} onClick={() => setTab("ha")} color="#ef4444">HA Configurations</Pill>
      </div>
      {tab === "metrics" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {DR_DATA.metrics.map(m => <Card key={m.name} color="#ef4444" title={`${m.name} — ${m.full}`}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{m.desc}</div></Card>)}
      </div>}
      {tab === "sites" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {DR_DATA.sites.map(s => <Card key={s.name} color="#f87171" title={s.name}><Badge color="#ef4444">RTO: {s.rto}</Badge><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginTop: 8 }}>{s.desc}</div></Card>)}
      </div>}
      {tab === "ha" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {DR_DATA.ha.map(h => <Card key={h.name} color="#fb923c" title={h.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{h.desc}</div></Card>)}
      </div>}
    </div>
  );
}

function SecuritySection() {
  const [tab, setTab] = useState("terms");
  return (
    <div>
      <SectionHeader icon="🛡️" title="Security Fundamentals" subtitle="CIA triad, terminology, logical security, and physical security." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="terms"} onClick={() => setTab("terms")} color="#f43f5e">Terminology</Pill>
        <Pill active={tab==="logical"} onClick={() => setTab("logical")} color="#f43f5e">Logical Security</Pill>
        <Pill active={tab==="compliance"} onClick={() => setTab("compliance")} color="#f43f5e">Compliance & Physical</Pill>
      </div>
      {tab === "terms" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {SECURITY_DATA.terminology.map(t => <Card key={t.term} color="#f43f5e" title={t.term}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{t.def}</div></Card>)}
      </div>}
      {tab === "logical" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {SECURITY_DATA.logical.map(l => <Card key={l.name} color="#e879f9" title={l.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{l.desc}</div></Card>)}
      </div>}
      {tab === "compliance" && <div>
        <Card color="#f43f5e" title="Audits & Compliance" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
            <strong style={{ color: "#f43f5e" }}>PCI DSS:</strong> Payment Card Industry Data Security Standard. Required for handling credit card data. 12 requirements covering network security, data protection, access control, monitoring, and policy.<br/>
            <strong style={{ color: "#f43f5e" }}>GDPR:</strong> General Data Protection Regulation (EU). Governs data privacy and protection. Right to be forgotten, data portability, breach notification within 72 hours.<br/>
            <strong style={{ color: "#f43f5e" }}>Data Locality:</strong> Laws requiring data to be stored/processed within geographic boundaries. Impacts cloud deployment decisions.
          </div>
        </Card>
        <Card color="#a78bfa" title="Physical Security">
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
            <strong style={{ color: "#a78bfa" }}>Cameras (CCTV):</strong> Visual monitoring and recording. Deters and documents unauthorized access.<br/>
            <strong style={{ color: "#a78bfa" }}>Locks:</strong> Physical (key/combination), electronic (badge/biometric), server rack locks, cable locks for equipment.<br/>
            <strong style={{ color: "#a78bfa" }}>Environmental:</strong> HVAC for cooling, fire suppression (clean agent), UPS/generators for power, humidity monitoring.
          </div>
        </Card>
      </div>}
    </div>
  );
}

function AttacksSection() {
  const [tab, setTab] = useState("attacks");
  return (
    <div>
      <SectionHeader icon="⚔️" title="Attacks & Defense" subtitle="Common attacks, defense mechanisms, and deception technologies." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="attacks"} onClick={() => setTab("attacks")} color="#ef4444">Attacks</Pill>
        <Pill active={tab==="defense"} onClick={() => setTab("defense")} color="#22c55e">Defenses</Pill>
      </div>
      {tab === "attacks" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {SECURITY_DATA.attacks.map(a => <Card key={a.name} color="#ef4444" title={a.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{a.desc}</div></Card>)}
      </div>}
      {tab === "defense" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {SECURITY_DATA.defenses.map(d => <Card key={d.name} color="#22c55e" title={d.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{d.desc}</div></Card>)}
      </div>}
    </div>
  );
}

function SegmentationSection() {
  return (
    <div>
      <SectionHeader icon="🧩" title="Network Segmentation" subtitle="Isolating network zones for security and compliance." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {SEGMENTATION.map(s => <Card key={s.name} color="#f472b6" title={s.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s.desc}</div></Card>)}
      </div>
    </div>
  );
}

function DocumentationSection() {
  return (
    <div>
      <SectionHeader icon="📋" title="Documentation" subtitle="Diagrams, inventories, and documentation standards for network management." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {DOCUMENTATION.map(d => <Card key={d.name} color="#6ee7b7" title={d.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{d.desc}</div></Card>)}
      </div>
    </div>
  );
}

function LifecycleSection() {
  return (
    <div>
      <SectionHeader icon="♻️" title="Lifecycle & Change Management" subtitle="EOL, EOS, decommissioning, change management, and configuration management." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, marginBottom: 20 }}>
        {LIFECYCLE.map(l => <Card key={l.name} color="#c084fc" title={l.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{l.desc}</div></Card>)}
      </div>
      <Card color="#818cf8" title="Change Management">
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          <strong style={{ color: "#818cf8" }}>Change Request Process:</strong> Submit request → Review/approve (CAB) → Schedule maintenance window → Implement change → Test/verify → Document results. Track all changes with ticket numbers, dates, approvals, and outcomes.
        </div>
      </Card>
      <Card color="#38bdf8" title="Configuration Management" style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          <strong style={{ color: "#38bdf8" }}>Production Config:</strong> Active running configuration on live devices.<br/>
          <strong style={{ color: "#38bdf8" }}>Backup Config:</strong> Saved copy of configurations. Regular automated backups. Stored securely off-device.<br/>
          <strong style={{ color: "#38bdf8" }}>Baseline Config:</strong> Known-good configuration template. Standard settings applied to new devices. Used for compliance verification.
        </div>
      </Card>
    </div>
  );
}

function TroubleshootingSection() {
  const [tab, setTab] = useState("method");
  return (
    <div>
      <SectionHeader icon="🔧" title="Troubleshooting" subtitle="CompTIA troubleshooting methodology, common issues, and diagnostic tools." />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={tab==="method"} onClick={() => setTab("method")} color="#f97316">Methodology</Pill>
        <Pill active={tab==="cable"} onClick={() => setTab("cable")} color="#f97316">Cable & Interface</Pill>
        <Pill active={tab==="network"} onClick={() => setTab("network")} color="#f97316">Network Issues</Pill>
        <Pill active={tab==="tools"} onClick={() => setTab("tools")} color="#f97316">Tools</Pill>
      </div>
      {tab === "method" && <Card color="#f97316" title="CompTIA Troubleshooting Methodology">
        {TROUBLESHOOTING.methodology.map((s,i) => (
          <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{s}</div>
        ))}
      </Card>}
      {tab === "cable" && <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f97316", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Cable Issues</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 20 }}>
          {TROUBLESHOOTING.cable.map(c => <Card key={c.issue} color="#f97316" title={c.issue}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{c.desc}</div></Card>)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Interface Issues</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {TROUBLESHOOTING.interface.map(i => <Card key={i.issue} color="#38bdf8" title={i.issue}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{i.desc}</div></Card>)}
        </div>
      </div>}
      {tab === "network" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        <Card color="#ef4444" title="Switching Issues"><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          <strong>STP issues:</strong> Root bridge election problems, port states stuck, convergence delays. Check BPDUs, verify root bridge.<br/>
          <strong>VLAN assignment:</strong> Wrong VLAN, missing trunk allowed list, native VLAN mismatch. Verify switchport config.<br/>
          <strong>ACLs:</strong> Implicit deny blocking traffic. Check rule order (top-down processing).
        </div></Card>
        <Card color="#f59e0b" title="Routing Issues"><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          <strong>Missing routes:</strong> Check routing table, verify protocol adjacencies, redistribute if needed.<br/>
          <strong>Incorrect default route:</strong> Traffic goes to wrong gateway. Verify with "show ip route".<br/>
          <strong>AD conflicts:</strong> Multiple protocols advertising same route. Lower AD wins.
        </div></Card>
        <Card color="#22d3ee" title="Address & Gateway Issues"><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          <strong>DHCP pool exhaustion:</strong> No available IPs. Client gets APIPA (169.254.x.x). Increase pool or reduce lease time.<br/>
          <strong>Wrong gateway:</strong> Can reach local subnet but not remote. Verify default gateway setting.<br/>
          <strong>Incorrect subnet mask:</strong> Devices appear on wrong subnet. Can't communicate with expected peers.
        </div></Card>
        <Card color="#a78bfa" title="Performance Issues"><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
          <strong>Congestion:</strong> Bandwidth saturation. QoS, traffic shaping, upgrade links.<br/>
          <strong>Latency:</strong> High delay. Check hop count, link speeds, processing delays.<br/>
          <strong>Packet loss:</strong> Dropped packets. Check error counters, buffer overflows, CRC errors.<br/>
          <strong>Wireless interference:</strong> Co-channel (same channel) or adjacent channel. Change channels, reduce power, add APs.
        </div></Card>
      </div>}
      {tab === "tools" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {TROUBLESHOOTING.tools.map(t => <Card key={t.name} color="#10b981" title={t.name}><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{t.desc}</div></Card>)}
      </div>}
    </div>
  );
}

function VPNAccessSection() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
      <Card color="#38bdf8" title="VPN (Virtual Private Network)"><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
        <strong style={{ color: "#38bdf8" }}>Site-to-Site:</strong> Connects two networks (e.g., branch offices). Uses IPSec. Always-on tunnel.<br/>
        <strong style={{ color: "#38bdf8" }}>Client-to-Site (Remote Access):</strong> Individual user connects to corporate network. SSL/TLS VPN or IPSec. Split vs full tunnel.<br/>
        <strong style={{ color: "#38bdf8" }}>Clientless VPN:</strong> Browser-based access via HTTPS portal. No software installation needed.
      </div></Card>
      <Card color="#22d3ee" title="Management Access Methods"><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
        <strong>SSH (port 22):</strong> Encrypted CLI access. Preferred method.<br/>
        <strong>Console port:</strong> Out-of-band access. Direct physical connection. Used for initial setup and recovery.<br/>
        <strong>GUI/Web interface:</strong> Browser-based management. HTTPS preferred.<br/>
        <strong>API (REST/RESTCONF/NETCONF):</strong> Programmatic access. Automation and orchestration. JSON/XML data.
      </div></Card>
    </div>
  );
}

// ─── Data Flow Simulator ────────────────────────────────────────────────────
function DataFlowSim() {
  const [step, setStep] = useState(0);
  const steps = [
    { layer: 7, label: "Application", desc: "User types https://example.com. Browser creates HTTP GET request. Application layer data is created.", color: "#E74C3C" },
    { layer: 6, label: "Presentation", desc: "TLS encryption applied. Data compressed if needed. Character encoding set (UTF-8).", color: "#E67E22" },
    { layer: 5, label: "Session", desc: "TLS session established (handshake). Session ID assigned. Connection state tracked.", color: "#F1C40F" },
    { layer: 4, label: "Transport", desc: "TCP segment created. Source port: 52481 (ephemeral), Dest port: 443 (HTTPS). Sequence numbers assigned. SYN → SYN-ACK → ACK handshake.", color: "#2ECC71" },
    { layer: 3, label: "Network", desc: "IP packet created. Source IP: 192.168.1.100, Dest IP: 93.184.216.34. TTL set to 64. Router determines next hop via routing table.", color: "#3498DB" },
    { layer: 2, label: "Data Link", desc: "Ethernet frame created. Source MAC: AA:BB:CC:DD:EE:FF. Dest MAC: router's MAC (from ARP). 802.1Q VLAN tag added if on trunk. FCS checksum appended.", color: "#9B59B6" },
    { layer: 1, label: "Physical", desc: "Frame converted to electrical signals (copper), light pulses (fiber), or radio waves (wireless). Transmitted over Cat6 cable at 1 Gbps to the switch port.", color: "#1ABC9C" },
    { layer: 0, label: "🌐 On the Wire!", desc: "Bits travel through switch (L2 forwarding by MAC) → router (L3 forwarding by IP, NAT translation, TTL decrement) → firewall (stateful inspection, ACL check) → ISP → internet → destination server. Server de-encapsulates in reverse: L1→L7.", color: "#00e5ff" }
  ];
  const s = steps[step];
  return (
    <div style={{ marginTop: 20, padding: 20, background: "rgba(0,229,255,0.04)", borderRadius: 12, border: "1px solid rgba(0,229,255,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#00e5ff", fontFamily: "'Space Mono', monospace" }}>
          📦 Data Flow Simulator — Step {step + 1}/{steps.length}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: step === 0 ? "transparent" : "rgba(255,255,255,0.06)", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>← Back</button>
          <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${step === steps.length -1 ? "rgba(255,255,255,0.15)" : "#00e5ff44"}`, background: step === steps.length - 1 ? "transparent" : "#00e5ff18", color: step === steps.length - 1 ? "#475569" : "#00e5ff", cursor: step === steps.length - 1 ? "default" : "pointer", fontSize: 12 }}>Next →</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {steps.map((st, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            flex: 1, height: 6, borderRadius: 3, cursor: "pointer", transition: "all 0.3s",
            background: i <= step ? st.color : "rgba(255,255,255,0.08)"
          }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
          {s.layer > 0 ? `L${s.layer}` : "🌐"}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'Space Mono', monospace" }}>{s.label}</div>
      </div>
      <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.8, padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>{s.desc}</div>
    </div>
  );
}

// ─── Quiz Mode ──────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "Which OSI layer handles IP addressing and routing?", opts: ["Transport (L4)", "Network (L3)", "Data Link (L2)", "Session (L5)"], ans: 1 },
  { q: "What port does HTTPS use?", opts: ["80", "8080", "443", "22"], ans: 2 },
  { q: "What does DHCP DORA stand for?", opts: ["Discover, Offer, Request, Acknowledge", "Detect, Open, Route, Accept", "Distribute, Organize, Relay, Assign", "Deny, Offer, Reject, Allow"], ans: 0 },
  { q: "Which cable type supports 10 Gbps at 100m?", opts: ["Cat5e", "Cat6", "Cat6a", "Cat8"], ans: 2 },
  { q: "What is the RFC 1918 private range for Class A?", opts: ["172.16.0.0/12", "192.168.0.0/16", "10.0.0.0/8", "169.254.0.0/16"], ans: 2 },
  { q: "Which protocol encrypts the entire payload — RADIUS or TACACS+?", opts: ["RADIUS", "TACACS+", "Both", "Neither"], ans: 1 },
  { q: "What attack floods a switch's CAM table?", opts: ["ARP poisoning", "VLAN hopping", "MAC flooding", "DNS spoofing"], ans: 2 },
  { q: "Which topology has every leaf connected to every spine?", opts: ["Three-tier", "Mesh", "Spine-and-Leaf", "Star"], ans: 2 },
  { q: "What is the AD (Administrative Distance) of OSPF?", opts: ["90", "110", "120", "20"], ans: 1 },
  { q: "Which DR metric measures maximum acceptable data loss?", opts: ["RTO", "RPO", "MTTR", "MTBF"], ans: 1 },
  { q: "What 802.11 amendment introduced Wi-Fi 6?", opts: ["802.11ac", "802.11n", "802.11ax", "802.11be"], ans: 2 },
  { q: "What STP port state blocks traffic but listens to BPDUs?", opts: ["Forwarding", "Blocking", "Disabled", "Learning"], ans: 1 },
  { q: "Which cloud model combines public and private?", opts: ["Community", "Hybrid", "Multi-cloud", "Virtual Private"], ans: 1 },
  { q: "What is the loopback address range?", opts: ["169.254.0.0/16", "127.0.0.0/8", "10.0.0.0/8", "224.0.0.0/4"], ans: 1 },
  { q: "Which connector is most common in modern fiber data centers?", opts: ["ST", "SC", "LC", "BNC"], ans: 2 },
  { q: "Traffic to the topologically nearest server sharing the same IP is called?", opts: ["Unicast", "Broadcast", "Multicast", "Anycast"], ans: 3 },
  { q: "What layer does a switch primarily operate at?", opts: ["Layer 1", "Layer 2", "Layer 3", "Layer 4"], ans: 1 },
  { q: "APIPA assigns addresses in which range?", opts: ["10.0.0.0/8", "172.16.0.0/12", "169.254.0.0/16", "192.168.0.0/16"], ans: 2 },
  { q: "Which encryption is current standard for WPA2?", opts: ["TKIP", "WEP", "AES/CCMP", "SAE"], ans: 2 },
  { q: "What troubleshooting step comes after 'establish a theory'?", opts: ["Document findings", "Test the theory", "Implement solution", "Identify the problem"], ans: 1 }
];

function QuizMode() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [shuffled] = useState(() => [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5));
  
  const q = shuffled[idx];
  const done = idx >= shuffled.length;

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setAnswered(a => a + 1);
    if (i === q.ans) setScore(s => s + 1);
  };
  const next = () => { setSelected(null); setIdx(idx + 1); };

  if (done) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#00e5ff", fontFamily: "'Space Mono', monospace" }}>{score} / {shuffled.length}</div>
      <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 8 }}>{score >= 17 ? "Excellent! You're exam-ready!" : score >= 14 ? "Great job! Review the topics you missed." : "Keep studying! Review the sections above."}</div>
      <button onClick={() => { setIdx(0); setSelected(null); setScore(0); setAnswered(0); }} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "1px solid #00e5ff", background: "#00e5ff18", color: "#00e5ff", cursor: "pointer", fontSize: 13 }}>Retake Quiz</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>Question {idx + 1} of {shuffled.length}</div>
        <div style={{ fontSize: 13, color: "#00e5ff" }}>Score: {score}/{answered}</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 20, lineHeight: 1.5 }}>{q.q}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {q.opts.map((opt, i) => {
          let bg = "rgba(255,255,255,0.04)";
          let border = "rgba(255,255,255,0.1)";
          let col = "#cbd5e1";
          if (selected !== null) {
            if (i === q.ans) { bg = "#22c55e18"; border = "#22c55e"; col = "#22c55e"; }
            else if (i === selected && i !== q.ans) { bg = "#ef444418"; border = "#ef4444"; col = "#ef4444"; }
          }
          return (
            <div key={i} onClick={() => handleAnswer(i)} style={{
              padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${border}`, background: bg,
              color: col, cursor: selected !== null ? "default" : "pointer", fontSize: 14, transition: "all 0.2s"
            }}>{opt}</div>
          );
        })}
      </div>
      {selected !== null && (
        <button onClick={next} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "1px solid #00e5ff", background: "#00e5ff18", color: "#00e5ff", cursor: "pointer", fontSize: 13 }}>
          {idx < shuffled.length - 1 ? "Next Question →" : "See Results"}
        </button>
      )}
    </div>
  );
}

// ─── Network Builder & Simulator ─────────────────────────────────────────────

const DEVICE_TEMPLATES = [
  { type: "pc", label: "PC", icon: "🖥️", color: "#38bdf8", layer: "L1-L7", ports: 1, desc: "End-user workstation" },
  { type: "laptop", label: "Laptop", icon: "💻", color: "#60a5fa", layer: "L1-L7", ports: 1, desc: "Wireless/wired endpoint" },
  { type: "server", label: "Server", icon: "🖧", color: "#a78bfa", layer: "L1-L7", ports: 2, desc: "Network server" },
  { type: "switch", label: "L2 Switch", icon: "🔲", color: "#2dd4bf", layer: "L2", ports: 8, desc: "Layer 2 switch with CAM table, STP, VLANs" },
  { type: "l3switch", label: "L3 Switch", icon: "🔳", color: "#34d399", layer: "L2-L3", ports: 8, desc: "Layer 3 switch with inter-VLAN routing" },
  { type: "router", label: "Router", icon: "🔀", color: "#f97316", layer: "L3", ports: 4, desc: "Routes packets between subnets/networks" },
  { type: "firewall", label: "Firewall", icon: "🛡️", color: "#ef4444", layer: "L3-L7", ports: 3, desc: "Stateful packet inspection, ACLs, zones" },
  { type: "wap", label: "Wireless AP", icon: "📡", color: "#fbbf24", layer: "L1-L2", ports: 1, desc: "802.11 access point" },
  { type: "internet", label: "Internet", icon: "🌐", color: "#818cf8", layer: "WAN", ports: 1, desc: "Internet / WAN cloud" },
  { type: "ids", label: "IDS/IPS", icon: "🔍", color: "#f472b6", layer: "L3-L7", ports: 2, desc: "Intrusion detection/prevention" },
  { type: "lb", label: "Load Balancer", icon: "⚖️", color: "#c084fc", layer: "L4-L7", ports: 4, desc: "Distributes traffic across servers" },
  { type: "dhcp", label: "DHCP Server", icon: "📬", color: "#22c55e", layer: "L7", ports: 1, desc: "Dynamic IP lease and gateway assignment service" },
  { type: "dns", label: "DNS Server", icon: "🧭", color: "#38bdf8", layer: "L7", ports: 1, desc: "Name resolution service (A/AAAA/CNAME, etc.)" },
];

const CABLE_OPTIONS = [
  { type: "cat5e", label: "Cat5e", color: "#22d3ee", speed: "1 Gbps", maxLen: 100, desc: "Copper UTP, up to 1 Gbps" },
  { type: "cat6", label: "Cat6", color: "#38bdf8", speed: "10 Gbps (55m)", maxLen: 100, desc: "Copper, 10G at ≤55m" },
  { type: "cat6a", label: "Cat6a", color: "#3b82f6", speed: "10 Gbps", maxLen: 100, desc: "Shielded, 10G at 100m" },
  { type: "smf", label: "Single-Mode Fiber", color: "#fbbf24", speed: "100+ Gbps", maxLen: 80000, desc: "Long distance fiber" },
  { type: "mmf", label: "Multi-Mode Fiber", color: "#fb923c", speed: "100 Gbps", maxLen: 550, desc: "Short distance fiber (OM3/OM4)" },
  { type: "coax", label: "Coaxial", color: "#94a3b8", speed: "DOCSIS", maxLen: 500, desc: "Cable/DOCSIS connection" },
  { type: "dac", label: "DAC (Twinax)", color: "#e879f9", speed: "100 Gbps", maxLen: 7, desc: "Direct attach copper, data center" },
  { type: "wireless", label: "Wireless", color: "#a3e635", speed: "Wi-Fi 6", maxLen: 70, desc: "802.11ax wireless link" },
  { type: "console", label: "Console Cable", color: "#6b7280", speed: "OOB", maxLen: 3, desc: "Out-of-band management (rollover)" },
];

const FAULT_SCENARIOS = [
  { id: "duplex", name: "Duplex Mismatch", icon: "⚡", color: "#ef4444",
    desc: "One side is full-duplex, the other is half-duplex. Causes late collisions, CRC errors, and dramatically reduced throughput. Auto-negotiation failed or was overridden on one end.",
    symptoms: ["Late collisions incrementing on half-duplex side", "CRC errors on both sides", "Throughput drops to <10% of link speed", "Interface counters show increasing errors"],
    fix: "Hardcode speed and duplex to match on both ends, or ensure both sides use auto-negotiation. Check: 'show interface' for duplex status.",
    affects: "link" },
  { id: "stp_loop", name: "Switching Loop (STP Failure)", icon: "🔄", color: "#f97316",
    desc: "Redundant paths between switches without STP create a broadcast storm. Frames loop endlessly, MAC tables thrash, and the network becomes unusable within seconds.",
    symptoms: ["Broadcast storm — exponential traffic increase", "MAC address table instability (flapping)", "All devices lose connectivity", "Switch CPU at 100%", "Link LEDs blinking frantically"],
    fix: "Enable STP/RSTP on all switches. Verify root bridge election. Use BPDU Guard on access ports. Check: 'show spanning-tree' for port states.",
    affects: "network" },
  { id: "vlan_mismatch", name: "VLAN Mismatch / Native VLAN", icon: "🏷️", color: "#a78bfa",
    desc: "Trunk ports have different native VLAN configurations, or an access port is assigned to the wrong VLAN. Traffic either can't reach its destination or leaks between VLANs.",
    symptoms: ["Devices in 'same network' can't communicate", "Intermittent connectivity", "CDP/LLDP native VLAN mismatch warnings", "Some traffic appears on wrong VLAN"],
    fix: "Verify trunk allowed VLANs and native VLAN match on both ends. Check access port VLAN assignments. Use: 'show vlan brief', 'show interfaces trunk'.",
    affects: "link" },
  { id: "bad_cable", name: "Cable Fault / Signal Degradation", icon: "🔗", color: "#64748b",
    desc: "Physical layer failure: damaged cable, exceeded max length, improper termination, or EMI interference. The link may be down, flapping, or operating with high error rates.",
    symptoms: ["Interface shows 'down/down' or 'up/down'", "CRC errors and input errors increasing", "Link flapping (up/down repeatedly)", "Speed auto-negotiates lower than expected"],
    fix: "Test cable with cable tester/certifier. Check length (Cat6a max 100m). Replace cable. Verify proper termination (T568A/B). Move away from EMI sources.",
    affects: "link" },
  { id: "ip_conflict", name: "IP Address Conflict", icon: "🏷️", color: "#f43f5e",
    desc: "Two devices on the same network have the same IP address. The OS detects the conflict and one or both devices lose connectivity intermittently.",
    symptoms: ["'IP address conflict detected' warnings", "Intermittent connectivity for affected hosts", "ARP table shows MAC address changing for same IP", "Random packet loss"],
    fix: "Use DHCP instead of static IPs. Check DHCP scope for conflicts with static assignments. Use: 'arp -a' to find duplicate MACs for same IP. Implement IPAM.",
    affects: "device" },
  { id: "wrong_gateway", name: "Incorrect Default Gateway", icon: "🚪", color: "#06b6d4",
    desc: "A host is configured with the wrong default gateway IP. It can communicate locally on its subnet but cannot reach any remote networks or the internet.",
    symptoms: ["Local subnet communication works", "Cannot ping anything outside the subnet", "Cannot reach internet or other VLANs", "traceroute fails at first hop"],
    fix: "Verify default gateway is the router/L3 switch interface IP on the local subnet. Check with: 'ipconfig' (Windows), 'ip route' (Linux). Fix DHCP option 3 if using DHCP.",
    affects: "device" },
  { id: "wrong_subnet", name: "Incorrect Subnet Mask", icon: "🎭", color: "#8b5cf6",
    desc: "A host has the wrong subnet mask, making it think devices on the same subnet are remote (or vice versa). Traffic routing breaks in confusing ways.",
    symptoms: ["Can reach some hosts but not others on 'same' network", "Host tries to ARP for remote addresses", "Inconsistent ping results", "Works for some IPs, fails for others"],
    fix: "Verify subnet mask matches all other devices on the segment and the router interface. Common error: /24 vs /16. Check DHCP server configuration.",
    affects: "device" },
  { id: "dhcp_exhaust", name: "DHCP Pool Exhaustion", icon: "🏊", color: "#f59e0b",
    desc: "The DHCP server has no more IP addresses to lease. New clients cannot get an address and self-assign an APIPA address (169.254.x.x), losing all routed connectivity.",
    symptoms: ["New devices get 169.254.x.x (APIPA) address", "Existing leased devices still work", "DHCP server shows 0 available addresses", "'ipconfig /renew' fails"],
    fix: "Increase DHCP pool size, reduce lease time, or add a secondary scope. Check for rogue DHCP servers. Remove unused reservations. Consider DHCPv6 or SLAAC.",
    affects: "network" },
  { id: "acl_block", name: "ACL Blocking Traffic", icon: "🚫", color: "#dc2626",
    desc: "An Access Control List is denying legitimate traffic. The implicit 'deny all' at the end catches traffic not explicitly permitted. Rule order matters — first match wins.",
    symptoms: ["Specific services/ports unreachable", "Ping may or may not work (depends on ACL)", "One direction works, other doesn't", "Inconsistent application behavior"],
    fix: "Review ACL rules with 'show access-lists'. Check rule order (top-down, first match). Remember implicit deny at end. Add explicit permit for required traffic. Test with packet tracer.",
    affects: "device" },
  { id: "mac_flood", name: "MAC Flooding Attack", icon: "🌊", color: "#b91c1c",
    desc: "An attacker sends thousands of frames with spoofed source MACs to overflow the switch's CAM table. Once full, the switch fails open and floods all traffic to all ports like a hub.",
    symptoms: ["Switch CAM table at maximum capacity", "All traffic visible on all ports (hub behavior)", "Network performance severely degraded", "Wireshark shows traffic not destined for local host"],
    fix: "Enable port security to limit MACs per port. Configure violation mode (shutdown). Enable Dynamic ARP Inspection. Use 802.1X for port-based authentication.",
    affects: "network" },
  { id: "arp_spoof", name: "ARP Spoofing / Poisoning", icon: "🎭", color: "#9f1239",
    desc: "An attacker sends gratuitous ARP replies to associate their MAC with the gateway's IP. All traffic meant for the gateway now goes to the attacker (on-path/MITM attack).",
    symptoms: ["ARP cache shows wrong MAC for gateway IP", "Intermittent connectivity or high latency", "Credentials captured in plaintext protocols", "Unexpected traffic redirection"],
    fix: "Enable Dynamic ARP Inspection (DAI) on switches. Use DHCP snooping as prerequisite. Static ARP entries for critical devices. Use encrypted protocols (HTTPS, SSH).",
    affects: "network" },
  { id: "speed_mismatch", name: "Speed Mismatch", icon: "🐢", color: "#78716c",
    desc: "Two connected interfaces negotiated different speeds (e.g., one at 100M, other at 1G). The link may not come up, or operates at the lower speed with errors.",
    symptoms: ["Link operates at unexpectedly low speed", "Interface may show down", "Auto-negotiation failures", "Poor throughput despite good cabling"],
    fix: "Hardcode speed on both ends to match, or ensure both use auto-negotiation. Check transceiver/cable compatibility with the port speed. 'show interface status'.",
    affects: "link" },
  { id: "dns_failure", name: "DNS Resolution Failure", icon: "🔤", color: "#0284c7",
    desc: "The DNS server is unreachable or misconfigured. Hosts can communicate by IP address but not by hostname. Web browsing and most applications break.",
    symptoms: ["Cannot browse websites by name", "ping by IP works, ping by hostname fails", "nslookup returns 'server not found'", "'ipconfig /all' shows wrong or no DNS server"],
    fix: "Verify DNS server IP in client config. Test DNS server reachability (ping). Check DNS server service is running. Try alternate DNS (8.8.8.8). Flush DNS cache: 'ipconfig /flushdns'.",
    affects: "network" },
  { id: "rogue_dhcp", name: "Rogue DHCP Server", icon: "👻", color: "#7c3aed",
    desc: "An unauthorized DHCP server is handing out incorrect IP configurations. Clients randomly get wrong gateway, DNS, or subnet — causing intermittent, hard-to-diagnose connectivity issues.",
    symptoms: ["Some clients get wrong IP configuration", "Intermittent connectivity across the network", "Different clients have different default gateways", "DHCP offers from unexpected source"],
    fix: "Enable DHCP snooping on switches. Set trusted ports (only where legitimate DHCP server connects). All other ports are untrusted and DHCP offers are dropped.",
    affects: "network" },
];

function genMAC() {
  const h = () => Math.floor(Math.random()*256).toString(16).padStart(2,'0');
  return `${h()}:${h()}:${h()}:${h()}:${h()}:${h()}`;
}
function genIP(subnet) {
  const base = subnet || "192.168.1";
  return `${base}.${Math.floor(Math.random()*200)+10}`;
}
function genAPIPA() {
  return `169.254.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

/** Deterministic value for lab DHCP/APIPA so sync effects don't thrash IPs between renders. */
function stableOctetFromSeed(seed, minInclusive, maxInclusive) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + (Math.abs(h) % span);
}

function deterministicApipaForEndpoint(endpointId) {
  const a = stableOctetFromSeed(`${endpointId}|apipaA`, 1, 254);
  const b = stableOctetFromSeed(`${endpointId}|apipaB`, 1, 254);
  return `169.254.${a}.${b}`;
}

let _nodeId = 0;
let _linkId = 0;
function nextNodeId() { return `n${++_nodeId}`; }
function nextLinkId() { return `l${++_linkId}`; }

const LAB_DEFAULT_W = 3200;
const LAB_DEFAULT_H = 1800;

const LAB_WORKSPACE_PRESETS = [
  { id: "1920x1080", label: "Full HD", w: 1920, h: 1080 },
  { id: "2560x1440", label: "QHD", w: 2560, h: 1440 },
  { id: "3200x1800", label: "Wide 3K", w: 3200, h: 1800 },
  { id: "3840x2160", label: "4K", w: 3840, h: 2160 },
  { id: "5120x2880", label: "5K", w: 5120, h: 2880 },
];

function clampLabViewBox(minX, minY, w, h, canvasW, canvasH) {
  const minW = canvasW / 4;
  const maxW = canvasW * 2;
  let cw = Math.min(maxW, Math.max(minW, w));
  let ch = cw * (canvasH / canvasW);
  const minBoundX = Math.min(0, canvasW - cw);
  const maxBoundX = Math.max(0, canvasW - cw);
  const minBoundY = Math.min(0, canvasH - ch);
  const maxBoundY = Math.max(0, canvasH - ch);
  return {
    minX: Math.max(minBoundX, Math.min(maxBoundX, minX)),
    minY: Math.max(minBoundY, Math.min(maxBoundY, minY)),
    w: cw,
    h: ch,
  };
}

function NetworkLabSection() {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({x:0,y:0});
  const [connecting, setConnecting] = useState(null);
  const [cableType, setCableType] = useState("cat6a");
  const [simRunning, setSimRunning] = useState(false);
  const [simLog, setSimLog] = useState([]);
  const [simPackets, setSimPackets] = useState([]);
  const [activeFault, setActiveFault] = useState(null);
  const [faultDetail, setFaultDetail] = useState(null);
  const [simSource, setSimSource] = useState(null);
  const [simDest, setSimDest] = useState(null);
  const [simProtocol, setSimProtocol] = useState("HTTPS");
  const [tab, setTab] = useState("build");
  const animRef = useRef(null);
  const [tick, setTick] = useState(0);
  const [topologyLog, setTopologyLog] = useState([]);
  const [labCanvas, setLabCanvas] = useState({ w: LAB_DEFAULT_W, h: LAB_DEFAULT_H });
  const labCanvasRef = useRef(labCanvas);
  useEffect(() => { labCanvasRef.current = labCanvas; }, [labCanvas]);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [workspaceMenuId, setWorkspaceMenuId] = useState("3200x1800");
  const [viewBox, setViewBox] = useState(() => ({ minX: 0, minY: 0, w: LAB_DEFAULT_W, h: LAB_DEFAULT_H }));
  const viewBoxRef = useRef(viewBox);
  useEffect(() => { viewBoxRef.current = viewBox; }, [viewBox]);
  const panningRef = useRef(false);
  const panLastRef = useRef(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [topBarOpen, setTopBarOpen] = useState(true);
  /** Must match --nl-top-menu-size in styles.css (☰ target size for collapse scale). */
  const NL_TOP_MENU_PX = 44;
  const topPaneAnimRef = useRef(null);
  const topOverlayPanelRef = useRef(null);

  const openTopBar = useCallback(() => {
    topPaneAnimRef.current?.style.removeProperty("--nl-top-collapse-sx");
    topPaneAnimRef.current?.style.removeProperty("--nl-top-collapse-sy");
    setTopBarOpen(true);
  }, []);

  const closeTopBar = useCallback(() => {
    const panel = topOverlayPanelRef.current;
    const shell = topPaneAnimRef.current;
    if (panel && shell) {
      const w = Math.max(1, panel.offsetWidth);
      const h = Math.max(1, panel.offsetHeight);
      const sx = Math.min(1, NL_TOP_MENU_PX / w);
      const sy = Math.min(1, NL_TOP_MENU_PX / h);
      shell.style.setProperty("--nl-top-collapse-sx", String(sx));
      shell.style.setProperty("--nl-top-collapse-sy", String(sy));
    }
    setTopBarOpen(false);
  }, []);

  const applyWorkspaceSize = useCallback((w, h, menuId = null) => {
    const nw = Math.min(7680, Math.max(640, Math.round(w)));
    const nh = Math.min(4320, Math.max(360, Math.round(h)));
    setLabCanvas({ w: nw, h: nh });
    setViewBox({ minX: 0, minY: 0, w: nw, h: nh });
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: Math.max(30, Math.min(nw - 30, n.x)),
        y: Math.max(30, Math.min(nh - 30, n.y)),
      })),
    );
    if (menuId) {
      setWorkspaceMenuId(menuId);
    } else {
      const m = LAB_WORKSPACE_PRESETS.find((p) => p.w === nw && p.h === nh);
      if (m) {
        setWorkspaceMenuId(m.id);
      } else {
        setWorkspaceMenuId("custom");
        setCustomW(String(nw));
        setCustomH(String(nh));
      }
    }
  }, []);

  const pushTopologyLog = useCallback((entry) => {
    setTopologyLog((prev) => [...prev, { t: Date.now(), ...entry }].slice(-250));
  }, []);

  const normalizeRouterInterfaces = useCallback((node) => {
    const raw = Array.isArray(node.routerInterfaces) && node.routerInterfaces.length > 0
      ? node.routerInterfaces
      : [node.ip];
    return raw.map((entry, idx) => {
      if (typeof entry === "string") {
        return {
          name: `G0/0.${idx + 1}`,
          ip: entry,
          subnet: node.subnet || "255.255.255.0",
          vlan: node.vlan || 1,
        };
      }
      return {
        name: entry.name || `G0/0.${idx + 1}`,
        ip: entry.ip || node.ip || "",
        subnet: entry.subnet || node.subnet || "255.255.255.0",
        vlan: entry.vlan || node.vlan || 1,
      };
    });
  }, []);

  const defaultServicesForType = useCallback((type) => {
    if (type === "router" || type === "l3switch") {
      return { dhcp: true, dns: false, nat: true, acl: true };
    }
    if (type === "dhcp") return { dhcp: true };
    if (type === "dns") return { dns: true };
    if (type === "firewall") return { acl: true };
    return {};
  }, []);

  const isEndpointNodeType = useCallback((type) => ["pc", "laptop", "server", "wap"].includes(type), []);

  const hasPath = useCallback((fromId, toId, allNodes, allLinks) => {
    const adj = {};
    allNodes.forEach((n) => { adj[n.id] = []; });
    allLinks.forEach((l) => {
      if (l.status === "up") {
        adj[l.from]?.push(l.to);
        adj[l.to]?.push(l.from);
      }
    });
    const q = [fromId];
    const seen = new Set([fromId]);
    while (q.length) {
      const cur = q.shift();
      if (cur === toId) return true;
      for (const nxt of adj[cur] || []) {
        if (!seen.has(nxt)) {
          seen.add(nxt);
          q.push(nxt);
        }
      }
    }
    return false;
  }, []);

  const autoconfigureEndpointOnLink = useCallback((endpoint, allNodes, allLinks) => {
    const endpointVlan = endpoint.vlan || 1;

    const nodeOffersDhcp = (n) => {
      if (!n) return false;
      if (n.type === "router" || n.type === "l3switch") return n.services?.dhcp !== false;
      return Boolean(n.services?.dhcp);
    };

    const dhcpProviders = allNodes.filter((n) => {
      if (!nodeOffersDhcp(n)) return false;
      if (!hasPath(endpoint.id, n.id, allNodes, allLinks)) return false;
      if (n.type === "router" || n.type === "l3switch") {
        const ifaces = normalizeRouterInterfaces(n);
        return ifaces.some((i) => (i.vlan || 1) === endpointVlan);
      }
      return (n.vlan || 1) === endpointVlan;
    });
    const reachableDhcp = dhcpProviders[0];

    if (!reachableDhcp) {
      if (!(endpoint.ip || "").startsWith("169.254.")) {
        const apipa = deterministicApipaForEndpoint(endpoint.id);
        return {
          updated: {
            ...endpoint,
            ip: apipa,
            subnet: "255.255.0.0",
            gateway: "0.0.0.0",
          },
          events: [
            { type: "proto", msg: `📡 ${endpoint.label || endpoint.type}: DHCP Discover sent on VLAN ${endpointVlan}... no DHCPOFFER received.` },
            { type: "warn", msg: `🟡 ${endpoint.label || endpoint.type}: APIPA assigned (${apipa}).` },
          ],
        };
      }
      return { updated: endpoint, events: [{ type: "proto", msg: `📡 ${endpoint.label || endpoint.type}: no DHCP server reachable, staying on APIPA (${endpoint.ip}).` }] };
    }

    const isRoutingDhcp = reachableDhcp.type === "router" || reachableDhcp.type === "l3switch";
    const iface = isRoutingDhcp
      ? (normalizeRouterInterfaces(reachableDhcp).find((i) => (i.vlan || 1) === endpointVlan) || normalizeRouterInterfaces(reachableDhcp)[0])
      : { ip: reachableDhcp.ip, subnet: reachableDhcp.subnet || "255.255.255.0" };
    const oct = String(iface.ip || "192.168.1.1").split(".");
    const base = `${oct[0] || 192}.${oct[1] || 168}.${oct[2] || 1}`;
    const expectedGw = iface.ip || `${base}.1`;
    const expectedSubnet = iface.subnet || "255.255.255.0";
    const ipStr = String(endpoint.ip || "");

    if (
      ipStr &&
      !ipStr.startsWith("169.254.") &&
      ipStr.startsWith(`${base}.`) &&
      endpoint.gateway === expectedGw &&
      endpoint.subnet === expectedSubnet
    ) {
      return { updated: endpoint, events: [] };
    }

    const hostOctet = stableOctetFromSeed(`${endpoint.id}|dhcp|${base}`, 20, 199);
    const leaseIp = `${base}.${hostOctet}`;
    const updated = {
      ...endpoint,
      ip: leaseIp,
      subnet: expectedSubnet,
      gateway: expectedGw,
    };
    return {
      updated,
      events: [
        { type: "proto", msg: `📡 ${endpoint.label || endpoint.type}: DHCP Discover (VLAN ${endpointVlan})` },
        { type: "proto", msg: `📨 DHCPOFFER from ${reachableDhcp.label || reachableDhcp.type} (${iface.ip})` },
        { type: "proto", msg: `✅ DHCPACK: leased ${updated.ip}/${updated.subnet}, gateway ${updated.gateway}` },
      ],
    };
  }, [hasPath, normalizeRouterInterfaces]);

  const labDhcpTopologySig = useMemo(() => {
    const linkKey = links
      .map((l) => `${l.from}-${l.to}`)
      .sort()
      .join(";");
    const nodeKey = nodes
      .map((n) => {
        if (isEndpointNodeType(n.type)) {
          return `E:${n.id}:vlan${n.vlan ?? 1}`;
        }
        const svc = JSON.stringify(n.services || {});
        const rif =
          n.type === "router" || n.type === "l3switch"
            ? JSON.stringify(n.routerInterfaces || [])
            : "";
        return `I:${n.id}:${n.type}:v${n.vlan ?? 1}:ip${n.ip ?? ""}:${svc}:${rif}`;
      })
      .sort()
      .join("|");
    return `${linkKey}#${nodeKey}`;
  }, [nodes, links, isEndpointNodeType]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const pendingLogs = [];
    let anyChange = false;
    const nextNodes = nodes.map((n) => {
      if (!isEndpointNodeType(n.type)) return n;
      const { updated, events } = autoconfigureEndpointOnLink(n, nodes, links);
      if (updated.ip !== n.ip || updated.gateway !== n.gateway || updated.subnet !== n.subnet) {
        anyChange = true;
        events.forEach((e) => pendingLogs.push(e));
        return updated;
      }
      return n;
    });
    if (!anyChange) return;
    setNodes(nextNodes);
    pendingLogs.forEach((e) => pushTopologyLog(e));
    // Intentionally omit `nodes` from deps: endpoint x/y and assigned IPs must not retrigger this pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nodes read from render when labDhcpTopologySig or links change
  }, [labDhcpTopologySig, links, isEndpointNodeType, autoconfigureEndpointOnLink, pushTopologyLog]);

  const addDevice = useCallback((tmpl) => {
    const id = nextNodeId();
    const { w: cw, h: ch } = labCanvasRef.current;
    const vb = viewBoxRef.current;
    const vcx = vb.minX + vb.w / 2;
    const vcy = vb.minY + vb.h / 2;
    const jitter = 100;
    const cx = Math.max(30, Math.min(cw - 30, vcx + (Math.random() - 0.5) * jitter));
    const cy = Math.max(30, Math.min(ch - 30, vcy + (Math.random() - 0.5) * jitter));
    const isRoutingTemplate = tmpl.type === "router" || tmpl.type === "l3switch";
    const endpointType = isEndpointNodeType(tmpl.type);
    const defaultIP = tmpl.type === "internet" ? "WAN" : isRoutingTemplate ? "192.168.1.1" : endpointType ? deterministicApipaForEndpoint(id) : genIP();
    const newNode = {
      id, ...tmpl, x: cx, y: cy,
      mac: genMAC(),
      ip: defaultIP,
      vlan: 1,
      managed: tmpl.type === "switch" ? true : undefined,
      switchVlans: tmpl.type === "switch" ? [1] : undefined,
      trunkAllowedVlans: tmpl.type === "switch" ? [1] : undefined,
      routerMode: isRoutingTemplate ? "subinterfaces" : undefined,
      routerInterfaces: isRoutingTemplate ? [{ name: "G0/0.1", ip: defaultIP, subnet: "255.255.255.0", vlan: 1 }] : undefined,
      stp: tmpl.type === "switch" || tmpl.type === "l3switch" ? "enabled" : "n/a",
      duplex: "auto",
      speed: "auto",
      gateway: endpointType ? "0.0.0.0" : "192.168.1.1",
      subnet: endpointType ? "255.255.0.0" : "255.255.255.0",
      status: "up"
    };
    newNode.services = defaultServicesForType(tmpl.type);
    setNodes(prev => [...prev, newNode]);
    pushTopologyLog({ type: "event", msg: `⚡ ${tmpl.label || tmpl.type} powered on.` });
    if (endpointType) {
      pushTopologyLog({ type: "proto", msg: `🟡 ${tmpl.label || tmpl.type}: no link/DHCP yet, self-assigned APIPA ${newNode.ip}.` });
    } else if (isRoutingTemplate) {
      pushTopologyLog({ type: "event", msg: `🧭 ${tmpl.label || tmpl.type}: interface ${newNode.routerInterfaces?.[0]?.name} up (${newNode.routerInterfaces?.[0]?.ip}), services DHCP=${newNode.services?.dhcp ? "on" : "off"} DNS=${newNode.services?.dns ? "on" : "off"}.` });
    } else if (tmpl.type === "dhcp" || tmpl.type === "dns") {
      pushTopologyLog({ type: "event", msg: `🛠️ ${tmpl.label}: service ${tmpl.type.toUpperCase()} is enabled.` });
    }
  }, [isEndpointNodeType, pushTopologyLog, defaultServicesForType]);

  const removeNode = useCallback((id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setLinks(prev => prev.filter(l => l.from !== id && l.to !== id));
    if (selectedNode === id) setSelectedNode(null);
    if (simSource === id) setSimSource(null);
    if (simDest === id) setSimDest(null);
  }, [selectedNode, simSource, simDest]);

  const addLink = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    if (links.some(l => (l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId))) return;
    const cable = CABLE_OPTIONS.find(c => c.type === cableType);
    const newLink = {
      id: nextLinkId(), from: fromId, to: toId,
      cable: cable.type, cableLabel: cable.label, cableColor: cable.color,
      speed: cable.speed, maxLen: cable.maxLen, length: Math.floor(Math.random()*80)+5,
      status: "up"
    };
    const linksAfter = [...links, newLink];
    setLinks(linksAfter);
    const a = nodes.find((n) => n.id === fromId);
    const b = nodes.find((n) => n.id === toId);
    pushTopologyLog({ type: "wire", msg: `🔌 Link up: ${a?.label || a?.type || fromId} ↔ ${b?.label || b?.type || toId} (${newLink.cableLabel}, ${newLink.speed}).` });
  }, [links, cableType, nodes, pushTopologyLog]);

  const removeLink = useCallback((id) => {
    setLinks(prev => prev.filter(l => l.id !== id));
    if (selectedLink === id) setSelectedLink(null);
  }, [selectedLink]);

  // Convert screen coords to SVG viewBox coords
  const screenToSVG = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  // Drag handling
  const handleCanvasMouseDown = (e) => {
    e.preventDefault();
    const { x: mx, y: my } = screenToSVG(e.clientX, e.clientY);
    for (const n of [...nodes].reverse()) {
      const dx = mx - n.x, dy = my - n.y;
      if (Math.abs(dx) < 32 && Math.abs(dy) < 32) {
        if (connecting) {
          addLink(connecting, n.id);
          setConnecting(null);
          setDockOpen(true);
          return;
        }
        setDragging(n.id);
        setDragOffset({x: dx, y: dy});
        setSelectedNode(n.id);
        setSelectedLink(null);
        setDockOpen(true);
        return;
      }
    }
    // check link click
    for (const link of links) {
      const a = nodes.find(n => n.id === link.from);
      const b = nodes.find(n => n.id === link.to);
      if (a && b) {
        const lx = (a.x + b.x)/2, ly = (a.y + b.y)/2;
        if (Math.abs(mx - lx) < 20 && Math.abs(my - ly) < 20) {
          setSelectedLink(link.id);
          setSelectedNode(null);
          setDockOpen(true);
          return;
        }
      }
    }
    if (e.shiftKey === true || e.button === 1) {
      if (e.button === 1) e.preventDefault();
      if (svgRef.current) {
        panningRef.current = true;
        panLastRef.current = { clientX: e.clientX, clientY: e.clientY };
      }
      return;
    }
    setSelectedNode(null);
    setSelectedLink(null);
    setConnecting(null);
  };

  const zoomLabAtPoint = useCallback((mx, my, wheelFactor) => {
    setViewBox((prev) => {
      const { w: CW, h: CH } = labCanvasRef.current;
      const newW = prev.w / wheelFactor;
      const newH = prev.h / wheelFactor;
      const fx = (mx - prev.minX) / prev.w;
      const fy = (my - prev.minY) / prev.h;
      const minX = mx - fx * newW;
      const minY = my - fy * newH;
      return clampLabViewBox(minX, minY, newW, newH, CW, CH);
    });
  }, []);

  const handleCanvasWheel = useCallback((e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const scale = e.deltaMode === 1 ? 12 : e.deltaMode === 2 ? 40 : 1;
    const direction = e.deltaY * scale;
    const wheelFactor = direction < 0 ? 1.1 : 1 / 1.1;
    zoomLabAtPoint(svgPt.x, svgPt.y, wheelFactor);
  }, [zoomLabAtPoint]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (e) => handleCanvasWheel(e);
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [handleCanvasWheel]);

  const resetLabView = useCallback(() => {
    const { w, h } = labCanvasRef.current;
    setViewBox({ minX: 0, minY: 0, w, h });
  }, []);

  const nudgeLabZoom = useCallback((direction) => {
    const vb = viewBoxRef.current;
    const cx = vb.minX + vb.w / 2;
    const cy = vb.minY + vb.h / 2;
    const wheelFactor = direction > 0 ? 1.15 : 1 / 1.15;
    zoomLabAtPoint(cx, cy, wheelFactor);
  }, [zoomLabAtPoint]);

  // Use refs for drag state so window listeners always see current values
  const draggingRef = useRef(null);
  const dragOffsetRef = useRef({x:0,y:0});
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);

  useEffect(() => {
    const getSVGCoords = (clientX, clientY) => {
      if (!svgRef.current) return null;
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    };
    const handleMouseMove = (e) => {
      if (panningRef.current && panLastRef.current && "clientX" in panLastRef.current) {
        e.preventDefault();
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        const vb = viewBoxRef.current;
        const scaleX = vb.w / rect.width;
        const scaleY = vb.h / rect.height;
        const dx = (e.clientX - panLastRef.current.clientX) * scaleX;
        const dy = (e.clientY - panLastRef.current.clientY) * scaleY;
        panLastRef.current = { clientX: e.clientX, clientY: e.clientY };
        const { w: CW, h: CH } = labCanvasRef.current;
        setViewBox((prev) => clampLabViewBox(prev.minX - dx, prev.minY - dy, prev.w, prev.h, CW, CH));
        return;
      }
      if (!draggingRef.current) return;
      e.preventDefault();
      const svgPt = getSVGCoords(e.clientX, e.clientY);
      if (!svgPt) return;
      const mx = svgPt.x - dragOffsetRef.current.x;
      const my = svgPt.y - dragOffsetRef.current.y;
      const { w: CW, h: CH } = labCanvasRef.current;
      const maxX = CW - 30;
      const maxY = CH - 30;
      setNodes(prev => prev.map(n => n.id === draggingRef.current ? {...n, x: Math.max(30, Math.min(mx, maxX)), y: Math.max(30, Math.min(my, maxY))} : n));
    };
    const handleTouchMove = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const svgPt = getSVGCoords(touch.clientX, touch.clientY);
      if (!svgPt) return;
      const mx = svgPt.x - dragOffsetRef.current.x;
      const my = svgPt.y - dragOffsetRef.current.y;
      const { w: CW, h: CH } = labCanvasRef.current;
      const maxX = CW - 30;
      const maxY = CH - 30;
      setNodes(prev => prev.map(n => n.id === draggingRef.current ? {...n, x: Math.max(30, Math.min(mx, maxX)), y: Math.max(30, Math.min(my, maxY))} : n));
    };
    const handleEnd = () => {
      if (panningRef.current) {
        panningRef.current = false;
        panLastRef.current = null;
      }
      if (draggingRef.current) setDragging(null);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, []);

  const selNodeObj = nodes.find(n => n.id === selectedNode);
  const selLinkObj = links.find(l => l.id === selectedLink);

  // Simulation engine
  const runSimulation = useCallback(() => {
    if (!simSource || !simDest) return;
    const src = nodes.find(n => n.id === simSource);
    const dst = nodes.find(n => n.id === simDest);
    if (!src || !dst) return;
    setSimRunning(true);
    setSimPackets([]);
    const log = [];
    const fault = activeFault ? FAULT_SCENARIOS.find(f => f.id === activeFault) : null;

    const isRoutingNode = (n) => n?.type === "router" || n?.type === "l3switch";
    const isEndpointNode = (n) => ["pc", "laptop", "server", "wap"].includes(n?.type);
    const isValidIPv4 = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip || "");
    const ipToInt = (ip) => {
      const p = (ip || "").split(".").map(Number);
      if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
      return (((p[0] << 24) >>> 0) + ((p[1] << 16) >>> 0) + ((p[2] << 8) >>> 0) + (p[3] >>> 0)) >>> 0;
    };
    const sameSubnet = (ipA, maskA, ipB, maskB) => {
      const a = ipToInt(ipA);
      const b = ipToInt(ipB);
      const mA = ipToInt(maskA);
      const mB = ipToInt(maskB);
      if (a === null || b === null || mA === null || mB === null) return null;
      // Treat local/remote decision from host perspective (source mask), but also require dst mask agreement.
      return (a & mA) === (b & mA) && (a & mB) === (b & mB);
    };
    const bothEndpoints = isEndpointNode(src) && isEndpointNode(dst);
    const subnetCheck = bothEndpoints && isValidIPv4(src.ip) && isValidIPv4(dst.ip) ? sameSubnet(src.ip, src.subnet, dst.ip, dst.subnet) : null;
    const interVlanFlow = src.vlan !== dst.vlan;
    const interSubnetFlow = subnetCheck === null ? false : !subnetCheck;
    const needsL3Routing = interVlanFlow || interSubnetFlow;

    // VLAN-aware BFS path finding
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    links.forEach(l => {
      if (l.status === "up") {
        adj[l.from]?.push(l.to);
        adj[l.to]?.push(l.from);
      }
    });
    const visited = new Set();
    const queue = [{ path: [src.id], routed: false }];
    visited.add(`${src.id}|0`);
    let path = null;
    while (queue.length > 0) {
      const state = queue.shift();
      const p = state.path;
      const last = p[p.length - 1];
      if (last === dst.id) {
        path = p;
        break;
      }
      const lastNode = nodes.find(n => n.id === last);
      for (const next of (adj[last] || [])) {
        const nextNode = nodes.find(n => n.id === next);
        if (!nextNode) continue;

        // Endpoints are not transit devices (except destination).
        if (next !== dst.id && isEndpointNode(nextNode)) continue;

        // Inter-VLAN or inter-subnet endpoints must traverse a routing device first.
        const reachingDestination = next === dst.id;
        if (needsL3Routing && reachingDestination && !state.routed) continue;

        const routedNext = state.routed || isRoutingNode(lastNode) || isRoutingNode(nextNode);
        const vKey = `${next}|${routedNext ? 1 : 0}`;
        if (!visited.has(vKey)) {
          visited.add(vKey);
          queue.push({ path: [...p, next], routed: routedNext });
        }
      }
    }

    if (!path) {
      if (needsL3Routing) {
        const reasons = [
          interVlanFlow ? `VLAN ${src.vlan}→${dst.vlan}` : null,
          interSubnetFlow ? `Subnet ${src.subnet || "?"} / ${dst.subnet || "?"}` : null,
        ].filter(Boolean).join(", ");
        log.push({ t: 0, type: "error", msg: `❌ No routed path found from ${src.label || src.type} to ${dst.label || dst.type} (${reasons}). Add/verify router or L3 switch connectivity.` });
      } else {
        log.push({ t: 0, type: "error", msg: `❌ No path found from ${src.label || src.type} to ${dst.label || dst.type}. Check physical connectivity.` });
      }
      setSimLog(log);
      setSimRunning(false);
      return;
    }

    const pathNodes = path.map(id => nodes.find(n => n.id === id)).filter(Boolean);
    const routingNodesOnPath = pathNodes.filter(isRoutingNode);

    // Gateway and routing-interface preflight checks
    if (needsL3Routing && isEndpointNode(src)) {
      if (!isValidIPv4(src.gateway)) {
        log.push({ t: 0, type: "error", msg: `❌ ${src.label || src.type} has invalid default gateway (${src.gateway || "unset"}).` });
        log.push({ t: 1, type: "fix", msg: "🔧 FIX: Set a valid IPv4 gateway on the source host." });
        setSimLog(log);
        setSimRunning(false);
        return;
      }
      const gwOnLocalSubnet = sameSubnet(src.ip, src.subnet, src.gateway, src.subnet);
      if (gwOnLocalSubnet === false) {
        log.push({ t: 0, type: "error", msg: `❌ ${src.label || src.type} gateway ${src.gateway} is not on the local subnet (${src.ip}/${src.subnet}).` });
        log.push({ t: 1, type: "fix", msg: "🔧 FIX: Use a gateway IP in the same subnet as the source host." });
        setSimLog(log);
        setSimRunning(false);
        return;
      }
      const gatewayOnRoutedInterface = routingNodesOnPath.some((rn) =>
        normalizeRouterInterfaces(rn).some((iface) => iface.ip === src.gateway)
      );
      if (!gatewayOnRoutedInterface) {
        log.push({ t: 0, type: "error", msg: `❌ No router/L3 interface on path matches source gateway ${src.gateway}.` });
        log.push({ t: 1, type: "fix", msg: "🔧 FIX: Add/update router interface IPs so one matches the source host gateway." });
        setSimLog(log);
        setSimRunning(false);
        return;
      }
    }
    if (needsL3Routing && isEndpointNode(dst) && routingNodesOnPath.length > 0) {
      const dstSubnetReachable = routingNodesOnPath.some((rn) =>
        normalizeRouterInterfaces(rn).some((iface) => sameSubnet(iface.ip, iface.subnet, dst.ip, dst.subnet))
      );
      if (!dstSubnetReachable) {
        log.push({ t: 0, type: "error", msg: `❌ No router/L3 interface on path can reach destination subnet (${dst.ip}/${dst.subnet}).` });
        log.push({ t: 1, type: "fix", msg: "🔧 FIX: Add a router/L3 interface in the destination subnet or add the proper routed connection." });
        setSimLog(log);
        setSimRunning(false);
        return;
      }
    }

    if (simProtocol === "DNS") {
      const dnsProvider = pathNodes.find((n) => n?.services?.dns);
      if (!dnsProvider) {
        log.push({ t: 0, type: "error", msg: "❌ No DNS-capable device found on this path." });
        log.push({ t: 1, type: "fix", msg: "🔧 FIX: Add/enable DNS service on a router/L3 switch or deploy a DNS server and connect it to the VLAN/path." });
        setSimLog(log);
        setSimRunning(false);
        return;
      }
    }

    // Switch-side VLAN configuration checks
    const l2SwitchesOnPath = path.map(id => nodes.find(n => n.id === id)).filter(n => n?.type === "switch");
    const missingVlanSwitch = l2SwitchesOnPath.find(sw => {
      const configured = Array.isArray(sw.switchVlans) ? sw.switchVlans : [sw.vlan || 1];
      return !configured.includes(src.vlan) || !configured.includes(dst.vlan);
    });
    if (missingVlanSwitch) {
      log.push({
        t: 0,
        type: "error",
        msg: `❌ ${missingVlanSwitch.label || "L2 Switch"} is missing VLAN setup for this flow (needs VLAN ${src.vlan}${src.vlan !== dst.vlan ? ` and VLAN ${dst.vlan}` : ""}).`,
      });
      log.push({
        t: 1,
        type: "fix",
        msg: "🔧 FIX: On the L2 switch, create required VLANs and assign access/trunk ports accordingly.",
      });
      setSimLog(log);
      setSimRunning(false);
      return;
    }
    if (needsL3Routing) {
      const trunkIssue = l2SwitchesOnPath.find(sw => {
        const allowed = Array.isArray(sw.trunkAllowedVlans) ? sw.trunkAllowedVlans : [sw.vlan || 1];
        return !allowed.includes(src.vlan) || !allowed.includes(dst.vlan);
      });
      if (trunkIssue) {
        log.push({
          t: 0,
          type: "error",
          msg: `❌ ${trunkIssue.label || "L2 Switch"} trunk allowed VLANs do not include required VLANs (${src.vlan}${src.vlan !== dst.vlan ? `, ${dst.vlan}` : ""}).`,
        });
        log.push({
          t: 1,
          type: "fix",
          msg: "🔧 FIX: Update trunk allowed VLAN list to include required VLANs between switch and router/L3 device.",
        });
        setSimLog(log);
        setSimRunning(false);
        return;
      }
    }

    // Generate detailed simulation log
    const pType = simProtocol;
    const portMap = { HTTPS: 443, HTTP: 80, SSH: 22, DNS: 53, DHCP: 67, FTP: 21, SMTP: 25, RDP: 3389, SNMP: 161 };
    const dstPort = portMap[pType] || 443;
    const srcPort = 49152 + Math.floor(Math.random()*16000);
    let t = 0;
    let faultTriggered = false;

    log.push({ t: t++, type: "info", msg: `📦 Initiating ${pType} connection from ${src.type.toUpperCase()} (${src.ip}) → ${dst.type.toUpperCase()} (${dst.ip})` });
    log.push({ t: t++, type: "osi", msg: `[L7 Application] ${pType} request generated. Port: ${dstPort}` });

    if (pType === "HTTPS" || pType === "SSH" || pType === "SFTP") {
      log.push({ t: t++, type: "osi", msg: `[L6 Presentation] TLS/SSL encryption applied. Payload encrypted.` });
      log.push({ t: t++, type: "osi", msg: `[L5 Session] TLS session handshake initiated. Session ID assigned.` });
    }

    log.push({ t: t++, type: "osi", msg: `[L4 Transport] TCP segment created. Src port: ${srcPort}, Dst port: ${dstPort}. SYN flag set.` });
    log.push({ t: t++, type: "osi", msg: `[L3 Network] IP packet: ${src.ip} → ${dst.ip}. TTL=64. Protocol=TCP.` });

    // Check if we need ARP
    log.push({ t: t++, type: "detail", msg: `[L3] Checking ARP cache for next-hop MAC address...` });
    log.push({ t: t++, type: "osi", msg: `[L2 Data Link] Ethernet frame: Src MAC ${src.mac}, Dst MAC ${nodes.find(n=>n.id===path[1])?.mac || "ff:ff:ff:ff:ff:ff"}` });
    if (needsL3Routing) {
      const firstRouterHop = path.map(id => nodes.find(n => n.id === id)).find(isRoutingNode);
      const reasonText = [
        interVlanFlow ? `VLAN ${src.vlan} → VLAN ${dst.vlan}` : null,
        interSubnetFlow ? `${src.ip}/${src.subnet} → ${dst.ip}/${dst.subnet}` : null,
      ].filter(Boolean).join(" | ");
      log.push({ t: t++, type: "detail", msg: `[L3] Routing required: ${reasonText}. First L3 hop: ${firstRouterHop?.label || firstRouterHop?.type || "router"}.` });
    }
    
    if (src.vlan > 1) {
      log.push({ t: t++, type: "detail", msg: `[L2] 802.1Q VLAN tag inserted: VLAN ${src.vlan}` });
    }
    
    log.push({ t: t++, type: "osi", msg: `[L1 Physical] Frame converted to electrical/optical signals. Transmitted on wire.` });

    // Walk path
    const packets = [];
    for (let i = 0; i < path.length - 1; i++) {
      const curr = nodes.find(n => n.id === path[i]);
      const next = nodes.find(n => n.id === path[i+1]);
      const link = links.find(l => (l.from === curr.id && l.to === next.id) || (l.from === next.id && l.to === curr.id));
      
      packets.push({ from: curr.id, to: next.id, progress: 0, step: i, color: curr.color });

      if (link) {
        log.push({ t: t++, type: "wire", msg: `🔗 Link: ${curr.type.toUpperCase()} → ${next.type.toUpperCase()} | Cable: ${link.cableLabel} (${link.speed}) | Length: ${link.length}m` });
        
        // Cable length check
        if (link.length > link.maxLen) {
          log.push({ t: t++, type: "warn", msg: `⚠️ Cable length (${link.length}m) exceeds maximum for ${link.cableLabel} (${link.maxLen}m)! Signal degradation likely.` });
        }
      }

      // FAULT INJECTION
      if (fault && !faultTriggered) {
        if (fault.id === "duplex" && (curr.type === "switch" || curr.type === "l3switch" || next.type === "switch" || next.type === "l3switch")) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `⚡ DUPLEX MISMATCH DETECTED on link ${curr.type}↔${next.type}!` });
          log.push({ t: t++, type: "fault", msg: `   ${curr.type.toUpperCase()}: Full-duplex | ${next.type.toUpperCase()}: Half-duplex` });
          log.push({ t: t++, type: "fault", msg: `   Late collisions: 847 | CRC errors: 1,203 | Throughput: ~8 Mbps (should be 1 Gbps)` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Hardcode speed/duplex on both sides or ensure auto-negotiation is enabled on BOTH.` });
        }
        if (fault.id === "stp_loop" && (curr.type === "switch" || curr.type === "l3switch")) {
          const switchCount = path.filter(p => { const nd = nodes.find(n=>n.id===p); return nd?.type === "switch" || nd?.type === "l3switch"; }).length;
          if (switchCount >= 2) {
            faultTriggered = true;
            log.push({ t: t++, type: "fault", msg: `🔄 BROADCAST STORM DETECTED! Switching loop between switches!` });
            log.push({ t: t++, type: "fault", msg: `   Frames are looping endlessly. MAC table thrashing. Network UNUSABLE.` });
            log.push({ t: t++, type: "fault", msg: `   Broadcast traffic: 98% of bandwidth | CPU: 100% | CAM table: OVERFLOW` });
            log.push({ t: t++, type: "fault", msg: `   All ${nodes.filter(n=>n.type==="pc"||n.type==="laptop"||n.type==="server").length} endpoints have LOST connectivity.` });
            log.push({ t: t++, type: "fix", msg: `🔧 FIX: Enable STP/RSTP. Verify Root Bridge. BPDU Guard on access ports.` });
          }
        }
        if (fault.id === "vlan_mismatch" && (curr.type === "switch" || curr.type === "l3switch") && curr.vlan !== next.vlan && next.type !== "router") {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🏷️ VLAN MISMATCH! ${curr.type.toUpperCase()} (VLAN ${curr.vlan}) ↔ ${next.type.toUpperCase()} (VLAN ${next.vlan})` });
          log.push({ t: t++, type: "fault", msg: `   Frame DROPPED — destination is on a different VLAN. No L3 routing available.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Ensure matching VLANs or add trunk link with both VLANs allowed. Add router for inter-VLAN routing.` });
        }
        if (fault.id === "bad_cable" && link) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🔗 CABLE FAULT on ${link.cableLabel} link between ${curr.type}↔${next.type}!` });
          log.push({ t: t++, type: "fault", msg: `   Interface flapping. CRC errors: 5,421/sec. Input errors: 3,200/sec.` });
          log.push({ t: t++, type: "fault", msg: `   Possible causes: Damaged cable, improper termination, EMI, exceeded max length.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Test with cable tester. Replace cable. Verify termination (T568A/B). Check length < ${link.maxLen}m.` });
        }
        if (fault.id === "ip_conflict" && (curr.type === "pc" || curr.type === "laptop" || curr.type === "server")) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🏷️ IP ADDRESS CONFLICT! ${curr.ip} is claimed by two devices!` });
          log.push({ t: t++, type: "fault", msg: `   Device A MAC: ${curr.mac} | Device B MAC: ${genMAC()} — both claim ${curr.ip}` });
          log.push({ t: t++, type: "fault", msg: `   ARP table unstable. Intermittent packet loss. OS warning displayed.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Use DHCP reservations. Check for static IP conflicts. Implement IPAM. 'arp -a' to find duplicate.` });
        }
        if (fault.id === "wrong_gateway" && i === 0) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🚪 INCORRECT DEFAULT GATEWAY on ${src.type.toUpperCase()}!` });
          log.push({ t: t++, type: "fault", msg: `   Configured: 192.168.1.254 | Actual router: 192.168.1.1` });
          log.push({ t: t++, type: "fault", msg: `   Local subnet works fine. ALL remote traffic FAILS (including internet).` });
          log.push({ t: t++, type: "fault", msg: `   ARP for 192.168.1.254 gets no response. Packet dropped.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Correct gateway to router interface IP. If DHCP, fix option 3 on DHCP server.` });
        }
        if (fault.id === "wrong_subnet" && i === 0) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🎭 INCORRECT SUBNET MASK on ${src.type.toUpperCase()}!` });
          log.push({ t: t++, type: "fault", msg: `   Configured: 255.255.0.0 (/16) | Should be: 255.255.255.0 (/24)` });
          log.push({ t: t++, type: "fault", msg: `   Host thinks 192.168.2.x is local → tries ARP instead of routing. Fails.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Set correct subnet mask matching the network design. Verify DHCP config.` });
        }
        if (fault.id === "dhcp_exhaust" && (curr.type === "pc" || curr.type === "laptop") && i === 0) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🏊 DHCP POOL EXHAUSTION! No addresses available.` });
          log.push({ t: t++, type: "fault", msg: `   ${src.type.toUpperCase()} sent DHCP Discover (broadcast). No Offer received.` });
          log.push({ t: t++, type: "fault", msg: `   Self-assigned APIPA: 169.254.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` });
          log.push({ t: t++, type: "fault", msg: `   CANNOT reach any routed network. Link-local only.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Expand DHCP pool, reduce lease time, remove stale leases. Check for rogue DHCP server.` });
        }
        if (fault.id === "acl_block" && (curr.type === "firewall" || curr.type === "router")) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🚫 ACL BLOCKING TRAFFIC on ${curr.type.toUpperCase()}!` });
          log.push({ t: t++, type: "fault", msg: `   Rule: deny tcp any any eq ${dstPort} — matched BEFORE permit rule!` });
          log.push({ t: t++, type: "fault", msg: `   Packet DROPPED. ${pType} traffic from ${src.ip} to ${dst.ip}:${dstPort} denied.` });
          log.push({ t: t++, type: "fault", msg: `   Implicit 'deny all' at end of ACL caught remaining traffic.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Reorder ACL — most specific rules first. Add 'permit tcp ${src.ip} ${dst.ip} eq ${dstPort}' ABOVE the deny.` });
        }
        if (fault.id === "mac_flood" && (curr.type === "switch" || curr.type === "l3switch")) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🌊 MAC FLOODING ATTACK detected on ${curr.type.toUpperCase()}!` });
          log.push({ t: t++, type: "fault", msg: `   CAM table: 65,536/65,536 entries (FULL). Attacker injecting spoofed MACs.` });
          log.push({ t: t++, type: "fault", msg: `   Switch now FLOODING all frames to all ports (acting as hub). All traffic exposed!` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Enable port security (max 2 MACs per port, violation: shutdown). Enable 802.1X.` });
        }
        if (fault.id === "arp_spoof") {
          faultTriggered = true;
          const attackerMAC = genMAC();
          log.push({ t: t++, type: "fault", msg: `🎭 ARP SPOOFING ATTACK in progress!` });
          log.push({ t: t++, type: "fault", msg: `   Attacker (${attackerMAC}) sending gratuitous ARP: "192.168.1.1 is at ${attackerMAC}"` });
          log.push({ t: t++, type: "fault", msg: `   ${src.type.toUpperCase()}'s ARP cache POISONED. Traffic to gateway now goes to ATTACKER.` });
          log.push({ t: t++, type: "fault", msg: `   ON-PATH (MITM) attack active. Attacker can inspect/modify all traffic.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Enable Dynamic ARP Inspection (DAI). Enable DHCP snooping. Use encrypted protocols.` });
        }
        if (fault.id === "speed_mismatch" && link) {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🐢 SPEED MISMATCH on link ${curr.type}↔${next.type}!` });
          log.push({ t: t++, type: "fault", msg: `   Side A: 1000 Mbps | Side B: 100 Mbps — auto-negotiation failed` });
          log.push({ t: t++, type: "fault", msg: `   Link operating at 100 Mbps. Possible frame drops. High latency.` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Hardcode speed on both ends. Check cable category supports desired speed. Verify transceiver.` });
        }
        if (fault.id === "dns_failure" && pType === "HTTPS") {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `🔤 DNS RESOLUTION FAILURE!` });
          log.push({ t: t++, type: "fault", msg: `   ${src.type.toUpperCase()} cannot resolve hostname. DNS query to 192.168.1.1:53 — TIMED OUT.` });
          log.push({ t: t++, type: "fault", msg: `   ping 8.8.8.8 → SUCCESS | ping google.com → FAILURE` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Check DNS server config. Test: nslookup. Try 8.8.8.8. Flush cache: ipconfig /flushdns` });
        }
        if (fault.id === "rogue_dhcp") {
          faultTriggered = true;
          log.push({ t: t++, type: "fault", msg: `👻 ROGUE DHCP SERVER detected on network!` });
          log.push({ t: t++, type: "fault", msg: `   Legitimate DHCP: 192.168.1.1 | Rogue: 192.168.1.50 (attacker)` });
          log.push({ t: t++, type: "fault", msg: `   Some clients got: Gateway=10.0.0.1, DNS=10.0.0.2 — all traffic redirected to attacker!` });
          log.push({ t: t++, type: "fix", msg: `🔧 FIX: Enable DHCP snooping. Only mark legitimate DHCP server port as trusted.` });
        }
      }

      // Device processing
      if (next.type === "switch" || next.type === "l3switch") {
        log.push({ t: t++, type: "device", msg: `🔲 ${next.type.toUpperCase()} processing: MAC lookup in CAM table. Dst MAC ${dst.mac} → forwarding to port ${Math.floor(Math.random()*24)+1}` });
        if (next.stp === "enabled") {
          log.push({ t: t++, type: "detail", msg: `   STP active. Port state: Forwarding. Root bridge cost: ${Math.floor(Math.random()*19)+1}` });
        }
      }
      if (next.type === "router" || next.type === "l3switch") {
        log.push({ t: t++, type: "device", msg: `🔀 ${next.type.toUpperCase()} processing: Routing table lookup for ${dst.ip}. TTL: 64→63. Next-hop determined.` });
        if (dst.type === "internet") {
          log.push({ t: t++, type: "detail", msg: `   NAT/PAT: Translating ${src.ip}:${srcPort} → public IP:${50000+Math.floor(Math.random()*10000)}` });
        }
      }
      if (next.type === "firewall") {
        log.push({ t: t++, type: "device", msg: `🛡️ FIREWALL: Stateful inspection. ${pType} ${src.ip}:${srcPort} → ${dst.ip}:${dstPort}` });
        log.push({ t: t++, type: "detail", msg: `   Rule matched: PERMIT ${pType} from trusted zone to untrusted zone. Connection tracked.` });
      }
      if (next.type === "ids") {
        log.push({ t: t++, type: "device", msg: `🔍 IDS/IPS: Deep packet inspection. Signature check: CLEAN. No threats detected.` });
      }
      if (next.type === "lb") {
        log.push({ t: t++, type: "device", msg: `⚖️ LOAD BALANCER: Health check passed. Selected server via round-robin. VIP → real server.` });
      }
      if (next.type === "wap") {
        log.push({ t: t++, type: "device", msg: `📡 WIRELESS AP: 802.11ax frame. Channel 36 (5GHz). WPA3 encrypted. SSID: CorpNet` });
      }
    }

    if (!faultTriggered || !fault) {
      log.push({ t: t++, type: "success", msg: `✅ ${pType} packet delivered to ${dst.type.toUpperCase()} (${dst.ip}:${dstPort}). Connection established!` });
      log.push({ t: t++, type: "detail", msg: `   TCP 3-way handshake complete (SYN→SYN-ACK→ACK). RTT: ${Math.floor(Math.random()*15)+1}ms. ${path.length-1} hops.` });
    } else if (fault && (fault.id === "stp_loop" || fault.id === "acl_block" || fault.id === "wrong_gateway" || fault.id === "dhcp_exhaust" || fault.id === "dns_failure")) {
      log.push({ t: t++, type: "error", msg: `❌ Packet FAILED to reach destination due to: ${fault.name}` });
    } else if (fault) {
      log.push({ t: t++, type: "warn", msg: `⚠️ Packet eventually delivered but with issues: ${fault.name}. Performance degraded.` });
    }

    setSimLog(log);
    setSimPackets(packets);

    // Animate packets
    let step = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      step++;
      setTick(step);
      if (step > (path.length) * 15 + 10) {
        clearInterval(animRef.current);
        setSimRunning(false);
      }
    }, 80);

  }, [simSource, simDest, simProtocol, nodes, links, activeFault]);

  const clearAll = () => { setNodes([]); setLinks([]); setSelectedNode(null); setSelectedLink(null); setSimLog([]); setSimPackets([]); setActiveFault(null); setTopologyLog([]); };

  const logPresetProvisioning = useCallback((presetName, presetNodes, presetLinks) => {
    pushTopologyLog({ type: "event", msg: `📋 Loaded preset: ${presetName === "basic_lan" ? "Basic LAN" : "Enterprise"}. Starting automatic provisioning...` });
    presetNodes.forEach((n) => {
      pushTopologyLog({ type: "event", msg: `⚡ ${n.label || n.type} powered on.` });
      if (n.type === "switch") {
        const swVlans = (n.switchVlans || [n.vlan || 1]).join(", ");
        const trunkVlans = (n.trunkAllowedVlans || [n.vlan || 1]).join(", ");
        pushTopologyLog({ type: "proto", msg: `🔲 ${n.label || "L2 Switch"}: VLAN DB configured [${swVlans}], trunk allowed [${trunkVlans}].` });
      }
      if (n.type === "router" || n.type === "l3switch") {
        const ifaces = normalizeRouterInterfaces(n).map((i) => `${i.name}:${i.ip}/VLAN${i.vlan}`).join(", ");
        pushTopologyLog({ type: "proto", msg: `🧭 ${n.label || n.type}: routed interfaces up (${ifaces}).` });
        pushTopologyLog({ type: "proto", msg: `🛠️ ${n.label || n.type}: services DHCP=${n.services?.dhcp ? "on" : "off"} DNS=${n.services?.dns ? "on" : "off"} NAT=${n.services?.nat ? "on" : "off"} ACL=${n.services?.acl ? "on" : "off"}.` });
      }
      if (n.type === "dhcp" || n.type === "dns") {
        pushTopologyLog({ type: "proto", msg: `🛠️ ${n.label}: ${n.type.toUpperCase()} service enabled.` });
      }
    });
    presetLinks.forEach((l) => {
      const a = presetNodes.find((n) => n.id === l.from);
      const b = presetNodes.find((n) => n.id === l.to);
      pushTopologyLog({ type: "wire", msg: `🔌 Link up: ${a?.label || a?.type} ↔ ${b?.label || b?.type} (${l.cableLabel}, ${l.speed}).` });
    });
    presetNodes.filter((n) => isEndpointNodeType(n.type)).forEach((host) => {
      if ((host.ip || "").startsWith("169.254.")) {
        pushTopologyLog({ type: "warn", msg: `🟡 ${host.label || host.type}: APIPA ${host.ip} (no DHCP lease).` });
      } else {
        pushTopologyLog({ type: "proto", msg: `✅ ${host.label || host.type}: baseline IP ${host.ip}/${host.subnet}, gateway ${host.gateway}.` });
      }
    });
    pushTopologyLog({ type: "event", msg: `✅ Preset provisioning complete.` });
  }, [pushTopologyLog, normalizeRouterInterfaces, isEndpointNodeType]);

  const loadPreset = (preset) => {
    clearAll();
    _nodeId = 0;
    _linkId = 0;
    let newNodes = [];
    let newLinks = [];
    if (preset === "basic_lan") {
      newNodes = [
        { id: "n1", type: "pc", label: "PC", icon: "🖥️", color: "#38bdf8", x: 80, y: 120, mac: genMAC(), ip: "192.168.1.10", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "192.168.1.1", subnet: "255.255.255.0", status: "up" },
        { id: "n2", type: "laptop", label: "Laptop", icon: "💻", color: "#60a5fa", x: 80, y: 280, mac: genMAC(), ip: "192.168.1.11", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "192.168.1.1", subnet: "255.255.255.0", status: "up" },
        { id: "n3", type: "switch", label: "L2 Switch", icon: "🔲", color: "#2dd4bf", x: 250, y: 200, mac: genMAC(), ip: "192.168.1.2", vlan: 1, stp: "enabled", duplex: "auto", speed: "auto", gateway: "192.168.1.1", subnet: "255.255.255.0", status: "up" },
        { id: "n4", type: "router", label: "Router", icon: "🔀", color: "#f97316", x: 440, y: 200, mac: genMAC(), ip: "192.168.1.1", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "0.0.0.0", subnet: "255.255.255.0", status: "up" },
        { id: "n5", type: "firewall", label: "Firewall", icon: "🛡️", color: "#ef4444", x: 600, y: 200, mac: genMAC(), ip: "10.0.0.1", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "0.0.0.0", subnet: "255.255.255.0", status: "up" },
        { id: "n6", type: "internet", label: "Internet", icon: "🌐", color: "#818cf8", x: 720, y: 200, mac: genMAC(), ip: "WAN", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "N/A", subnet: "N/A", status: "up" },
      ];
      newLinks = [
        { id: "l1", from: "n1", to: "n3", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 15, status: "up" },
        { id: "l2", from: "n2", to: "n3", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 20, status: "up" },
        { id: "l3", from: "n3", to: "n4", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 5, status: "up" },
        { id: "l4", from: "n4", to: "n5", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 3, status: "up" },
        { id: "l5", from: "n5", to: "n6", cable: "smf", cableLabel: "Single-Mode Fiber", cableColor: "#fbbf24", speed: "100+ Gbps", maxLen: 80000, length: 500, status: "up" },
      ];
      _nodeId = 6; _linkId = 5;
    } else if (preset === "enterprise") {
      newNodes = [
        { id: "n1", type: "pc", label: "PC", icon: "🖥️", color: "#38bdf8", x: 60, y: 80, mac: genMAC(), ip: "192.168.10.10", vlan: 10, stp: "n/a", duplex: "auto", speed: "auto", gateway: "192.168.10.1", subnet: "255.255.255.0", status: "up" },
        { id: "n2", type: "laptop", label: "Laptop", icon: "💻", color: "#60a5fa", x: 60, y: 200, mac: genMAC(), ip: "192.168.10.11", vlan: 10, stp: "n/a", duplex: "auto", speed: "auto", gateway: "192.168.10.1", subnet: "255.255.255.0", status: "up" },
        { id: "n3", type: "wap", label: "Wireless AP", icon: "📡", color: "#fbbf24", x: 60, y: 320, mac: genMAC(), ip: "192.168.10.5", vlan: 10, stp: "n/a", duplex: "auto", speed: "auto", gateway: "192.168.10.1", subnet: "255.255.255.0", status: "up" },
        { id: "n4", type: "switch", label: "Access Switch", icon: "🔲", color: "#2dd4bf", x: 220, y: 150, mac: genMAC(), ip: "192.168.10.2", vlan: 10, stp: "enabled", duplex: "auto", speed: "auto", gateway: "192.168.10.1", subnet: "255.255.255.0", status: "up" },
        { id: "n5", type: "l3switch", label: "Core L3 Switch", icon: "🔳", color: "#34d399", x: 380, y: 150, mac: genMAC(), ip: "192.168.10.1", vlan: 10, stp: "enabled", duplex: "auto", speed: "auto", gateway: "10.0.0.1", subnet: "255.255.255.0", status: "up" },
        { id: "n6", type: "ids", label: "IDS/IPS", icon: "🔍", color: "#f472b6", x: 380, y: 320, mac: genMAC(), ip: "192.168.10.100", vlan: 10, stp: "n/a", duplex: "auto", speed: "auto", gateway: "192.168.10.1", subnet: "255.255.255.0", status: "up" },
        { id: "n7", type: "firewall", label: "Firewall", icon: "🛡️", color: "#ef4444", x: 540, y: 150, mac: genMAC(), ip: "10.0.0.1", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "0.0.0.0", subnet: "255.255.255.0", status: "up" },
        { id: "n8", type: "router", label: "Edge Router", icon: "🔀", color: "#f97316", x: 660, y: 80, mac: genMAC(), ip: "203.0.113.1", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "0.0.0.0", subnet: "255.255.255.0", status: "up" },
        { id: "n9", type: "internet", label: "Internet", icon: "🌐", color: "#818cf8", x: 720, y: 200, mac: genMAC(), ip: "WAN", vlan: 1, stp: "n/a", duplex: "auto", speed: "auto", gateway: "N/A", subnet: "N/A", status: "up" },
        { id: "n10", type: "server", label: "Web Server", icon: "🖧", color: "#a78bfa", x: 540, y: 320, mac: genMAC(), ip: "10.0.0.10", vlan: 20, stp: "n/a", duplex: "auto", speed: "auto", gateway: "10.0.0.1", subnet: "255.255.255.0", status: "up" },
        { id: "n11", type: "lb", label: "Load Balancer", icon: "⚖️", color: "#c084fc", x: 660, y: 320, mac: genMAC(), ip: "10.0.0.5", vlan: 20, stp: "n/a", duplex: "auto", speed: "auto", gateway: "10.0.0.1", subnet: "255.255.255.0", status: "up" },
      ];
      newLinks = [
        { id: "l1", from: "n1", to: "n4", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 25, status: "up" },
        { id: "l2", from: "n2", to: "n4", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 25, status: "up" },
        { id: "l3", from: "n3", to: "n4", cable: "cat6", cableLabel: "Cat6", cableColor: "#38bdf8", speed: "1 Gbps", maxLen: 100, length: 15, status: "up" },
        { id: "l4", from: "n4", to: "n5", cable: "mmf", cableLabel: "Multi-Mode Fiber", cableColor: "#fb923c", speed: "10 Gbps", maxLen: 550, length: 50, status: "up" },
        { id: "l5", from: "n5", to: "n6", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 3, status: "up" },
        { id: "l6", from: "n5", to: "n7", cable: "mmf", cableLabel: "Multi-Mode Fiber", cableColor: "#fb923c", speed: "10 Gbps", maxLen: 550, length: 10, status: "up" },
        { id: "l7", from: "n7", to: "n8", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 5, status: "up" },
        { id: "l8", from: "n8", to: "n9", cable: "smf", cableLabel: "Single-Mode Fiber", cableColor: "#fbbf24", speed: "100+ Gbps", maxLen: 80000, length: 2000, status: "up" },
        { id: "l9", from: "n7", to: "n10", cable: "cat6a", cableLabel: "Cat6a", cableColor: "#3b82f6", speed: "10 Gbps", maxLen: 100, length: 10, status: "up" },
        { id: "l10", from: "n10", to: "n11", cable: "dac", cableLabel: "DAC (Twinax)", cableColor: "#e879f9", speed: "25 Gbps", maxLen: 7, length: 3, status: "up" },
      ];
      _nodeId = 11; _linkId = 10;
    }
    const normalizedNodes = newNodes.map((n) => {
      if (n.type === "router" || n.type === "l3switch") {
        return {
          ...n,
          routerMode: n.routerMode || "subinterfaces",
          routerInterfaces: normalizeRouterInterfaces(n),
          services: { ...defaultServicesForType(n.type), ...(n.services || {}) },
        };
      }
      if (n.type === "switch" && typeof n.managed === "undefined") {
        return { ...n, managed: true, switchVlans: n.switchVlans || [n.vlan || 1], trunkAllowedVlans: n.trunkAllowedVlans || [n.vlan || 1] };
      }
      if (n.type === "switch") {
        return {
          ...n,
          switchVlans: Array.isArray(n.switchVlans) && n.switchVlans.length > 0 ? n.switchVlans : [n.vlan || 1],
          trunkAllowedVlans: Array.isArray(n.trunkAllowedVlans) && n.trunkAllowedVlans.length > 0 ? n.trunkAllowedVlans : [n.vlan || 1],
        };
      }
      return { ...n, services: { ...defaultServicesForType(n.type), ...(n.services || {}) } };
    });
    let minPx = Infinity;
    let minPy = Infinity;
    let maxPx = -Infinity;
    let maxPy = -Infinity;
    normalizedNodes.forEach((n) => {
      minPx = Math.min(minPx, n.x);
      minPy = Math.min(minPy, n.y);
      maxPx = Math.max(maxPx, n.x);
      maxPy = Math.max(maxPy, n.y);
    });
    const presetCx = (minPx + maxPx) / 2;
    const presetCy = (minPy + maxPy) / 2;
    const vb = viewBoxRef.current;
    const targetCx = vb.minX + vb.w / 2;
    const targetCy = vb.minY + vb.h / 2;
    const dx = targetCx - presetCx;
    const dy = targetCy - presetCy;
    const shifted = normalizedNodes.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy }));
    const clampedNodes = shifted.map((n) => ({
      ...n,
      x: Math.max(30, Math.min(labCanvas.w - 30, n.x)),
      y: Math.max(30, Math.min(labCanvas.h - 30, n.y)),
    }));
    setNodes(clampedNodes);
    setLinks(newLinks);
    logPresetProvisioning(preset, clampedNodes, newLinks);
  };

  // Canvas renderer
  const renderCanvas = () => {
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);
    const gridCols = Math.ceil(labCanvas.w / 20) + 1;
    const gridRows = Math.ceil(labCanvas.h / 20) + 1;

    const vbStr = `${viewBox.minX} ${viewBox.minY} ${viewBox.w} ${viewBox.h}`;
    return (
      <svg ref={svgRef} width="100%" height="100%" viewBox={vbStr} preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, shiftKey: false, preventDefault: () => e.preventDefault() });
        }}
        style={{ background: "rgba(12, 18, 32, 0.55)", borderRadius: 10, cursor: dragging ? "grabbing" : "default", display: "block", userSelect: "none", touchAction: "none" }}
      >
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <marker id="arrowSim" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#00e5ff"/></marker>
        </defs>
        {/* Grid */}
        {Array.from({ length: gridCols }).map((_, i) => <line key={`gv${i}`} x1={i * 20} y1={0} x2={i * 20} y2={labCanvas.h} stroke="rgba(255,255,255,0.065)" strokeWidth={1} />)}
        {Array.from({ length: gridRows }).map((_, i) => <line key={`gh${i}`} x1={0} y1={i * 20} x2={labCanvas.w} y2={i * 20} stroke="rgba(255,255,255,0.065)" strokeWidth={1} />)}
        
        {/* Links */}
        {links.map(link => {
          const a = nodeMap[link.from];
          const b = nodeMap[link.to];
          if (!a || !b) return null;
          const isSel = selectedLink === link.id;
          const hasFault = activeFault && simRunning;
          return (
            <g key={link.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={isSel ? "#fff" : link.cableColor} strokeWidth={isSel ? 3 : 2}
                strokeDasharray={link.cable === "wireless" ? "6,4" : undefined}
                opacity={0.7} filter={isSel ? "url(#glow)" : undefined}
              />
              <text x={(a.x+b.x)/2} y={(a.y+b.y)/2 - 8} fill={link.cableColor} fontSize={9} textAnchor="middle" fontFamily="monospace" opacity={0.8}>
                {link.cableLabel}
              </text>
            </g>
          );
        })}

        {/* Animated packets */}
        {simRunning && simPackets.map((pkt, i) => {
          const a = nodeMap[pkt.from];
          const b = nodeMap[pkt.to];
          if (!a || !b) return null;
          const delay = pkt.step * 15;
          const progress = Math.min(1, Math.max(0, (tick - delay) / 14));
          if (progress <= 0 || progress > 1) return null;
          const px = a.x + (b.x - a.x) * progress;
          const py = a.y + (b.y - a.y) * progress;
          return (
            <g key={`pkt${i}`}>
              <circle cx={px} cy={py} r={6} fill="#00e5ff" opacity={0.9} filter="url(#glow)" />
              <circle cx={px} cy={py} r={3} fill="#fff" />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const isSel = selectedNode === n.id;
          const isSrc = simSource === n.id;
          const isDst = simDest === n.id;
          return (
            <g key={n.id} style={{ cursor: connecting ? "crosshair" : "grab" }}>
              <rect x={n.x-30} y={n.y-30} width={60} height={60} rx={12}
                fill={isSel ? `${n.color}33` : "rgba(15,23,42,0.85)"}
                stroke={isSrc ? "#00e5ff" : isDst ? "#f43f5e" : isSel ? n.color : "rgba(255,255,255,0.12)"}
                strokeWidth={isSel || isSrc || isDst ? 2.5 : 1}
                filter={isSel ? "url(#glow)" : undefined}
              />
              <text x={n.x} y={n.y+4} textAnchor="middle" fontSize={22} style={{pointerEvents:"none"}}>{n.icon}</text>
              <text x={n.x} y={n.y+44} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="monospace" style={{pointerEvents:"none"}}>
                {n.label || n.type}
              </text>
              <text x={n.x} y={n.y+54} textAnchor="middle" fontSize={8} fill="#475569" fontFamily="monospace" style={{pointerEvents:"none"}}>
                {n.ip}
              </text>
              {isSrc && <text x={n.x+30} y={n.y-22} fontSize={9} fill="#00e5ff" fontFamily="monospace">SRC</text>}
              {isDst && <text x={n.x+30} y={n.y-22} fontSize={9} fill="#f43f5e" fontFamily="monospace">DST</text>}
            </g>
          );
        })}

        {/* Connecting line */}
        {connecting && <text x={labCanvas.w / 2} y={20} textAnchor="middle" fontSize={11} fill="#00e5ff" fontFamily="monospace">Click a device to complete the connection</text>}
      </svg>
    );
  };

  const logColors = { info: "#38bdf8", osi: "#a78bfa", detail: "#64748b", wire: "#2dd4bf", device: "#fbbf24", success: "#22c55e", error: "#ef4444", fault: "#ef4444", fix: "#22c55e", warn: "#f59e0b" };

  const overlayPanelStyle = {
    margin: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(10,14,26,0.92)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
    boxSizing: "border-box",
  };

  return (
    <div className="network-lab-root">
      <div className="network-lab-stage">
        <div ref={canvasRef} className="network-lab-canvas-wrap">
          {renderCanvas()}
          <div className="network-lab-zoom-toolbar" aria-label="Canvas zoom">
            <button type="button" onClick={() => nudgeLabZoom(-1)} title="Zoom out"
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.55)", color: "#e2e8f0", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>−</button>
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", minWidth: 44, textAlign: "center" }}>
              {Math.round((labCanvas.w / viewBox.w) * 100)}%
            </span>
            <button type="button" onClick={() => nudgeLabZoom(1)} title="Zoom in"
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.55)", color: "#e2e8f0", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>+</button>
            <button type="button" onClick={resetLabView} title="Reset zoom and pan"
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(0,229,255,0.35)", background: "rgba(0,229,255,0.12)", color: "#00e5ff", cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>Reset</button>
          </div>
          <div className="network-lab-zoom-hint" style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>
            Scroll to zoom · Shift+drag or middle mouse to pan
          </div>
          {nodes.length === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "#475569", pointerEvents: "none", zIndex: 5 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>Add devices from the panel above or load a preset</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>Drag to move · Select + Connect to wire · Simulate tab to send packets</div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`network-lab-overlay-top${topBarOpen ? "" : " network-lab-overlay-top--menu-floating-visible"}${dockOpen ? " network-lab-overlay-top--dock-open" : " network-lab-overlay-top--dock-collapsed"}`}
      >
        <button
          type="button"
          className="network-lab-top-menu-floating"
          onClick={openTopBar}
          aria-expanded={topBarOpen}
          aria-controls="network-lab-top-panel-main"
          aria-hidden={topBarOpen}
          tabIndex={topBarOpen ? -1 : 0}
          id="network-lab-top-menu-btn"
          title="Show Network Lab controls"
        >
          <span className="network-lab-top-menu-icon" aria-hidden>
            ☰
          </span>
        </button>
        <div
          ref={topPaneAnimRef}
          className={`network-lab-top-pane-anim${topBarOpen ? " network-lab-top-pane-anim--expanded" : " network-lab-top-pane-anim--collapsed"}`}
        >
          <div className="network-lab-top-panel-scale-y">
            <div className="network-lab-top-panel-scale-x">
        <div
          ref={topOverlayPanelRef}
          className={`network-lab-overlay-panel${topBarOpen ? " network-lab-overlay-panel--top-expanded" : " network-lab-overlay-panel--top-collapsed"}`}
          style={overlayPanelStyle}
          inert={!topBarOpen}
          aria-hidden={!topBarOpen}
        >
          <div id="network-lab-top-panel-main" className="network-lab-top-panel-main">
          <div className="network-lab-top-panel-header">
            <div className="network-lab-top-panel-header-text">
              <span style={{ fontSize: 14, fontWeight: 700, color: "#00e5ff", fontFamily: "'JetBrains Mono', monospace" }}>🏗️ Network Lab</span>
              <span style={{ fontSize: 11, color: "#64748b", flex: "1 1 200px", minWidth: 0, lineHeight: 1.4 }}>Build, simulate, and fault-inject on the full canvas below. Workspace size is the logical drawing area (coordinates).</span>
            </div>
            <button
              type="button"
              className="network-lab-top-collapse-btn"
              onClick={closeTopBar}
              aria-expanded={topBarOpen}
              title="Collapse tools to top bar"
            >
              <span aria-hidden>▴</span>
              <span className="network-lab-top-collapse-label">Hide</span>
            </button>
          </div>
          <div className="network-lab-top-panel-scroll">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <Pill active={tab==="build"} onClick={() => setTab("build")} color="#00e5ff">🔧 Build</Pill>
            <Pill active={tab==="sim"} onClick={() => setTab("sim")} color="#22c55e">▶ Simulate</Pill>
            <Pill active={tab==="faults"} onClick={() => setTab("faults")} color="#ef4444">⚡ Fault Injection</Pill>
          </div>

      {tab === "build" && (
        <>
          {/* Device palette */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Add device (appears in the center of your current view)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DEVICE_TEMPLATES.map(d => (
                <button key={d.type} onClick={() => addDevice(d)} style={{
                  padding: "6px 12px", borderRadius: 8, border: `1px solid ${d.color}44`, background: `${d.color}11`,
                  color: d.color, cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: 4
                }}>{d.icon} {d.label}</button>
              ))}
            </div>
          </div>

          {/* Cable selector + actions */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Cable Type</div>
              <select value={cableType} onChange={e => setCableType(e.target.value)} style={{
                padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "'JetBrains Mono', monospace"
              }}>
                {CABLE_OPTIONS.map(c => <option key={c.type} value={c.type}>{c.label} ({c.speed})</option>)}
              </select>
            </div>
            <button onClick={() => { if (selectedNode) setConnecting(selectedNode); }} disabled={!selectedNode}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #00e5ff44", background: connecting ? "#00e5ff33" : "#00e5ff11", color: connecting ? "#fff" : "#00e5ff", cursor: selectedNode ? "pointer" : "default", fontSize: 12, marginTop: 16, opacity: selectedNode ? 1 : 0.4 }}>
              {connecting ? "🔗 Connecting..." : "🔗 Connect Selected"}
            </button>
            {selectedNode && <button onClick={() => removeNode(selectedNode)}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ef444444", background: "#ef444411", color: "#ef4444", cursor: "pointer", fontSize: 12, marginTop: 16 }}>🗑 Remove Device</button>}
            {selectedLink && <button onClick={() => removeLink(selectedLink)}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ef444444", background: "#ef444411", color: "#ef4444", cursor: "pointer", fontSize: 12, marginTop: 16 }}>✂ Remove Link</button>}
            <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={() => loadPreset("basic_lan")} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>📋 Basic LAN</button>
              <button onClick={() => loadPreset("enterprise")} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>🏢 Enterprise</button>
              <button onClick={clearAll} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ef444444", background: "rgba(239,68,68,0.05)", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>🗑 Clear All</button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Workspace (drawing area)</div>
              <select
                value={workspaceMenuId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") {
                    setWorkspaceMenuId("custom");
                    setCustomW(String(labCanvas.w));
                    setCustomH(String(labCanvas.h));
                    return;
                  }
                  const p = LAB_WORKSPACE_PRESETS.find((x) => x.id === v);
                  if (p) applyWorkspaceSize(p.w, p.h, v);
                }}
                style={{
                  padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)",
                  color: "#e2e8f0", fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {LAB_WORKSPACE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} ({p.w}×{p.h})</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
            </div>
            {workspaceMenuId === "custom" && (
              <>
                <input
                  type="number"
                  min={640}
                  max={7680}
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  placeholder="Width"
                  style={{ width: 76, padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}
                />
                <span style={{ color: "#475569", paddingBottom: 6 }}>×</span>
                <input
                  type="number"
                  min={360}
                  max={4320}
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                  placeholder="Height"
                  style={{ width: 76, padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}
                />
                <button
                  type="button"
                  onClick={() => applyWorkspaceSize(Number(customW) || labCanvas.w, Number(customH) || labCanvas.h)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #22c55e55", background: "#22c55e14", color: "#22c55e", cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Apply size
                </button>
              </>
            )}
          </div>
        </>
      )}

      {tab === "sim" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Source</div>
            <select value={simSource || ""} onChange={e => setSimSource(e.target.value || null)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #00e5ff44", background: "rgba(0,0,0,0.3)", color: "#00e5ff", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              <option value="">— select —</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.icon} {n.label || n.type} ({n.ip})</option>)}
            </select>
          </div>
          <div style={{ fontSize: 18, color: "#475569", paddingBottom: 4 }}>→</div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Destination</div>
            <select value={simDest || ""} onChange={e => setSimDest(e.target.value || null)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #f43f5e44", background: "rgba(0,0,0,0.3)", color: "#f43f5e", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              <option value="">— select —</option>
              {nodes.filter(n => n.id !== simSource).map(n => <option key={n.id} value={n.id}>{n.icon} {n.label || n.type} ({n.ip})</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>Protocol</div>
            <select value={simProtocol} onChange={e => setSimProtocol(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              {["HTTPS","HTTP","SSH","DNS","DHCP","FTP","SMTP","RDP","SNMP"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={runSimulation} disabled={!simSource || !simDest || simRunning}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #22c55e", background: "#22c55e18", color: "#22c55e", cursor: simSource && simDest && !simRunning ? "pointer" : "default", fontSize: 13, fontWeight: 600, opacity: simSource && simDest && !simRunning ? 1 : 0.4 }}>
            ▶ Send Packet
          </button>
        </div>
      )}

      {tab === "faults" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>
            Inject a fault into the network (active during simulation)
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={() => { setActiveFault(null); setFaultDetail(null); }}
              style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${!activeFault ? "#22c55e" : "rgba(255,255,255,0.1)"}`, background: !activeFault ? "#22c55e18" : "transparent", color: !activeFault ? "#22c55e" : "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
              ✅ No Fault
            </button>
            {FAULT_SCENARIOS.map(f => (
              <button key={f.id} onClick={() => { setActiveFault(f.id); setFaultDetail(f.id); }}
                style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${activeFault === f.id ? f.color : "rgba(255,255,255,0.1)"}`, background: activeFault === f.id ? `${f.color}18` : "transparent", color: activeFault === f.id ? f.color : "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                {f.icon} {f.name}
              </button>
            ))}
          </div>
          {faultDetail && (() => {
            const f = FAULT_SCENARIOS.find(x => x.id === faultDetail);
            if (!f) return null;
            return (
              <div style={{ padding: 16, background: `${f.color}08`, border: `1px solid ${f.color}33`, borderRadius: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: f.color, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{f.icon} {f.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 10 }}>{f.desc}</div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Symptoms</div>
                {f.symptoms.map((s,i) => <div key={i} style={{ fontSize: 12, color: "#f87171", padding: "3px 0" }}>• {s}</div>)}
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>Fix</div>
                <div style={{ fontSize: 12, color: "#4ade80", lineHeight: 1.6 }}>{f.fix}</div>
              </div>
            );
          })()}
        </div>
      )}

          </div>
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`network-lab-dock-rail${dockOpen ? "" : " network-lab-dock-rail--collapsed"}`}
        aria-label="Logs and properties"
      >
        <div className="network-lab-dock-rail-inner">
        <div
          className="network-lab-overlay-right"
          id="network-lab-dock-panel"
          inert={!dockOpen}
          aria-hidden={!dockOpen}
        >
          <div className="network-lab-dock-shell">
            <div className="network-lab-dock-title">📋 Logs &amp; properties</div>
            <p className="network-lab-dock-sub">Topology events, device/link editor, simulation log</p>
            <div className="network-lab-side-panel">
          <div className="network-lab-topology-log">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                Topology Events (Power-On / Link / DHCP)
              </div>
              <button
                type="button"
                onClick={() => setTopologyLog([])}
                disabled={topologyLog.length === 0}
                title="Clear topology event log"
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: topologyLog.length === 0 ? "transparent" : "rgba(239,68,68,0.1)",
                  color: topologyLog.length === 0 ? "#475569" : "#f87171",
                  cursor: topologyLog.length === 0 ? "default" : "pointer",
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                }}
              >
                Clear
              </button>
            </div>
            {topologyLog.length === 0 ? (
              <div style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
                Add devices and connect links to see startup/network protocol events.
              </div>
            ) : (
              topologyLog.map((entry, i) => (
                <div key={i} style={{ padding: "3px 0", fontSize: 12, color: entry.type === "warn" ? "#f59e0b" : entry.type === "proto" ? "#38bdf8" : entry.type === "wire" ? "#22c55e" : "#94a3b8", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
                  {entry.msg}
                </div>
              ))
            )}
          </div>

          <div className="network-lab-props-sim-stack">
        {/* Properties */}
        <div className="network-lab-props-col">
          {selNodeObj && (
            <Card color={selNodeObj.color} title={`${selNodeObj.icon} ${selNodeObj.label || selNodeObj.type} Properties`}>
              {(() => {
                const isL2Switch = selNodeObj.type === "switch";
                const isRoutingNode = selNodeObj.type === "router" || selNodeObj.type === "l3switch";
                const supportsServices = ["router", "l3switch", "dhcp", "dns", "firewall"].includes(selNodeObj.type);
                const isManagedSwitch = !isL2Switch || selNodeObj.managed !== false;
                const showMgmtFields = !isL2Switch || isManagedSwitch;
                const routerMode = selNodeObj.routerMode || "subinterfaces";
                const routerIfList = isRoutingNode ? normalizeRouterInterfaces(selNodeObj) : [];
                const routerIfText = routerIfList.map((i) => `${i.name} ${i.ip}/${i.subnet} (VLAN ${i.vlan})`).join(" | ");
                const switchVlansText = isL2Switch ? (selNodeObj.switchVlans || [selNodeObj.vlan || 1]).join(", ") : "";
                const trunkVlansText = isL2Switch ? (selNodeObj.trunkAllowedVlans || [selNodeObj.vlan || 1]).join(", ") : "";
                const vlanChoices = (() => {
                  const parseCsvVlans = (raw) =>
                    String(raw || "")
                      .split(",")
                      .map((v) => parseInt(v.trim(), 10))
                      .filter((v) => Number.isInteger(v) && v > 0);
                  const set = new Set();
                  nodes.forEach((n) => {
                    // VLAN catalog should come from configured switch/router VLAN configuration, not host defaults.
                    if (n.type === "switch") {
                      if (Array.isArray(n.switchVlans)) n.switchVlans.forEach((v) => set.add(v));
                      if (Array.isArray(n.trunkAllowedVlans)) n.trunkAllowedVlans.forEach((v) => set.add(v));
                      parseCsvVlans(n.switchVlansDraft).forEach((v) => set.add(v));
                      parseCsvVlans(n.trunkAllowedVlansDraft).forEach((v) => set.add(v));
                    }
                    if (Array.isArray(n.routerInterfaces)) {
                      n.routerInterfaces.forEach((iface) => {
                        if (typeof iface === "object" && typeof iface.vlan === "number") set.add(iface.vlan);
                      });
                    }
                  });
                  if (Array.isArray(selNodeObj.switchVlans)) selNodeObj.switchVlans.forEach((v) => set.add(v));
                  if (Array.isArray(selNodeObj.trunkAllowedVlans)) selNodeObj.trunkAllowedVlans.forEach((v) => set.add(v));
                  parseCsvVlans(selNodeObj.switchVlansDraft).forEach((v) => set.add(v));
                  parseCsvVlans(selNodeObj.trunkAllowedVlansDraft).forEach((v) => set.add(v));
                  if (Array.isArray(selNodeObj.routerInterfaces)) {
                    selNodeObj.routerInterfaces.forEach((iface) => {
                      if (typeof iface === "object" && typeof iface.vlan === "number") set.add(iface.vlan);
                    });
                  }
                  const result = [...set].filter((v) => Number.isInteger(v) && v > 0).sort((a, b) => a - b);
                  return result.length ? result : [1];
                })();
                return (
                  <>
              <InfoRow label="Type" value={selNodeObj.type} />
              <InfoRow label="Layer" value={selNodeObj.layer || "N/A"} />
              <InfoRow label={isL2Switch ? "Management IP" : "IP Address"} value={showMgmtFields ? selNodeObj.ip : "N/A (unmanaged)"} />
              <InfoRow label="MAC Address" value={selNodeObj.mac} />
              <InfoRow label="Subnet Mask" value={showMgmtFields ? selNodeObj.subnet : "N/A (unmanaged)"} />
              <InfoRow label="Gateway" value={showMgmtFields ? selNodeObj.gateway : "N/A (unmanaged)"} />
              <InfoRow label="VLAN" value={showMgmtFields ? selNodeObj.vlan : "N/A (unmanaged)"} />
              {isL2Switch && isManagedSwitch && <InfoRow label="Configured VLANs" value={switchVlansText} />}
              {isL2Switch && isManagedSwitch && <InfoRow label="Trunk Allowed VLANs" value={trunkVlansText} />}
              {isRoutingNode && <InfoRow label="Interface IPs" value={routerIfText} />}
              {isRoutingNode && <InfoRow label="Interface Mode" value={routerMode === "subinterfaces" ? "Router-on-a-stick (802.1Q)" : "Routed physical interfaces"} />}
              <InfoRow label="Duplex" value={selNodeObj.duplex} />
              <InfoRow label="Speed" value={selNodeObj.speed} />
              {selNodeObj.stp !== "n/a" && <InfoRow label="STP" value={selNodeObj.stp} />}
              {supportsServices && (
                <InfoRow
                  label="Services"
                  value={Object.entries(selNodeObj.services || {}).map(([k, v]) => `${k.toUpperCase()}:${v ? "on" : "off"}`).join("  ")}
                />
              )}
              <InfoRow label="Status" value={selNodeObj.status} />
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {/* Editable fields */}
                <div style={{ width: "100%" }}>
                  {isL2Switch && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <select
                        value={isManagedSwitch ? "managed" : "unmanaged"}
                        onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, managed: e.target.value === "managed"} : n))}
                        style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11 }}
                      >
                        <option value="managed">Managed L2 Switch</option>
                        <option value="unmanaged">Unmanaged L2 Switch</option>
                      </select>
                    </div>
                  )}
                  {supportsServices && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      {Object.entries(selNodeObj.services || {}).map(([svc, enabled]) => (
                        <button
                          key={svc}
                          onClick={() => setNodes(prev => prev.map(n => {
                            if (n.id !== selNodeObj.id) return n;
                            return { ...n, services: { ...(n.services || {}), [svc]: !enabled } };
                          }))}
                          style={{
                            padding: "5px 8px",
                            borderRadius: 6,
                            border: `1px solid ${enabled ? "#22c55e55" : "#64748b55"}`,
                            background: enabled ? "#22c55e18" : "rgba(100,116,139,0.12)",
                            color: enabled ? "#22c55e" : "#94a3b8",
                            fontSize: 10,
                            cursor: "pointer",
                            textTransform: "uppercase",
                          }}
                        >
                          {svc}: {enabled ? "on" : "off"}
                        </button>
                      ))}
                    </div>
                  )}
                  {isL2Switch && isManagedSwitch && (
                    <div style={{ marginBottom: 6 }}>
                      {(() => {
                        const parseVlanList = (raw, fallback) => {
                          const parsed = String(raw || "")
                            .split(",")
                            .map(v => parseInt(v.trim(), 10))
                            .filter(v => !Number.isNaN(v));
                          return parsed.length ? parsed : fallback;
                        };
                        return (
                          <>
                      <input
                        placeholder="Configured VLANs (comma separated)"
                        value={selNodeObj.switchVlansDraft ?? switchVlansText}
                        onChange={e => setNodes(prev => prev.map(n => {
                          if (n.id !== selNodeObj.id) return n;
                          return { ...n, switchVlansDraft: e.target.value };
                        }))}
                        onBlur={e => setNodes(prev => prev.map(n => {
                          if (n.id !== selNodeObj.id) return n;
                          const next = parseVlanList(e.target.value, [n.vlan || 1]);
                          return { ...n, switchVlans: next, switchVlansDraft: undefined };
                        }))}
                        onKeyDown={e => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", marginBottom: 4 }}
                      />
                      <input
                        placeholder="Trunk allowed VLANs (comma separated)"
                        value={selNodeObj.trunkAllowedVlansDraft ?? trunkVlansText}
                        onChange={e => setNodes(prev => prev.map(n => {
                          if (n.id !== selNodeObj.id) return n;
                          return { ...n, trunkAllowedVlansDraft: e.target.value };
                        }))}
                        onBlur={e => setNodes(prev => prev.map(n => {
                          if (n.id !== selNodeObj.id) return n;
                          const next = parseVlanList(e.target.value, [n.vlan || 1]);
                          return { ...n, trunkAllowedVlans: next, trunkAllowedVlansDraft: undefined };
                        }))}
                        onKeyDown={e => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace" }}
                      />
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {isRoutingNode && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <select
                        value={routerMode}
                        onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, routerMode: e.target.value} : n))}
                        style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11 }}
                      >
                        <option value="subinterfaces">Router-on-a-stick (802.1Q subinterfaces)</option>
                        <option value="routedPorts">Routed physical interfaces</option>
                      </select>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input placeholder={isL2Switch ? "Management IP" : "IP Address"} value={selNodeObj.ip} disabled={!showMgmtFields} onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, ip: e.target.value} : n))}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace" }} />
                    <select value={selNodeObj.vlan} disabled={!showMgmtFields} onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, vlan: parseInt(e.target.value)} : n))}
                      style={{ padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11 }}>
                      {vlanChoices.map(v => <option key={v} value={v}>VLAN {v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select value={selNodeObj.duplex} onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, duplex: e.target.value} : n))}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11 }}>
                      <option value="auto">Auto</option><option value="full">Full-Duplex</option><option value="half">Half-Duplex</option>
                    </select>
                    <select value={selNodeObj.speed} onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, speed: e.target.value} : n))}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11 }}>
                      <option value="auto">Auto</option><option value="10">10 Mbps</option><option value="100">100 Mbps</option><option value="1000">1 Gbps</option><option value="10000">10 Gbps</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input placeholder="Subnet Mask" value={selNodeObj.subnet} disabled={!showMgmtFields} onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, subnet: e.target.value} : n))}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace" }} />
                    <input placeholder="Gateway" value={selNodeObj.gateway} disabled={!showMgmtFields} onChange={e => setNodes(prev => prev.map(n => n.id === selNodeObj.id ? {...n, gateway: e.target.value} : n))}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace" }} />
                  </div>
                  {isRoutingNode && (
                    <div style={{ marginTop: 6 }}>
                      {routerIfList.map((iface, ifaceIdx) => (
                        <div key={ifaceIdx} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: 6, marginBottom: 6 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.3fr auto", gap: 4 }}>
                          <input
                            placeholder="Name"
                            value={iface.name}
                            onChange={e => setNodes(prev => prev.map(n => {
                              if (n.id !== selNodeObj.id) return n;
                              const list = normalizeRouterInterfaces(n);
                              list[ifaceIdx] = { ...list[ifaceIdx], name: e.target.value };
                              return { ...n, routerInterfaces: list };
                            }))}
                            style={{ padding: "5px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace" }}
                          />
                          <input
                            placeholder="IP"
                            value={iface.ip}
                            onChange={e => setNodes(prev => prev.map(n => {
                              if (n.id !== selNodeObj.id) return n;
                              const list = normalizeRouterInterfaces(n);
                              list[ifaceIdx] = { ...list[ifaceIdx], ip: e.target.value };
                              return { ...n, routerInterfaces: list, ip: ifaceIdx === 0 ? e.target.value : n.ip };
                            }))}
                            style={{ padding: "5px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace" }}
                          />
                          <input
                            placeholder="Subnet"
                            value={iface.subnet}
                            onChange={e => setNodes(prev => prev.map(n => {
                              if (n.id !== selNodeObj.id) return n;
                              const list = normalizeRouterInterfaces(n);
                              list[ifaceIdx] = { ...list[ifaceIdx], subnet: e.target.value };
                              return { ...n, routerInterfaces: list, subnet: ifaceIdx === 0 ? e.target.value : n.subnet };
                            }))}
                            style={{ padding: "5px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace" }}
                          />
                          <button
                            onClick={() => setNodes(prev => prev.map(n => {
                              if (n.id !== selNodeObj.id) return n;
                              const list = normalizeRouterInterfaces(n).filter((_, i) => i !== ifaceIdx);
                              const nextList = list.length > 0 ? list : [{ name: "G0/0.1", ip: n.ip, subnet: n.subnet || "255.255.255.0", vlan: n.vlan || 1 }];
                              return { ...n, routerInterfaces: nextList, ip: nextList[0].ip, subnet: nextList[0].subnet };
                            }))}
                            style={{ padding: "5px 6px", borderRadius: 4, border: "1px solid #ef444444", background: "#ef444411", color: "#ef4444", fontSize: 10, cursor: "pointer" }}
                          >
                            ✕
                          </button>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: routerMode === "subinterfaces" ? "1fr 1fr" : "1fr", gap: 4, marginTop: 4 }}>
                          {routerMode === "subinterfaces" && (
                          <input
                            placeholder="VLAN"
                            value={iface.vlan}
                            list={`router-vlan-options-${selNodeObj.id}`}
                            onChange={e => setNodes(prev => prev.map(n => {
                              if (n.id !== selNodeObj.id) return n;
                              const list = normalizeRouterInterfaces(n);
                              list[ifaceIdx] = { ...list[ifaceIdx], vlan: parseInt(e.target.value) || 1 };
                              return { ...n, routerInterfaces: list };
                            }))}
                            style={{ padding: "5px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace" }}
                          />
                          )}
                          {routerMode === "subinterfaces" && (
                            <datalist id={`router-vlan-options-${selNodeObj.id}`}>
                              {vlanChoices.map((v) => <option key={v} value={v} />)}
                            </datalist>
                          )}
                          <div style={{ fontSize: 10, color: "#64748b", padding: "5px 6px" }}>
                            {routerMode === "subinterfaces" ? "Tagged subinterface" : "No VLAN tag needed"}
                          </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setNodes(prev => prev.map(n => {
                          if (n.id !== selNodeObj.id) return n;
                          const list = normalizeRouterInterfaces(n);
                          const nextIdx = list.length + 1;
                          return {
                            ...n,
                            routerInterfaces: [
                              ...list,
                              { name: `G0/0.${nextIdx}`, ip: "", subnet: "255.255.255.0", vlan: 1 },
                            ],
                          };
                        }))}
                        style={{ marginTop: 4, padding: "5px 8px", borderRadius: 4, border: "1px solid #22c55e44", background: "#22c55e11", color: "#22c55e", fontSize: 11, cursor: "pointer" }}
                      >
                        + Interface
                      </button>
                      <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                        {routerMode === "subinterfaces"
                          ? "Use matching VLAN IDs on switch trunks and router subinterfaces."
                          : "Use separate routed interfaces; VLAN tag is not required on router interfaces."}
                      </div>
                    </div>
                  )}
                  {isL2Switch && !isManagedSwitch && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#fbbf24", lineHeight: 1.5 }}>
                      Unmanaged switches do not support configurable VLANs or management IP settings in this simulator.
                    </div>
                  )}
                </div>
              </div>
                  </>
                );
              })()}
            </Card>
          )}
          {selLinkObj && (
            <Card color={selLinkObj.cableColor} title={`🔗 Link Properties`}>
              <InfoRow label="Cable" value={selLinkObj.cableLabel} />
              <InfoRow label="Speed" value={selLinkObj.speed} />
              <InfoRow label="Length" value={`${selLinkObj.length}m`} />
              <InfoRow label="Max Length" value={`${selLinkObj.maxLen}m`} />
              <InfoRow label="Status" value={selLinkObj.status} />
              {selLinkObj.length > selLinkObj.maxLen && <div style={{ marginTop: 8, padding: "8px 10px", background: "#ef444418", borderRadius: 6, fontSize: 11, color: "#f87171" }}>⚠️ Cable exceeds maximum length! Signal degradation.</div>}
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <input type="number" value={selLinkObj.length} onChange={e => setLinks(prev => prev.map(l => l.id === selLinkObj.id ? {...l, length: parseInt(e.target.value) || 0} : l))}
                  style={{ width: 80, padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace" }} />
                <span style={{ fontSize: 11, color: "#64748b", paddingTop: 6 }}>meters</span>
              </div>
            </Card>
          )}
          {!selNodeObj && !selLinkObj && (
            <div style={{ padding: 20, textAlign: "center", color: "#475569", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              Click a device or cable on the canvas to view/edit properties
            </div>
          )}
        </div>

        {/* Simulation log */}
        <div className="network-lab-sim-col">
          {simLog.length > 0 ? (
            <div className="network-lab-sim-log-inner">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace", minWidth: 0 }}>
                  Simulation Log {activeFault && `— Fault: ${FAULT_SCENARIOS.find(f=>f.id===activeFault)?.name}`}
                </div>
                <button
                  type="button"
                  onClick={() => setSimLog([])}
                  title="Clear simulation log"
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  Clear
                </button>
              </div>
              {simLog.map((entry, i) => (
                <div key={i} style={{ padding: "4px 0", fontSize: 12, color: logColors[entry.type] || "#94a3b8", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5, borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  {entry.msg}
                </div>
              ))}
            </div>
          ) : (
            <div className="network-lab-sim-placeholder">
              Use the Simulate tab to select source, destination, and protocol, then click &quot;Send Packet&quot; to see the data flow.
              <br/><br/>Use the Fault Injection tab to simulate network issues!
            </div>
          )}
        </div>
          </div>
            </div>
        </div>
        </div>
        <button
          type="button"
          className="network-lab-dock-edge-toggle"
          onClick={() => setDockOpen((o) => !o)}
          aria-expanded={dockOpen}
          aria-controls="network-lab-dock-panel"
          id="network-lab-dock-toggle"
          title={dockOpen ? "Collapse logs and properties" : "Expand logs and properties"}
        >
          <span className="network-lab-dock-edge-toggle-chevron" aria-hidden>
            {dockOpen ? "▸" : "◀"}
          </span>
          <span className="network-lab-dock-edge-toggle-label">{dockOpen ? "Hide" : "Logs"}</span>
        </button>
        </div>
      </div>
    </div>
  );
}

// ─── Packet Deep Dive ────────────────────────────────────────────────────────

const BYTE_COLORS = {
  dst_mac: "#f472b6", src_mac: "#a78bfa", ethertype: "#fbbf24", vlan_tag: "#c084fc",
  payload: "#64748b", fcs: "#6b7280",
  version: "#38bdf8", ihl: "#22d3ee", dscp: "#06b6d4", total_len: "#0ea5e9",
  identification: "#0284c7", flags: "#0369a1", frag_offset: "#075985",
  ttl: "#ef4444", protocol: "#f97316", header_checksum: "#fb923c",
  src_ip: "#22c55e", dst_ip: "#10b981",
  src_port: "#e879f9", dst_port: "#d946ef", seq_num: "#a855f7", ack_num: "#9333ea",
  tcp_flags: "#7c3aed", window: "#6d28d9", tcp_checksum: "#5b21b6", data: "#475569",
  options: "#818cf8",
  op: "#38bdf8", hw_type: "#22d3ee", proto_type: "#06b6d4", hw_len: "#0ea5e9",
  proto_len: "#0284c7", sender_mac: "#a78bfa", sender_ip: "#22c55e",
  target_mac: "#f472b6", target_ip: "#10b981",
  msg_type: "#ef4444", transaction_id: "#f97316", client_ip: "#22c55e",
  your_ip: "#10b981", server_ip: "#0ea5e9", client_mac_dhcp: "#a78bfa",
  dns_id: "#38bdf8", dns_flags: "#22d3ee", qcount: "#06b6d4", acount: "#0ea5e9",
  qname: "#a78bfa", qtype: "#c084fc", rdata: "#22c55e",
};

function FrameDiagram({ fields, title, highlight, compact }) {
  return (
    <div style={{ marginBottom: compact ? 8 : 14 }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, fontFamily: "'JetBrains Mono', monospace" }}>
        {fields.map((f, i) => {
          const isHl = highlight === f.key || highlight === "all";
          return (
            <div key={i} style={{
              padding: compact ? "4px 6px" : "6px 10px",
              background: isHl ? `${f.color}33` : `${f.color}15`,
              border: `1.5px solid ${isHl ? f.color : f.color + "44"}`,
              borderRadius: 6,
              transition: "all 0.3s",
              flex: f.flex || undefined,
              minWidth: compact ? 60 : 80,
              transform: isHl ? "scale(1.04)" : "scale(1)",
              boxShadow: isHl ? `0 0 12px ${f.color}44` : "none",
            }}>
              <div style={{ fontSize: compact ? 8 : 9, color: f.color, opacity: 0.8, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: compact ? 10 : 11, color: "#e2e8f0", wordBreak: "break-all" }}>{f.value}</div>
              {f.bits && <div style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{f.bits}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableView({ title, columns, rows, color, highlightRow }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: color || "#94a3b8", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${color || "#94a3b8"}33` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr>{columns.map((c,i) => <th key={i} style={{ padding: "8px 10px", borderBottom: `2px solid ${color || "#94a3b8"}44`, color: color || "#94a3b8", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: highlightRow === ri ? `${color}18` : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "all 0.3s" }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: "7px 10px", color: highlightRow === ri ? "#e2e8f0" : "#94a3b8" }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Deep Dive Scenario Data ──

const SCENARIO_ARP = {
  name: "ARP Resolution",
  icon: "📨",
  desc: "Watch how a device discovers a MAC address for a known IP using ARP (Address Resolution Protocol). This must happen before any Ethernet frame can be sent to a new destination on the local network.",
  actors: { src: { name: "PC-A", ip: "192.168.1.10", mac: "AA:BB:CC:11:22:33" }, dst: { name: "Router", ip: "192.168.1.1", mac: "DD:EE:FF:44:55:66" }, switch: { name: "Switch", mac: "00:11:22:AA:BB:CC" } },
  steps: (a) => [
    { title: "PC-A needs Router's MAC", desc: `PC-A wants to send a packet to 10.0.0.50 (remote network). It checks its routing table — the next hop is the default gateway ${a.dst.ip}. But PC-A doesn't have the MAC address for ${a.dst.ip} in its ARP cache yet. It MUST resolve the MAC before building the Ethernet frame.`,
      frame: null, arp_cache: { title: "PC-A ARP Cache (empty)", rows: [["(empty)", "(empty)", "(empty)"]] }, highlight: null },
    { title: "ARP Request (Broadcast)", desc: `PC-A builds an ARP Request. The Ethernet frame destination is FF:FF:FF:FF:FF:FF (broadcast). The ARP payload asks: "Who has ${a.dst.ip}? Tell ${a.src.ip}". The switch receives this frame and FLOODS it to ALL ports (it's a broadcast).`,
      frame: { title: "Ethernet Frame — ARP Request", fields: [
        { key: "dst_mac", label: "Dst MAC", value: "FF:FF:FF:FF:FF:FF", color: BYTE_COLORS.dst_mac, bits: "48 bits — Broadcast" },
        { key: "src_mac", label: "Src MAC", value: a.src.mac, color: BYTE_COLORS.src_mac, bits: "48 bits" },
        { key: "ethertype", label: "EtherType", value: "0x0806 (ARP)", color: BYTE_COLORS.ethertype, bits: "16 bits" },
        { key: "op", label: "Operation", value: "1 (Request)", color: BYTE_COLORS.op },
        { key: "sender_mac", label: "Sender MAC", value: a.src.mac, color: BYTE_COLORS.sender_mac },
        { key: "sender_ip", label: "Sender IP", value: a.src.ip, color: BYTE_COLORS.sender_ip },
        { key: "target_mac", label: "Target MAC", value: "00:00:00:00:00:00", color: BYTE_COLORS.target_mac, bits: "Unknown!" },
        { key: "target_ip", label: "Target IP", value: a.dst.ip, color: BYTE_COLORS.target_ip },
        { key: "fcs", label: "FCS", value: "0xA3B7C921", color: BYTE_COLORS.fcs, bits: "32-bit CRC" },
      ]}, highlight: "dst_mac",
      cam: { title: "Switch CAM Table", color: "#2dd4bf", rows: [["1", a.src.mac, "Port 1", "Dynamic"]], hl: 0 },
      arp_cache: null,
      note: "The switch LEARNS PC-A's MAC on port 1. Since Dst is broadcast, it floods to all other ports." },
    { title: "Switch processes the broadcast", desc: `The switch receives the frame on port 1. It adds ${a.src.mac} → Port 1 to its CAM (MAC address) table. Since the destination is FF:FF:FF:FF:FF:FF, the switch floods the frame out ALL ports except the source port. The Router on port 24 receives the ARP request.`,
      frame: null,
      cam: { title: "Switch CAM Table — Updated", color: "#2dd4bf", rows: [["1", a.src.mac, "Port 1", "Dynamic"], ["—", "FF:FF:FF:FF:FF:FF", "FLOOD ALL", "—"]], hl: 0 },
      highlight: null,
      note: "CAM table now knows where PC-A is. Next frame TO PC-A will be unicast, not flooded." },
    { title: "ARP Reply (Unicast)", desc: `The Router sees the ARP request is for its own IP (${a.dst.ip}). It builds an ARP Reply: "192.168.1.1 is at ${a.dst.mac}". This is sent UNICAST back to PC-A's MAC address — not broadcast.`,
      frame: { title: "Ethernet Frame — ARP Reply", fields: [
        { key: "dst_mac", label: "Dst MAC", value: a.src.mac, color: BYTE_COLORS.dst_mac, bits: "48 bits — Unicast to PC-A" },
        { key: "src_mac", label: "Src MAC", value: a.dst.mac, color: BYTE_COLORS.src_mac, bits: "48 bits" },
        { key: "ethertype", label: "EtherType", value: "0x0806 (ARP)", color: BYTE_COLORS.ethertype, bits: "16 bits" },
        { key: "op", label: "Operation", value: "2 (Reply)", color: BYTE_COLORS.op },
        { key: "sender_mac", label: "Sender MAC", value: a.dst.mac, color: BYTE_COLORS.sender_mac },
        { key: "sender_ip", label: "Sender IP", value: a.dst.ip, color: BYTE_COLORS.sender_ip },
        { key: "target_mac", label: "Target MAC", value: a.src.mac, color: BYTE_COLORS.target_mac },
        { key: "target_ip", label: "Target IP", value: a.src.ip, color: BYTE_COLORS.target_ip },
        { key: "fcs", label: "FCS", value: "0xD4E8F102", color: BYTE_COLORS.fcs, bits: "32-bit CRC" },
      ]}, highlight: "op",
      cam: { title: "Switch CAM Table — Both learned", color: "#2dd4bf", rows: [["1", a.src.mac, "Port 1", "Dynamic"], ["2", a.dst.mac, "Port 24", "Dynamic"]], hl: 1 },
      note: "Switch learns Router's MAC on port 24. Since dst MAC is known in CAM table, this frame goes ONLY to port 1 (unicast)." },
    { title: "PC-A updates ARP cache", desc: `PC-A receives the ARP Reply and stores the mapping: ${a.dst.ip} → ${a.dst.mac} in its ARP cache. Now PC-A can build a proper Ethernet frame to the router with the correct destination MAC. The ARP cache entry will expire after a timeout (typically 60-300 seconds).`,
      frame: null,
      arp_cache: { title: "PC-A ARP Cache — Updated", rows: [[a.dst.ip, a.dst.mac, "Dynamic", "298s"]] },
      highlight: null,
      note: "ARP is complete! PC-A can now encapsulate IP packets in Ethernet frames destined for the router." },
  ]
};

const SCENARIO_TCP = {
  name: "TCP 3-Way Handshake",
  icon: "🤝",
  desc: "The TCP three-way handshake establishes a reliable connection before any data is sent. Watch the SYN, SYN-ACK, ACK sequence with actual sequence numbers, flags, and window sizes.",
  actors: { src: { name: "Client", ip: "192.168.1.10", mac: "AA:BB:CC:11:22:33", port: 49152 }, dst: { name: "Server", ip: "10.0.0.50", mac: "DD:EE:FF:44:55:66", port: 443 } },
  steps: (a) => [
    { title: "Connection needed", desc: `The client wants to open an HTTPS connection to ${a.dst.ip}:${a.dst.port}. TCP is connection-oriented — a handshake must complete before any data (like the TLS hello) can be sent. The client selects a random ephemeral source port (${a.src.port}) and generates an Initial Sequence Number (ISN).`,
      frame: null, highlight: null },
    { title: "Step 1: SYN", desc: `Client sends a SYN (Synchronize) segment. It contains the client's Initial Sequence Number (ISN = 1000). The SYN flag is set. No acknowledgment number yet (ACK flag not set). The client advertises its receive window size (65535 bytes) and MSS (Maximum Segment Size = 1460 bytes).`,
      frame: { title: "TCP Segment — SYN", fields: [
        { key: "src_port", label: "Src Port", value: String(a.src.port), color: BYTE_COLORS.src_port, bits: "16 bits — Ephemeral" },
        { key: "dst_port", label: "Dst Port", value: String(a.dst.port), color: BYTE_COLORS.dst_port, bits: "16 bits — HTTPS" },
        { key: "seq_num", label: "Seq Number", value: "1000 (ISN)", color: BYTE_COLORS.seq_num, bits: "32 bits" },
        { key: "ack_num", label: "Ack Number", value: "0 (not set)", color: BYTE_COLORS.ack_num, bits: "32 bits" },
        { key: "tcp_flags", label: "Flags", value: "SYN", color: BYTE_COLORS.tcp_flags, bits: "SYN=1 ACK=0" },
        { key: "window", label: "Window Size", value: "65535", color: BYTE_COLORS.window, bits: "16 bits" },
        { key: "tcp_checksum", label: "Checksum", value: "0xA1B2", color: BYTE_COLORS.tcp_checksum },
        { key: "options", label: "Options", value: "MSS=1460, SACK, WScale=7", color: BYTE_COLORS.options },
      ]}, highlight: "tcp_flags",
      ip_frame: { title: "IP Header wrapping this segment", fields: [
        { key: "src_ip", label: "Src IP", value: a.src.ip, color: BYTE_COLORS.src_ip },
        { key: "dst_ip", label: "Dst IP", value: a.dst.ip, color: BYTE_COLORS.dst_ip },
        { key: "protocol", label: "Protocol", value: "6 (TCP)", color: BYTE_COLORS.protocol },
        { key: "ttl", label: "TTL", value: "64", color: BYTE_COLORS.ttl },
      ]},
      note: "SYN consumes 1 sequence number. The next byte the client sends will be seq=1001." },
    { title: "Step 2: SYN-ACK", desc: `Server receives the SYN and responds with SYN-ACK. It generates its own ISN (5000) and acknowledges the client's ISN by setting ACK = client's seq + 1 = 1001. Both SYN and ACK flags are set. The server also advertises its own window size and MSS.`,
      frame: { title: "TCP Segment — SYN-ACK", fields: [
        { key: "src_port", label: "Src Port", value: String(a.dst.port), color: BYTE_COLORS.src_port, bits: "Server → Client" },
        { key: "dst_port", label: "Dst Port", value: String(a.src.port), color: BYTE_COLORS.dst_port },
        { key: "seq_num", label: "Seq Number", value: "5000 (Server ISN)", color: BYTE_COLORS.seq_num, bits: "32 bits" },
        { key: "ack_num", label: "Ack Number", value: "1001", color: BYTE_COLORS.ack_num, bits: "= Client ISN + 1" },
        { key: "tcp_flags", label: "Flags", value: "SYN, ACK", color: BYTE_COLORS.tcp_flags, bits: "SYN=1 ACK=1" },
        { key: "window", label: "Window Size", value: "28960", color: BYTE_COLORS.window },
        { key: "tcp_checksum", label: "Checksum", value: "0xC3D4", color: BYTE_COLORS.tcp_checksum },
        { key: "options", label: "Options", value: "MSS=1460, SACK, WScale=9", color: BYTE_COLORS.options },
      ]}, highlight: "ack_num",
      note: "ACK=1001 means: 'I received everything up to byte 1000. I expect byte 1001 next.' Server's SYN also consumes 1 seq number." },
    { title: "Step 3: ACK", desc: `Client sends the final ACK to complete the handshake. Seq = 1001 (next expected by server), ACK = 5001 (server's ISN + 1). No SYN flag — only ACK. The 3-way handshake is complete. The connection is now ESTABLISHED.`,
      frame: { title: "TCP Segment — ACK (Handshake Complete)", fields: [
        { key: "src_port", label: "Src Port", value: String(a.src.port), color: BYTE_COLORS.src_port },
        { key: "dst_port", label: "Dst Port", value: String(a.dst.port), color: BYTE_COLORS.dst_port },
        { key: "seq_num", label: "Seq Number", value: "1001", color: BYTE_COLORS.seq_num },
        { key: "ack_num", label: "Ack Number", value: "5001", color: BYTE_COLORS.ack_num, bits: "= Server ISN + 1" },
        { key: "tcp_flags", label: "Flags", value: "ACK", color: BYTE_COLORS.tcp_flags, bits: "SYN=0 ACK=1" },
        { key: "window", label: "Window Size", value: "65535", color: BYTE_COLORS.window },
        { key: "tcp_checksum", label: "Checksum", value: "0xE5F6", color: BYTE_COLORS.tcp_checksum },
      ]}, highlight: "tcp_flags",
      conn_state: { title: "Connection State", rows: [["Client", "ESTABLISHED", String(a.src.port), "1001", "5001"], ["Server", "ESTABLISHED", String(a.dst.port), "5001", "1001"]] },
      note: "Connection ESTABLISHED! Both sides can now send data. Next: TLS handshake for HTTPS, then HTTP request." },
    { title: "Connection established — ready for data", desc: `The TCP connection is now fully established. Both sides have exchanged ISNs, agreed on MSS (1460 bytes — fits in a 1500-byte Ethernet MTU minus 20 IP + 20 TCP headers), and window sizes for flow control. For HTTPS, the next step would be TLS ClientHello.`,
      frame: null,
      conn_state: { title: "TCP Connection Summary", rows: [
        ["Client→Server", "Seq=1001", "Ack=5001", "Win=65535", `${a.src.ip}:${a.src.port}`],
        ["Server→Client", "Seq=5001", "Ack=1001", "Win=28960", `${a.dst.ip}:${a.dst.port}`],
      ]},
      highlight: null,
      note: "Key exam point: SYN and SYN-ACK each consume 1 seq number. Data transfer uses seq numbers based on byte count." },
  ]
};

const SCENARIO_DHCP = {
  name: "DHCP DORA Process",
  icon: "📋",
  desc: "Watch the full DHCP Discover-Offer-Request-Acknowledge process as a client obtains its IP configuration. See every field in each message and how the broadcast/unicast transitions work.",
  actors: { src: { name: "New Client", ip: "0.0.0.0", mac: "AA:BB:CC:11:22:33" }, dst: { name: "DHCP Server", ip: "192.168.1.1", mac: "DD:EE:FF:44:55:66" } },
  steps: (a) => [
    { title: "Client has no IP address", desc: `A new device joins the network. It has no IP address, subnet mask, gateway, or DNS server. It needs to find a DHCP server and obtain a lease. Since it has no IP, it MUST use broadcast communication. The client generates a random Transaction ID to match requests with responses.`,
      frame: null, highlight: null,
      note: "The client only knows its own MAC address. Everything else must come from DHCP." },
    { title: "Step 1: DHCP Discover (Broadcast)", desc: `Client broadcasts a DHCP Discover message. Source IP is 0.0.0.0 (it has none), destination is 255.255.255.255 (broadcast). The message says: "I need an IP address! Any DHCP server out there?" Carried over UDP, src port 68 (client), dst port 67 (server).`,
      frame: { title: "DHCP Discover — Ethernet + IP + UDP + DHCP", fields: [
        { key: "dst_mac", label: "Dst MAC", value: "FF:FF:FF:FF:FF:FF", color: BYTE_COLORS.dst_mac, bits: "Broadcast" },
        { key: "src_mac", label: "Src MAC", value: a.src.mac, color: BYTE_COLORS.src_mac },
        { key: "src_ip", label: "Src IP", value: "0.0.0.0", color: BYTE_COLORS.src_ip, bits: "No IP yet!" },
        { key: "dst_ip", label: "Dst IP", value: "255.255.255.255", color: BYTE_COLORS.dst_ip, bits: "Broadcast" },
        { key: "src_port", label: "Src Port", value: "68 (DHCP Client)", color: BYTE_COLORS.src_port },
        { key: "dst_port", label: "Dst Port", value: "67 (DHCP Server)", color: BYTE_COLORS.dst_port },
        { key: "msg_type", label: "Msg Type", value: "1 — DISCOVER", color: BYTE_COLORS.msg_type },
        { key: "transaction_id", label: "Transaction ID", value: "0x3A2B1C4D", color: BYTE_COLORS.transaction_id },
        { key: "client_mac_dhcp", label: "Client MAC", value: a.src.mac, color: BYTE_COLORS.client_mac_dhcp },
      ]}, highlight: "msg_type",
      note: "DHCP uses UDP, NOT TCP. No handshake needed. The Transaction ID links all 4 DORA messages together." },
    { title: "Step 2: DHCP Offer", desc: `The DHCP server receives the Discover and responds with an Offer. It selects an available IP (192.168.1.50) from its pool and proposes a lease. The offer includes the IP, subnet mask, default gateway, DNS servers, and lease duration. This can be broadcast or unicast depending on implementation.`,
      frame: { title: "DHCP Offer — Server proposes an IP", fields: [
        { key: "dst_mac", label: "Dst MAC", value: a.src.mac, color: BYTE_COLORS.dst_mac, bits: "Unicast to client" },
        { key: "src_mac", label: "Src MAC", value: a.dst.mac, color: BYTE_COLORS.src_mac },
        { key: "src_ip", label: "Src IP", value: a.dst.ip, color: BYTE_COLORS.src_ip },
        { key: "dst_ip", label: "Dst IP", value: "255.255.255.255", color: BYTE_COLORS.dst_ip },
        { key: "msg_type", label: "Msg Type", value: "2 — OFFER", color: BYTE_COLORS.msg_type },
        { key: "transaction_id", label: "Transaction ID", value: "0x3A2B1C4D", color: BYTE_COLORS.transaction_id, bits: "Same as Discover" },
        { key: "your_ip", label: "Your IP", value: "192.168.1.50", color: BYTE_COLORS.your_ip, bits: "Offered to client" },
        { key: "server_ip", label: "Server IP", value: a.dst.ip, color: BYTE_COLORS.server_ip },
        { key: "options", label: "Options", value: "Mask=255.255.255.0, GW=192.168.1.1, DNS=8.8.8.8, Lease=86400s", color: BYTE_COLORS.options },
      ]}, highlight: "your_ip",
      note: "If multiple DHCP servers respond, the client typically accepts the first Offer it receives." },
    { title: "Step 3: DHCP Request (Broadcast)", desc: `The client accepts the offer by broadcasting a DHCP Request. It's broadcast (not unicast to the server) so that any OTHER DHCP servers that also sent offers know this client has chosen a different server and they can release the IP they reserved. The Request includes the chosen server's ID.`,
      frame: { title: "DHCP Request — Client accepts the offer", fields: [
        { key: "dst_mac", label: "Dst MAC", value: "FF:FF:FF:FF:FF:FF", color: BYTE_COLORS.dst_mac, bits: "Broadcast!" },
        { key: "src_mac", label: "Src MAC", value: a.src.mac, color: BYTE_COLORS.src_mac },
        { key: "src_ip", label: "Src IP", value: "0.0.0.0", color: BYTE_COLORS.src_ip, bits: "Still no IP" },
        { key: "dst_ip", label: "Dst IP", value: "255.255.255.255", color: BYTE_COLORS.dst_ip },
        { key: "msg_type", label: "Msg Type", value: "3 — REQUEST", color: BYTE_COLORS.msg_type },
        { key: "transaction_id", label: "Transaction ID", value: "0x3A2B1C4D", color: BYTE_COLORS.transaction_id },
        { key: "your_ip", label: "Requested IP", value: "192.168.1.50", color: BYTE_COLORS.your_ip },
        { key: "server_ip", label: "Server ID", value: a.dst.ip, color: BYTE_COLORS.server_ip, bits: "Chosen server" },
      ]}, highlight: "msg_type",
      note: "Key exam point: The Request is BROADCAST even though the client knows the server's IP. This notifies all other DHCP servers." },
    { title: "Step 4: DHCP Acknowledge", desc: `The DHCP server confirms the lease with an ACK. The client can now use the IP address 192.168.1.50. The lease timer starts. The client will need to renew at 50% of lease time (T1) and rebind at 87.5% (T2). The client now configures its interface with the received settings.`,
      frame: { title: "DHCP ACK — Lease confirmed!", fields: [
        { key: "dst_mac", label: "Dst MAC", value: a.src.mac, color: BYTE_COLORS.dst_mac },
        { key: "src_mac", label: "Src MAC", value: a.dst.mac, color: BYTE_COLORS.src_mac },
        { key: "msg_type", label: "Msg Type", value: "5 — ACK", color: BYTE_COLORS.msg_type },
        { key: "transaction_id", label: "Transaction ID", value: "0x3A2B1C4D", color: BYTE_COLORS.transaction_id },
        { key: "your_ip", label: "Your IP", value: "192.168.1.50", color: BYTE_COLORS.your_ip },
        { key: "server_ip", label: "Server IP", value: a.dst.ip, color: BYTE_COLORS.server_ip },
        { key: "options", label: "Lease Time", value: "86400 seconds (24 hours)", color: BYTE_COLORS.options },
      ]}, highlight: "your_ip",
      lease: { title: "Client Configuration Applied", rows: [
        ["IP Address", "192.168.1.50"], ["Subnet Mask", "255.255.255.0"], ["Default Gateway", "192.168.1.1"],
        ["DNS Server", "8.8.8.8"], ["Lease Duration", "24 hours"], ["Renew (T1)", "12 hours"], ["Rebind (T2)", "21 hours"],
      ]},
      note: "DORA complete! If DHCP fails, the client falls back to APIPA (169.254.x.x) — link-local only, no routing." },
  ]
};

const SCENARIO_DNS = {
  name: "DNS Resolution Chain",
  icon: "🔤",
  desc: "Follow a DNS query from the client through the recursive resolver to root servers, TLD servers, and authoritative servers. See the actual DNS record types in each response.",
  actors: { src: { name: "Client", ip: "192.168.1.50" }, resolver: { name: "Recursive Resolver", ip: "8.8.8.8" }, root: { name: "Root Server", ip: "198.41.0.4" }, tld: { name: ".com TLD Server", ip: "192.5.6.30" }, auth: { name: "Authoritative NS", ip: "205.251.192.64" } },
  steps: (a) => [
    { title: "User types www.example.com", desc: `The browser needs to resolve www.example.com to an IP address. It first checks the local DNS cache — no entry found. It then sends a recursive query to the configured DNS resolver (${a.resolver.ip}). The query is sent over UDP port 53.`,
      frame: { title: "DNS Query — Client → Resolver", fields: [
        { key: "src_ip", label: "Src", value: a.src.ip, color: BYTE_COLORS.src_ip },
        { key: "dst_ip", label: "Dst", value: a.resolver.ip, color: BYTE_COLORS.dst_ip },
        { key: "src_port", label: "Src Port", value: "51234", color: BYTE_COLORS.src_port, bits: "Ephemeral" },
        { key: "dst_port", label: "Dst Port", value: "53 (DNS)", color: BYTE_COLORS.dst_port },
        { key: "dns_id", label: "Query ID", value: "0xABCD", color: BYTE_COLORS.dns_id },
        { key: "dns_flags", label: "Flags", value: "RD=1 (Recursion Desired)", color: BYTE_COLORS.dns_flags },
        { key: "qname", label: "Query Name", value: "www.example.com", color: BYTE_COLORS.qname },
        { key: "qtype", label: "Query Type", value: "A (IPv4 address)", color: BYTE_COLORS.qtype },
      ]}, highlight: "qname",
      note: "RD=1 tells the resolver: 'Please do the full resolution for me.' This is a recursive query." },
    { title: "Resolver queries Root Server", desc: `The resolver doesn't have www.example.com cached. It starts from the top of the DNS hierarchy — the root servers. It sends an iterative query to a root server (${a.root.ip}). The root server doesn't know the answer but knows who handles .com domains.`,
      frame: { title: "Root Server Response — Referral to .com TLD", fields: [
        { key: "dns_flags", label: "Flags", value: "AA=0, RA=0 (Not authoritative, referral)", color: BYTE_COLORS.dns_flags },
        { key: "qname", label: "Query", value: "www.example.com", color: BYTE_COLORS.qname },
        { key: "rdata", label: "Authority Section", value: "NS: a.gtld-servers.net (192.5.6.30)", color: BYTE_COLORS.rdata, bits: "→ Go ask the .com TLD" },
      ]}, highlight: "rdata",
      note: "Root server gives a REFERRAL, not an answer. 'I don't know, but ask the .com TLD servers.'" },
    { title: "Resolver queries .com TLD Server", desc: `The resolver follows the referral and queries the .com TLD server (${a.tld.ip}). The TLD server doesn't have the final answer either, but it knows which name servers are authoritative for example.com.`,
      frame: { title: ".com TLD Response — Referral to Authoritative NS", fields: [
        { key: "dns_flags", label: "Flags", value: "AA=0 (Referral)", color: BYTE_COLORS.dns_flags },
        { key: "qname", label: "Query", value: "www.example.com", color: BYTE_COLORS.qname },
        { key: "rdata", label: "Authority Section", value: "NS: ns1.example.com (205.251.192.64)", color: BYTE_COLORS.rdata, bits: "→ Go ask example.com's NS" },
      ]}, highlight: "rdata",
      note: "Another referral. The TLD knows who is authoritative for example.com." },
    { title: "Resolver queries Authoritative NS", desc: `The resolver queries the authoritative name server for example.com (${a.auth.ip}). THIS server has the actual DNS records for the domain. It returns the A record with the IP address.`,
      frame: { title: "Authoritative Answer — The actual IP!", fields: [
        { key: "dns_flags", label: "Flags", value: "AA=1 (Authoritative Answer!)", color: BYTE_COLORS.dns_flags },
        { key: "qname", label: "Query", value: "www.example.com", color: BYTE_COLORS.qname },
        { key: "qtype", label: "Record Type", value: "A", color: BYTE_COLORS.qtype },
        { key: "rdata", label: "Answer", value: "93.184.216.34", color: BYTE_COLORS.rdata },
        { key: "options", label: "TTL", value: "3600 seconds (cache for 1 hour)", color: BYTE_COLORS.options },
      ]}, highlight: "rdata",
      note: "AA=1 means this IS the authoritative answer. The resolver caches this for the TTL duration." },
    { title: "Resolver returns answer to client", desc: `The resolver caches the answer (www.example.com → 93.184.216.34, TTL 3600s) and forwards it to the client. The client also caches it locally. The browser can now initiate a TCP connection to 93.184.216.34.`,
      frame: { title: "DNS Response — Resolver → Client", fields: [
        { key: "src_ip", label: "Src", value: a.resolver.ip, color: BYTE_COLORS.src_ip },
        { key: "dst_ip", label: "Dst", value: a.src.ip, color: BYTE_COLORS.dst_ip },
        { key: "dns_id", label: "Query ID", value: "0xABCD", color: BYTE_COLORS.dns_id, bits: "Matches original" },
        { key: "dns_flags", label: "Flags", value: "RA=1, RCODE=0 (No Error)", color: BYTE_COLORS.dns_flags },
        { key: "qname", label: "Name", value: "www.example.com", color: BYTE_COLORS.qname },
        { key: "rdata", label: "A Record", value: "93.184.216.34", color: BYTE_COLORS.rdata },
        { key: "options", label: "TTL", value: "3600s", color: BYTE_COLORS.options },
      ]}, highlight: "rdata",
      dns_types: { title: "Common DNS Record Types (exam!)", rows: [
        ["A", "IPv4 address", "93.184.216.34"], ["AAAA", "IPv6 address", "2606:2800:220:1:..."],
        ["CNAME", "Alias/Canonical name", "www → example.com"], ["MX", "Mail server", "mail.example.com (priority 10)"],
        ["NS", "Name server", "ns1.example.com"], ["PTR", "Reverse lookup (IP→name)", "34.216.184.93 → example.com"],
        ["TXT", "Text (SPF, DKIM, etc.)", "v=spf1 include:..."], ["SRV", "Service location", "_sip._tcp.example.com"],
        ["SOA", "Start of Authority", "Primary NS, admin email, serial"],
      ]},
      note: "DNS resolution involved 4 queries total: client→resolver, resolver→root, resolver→TLD, resolver→authoritative." },
  ]
};

const SCENARIO_HTTPS = {
  name: "Full HTTPS Packet Lifecycle",
  icon: "🔒",
  desc: "Follow a complete HTTPS request through every stage: frame creation, encapsulation down the OSI layers, NAT translation at the router, and the MAC/IP rewriting at each hop.",
  actors: { src: { name: "PC", ip: "192.168.1.10", mac: "AA:BB:CC:11:22:33", port: 49152 }, router: { name: "Router", ip_in: "192.168.1.1", ip_out: "203.0.113.5", mac_in: "DD:EE:FF:44:55:66", mac_out: "DD:EE:FF:44:55:67" }, dst: { name: "Web Server", ip: "93.184.216.34", mac: "11:22:33:AA:BB:CC", port: 443 } },
  steps: (a) => [
    { title: "Application layer creates HTTP request", desc: `The browser generates an HTTP GET request for https://example.com. At Layer 7, this is just the application data. It will be encrypted by TLS (Layer 6) before being wrapped in TCP, IP, and Ethernet headers.`,
      frame: { title: "L7 — Application Data (before encryption)", fields: [
        { key: "data", label: "HTTP Request", value: "GET / HTTP/1.1\\r\\nHost: example.com\\r\\n...", color: BYTE_COLORS.data, flex: "1 1 100%" },
      ]}, highlight: "data",
      note: "This is the plaintext data. After TLS encryption, this becomes opaque ciphertext." },
    { title: "L4 — TCP Segment created", desc: `The Transport layer wraps the encrypted data in a TCP segment. Source port is ephemeral (${a.src.port}), destination is 443 (HTTPS). Sequence number tracks byte position. ACK acknowledges data received from the server.`,
      frame: { title: "L4 — TCP Segment (data after TLS)", fields: [
        { key: "src_port", label: "Src Port", value: String(a.src.port), color: BYTE_COLORS.src_port },
        { key: "dst_port", label: "Dst Port", value: "443", color: BYTE_COLORS.dst_port },
        { key: "seq_num", label: "Seq", value: "1001", color: BYTE_COLORS.seq_num },
        { key: "ack_num", label: "Ack", value: "5001", color: BYTE_COLORS.ack_num },
        { key: "tcp_flags", label: "Flags", value: "PSH, ACK", color: BYTE_COLORS.tcp_flags, bits: "Push data to app" },
        { key: "window", label: "Window", value: "65535", color: BYTE_COLORS.window },
        { key: "data", label: "Payload", value: "[TLS encrypted data — 487 bytes]", color: BYTE_COLORS.data },
      ]}, highlight: "all" },
    { title: "L3 — IP Packet created", desc: `The Network layer adds the IP header. Source IP is the PC's private address (${a.src.ip}), destination is the web server's public IP (${a.dst.ip}). TTL is set to 64 — it decrements by 1 at each router hop.`,
      frame: { title: "L3 — IP Packet wrapping TCP Segment", fields: [
        { key: "version", label: "Version", value: "4 (IPv4)", color: BYTE_COLORS.version },
        { key: "ihl", label: "IHL", value: "5 (20 bytes)", color: BYTE_COLORS.ihl },
        { key: "total_len", label: "Total Length", value: "547 bytes", color: BYTE_COLORS.total_len },
        { key: "ttl", label: "TTL", value: "64", color: BYTE_COLORS.ttl, bits: "Decrements each hop" },
        { key: "protocol", label: "Protocol", value: "6 (TCP)", color: BYTE_COLORS.protocol },
        { key: "src_ip", label: "Src IP", value: a.src.ip, color: BYTE_COLORS.src_ip, bits: "Private address" },
        { key: "dst_ip", label: "Dst IP", value: a.dst.ip, color: BYTE_COLORS.dst_ip, bits: "Public server" },
        { key: "data", label: "Payload", value: "[TCP segment — 527 bytes]", color: BYTE_COLORS.data },
      ]}, highlight: "src_ip" },
    { title: "L2 — Ethernet Frame created", desc: `The Data Link layer encapsulates the IP packet in an Ethernet frame. The destination MAC is NOT the web server's MAC — it's the DEFAULT GATEWAY's MAC (${a.router.mac_in}). The PC uses ARP to get this. The source MAC is the PC's own NIC MAC.`,
      frame: { title: "L2 — Ethernet Frame (complete packet on the wire!)", fields: [
        { key: "dst_mac", label: "Dst MAC", value: a.router.mac_in, color: BYTE_COLORS.dst_mac, bits: "Router's MAC — NOT server's!" },
        { key: "src_mac", label: "Src MAC", value: a.src.mac, color: BYTE_COLORS.src_mac },
        { key: "ethertype", label: "EtherType", value: "0x0800 (IPv4)", color: BYTE_COLORS.ethertype },
        { key: "data", label: "Payload", value: "[IP Packet — 547 bytes]", color: BYTE_COLORS.data },
        { key: "fcs", label: "FCS", value: "0x7E8F9A0B", color: BYTE_COLORS.fcs, bits: "32-bit CRC" },
      ]}, highlight: "dst_mac",
      note: "CRITICAL exam concept: Dst MAC = next hop (router), NOT the final destination. Dst IP = final destination. MACs change at every hop; IPs stay the same (until NAT)." },
    { title: "Router receives — NAT Translation", desc: `The router receives the frame, strips the Ethernet header (L2), and examines the IP packet (L3). The dst IP (${a.dst.ip}) is not local — it must be routed. PAT translates the private source IP:port to the router's public IP with a mapped port. TTL is decremented.`,
      frame: { title: "IP Packet AFTER NAT/PAT on Router", fields: [
        { key: "ttl", label: "TTL", value: "63", color: BYTE_COLORS.ttl, bits: "Decremented from 64!" },
        { key: "src_ip", label: "Src IP", value: a.router.ip_out, color: BYTE_COLORS.src_ip, bits: "NAT: Private → Public!" },
        { key: "dst_ip", label: "Dst IP", value: a.dst.ip, color: BYTE_COLORS.dst_ip, bits: "Unchanged" },
        { key: "src_port", label: "Src Port", value: "30001", color: BYTE_COLORS.src_port, bits: "PAT: Remapped port!" },
        { key: "dst_port", label: "Dst Port", value: "443", color: BYTE_COLORS.dst_port, bits: "Unchanged" },
      ]}, highlight: "src_ip",
      nat: { title: "Router NAT/PAT Table", rows: [
        [a.src.ip + ":" + a.src.port, a.router.ip_out + ":30001", a.dst.ip + ":443", "TCP", "ESTABLISHED"],
      ]},
      note: "NAT rewrites the source IP. PAT also remaps the source port. The router keeps a translation table to reverse this for return traffic." },
    { title: "Router creates new Ethernet frame", desc: `The router builds a NEW Ethernet frame for the next hop. The source MAC is now the router's outbound interface MAC. The destination MAC is the next-hop router/ISP's MAC. The IP packet inside is unchanged (except TTL and NAT changes). This is how MACs change at every L3 hop but IPs persist.`,
      frame: { title: "NEW Ethernet Frame — Router's outbound interface", fields: [
        { key: "dst_mac", label: "Dst MAC", value: "ISP:00:AA:BB:CC:DD", color: BYTE_COLORS.dst_mac, bits: "Next hop MAC" },
        { key: "src_mac", label: "Src MAC", value: a.router.mac_out, color: BYTE_COLORS.src_mac, bits: "Router's outbound MAC" },
        { key: "ethertype", label: "EtherType", value: "0x0800 (IPv4)", color: BYTE_COLORS.ethertype },
        { key: "data", label: "Payload", value: `[IP: ${a.router.ip_out} → ${a.dst.ip}, TTL=63, TCP:30001→443]`, color: BYTE_COLORS.data },
        { key: "fcs", label: "FCS", value: "0xB2C3D4E5", color: BYTE_COLORS.fcs, bits: "Recalculated" },
      ]}, highlight: "src_mac",
      note: "New frame, new MACs, same IP packet (minus TTL). FCS is recalculated. This process repeats at every router on the internet." },
  ]
};

const SCENARIO_NAT = {
  name: "NAT/PAT Translation Table",
  icon: "🔄",
  desc: "Watch the NAT/PAT translation table build in real-time as multiple internal hosts communicate through a single public IP address.",
  actors: { pc1: { name: "PC-1", ip: "192.168.1.10", port: 49152 }, pc2: { name: "PC-2", ip: "192.168.1.11", port: 50200 }, pc3: { name: "PC-3", ip: "192.168.1.12", port: 51300 }, router: { name: "Router", ip_pub: "203.0.113.5" }, srv1: { name: "Google", ip: "142.250.80.46", port: 443 }, srv2: { name: "GitHub", ip: "140.82.121.4", port: 443 } },
  steps: (a) => [
    { title: "NAT/PAT overview", desc: `Three internal PCs share ONE public IP address (${a.router.ip_pub}) through PAT (Port Address Translation). The router maintains a translation table mapping each internal IP:port to a unique external port. This is how your home/office network works — many devices, one public IP.`,
      frame: null, highlight: null,
      note: "NAT = one-to-one IP mapping. PAT (NAT overload) = many-to-one using different port numbers. Most networks use PAT." },
    { title: "PC-1 connects to Google (HTTPS)", desc: `PC-1 sends a packet to Google (${a.srv1.ip}:443). The router translates the source from ${a.pc1.ip}:${a.pc1.port} to ${a.router.ip_pub}:30001. The NAT table gets its first entry.`,
      frame: { title: "Packet before NAT → after NAT", fields: [
        { key: "src_ip", label: "Before: Src", value: `${a.pc1.ip}:${a.pc1.port}`, color: BYTE_COLORS.src_ip, bits: "Inside Local" },
        { key: "dst_ip", label: "Before: Dst", value: `${a.srv1.ip}:443`, color: BYTE_COLORS.dst_ip },
        { key: "src_port", label: "After: Src", value: `${a.router.ip_pub}:30001`, color: "#22c55e", bits: "Inside Global (PAT)" },
        { key: "dst_port", label: "After: Dst", value: `${a.srv1.ip}:443`, color: BYTE_COLORS.dst_ip, bits: "Unchanged" },
      ]}, highlight: "src_port",
      nat: { title: "NAT/PAT Translation Table", rows: [
        ["Inside Local", "Inside Global", "Outside", "Proto", "State"],
        [`${a.pc1.ip}:${a.pc1.port}`, `${a.router.ip_pub}:30001`, `${a.srv1.ip}:443`, "TCP", "ESTABLISHED"],
      ], hl: 1 } },
    { title: "PC-2 connects to Google (HTTPS)", desc: `PC-2 also connects to Google on port 443. Different source IP and port, so the router maps it to a different external port (30002). Both connections work simultaneously through the single public IP.`,
      frame: { title: "PC-2's translated packet", fields: [
        { key: "src_ip", label: "Before: Src", value: `${a.pc2.ip}:${a.pc2.port}`, color: BYTE_COLORS.src_ip },
        { key: "src_port", label: "After: Src", value: `${a.router.ip_pub}:30002`, color: "#22c55e", bits: "Different PAT port!" },
      ]}, highlight: "src_port",
      nat: { title: "NAT/PAT Translation Table — 2 entries", rows: [
        ["Inside Local", "Inside Global", "Outside", "Proto", "State"],
        [`${a.pc1.ip}:${a.pc1.port}`, `${a.router.ip_pub}:30001`, `${a.srv1.ip}:443`, "TCP", "ESTABLISHED"],
        [`${a.pc2.ip}:${a.pc2.port}`, `${a.router.ip_pub}:30002`, `${a.srv1.ip}:443`, "TCP", "ESTABLISHED"],
      ], hl: 2 } },
    { title: "PC-3 connects to GitHub (SSH)", desc: `PC-3 connects to a different server entirely — GitHub on SSH port 22. The router adds another translation entry with port 30003. Three simultaneous connections through one IP.`,
      nat: { title: "NAT/PAT Translation Table — 3 entries (full)", rows: [
        ["Inside Local", "Inside Global", "Outside", "Proto", "State"],
        [`${a.pc1.ip}:${a.pc1.port}`, `${a.router.ip_pub}:30001`, `${a.srv1.ip}:443`, "TCP", "ESTABLISHED"],
        [`${a.pc2.ip}:${a.pc2.port}`, `${a.router.ip_pub}:30002`, `${a.srv1.ip}:443`, "TCP", "ESTABLISHED"],
        [`${a.pc3.ip}:${a.pc3.port}`, `${a.router.ip_pub}:30003`, `${a.srv2.ip}:22`, "TCP", "ESTABLISHED"],
      ], hl: 3 },
      frame: null, highlight: null,
      note: "The PAT port number is what distinguishes the connections. When Google's reply comes back to 203.0.113.5:30001, the router knows it's for PC-1." },
    { title: "Return traffic — reverse translation", desc: `When Google sends a reply to ${a.router.ip_pub}:30001, the router looks up port 30001 in the NAT table and translates the DESTINATION back to ${a.pc1.ip}:${a.pc1.port}. The internal PC sees the reply as coming from Google — it never knows NAT is happening.`,
      frame: { title: "Return packet — reverse NAT", fields: [
        { key: "src_ip", label: "From Internet: Src", value: `${a.srv1.ip}:443`, color: BYTE_COLORS.dst_ip },
        { key: "dst_ip", label: "From Internet: Dst", value: `${a.router.ip_pub}:30001`, color: "#22c55e" },
        { key: "src_port", label: "After NAT: Src", value: `${a.srv1.ip}:443`, color: BYTE_COLORS.dst_ip, bits: "Unchanged" },
        { key: "dst_port", label: "After NAT: Dst", value: `${a.pc1.ip}:${a.pc1.port}`, color: BYTE_COLORS.src_ip, bits: "Translated back!" },
      ]}, highlight: "dst_port",
      note: "Key insight: NAT is bidirectional. Outbound: rewrite source. Inbound: rewrite destination. The table is the key to making it all work." },
  ]
};

const SCENARIO_CAM = {
  name: "Switch CAM Table Learning",
  icon: "🧠",
  desc: "Watch a switch learn MAC addresses dynamically as frames arrive on each port. See how the CAM (Content-Addressable Memory) table populates and how forwarding decisions are made.",
  actors: { pc1: { name: "PC-A", mac: "AA:11:22:33:44:55", port: "Gi0/1" }, pc2: { name: "PC-B", mac: "BB:11:22:33:44:55", port: "Gi0/5" }, pc3: { name: "PC-C", mac: "CC:11:22:33:44:55", port: "Gi0/12" }, srv: { name: "Server", mac: "DD:11:22:33:44:55", port: "Gi0/24" } },
  steps: (a) => [
    { title: "Switch powers on — empty CAM table", desc: `The switch just booted. Its CAM (MAC address) table is completely empty. It doesn't know which MAC address is on which port. When it receives a frame and doesn't know where the destination is, it will FLOOD the frame to all ports except the source port.`,
      cam: { title: "Switch CAM Table — Empty", rows: [] }, frame: null, highlight: null,
      note: "A switch LEARNS source MACs. It LOOKS UP destination MACs. If unknown → flood." },
    { title: "PC-A sends a frame to the Server", desc: `PC-A sends a frame with Src MAC ${a.pc1.mac}, Dst MAC ${a.srv.mac}. The switch receives this on port ${a.pc1.port}. It LEARNS: "${a.pc1.mac} is on port ${a.pc1.port}". But it doesn't know where ${a.srv.mac} is yet — so it FLOODS the frame to all other ports.`,
      frame: { title: "Frame from PC-A", fields: [
        { key: "src_mac", label: "Src MAC", value: a.pc1.mac, color: BYTE_COLORS.src_mac, bits: `Learned → ${a.pc1.port}` },
        { key: "dst_mac", label: "Dst MAC", value: a.srv.mac, color: BYTE_COLORS.dst_mac, bits: "Unknown → FLOOD!" },
      ]}, highlight: "src_mac",
      cam: { title: "CAM Table — 1 entry", rows: [
        [a.pc1.mac, a.pc1.port, "VLAN 1", "Dynamic", "300s"],
      ], hl: 0 },
      note: "FLOOD = send to all ports except source. This is NOT a broadcast — it's an unknown unicast flood." },
    { title: "Server replies to PC-A", desc: `The server sends a reply frame: Src MAC ${a.srv.mac}, Dst MAC ${a.pc1.mac}. The switch learns ${a.srv.mac} on port ${a.srv.port}. Now it looks up ${a.pc1.mac} — FOUND in CAM table on port ${a.pc1.port}! The frame is forwarded ONLY to ${a.pc1.port}. No flooding needed.`,
      frame: { title: "Frame from Server", fields: [
        { key: "src_mac", label: "Src MAC", value: a.srv.mac, color: BYTE_COLORS.src_mac, bits: `Learned → ${a.srv.port}` },
        { key: "dst_mac", label: "Dst MAC", value: a.pc1.mac, color: BYTE_COLORS.dst_mac, bits: `KNOWN → ${a.pc1.port} only!` },
      ]}, highlight: "dst_mac",
      cam: { title: "CAM Table — 2 entries", rows: [
        [a.pc1.mac, a.pc1.port, "VLAN 1", "Dynamic", "300s"],
        [a.srv.mac, a.srv.port, "VLAN 1", "Dynamic", "300s"],
      ], hl: 1 } },
    { title: "PC-B and PC-C join the conversation", desc: `As more devices send frames, the switch continues learning. Each source MAC is mapped to the port it arrived on. The more traffic, the more complete the CAM table becomes, and the less flooding occurs.`,
      cam: { title: "CAM Table — Fully populated", rows: [
        [a.pc1.mac, a.pc1.port, "VLAN 1", "Dynamic", "245s"],
        [a.srv.mac, a.srv.port, "VLAN 1", "Dynamic", "298s"],
        [a.pc2.mac, a.pc2.port, "VLAN 1", "Dynamic", "180s"],
        [a.pc3.mac, a.pc3.port, "VLAN 1", "Dynamic", "120s"],
      ], hl: -1 }, frame: null, highlight: null,
      note: "Aging timer counts down. If a MAC isn't seen for 300s (default), it's removed from the table. This keeps the table current." },
    { title: "Forwarding decision flowchart", desc: `For EVERY frame the switch receives: 1) Learn the SOURCE MAC → associate with ingress port. 2) Look up DESTINATION MAC in CAM table. 3) If found → forward to that specific port (unicast). 4) If NOT found → flood to all ports in the VLAN (except source). 5) If broadcast (FF:FF:FF:FF:FF:FF) → flood to all ports in the VLAN.`,
      cam: { title: "Switch Decision Logic", rows: [
        ["Known unicast", "CAM lookup → forward to specific port", "Most traffic"],
        ["Unknown unicast", "Flood to all ports in VLAN", "Until MAC is learned"],
        ["Broadcast", "Flood to all ports in VLAN", "ARP, DHCP Discover"],
        ["Multicast", "Flood or IGMP snooping", "Streaming, OSPF"],
      ], hl: -1 }, frame: null, highlight: null,
      note: "Key exam concept: Switches FORWARD based on MAC. Routers FORWARD based on IP. Know the difference!" },
  ]
};

const SCENARIO_ROUTING = {
  name: "Routing Table Lookup",
  icon: "🗺️",
  desc: "Watch how a router examines its routing table to find the best match for a destination IP using longest prefix match. See how different routes compete and which one wins.",
  actors: { router: { name: "Core Router" } },
  steps: (a) => [
    { title: "Router receives a packet for 10.1.2.50", desc: `A packet arrives with destination IP 10.1.2.50. The router must consult its routing table to determine where to send it. It uses LONGEST PREFIX MATCH — the most specific route wins, regardless of how the route was learned.`,
      routing: { title: "Router Routing Table", rows: [
        ["10.0.0.0/8", "192.168.1.2", "Gi0/1", "OSPF", "110", "All of 10.x.x.x"],
        ["10.1.0.0/16", "192.168.1.3", "Gi0/2", "EIGRP", "90", "10.1.x.x subnet"],
        ["10.1.2.0/24", "192.168.1.4", "Gi0/3", "Static", "1", "10.1.2.x subnet"],
        ["0.0.0.0/0", "192.168.1.1", "Gi0/0", "Static", "1", "Default route"],
      ], hl: -1 }, frame: null, highlight: null,
      note: "Multiple routes match 10.1.2.50. Which one does the router choose?" },
    { title: "Longest prefix match — evaluating candidates", desc: `The router checks each route against 10.1.2.50: • 10.0.0.0/8 (/8 = first 8 bits) → matches: 10.x.x.x ✓ • 10.1.0.0/16 (/16 = first 16 bits) → matches: 10.1.x.x ✓ • 10.1.2.0/24 (/24 = first 24 bits) → matches: 10.1.2.x ✓ • 0.0.0.0/0 (/0 = match everything) ✓. All four match! The router chooses /24 — it's the LONGEST (most specific) prefix.`,
      routing: { title: "Routing Table — Longest Prefix Match", rows: [
        ["10.0.0.0/8", "192.168.1.2", "Gi0/1", "OSPF", "110", "✓ Matches (8 bits)"],
        ["10.1.0.0/16", "192.168.1.3", "Gi0/2", "EIGRP", "90", "✓ Matches (16 bits)"],
        ["10.1.2.0/24", "192.168.1.4", "Gi0/3", "Static", "1", "✓✓ BEST — 24 bits!"],
        ["0.0.0.0/0", "192.168.1.1", "Gi0/0", "Static", "1", "✓ Matches (0 bits)"],
      ], hl: 2 }, frame: null, highlight: null,
      note: "Longest prefix ALWAYS wins. The /24 route is chosen over /16 and /8 even though EIGRP (AD 90) has a lower AD than static (AD 1). Prefix length beats AD!" },
    { title: "Packet forwarded", desc: `The router forwards the packet to next-hop 192.168.1.4 via interface Gi0/3. The TTL is decremented from 64 to 63. A new Ethernet frame is built with the next-hop's MAC as the destination.`,
      frame: { title: "Forwarding decision", fields: [
        { key: "dst_ip", label: "Dst IP", value: "10.1.2.50", color: BYTE_COLORS.dst_ip, bits: "Unchanged" },
        { key: "ttl", label: "TTL", value: "63", color: BYTE_COLORS.ttl, bits: "64 → 63" },
        { key: "dst_mac", label: "New Dst MAC", value: "Next-hop MAC", color: BYTE_COLORS.dst_mac, bits: "via 192.168.1.4" },
      ]}, highlight: "dst_ip",
      note: "If two routes have the SAME prefix length, THEN Administrative Distance (AD) breaks the tie. Lower AD wins: Static(1) > EIGRP(90) > OSPF(110) > RIP(120) > eBGP(20)." },
    { title: "Administrative Distance reference", desc: `When prefix lengths are equal, the route with the lowest Administrative Distance wins. AD is a measure of trust — lower = more trusted. If AD is also equal, the routing protocol's internal metric is the tiebreaker (e.g., OSPF cost, EIGRP composite metric).`,
      routing: { title: "Administrative Distance (AD) — Memorize for exam!", rows: [
        ["Directly Connected", "0", "Interface is on the network"],
        ["Static Route", "1", "Manually configured"],
        ["eBGP", "20", "External BGP"],
        ["EIGRP (internal)", "90", "Cisco hybrid protocol"],
        ["OSPF", "110", "Open standard link-state"],
        ["IS-IS", "115", "Link-state (ISP use)"],
        ["RIP", "120", "Distance vector (legacy)"],
        ["EIGRP (external)", "170", "Redistributed into EIGRP"],
        ["iBGP", "200", "Internal BGP"],
      ], hl: -1 }, frame: null, highlight: null,
      note: "Prefix length → AD → Metric. That's the route selection order. LONGEST PREFIX ALWAYS WINS FIRST." },
  ]
};

const ALL_SCENARIOS = [SCENARIO_ARP, SCENARIO_TCP, SCENARIO_DHCP, SCENARIO_DNS, SCENARIO_HTTPS, SCENARIO_NAT, SCENARIO_CAM, SCENARIO_ROUTING];

function PacketDeepDive() {
  const [scenIdx, setScenIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [hlField, setHlField] = useState(null);
  const scenario = ALL_SCENARIOS[scenIdx];
  const steps = scenario.steps(scenario.actors);
  const s = steps[step];

  const changeScenario = (i) => { setScenIdx(i); setStep(0); setHlField(null); };

  return (
    <div>
      <SectionHeader icon="🔬" title="Packet Deep Dive" subtitle="Follow real packets through every protocol layer. Click into each field to understand the bytes on the wire." />

      {/* Scenario selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {ALL_SCENARIOS.map((sc, i) => (
          <Pill key={i} active={scenIdx === i} onClick={() => changeScenario(i)} color={scenIdx === i ? "#00e5ff" : undefined}>
            {sc.icon} {sc.name}
          </Pill>
        ))}
      </div>

      {/* Scenario description */}
      <div style={{ padding: "14px 18px", background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
        {scenario.desc}
      </div>

      {/* Step navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>
          Step {step + 1} / {steps.length}: {s.title}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setStep(Math.max(0, step-1)); setHlField(null); }} disabled={step === 0}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: step === 0 ? "transparent" : "rgba(255,255,255,0.06)", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>← Back</button>
          <button onClick={() => { setStep(Math.min(steps.length-1, step+1)); setHlField(null); }} disabled={step === steps.length-1}
            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${step === steps.length-1 ? "rgba(255,255,255,0.15)" : "#00e5ff44"}`, background: step === steps.length-1 ? "transparent" : "#00e5ff18", color: step === steps.length-1 ? "#475569" : "#00e5ff", cursor: step === steps.length-1 ? "default" : "pointer", fontSize: 12 }}>Next →</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => { setStep(i); setHlField(null); }} style={{
            flex: 1, height: 5, borderRadius: 3, cursor: "pointer", transition: "all 0.3s",
            background: i < step ? "#00e5ff" : i === step ? "#00e5ff" : "rgba(255,255,255,0.08)",
            opacity: i <= step ? 1 : 0.4,
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 16 }}>{s.desc}</div>

      {/* Frame diagrams */}
      {s.frame && <FrameDiagram fields={s.frame.fields} title={s.frame.title} highlight={hlField || s.highlight} />}
      {s.ip_frame && <FrameDiagram fields={s.ip_frame.fields} title={s.ip_frame.title} highlight={null} compact />}

      {/* Data tables (CAM, NAT, ARP cache, routing, DNS, connections, lease) */}
      {s.cam && <TableView title={s.cam.title} columns={["#","MAC Address","Port","VLAN","Type","Aging"  ].slice(0, (s.cam.rows[0]||[]).length)} rows={s.cam.rows} color="#2dd4bf" highlightRow={s.cam.hl} />}
      {s.arp_cache && <TableView title={s.arp_cache.title} columns={["IP Address","MAC Address","Type","Expires"]} rows={s.arp_cache.rows} color="#fbbf24" highlightRow={0} />}
      {s.nat && <TableView title={s.nat.title} columns={s.nat.rows[0]?.length === 5 ? ["Inside Local","Inside Global","Outside","Proto","State"] : ["Inside Local","Inside Global","Outside","Proto","State"]} rows={s.nat.rows.slice(s.nat.rows[0]?.[0] === "Inside Local" ? 1 : 0)} color="#22c55e" highlightRow={s.nat.hl !== undefined ? s.nat.hl - 1 : -1} />}
      {s.conn_state && <TableView title={s.conn_state.title} columns={["Side","State","Port","Seq","Ack"]} rows={s.conn_state.rows} color="#a78bfa" highlightRow={-1} />}
      {s.lease && <TableView title={s.lease.title} columns={["Setting","Value"]} rows={s.lease.rows} color="#22c55e" highlightRow={-1} />}
      {s.routing && <TableView title={s.routing.title} columns={["Network","Next Hop","Interface","Source","AD","Note"]} rows={s.routing.rows} color="#f97316" highlightRow={s.routing.hl} />}
      {s.dns_types && <TableView title={s.dns_types.title} columns={["Type","Description","Example"]} rows={s.dns_types.rows} color="#38bdf8" highlightRow={-1} />}

      {/* Note */}
      {s.note && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(0,229,255,0.06)", borderRadius: 8, borderLeft: "3px solid #00e5ff", fontSize: 12, color: "#00e5ff", lineHeight: 1.6 }}>
          💡 {s.note}
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function NetworkPlusDemo() {
  const [section, setSection] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [section, quizMode]);

  const renderSection = () => {
    if (quizMode) return <QuizMode />;
    switch(section) {
      case 0: return <><OSISection /><DataFlowSim /></>;
      case 1: return <AppliancesSection />;
      case 2: return <PortsSection />;
      case 3: return <TrafficSection />;
      case 4: return <CablingSection />;
      case 5: return <TopologySection />;
      case 6: return <CloudSection />;
      case 7: return <IPv4Section />;
      case 8: return <RoutingSection />;
      case 9: return <SwitchingSection />;
      case 10: return <WirelessSection />;
      case 11: return <><ServicesSection /><div style={{ marginTop: 20 }}><SectionHeader icon="🔐" title="Access & Management" subtitle="VPNs, remote access, and management methods." /><VPNAccessSection /></div></>;
      case 12: return <MonitoringSection />;
      case 13: return <DRSection />;
      case 14: return <SecuritySection />;
      case 15: return <AttacksSection />;
      case 16: return <SegmentationSection />;
      case 17: return <DocumentationSection />;
      case 18: return <LifecycleSection />;
      case 19: return <TroubleshootingSection />;
      case 20: return <NetworkLabSection />;
      case 21: return <PacketDeepDive />;
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0",
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", display: "flex", flexDirection: "column"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(135deg, rgba(0,229,255,0.04) 0%, rgba(139,92,246,0.04) 100%)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, flexWrap: "wrap", gap: 10
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Space Mono', monospace", color: "#00e5ff", letterSpacing: -0.5 }}>
            NET<span style={{ color: "#a78bfa" }}>+</span> INTERACTIVE
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>CompTIA Network+ Study Lab — N10-009</div>
        </div>
        <button onClick={() => setQuizMode(!quizMode)} style={{
          padding: "8px 20px", borderRadius: 8,
          border: quizMode ? "1px solid #ef4444" : "1px solid #00e5ff",
          background: quizMode ? "#ef444418" : "#00e5ff18",
          color: quizMode ? "#ef4444" : "#00e5ff",
          cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace"
        }}>{quizMode ? "✕ Exit Quiz" : "🧪 Quiz Mode"}</button>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Sidebar */}
        {!quizMode && (
          <div style={{
            width: 220, minWidth: 220, borderRight: "1px solid rgba(255,255,255,0.06)",
            overflowY: "auto", padding: "12px 8px", flexShrink: 0, background: "rgba(0,0,0,0.15)"
          }}>
            {ALL_SECTIONS.map((s, i) => (
              <div key={i} onClick={() => setSection(i)} style={{
                padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: section === i ? "rgba(0,229,255,0.1)" : "transparent",
                borderLeft: section === i ? "3px solid #00e5ff" : "3px solid transparent",
                transition: "all 0.15s", fontSize: 12, color: section === i ? "#00e5ff" : "#64748b",
                fontWeight: section === i ? 600 : 400, fontFamily: "'JetBrains Mono', monospace",
                display: "flex", alignItems: "center", gap: 8
              }}
              onMouseEnter={e => { if (section !== i) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (section !== i) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 14 }}>{SECTION_ICONS[i]}</span> {s}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          style={
            section === 20 && !quizMode
              ? { flex: 1, minHeight: 0, overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }
              : { flex: 1, overflowY: "auto", padding: "24px 28px" }
          }
        >
          {renderSection()}
        </div>
      </div>
    </div>
  );
}