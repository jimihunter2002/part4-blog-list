const bcrypt = require('bcrypt');
const userRouter = require('express').Router();
const User = require('../models/user');

userRouter.post('/', async (request, response) => {
  const body = request.body;

  const saltRound = 10;

  if (body.password.length < 3) {
    response.status(400).json({ error: 'password length is than 3' });
  }
  const passwordHash = await bcrypt.hash(body.password, saltRound);

  const user = new User({
    username: body.username,
    name: body.name,
    password: passwordHash,
  });

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

userRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', {
    author: 1,
    title: 1,
    url: 1,
  });
  response.status(200).json(users.map(u => u.toJSON()));
});

userRouter.delete('/:id', async (request, response) => {
  const id = request.params.id;

  const user = await User.findById(id);

  if (user.blogs.length > 0) {
    response.status(409).send({ error: 'user has associated blogs' });
  } else {
    await User.findByIdAndRemove(id);
    response.status(204).end();
  }
});

module.exports = userRouter;
