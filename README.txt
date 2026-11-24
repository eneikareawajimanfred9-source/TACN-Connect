TACN CONNECT — ANDROID + GITHUB STARTER
========================================

WHAT THIS PACKAGE INCLUDES
- Email/password registration and login
- Public feed, text posts, image/video upload
- Likes and comments
- One-to-one text messages using a member's User ID
- Creator wallet and withdrawal request form
- Secure server-side 20% creator share ledger for verified revenue
- Firestore and Storage security rules

IMPORTANT LIMITS
This is a functional starter, not a finished, audited commercial social network.
The 20% share is calculated only when an administrator records real revenue
actually received and attributed to a specific post/video. Likes, views, time
spent, or posting do not themselves create revenue. No ad network or sponsor
payment provider is connected yet. Withdrawal requests are submitted for manual
review; this package does not send bank transfers. Before handling real money,
get legal/accounting advice, publish terms/privacy/content rules, and test with
dummy accounts and small non-cash amounts.

PART A — CREATE FIREBASE PROJECT
1. On your Android phone open https://console.firebase.google.com/
2. Sign in with Google and tap Add project. Name it tacn-connect.
3. Open Build > Authentication > Get started > Sign-in method.
4. Enable Email/Password and save.
5. Open Build > Firestore Database > Create database. Start in production mode.
6. Open Build > Storage > Get started. Follow the prompts.
7. Project settings (gear) > General > Your apps > Web app (</>) > Register app.
8. Copy the Firebase web configuration values.

PART B — ADD CONFIGURATION
1. Open app.js in this ZIP.
2. Find const firebaseConfig = { ... } near the top.
3. Replace each PASTE_... value with the matching value from Firebase.
4. Do not share this config screenshot with passwords or private keys. Firebase
   web config is intended for the browser; security comes from the rules below.

PART C — PUBLISH FILES TO GITHUB (PHONE)
1. Extract the ZIP on your phone (Files app > Downloads > tap ZIP > Extract).
2. Open your GitHub repository TACN-Connect.
3. Upload/replace index.html and app.js in the repository root.
4. Upload the firestore.rules and storage.rules files too (they can stay in repo
   as reference; they are not automatically applied by GitHub Pages).
5. GitHub Pages settings should use Branch: main and Folder: /(root).
6. Wait for the Pages deployment. Open:
   https://eneikareawajimanfred9-source.github.io/TACN-Connect/

PART D — APPLY FIREBASE SECURITY RULES
1. Firebase Console > Firestore Database > Rules.
2. Replace the rules with the contents of firestore.rules in this package.
3. Tap Publish.
4. Firebase Console > Storage > Rules.
5. Replace the rules with storage.rules and tap Publish.
6. If you use a different Firebase project, ensure the web app config matches it.

PART E — TURN ON 20% CREATOR REVENUE CREDIT (ADMIN BACKEND)
This part requires a computer or a cloud development environment with Node.js
and Firebase CLI. It cannot be safely enabled by adding browser JavaScript.
1. Install Node.js and Firebase CLI in a trusted development environment.
2. In the functions folder run: npm install firebase-admin firebase-functions
3. Deploy with Firebase CLI: firebase deploy --only functions
4. Set a custom admin claim for your trusted administrator account using the
   Firebase Admin SDK from a secure server environment. Do not put service
   account keys in index.html, app.js, GitHub Pages, or public repositories.
5. Connect a real sponsor/ad revenue source and verify each payment before
   calling recordCreatorRevenue with its unique reference, postId and gross
   amount in kobo. The function credits floor(gross * 20%) to the post owner.
6. Test duplicate references, invalid post IDs, refunds, chargebacks, fraud,
   tax, minimum payout, and withdrawal review before launch.

FUNCTION DEPLOYMENT FILE
Create functions/package.json with:
{
  "name": "tacn-connect-functions",
  "private": true,
  "engines": {"node": "20"},
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  }
}

CREATE FIREBASE INDEXES IF PROMPTED
If Firestore shows a link to create an index, open it and accept the suggested
index. The feed and chat queries may prompt for indexes as the app grows.

CURRENT SECURITY / PRODUCT NOTES
- Users can read public member profiles and posts after signing in.
- Withdrawal bank details are stored for administrator review. Restrict admin
  access and publish a privacy policy before collecting these details.
- This starter has no report/block/moderation console, password reset UI,
  account deletion flow, push notifications, audio/video calls, or automated
  payout provider. Add these before a public commercial launch.
- Video file uploads are limited to 50 MB in this starter.
