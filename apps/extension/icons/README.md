# Extension Icons

For production, you need to create PNG icons in the following sizes:

- **icon16.png**: 16x16 pixels (toolbar icon)
- **icon48.png**: 48x48 pixels (extension management page)
- **icon128.png**: 128x128 pixels (Chrome Web Store)

## Creating Icons

You can use the `icon.svg` file as a template and export to PNG:

### Using Figma/Sketch/Adobe XD
1. Import `icon.svg`
2. Export as PNG at 16x16, 48x48, and 128x128

### Using ImageMagick (Command Line)
```bash
# Install ImageMagick if needed
brew install imagemagick

# Convert SVG to PNG at different sizes
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Using Online Tools
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)

## Design Guidelines

- Use Apple Blue gradient (#007AFF to #0051D5)
- Include sparkle/star icon (represents AI)
- Keep design simple and recognizable at small sizes
- Use rounded corners (28px radius for 128x128)
- Ensure good contrast on both light and dark backgrounds

## Temporary Placeholder

For development, you can use a simple colored square:
```bash
# Create solid blue placeholders
convert -size 16x16 xc:#007AFF icon16.png
convert -size 48x48 xc:#007AFF icon48.png
convert -size 128x128 xc:#007AFF icon128.png
```
