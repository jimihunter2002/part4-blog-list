const logger = require('./logger');

const requestLogger = (request, response, next) => {
  logger.info('Method', request.method);
  logger.info('Path', request.path);
  logger.info('Body', request.body);
  logger.info('---');
  next();
};

const errorHandler = (error, request, response, next) => {
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' });
  }

  logger.error(error.message);

  next(error);
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization');
  const requestPath = request.path;
  const endpoint = 'blogs';

  const reqRes =
    (request.method === 'POST' || request.method === 'DELETE') &&
    requestPath.includes(endpoint)
      ? true
      : false;

  if (reqRes) {
    if (!(authorization && authorization.toLowerCase().startsWith('bearer '))) {
      return response.status(401).send({ error: 'missing header token' });
    } else {
      if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        // return authorization.substring(7);
        request.token = authorization.substring(7);
      }
    }
  }

  next();
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
};
