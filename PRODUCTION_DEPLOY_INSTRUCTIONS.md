# Production Deployment - Final Step

## ✅ What's Already Done:
1. All code fixes committed and pushed to GitHub
2. Railway will auto-deploy when it detects the push
3. Database schema will auto-update
4. Market metadata will auto-update

## 🎯 What You Need to Do:

Run the data fetch **ONE TIME** to populate Treasury bond data on production.

### Option A: Simple (2 commands)
```bash
railway link
# When prompted, select: cot-dash

railway run npm run fetch-all
```

### Option B: Use the script
```bash
./run-production-fetch.sh
```

This will:
- Connect to your Railway "cot-dash" project
- Run the data fetch script on production
- Fetch ~1,000 Treasury bond reports (ZB, ZN, ZF, ZT)
- Takes 5-10 minutes

## 📊 After Running:

Verify the data loaded by checking your production API:
```bash
# Replace with your Railway URL
curl https://[your-railway-url].railway.app/api/v1/cot/ZB
curl https://[your-railway-url].railway.app/api/v1/markets
```

You should see:
- ZB, ZN, ZF, ZT all have `dataCount > 0`
- PL shows `category: "Metal"` (not "NYMEX")  
- All markets show `contract_unit` and `tick_size`

## 🔄 Alternative: Wait for Auto-Deploy

If your production database is completely empty, the Railway init script will automatically fetch all data on first deploy. Check the Railway logs to see if this is happening.

---

**Ready to run?** Open a new terminal and run:
```bash
cd "/Users/charlie/Desktop/CoT Report Visualisation"
railway link
railway run npm run fetch-all
```
