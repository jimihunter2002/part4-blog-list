const blogRouter = require('express').Router();
const Blog = require('../models/blog');
const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', {
    username: 1,
    name: 1,
  });
  response.json(blogs.map(blog => blog.toJSON()));
});

blogRouter.post('/', async (request, response) => {
  const body = request.body;

  const decodedToken = jwt.verify(request.token, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  response.status(201).json(savedBlog.toJSON());
});

blogRouter.get('/:id', async (request, response) => {
  const validId = mongoose.Types.ObjectId.isValid(request.params.id);
  if (!validId) {
    response.status(400).send('bad request id');
  }

  const blog = await Blog.findById(request.params.id);
  if (blog) {
    response.status(200).json(blog.toJSON());
  } else {
    response.status(404).end('Blog not found');
  }
});

blogRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const blog = await Blog.findById(request.params.id);

  if (blog.user.toString() === decodedToken.id) {
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    response.status(404).end('Blog not found');
  }
});

blogRouter.put('/:id', async (request, response) => {
  const body = request.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  response.json(updatedBlog.toJSON());
});

module.exports = blogRouter;
