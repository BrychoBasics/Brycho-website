# Brycho.com - Build Book Setup Guide

Welcome! This is your complete Valheim building inspiration website. This guide will walk you through everything you need to get it live and start adding your content.

## 🎯 What You Have

- **Build Book** - A filterable gallery of building inspiration images
- **Bookmark System** - Users can save favorites with shareable codes
- **Password Protection** - Hide WIP content from public view
- **Mobile Responsive** - Works perfectly on all devices
- **Nordic Workshop Theme** - Warm, craftsman aesthetic with custom fonts

## 📁 File Structure

```
brycho-website/
├── index.html              # Homepage
├── build-book.html         # Main inspiration gallery
├── sign-center.html        # (Coming in Phase 2)
├── css/
│   ├── main.css           # Shared styles (header, buttons, layout)
│   └── build-book.css     # Gallery-specific styles
├── js/
│   ├── bookmarks.js       # Bookmark system (shared)
│   └── build-book.js      # Gallery functionality
├── data/
│   └── inspiration-images.json  # Your image database
└── images/
    ├── (your full-size images)
    └── thumbs/
        └── (your thumbnails)
```

## 🚀 Quick Start Guide

### Step 1: Install GitHub Desktop (5 minutes)

1. Download GitHub Desktop: https://desktop.github.com/
2. Install and open it
3. Sign up for a free GitHub account (or sign in)
4. That's it! You've learned Git. 😊

### Step 2: Create Your Repository (3 minutes)

1. In GitHub Desktop, click **File → New Repository**
2. Name: `brycho-website`
3. Local Path: Choose where to save (like `Documents/`)
4. Click **Create Repository**
5. Click **Publish Repository** button
6. Uncheck "Keep this code private" (so it works with free hosting)
7. Click **Publish**

### Step 3: Add Your Website Files (2 minutes)

1. Find your repository folder (the button in GitHub Desktop shows you)
2. Copy ALL the files I gave you into that folder
3. GitHub Desktop will show all the new files
4. In the bottom left:
   - Summary: "Initial website setup"
   - Click **Commit to main**
5. Click **Push origin** (uploads to GitHub)

### Step 4: Deploy to Netlify (5 minutes)

1. Go to https://netlify.com and sign up (use "Sign up with GitHub")
2. Click **Add new site → Import an existing project**
3. Click **GitHub** and authorize Netlify
4. Find and select `brycho-website`
5. Leave all settings as default
6. Click **Deploy site**
7. Wait 30 seconds... Done! 🎉

### Step 5: Set Up Your Domain (10 minutes)

1. In Netlify, click **Domain settings**
2. Click **Add custom domain**
3. Enter: `brycho.com`
4. Follow the DNS instructions (point your domain to Netlify)
5. Wait for DNS to propagate (up to 24 hours, usually 1-2 hours)

**Bonus**: Set up the short URL redirect:
- In Netlify, create a `_redirects` file with:
  ```
  /build    /build-book.html
  /signs    /sign-center.html
  ```

## ✏️ Adding Your Images (The Important Part!)

### Image Preparation

**Before adding to the site:**

1. **Full images**: Save in `images/` folder
   - Format: JPG or PNG
   - Size: Max 2MB each (compress if needed)
   - Name: `viking-hall.jpg` (descriptive, no spaces)

2. **Thumbnails**: Save in `images/thumbs/` folder
   - Same name as full image
   - Size: 400x300px (or similar ratio)
   - Compressed for fast loading

### Adding an Image to Build Book

Open `data/inspiration-images.json` and add a new entry:

```json
{
  "id": "img009",
  "src": "images/your-image.jpg",
  "thumb": "images/thumbs/your-image.jpg",
  "title": "Your Building Technique",
  "description": "Detailed description of what this shows and how it's useful.",
  "tags": ["roofing", "advanced", "stone", "your-tags-here"],
  "source": {
    "platform": "youtube",
    "creator": "BrychoBasics",
    "link": "https://youtube.com/watch?v=yourlink",
    "timestamp": "5:30"
  },
  "uploadDate": "2024-02-03",
  "protected": false,
  "relatedImages": ["img001", "img002"],
  "additionalImages": []
}
```

**Field Guide:**
- `id`: Unique identifier (img009, img010, etc.)
- `src`: Path to full image
- `thumb`: Path to thumbnail (optional, uses src if blank)
- `title`: Short, descriptive title
- `description`: What the image shows (1-2 sentences)
- `tags`: Array of tags for filtering
- `platform`: youtube, twitch, reddit, instagram, discord, web, or custom
- `creator`: Name of source creator
- `link`: URL to source (null if none)
- `protected`: true = password required, false = public
- `relatedImages`: Array of other image IDs
- `additionalImages`: More views of same thing (shows in lightbox)

### Updating the Website

After adding images:

