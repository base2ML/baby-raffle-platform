# FastAPI Baby Raffle Deployment Guide

## Quick Deploy to DigitalOcean App Platform

1. **Create a new DigitalOcean App**:
   ```bash
   # Upload this directory to a GitHub repo
   # Then use the DigitalOcean App Platform to deploy from GitHub
   ```

2. **Environment Variables** (set in DigitalOcean App Platform):
   ```
   DB_HOST=margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com
   DB_PORT=5432
   DB_NAME=babyraffle
   DB_USERNAME=postgres
   DB_PASSWORD=YgrzO9oHQScN5ctXcTOL
   ```

3. **Domain Setup**:
   - Set custom domain: `api.margojones.base2ml.com`
   - Point DNS A record to DigitalOcean App IP

4. **Update Frontend**:
   - Change `VITE_API_URL` to `https://api.margojones.base2ml.com`
   - Rebuild and redeploy frontend

## Alternative: Deploy with Docker Compose

```bash
# On a server that can reach your RDS database
docker-compose up -d
```

## API Endpoints

The FastAPI will expose:
- `GET /health` - Health check
- `GET /categories` - Betting categories  
- `GET /bets` - All bets
- `POST /bets` - Create new bets
- `GET /stats` - Live betting statistics
- `POST /admin/validate` - Admin bet validation

## Benefits of FastAPI vs Lambda

✅ **No cold starts** - Always responsive  
✅ **No VPC networking issues** - Direct database connections  
✅ **Better error handling** - Clear error messages  
✅ **Faster development** - Easy local testing  
✅ **Cost effective** - Single container vs multiple Lambda functions  
✅ **Better logging** - Centralized logs  

## Next Steps

1. Deploy FastAPI to DigitalOcean/Railway/Render
2. Update frontend environment variable  
3. Test all endpoints work  
4. Decommission Lambda functions  
