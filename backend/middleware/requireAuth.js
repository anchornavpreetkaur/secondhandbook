const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }
  return process.env.JWT_SECRET;
};

const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== 'object' || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    req.userId = payload.sub;
    return next();
  } catch (error) {
    if (error.status === 500) {
      return next(error);
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

module.exports = { getJwtSecret, requireAuth };
