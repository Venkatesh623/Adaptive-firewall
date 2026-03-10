# 🔌 Extensions Integration Guide

## Overview

This guide explains how to integrate the **Light Theme** and **New Features** into your Adaptive Firewall dashboard **WITHOUT modifying any existing source code**.

---

## 📁 New Files Created

```
Adaptive-firewall-main/
├── extensions/                    ← NEW FOLDER (all customizations)
│   ├── themes/
│   │   ├── light-theme.css        # Light mode styles
│   │   └── theme-switcher.js      # Theme toggle logic
│   ├── features/
│   │   ├── export-logs.js         # Export to CSV/JSON
│   │   ├── notifications.js       # Desktop notifications
│   │   └── traffic-graphs.js      # Visual charts
│   ├── config/
│   │   └── extensions-config.js   # Central manager
│   └── README.md                  # This file
│
└── [Original files - UNCHANGED]
    ├── firewall_engine.py
    ├── dashboard.html
    ├── Diagnose.py
    └── setup.sh
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Copy Extensions Folder

Copy the entire `extensions/` folder to your project root:

```bash
# The folder structure should look like this:
your-project/
├── extensions/          ← Copied here
├── firewall_engine.py
├── dashboard.html
├── Diagnose.py
└── setup.sh
```

### Step 2: Modify dashboard.html (ONE line only)

Add this single line before the closing `</head>` tag in `dashboard.html`:

```html
<script src="extensions/config/extensions-config.js"></script>
```

**Location:** Add at line 6 (after the existing `<script>` tag, before `</head>`)

That's it! The extensions will now load automatically.

### Step 3: Restart Dashboard

If the dashboard is already running, restart it:

```bash
sudo python3 firewall_engine.py
```

Then visit: `http://localhost:5000`

---

## ✨ What You Get

### 1. **Light/Dark Theme Toggle** 🌓
- **Automatic toggle** appears in the header
- **Click** to switch between dark and light modes
- **Persists** your preference across sessions
- **Default:** Dark mode (original theme)

### 2. **Export Data** 📊
- **"EXPORT" button** appears next to "FLUSH ALL BLOCKS"
- Export options:
  - Alerts (CSV or JSON)
  - IP Statistics (CSV or JSON)
  - Full Report (JSON)
- **Files named with timestamps** for easy organization

### 3. **Desktop Notifications** 🔔
- **"Enable Notifications" button** appears bottom-right
- Get **real-time alerts** when threats are blocked
- **Click notification** to focus the dashboard
- **Test notification** sent on enable

### 4. **Traffic Analytics** 📈
- **"Analytics" button** appears bottom-left
- **Live charts** showing:
  - Packets per second over time
  - Attack type distribution (pie chart)
- **Updates every 2 seconds**
- **Slide-in panel** from the right

---

## 🎨 Screenshots (What to Expect)

