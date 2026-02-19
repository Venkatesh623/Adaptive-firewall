#!/bin/bash
# Adaptive Firewall System - Setup Script for Kali Linux
# Run: chmod +x setup.sh && sudo ./setup.sh

set -e

echo "╔══════════════════════════════════════════╗"
echo "║   Adaptive Firewall System - Setup       ║"
echo "╚══════════════════════════════════════════╝"

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "[!] Please run as root: sudo ./setup.sh"
  exit 1
fi

echo "[*] Updating package list..."
apt-get update -q

echo "[*] Installing system dependencies..."
apt-get install -y python3-pip python3-venv iptables tcpdump libpcap-dev

echo "[*] Installing Python dependencies..."
pip3 install scapy scikit-learn flask flask-socketio numpy --break-system-packages

echo "[*] Setting up log directory..."
touch /var/log/adaptive_firewall.log
chmod 644 /var/log/adaptive_firewall.log

echo "[*] Detecting network interface..."
IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
if [ -n "$IFACE" ]; then
  echo "[+] Default interface detected: $IFACE"
  sed -i "s/\"interface\": \"eth0\"/\"interface\": \"$IFACE\"/" firewall_engine.py
  echo "[+] Updated firewall_engine.py to use interface: $IFACE"
else
  echo "[!] Could not auto-detect interface. Defaulting to eth0."
  echo "    Edit CONFIG['interface'] in firewall_engine.py if needed."
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Setup Complete!                        ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Start: sudo python3 firewall_engine.py  ║"
echo "║  Dashboard: http://localhost:5000         ║"
echo "║  Logs: /var/log/adaptive_firewall.log    ║"
echo "╚══════════════════════════════════════════╝"
