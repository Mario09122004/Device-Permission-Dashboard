# Device Permission Dashboard

A clean, standalone web application demonstrating browser device permissions (Camera & Geolocation) under a strict zero-retention privacy policy.

> **“Local educational experiment — no data is uploaded or recorded.”**

---

## 📁 Project Structure

```text
device-permission-dashboard/
├── index.html       # Clean semantic HTML interface
├── style.css        # Modern dark-slate stylesheet
├── app.js           # Client-side permissions & diagnostic logic
├── index.js         # Zero-dependency Node.js HTTP server (port 8000)
└── README.md        # Instructions
```

---

## 🚀 How to Run

### Method 1: Using Node.js (Recommended)
Open a terminal in this folder and run:
```bash
node index.js
```
Then visit: **`http://127.0.0.1:8000`** in your browser.

### Method 2: Using Python
```bash
python -m http.server 8000 --bind 127.0.0.1
```

### Method 3: Direct Open
You can also double-click `index.html` to open it directly in modern browsers (note: some permissions like camera may require an HTTP localhost origin).
