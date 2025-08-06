require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Only configure Google OAuth if environment variables are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
  }, 
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));
} else {
  console.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});