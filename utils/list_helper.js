const _ = require('lodash');

const dummy = blogs => {
  return 1;
};

const totalLikes = blogs => {
  if (blogs.length === 0) {
    return 0;
  }

  const reducer = (acc, curr) => acc + curr.likes;
  return blogs.reduce(reducer, 0);
};

const favoriteBlog = blogs => {
  if (blogs.length === 0) {
    return 0;
  }
  const maxLikes = Math.max(...blogs.map(blog => blog.likes));
  const favBlog = blogs.find(blog => blog.likes === maxLikes);
  return favBlog;
};

const mostBlogs = arr => {
  if (arr.length === 0) {
    return 0;
  }
  const authors = _.countBy(_.map(arr, 'author'));
  const maxValue = _.max(_.values(authors));
  const authorBlogs = {};

  Object.keys(authors).forEach(item => {
    if (authors[item] === maxValue) {
      authorBlogs.author = item;
      authorBlogs.blogs = authors[item];
      return false;
    }
  });
  return authorBlogs;
};

const mostLikes = arr => {
  if (arr.length === 0) {
    return 0;
  }
  const mostLikedAuthor = favoriteBlog(arr);
  const authorsList = arr.filter(
    item => item.author === mostLikedAuthor.author,
  );

  const likes = _.reduce(
    authorsList,
    (curr, acc) => {
      return curr + acc.likes;
    },
    0,
  );

  return {
    author: mostLikedAuthor.author,
    likes: likes,
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};

//data
