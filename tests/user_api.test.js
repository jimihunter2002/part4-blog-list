const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const supertest = require('supertest');
const User = require('../models/user');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHarsh = await bcrypt.hash('secret', 10);
    const user = new User({ username: 'root', password: passwordHarsh });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: 'fredperry',
      name: 'Lauren Hill',
      password: 'secret',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const userAtEnd = await helper.usersInDb();
    expect(userAtEnd).toHaveLength(userAtStart.length + 1);

    const usernames = userAtEnd.map(u => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'secret',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('`username` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });

  test('invalid user is not created when password violation exists', async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: 'ajanlekoko',
      name: 'Ajah Lekki',
      password: 'pa',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('password length is than 3');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });

  test('invalid user is not created when username restriction is violated', async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: 'aj',
      name: 'Ajah Lekki',
      password: 'password',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toMatch(
      'User validation failed: username: Path `username` (`aj`) is shorter than the minimum allowed length (3).',
    );

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
