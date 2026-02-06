# Setup Checklist ✓

Use this checklist to track your progress setting up the website.

## Initial Deployment

- [ ] Install GitHub Desktop
- [ ] Create repository `brycho-website`
- [ ] Add all files to repository
- [ ] Commit: "Initial website setup"
- [ ] Publish repository (make it public)
- [ ] Sign up for Netlify
- [ ] Deploy site from GitHub
- [ ] Wait for first deployment (2-3 minutes)
- [ ] Visit your Netlify URL (works!)

## Custom Domain

- [ ] Add custom domain in Netlify
- [ ] Update DNS at domain registrar
- [ ] Wait for DNS propagation (1-24 hours)
- [ ] Verify HTTPS is working
- [ ] Test all pages load

## Supabase Setup (Recommended)

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Save database password somewhere safe
- [ ] Run SQL script from SETUP-GUIDE.md
- [ ] Update admin password in SQL
- [ ] Copy Project URL and API key
- [ ] Update `/js/admin.js` with your keys
- [ ] Create Storage bucket
- [ ] Set bucket to public
- [ ] Add storage policies
- [ ] Test admin login
- [ ] Test image upload

## Content Setup

- [ ] Add your logo (optional)
- [ ] Update colors if desired
- [ ] Test password protection (Ctrl+Shift+P)
- [ ] Upload first 5-10 test images
- [ ] Verify images display correctly
- [ ] Test bookmarks system
- [ ] Test filters and search
- [ ] Check mobile view

## Going Live

- [ ] Remove site-wide password
  - [ ] Comment out `<script src="js/site-password.js"></script>` in HTML files
  - [ ] OR edit protected pages array to only include sign-center
- [ ] Keep Sign Center protected
- [ ] Upload your real content
- [ ] Test all features one more time
- [ ] Share with community!

## Optional Enhancements

- [ ] Create custom badge images for project cards
- [ ] Set up Google Analytics or Plausible
- [ ] Add more images to Build Book
- [ ] Invite trusted contributor (test approval queue)
- [ ] Create first blog post structure

## Troubleshooting Completed

- [ ] All images loading correctly
- [ ] Bookmarks working
- [ ] Filters working
- [ ] Mobile navigation working
- [ ] Admin panel accessible
- [ ] Password protection working
- [ ] No console errors

## Notes

Write any custom configurations or passwords here (delete before committing to GitHub!):

Admin Password: ___________________
Site Password: ___________________
Contributor Password: ___________________
Supabase Project URL: ___________________

---

Once everything is ✓, you're done! 🎉

Remember to:
- Commit and push changes regularly
- Keep your passwords secure
- Back up your Supabase project
- Monitor the approval queue if you have contributors
