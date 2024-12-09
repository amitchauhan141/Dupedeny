# dupedeny-chromeExtension

1. Git clone the repo:
   ```
   git clone git@github.com:DupeDeny/dupedeny-chromeExtension.git
   ```

2. Navigate to directory
   ```
   cd dupedeny-chromeExtension
   ```

3. Install dependencies
   ```
   nvm install node
   npm install mongodb
   npm install express
   npm install -g nodemon
   npm install mongoose
   npm install dotenv
   npm install cors
   ```
   
4. Navigate to :
   ```
   cd DDAS/server/
   ```
   
5. Run the server:
   ```
   npm run dev 
   ```
   OR
   ```
   node server.js
   ```			
   	
6. Open Chrome: Load unpacked (load Client folder of this project)

7. Click on extension icon : Enter Lgin credentials 
   
   user1 - user1@example.com, password1
   user2 - user2@example.com, password2
   user3 - user3@example.com, password3
   user4 - user4@example.com, password4
   
   After Successfull Login, ope seviceworker console to monitor logs.
   
7. Start Testing by downloading the files
   
   Check service worker console for any errors.
