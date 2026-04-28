# pCloud Drive Index

![GitHub Repo stars](https://img.shields.io/github/stars/vinayak-7-0-3/pcloud-drive-index?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/vinayak-7-0-3/pcloud-drive-index?style=for-the-badge)
[![Static Badge](https://img.shields.io/badge/support-blue?style=for-the-badge)](https://t.me/weebzgroup)

A modern, responsive web interface for viewing your pCloud storage with secure authentication.  
Built with **HTML5 + JavaScript + Cloudflare Workers**

## ✨ FEATURES

- **🔐 Secure Authentication** - JWT-based login system with configurable credentials
- **📁 No File Management** - Easy to make your drive public
- **⬇️ Download Files** - Direct download links and streaming support
- **🔗 Link Sharing** - Generate direct download link - with Cloudflare proxy
- **📊 Storage Analytics** - Real-time storage usage monitoring
- **🔍 Search & Sort** - Find files quickly with search and sorting options
- **🎨 Modern UI** - Dark/light theme toggle with glassmorphic design
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## TODO
- Resume support in download links.
- View Files directly (images/videos)
- Variable for switching pCloud Region

## 🖼️ Screenshots

### Login Screen
<img src="/demo/login-view-light.png" />

### File Browser

<img src="/demo/drive-view-dark.png" />
<img src="/demo/drive-view-light.png" />


## 🚀 DEPLOYMENT

### 1) CLOUDFLARE WORKERS (Recommended)

**Requirements**
- Cloudflare account
- pCloud API access token

**Steps**
1. Navigate to Cloudflare Workers dashboard
2. Create a new Worker
3. Copy the contents of `worker.js` to your Worker
4. Set up environment variables (see [Variables Info](#-variables-info))
5. Deploy the Worker


### 2) DOCKER DEPLOYMENT (Frontend)

**Requirements**
- Docker installed

**Steps**
```bash
# Clone the repository
git clone https://github.com/vinayak-7-0-3/pcloud-drive-index.git
cd pcloud-drive-index
```
Edit `index.html` : See [this](#html-configuration)

**Build the Docker image**
```
docker build -t pcloud-drive .

# Run the container
docker run -d -p 80:80 pcloud-drive
```

### 3) STATIC HOSTING (Cloudflare Pages Possible)

**Requirements**
- Web server (Nginx, Apache, or static hosting service)
- Deployed Cloudflare Worker for API backend

**Steps**
1. Deploy the `worker.js` to Cloudflare Workers first
2. Edit `index.html` : See [this](#html-configuration)
3. Upload `index.html` and `assets/` folder to your web server
4. Configure your web server to serve the files

## ⚙️ VARIABLES INFO

### CLOUDFLARE WORKER ENVIRONMENT VARIABLES

#### ESSENTIAL VARIABLES (Cloudflare Workers)
- `PCLOUD_TOKEN` - Your pCloud API access token (see the guide [here](#-access-token-guide)) `(string)`
- `PCLOUD_USERNAME` - Username for Index login `(string)`
- `PCLOUD_PASSWORD` - Password for Index login `(string)`
- `JWT_SECRET` - Secret key for JWT token signing (use a strong random string - recommended length 32) `(string)`

#### OPTIONAL VARIABLES
- `CORS_ORIGIN` - Allowed CORS origins (default: '*') `(string)`
- `TOKEN_EXPIRY` - JWT token expiration time in seconds (default: 43200 = 12 hours) `(number)`

### HTML CONFIGURATION

Update the following variable in your `index.html`:
```javascript
let apiBaseUrl = 'https://your-worker-name.your-subdomain.workers.dev';
```

## 📋 ACCESS TOKEN GUIDE

### Method 1: From pCloud API Website
**⚠️THE PCLOUD WEB SITE SOMEHOW RESTRICTS CREATING A NEW APP⚠️**
1. Visit [pCloud App Console](https://docs.pcloud.com/)
2. Create a new application
3. Generate an access token with required permissions:
   - File read access
   - File download access
   - Folder listing access

### Method 2: Using Rclone
1. Download Rclone
2. Run rclone config
3. Select pCloud
4. Enter the necessary informations
5. In the end you will get `access_token`

## 🔧 API ENDPOINTS (Worker)

The Cloudflare Worker provides the following API endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/files?path={path}` - List files and folders
- `GET /api/storage` - Get storage usage information
- `GET /api/download?fileId={id}&name={filename}` - Generate download links
- `GET /api/download?fileId={id}&stream=1` - Stream files directly



## 🎨 CUSTOMIZATION

### Styling
Modify CSS custom properties in the `:root` selector to customize colors and styling:
```css
:root {
    --primary: #6366f1;
    --secondary: #a855f7;
    --success: #10b981;
    /* ... other variables */
}
```

## 🤝 CONTRIBUTING

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 LICENSE

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 💝 Support

If this project helps you, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 🔄 Contributing code improvements

---