# 🔧 Troubleshooting Guide - Extensions Not Working

## ✅ What Was Fixed

I've added the missing script tag to your `dashboard.html` file at **line 8**:

```html
<script src="extensions/config/extensions-config.js"></script>
```

This single line loads ALL extensions (theme, export, notifications, graphs).

---

## 🧪 How to Verify It's Working

### Step 1: Restart the Dashboard

```bash
sudo python3 firewall_engine.py
```

Visit: **http://localhost:5000**

### Step 2: Open Browser Console (F12)

Press**F12** → Go to **Console** tab

**You should see these logs:**

```
[Config] Initializing extensions...
[Config] ✅ Theme extension loaded
[Config] ✅ Export logs loaded
[Config] ✅ Notifications loaded
[Config] ✅ Traffic graphs loaded
[Config] 🎉 All enabled extensions initialized
```

If you see these messages → **Extensions are loading correctly!** ✅

---

## ❌ Common Issues & Solutions

### Issue 1: "Failed to load resource" errors

**Console shows:**
```
GET file:///e:/harish%20bhai/Adaptive-firewall-main/extensions/config/extensions-config.js net::ERR_FILE_NOT_FOUND
```

**Cause:**File path is incorrect or dashboard can't find the extensions folder.

**Solution:**
1. Verify folder structure:
   ```
   Adaptive-firewall-main/
   ├── dashboard.html
   └── extensions/
       └── config/
           └── extensions-config.js
   ```
2. The `extensions/` folder must be in the **same directory** as `dashboard.html`
3. Check file permissions (should be readable)

---

### Issue 2: Buttons not appearing

**Problem:** Theme toggle, export button, notifications button, or analytics button not visible.

**Possible Causes:**
- Extensions loaded but scripts failed to execute
- CSS conflicts preventing display
- Browser cache showing old version

**Solutions:**

#### A. Hard Refresh Browser
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### B. Clear Cache
```
Chrome/Edge: F12 → Application → Clear Storage → Clear site data
Firefox: F12 → Storage → Clear All
```

#### C. Manually Test Each Feature

Open console (F12) and run these commands:

```javascript
// Test theme switcher
ThemeSwitcher.setTheme('light');

// Test export
ExportLogs.exportAlerts('csv');

// Show analytics panel
TrafficGraphs.showPanel();

// Enable notifications
Notifications.requestPermission();
```

If these work → Features are loaded but UI injection failed. Check browser extensions/ad blockers.

---

### Issue 3: Theme not switching

**Problem:** Toggle appears but clicking does nothing.

**Check Console for:**
```
[Theme] Switched to light mode
```

**If no log appears:**
1. Check if localStorage is blocked (browser privacy settings)
2. Try manual switch: `ThemeSwitcher.toggleTheme()`
3. Verify `data-theme` attribute on `<html>` element:
   ```javascript
  document.documentElement.getAttribute('data-theme')
   // Should return 'light' or 'dark'
   ```

**If attribute changes but colors don't:**
- Light theme CSS not loading
- Check Network tab for `light-theme.css` load status
- Verify file exists: `extensions/themes/light-theme.css`

---

### Issue 4: Export menu not showing

**Problem:** Click EXPORT button but nothing happens.

**Debug Steps:**

1. Check if button exists:
   ```javascript
  document.getElementById('exportBtn')
   // Should return the button element
   ```

2. Manually trigger export:
   ```javascript
   ExportLogs.exportAlerts('csv');
   ```

3. If error: "ExportLogs is not defined"
   - Extension didn't load properly
   - Check console for earlier errors
   - Reload page

---

### Issue 5: Notifications permission denied

**Problem:**Browser blocks notification permission.

**Why:**Browsers require user gesture (click) to request permission.

**Solution:**
1. Click "Enable Notifications" button (user gesture ✓)
2. If still blocked, check browser settings:
   ```
   Chrome: Settings → Privacy → Site Settings → Notifications
   Firefox: Preferences → Privacy & Security → Permissions → Notifications
   ```
3. Add `localhost:5000` to allowed sites

**Test manually:**
```javascript
Notification.requestPermission().then(p => console.log(p));
```

---

### Issue 6: Charts not displaying

**Problem:** Analytics panel opens but charts are blank.

**Causes:**
1. No internet connection (Chart.js loads from CDN)
2. Chart.js failed to load
3. No data available yet

**Verify:**

1. Check Network tab for Chart.js:
   ```
   https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
   ```
   
2. Wait for it to load (green status)

3. Check console:
   ```javascript
   typeof Chart
   // Should return "function", not "undefined"
   ```

4. Generate some traffic first (ping or hping3 test)

**Fix:**
```javascript
// Reload Chart.js manually
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
document.head.appendChild(script);

// Then refresh charts
TrafficGraphs.updateCharts();
```

