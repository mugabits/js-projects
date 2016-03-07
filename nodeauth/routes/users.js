var express = require('express');
var router = express.Router();
//User Model
var User = require('../models/user');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register',{
    'title': "Register"
  });
});


router.get('/login', function(req, res, next) {
  res.render('login',{
    'title': "Login"
  });
});



router.post('/register', function(req, res, next) {
  //get form values
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  //Check for image field
  if(req.body.profileImage){
    console.log('Uploading file... ');

    //File Info
    var profileImageOriginalName  = req.body.profileImage.originalname;
    var profileImageName          = req.body.profileImage.name;
    var profileImageMime          = req.body.profileImage.mimetype;
    var profileImagePath          = req.body.profileImage.path;
    var profileImageExt           = req.body.profileImage.extension;
    var profileImageSize          = req.body.profileImage.size;
  } else {
    //Set default image
    var profileImageName          = 'noimage.png';
  }


  //Form Validation
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').notEmpty();
  req.checkBody('email','Email not valid').isEmail();
  req.checkBody('username','Username field is required').notEmpty();
  req.checkBody('password','Password field is required').notEmpty();
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  //check for errors
  var errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors: errors,
      name:name,
      email:email,
      password: password,
      password2: password2
    });
  } else {
    var newUser = new User({
      name:name,
      email:email,
      username: username,
      password: password,
      profileImage: profileImageName
    });

    //Create User
    User.createUser(newUser, function(err,user){
       if (err) throw err;
       console.log(user);
    });

    //Success message
    req.flash('Success', 'You are now registered and may log in')

    res.location('/'); //sets the response header
    res.redirect('/'); //sets status to 302
  }
});

passport.serializeUser(function (user, done) {
  done(null, user.id);
})

passport.deserializeUser(function (id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  })
})

passport.use(new LocalStrategy(
  function (username, password, done) {
      User.getUserByUsername(username, function (err,user) {
        if (err) throw err;
        if(!user){
          console.log('Unknown User');
          return done(null,false,{message:'unknown User'});
        }
      User.comparePassword(password, user.password, function (err, isMatch) {
        if (err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          console.log('Invalid Password');
          return done(null, false, {message: 'Invalid Password'})
        }
      })
    });
  }
));

router.post('/login',
            passport.authenticate('local',{
              failureRedirect:  '/users/login',
              failureFlash:     'Invalid username or password'
            }),
          function(req,res) {
            console.log("Authentication successful");
            req.flash('success', 'You are logged in');
            res.redirect('/');
          })

router.get('/logout',function (req,res) {
  req.logout();
  req.flash('success','You have logged out');
  res.redirect('/users/login');
});

module.exports = router;
