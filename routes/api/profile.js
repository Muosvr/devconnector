const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load helper functions
const stripWhiteSpace = require("../../validation/stripWhiteSpace");

// Load Data Models
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// Load validation
const validateProfileInput = require("../../validation/profile");
const validateExperieneInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

// @route GET api/profile/handle/:handle
// @desc GET profile by handle
// @access Public
router.get("/handle/:handle", (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(400).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route GET api/profile/all
// @desc Get all profiles
// @access Public
router.get("/all", (req, res) => {
  errors = {};

  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There are no profiles";
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json({ profile: "There are no profiles" }));
});

// @route GET api/profile/user/:user_id
// @desc GET profile by handle
// @access Public
router.get("/user/:user_id", (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(400).json(errors);
      }

      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

// @route GET api/profile
// @desc Get current users profile
// @access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(400).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(400).json(err));
  }
);

// @route POST api/profile
// @desc Create user profile
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validate profile form input
    const { errors, isValid } = validateProfileInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors with 400 status
      res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;

    // Split skills into array
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills
        .split(",")
        .map(data => stripWhiteSpace(data));
    }

    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        // Create

        //Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = "That handle already exists";
            res.status(400).json(errors);
          }

          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

// @route POST api/profile/experience
// @desc Add experience to profile
// @access Private
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validate profile form input
    const { errors, isValid } = validateExperieneInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors with 400 status
      res.status(400).json(errors);
    }

    // Return profiles
    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to exp array
      profile.experience.unshift(newExp);
      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route POST api/profile/education
// @desc Add education to profile
// @access Private
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validate profile form input
    const { errors, isValid } = validateEducationInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors with 400 status
      res.status(400).json(errors);
    }

    // Return profiles
    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        fieldofstudy: req.body.fieldofstudy,
        degree: req.body.degree,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to education array
      profile.education.unshift(newEdu);
      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route DELETE api/profile/experience/:exp_id
// @desc Delete experience from profile
// @access Private
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route DELETE api/profile/education/:exp_id
// @desc Delete education from profile
// @access Private
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route DELETE api/profile
// @desc Delete education and profile
// @access Private
router.delete(
  "/:user_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      // To do: this doesn't work yet
      // Also if user is deleted, how to delete posts posted by the user?
      User.findOneAndRemove({ _id: req.user.id });
      res.json({ success: true });
    });
  }
);

module.exports = router;
