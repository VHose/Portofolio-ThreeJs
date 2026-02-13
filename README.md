# 3D Portfolio Customization Guide

## 1. Changing Social Media Icons
You can customize the social media icons by editing `js/main.js`.
Look for the `createIconFrame` function around line **1339**:

```javascript
    // Icon Texture
    const iconGeo = new THREE.PlaneGeometry(size * 0.6, size * 0.6);
    const iconUrls = {
        'email': 'YOUR_EMAIL_ICON_URL',
        'linkedin': 'YOUR_LINKEDIN_ICON_URL',
        'github': 'YOUR_GITHUB_ICON_URL', 
        'instagram': 'YOUR_INSTAGRAM_ICON_URL'
    };
```

Simply replace the URLs with your own image links (e.g., `'assets/img/my-logo.png'`).

## 2. Changing Frame Colors
The frame colors are defined in the same function:

```javascript
    // Brand Colors
    const brandColors = {
        'email': 0xEA4335,     // Gmail Red
        'linkedin': 0x0A66C2,  // LinkedIn Blue
        'github': 0x181717,    // GitHub Black
        'instagram': 0xE4405F  // Instagram Pink
    };
```

Change the hex codes (e.g., `0xFF0000`) to match your preferred brand colors.
