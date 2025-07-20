require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

console.log(`Passport configuration loaded with Google OAuth strategy.`);
console.log(`Google Client ID: ${process.env.GOOGLE_CLIENT_ID}`);
console.log(`Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET}`);
console.log(`Google Callback URL: ${process.env.GOOGLE_CALLBACK_URL}`);


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, 
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});