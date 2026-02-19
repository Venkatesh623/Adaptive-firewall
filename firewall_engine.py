#!/usr/bin/env python3
"""
Adaptive Firewall System - Engine v3
Uses tcpdump for reliable packet capture (works on loopback/all interfaces).
Run: sudo python3 firewall_engine_v3.py
"""

import os, sys, re, time, logging, threading, subprocess
from datetime import datetime
from collections import defaultdict

if os.geteuid() != 0:
    print("[!] Run as root: sudo python3 firewall_engine_v3.py")
    sys.exit(1)

try:
    from sklearn.ensemble import IsolationForest
    from flask import Flask, jsonify, request
    from flask_socketio import SocketIO
    import numpy as np
except ImportError as e:
    print(f"[!] Missing: {e}")
    print("Fix: pip install scikit-learn flask flask-socketio numpy --break-system-packages")
    sys.exit(1)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("/var/log/adaptive_firewall.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
CONFIG = {
    "flood_pps_threshold": 50,     # lower = more sensitive (hping3 flood >> 1000 pps)
    "flood_window_sec": 1,         # 1-second window for PPS calculation
    "train_packets": 80,
    "block_threshold": -0.2,
    "ml_window": 5,
    "whitelist": [],               # empty = block everything including 127.0.0.1
    "max_alerts": 200,
    "dashboard_port": 5000,
}

# ── State ─────────────────────────────────────────────────────────────────────
state = {
    "packets_captured": 0,
    "threats_blocked": 0,
    "alerts": [],
    "blocked_ips": set(),
    "ip_scores": defaultdict(list),
    "ip_packet_count": defaultdict(int),
    "ip_packet_times": defaultdict(list),
    "running": False,
    "model_trained": False,
    "training_data": [],
    "attack_types": defaultdict(int),
}
lock = threading.Lock()

model = IsolationForest(contamination=0.15, n_estimators=100, random_state=42)
model_lock = threading.Lock()


# ── Feature Extraction from tcpdump line ──────────────────────────────────────
# tcpdump -l -n -q output example:
#   13:04:01.123456 IP 127.0.0.1 > 127.0.0.1: tcp 0

TCPDUMP_RE = re.compile(
    r"IP\s+([\d\.]+)(?:\.(\d+))?\s*>\s*([\d\.]+)(?:\.(\d+))?:\s*(\w+)"
)

def parse_tcpdump_line(line):
    """
    Returns (src_ip, dst_ip, proto, sport, dport) or None.
    """
    m = TCPDUMP_RE.search(line)
    if not m:
        return None
    src_ip = m.group(1)
    sport  = int(m.group(2)) if m.group(2) else 0
    dst_ip = m.group(3)
    dport  = int(m.group(4)) if m.group(4) else 0
    proto  = m.group(5).upper()
    return src_ip, dst_ip, proto, sport, dport

def make_features(src_ip, dst_ip, proto, sport, dport):
    proto_num = {"TCP": 6, "UDP": 17, "ICMP": 1}.get(proto, 0)
    return [
        float(proto_num),
        float(sport),
        float(dport),
        float(hash(src_ip) % 65536),    # IP as pseudo-number
        float(hash(dst_ip) % 65536),
        float(sport == 0),              # 1 if no port (ICMP)
        float(dport < 1024),            # privileged port
        float(sport > 50000),           # ephemeral source port
    ]


# ── ML ────────────────────────────────────────────────────────────────────────
def train_model():
    with lock:
        data = list(state["training_data"])
    if len(data) < 10:
        return
    X = np.array(data)
    with model_lock:
        model.fit(X)
    with lock:
        state["model_trained"] = True
    log.info(f"[ML] ✅ Model trained on {len(data)} packets — anomaly detection LIVE.")

def score_features(features):
    with model_lock:
        return model.score_samples(np.array([features]))[0]


# ── Firewall ──────────────────────────────────────────────────────────────────
def block_ip(ip, reason="anomaly", attack_type="FLOOD"):
    if ip in CONFIG["whitelist"]:
        return
    with lock:
        if ip in state["blocked_ips"]:
            return
        state["blocked_ips"].add(ip)
        state["threats_blocked"] += 1
        state["attack_types"][attack_type] += 1

    for cmd in [
        ["iptables", "-I", "INPUT",  "1", "-s", ip, "-j", "DROP"],
        ["iptables", "-I", "OUTPUT", "1", "-d", ip, "-j", "DROP"],
    ]:
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode != 0:
            log.error(f"[iptables] {r.stderr.decode().strip()}")

    log.warning(f"[🔴 BLOCKED] {ip} | {attack_type} | {reason}")
    add_alert("BLOCK", ip, f"[{attack_type}] Auto-blocked: {reason}", attack_type)


def unblock_ip(ip):
    for cmd in [
        ["iptables", "-D", "INPUT",  "-s", ip, "-j", "DROP"],
        ["iptables", "-D", "OUTPUT", "-d", ip, "-j", "DROP"],
    ]:
        subprocess.run(cmd, capture_output=True)
    with lock:
        state["blocked_ips"].discard(ip)
    log.info(f"[🟢 UNBLOCKED] {ip}")
    add_alert("UNBLOCK", ip, f"{ip} manually unblocked.", "MANUAL")
    return True


def add_alert(atype, ip, msg, attack_type="INFO"):
    with lock:
        a = {
            "id": len(state["alerts"]),
            "type": atype,
            "attack_type": attack_type,
            "ip": ip,
            "message": msg,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        state["alerts"].insert(0, a)
        if len(state["alerts"]) > CONFIG["max_alerts"]:
            state["alerts"].pop()
    try:
        socketio.emit("new_alert", a)
    except Exception:
        pass


# ── Detection Logic ───────────────────────────────────────────────────────────
def process_packet(src_ip, dst_ip, proto, sport, dport):
    now = time.time()
    window = CONFIG["flood_window_sec"]

    with lock:
        state["packets_captured"] += 1
        state["ip_packet_count"][src_ip] += 1
        if src_ip in state["blocked_ips"]:
            return

        # Update packet times for PPS
        times = state["ip_packet_times"][src_ip]
        times = [t for t in times if now - t < window]
        times.append(now)
        state["ip_packet_times"][src_ip] = times
        pps = len(times) / window

    # ── LAYER 1: Flood detection (instant) ────────────────────────────────
    if pps >= CONFIG["flood_pps_threshold"]:
        if proto == "TCP":
            attack_type = "URG/SYN FLOOD"
        elif proto == "ICMP":
            attack_type = "ICMP FLOOD"
        elif proto == "UDP":
            attack_type = "UDP FLOOD"
        else:
            attack_type = "FLOOD"
        block_ip(src_ip,
                 reason=f"{pps:.0f} pkt/s (threshold: {CONFIG['flood_pps_threshold']})",
                 attack_type=attack_type)
        return

    # ── LAYER 2: ML anomaly detection ─────────────────────────────────────
    features = make_features(src_ip, dst_ip, proto, sport, dport)

    with lock:
        trained = state["model_trained"]
        if not trained:
            state["training_data"].append(features)
            count = len(state["training_data"])
        else:
            count = None

    if not trained:
        if count == CONFIG["train_packets"]:
            log.info(f"[ML] {count} packets collected — training...")
            threading.Thread(target=train_model, daemon=True).start()
        return

    score = score_features(features)
    with lock:
        state["ip_scores"][src_ip].append(score)
        recent = state["ip_scores"][src_ip][-CONFIG["ml_window"]:]
        avg = sum(recent) / len(recent)

    if avg < CONFIG["block_threshold"] and len(recent) >= 3:
        block_ip(src_ip,
                 reason=f"ML anomaly score {avg:.3f}",
                 attack_type="ML-ANOMALY")


# ── tcpdump Capture ───────────────────────────────────────────────────────────
def start_capture():
    """
    Use tcpdump to capture ALL interfaces including loopback.
    -l = line-buffered, -n = no DNS, -q = quiet one-liner per packet,
    -i any = ALL interfaces (lo, eth0, wlan0, etc.)
    """
    with lock:
        state["running"] = True

    cmd = [
        "tcpdump", "-l", "-n", "-q",
        "-i", "any",          # ALL interfaces — this is the key fix
        "ip",                 # only IPv4
    ]
    log.info(f"[*] Starting capture: {' '.join(cmd)}")
    log.info(f"[*] Flood threshold : {CONFIG['flood_pps_threshold']} pkt/s")
    log.info(f"[*] Dashboard       : http://localhost:{CONFIG['dashboard_port']}")
    log.info(f"[*] Ready! Run test : sudo hping3 --flood -U 127.0.0.1")

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            bufsize=1,
        )
        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            parsed = parse_tcpdump_line(line)
            if parsed:
                process_packet(*parsed)
    except Exception as e:
        log.error(f"[tcpdump ERROR] {e}")
    finally:
        with lock:
            state["running"] = False


# ── Flask API ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = "afs_v3"
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")


@app.route("/")
def index():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.html")
    try:
        return open(path).read()
    except FileNotFoundError:
        return "<h2>dashboard.html missing</h2>", 404


@app.route("/api/status")
def api_status():
    now = time.time()
    window = CONFIG["flood_window_sec"]
    with lock:
        ip_stats = {}
        for ip in list(state["ip_packet_count"].keys())[:100]:
            scores = state["ip_scores"].get(ip, [])
            rt = [t for t in state["ip_packet_times"].get(ip, []) if now - t < window]
            ip_stats[ip] = {
                "packets": state["ip_packet_count"][ip],
                "avg_score": round(sum(scores) / len(scores), 3) if scores else None,
                "pps": round(len(rt) / window, 1),
                "blocked": ip in state["blocked_ips"],
            }
        return jsonify({
            "packets_captured": state["packets_captured"],
            "threats_blocked": state["threats_blocked"],
            "model_trained": state["model_trained"],
            "training_progress": min(len(state["training_data"]), CONFIG["train_packets"]),
            "train_target": CONFIG["train_packets"],
            "running": state["running"],
            "blocked_ips": list(state["blocked_ips"]),
            "alerts": state["alerts"][:30],
            "attack_types": dict(state["attack_types"]),
            "ip_stats": ip_stats,
        })


@app.route("/api/block", methods=["POST"])
def api_block():
    ip = (request.json or {}).get("ip", "").strip()
    if not ip: return jsonify({"error": "No IP"}), 400
    block_ip(ip, reason="Manual via dashboard", attack_type="MANUAL")
    return jsonify({"success": True})


@app.route("/api/unblock", methods=["POST"])
def api_unblock():
    ip = (request.json or {}).get("ip", "").strip()
    if not ip: return jsonify({"error": "No IP"}), 400
    return jsonify({"success": unblock_ip(ip)})


@app.route("/api/config", methods=["POST"])
def api_config():
    data = request.json or {}
    if "flood_pps_threshold" in data:
        CONFIG["flood_pps_threshold"] = int(data["flood_pps_threshold"])
    if "block_threshold" in data:
        CONFIG["block_threshold"] = float(data["block_threshold"])
    log.info(f"[CONFIG] flood={CONFIG['flood_pps_threshold']} ml={CONFIG['block_threshold']}")
    return jsonify({"success": True})


@app.route("/api/clear_blocks", methods=["POST"])
def api_clear():
    subprocess.run(["iptables", "-F", "INPUT"],  capture_output=True)
    subprocess.run(["iptables", "-F", "OUTPUT"], capture_output=True)
    with lock:
        count = len(state["blocked_ips"])
        state["blocked_ips"].clear()
    add_alert("SYSTEM", "ALL", f"All rules flushed — {count} IPs released.", "RESET")
    return jsonify({"success": True, "cleared": count})


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║         ADAPTIVE FIREWALL SYSTEM  v3                     ║
║  Capture: tcpdump -i any  (ALL interfaces + loopback)    ║
║  Layer 1: Flood rate detection  → instant block          ║
║  Layer 2: ML Isolation Forest   → pattern block          ║
╚══════════════════════════════════════════════════════════╝
""")
    # Verify tcpdump
    if subprocess.run(["which", "tcpdump"], capture_output=True).returncode != 0:
        log.error("[!] tcpdump not found. Install: apt install tcpdump")
        sys.exit(1)
    if subprocess.run(["which", "iptables"], capture_output=True).returncode != 0:
        log.error("[!] iptables not found. Install: apt install iptables")
        sys.exit(1)

    # Clear old rules first
    subprocess.run(["iptables", "-F", "INPUT"],  capture_output=True)
    subprocess.run(["iptables", "-F", "OUTPUT"], capture_output=True)
    log.info("[*] Cleared existing iptables rules")

    # Start capture thread
    threading.Thread(target=start_capture, daemon=True).start()

    socketio.run(app, host="0.0.0.0", port=CONFIG["dashboard_port"], debug=False)