---

### Issue 7: Nothing appears at all

**Symptoms:**
- No buttons visible anywhere
- Console shows no extension logs
- Dashboard looks exactly like original

**Likely Cause:** Script tag not executing or blocked.

**Debug:**

1. **View Page Source** (Ctrl+U)
   - Search for `extensions-config.js`
   - Should see the script tag we added

2. **Check if script is blocked:**
   - Disable ad blockers
   - Disable browser extensions temporarily
   - Try incognito/private mode

3. **Verify script syntax:**
   ```javascript
   // In console, type:
   window.ExtensionsConfig
   // Should return an object, not undefined
   ```

4. **Try reloading manually:**
   ```javascript
   ExtensionsConfig.reload();
   ```

---

## 🔍 Quick Diagnostic Commands

Copy-paste these into browser console:

```javascript
// 1. Check if extensions loaded
console.log('Extensions loaded:', !!window.ExtensionsConfig);

// 2. Check each feature
console.log('Theme:', !!window.ThemeSwitcher);
console.log('Export:', !!window.ExportLogs);
console.log('Notifications:', !!window.Notifications);
console.log('Graphs:', !!window.TrafficGraphs);

// 3. Get detailed status
console.log('Status:', ExtensionsConfig.getStatus());

// 4. Force reload all extensions
ExtensionsConfig.reload();

// 5. Reset everything (nuclear option)
localStorage.clear();
location.reload();
```

---

## 📊 Expected Behavior Checklist

After proper installation, you should see:

### Visual Elements:
- [ ] Theme toggle in header (top-right corner) ☀️/🌙
- [ ] EXPORT button next to "FLUSH ALL BLOCKS" 📥
- [ ] Enable Notifications button (bottom-right) 🔔
- [ ] Analytics button (bottom-left) 📊

### Console Logs:
- [ ] `[Config] Initializing extensions...`
- [ ] `[Config] ✅ Theme extension loaded`
- [ ] `[Config] ✅ Export logs loaded`
- [ ] `[Config] ✅ Notifications loaded`
- [ ] `[Config] ✅ Traffic graphs loaded`
- [ ] `[Config] 🎉 All enabled extensions initialized`

### Functional Tests:
- [ ] Click theme toggle → switches between light/dark
- [ ] Click EXPORT → menu appears with 5 options
- [ ] Download CSV → opens in spreadsheet app
- [ ] Click Enable Notifications → browser asks permission
- [ ] Click Analytics → slide-in panel with charts
- [ ] Charts update every 2 seconds

---

## 🛠️ Still Not Working?

### Advanced Debugging:

#### 1. Check File Loading Order

In browser console:
```javascript
// See all loaded scripts
performance.getEntriesByType('resource')
  .filter(r => r.initiatorType === 'script')
  .forEach(s => console.log(s.name));
```

Look for:
- `extensions-config.js` ✅
- `theme-switcher.js` ✅
- `export-logs.js` ✅
- `notifications.js` ✅
- `traffic-graphs.js` ✅

#### 2. Check for JavaScript Errors

Look for red errors in console mentioning:
- `extensions/` folder
- Any of the extension files
- Syntax errors

#### 3. Manual File Load Test

Try loading each file directly in browser:
```
http://localhost:5000/extensions/config/extensions-config.js
http://localhost:5000/extensions/themes/theme-switcher.js
http://localhost:5000/extensions/features/export-logs.js
```

Should show the JavaScript code, not 404 error.

---

## 🆘 Emergency Reset

If everything is broken:

```javascript
// 1. Clear all extension data
localStorage.clear();

// 2. Remove any injected elements
document.querySelectorAll('.theme-toggle-container, #exportBtn, #notificationToggle, #graphsToggle, #trafficGraphsPanel')
  .forEach(el => el.remove());

// 3. Hard refresh
location.reload();

// 4. After reload, check console for errors
```

---

## 📞 Last Resort

If none of the above works:

1. **Verify Python server is running:**
   ```bash
   sudo python3 firewall_engine.py
   ```

2. **Check server logs** for any errors serving static files

3. **Try different browser** (Chrome, Firefox, Edge)

4. **Re-copy extensions folder** from source

5. **Manually add script tag again** (verify it didn't get removed):
   - Open `dashboard.html`
   - Line 8 should have: `<script src="extensions/config/extensions-config.js"></script>`

---

## ✅ Success Indicators

You'll know it's working when:

✅ Console shows all 5 "[Config] ✅ ..." messages  
✅ Theme toggle visible and functional  
✅ At least one other button visible (EXPORT/Notifications/Analytics)  
✅ No JavaScript errors in console  
✅ Original dashboard features still work (block/unblock IPs)  

---

**Good luck! Your enhanced dashboard is just one refresh away! 🚀**
