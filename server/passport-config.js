const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

function initPassport(passport, getUserByName, getUserById){
    const auth = async (name, password, done) => {
        const user = getUserByName(name);
        if (user == null){
            return done(null, false, { message: 'No user'} );
        }
        try {
            if(await bcrypt.compare(password, user.password)){
                return done(null, user);            
            }else{
                return done(null, false, { message: 'Wrong password'});
            }
        } catch (error) {
            return done(error);            
        }
    }
    passport.use(new LocalStrategy({usernameField: 'name', passwordField: 'password'}, auth));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        done(null, getUserById(id));
    });
}

module.exports = initPassport;