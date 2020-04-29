const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const helper = require('./test_helper');
const Blog = require('../models/blog');
const User = require('../models/user');
const app = require('../app');
const api = supertest(app);

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const passwordHarsh = await bcrypt.hash('secret', 10);
  const user = new User({
    username: 'root',
    password: passwordHarsh,
    name: 'testUser',
  });

  await user.save();

  // let blogObject = new Blog(helper.initialBlogs[0]);
  // await blogObject.save();

  // blogObject = new Blog(helper.initialBlogs[1]);
  // await blogObject.save();

  //guranteed order of resolving promises
  // for (let blog of helper.initialBlogs) {
  //   let blogObj = new Blog(blog);
  //   await blogObj.save();
  // }

  const blogObjects = helper.initialBlogs.map(blogObj => new Blog(blogObj));
  const promiseArray = blogObjects.map(blog => blog.save());
  await Promise.all(promiseArray);
});

describe('when there is initially some saved blogs', () => {
  test('blogs are returned as json ', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs');

    const titles = response.body.map(r => r.title);

    expect(titles).toContain('the gods are not to blame');
  });
});

describe('addition of a new blog', () => {
  test('a new blogger can be added', async () => {
    const authResponse = await api
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'root', password: 'secret' })
      .expect(200);

    const newBlog = {
      title: 'the beautiful ones are not yet born',
      author: 'cyprian ekwensi',
      url: 'https://www.wolesoyinka.co.uk',
      likes: 4,
    };

    await api

      .post('/api/blogs')
      .set('Authorization', `bearer ${authResponse.body.token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsInDB = await helper.blogsInDb();
    expect(blogsInDB).toHaveLength(helper.initialBlogs.length + 1);

    const titles = blogsInDB.map(r => r.title);

    expect(titles).toContain('the beautiful ones are not yet born');
  });

  test('blog without author is not added to DB', async () => {
    const authResponse = await api
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'root', password: 'secret' })
      .expect(200);

    const newBlog = {
      title: 'arrow of god',
      url: 'https://www.wolesoyinka.co.uk',
      likes: 9,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${authResponse.body.token}`)
      .send(newBlog)
      .expect(400);

    //const response = await api.get('/api/blogs');
    const blogsInDB = await helper.blogsInDb();

    expect(blogsInDB).toHaveLength(helper.initialBlogs.length);
  });

  test('blog with no likes defaults to zero', async () => {
    const authResponse = await api
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'root', password: 'secret' })
      .expect(200);

    const newBlog = {
      title: 'default likes',
      url: 'https://www.defaultlikes.co.uk',
      author: 'cassa blanca',
    };
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${authResponse.body.token}`)
      .send(newBlog)
      .expect(201);

    const blogsInDB = await helper.blogsInDb();
    const lastBlogCreated = blogsInDB[blogsInDB.length - 1];

    expect(lastBlogCreated.likes).toBeDefined();
    expect(lastBlogCreated.likes).toEqual(0);
  });
  test('blog created without authorization header', async () => {
    const newBlog = {
      title: 'arrow of god',
      url: 'https://www.wolesoyinka.co.uk',
      likes: 9,
    };

    await api.post('/api/blogs').send(newBlog).expect(401);

    const blogsInDB = await helper.blogsInDb();

    expect(blogsInDB).toHaveLength(helper.initialBlogs.length);
  });
});

describe('viewing a specific blog', () => {
  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToView = blogsAtStart[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(resultBlog.body).toEqual(blogToView);
    expect(resultBlog.body.id).toBeDefined();
  });

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validBlogNonexistingId = await helper.nonExistingBlogId();

    await api.get(`/api/blogs/${validBlogNonexistingId}`).expect(404);
  });

  test('fails with statuscode 400 id is invalid', async () => {
    const invalidId = '5ea01d777bb54047545b375';

    await api.get(`/api/blogs/${invalidId}`).expect(400);
  });
});

describe('deletion of a blog', () => {
  // test('a blog can be deleted', async () => {
  //   const blogsAtStart = await helper.blogsInDb();
  //   const blogToDelete = blogsAtStart[0];

  //   await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

  //   const blogsAtEnd = await helper.blogsInDb();

  //   expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

  //   const authors = blogsAtEnd.map(r => r.author);

  //   expect(authors).not.toContain(blogToDelete.author);
  // });

  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb();

    //get authentication token
    const authResponse = await api
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'root', password: 'secret' })
      .expect(200);

    //create blog
    const newBlog = {
      title: 'default likes',
      url: 'https://www.defaultlikes.co.uk',
      author: 'cassa blanca',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${authResponse.body.token}`)
      .send(newBlog)
      .expect(201);

    //fetch blogs after creation length 3
    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

    const blogToDelete = blogsAtEnd[blogsAtEnd.length - 1];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${authResponse.body.token}`)
      .expect(204);

    const blogsAfterDelete = await helper.blogsInDb();

    const authors = blogsAfterDelete.map(r => r.author);

    expect(authors).not.toContain(blogToDelete.author);
    expect(blogsAfterDelete).toHaveLength(blogsAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
