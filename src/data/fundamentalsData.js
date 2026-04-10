export const OSI_LAYERS = [
  {
    num: 7,
    name: "Application",
    color: "#E74C3C",
    pdu: "Data",
    protocols: ["HTTP", "HTTPS", "FTP", "SFTP", "SSH", "DNS", "DHCP", "SMTP", "SNMP", "LDAP", "RDP", "SIP", "Telnet", "NTP", "PTP"],
    devices: ["Proxy", "Load Balancer", "WAF", "IDS/IPS"],
    desc: "End-user services & APIs. Where applications access network services.",
    detail: "Provides network services directly to end-user applications. Identifies communication partners, determines resource availability, and synchronizes communication. Protocols here define how applications talk over the network.",
  },
  {
    num: 6,
    name: "Presentation",
    color: "#E67E22",
    pdu: "Data",
    protocols: ["SSL/TLS", "JPEG", "GIF", "MPEG", "ASCII", "EBCDIC"],
    devices: [],
    desc: "Data formatting, encryption, compression.",
    detail: "Translates data between the application and network format. Handles encryption/decryption (SSL/TLS), compression, and character encoding. Ensures data from the application layer of one system can be read by the application layer of another.",
  },
  {
    num: 5,
    name: "Session",
    color: "#F1C40F",
    pdu: "Data",
    protocols: ["NetBIOS", "PPTP", "RPC", "SIP", "SAP"],
    devices: [],
    desc: "Establishes, manages, and terminates sessions.",
    detail: "Controls dialogues (connections) between computers. Establishes, manages, and terminates connections between local and remote application. Manages session checkpointing and recovery. Full-duplex, half-duplex, and simplex communication.",
  },
  {
    num: 4,
    name: "Transport",
    color: "#2ECC71",
    pdu: "Segment / Datagram",
    protocols: ["TCP (port-based)", "UDP (port-based)"],
    devices: ["Firewall", "Load Balancer"],
    desc: "End-to-end delivery, flow control, error recovery.",
    detail: "Provides reliable (TCP) or unreliable (UDP) end-to-end data transfer. TCP uses 3-way handshake (SYN, SYN-ACK, ACK), flow control (windowing), and error correction. UDP is connectionless — faster but no guaranteed delivery. Segmentation and reassembly of data.",
  },
  {
    num: 3,
    name: "Network",
    color: "#3498DB",
    pdu: "Packet",
    protocols: ["IP (v4/v6)", "ICMP", "IGMP", "IPSec", "OSPF", "BGP", "EIGRP", "RIP"],
    devices: ["Router", "L3 Switch", "Firewall"],
    desc: "Logical addressing (IP), routing, path determination.",
    detail: "Handles logical addressing (IP addresses) and routing. Routers operate here to forward packets between networks. Determines the best path via routing protocols (OSPF, BGP, EIGRP). Fragmentation and reassembly of packets when needed.",
  },
  {
    num: 2,
    name: "Data Link",
    color: "#9B59B6",
    pdu: "Frame",
    protocols: ["Ethernet (802.3)", "Wi-Fi (802.11)", "PPP", "ARP", "STP", "LLDP", "CDP"],
    devices: ["Switch", "Bridge", "WAP", "NIC"],
    desc: "Physical addressing (MAC), framing, error detection.",
    detail: "Divided into LLC (Logical Link Control) and MAC (Media Access Control) sublayers. Uses MAC addresses for local delivery. Switches build MAC address tables. Handles frame creation, error detection (FCS/CRC), and flow control. Spanning Tree Protocol (STP) prevents loops.",
  },
  {
    num: 1,
    name: "Physical",
    color: "#1ABC9C",
    pdu: "Bits",
    protocols: ["Ethernet physical", "RS-232", "DSL", "ISDN", "802.11 radio"],
    devices: ["Hub", "Repeater", "Media Converter", "Modem", "Cables"],
    desc: "Bit transmission over physical media (electrical, optical, radio).",
    detail: "Defines electrical, mechanical, and functional specifications. Deals with voltages, pin layouts, cabling, radio frequencies. Converts bits to signals (electrical, optical, or RF). Includes cable types: Cat5e/6/6a/7/8, fiber optic (SMF/MMF), coax.",
  },
];

