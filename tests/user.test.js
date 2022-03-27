const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Idan Refaeli',
      email: 'idanref@example.com',
      password: 'Computer!@#',
    })
    .expect(201);

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Idan Refaeli',
      email: 'idanref@example.com',
    },
    token: user.tokens[0].token,
  });

  expect(user.password).not.toBe('Computer!@#');
});

test('Should login existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: '123',
    })
    .expect(400);
});

test('Should get profile for user', async () => {
  await request(app).get('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send().expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app).get('/users/me').send().expect(401);
});

test('Should delete account for user', async () => {
  await request(app).delete('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send().expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  await request(app).delete('/users/me').send().expect(401);
});

test('Should upload avatar image', async () => {
  await request(app).post('/users/me/avatar').set('Authorization', `Bearer ${userOne.tokens[0].token}`).attach('avatar', 'tests/fixtures/profile-pic.jpg').expect(200);

  const user = await User.findById(userOneId);
  // toBe - uses '===', hence {} !== {} (stored in different memory locations)
  // That's why we will compare objects with .toEqual ('==')
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user field', async () => {
  await request(app).patch('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send({ name: 'New' }).expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toEqual('New');
});

test('Should not update invalid user fields', async () => {
  await request(app).patch('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send({ location: 'New Location' }).expect(400);
});
