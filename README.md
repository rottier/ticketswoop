# Prerequisites
- [Node.js]([Node.js](https://nodejs.org/en))
- A package manager such as [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

# Install
```
npm install
```

# Usage
- Make sure you are logged in to Ticketswap in your browser of choice
- Close that browser
- Provide the right info to the .env file so that the script can load your logged in browser. It's recommended keep the refreshIntervalSeconds on 30 or above, to avoid locking yourself out temporarily. Example:
```
url=https://www.ticketswap.nl/event/ArtistHere/5af93f01-86f9-44ae-8c4a-1c370a957c7e
refreshIntervalSeconds=30
browserPath=C:/Program Files/Google/Chrome/Application/chrome.exe
userDataDir=C:/Users/MyUser/AppData/Local/Google/Chrome/User Data
labelAvailableTickets=Beschikbare tickets
labelBuyTicket=Koop ticket
```
- Run `npm start`
- When the process is succesful, a ticket will be added to your cart, which will abort the process. You can then checkout in your app.