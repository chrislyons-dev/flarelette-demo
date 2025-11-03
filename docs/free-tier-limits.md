# Free Tier Limits & Optimization

> Keep your Cloudflare Workers application running at $0/month

---

## Cloudflare Free Tier Quotas

| Resource             | Free Tier Limit  | Notes                        |
| -------------------- | ---------------- | ---------------------------- |
| **Workers Requests** | 100,000/day      | Resets daily at midnight UTC |
| **Workers CPU Time** | 10ms per request | Generous for most workloads  |
| **D1 Reads**         | 5,000,000/day    | Row reads, not queries       |
| **D1 Writes**        | 100,000/day      | Row writes, not queries      |
| **D1 Storage**       | 5 GB             | Total across all databases   |
| **R2 Storage**       | Unlimited        | 100% free!                   |
| **R2 Class A Ops**   | 1M/month         | Writes, lists                |
| **R2 Class B Ops**   | 10M/month        | Reads                        |
| **Pages**            | Unlimited        | Build minutes: 500/month     |

---

## Estimated Usage (This Template)

For a typical school website with **500 visitors/day**:

### Workers Requests

- Homepage: 1 request
- Events page: 2 requests (HTML + API)
- News page: 2 requests
- Contact form: 1 request

**Estimate:** ~3,000 requests/day (~3% of limit)

### D1 Reads

- Events list: 20 rows
- News list: 20 rows
- Roster: 10 rows
- Pages: 2 rows

**Estimate:** ~15,000 reads/day (~0.3% of limit)

### D1 Writes

- Contact forms: ~10/day
- Admin updates: ~5/day

**Estimate:** ~15 writes/day (~0.015% of limit)

### Result

**All well within free tier limits!**

---

## Optimization Strategies

### 1. Caching Static Content

Use Cloudflare's cache for pages that rarely change:

```typescript
// In Astro pages
export const prerender = true // Static generation
```

### 2. Efficient D1 Queries

Minimize row reads:

```sql
-- Good: Limit results
SELECT * FROM events WHERE published = 1 ORDER BY date LIMIT 10

-- Bad: Read all rows
SELECT * FROM events
```

Add indexes for common queries:

```sql
CREATE INDEX idx_events_published_date ON events(published, date)
```

### 3. R2 for Heavy Assets

Store images, videos, PDFs in R2 (unlimited free storage):

```typescript
// Serve directly from R2 with cache headers
return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata?.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
})
```

### 4. Request Batching

Combine multiple API calls into one:

```typescript
// Bad: 3 separate requests
const events = await fetch('/api/content/events')
const news = await fetch('/api/content/news')
const roster = await fetch('/api/content/roster')

// Good: 1 request with multiple resources
const data = await fetch('/api/content/all')
```

### 5. Pagination

Always paginate large datasets:

```typescript
// Limit results per page
const limit = Math.min(parseInt(query.limit) || 10, 100)
const offset = parseInt(query.offset) || 0
```

---

## Monitoring Usage

### Cloudflare Dashboard

View real-time usage:

1. Go to cloudflare.com/dash
2. Select your account
3. Analytics → Workers
4. Analytics → D1
5. Analytics → R2

### Wrangler CLI

```bash
# Check D1 usage
wrangler d1 info content-db

# Check R2 usage
wrangler r2 bucket list
```

### Set Up Alerts

Configure email alerts for:

- 80% of daily request limit
- 90% of D1 write limit

(Available in Cloudflare dashboard → Notifications)

---

## What If You Exceed Free Tier?

### Workers

- **Over 100k requests/day:** $0.50 per million requests
- Still very cheap! 1M requests = $0.50

### D1

- **Over limits:** $5/month for 25M reads, 50M writes
- Rarely needed for small sites

### R2

- **Storage:** Always free!
- **Bandwidth:** $0.36/GB after 10 GB/month (very generous)

---

## Scaling Beyond Free Tier

If your site grows popular:

1. **Enable caching** - Reduces requests significantly
2. **Add CDN** - Cloudflare already does this
3. **Optimize queries** - Use indexes, limit results
4. **Consider paid plan** - Still incredibly cheap:
   - Workers: $5/month base + usage
   - D1: $5/month for higher limits

**Example:** A site with 10k visitors/day on paid plan costs ~$10-15/month total.

---

## Best Practices for Free Tier

✅ **Do:**

- Cache aggressively
- Use R2 for all media
- Paginate lists
- Add database indexes
- Monitor usage weekly

❌ **Don't:**

- Poll APIs constantly (use webhooks)
- Store large blobs in D1 (use R2)
- Return unbounded result sets
- Skip indexes on large tables

---

## Sample Calculation

**School website with:**

- 50 events/year
- 100 news articles
- 30 roster members
- 1,000 visitors/month

**Monthly usage:**

- Requests: ~60,000/month (2,000/day avg)
- D1 Reads: ~300,000/month
- D1 Writes: ~500/month
- R2 Storage: 2 GB

**Cost:** **$0/month** (well within free tier!)

---

## Conclusion

This template is designed to stay free indefinitely for small-to-medium sites. Most school/community websites will never exceed the free tier.

For questions about your specific usage, check the [Cloudflare pricing calculator](https://www.cloudflare.com/plans/developer-platform/).
