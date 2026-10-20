# Diagram 7: Sandboxed Networking & Security Boundaries

```mermaid
graph LR
    subgraph Internet ["Public Internet / Outbound"]
        GitHub["GitHub (git clone / push)"]
        NPM["Package Registries (npm/pypi/cargo)"]
        AWSKMS["AWS KMS Service"]
        IMDS["AWS IMDS 169.254.169.254<br/>(KNOWN SECURITY GAP)"]
    end

    subgraph HostNet ["Host Network Namespace"]
        NAT["iptables POSTROUTING MASQUERADE"]
        Forward["iptables FORWARD ACCEPT"]
        Conntrack["Linux Conntrack Table<br/>(Flushed on switch)"]
        HostTAP["TAP Interface (192.168.127.1)"]
    end

    subgraph ControlPlane ["Control Plane Security"]
        KMSClient["Envelope Encryption (AES-256-GCM)"]
        PromptFilter["Trust Policy wrapUntrusted()"]
        ExfilFilter["Regex Filter: isSecretExfilShellCommand()"]
    end

    subgraph GuestSandbox ["Guest MicroVM (192.168.127.8)"]
        GuestDNS["/etc/resolv.conf (8.8.8.8, 1.1.1.1)"]
        GuestProcess["Guest Subprocess Group"]
        NoCgroup["No cgroups v2 kill<br/>(KNOWN SECURITY GAP)"]
    end

    KMSClient -->|"Decrypts token"| ControlPlane
    ControlPlane -->|"Injects via X-Runtime-Env"| HostTAP
    PromptFilter -->|"Sanitizes user input"| ControlPlane
    ExfilFilter -->|"Blocks printenv/env in shell"| ControlPlane

    GuestProcess -->|"Outbound requests"| GuestDNS
    GuestDNS -->|"Default route"| HostTAP
    HostTAP --> Forward
    Forward --> NAT
    NAT --> GitHub
    NAT --> NPM
    NAT -.->|"Unfiltered Egress"| IMDS
```

---

### Network Architecture & Threat Model Explanation

A detailed topology of network isolation, host iptables NAT rules, CNI configuration, envelope encryption for tokens via AWS KMS, prompt exfiltration blockers, and explicit callouts of known security gaps (lack of cgroups v2 kill and unprotected AWS IMDS endpoint).

---

### What to Say While Showing This

- *"Networking in Devin balances internet access for package managers with tenant isolation."*
- *"The guest connects through a TAP interface bridged via CNI plugins with iptables NAT masquerading."*
- *"OAuth tokens are encrypted using AES-256-GCM envelope encryption with AWS KMS. The plaintext token is only passed to git operations inside the sandbox via ephemeral headers."*
- *"Here are two crucial gaps you must understand: currently, the guest lacks cgroups v2 process grouping, so orphan fork bombs are possible. Additionally, outbound HTTP does not block AWS IMDS at 169.254.169.254 — a critical hardening step before multi-tenant production."*
