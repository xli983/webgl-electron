1. Clone the repo
2. Install Dependencies using cmd
   npm install
3. Run the Application using cmd
   npm start
4. To create a Distribution:
   npm install --save-dev electron-packager
   npx electron-packager . somerandomnamefortheapp --platform=win32 --arch=x64 --out=dist
