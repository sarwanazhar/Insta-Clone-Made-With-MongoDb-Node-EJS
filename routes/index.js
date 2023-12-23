var express = require('express');
var router = express.Router();
const userModel = require("./users.js");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require("./multer.js");
const postModel = require("./post.js");

passport.use(new localStrategy(userModel.authenticate()));

router.get('/footer', isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render({footer: true, footer})
})

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find().populate("user");
  res.render('feed', {footer: true, posts, user});
});

router.get('/profile', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("posts")
  res.render('profile', {footer: true, user: user});
});

router.get('/search', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('search', {footer: true, user});
});

router.get('/edit', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user})

  res.render('edit', {footer: true, user});
});

router.get('/upload', isLoggedIn, function(req, res) {
  res.render('upload');
});

router.post("/register", function(req,res,next){
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });
  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
})
router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login"
}) , function(req,res,next){
})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


router.post("/update", upload.single('image'), isLoggedIn, async function (req, res) {
  try {
    const user = await userModel.findOneAndUpdate(
      { username: req.session.passport.user },
      { name: req.body.name, username: req.body.username, bio: req.body.bio },
      { new: true }
    );

    // Check if req.file exists before accessing its properties
    if (req.file) {
      user.profileImage = req.file.filename;
      await user.save();
    }

    res.redirect("/profile");
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).send("Internal Server Error");
    res.redirect("/profile")
  }
});

router.post("/upload",upload.single("image"), isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption

  })

  user.posts.push(post._id);
  await user.save()
  res.redirect("/feed")
})

router.get("/username/:username", isLoggedIn, async function(req, res) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
  const users = await userModel.find({username: regex})

  res.json(users);
});

router.get("/like/post/:id", isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.findOne({ _id: req.params.id });
  
  if (!post.likes.includes(user._id)) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  
  await post.save();
  res.redirect("/feed");
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login")
}
module.exports = router;
