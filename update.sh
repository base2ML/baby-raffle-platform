#!/bin/bash
# Ultra-simple deployment: Edit code → Run this → Site updates

cd frontend && npm run build && cd .. && cp frontend/dist/index.html ./index.html && cp -r frontend/dist/assets/* ./assets/ && git add . && git commit -m "Update site" && git push origin main && echo "✅ Site updating at https://margojones.base2ml.com"