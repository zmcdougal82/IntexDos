# Setting Up SPF Records for mail.cineniche.co

According to the diagnostic tool, your domain `mail.cineniche.co` is missing a valid SPF (Sender Policy Framework) record. This is critical for email deliverability, as it tells receiving mail servers which servers are authorized to send email from your domain.

## What is an SPF Record?

SPF (Sender Policy Framework) is an email authentication method designed to detect forged sender addresses during the delivery of email. SPF allows the receiver to check that an email claiming to come from a specific domain is submitted by an IP address authorized by that domain's administrators.

## Setting Up the SPF Record for SparkPost

To set up the SPF record for your domain, you need to add a TXT record to your domain's DNS settings:

1. Log in to your domain registrar or DNS provider (where `mail.cineniche.co` is managed)
2. Navigate to the DNS management section
3. Add a new TXT record with the following values:
   - **Host/Name**: @ or leave blank (depending on your provider)
   - **Value/Content**: `v=spf1 include:sparkpostmail.com ~all`
   - **TTL**: 3600 (or default)

### Example DNS Entry

```
Type    Host              Value                               TTL
TXT     @                 v=spf1 include:sparkpostmail.com ~all    3600
```

## Verifying Your SPF Record

After adding the SPF record, it may take some time (up to 48 hours) for DNS propagation, although it typically takes only 15 minutes to a few hours.

You can verify if your SPF record is properly set up using:

1. Our diagnostic tool:
   ```bash
   node MoviesApp/Backend/sparkpost-diagnostic.js --email your@email.com
   ```

2. Online SPF record checkers:
   - [MXToolbox SPF Lookup](https://mxtoolbox.com/spf.aspx)
   - [Kitterman SPF Record Checker](https://www.kitterman.com/spf/validate.html)

## Complete Email Authentication Setup

For optimal email deliverability, ensure you have all three authentication methods properly set up:

1. **SPF**: Verifies sending servers (what we're fixing now)
2. **DKIM**: Cryptographically signs emails (already set up correctly)
3. **DMARC**: Tells receiving servers what to do with emails that fail authentication

Our diagnostic shows DKIM is already set up correctly, which is good. Once SPF is set up, consider also adding a DMARC record for maximum deliverability.

## Why SPF Matters

When SPF is not properly configured:
- Emails may be rejected outright by receiving mail servers
- Emails may be filtered into spam/junk folders
- Recipient servers may give lower reputation scores to your domain

Setting up SPF correctly will significantly improve your password reset email deliverability.