### Light Mode
- Clean white background
- Dark text (#1a202e)
- Colored accents (blue, green, orange, red)
- Subtle shadows and borders
- Modern, professional look

### Dark Mode (Original)
- Dark background (#080c14)
- Green accent text (#00ff88)
- Cyberpunk aesthetic
- Glowing effects

---

## ⚙️ Configuration Options

### Enable/Disable Specific Features

Open browser console (F12) and run:

```javascript
// Disable notifications
ExtensionsConfig.configure('notifications', false);

// Disable traffic graphs
ExtensionsConfig.configure('trafficGraphs', false);

// Disable export
ExtensionsConfig.configure('exportLogs', false);

// Reload extensions
ExtensionsConfig.reload();
```

### Check Extension Status

```javascript
console.log(ExtensionsConfig.getStatus());
```

Output example:
```javascript
{
  theme: { enabled: true, current: 'light' },
  exportLogs: { enabled: true, available: true },
  notifications: { enabled: true, active: true },
  trafficGraphs: { enabled: true, active: true }
}
```

---

## 🛠️ Advanced Customization

### Change Default Theme

Edit `extensions/config/extensions-config.js`, line 13:

```javascript
theme: {
  enabled: true,
  default: 'light',  // Change from 'dark' to 'light'
  persist: true
},
```

### Customize Light Theme Colors

Edit `extensions/themes/light-theme.css`, lines 7-30:

```css
:root[data-theme="light"] {
  --bg-primary: #ffffff;      /* Main background */
  --text-primary: #1a202e;    /* Main text color */
  --success: #10b981;         /* Success/blocked color */
  --warning: #f59e0b;         /* Warning color */
  --danger: #ef4444;          /* Danger color */
  /* ... modify as needed */
}
```

### Adjust Chart Update Speed

Edit `extensions/features/traffic-graphs.js`, line 287:

```javascript
updateInterval: 1000,  // Update every 1 second (default: 2000ms)
```

### Change Notification Behavior

Edit `extensions/features/notifications.js`:
- Line 73: Change which alert types trigger notifications
- Line 59: Auto-close timeout (default: 5000ms)

---

## 🔧 Troubleshooting

### Extensions Not Loading

**Check browser console** (F12 → Console tab):

```
[Config] Initializing extensions...
[Config] ✅ Theme extension loaded
[Config] ✅ Export logs loaded
[Config] ✅ Notifications loaded
[Config] ✅ Traffic graphs loaded
[Config] 🎉 All enabled extensions initialized
```

**If you see errors:**
1. Verify `extensions/` folder is in the same directory as `dashboard.html`
2. Check file permissions (should be readable by web server)
3. Clear browser cache (Ctrl+Shift+R)

### Theme Toggle Not Appearing

- Refresh the page (Ctrl+R)
- Check browser console for errors
- Manually trigger: `ThemeSwitcher.toggleTheme()`

### Export Button Missing

- Ensure dashboard has loaded completely
- Check console for script errors
- Manually trigger: `ExportLogs.exportAlerts('csv')`

### Notifications Not Working

- Click "Enable Notifications" button
- Allow browser permission prompt
- Check browser settings for notification permissions

### Charts Not Displaying

- Check internet connection (Chart.js loads from CDN)
- Wait for Chart.js to load (check Network tab)
- Manually trigger: `TrafficGraphs.showPanel()`

---

## 📋 Manual Testing Checklist

After installation, verify:

- [ ] Dashboard loads without errors
- [ ] Theme toggle appears in header (top-right)
- [ ] Switching themes works smoothly
- [ ] Theme preference persists after refresh
- [ ] EXPORT button appears near "FLUSH ALL BLOCKS"
- [ ] Clicking EXPORT shows menu with 5 options
- [ ] Downloaded files open correctly in spreadsheet app
- [ ] Notifications button appears bottom-right
- [ ] Clicking enables notifications (browser prompt)
- [ ] Test notification appears
- [ ] ANALYTICS button appears bottom-left
- [ ] Charts panel slides in when clicked
- [ ] Charts update in real-time
- [ ] Original functionality (block/unblock) still works

---

## 🎯 Feature Usage Examples

### Export Alert Logs

1. Click **EXPORT** button
2. Select **"📊 Alerts (CSV)"**
3. Open downloaded file in Excel/Google Sheets

### Get Notified of Blocks

1. Click **"Enable Notifications"** (bottom-right)
2. Allow browser permission
3. When an IP is blocked, you'll get a desktop notification
4. Click notification to view dashboard

### View Traffic Trends

1. Click **"Analytics"** (bottom-left)
2. View real-time packets/sec graph
3. See attack type distribution
4. Click again to hide panel

### Switch to Light Mode

1. Click **toggle** in header (top-right)
2. Instantly switches to light/dark mode
3. Preference saved automatically

---

## 🔒 Security Notes

- **No backend changes** - All extensions run client-side only
- **No data sent externally** - Everything stays local
- **CDN dependency** - Chart.js loads from jsdelivr.net (optional)
- **LocalStorage used** - Stores theme preference and settings
- **No persistent storage** - Extensions don't store sensitive data

---

## 📦 File Sizes

| File | Size | Purpose |
|------|------|---------|
| light-theme.css | ~12 KB | Light mode styles |
| theme-switcher.js | ~5 KB | Theme toggle logic |
| export-logs.js | ~8 KB | CSV/JSON export |
| notifications.js | ~7 KB | Desktop alerts |
| traffic-graphs.js | ~10 KB | Chart visualizations |
| extensions-config.js | ~5 KB | Central manager |

**Total:** ~47 KB (very lightweight)

---

## 🆘 Support & Debugging

### View Extension Logs

Open browser console to see detailed logs:

```
[Theme] Switched to light mode
[Export] Downloaded firewall_alerts_2024-03-10T14-30-00.csv
[Notifications] Permission: granted
[Graphs] Auto-update started
```

### Reset All Settings

Clear localStorage to reset everything:

```javascript
localStorage.clear();
location.reload();
```

### Disable All Extensions Temporarily

Comment out the script tag in `dashboard.html`:

```html
<!-- <script src="extensions/config/extensions-config.js"></script> -->
```

---

## 🎉 Summary

You now have:
- ✅ **Light mode theme** with one-click toggle
- ✅ **Export functionality** for all data
- ✅ **Desktop notifications** for security alerts
- ✅ **Real-time charts** for traffic visualization
- ✅ **Zero changes** to original source code
- ✅ **Full backward compatibility** maintained

**Enjoy your enhanced dashboard!** 🚀

---

## 📝 Version History

- **v1.0** (2024-03-10)
  - Initial release
  - Light/dark theme support
  - Export to CSV/JSON
  - Browser notifications
  - Traffic analytics charts

---

## 📞 Contact

For issues or questions, check the browser console logs first, then refer to the troubleshooting section above.

**Happy monitoring!** 🛡️
