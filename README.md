# Adaptive Firewall System

An intelligent network security tool for Kali Linux.  
Uses machine learning (Isolation Forest) to detect and block anomalous traffic automatically.

---

## Quick Start

```bash
# 1. Clone / place all files in a folder
# 2. Run setup
chmod +x setup.sh
sudo ./setup.sh

# 3. Start the firewall
sudo python3 firewall_engine.py

# 4. Open dashboard
# Visit http://localhost:5000 in your browser
```

---

## File Structure

```
adaptive_firewall/
├── firewall_engine.py   ← Main engine (sniffing + ML + API)
├── dashboard.html       ← Web dashboard (auto-served)
├── setup.sh             ← One-time installer
└── README.md            ← This file
```

---

## How It Works

1. **Packet Capture** — Scapy sniffs all incoming packets on your interface.
2. **Feature Extraction** — Each packet is converted to a 6-feature numeric vector (TTL, length, protocol, ports, TCP flags).
3. **Training Phase** — The first 500 packets are used to train an Isolation Forest model.
4. **Detection Phase** — New packets are scored. IPs with consistently low scores (anomalous) are auto-blocked via `iptables`.
5. **Dashboard** — Real-time view of all IPs, scores, and alerts via browser.

---

## Configuration

Edit the `CONFIG` dict at the top of `firewall_engine.py`:

| Key | Default | Description |
|-----|---------|-------------|
| `interface` | `eth0` | Network interface to sniff |
| `block_threshold` | `-0.3` | Score below this triggers a block |
| `train_packets` | `500` | Packets to collect before ML activates |
| `whitelist` | `["127.0.0.1"]` | IPs that are never blocked |
| `dashboard_port` | `5000` | Port for the web dashboard |

---

## Dashboard Features

- **Live stats** — packets captured, threats blocked, blocked IPs
- **IP Reputation Table** — score and status for every tracked IP
- **Manual Block/Unblock** — type any IP and block or unblock instantly
- **Real-time Alerts** — pushed via WebSocket (no page refresh needed)
- **ML status indicator** — shows when the model is training vs. active

---

## Anomaly Score Guide

| Score | Meaning |
|-------|---------|
| > -0.2 | Clean — normal traffic |
| -0.2 to -0.4 | Suspicious — monitor |
| < -0.4 | High Risk — auto-blocked |

---

## Requirements

- Kali Linux (tested on 4.x+ kernel)
- Python 3.8+
- Root/sudo access
- Network interface with traffic

### Python packages
- `scapy` — packet capture
- `scikit-learn` — Isolation Forest ML
- `flask` + `flask-socketio` — web dashboard
- `numpy` — numeric arrays

---

## Troubleshooting

**No packets captured?**
- Check the interface name: `ip a` or `ifconfig`
- Update `CONFIG["interface"]` in `firewall_engine.py`

**iptables error?**
- Make sure you're running as root
- Check: `iptables -L INPUT -n`

**Dashboard not loading?**
- Make sure `dashboard.html` is in the same folder as `firewall_engine.py`
- Check port 5000 isn't in use: `ss -tlnp | grep 5000`

---

## Security Notes

- Always whitelist your own management IPs before running
- Test on a non-production network first
- The ML model improves with more training data — give it time
- Review blocked IPs regularly via the dashboard
