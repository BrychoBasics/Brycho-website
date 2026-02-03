# Images Folder

## How to Add Images

1. **Full-size images** go directly in this `images/` folder
2. **Thumbnails** go in the `images/thumbs/` subfolder

## Image Guidelines

### Full Images
- **Format**: JPG or PNG
- **Max size**: 2MB per image (compress if needed)
- **Dimensions**: 1200-2000px wide is ideal
- **Naming**: Use descriptive names with hyphens (no spaces)
  - ✅ `viking-great-hall.jpg`
  - ✅ `roofing-technique-layered.png`
  - ❌ `IMG_1234.jpg`
  - ❌ `My Cool Build.jpg`

### Thumbnails
- **Format**: JPG (smaller file size)
- **Dimensions**: ~400x300px (4:3 ratio)
- **Naming**: Same name as the full image
  - Full: `images/viking-hall.jpg`
  - Thumb: `images/thumbs/viking-hall.jpg`

## Compression Tips

Large files slow down your site! Compress images before uploading:

- **Online**: Use https://tinypng.com or https://squoosh.app
- **Desktop**: Use ImageOptim (Mac) or FileOptimizer (Windows)
- **Target**: Under 500KB for full images, under 50KB for thumbnails

## Example Structure

```
images/
├── viking-hall.jpg (full image)
├── roofing-technique.jpg
├── stone-archway.png
└── thumbs/
    ├── viking-hall.jpg (thumbnail)
    ├── roofing-technique.jpg
    └── stone-archway.png
```

## After Adding Images

1. Add the image entry to `data/inspiration-images.json`
2. Commit and push via GitHub Desktop
3. Your site auto-updates!

Happy building! 🏰
