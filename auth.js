const local = require('passport-local').Strategy
const bcrypt = require('bcrypt');
const User = require('./models/user_model')


module.exports = function(passport){
    passport.use(
        new local( (username, password, done) => {
            User.findOne({username: username.toLowerCase()})
                .then(user => {
                    if(!user){
                        return done(null, false, {message: 'User doesn\'t Exist'})
                    }
                    
                    bcrypt.compare(password, user.password, (error, isMatch) => {
                        if (error) throw error;

                        if (isMatch){ return done(null, user) }
                        else {return done(null, false, {message: 'Password is Incorrect'})}
                    })
                })
                .catch((error)=>{console.log(error)})
            }
        )
    )

        passport.serializeUser((user, done) => done(null, user.id));
        passport.deserializeUser(function(id, done){ 
            User.findById(id, (error, user)=>{
                done(error, user)
            })
        })
}
