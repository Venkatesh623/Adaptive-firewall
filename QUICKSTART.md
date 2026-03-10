# ⚡ Quick Start Guide

## Install Extensions (2 Minutes)

### Step 1: Verify Folder Structure
```
your-project/
├── extensions/          ← Should exist
│   ├── themes/
│   ├── features/
│   └── config/
├── firewall_engine.py
├── dashboard.html
├── Diagnose.py
└── setup.sh
```

### Step 2: Add One Line to dashboard.html

Open `dashboard.html` and add this line **before `</head>`**:

```html
<script src="extensions/config/extensions-config.js"></script>
```

**Example:**
```html
<head>
  <!-- ... existing code ... -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.1/socket.io.min.js"></script>
  
  <!-- ADD THIS LINE HERE ↓ -->
  <script src="extensions/config/extensions-config.js"></script>
  
</head>
```

### Step 3: Restart Dashboard
```bash
sudo python3 firewall_engine.py
```

Visit: **http://localhost:5000**

---

## ✨ New Features Overview

### 🌓 Theme Toggle
- **Location:** Top-right corner of header
- **Action:** Click to switch light/dark mode
- **Icon:** 🌙 (dark) ↔️ ☀️ (light)

### 📊 Export Data
- **Location:** Next to "FLUSH ALL BLOCKS" button
- **Action:** Click "EXPORT" → Choose format
- **Formats:** CSV, JSON

### 🔔 Notifications
- **Location:** Bottom-right corner
- **Action:** Click "Enable Notifications"
- **Result:** Desktop alerts for blocked threats

### 📈 Analytics Charts
- **Location:** Bottom-left corner  
- **Action:** Click "Analytics"
- **Result:** Slide-in panel with live charts

---

## 🎯 First-Time Setup

1. **Open dashboard** in browser
2. **Switch to light mode** (toggle in header)
3. **Enable notifications** (bottom-right button)
4. **Test export** (click EXPORT → download sample)
5. **View analytics** (click Analytics → see charts)

---

## 🔧 Common Issues

| Problem | Solution |
|---------|----------|
| Toggle not showing | Refresh page (Ctrl+R) |
| Charts not loading | Check internet (Chart.js CDN) |
| Export fails | Wait for data to load |
| Notifications blocked | Allow browser permission |

---

## 🛠️ Browser Console Commands

Open console (F12) and try:

```javascript
// Switch theme manually
ThemeSwitcher.setTheme('light');

// Export alerts
ExportLogs.exportAlerts('csv');

// Show analytics panel
TrafficGraphs.showPanel();

// Check extension status
ExtensionsConfig.getStatus();

// Disable notifications
ExtensionsConfig.configure('notifications', false);
```

---

## ✅ Verification Checklist

After installation, you should see:

- [ ] Theme toggle in header (top-right)
- [ ] EXPORT button near flush controls
- [ ] Enable Notifications button(bottom-right)
- [ ] Analytics button (bottom-left)
- [ ] Smooth theme transitions
- [ ] No console errors

---

## 📖 Full Documentation

See [`extensions/README.md`](extensions/README.md) for complete details.

---

**That's it! Enjoy your enhanced dashboard!** 🎉
