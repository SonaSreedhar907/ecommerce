import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ message: "unauthorized" });
    }
    console.log("decoded token is ", user);
    // Add timezone property to the user object
    req.user = { ...user };
    console.log('heloo...',req.user.id)
    console.log('timezone is..',req.user.timezone)
    next();
  });
};

export { verifyToken, AuthenticatedRequest };
