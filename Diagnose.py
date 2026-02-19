#!/usr/bin/env python3
"""
Adaptive Firewall - Diagnostic Tool
Run: sudo python3 diagnose.py
This will tell you EXACTLY what's wrong.
"""
import os, sys, subprocess, time, threading

print("""
╔══════════════════════════════════════════════╗
║   ADAPTIVE FIREWALL - DIAGNOSTICS           ║
╚══════════════════════════════════════════════╝
""")

# ── Check 1: Root ─────────────────────────────
print("[1] Checking root access...")
if os.geteuid() != 0:
    print("    ❌ NOT root. Run: sudo python3 diagnose.py")
    sys.exit(1)
print("    ✅ Running as root")

# ── Check 2: Dependencies ─────────────────────
print("\n[2] Checking Python dependencies...")
missing = []
for pkg in ["scapy", "sklearn", "flask", "flask_socketio", "numpy"]:
    try:
        __import__(pkg)
        print(f"    ✅ {pkg}")
    except ImportError:
        print(f"    ❌ {pkg} MISSING")
        missing.append(pkg)

if missing:
    print(f"\n    Fix: pip install scapy scikit-learn flask flask-socketio numpy --break-system-packages")
    sys.exit(1)

from scapy.all import sniff, IP, TCP, UDP, ICMP, conf, get_if_list
conf.verb = 0

# ── Check 3: Interfaces ───────────────────────
print("\n[3] Checking network interfaces...")
ifaces = get_if_list()
print(f"    Available: {ifaces}")
has_lo = "lo" in ifaces
print(f"    Loopback (lo): {'✅ present' if has_lo else '❌ NOT FOUND — hping3 127.0.0.1 will not be captured!'}")

# ── Check 4: hping3 ───────────────────────────
print("\n[4] Checking hping3...")
r = subprocess.run(["which", "hping3"], capture_output=True, text=True)
if r.returncode == 0:
    print(f"    ✅ Found at {r.stdout.strip()}")
else:
    print("    ❌ hping3 not found. Install: apt install hping3")

# ── Check 5: iptables ─────────────────────────
print("\n[5] Checking iptables...")
r = subprocess.run(["iptables", "-L", "INPUT", "-n"], capture_output=True, text=True)
if r.returncode == 0:
    print("    ✅ iptables working")
    lines = [l for l in r.stdout.splitlines() if "DROP" in l]
    if lines:
        print(f"    ⚠️  Existing DROP rules found:")
        for l in lines:
            print(f"       {l}")
        print("    → These may be blocking your test traffic already!")
        ans = input("    Flush them now? (y/n): ").strip().lower()
        if ans == "y":
            subprocess.run(["iptables", "-F", "INPUT"])
            subprocess.run(["iptables", "-F", "OUTPUT"])
            print("    ✅ Flushed")
else:
    print(f"    ❌ iptables error: {r.stderr.strip()}")

# ── Check 6: Live packet capture test ─────────
print("\n[6] Live packet capture test (10 seconds)...")
print("    Listening on ALL interfaces for any IP packet...")
print("    → Run this in another terminal: sudo hping3 --flood -U 127.0.0.1")
print("    → Or just ping: ping -c 5 127.0.0.1\n")

captured = []
stop_flag = threading.Event()

def handler(pkt):
    if IP in pkt:
        src = pkt[IP].src
        proto = pkt[IP].proto
        ptype = "TCP" if TCP in pkt else "UDP" if UDP in pkt else "ICMP" if ICMP in pkt else f"proto={proto}"
        captured.append((src, ptype))
        if len(captured) <= 5:  # Only print first 5
            print(f"    📦 CAPTURED: {src} → {ptype}")

def run_sniff():
    try:
        # Try sniffing all interfaces
        sniff(iface=None, filter="ip", prn=handler, timeout=10, store=False)
    except Exception as e:
        print(f"    ❌ Sniff error: {e}")

t = threading.Thread(target=run_sniff)
t.start()
t.join(timeout=11)

if not captured:
    print("\n    ❌ NO PACKETS CAPTURED in 10 seconds!")
    print("    Possible causes:")
    print("      a) No traffic was generated during the test")
    print("      b) Scapy cannot capture on loopback on this system")
    print("    → Try: sudo tcpdump -i lo -c 5 'ip' in another terminal to verify loopback is active")
    print("    → If tcpdump works but scapy doesn't, use the tcpdump-based version below")
else:
    unique_ips = set(x[0] for x in captured)
    print(f"\n    ✅ Captured {len(captured)} packets from {len(unique_ips)} unique IPs: {unique_ips}")
    lo_seen = "127.0.0.1" in unique_ips
    print(f"    Loopback (127.0.0.1) seen: {'✅ YES' if lo_seen else '❌ NO — scapy may not capture lo on your kernel'}")
    if not lo_seen:
        print("    → hping3 --flood 127.0.0.1 won't be detected by scapy sniff(iface=None)")
        print("    → Use the FIXED version below that uses tcpdump + subprocess instead")

# ── Check 7: tcpdump fallback ─────────────────
print("\n[7] Checking tcpdump (fallback packet capture)...")
r = subprocess.run(["which", "tcpdump"], capture_output=True, text=True)
if r.returncode == 0:
    print(f"    ✅ tcpdump found at {r.stdout.strip()}")
    print("    → tcpdump CAN reliably capture loopback traffic")
    print("    → The fixed firewall_engine_v3.py uses tcpdump as fallback")
else:
    print("    ❌ tcpdump not found. Install: apt install tcpdump")

# ── Summary ───────────────────────────────────
print("""
╔══════════════════════════════════════════════╗
║   DIAGNOSIS COMPLETE                        ║
╚══════════════════════════════════════════════╝

IMPORTANT FINDING:
  hping3 --flood -U 127.0.0.1 sends packets on the LOOPBACK
  interface (lo). Scapy's sniff() sometimes cannot capture
  loopback packets on Kali depending on kernel/libpcap version.

SOLUTIONS (try in order):
  1. Test with a REAL IP instead of localhost:
       sudo hping3 --flood -U <your-eth0-IP>
       (find it with: ip a | grep inet)

  2. If you must test 127.0.0.1, run the v3 engine which uses
     tcpdump subprocess for reliable loopback capture.

  3. Check if your interface is eth0 or something else:
       ip route | grep default
     Then edit CONFIG['interfaces'] in firewall_engine.py
""")
