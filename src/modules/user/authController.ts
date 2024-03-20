import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import bcryptjs from "bcryptjs";
import User from "./user.model";
import jwt from "jsonwebtoken";

const signupValidationRules = [
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    await Promise.all(
      signupValidationRules.map((validationRule) => validationRule.run(req))
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      const conflictingField =
        existingUser.username === username ? "username" : "email";
      return res
        .status(400)
        .json({ message: `User with this ${conflictingField} already exists` });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.json({ message: "Signup successful" });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password || email === "" || password === "") {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const validUser = await User.findOne({ where: { email } });
    if (!validUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);

    if (!validPassword) {
      res.status(400).json({ error: "Invalid Password" });
      return;
    }

    const token = jwt.sign(
      { id: validUser.id, isAdmin: validUser.isAdmin },
      process.env.JWT_SECRET!
    );

    const { password: pass, ...rest } = validUser.get();

    res
      .status(200)
      .cookie("access_token", token, { httpOnly: true })
      .json({ message: "Signin Successful", token });
  } catch (error) {
    next(error);
  }
};

export { signup, signin };