/** Lab device `type` string → APPLIANCES `id` when the deep dive is shared */
export const LAB_TYPE_TO_APPLIANCE_ID = {
  router: "router",
  switch: "switch_l2",
  l3switch: "switch_l3",
  firewall: "firewall",
  ids: "ids_ips",
  lb: "load_balancer",
  wap: "wireless_ap",
};

export const APPLIANCES = [
  {
    id: "router",
    name: "Router",
    layer: "3",
    icon: "🔀",
    desc: "Forwards packets between networks using IP addresses. Makes routing decisions based on routing tables populated by static routes or dynamic protocols (OSPF, BGP, EIGRP).",
    features: ["NAT/PAT", "ACLs", "Inter-VLAN routing", "Subinterfaces", "Policy-based routing", "FHRP (HSRP/VRRP/GLBP)"],
    deepDive: {
      sections: [
        {
          title: "What a router actually does",
          body:
            "A router connects IP subnets (broadcast domains). It receives a frame on an interface, strips to the packet, looks at the destination IP, finds the longest-prefix match in its routing table (RIB), decrements TTL, recomputes the IP checksum, re-encapsulates into a new frame for the outbound interface, and uses ARP (or neighbor discovery) to learn the next-hop MAC.\n\nRouters do not forward broadcasts — that is why ARP and DHCP broadcasts stay on one VLAN unless you add a helper (DHCP relay) or route specific traffic.",
        },
        {
          title: "Routing table & next hop",
          body: [
            "Each route = destination prefix, prefix length, next-hop IP or outgoing interface, administrative distance (trust), and metric (cost).",
            "More specific (longer) prefix wins over shorter prefix for the same destination.",
            "Static routes: manual; default route (0.0.0.0/0) catches “everything else” toward the internet.",
            "Dynamic protocols (OSPF, EIGRP, BGP, RIP) exchange prefixes with neighbors; BGP is the internet’s inter-domain routing protocol.",
          ],
        },
        {
          title: "NAT and the exam",
          body:
            "NAT/PAT translates private↔public addresses at a boundary router or firewall. Inside local = real private IP on the LAN; inside global = public IP used after translation; outside global = public destination. PAT overload maps many inside hosts to one public IP using different source ports. Remember: NAT breaks end-to-end transparency — some protocols need ALGs or static mappings.",
        },
        {
          title: "Inter-VLAN routing",
          body:
            "Each VLAN is a separate subnet. Traffic between VLANs must be routed (router-on-a-stick with subinterfaces, SVI on an L3 switch, or dedicated L3 links). “Router-on-a-stick” uses one physical trunk carrying multiple VLAN tags (802.1Q) to subinterfaces.",
        },
      ],
      diagram: {
        type: "ascii",
        lines: [
          "  [ VLAN10: 192.168.10.0/24 ]     [ VLAN20: 192.168.20.0/24 ]",
          "           |                                |",
          "      +----+----+                        +----+----+",
          "      |  Host A |                        |  Host B |",
          "      +---------+                        +---------+",
          "           |                                |",
          "      ------+----  L2 switch  -------+-------",
          "                    | trunk .1Q",
          "              +-----+-----+",
          "              |  Router  |  ← forwards 10.x ↔ 20.x by IP",
          "              +-----+-----+",
          "                    |",
          "              (other networks / WAN)",
        ],
      },
      resources: [
        { label: "IANA — IPv4 private address space", href: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml" },
        { label: "Wikipedia — Network address translation", href: "https://en.wikipedia.org/wiki/Network_address_translation" },
        { label: "Wikipedia — IP forwarding", href: "https://en.wikipedia.org/wiki/IP_forwarding" },
      ],
    },
  },
  {
    id: "switch_l2",
    name: "Switch (L2)",
    layer: "2",
    icon: "🔲",
    desc: "Forwards frames based on MAC address table (CAM table). Creates separate collision domains per port. All ports are in the same broadcast domain unless VLANs are configured.",
    features: ["VLANs", "Trunk ports (802.1Q)", "STP/RSTP", "Port security", "PoE (802.3af/at/bt)", "LLDP/CDP", "Jumbo frames (9000+ MTU)"],
    deepDive: {
      sections: [
        {
          title: "Learning & forwarding",
          body:
            "A switch learns source MAC addresses from incoming frames and records (MAC → port, VLAN) in the CAM table. Unknown unicast is flooded (sent out all ports in the VLAN except the ingress). Known unicast is forwarded only to the correct port. Multicast may be flooded or snooped (IGMP) depending on config.",
        },
        {
          title: "VLANs & trunks",
          body: [
            "Access ports belong to one VLAN; frames are untagged on the wire to the end device.",
            "Trunk ports carry multiple VLANs using 802.1Q tags; native VLAN frames are untagged on the trunk — native mismatch is a classic exam/troubleshooting topic.",
            "SVI (Switch Virtual Interface) is an L3 interface for a VLAN on an L3 switch — not used for pure L2 forwarding.",
          ],
        },
        {
          title: "STP / RSTP",
          body:
            "Spanning Tree blocks redundant links to prevent loops. One root bridge; each segment has a designated port; blocked ports do not forward user frames but still pass BPDUs. RSTP converges faster than legacy STP. PortFast on access ports, BPDU Guard to err-disable if a switch is plugged into an access port.",
        },
      ],
      diagram: {
        type: "frameDiagram",
        title: "Ethernet frame (concept)",
        compact: true,
        fields: [
          { key: "dst", label: "Dest MAC", value: "aa:bb:cc:dd:ee:ff", color: "#9B59B6" },
          { key: "src", label: "Src MAC", value: "11:22:33:44:55:66", color: "#3498DB" },
          { key: "vlan", label: "802.1Q VLAN", value: "10", color: "#2ECC71", bits: "on trunk" },
          { key: "etype", label: "EtherType", value: "0x0800 (IPv4)", color: "#E67E22" },
          { key: "payload", label: "Payload", value: "IP packet…", color: "#95A5A6" },
          { key: "fcs", label: "FCS", value: "CRC", color: "#1ABC9C" },
        ],
      },
      resources: [
        { label: "IEEE 802.1Q overview", href: "https://en.wikipedia.org/wiki/IEEE_802.1Q" },
        { label: "Wikipedia — Spanning Tree Protocol", href: "https://en.wikipedia.org/wiki/Spanning_Tree_Protocol" },
      ],
    },
  },
  {
    id: "switch_l3",
    name: "Switch (L3)",
    layer: "2-3",
    icon: "🔳",
    desc: "Combines switching and routing. Can route between VLANs using SVIs (Switch Virtual Interfaces) without an external router.",
    features: ["Inter-VLAN routing", "SVIs", "Static & dynamic routing", "ACLs", "QoS", "DHCP relay"],
    deepDive: {
      sections: [
        {
          title: "Why L3 switches exist",
          body:
            "Inter-VLAN routing at wire speed in hardware ASICs scales better than router-on-a-stick for campus and data-center east-west traffic. You still configure IP addresses on SVIs (one per VLAN that needs a gateway), enable routing (`ip routing` on many platforms), and point hosts at the SVI IP as their default gateway.",
        },
        {
          title: "DHCP relay (ip helper)",
          body:
            "DHCP Discover/Offer are broadcast. A router or L3 switch with DHCP relay forwards those broadcasts as unicast to a remote DHCP server, inserting the gateway (giaddr) so the server knows which scope to use. Essential when DHCP and clients are on different subnets.",
        },
        {
          title: "Compared to a router",
          body: [
            "L3 switch: optimized for many VLANs, high throughput, often limited WAN features.",
            "Router: richer WAN interfaces (serial, cellular, advanced NAT/VPN).",
            "Many designs use L3 switches at the core/distribution and routers at the edge.",
          ],
        },
      ],
      resources: [
        { label: "RFC 2131 — DHCP", href: "https://www.rfc-editor.org/rfc/rfc2131" },
        { label: "Wikipedia — Multilayer switch", href: "https://en.wikipedia.org/wiki/Multilayer_switch" },
      ],
    },
  },
  {
    id: "firewall",
    name: "Firewall",
    layer: "3-7",
    icon: "🛡️",
    desc: "Filters traffic based on rules. Stateful firewalls track connection state. Next-gen firewalls (NGFW) inspect at L7 for application awareness.",
    features: ["Stateful inspection", "ACLs", "NAT", "VPN termination", "Zone-based policies", "URL/content filtering", "Trusted/untrusted zones", "Screened subnet (DMZ)"],
    deepDive: {
      sections: [
        {
          title: "Stateful vs stateless",
          body:
            "Stateless ACLs match individual packets (5-tuple: src/dst IP, ports, protocol). Stateful firewalls track flows: after a permitted TCP SYN, return traffic matching that flow is allowed automatically. The implicit deny at the end of ACLs still applies — first match wins, top to bottom.",
        },
        {
          title: "Zones & DMZ",
          body: [
            "Zone-based policy ties rules to interfaces grouped as zones (e.g. inside, outside, DMZ) instead of only interface pairs.",
            "DMZ (screened subnet) hosts public services; firewall rules limit which ports can reach internal networks.",
            "NAT often hides internal structure; public servers may use static NAT or one-to-one mappings.",
          ],
        },
        {
          title: "NGFW & UTM",
          body:
            "Next-gen firewalls identify applications (L7), integrate IPS, URL filtering, and sometimes sandboxing. For Network+: know the purpose (block malware, enforce policy) and that deeper inspection increases CPU/latency.",
        },
      ],
      diagram: {
        type: "ascii",
        lines: [
          "   [ Inside LAN ]     [   DMZ   ]     [ Internet ]",
          "        |                  |               |",
          "        +--------+---------+---------+-----+",
          "                 |  Firewall  |",
          "                 +------------+",
          "   Policies: inside→DMZ limited, DMZ→inside denied,",
          "   inside→internet allowed + NAT, outside→DMZ only to public ports",
        ],
      },
      resources: [
        { label: "NIST — Firewall guidelines (SP 800-41 rev 1)", href: "https://csrc.nist.gov/publications/detail/sp/800-41/rev-1/final" },
        { label: "Wikipedia — Stateful firewall", href: "https://en.wikipedia.org/wiki/Stateful_firewall" },
      ],
    },
  },
  {
    id: "ids_ips",
    name: "IDS/IPS",
    layer: "3-7",
    icon: "🔍",
    desc: "IDS (Intrusion Detection System) monitors & alerts. IPS (Intrusion Prevention System) monitors & blocks. Can be signature-based or anomaly-based.",
    features: ["Signature-based detection", "Anomaly-based detection", "Inline (IPS) vs passive (IDS)", "Log generation", "SNMP alerts", "Integration with SIEM"],
    deepDive: {
      sections: [
        {
          title: "IDS vs IPS placement",
          body:
            "IDS is typically passive (span port, TAP, or mirrored traffic): detects suspicious activity and alerts but cannot block inline. IPS sits in the traffic path (inline): can drop malicious packets or reset TCP sessions. Inline placement can affect latency and availability — bypass or fail-open modes matter for operations.",
        },
        {
          title: "Detection methods",
          body: [
            "Signature-based: matches known attack patterns (fast, misses zero-days).",
            "Anomaly/heuristic: baseline normal behavior, alert on deviation (more false positives).",
            "Reputation/blocklists: drop traffic to known-bad IPs or domains.",
          ],
        },
        {
          title: "SIEM correlation",
          body:
            "IDS/IPS logs feed SIEM (Security Information and Event Management) for correlation with firewall, auth, and endpoint logs. For exams: know IDS alerts, IPS blocks, and that tuning reduces noise.",
        },
      ],
      resources: [
        { label: "Wikipedia — Intrusion detection system", href: "https://en.wikipedia.org/wiki/Intrusion_detection_system" },
        { label: "Wikipedia — Intrusion prevention system", href: "https://en.wikipedia.org/wiki/Intrusion_prevention_system" },
      ],
    },
  },
  {
    id: "load_balancer",
    name: "Load Balancer",
    layer: "4-7",
    icon: "⚖️",
    desc: "Distributes traffic across servers for availability and performance. Uses VIPs (Virtual IPs). Algorithms: round-robin, least connections, weighted, IP hash.",
    features: ["VIP (Virtual IP)", "Health checks", "SSL offloading", "Session persistence", "Active-active / active-passive", "L4 vs L7 balancing"],
    deepDive: {
      sections: [
        {
          title: "L4 vs L7 balancing",
          body:
            "L4 (transport) balances based on IP/port — fast, agnostic to HTTP content. L7 (application) can route by URL, host header, or TLS SNI; enables content-aware policies and caching but is more CPU-intensive.",
        },
        {
          title: "Health checks & persistence",
          body: [
            "Health checks remove failed backends from the pool (HTTP GET, TCP connect, custom).",
            "Persistence (stickiness) sends the same client to the same server when apps need local session state — cookie-based or source-IP hash.",
            "SSL offloading terminates TLS on the LB, reducing server CPU; re-encrypt to backend optional.",
          ],
        },
      ],
      diagram: {
        type: "ascii",
        lines: [
          "        Clients",
          "           |",
          "      +-----+-----+",
          "      | VIP :443 |  ← one public IP / DNS name",
          "      +-----+-----+",
          "       /    |    \\",
          "      v     v     v",
          "   [Web1][Web2][Web3]   health: HTTP 200 on /health",
        ],
      },
      resources: [
        { label: "Wikipedia — Load balancing (computing)", href: "https://en.wikipedia.org/wiki/Load_balancing_(computing)" },
        { label: "IETF — TLS SNI (RFC 6066)", href: "https://www.rfc-editor.org/rfc/rfc6066" },
      ],
    },
  },
  {
    id: "proxy",
    name: "Proxy",
    layer: "7",
    icon: "🔄",
    desc: "Acts as intermediary for requests. Forward proxy serves clients; reverse proxy serves servers. Caches content, provides anonymity, enforces policies.",
    features: ["Forward proxy", "Reverse proxy", "Content caching", "URL filtering", "SSL inspection", "Authentication"],
    deepDive: {
      sections: [
        {
          title: "Forward vs reverse",
          body:
            "Forward proxy: clients are configured to send outbound web traffic through it; used for caching, URL filtering, and logging. Reverse proxy: sits in front of servers; clients connect to the proxy’s IP/DNS; proxy terminates connections and forwards to backend pools (often combined with load balancing).",
        },
        {
          title: "SSL inspection",
          body:
            "To inspect HTTPS, the proxy performs TLS man-in-the-middle with a corporate CA trusted by endpoints. Privacy and legal implications apply. Without inspection, the proxy only sees encrypted streams.",
        },
      ],
      resources: [
        { label: "Wikipedia — Proxy server", href: "https://en.wikipedia.org/wiki/Proxy_server" },
        { label: "Wikipedia — Reverse proxy", href: "https://en.wikipedia.org/wiki/Reverse_proxy" },
      ],
    },
  },
  {
    id: "nas",
    name: "NAS",
    layer: "N/A (storage)",
    icon: "💾",
    desc: "Network-Attached Storage — file-level storage accessible over the network using CIFS/SMB or NFS protocols. Appears as a shared folder.",
    features: ["File-level access", "CIFS/SMB & NFS", "RAID support", "User authentication", "Easy setup", "Shared folders"],
    deepDive: {
      sections: [
        {
          title: "File protocols",
          body:
            "SMB/CIFS is common in Windows environments (shares, permissions via ACLs). NFS is common in Linux/Unix. Both ride over TCP/IP; know they are file-level, not block-level — the NAS presents files and directories, not raw LUNs.",
        },
        {
          title: "Performance & redundancy",
          body: [
            "RAID on the appliance protects against disk failure; not a substitute for backups.",
            "Link aggregation and multi-path can improve throughput and resilience.",
            "Snapshots and replication support DR objectives (RPO/RTO).",
          ],
        },
      ],
      resources: [
        { label: "Microsoft — SMB protocol documentation", href: "https://learn.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview" },
        { label: "Wikipedia — Network-attached storage", href: "https://en.wikipedia.org/wiki/Network-attached_storage" },
      ],
    },
  },
  {
    id: "san",
    name: "SAN",
    layer: "N/A (storage)",
    icon: "🗄️",
    desc: "Storage Area Network — block-level storage accessed via dedicated high-speed network (Fibre Channel or iSCSI). Appears as a local disk to the server.",
    features: ["Block-level access", "Fibre Channel / iSCSI / FCoE", "High performance", "LUN masking/zoning", "Dedicated storage network", "Used for databases & VMs"],
    deepDive: {
      sections: [
        {
          title: "Block vs file",
          body:
            "SAN presents block devices (LUNs) over Fibre Channel, iSCSI, or FCoE. The server OS formats the disk and runs its own filesystem. Contrast with NAS: file protocols (SMB/NFS) where the array owns the filesystem.",
        },
        {
          title: "Zoning & masking",
          body: [
            "Fibre Channel zoning limits which HBAs can see which storage ports (like VLANs for SAN).",
            "LUN masking restricts which initiators can access which LUNs on the array.",
            "Together they enforce least-privilege access to storage.",
          ],
        },
      ],
      resources: [
        { label: "Wikipedia — Storage area network", href: "https://en.wikipedia.org/wiki/Storage_area_network" },
        { label: "Wikipedia — iSCSI", href: "https://en.wikipedia.org/wiki/ISCSI" },
      ],
    },
  },
  {
    id: "wireless_ap",
    name: "Wireless AP",
    layer: "1-2",
    icon: "📡",
    desc: "Wireless Access Point bridges wireless clients to the wired LAN. Operates at L1 (radio) and L2 (frames). Managed by a wireless controller in enterprise.",
    features: ["802.11a/b/g/n/ac/ax/be", "2.4/5/6 GHz bands", "SSID broadcasting", "WPA2/WPA3 encryption", "Antenna types (omni/directional/MIMO)", "Channel selection", "Guest networks", "802.1X authentication"],
    deepDive: {
      sections: [
        {
          title: "802.11 essentials",
          body:
            "Wi-Fi uses CSMA/CA (collision avoidance) because radios cannot full-duplex on the same channel like switched Ethernet. BSS = one AP + clients; ESS = multiple APs with the same SSID for roaming. CAPWAP tunnels lightweight AP traffic to a WLC in enterprise architectures.",
        },
        {
          title: "Security",
          body: [
            "Personal mode: PSK (passphrase). Enterprise: 802.1X + RADIUS per-user auth.",
            "WPA3 improves handshake security (SAE for personal) over WPA2.",
            "Guest SSIDs often map to a VLAN isolated from corporate resources.",
          ],
        },
      ],
      diagram: {
        type: "ascii",
        lines: [
          "   📱 clients        📶 802.11",
          "       \\              /",
          "        \\   BSS/ESS  /",
          "         +----------+",
          "         |    AP    |---- wired trunk / access",
          "         +----------+",
          "               |",
          "          [ Switch / LAN ]",
        ],
      },
      resources: [
        { label: "IEEE 802.11 (Wikipedia)", href: "https://en.wikipedia.org/wiki/IEEE_802.11" },
        { label: "Wi-Fi Alliance — WPA3", href: "https://www.wi-fi.org/discover-wi-fi/security" },
      ],
    },
  },
];

/** Deep dives for lab device types that are not listed in APPLIANCES */
export const LAB_DEVICE_DEEP_DIVE_MAP = {
  pc: {
    sections: [
      {
        title: "Role on the network",
        body:
          "A PC is an end host: it gets an IP via DHCP or static config, uses ARP to map gateway IP → MAC, sends frames to the default gateway for off-subnet traffic, and resolves names via DNS. Troubleshooting usually starts at L1 (link), then IP, mask, gateway, DNS.",
      },
      {
        title: "What to remember for Network+",
        body: [
          "`ipconfig` / `ip addr` — address, mask, gateway.",
          "`ping` — reachability; `tracert` / `traceroute` — path.",
          "APIPA 169.254.x.x means DHCP failed (no manual address).",
        ],
      },
    ],
    resources: [
      { label: "Microsoft — ipconfig", href: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig" },
    ],
  },
  laptop: {
    sections: [
      {
        title: "Wired and wireless",
        body:
          "Laptops often use Wi-Fi (association to SSID, WPA2/WPA3, DHCP) or Ethernet. The same IP logic applies: subnet, gateway, DNS. Roaming between APs is handled at L2/L3 with the same SSID (ESS). VPN client software adds a virtual interface for split or full tunnel.",
      },
    ],
    resources: [{ label: "Wikipedia — Wi-Fi", href: "https://en.wikipedia.org/wiki/Wi-Fi" }],
  },
  server: {
    sections: [
      {
        title: "Server as a network participant",
        body:
          "Servers listen on well-known or configured ports (TCP/UDP). They may have multiple NICs for redundancy (teaming/bonding) or segmentation (DMZ vs internal). Static IPs are common. Firewalls and host-based firewalls restrict who can reach which service.",
      },
      {
        title: "Services you will see on exams",
        body: [
          "DNS — UDP/TCP 53; DHCP — server 67, client 68.",
          "HTTP/HTTPS — 80/443; SMTP — 25/587; SMB — 445.",
          "Always pair service with transport protocol when studying.",
        ],
      },
    ],
    resources: [{ label: "IANA — Service name and port registry", href: "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml" }],
  },
  internet: {
    sections: [
      {
        title: "What “the internet” means in diagrams",
        body:
          "In topology drawings the cloud represents multiple autonomous systems, BGP routing, ISP edge devices, and transit/peering — abstracted away. Your edge router or firewall typically has a public IP (or provider-assigned block) and uses a default route toward the ISP.",
      },
      {
        title: "BGP in one sentence",
        body: "Between organizations, BGP exchanges prefix reachability; it is a path-vector protocol (AS path), not a link-state IGP like OSPF.",
      },
    ],
    resources: [
      { label: "Wikipedia — Border Gateway Protocol", href: "https://en.wikipedia.org/wiki/Border_Gateway_Protocol" },
    ],
  },
  dhcp: {
    sections: [
      {
        title: "DORA",
        body:
          "DHCP uses Discover (broadcast), Offer, Request, and Acknowledge. The server assigns lease time, IP, mask, gateway (option 3), DNS (option 6), and possibly domain name (option 15). Relay agent forwards broadcasts to a remote DHCP server with giaddr set.",
      },
    ],
    diagram: {
      type: "ascii",
      lines: [
        "Client          Server",
        "   |-- Discover ->|",
        "   |<- Offer -----|",
        "   |-- Request -->|",
        "   |<- ACK -------|",
      ],
    },
    resources: [{ label: "RFC 2131 — DHCP", href: "https://www.rfc-editor.org/rfc/rfc2131" }],
  },
  dns: {
    sections: [
      {
        title: "Resolution flow",
        body:
          "Stub resolver on the host queries a recursive resolver (your DNS server). The resolver iterates: root → TLD → authoritative servers until it gets the answer. A records (IPv4), AAAA (IPv6), CNAME (alias), MX (mail). Negative caching and TTL reduce load.",
      },
      {
        title: "Ports & transport",
        body: "Most queries use UDP 53; TCP 53 for large responses and zone transfers. DNS over TLS/HTTPS exists for privacy but classic DNS is still exam-focused.",
      },
    ],
    resources: [
      { label: "IANA — DNS parameters", href: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml" },
      { label: "Wikipedia — Domain Name System", href: "https://en.wikipedia.org/wiki/Domain_Name_System" },
    ],
  },
};

export function getDeepDiveForLabDeviceType(type) {
  const aid = LAB_TYPE_TO_APPLIANCE_ID[type];
  if (aid) {
    const a = APPLIANCES.find((x) => x.id === aid);
    if (a?.deepDive) return a.deepDive;
  }
  return LAB_DEVICE_DEEP_DIVE_MAP[type] ?? null;
}
