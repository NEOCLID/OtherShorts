# Google OAuth Configuration for Production

## Current Configuration

Your OAuth Client IDs:
```
Expo Client ID:    874054853041-0vbn26ekopo5o36079cje63acp567amk.apps.googleusercontent.com
Web Client ID:     874054853041-46orv6vs3l5uauju1fnajgl3tjijghdk.apps.googleusercontent.com
Android Client ID: 874054853041-lhci3mj5ap0ijbpn507vpm13s935j5bb.apps.googleusercontent.com
```

---

## ⚠️ ACTION REQUIRED

You MUST add production domains to Google Cloud Console before deploying.

---

## Step-by-Step Guide

### 1. Go to Google Cloud Console

**URL**: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 2. Select Your Project

Look for project ID: `874054853041` or project name containing "OtherShorts"

### 3. Configure Web Client ID

Click on **Web Client ID** (ends with `-46orv6vs3l5uauju1fnajgl3tjijghdk.apps.googleusercontent.com`)

#### Add Authorized JavaScript Origins:
```
https://othershorts.com
https://api.othershorts.com
```

#### Add Authorized Redirect URIs:
```
https://othershorts.com
https://api.othershorts.com
https://auth.expo.io/@YOUR_EXPO_USERNAME/othershorts
```

**Save changes**

---

### 4. Configure Android Client ID

Click on **Android Client ID** (ends with `-lhci3mj5ap0ijbpn507vpm13s935j5bb.apps.googleusercontent.com`)

#### Add SHA-1 Certificate Fingerprint

You need your release keystore SHA-1. Get it with:

**On Windows (PowerShell):**
```powershell
cd C:\Dev\otherTubeApp\OtherShorts\android\app
keytool -list -v -keystore my-upload-key.keystore -alias my-key-alias
```

**On Mac/Linux:**
```bash
cd android/app
keytool -list -v -keystore my-upload-key.keystore -alias my-key-alias
```

**Enter keystore password** when prompted.

**Copy the SHA-1 fingerprint** (looks like: `A1:B2:C3:D4:E5:F6:...`)

**In Google Console:**
1. Under "Android client", click "Add fingerprint"
2. Paste the SHA-1 fingerprint
3. Package name should be: `com.neosa.othershorts`
4. Save

---

### 5. Configure OAuth Consent Screen

Go to: **APIs & Services > OAuth consent screen**

#### Required Information:

**App name**: OtherShorts
**User support email**: Your email
**App logo**: (Optional, upload later)

**App domain**:
- Homepage: `https://othershorts.com`
- Privacy Policy: `https://othershorts.com/privacy` (you'll need to create this)
- Terms of Service: `https://othershorts.com/terms` (you'll need to create this)

**Developer contact**: Your email

**Scopes**: Keep default scopes (email, profile)

**Test users**: Add your email for testing

**Publishing status**:
- Start with "Testing" (up to 100 test users)
- Switch to "In production" when ready

**Save and Continue**

---

## 📱 Testing OAuth Configuration

### Test Web Login:
```bash
# After deploying web app
# Go to: https://othershorts.com
# Click "Sign in with Google"
# Should work without errors
```

### Test Android Login:
```bash
# Install app on device
# Click "Sign in with Google"
# Should open Google sign-in page
# Should redirect back to app after auth
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI isn't authorized

**Solution**:
1. Check the error message for the actual redirect URI
2. Add that exact URI to Google Console
3. Common patterns:
   - `https://auth.expo.io/@username/appslug`
   - `https://api.othershorts.com`
   - `https://othershorts.com`

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured

**Solution**:
1. Complete OAuth consent screen configuration
2. Add your email as a test user
3. Wait a few minutes for changes to propagate

### Error: "Sign in with Google temporarily disabled for this app"

**Problem**: App not verified

**Solution**:
1. For testing: Add users to "Test users" list
2. For production: Submit app for verification (takes 3-7 days)

### Android: "Sign-in Failed"

**Problem**: SHA-1 fingerprint mismatch

**Solution**:
1. Make sure you added the RELEASE keystore SHA-1 (not debug)
2. Package name must match exactly: `com.neosa.othershorts`
3. Wait a few minutes after adding fingerprint

---

## 🔒 Security Best Practices

### Client IDs are Public
- Safe to commit to git
- Safe to show in app code
- No need to hide them

### Client Secrets are Private
- NEVER commit to git
- Only store on secure server
- Rotate if ever exposed

### Redirect URIs
- Only add URIs you control
- Use HTTPS in production (HTTP only for localhost)
- Be specific (avoid wildcards)

---

## ✅ Verification Checklist

After configuration:

- [ ] Web Client ID has production domains
- [ ] Android Client ID has release SHA-1
- [ ] OAuth consent screen is configured
- [ ] Test user added (your email)
- [ ] Privacy Policy URL added (or create one)
- [ ] Terms of Service URL added (or create one)
- [ ] Tested web login on production domain
- [ ] Tested Android login on physical device
- [ ] No redirect_uri errors
- [ ] User can sign in and see their info

---

## 📄 Required Legal Pages

You need to create these pages:

### Privacy Policy Template:

```markdown
# Privacy Policy for OtherShorts

Last updated: [DATE]

## Data We Collect
- Google account email and name (for authentication)
- Age, gender, country (demographic info, anonymized)
- YouTube watch history (only Shorts, from your Takeout file)
- Video ratings you submit

## How We Use Data
- To show you videos from other users
- To collect ratings and preferences
- To improve the app experience

## Data Sharing
- We do NOT share your personal information with third parties
- Ratings are anonymized
- Google handles authentication securely

## Your Rights
- Delete your data: Contact us at [EMAIL]
- Export your data: Contact us at [EMAIL]

## Contact
[YOUR EMAIL]
```

### Terms of Service Template:

```markdown
# Terms of Service for OtherShorts

Last updated: [DATE]

## Acceptance
By using OtherShorts, you agree to these terms.

## User Content
- You upload your YouTube watch history voluntarily
- You own your data
- We may use anonymized ratings for research

## Prohibited Use
- No spam or abuse
- No impersonation
- No illegal content

## Termination
We may suspend accounts that violate these terms.

## Contact
[YOUR EMAIL]
```

**Deploy these to:**
- `https://othershorts.com/privacy`
- `https://othershorts.com/terms`

---

## Next Step

Once Google OAuth is configured, proceed to:
**Step 4: Build using EAS**

See: `BUILD_INSTRUCTIONS.md`
