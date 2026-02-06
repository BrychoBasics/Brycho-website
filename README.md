# Brycho Website - Valheim Building Resources

A complete, production-ready website for the Valheim building community featuring:

- **Build Book** - Filterable gallery of building techniques with bookmarks
- **Admin System** - Secure image management with Supabase
- **Mobile-First Design** - Responsive Nordic workshop aesthetic
- **Password Protection** - Hide WIP content from public view

## 🚀 Quick Start

1. **Deploy** (5 minutes)
   - Upload to GitHub
   - Deploy on Netlify (free)
   - Connect custom domain

2. **Setup Supabase** (15 minutes - optional but recommended)
   - Follow instructions in `SETUP-GUIDE.md`
   - Enables secure admin system
   - Handles hundreds of images efficiently

3. **Add Content**
   - Use `/admin` page to upload images
   - OR manually edit `data/inspiration-images.json`

4. **Go Live!**
   - Remove site-wide password
   - Share with community

## 📁 File Structure

```
brycho-website/
├── index.html                 # Redirects to Valheim
├── valheim.html              # Project landing page
├── build-book.html           # Main gallery
├── sign-center.html          # Coming soon
├── admin.html                # Admin interface
├── css/
│   ├── main.css             # Core styles + navigation
│   ├── build-book.css       # Gallery styles
│   └── admin.css            # Admin styles
├── js/
│   ├── navigation.js        # Hamburger menu
│   ├── site-password.js     # Simple page protection
│   ├── bookmarks.js         # Bookmark system
│   ├── build-book.js        # Gallery functionality
│   └── admin.js             # Admin + Supabase
├── data/
│   ├── inspiration-images.json      # Your images
│   └── pending-submissions.json     # Contributor queue
└── images/                   # Your image files
    └── thumbs/              # Thumbnails

## 📚 Documentation

- **`SETUP-GUIDE.md`** - Complete setup instructions with Supabase
- **Comments in code** - Explanations of how everything works

## ✨ Features

### Build Book
- Advanced filtering (tags, search, match all/any)
- Bookmark system with shareable codes
- Pagination (40 images per page)
- Password-protected images
- Lightbox with related content
- Mobile responsive

### Admin System
- **Two access levels**: Admin (full control) + Contributor (submit only)
- **Drag & drop upload**: Multiple images = one connected "build"
- **Approval queue**: Review contributor submissions
- **Manage content**: Edit or delete any image
- **Supabase integration**: Secure, scalable, free tier

### Design
- Nordic workshop theme
- Warm color palette
- Custom fonts (Cinzel + Lora)
- Smooth animations
- Dark mode optimized

## 🎨 Customization

### Quick Changes
- **Colors**: Edit `/css/main.css` lines 4-20
- **Logo**: Replace placeholder in HTML files
- **Fonts**: Update Google Fonts links
- **Password**: Edit `/js/admin.js` or Supabase table
- **Images per page**: Edit `/js/build-book.js` line 6

See `SETUP-GUIDE.md` for detailed instructions.

## 🔐 Security

**Site Password** (`/js/site-password.js`):
- Simple client-side protection
- Use for WIP pages only
- NOT secure against determined users

**Admin Password** (Supabase):
- Actually secure
- Passwords hashed in database
- Required for production use

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Supabase (PostgreSQL + Storage)
- **Hosting**: Netlify (free tier)
- **Fonts**: Google Fonts
- **Icons**: Font Awesome

No build process required - just upload and go!

## 📖 Usage Examples

### Adding an Image (Manual)

```json
{
  "id": "img009",
  "src": "images/my-build.jpg",
  "thumb": "images/thumbs/my-build.jpg",
  "title": "Advanced Roof Technique",
  "description": "Multi-layer roofing with offset shingles.",
  "tags": ["roofing", "advanced", "medieval"],
  "source": {
    "platform": "youtube",
    "creator": "YourName",
    "link": "https://youtube.com/...",
    "timestamp": "5:30"
  },
  "uploadDate": "2024-02-10",
  "protected": false,
  "relatedImages": [],
  "additionalImages": []
}
```

### Protected Pages

In any HTML file:
```html
<!-- Uncomment to protect this page -->
<script src="js/site-password.js"></script>
```

Edit `/js/site-password.js` line 82 to set password and pages.

## 🐛 Troubleshooting

**Images not showing?**
- Check file paths (case-sensitive!)
- Verify images are in `/images/` and `/images/thumbs/`
- Clear browser cache

**Password not working?**
- Check `/js/admin.js` for admin password
- Check `/js/site-password.js` for site password
- Passwords are case-sensitive

**Changes not live?**
- Commit AND push in GitHub Desktop
- Wait 30-60 seconds for Netlify deploy
- Clear browser cache

**More help**: Check `SETUP-GUIDE.md` → Troubleshooting section

## 🎯 Roadmap

### Phase 1 - Build Book (Complete! ✅)
- Gallery with filtering
- Bookmark system
- Password protection
- Admin interface

### Phase 2 - Sign Center (In Progress)
- Unity rich text preview
- Font size calculator
- Copy-paste formatting

### Phase 3 - Centering Guide (Planned)
- Precise placement tool
- Distance calculator
- Grid overlay

## 📝 License

Built for the Valheim community. Use freely, credit appreciated!

All content belongs to original creators - see source links.

## 🤝 Contributing

Want to help improve the site?
- Submit builds via the admin system
- Report bugs or suggest features
- Share with other builders!

---

**Built with ❤️ for Vikings**

Questions? Check `SETUP-GUIDE.md` or leave feedback in the Build Book!
