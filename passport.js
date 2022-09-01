const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.serializeUser((user , done) => {
	done(null , user);
})
passport.deserializeUser(function(user, done) {
	done(null, user);
});

passport.use(new GoogleStrategy({
	clientID:"761872814015-0baktgbiqjhoic794hfb4cqbhbjalgp8.apps.googleusercontent.com", // Your Credentials here.
	clientSecret:"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", // Your Credentials here.
	callbackURL:"http://localhost:8080/auth/callback",
	passReqToCallback:true
},
function(request, accessToken, refreshToken, profile, done) {
    //console.log(profile);
	return done(null, profile);
}
));
