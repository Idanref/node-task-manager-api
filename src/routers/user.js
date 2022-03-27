const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account');

// Users Handling

// Create user
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken(); // Creating method for instance of user in /models/user.js
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken(); // Creating method for instance of user in /models/user.js
    res.send({ user, token });
  } catch (e) {
    res.status(400).send({ failed: 'Credentials unsatisfied', e });
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send(); // sends default response 200 (OK)
  } catch (e) {
    res.status(500).send();
  }
});

// Logtout all sessions for current user
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// Get my user - will run "auth" middleware before the callback func, the (req.user) is manipulated in auth.js specifying the current user
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// update a user
router.patch('/users/me', auth, async (req, res) => {
  // will not allow to update different keys
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }
  try {
    updates.forEach((update) => {
      // req.user.update - for accessing statically
      // req.user[update] - for accessing dynamically
      // same for req.body
      req.user[update] = req.body[update];
    });

    await req.user.save();
    res.send(req.user);

    // NOTE: we removed the following command because it bypasses the middleware and goes straight to the database, not a good thing if we want to hash passwords, the new code is above.
    // OLD CODE: const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Upload profile picture
const upload = multer({
  // Removed 'dest' so multer won't save into the directory, instead, pass the avatar to the function for further processing
  // dest: 'avatars',
  limits: {
    // 1 Mb = 1000000
    fileSize: 1000000,
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('File extension must be one of the following: jpg, jpeg, png'));
    }

    cb(undefined, true); // accept given upload
  },
});
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    // Using sharp to resize and convert avatar to png
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    // req.user.avatar = req.file.buffer; // OLD: saving image buffer as property of user model

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Get profile picture
// Access through web browser because it renders HTML
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    // Render the binary image on HTML
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

// Delete user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

// Delete a user
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendGoodbyeEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
