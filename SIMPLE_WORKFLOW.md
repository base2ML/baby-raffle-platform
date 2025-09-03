# 🚀 Ultra-Simple Deployment Workflow

## Your Complete Workflow (2 Steps):

### 1. **Edit Your Code**
Edit any files in `frontend/src/` (React components, styles, etc.)

### 2. **Deploy Changes**
```bash
./update.sh
```

**That's it!** Your site updates automatically at https://margojones.base2ml.com

---

## What the Script Does:
1. Builds your frontend (`npm run build`)
2. Copies built files to the right place  
3. Commits and pushes to GitHub
4. GitHub Pages serves the updated site

## Development Preview:
```bash
./dev.sh    # Preview changes locally at http://localhost:5173
```

## URLs:
- **Live Site**: https://margojones.base2ml.com
- **Backend API**: https://margojones-production.up.railway.app  
- **Local Dev**: http://localhost:5173

---

**Workflow:**  
Edit code → `./update.sh` → Site is live! ✅