
## Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/xli983/webgl-electron.git
cd webgl-electron
```

### 2. Install Dependencies

Run the following command in your terminal:

```bash
npm install
```

### 3. Run the Application

Start the Electron application with:

```bash
npm start
```

### 4. Create a Distribution

To package the app for distribution, run:

```bash
npm install --save-dev electron-packager
npx electron-packager . somerandomnamefortheapp --platform=win32 --arch=x64 --out=dist
```

This will generate a distributable version of your app in the `dist` folder.
```