1. **Save** the JSON file
2. Open **GitHub Desktop**
3. You'll see your changes listed
4. Bottom left:
   - Summary: "Added 5 new roofing techniques"
   - Description: (optional details)
5. Click **Commit to main**
6. Click **Push origin**
7. Wait 30 seconds - Netlify auto-deploys!
8. Refresh your website - new images appear! ✨

## 🎨 Customization Guide

### Changing Colors

Edit `css/main.css` at the top (lines 1-40):

```css
:root {
    --color-accent-primary: #d4764e;  /* Main orange */
    --color-accent-secondary: #b85c38; /* Darker orange */
    --color-bg-primary: #1a1612;      /* Dark background */
    /* ... change any of these! */
}
```

Save → Commit → Push → Live in 30 seconds

### Adding Your Logo

1. Save your logo as `images/logo.png`
2. Edit `build-book.html` (and `index.html`) around line 53:
   ```html
   <div class="logo">
       <a href="index.html">
           <img src="images/logo.png" alt="Brycho" style="height: 40px;">
       </a>
   </div>
   ```
3. Commit → Push → Done!

### Changing Password

Edit `js/build-book.js` line 7:
```javascript
const PASSWORD = 'your-new-password'; // Change this!
```

### Changing Fonts

Edit the Google Fonts link in HTML files (around line 10):
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap" rel="stylesheet">
```

Then update CSS variables:
```css
--font-display: 'YourFont', serif;
```

## 🔐 Password Protection

**To access protected images:**

1. Press `Ctrl + Shift + P` on the Build Book page
2. Enter password (default: `viking`)
3. Protected images now visible (session only)

**To make an image protected:**
Set `"protected": true` in the JSON entry

## 🔖 Bookmark System

**How it works:**
- Bookmarks save to browser (no account needed)
- Each user gets unique code (like `BV7K-2M9X`)
- Share link includes all bookmarks
- Works across all Brycho pages

**Shareable link format:**
```
brycho.com/build-book?bookmarks=BV7K2M9X
```

## 📊 Tag Categories

Tags auto-organize into categories. Current logic (in `build-book.js`):

- **Building Type**: hall, house, tower, bridge
- **Technique**: roofing, timber, stone, flooring
- **Style**: medieval, viking, modern
- **Difficulty**: easy, medium, hard, advanced

Add your own tags freely! The system adapts.

## 🐛 Troubleshooting

**Images not showing:**
- Check file paths match JSON exactly
- File names are case-sensitive
- Make sure images are in the `/images` folder

**Changes not appearing:**
- Did you commit AND push in GitHub Desktop?
- Clear browser cache (Ctrl + Shift + R)
- Check Netlify deploy status

**Gallery is empty:**
- Check browser console (F12) for errors
- Verify `inspiration-images.json` is valid JSON
- Use https://jsonlint.com to validate

**Password not working:**
- Check `js/build-book.js` line 7
- Password is case-sensitive
- Clear session storage in browser DevTools

## 🎓 Learning Git (5-Minute Version)

**The Three Steps (Every Time):**

1. **Make changes** - Edit files on your computer
2. **Commit** - GitHub Desktop → Describe changes → Commit
3. **Push** - Click "Push origin" → Uploads to internet

That's literally it. You're now using Git! 🎉

**Bonus Commands:**
- **Pull** - Download changes (if editing from multiple computers)
- **History** - See all past changes, restore old versions

## 🚀 Next Steps

**Phase 2** (coming soon):
- Sign Center page
- More customization options
- Analytics integration

**Your Tasks:**
1. ✅ Get website live
2. ✅ Add your logo
3. ✅ Upload first 10-20 images
4. ✅ Customize colors to match brand
5. Share with community! 🎊

## 💡 Tips for Success

**Image Naming:**
- ✅ `viking-hall-entrance.jpg`
- ❌ `IMG_1234.jpg`
- ❌ `My Amazing Build #5.jpg` (no spaces!)

**Writing Descriptions:**
- Focus on what's useful (techniques, measurements)
- 1-2 sentences is perfect
- Mention materials/biomes if relevant

**Choosing Tags:**
- Use 3-6 tags per image
- Mix categories (type + technique + style)
- Be consistent with spelling

**Organizing Content:**
- Start with your best work
- Group related techniques together (use relatedImages)
- Use uploadDate to control display order

## 📞 Need Help?

**Common Questions:**
- "How do I...?" → Check this README first
- "Something broke!" → Check browser console (F12)
- "Git is confusing!" → GitHub Desktop makes it visual - just click buttons

**Resources:**
- GitHub Desktop Guide: https://docs.github.com/en/desktop
- Netlify Docs: https://docs.netlify.com
- JSON Validator: https://jsonlint.com

---

**You've got this!** The hardest part is done. Now just add your images and share your builds with the community. 🏰⚔️

*Built with ❤️ for the Valheim building community*
