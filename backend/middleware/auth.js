import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authentication token, authorization denied.' });
  }

  try {
    const token = authHeader.split(' ')[1] || authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_bitedash_123!@#');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};
