/**
 * Theme Switcher Module
 * Handles switching between dark and light themes
 */

(function() {
  'use strict';

  const THEME_KEY = 'adaptive_firewall_theme';
  
  // Initialize theme on page load
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);
  }

  // Set theme on root element
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update toggle button if exists
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.checked = theme === 'light';
      updateToggleIcon(toggle);
    }
    
    console.log(`[Theme] Switched to ${theme} mode`);
  }

  // Toggle between themes
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  // Update toggle icon based on theme
  function updateToggleIcon(toggle) {
    const icon = toggle.parentElement.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = toggle.checked ? '☀️' : '🌙';
    }
  }

  // Create theme toggle button programmatically
  function createThemeToggle() {
    const container= document.createElement('div');
    container.className = 'theme-toggle-container';
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      padding-right: 20px;
    `;

    const label = document.createElement('label');
    label.className = 'theme-switch';
    label.style.cssText = `
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'themeToggle';
    checkbox.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `;

    const slider = document.createElement('span');
    slider.className = 'slider';
    slider.style.cssText = `
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #2d3748;
      transition: 0.3s;
      border-radius: 24px;
    `;
    slider.innerHTML = '<span class="theme-icon" style="position:absolute;left:4px;top:2px;font-size:14px;">🌙</span>';

    checkbox.onchange = () => {
      toggleTheme();
    };

    label.appendChild(checkbox);
    label.appendChild(slider);
    container.appendChild(label);

    return container;
  }

  // Inject theme toggle into header
  function injectToggle() {
    const header = document.querySelector('header');
    if (!header) {
      console.warn('[Theme] Header not found, retrying...');
      setTimeout(injectToggle, 100);
      return;
    }

    const toggle = createThemeToggle();
    header.appendChild(toggle);
    
    // Set initial state
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    toggle.querySelector('#themeToggle').checked = savedTheme === 'light';
    updateToggleIcon(toggle.querySelector('#themeToggle'));
  }

  // Add CSS for smooth transitions
  function addTransitionStyles() {
    const style = document.createElement('style');
    style.textContent = `
      [data-theme] * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
      }
      
      .theme-toggle-container {
        animation: fadeIn 0.5s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      addTransitionStyles();
      setTimeout(injectToggle, 100);
    });
  } else {
    initTheme();
    addTransitionStyles();
    setTimeout(injectToggle, 100);
  }

  // Expose API for external use
  window.ThemeSwitcher= {
    setTheme,
    toggleTheme,
    getTheme: () => localStorage.getItem(THEME_KEY) || 'dark'
  };

})();
