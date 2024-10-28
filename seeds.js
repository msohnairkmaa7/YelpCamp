const mongoose = require("mongoose");
const Campground = require("./models/campground"); // Ensure this path is correct
const Comment = require("./models/comment"); // Import the Comment model

const data = [
    {
        name: "cloud",
        image: "https://static8.depositphotos.com/1029554/813/i/450/depositphotos_8137864-stock-photo-camping-tents-at-campground.jpg",
        description: "coool coool "
    },
    {
        name: "mountain",
        image: "https://static8.depositphotos.com/1029554/813/i/450/depositphotos_8137864-stock-photo-camping-tents-at-campground.jpg",
        description: "mountains are great!"
    },
    {
        name: "forest",
        image: "https://static8.depositphotos.com/1029554/813/i/450/depositphotos_8137864-stock-photo-camping-tents-at-campground.jpg",
        description: "forests are amazing!"
    }
];

async function seedDB() {
    try {
        // Remove all campgrounds
        await Campground.deleteMany({});
        console.log("All campgrounds removed.");

        // for (const seed of data) {
        //     // Create a new campground
        //     const newCampground = await Campground.create(seed);
        //     console.log("Added a new campground:", newCampground);

        // //     // Create a comment
        // //     const comment = await Comment.create({
        // //         text: "This place is great!",
        // //         author: "Monika"
        // //     });

        // //     // Ensure that newCampground.comments is defined
        //     if (!newCampground.comments) {
        //         newCampground.comments = [];
        //     }

        //     // Push the comment to the campground's comments array
        //     newCampground.comments.push(comment);
        //     await newCampground.save(); // Save the campground after pushing the comment
        //     console.log("Created new comment:", comment);
        // }
    } catch (err) {
        console.log("Error seeding the database:", err);
    }
}

module.exports = seedDB;
