const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Campground = require('./models/campground'); // Ensure this is the correct import
const seedDB = require('./seeds');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const session = require('express-session'); 
const passportLocalMongoose = require('passport-local-mongoose');
const campground = require('./models/campground');
const Comment = require("./models/comment");
const methodOverride=require("method-override");
const comment = require('./models/comment');


// Call seedDB function to seed the database
// seedDB();

// Connect to MongoDB
const MONGO_URL = `mongodb+srv://monika:12345@cluster0.wlncj4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
mongoose
    .connect(MONGO_URL)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB:", err);
    });
// seedDB();

//Passport Configuration
app.use(session({
    secret: "once again rusty win",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Middleware to set current user
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Routes
app.get('/', (req, res) => {
    res.render("landing");
});

app.get('/campground',isLoggedIn, (req, res) => {
    Campground.find({})
        .then(campgrounds => {
            res.render("campground", { campgrounds });
        })
        .catch(err => {
            console.log("Error:", err);
        });
});

app.post('/campground',isLoggedIn, (req, res) => {
    // Get data from the form
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = { name:name, image:image, description:description, author: author };

    // Create a new campground and save to the database
    Campground.create(newCampground)
        .then(campground => {
            console.log("Newly Created Campground:", campground);
            console.log(author)
            res.redirect('/campground');
        })
        .catch(err => {
            console.log("Error:", err);
            res.status(500).send("Error creating campground");
        });
});

app.get('/campground/new', (req, res) => {
    res.render("new");
});

app.get('/campground/:id',isLoggedIn, (req, res) => {
    Campground.findById(req.params.id).populate("comments")
        .then(campground => {
            if (!campground) {
                return res.status(404).send("Campgrounds not found");
                
            }
        // console.log(typeof campground.author.id)
        // console.log(typeof req.user._id)
        // console.log(campground.author.id)
        // console.log(req.user._id)
            res.render('show', { campground });
        })
        .catch(err => {
            console.log("Error fetching campground:", err);
            res.status(500).send("Error in fetching campground");
        });
});


app.get("/campground/:id/comments/new",isLoggedIn, (req, res) => {
    // Find campground by id
    Campground.findById(req.params.id)
        .then(campground => {
            if (!campground) {
                return res.status(404).send("Campground not found");
            }
            res.render('comments/new', { campground });
        })
        .catch(err => {
            console.log("Error fetching campground:", err);
            res.status(500).send("Error in fetching new comments");
        });
});

app.post("/campground/:id/comments", isLoggedIn, async function(req, res) {
    try {
        // Find the campground by ID
        const campground = await Campground.findById(req.params.id);

        // Create the comment
        const comment = new Comment({
            text: req.body.comment.text,
            author: {
                id: req.user._id,
                username: req.user.username  // Set the username from the logged-in user
            }
        });

        // Save the comment and associate it with the campground
        await comment.save();
        campground.comments.push(comment);
        await campground.save();

        res.redirect(`/campground/${campground._id}`); 
    } catch (err) {
        console.error(err); 
        res.redirect("/campground"); 
    }
});


//edit comments of the campground
app.get("/campground/:id/comments/:commentId/edit", (req, res) => {
    Campground.findById(req.params.id)
        .then(campground => {
            if (!campground) {
                return res.status(404).send("Campground not found");
            }
            // Find the specific comment
            Comment.findById(req.params.commentId)
                .then(comment => {
                    if (!comment) {
                        return res.status(404).send("Comment not found");
                    }
                    res.render("comments/edit", { campground, comment });
                })
                .catch(err => {
                    console.log("Error fetching comment:", err);
                    res.status(500).send("Error in fetching the comment for editing");
                });
        })
        .catch(err => {
            console.log("Error fetching campground:", err);
            res.status(500).send("Error in fetching campground");
        });
});

//update the comment
app.put("/campground/:id/comments/:commentId", (req, res) => {
    Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, { new: true })
        .then(() => {
            res.redirect(`/campground/${req.params.id}`);
        })
        .catch(err => {
            console.log("Error updating comment:", err);
            res.status(500).send("Error in updating comment");
        });
});


//Edit campground route
app.get("/campground/:id/edit", checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id)
        .then(campground => {
            if (!campground) {
                return res.status(404).send("Campground not found");
            }
            res.render("edit", { campground }); // Render the edit form with campground data
        })
        .catch(err => {
            console.log("Error fetching campground:", err);
            res.status(500).send("Error in editing");
        });
});


//update campground route
app.put("/campground/:id", (req, res) => {
    const campgroundId = req.params.id.trim(); 

    Campground.findByIdAndUpdate(campgroundId, req.body.campground, { new: true })
        .then(campground => {
            if (!campground) {
                return res.status(404).send("Campground not found");
            }
            res.redirect("/campground/" + campgroundId);
        })
        .catch(err => {
            console.log(err);
            res.redirect("/campground");
        });
});

// Delete campground route
app.delete("/campground/:id", checkCampgroundOwnership, async (req, res) => {
    try {
        const deleteitem = await Campground.findByIdAndDelete(req.params.id);

        if (deleteitem) {
            console.log("Successfully deleted campground");
            res.redirect("/campground"); // Redirect after successful deletion
        } else {
            console.log("No campground found with this ID");
            res.status(404).send("Campground not found");
        }
    } catch (err) {
        console.log('Error deleting campground:', err);
        res.status(500).send("Server error during deletion"); // Handle server error
    }
});


//register route
app.get("/register",(req,res)=>{
    res.render("register");
})
//logic
app.post("/register", function(req, res) {
    const newUser = new User({ username: req.body.username }); 
    // console.log("Username:", req.body.username);  
    // console.log("Password:", req.body.password);
    // Register the new user with the password
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate('local')(req, res, function() {     
            res.redirect("/login");
        });
    });
});


//login route
app.get("/login",(req,res)=>{
    return res.render("login")
})
// app.post("/login",middleware,callback)
app.post("/login", passport.authenticate("local", {
    failureRedirect: "/login"
}), (req, res) => {
    console.log("User logged in:", req.user); 
    res.redirect("/campground");
});

//logout route
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err); // Handle error
        }
        res.redirect("/campground");
    });
});

//middleware
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
}

function checkCampgroundOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id)
            .then(campground => {
                if (!campground) {
                    return res.redirect(req.get("Referrer") || "/"); // Redirect with fallback
                }
                if (campground.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect(req.get("Referrer") || "/"); // Redirect with fallback
                }
            })
            .catch(err => {
                res.redirect(req.get("Referrer") || "/"); // Redirect with fallback on error
            });
    } else {
        res.redirect(req.get("Referrer") || "/"); // Redirect if not logged in
    }
}


app.listen(8000, () => {
    console.log("Server started on port 8000");
});
