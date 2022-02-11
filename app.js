//Declaring dependencies
var express = require("express"),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  multer = require("multer"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose = require("passport-local-mongoose"),
  moment = require("moment"),
  favicon = require("serve-favicon"),
  Schema = mongoose.Schema,
  User = require("./models/users"),
  upload = multer();

var app = express();
// mongoose.connect("mongodb://localhost:27017/mydb");
// mongoose.connect("mongodb://scott:kiwano1@ds131742.mlab.com:31742/gymstats");
mongoose.connect(
  "mongodb+srv://sawilhelm:GizMo1984@cluster0.67jmo.mongodb.net/stats?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-favicon-short-circuit"));

app.use(
  require("express-session")({
    secret: "I love doing gymnastics!",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Schema for adding in an athlete
var athleteSchema = new Schema({
  name: String,
  level: Number,
  image: String,
  age: Number,
});

var Athlete = mongoose.model("Athlete", athleteSchema);

//Schema for adding in stats for an athlete
var statSchema = new Schema({
  athlete: String,
  date: String,
  leglifts: Number,
  pushups: Number,
  vups: Number,
  rope: Number,
  handstand: Number,
  notes: String,
});

var Strength = mongoose.model("Strength", statSchema);

app.get("/", function (req, res) {
  Athlete.find({}, function (err, athletes) {
    if (err) {
      console.log(err);
    } else {
      res.render("index", { athletes: athletes });
    }
  });
});

app.get("/athlete/:id", function (req, res) {
  Athlete.findById(req.params.id, function (err, foundAthlete) {
    if (err) {
      console.log(err);
    } else {
      Strength.find({ athlete: foundAthlete._id }, function (err, foundStats) {
        res.render("show", { athlete: foundAthlete, stats: foundStats });
      }).sort({ _id: -1 });
    }
  });
});

//Adds new stats
app.post("/addnew/:id", function (req, res) {
  Strength.create(
    {
      date: moment(req.body.date).format("MMMM Do YYYY"),
      athlete: req.params.id,
      pushups: req.body.pushups,
      vups: req.body.vups,
      leglifts: req.body.leglifts,
      rope: req.body.rope,
      handstand: req.body.handstand,
      notes: req.body.notes,
    },
    function (err, newStat) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/update");
      }
    }
  );
});

app.get("/new", isLoggedIn, function (req, res) {
  res.render("new");
});

app.post("/new/add", function (req, res) {
  Athlete.create(
    {
      name: req.body.nameFirst + " " + req.body.nameLast,
      level: req.body.level,
      image: req.body.image,
      age: req.body.age,
    },
    function (err, athlete) {
      if (err) {
        console.log(err);
      } else {
        console.log("New athlete added!");
        console.log(athlete);
        res.redirect("/");
      }
    }
  );
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", isLoggedIn, function (req, res) {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.render("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
          console.log("You've been registered!");
        });
      }
    }
  );
});

app.get("/admin", function (req, res) {
  res.render("login");
});

app.post(
  "/admin/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/admin",
  }),
  function (req, res) {}
);

app.put("/update", upload.any(), function (req, res) {
  Strength.findByIdAndUpdate(
    req.body._id,
    {
      pushups: req.body.pushups,
      leglifts: req.body.leglifts,
      vups: req.body.vups,
      rope: req.body.rope,
      handstand: req.body.handstand,
      notes: req.body.notes,
    },
    function (err, updatedAthlete) {
      if (err) {
        console.log("Oops, didn't work!");
        console.log(err);
      } else {
        console.log("It worked! Updated!");
      }
    }
  );
});

app.get("/update", isLoggedIn, function (req, res) {
  Athlete.find({}, function (err, athletes) {
    if (err) {
      console.log(err);
    } else {
      Strength.find({}, function (err, stats) {
        res.render("update", { athletes: athletes, stats: stats });
      });
    }
  });
});

app.get("/update/athlete", function (req, res) {
  Athlete.find({}, function (err, athletes) {
    if (err) {
      console.log(err);
    } else {
      res.render("change", { athletes: athletes });
    }
  });
});

app.put("/update/athlete", upload.any(), function (req, res) {
  Athlete.findByIdAndUpdate(
    req.body._id,
    {
      name: req.body.name,
      level: req.body.level,
      image: req.body.image,
      age: req.body.age,
    },
    function (err, updatedAthlete) {
      if (err) {
        console.log("Oops, didn't work!");
        console.log(err);
      } else {
        res.redirect("/update");
      }
    }
  );
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// app.listen(4000, process.env.IP, function(){
app.listen(4000, process.env.IP, function () {
  console.log("The server is up and running!");
});
