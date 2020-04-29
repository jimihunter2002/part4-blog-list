const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
  {
    title: 'half of a yellow sun',
    author: 'frank ocean',
    url: 'https://www.fliptv.co.uk',
    likes: 6,
  },
  {
    title: 'the gods are not to blame',
    author: 'jackson soyinka',
    url: 'https://www.wolesoyinka.co.uk',
    likes: 3,
  },
];

const nonExistingBlogId = async () => {
  const blog = new Blog({
    title: 'blog for removal',
    author: 'fake author',
    url: 'https://www.fakenews.com',
    likes: 1,
  });
  await blog.save();
  await blog.remove();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map(blog => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map(user => user.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingBlogId,
  blogsInDb,
  usersInDb,
};
