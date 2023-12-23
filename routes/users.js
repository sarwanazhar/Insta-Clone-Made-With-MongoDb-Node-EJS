const mongoose = require('mongoose')
const plm = require('passport-local-mongoose')



mongoose.connect(`mongodb+srv://sarwan:sarwan@cluster0.k2t3rsu.mongodb.net/instaClone`)

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  name: String,
  email: String,
  profileImage: String,
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
  }],
  bio: String
})

userSchema.plugin(plm)

module.exports = mongoose.model("user", userSchema)