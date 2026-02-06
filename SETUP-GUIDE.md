# Brycho Website - Complete Setup Guide

## 🎯 Quick Links
- [Initial Setup](#initial-setup) (15 minutes)
- [Supabase Setup](#supabase-setup-secure-admin) (15 minutes)
- [Admin System](#using-the-admin-system)
- [Adding Images](#adding-images-without-admin)
- [Customization](#customization-guide)

---

## Initial Setup

### 1. GitHub & Netlify (Same as before)

1. **GitHub Desktop**
   - Download from https://desktop.github.com/
   - Create repository: `brycho-website`
   - Add all files from this folder
   - Commit: "Initial website setup"
   - Publish repository (public)

2. **Deploy to Netlify**
   - Go to https://netlify.com
   - Sign up with GitHub
   - New site → Import from GitHub
   - Select `brycho-website`
   - Deploy!

3. **Custom Domain**
   - Netlify → Domain settings
   - Add custom domain: `brycho.com`
   - Update DNS with your registrar
   - Wait for DNS propagation (1-2 hours)

---

## Supabase Setup (Secure Admin)

### Why Supabase?
- **Free tier**: 500MB storage, unlimited API requests
- **Actual security**: Passwords aren't in source code
- **Real database**: Better than JSON files for hundreds of images
- **Future-proof**: Easy to add features later

### Step 1: Create Supabase Project (5 minutes)

1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Name: `brycho-admin`
4. Database Password: (generate strong password, save it!)
5. Region: Choose closest to you
6. Click "Create new project"
7. Wait 2 minutes for setup

### Step 2: Create Database Tables (5 minutes)

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Paste this code:

```sql
-- Images table
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  src TEXT NOT NULL,
  thumb TEXT,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[], -- Array of tags
  source_platform TEXT,
  source_creator TEXT,
  source_link TEXT,
  source_timestamp TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  protected BOOLEAN DEFAULT FALSE,
  related_images TEXT[], -- Array of image IDs
  additional_images TEXT[], -- Array of image URLs
  status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
  submitted_by TEXT, -- contributor password/name
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Access control table
CREATE TABLE access_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin' or 'contributor'
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert your admin password (replace 'your-admin-password')
INSERT INTO access_keys (password_hash, role, name)
VALUES (
  crypt('your-admin-password', gen_salt('bf')),
  'admin',
  'Brycho'
);

-- Add a contributor example (optional)
INSERT INTO access_keys (password_hash, role, name)
VALUES (
  crypt('contributor-pass-123', gen_salt('bf')),
  'contributor',
  'Builder1'
);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read approved images
CREATE POLICY "Anyone can view approved images"
  ON images FOR SELECT
  USING (status = 'approved');

-- Policies: Authenticated users can insert (pending)
CREATE POLICY "Contributors can submit images"
  ON images FOR INSERT
  WITH CHECK (status = 'pending');

-- Create functions for authentication
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT)
RETURNS TABLE(role TEXT, name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT access_keys.role, access_keys.name
  FROM access_keys
  WHERE password_hash = crypt(input_password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. Click "Run" (bottom right)
5. You should see "Success. No rows returned"

**IMPORTANT**: Replace `'your-admin-password'` with your actual admin password!

### Step 3: Get Your API Keys (2 minutes)

1. In Supabase, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these two values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...  (long string)
```

4. Open `/js/admin.js` in your website files
5. Find lines 3-4, replace with your values:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // Your URL here
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // Your key here
```

6. Save the file
7. Commit and push to GitHub

### Step 4: Enable Storage for Images (5 minutes)

1. In Supabase, go to **Storage**
2. Click "New Bucket"
3. Name: `images`
4. Public bucket: **YES** (so images can be viewed)
5. Click "Create bucket"

6. Click on the `images` bucket
7. Click **Policies** tab
8. Click "New Policy"
9. Template: "Allow public read access"
10. Click "Review" → "Save policy"

11. Create another policy for uploads:
    - Click "New Policy"
    - Custom policy:
      - Operation: INSERT
      - Target roles: `authenticated`
      - Policy name: "Authenticated users can upload"
      - Using expression: `true`
    - Click "Review" → "Save policy"

### Step 5: Update Upload Paths

In `/js/admin.js`, the system will now upload images to Supabase Storage automatically. The URLs will look like:

```
https://xxxxx.supabase.co/storage/v1/object/public/images/your-image.jpg
```

---

## Using the Admin System

### Access Levels

**Admin** (`/admin` + your admin password):
- Upload images (approved immediately)
- Review contributor submissions
- Edit/delete any content
- Manage all images

**Contributor** (`/admin` + contributor password):
- Upload images (goes to approval queue)
- View their own submissions
- Cannot edit others' work

### Uploading Images (Admin or Contributor)

1. Go to `brycho.com/admin`
2. Enter password
3. Click **Upload New** tab
4. Drag and drop images (or click to browse)
5. **Group Upload**: Multiple images = one "build" (auto-connected)
6. Fill in:
   - **Title**: Short, descriptive
   - **Description**: What's useful about this technique
   - **Tags**: Type and press Enter (3-6 tags recommended)
   - **Source**: Where it came from
   - **Protected**: Check if WIP (hidden until password entered)
7. Click **Submit**

**Admin**: Image goes live immediately
**Contributor**: Image goes to approval queue

### Reviewing Submissions (Admin Only)

1. Click **Review Queue** tab
2. See all pending submissions
3. For each submission:
   - **Approve**: Goes live on Build Book
   - **Edit**: Modify before approving
   - **Reject**: Remove from queue

### Managing Content (Admin Only)

1. Click **Manage Content** tab
2. See all approved images
3. Search, filter, or browse
4. Actions:
   - **Edit**: Update any field
   - **Protect/Unprotect**: Toggle password requirement
   - **Delete**: Remove from site

---

## Adding Images Without Admin

If you prefer to manually edit the JSON (or if Supabase isn't set up yet):

1. Prepare your images:
   - Full size in `/images/`
   - Thumbnails in `/images/thumbs/`
   - Same filename for both

2. Edit `data/inspiration-images.json`:

```json
{
  "id": "img009",
  "src": "images/my-build.jpg",
  "thumb": "images/thumbs/my-build.jpg",
  "title": "Cool Roofing Technique",
  "description": "Multi-layer roof design for depth.",
  "tags": ["roofing", "advanced", "medieval"],
  "source": {
    "platform": "youtube",
    "creator": "YourName",
    "link": "https://youtube.com/...",
    "timestamp": "5:30"
  },
  "uploadDate": "2024-02-10",
  "protected": false,
  "relatedImages": ["img001", "img002"],
  "additionalImages": []
}
```

3. Commit and push via GitHub Desktop
4. Site updates in ~30 seconds!

---

## Site-Wide Password Protection

For pages still in development:

1. Open `/js/site-password.js`
2. Line 82, edit the password and protected pages:

```javascript
// Protect all pages
window.sitePassword = new SitePassword('viking', []);

// OR protect specific pages only
window.sitePassword = new SitePassword('viking', ['sign-center', 'admin']);
```

3. In each HTML file, uncomment this line:

```html
<script src="js/site-password.js"></script>
```

4. To remove protection later, just comment it out again!

---

## Customization Guide

### Changing Colors

Edit `/css/main.css` lines 4-20:

```css
--color-accent-primary: #d4764e;  /* Orange */
--color-accent-secondary: #b85c38;
```

### Adding Your Logo

1. Save logo as `/images/logo.png`
2. Edit header in all HTML files:

```html
<div class="logo">
    <a href="index.html">
        <img src="images/logo.png" alt="Brycho" style="height: 40px;">
    </a>
</div>
```

### Changing Fonts

Edit Google Fonts link in HTML:

```html
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap" rel="stylesheet">
```

Update CSS variables:

```css
--font-display: 'YourFont', serif;
--font-body: 'YourFont', serif;
```

### Adjusting Images Per Page

Edit `/js/build-book.js` line 6:

```javascript
const ITEMS_PER_PAGE = 40; // Change to 30, 50, etc.
```

### Badge Images for Status

Replace placeholder badges in `/valheim.html`:

1. Create 100x100px PNG images
2. Save as `/images/badge-beta.png` and `/images/badge-coming-soon.png`
3. Update styles around line 70:

```css
.status-badge.beta {
    background-image: url('../images/badge-beta.png');
}

.status-badge.coming-soon {
    background-image: url('../images/badge-coming-soon.png');
}
```

---

## Troubleshooting

**Images not loading:**
- Check file paths in JSON (case-sensitive!)
- Verify images are in `/images/` and `/images/thumbs/`
- Clear browser cache (Ctrl + Shift + R)

**Supabase errors:**
- Double-check API keys in `/js/admin.js`
- Verify SQL ran successfully (no error messages)
- Check Storage bucket is public

**Password not working:**
- Admin password: Check `/js/admin.js` and Supabase
- Site password: Check `/js/site-password.js`
- Passwords are case-sensitive!

**Changes not appearing:**
- Did you commit AND push in GitHub Desktop?
- Check Netlify deploy status (should auto-deploy)
- Wait 30-60 seconds after push

**Gallery is empty:**
- Open browser console (F12) for errors
- Verify JSON is valid: https://jsonlint.com
- Check `/data/inspiration-images.json` path

---

## Next Steps

Once everything is working:

1. ✅ Remove site-wide password (keep just Sign Center protected)
2. ✅ Upload your first 10-20 images
3. ✅ Test bookmark system and sharing
4. ✅ Invite a trusted builder as contributor (test the queue)
5. ✅ Share with community!

**Future Enhancements:**
- Analytics (Google Analytics, Plausible)
- Image compression automation
- Bulk import tools
- Advanced search (by creator, date, etc.)
- User accounts and profiles

---

## Support

- **Bug**: Check browser console (F12) for errors
- **Feature request**: Leave feedback in the Build Book
- **Questions**: Check this guide first!

Built with ❤️ for the Valheim building community
