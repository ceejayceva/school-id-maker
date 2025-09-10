# School ID Maker - Web Version

A web-based School ID Card Maker application that runs entirely in the browser

## 🚀 Features

- **Create Custom ID Cards** - Design front and back sides of school ID cards
- **Real-time Editing** - Edit all fields with instant preview
- **Image Upload** - Upload custom photos and school logos
- **QR Code Generation** - Automatic QR code generation from LRN
- **Download Options** - Download as PNG or PDF for both front and back sides
- **Data Persistence** - Saves data locally in browser storage
- **Responsive Design** - Works on desktop and mobile browsers
- **Form Validation** - LRN field accepts only 12 numeric characters
- **Progress Indicators** - Visual feedback during downloads

## 📁 Project Structure

```
webversion/
├── index.html          # Main HTML file
├── script-web.js       # Web-compatible JavaScript
├── style.css           # CSS styles
├── README.md           # This file
├── img/               # Image assets
│   ├── schoollogo.png
│   ├── deped-logo.png
│   └── empty-avatar.png
├── js/                # JavaScript libraries
│   ├── html2canvas.min.js
│   └── qrious.min.js
└── css/               # CSS libraries
    └── normalize.css
```

## 🛠️ Technologies Used

- **HTML5** - Semantic markup and form elements
- **CSS3** - Modern styling with responsive design
- **JavaScript (ES6+)** - Web-compatible functionality
- **localStorage** - Client-side data persistence
- **html2canvas** - Screenshot generation for downloads
- **jsPDF** - PDF generation
- **QRious** - QR code generation

## 🌐 Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment Instructions

### Option 1: Quick Start with Node.js (Recommended)

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/

2. **Start the server**
   ```bash
   cd webversion
   npm install  # Install dependencies (if any)
   npm start    # Start the development server
   ```

3. **Open your browser**
   - Go to: `http://localhost:8000`
   - The app will be running immediately!

### Option 2: Other Local Development Servers

1. **Using Python (Simple HTTP Server)**
   ```bash
   cd webversion
   python -m http.server 8000
   ```
   Then open: `http://localhost:8000`

2. **Using Node.js (http-server)**
   ```bash
   npm install -g http-server
   cd webversion
   http-server -p 8000
   ```
   Then open: `http://localhost:8000`

3. **Using PHP**
   ```bash
   cd webversion
   php -S localhost:8000
   ```
   Then open: `http://localhost:8000`

### Option 2: Web Server Deployment

1. **Upload to Web Server**
   - Upload all files in the `webversion/` folder to your web server
   - Ensure the server supports static file serving
   - No special server-side configuration required

2. **Supported Web Servers**
   - Apache HTTP Server
   - Nginx
   - IIS
   - Any static file server

### Option 3: GitHub Pages (Free)

1. **Create GitHub Repository**
   - Create a new repository on GitHub
   - Upload all files from `webversion/` folder

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Save changes

3. **Access Your App**
   - Your app will be available at: `https://yourusername.github.io/repository-name`

## 📋 Usage Guide

### Creating an ID Card

1. **Edit Basic Information**
   - Name, LRN, Birthdate, Gender, Grade/Section
   - LRN field only accepts 12 numeric characters

2. **Upload Images**
   - Click on photo placeholder to upload student photo
   - Click on logo area to upload school logo

3. **Customize School Information**
   - School name and address
   - School head name and position
   - School year selection

4. **Add Emergency Contact**
   - Parent/Guardian name
   - Residence address
   - Mobile number

### Downloading ID Cards

1. **PNG Download**
   - Click "Download PNG" to download current visible side as PNG
   - High-resolution image suitable for printing

2. **PDF Download**
   - Click "Download PDF" to download current visible side as PDF
   - Optimized for document sharing

3. **Toggle Sides**
   - Use "Show Back" button to switch between front and back sides
   - Download buttons automatically detect which side is visible

### Managing Saved IDs

1. **Save Current ID**
   - Click "Add to List" to save current ID configuration
   - Data is stored locally in your browser

2. **Load Saved ID**
   - Click "Load" button next to any saved ID
   - All fields and images will be restored

3. **Delete Saved ID**
   - Click "Delete" button next to any saved ID
   - Confirmation dialog will appear

## 🔧 Configuration

### Default Values

You can modify default values in `script-web.js`:

```javascript
// Default field values
const defaultValues = {
  name: "Juan D. Cruz",
  lrn: "108794888829",
  // ... other defaults
};
```

### Styling Customization

Modify `style.css` to customize:
- Color scheme
- Font sizes
- Layout dimensions
- Button styles

## 🗄️ Data Storage

- **localStorage** - Used for:
  - Form field values
  - Uploaded images (base64 encoded)
  - Saved ID configurations
  - User preferences

- **No server-side storage** - All data stays in the browser
- **Data persistence** - Survives browser restarts
- **Privacy** - No data sent to external servers

## 🔒 Security & Privacy

- **Client-side only** - No server communication
- **No external dependencies** - All libraries loaded locally
- **Data stays local** - No data sent to servers
- **No tracking** - No analytics or tracking scripts
- **Safe for offline use** - Works without internet connection

## 🐛 Troubleshooting

### Common Issues

1. **Images not uploading**
   - Check browser console for CORS errors
   - Ensure images are not too large (>5MB)
   - Try different image formats (JPG, PNG)

2. **Downloads not working**
   - Check browser's download settings
   - Ensure pop-ups are not blocked
   - Try different browsers

3. **Data not saving**
   - Check browser's localStorage is enabled
   - Clear browser cache if issues persist

4. **Mobile display issues**
   - Ensure viewport meta tag is present
   - Test on different screen sizes

### Browser-Specific Notes

- **Safari**: May require user interaction before downloads
- **Firefox**: Check download folder permissions
- **Mobile**: Use responsive design features

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Verify all files are properly uploaded
3. Test with different browsers
4. Check network connectivity for CDN resources

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **html2canvas** - Screenshot generation
- **jsPDF** - PDF generation
- **QRious** - QR code generation
- **Normalize.css** - CSS reset

---

**Ready to deploy!** 🚀 Upload the `webversion/` folder to any web server and start creating school ID cards immediately.