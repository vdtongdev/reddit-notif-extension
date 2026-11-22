# Reddit Notification Dropdown

A Chrome/Brave extension that transforms Reddit's bell icon into a **quick-view dropdown** showing Reddit's notifications feed — without ever leaving the page.

---

## Features

- Click the bell to open Reddit's notifications section in a dropdown
- Includes suggestions, breaking news, and other notifications available in Reddit's feed
- "View all" opens the full notifications page in a new tab
- Works with Reddit's SPA navigation (no page refresh needed)
- Close with Escape key or clicking outside

---

## Install in Brave / Chrome

1. Go to `brave://extensions` or `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `reddit-notif-extension/` folder
5. Navigate to **reddit.com** and click the bell 🔔

> **You must be logged in to Reddit** for notifications to load.

---

## 🔧 How it works

The dropdown loads Reddit's notifications page using your existing session and hides the surrounding page layout. Reddit controls the feed and may mark notifications as read when it loads. If Reddit changes its page or prevents embedding, use **View all** to open the full page.

---

## Customization

**Style the dropdown** - edit `src/dropdown.css`.
