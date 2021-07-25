//Importing modules
const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const method = require('method-override');
const db = require('mongoose')
const mail = require('nodemailer')

//Importing my made js files
const passport_init = require('./auth');
const user_db = require('./models/user_model');
const ques_db = require('./models/questions');
const pass_link = require('./models/change_pass_link')


//routing
db.connect('mongodb+srv://sample_user:sample@cryptichunt.dbu2o.mongodb.net/cryptic_hunt?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
})

passport_init(passport); //calling the initialize function from auth.js

const app = express();
app.listen(process.enc.PORT || 8000); //server running at localhost:8000
app.set('view engine', 'ejs'); //specifying the template engine for using the template language
app.use(express.static(__dirname + '/public')); //linking the styles folder for access to css files

app.use(express.urlencoded({ extended: false })); //preventing user to submit nested data in a post request

app.use(session({
    secret: 'my secret key',
    resave: false,
    saveUninitialized: false,
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(method('_method'))


app.get('/', checkLogout, function (req, res) {
    res.render('home', {user: req.user});
});


app.get('/about', function (req, res) {
    res.render('about', {user: req.user});
});


app.get('/leaderboard', function (req, res) {
    user_db.find({}, (error, result)=>{
        res.render('leaderboard', {user: req.user, ranks: result});
    }).sort({score:-1})
});


app.get('/login', checkLogout, function (req, res) {
    res.render('login', {user: req.user, msg: req.flash('msg')});
});

app.post('/login', checkLogout, passport.authenticate('local',{
    successRedirect: '/user',
    failureRedirect: '/login',
    failureFlash: true,
}));


app.delete('/logout', function(req,res){
    req.logOut();
    res.redirect('/');
});


app.get('/email', checkLogout, function (req, res) {
    res.render('forgot_pass', {user: req.user, msg: req.flash('msg')});
});

app.post('/email', function(req,res){
    user_db.findOne({email: req.body.email}, (error, result)=>{
        if (result == null){
            req.flash('msg', 'Account doesn\'t exist with this email')
            res.redirect('/email')
        }

        else {
            pass_link.findOne({user_id: result._id}, (err, re)=>{
                if (re == null){
                    const link = new pass_link({
                        _id: new db.Types.ObjectId(),
                        user_id: result._id,
                    });
                    link.save()
        
                    const transport = mail.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        requireTLS: true,
                        auth: {
                            user: 'sample.mail.2101@gmail.com',
                            pass: 'sample@123',
                        }
                    })
                
                    var text = `You have recieved this email regarding your request made for your account password change. Here are your Account details:- \nusername: ${result.username}\nemail: ${result.email}\nschool: ${result.school} \n\nPlease click on this link to change your password- http://localhost:8000/change-password/${link._id} \nPlease note that this link will only be available for 10 minutes.`
        
                    const mail_options = {
                        from: 'sample.mail.2101@gmail.com',
                        to: req.body.email,
                        subject: 'Password Change',
                        text: text,
                    }
                
                    transport.sendMail(mail_options, function(error, result){
                        if (error) {
                            req.flash('msg', 'Sorry!! Something went wrong');
                            res.redirect('/email')
                        }
                
                        else {
                            req.flash('msg', 'Email Sent');
                            res.redirect('/login')
                        }
                    })
                }

                else{
                    req.flash('msg', 'A Mail has already been sent to this email. Please try again after sometime');
                    res.redirect('/email')
                }
            })
        }
    })
});


app.get('/change-password/:linkid', checkLogout, function(req, res){
    pass_link.findOne({_id: req.params.linkid}, (error, result)=>{
        if (result == null){
            res.redirect('/')
        }
        else{
            res.render('password', {user: req.user, link_id: result._id, msg: req.flash('msg')})
        }
    })
});

app.post('/change-password/:linkid', async function(req,res){
    if (req.body.pass1.length >= 8){
        if (req.body.pass1 === req.body.pass2){
            const hashed_pass = await bcrypt.hash(req.body.pass1, 10);

            pass_link.findOne({_id:req.params.linkid}, (error,result)=>{
                user_db.updateOne({_id:result.user_id}, {password: hashed_pass}, (err, answer)=>{})
                pass_link.deleteOne({_id: req.params.linkid}, (e, r)=>{
                    req.flash('msg', 'Password Changed');
                    res.redirect('/login');
                });
            })
        }
        else{
            req.flash('msg', 'Passwords don\'t match');
            res.redirect('/change-password/'+req.params.linkid);
        }
    }
    else {
        req.flash('msg', 'Passwords must contain 8 charcters or more');
        res.redirect('/change-password/'+req.params.linkid);
    }
});


app.get('/register', checkLogout, function (req, res) {
    res.render('register', {user: req.user, msg: req.flash('msg')});
});

app.post('/register', checkLogout, function (req, res) {
    try {
        user_db.findOne({username: req.body.username}, (error, result)=>{
            if (result == null){
                user_db.findOne({email: req.body.email}, async (err, re)=>{
                    if (re==null){
                        if (req.body.pass1 === req.body.pass2){
                            const hashed_pass = await bcrypt.hash(req.body.pass1, 10);
            
                            const data = new user_db({
                                _id: new db.Types.ObjectId(),
                                username: req.body.username.trim(),
                                name: req.body.name.trim(),
                                school: req.body.school.trim(),
                                email: req.body.email.trim(),
                                password: hashed_pass,
                            });
                            data.save();
                            req.flash('msg', 'User Registered Successfully!!')
                            res.redirect('/login')
                        }

                        else{
                            req.flash('msg', 'Passwords don\'t match')
                            res.redirect('/register')
                        }
                    }

                    else {
                        req.flash('msg', 'An Account with this email already exist')
                        res.redirect('/register')
                    }
                })
            }

            else {
                req.flash('msg', 'Username Taken')
                res.redirect('/register')
            }
        })
    }
    catch {
        res.redirect('/register')
    };
});


app.get('/user', checkLogin, function (req, res) {
    res.render('dashboard', {user: req.user});
});


app.get('/question', checkLogin, function (req, res) {
    ques_no = req.user.level
    ques_db.findOne({number: ques_no}, (error, result)=>{
        res.render('question', {user: req.user, question: result, msg: req.flash('msg')})
    })
});
app.post('/question', function(req, res){
    ques_no = req.user.level
    ques_db.findOne({number: ques_no}, (error, result)=>{
        if (req.body.answer.trim() === result.answer) {
            user_db.updateOne({username: req.user.username}, {level: ques_no +1, score: req.user.score +100}, (error, result)=>{
                console.log('correct answer')
            })
            req.flash('msg', 'Woohooo!! You got it right. Lets go on to the next level.')
            res.redirect('/question')
        }
        else {
            req.flash('msg', 'Wrong Answer!! try again')
            res.redirect('/question')
        }
    })
});


//Middleware functions

function checkLogin(req, res, next){
    if (req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
};

function checkLogout(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/user')
    }
    next()
}
