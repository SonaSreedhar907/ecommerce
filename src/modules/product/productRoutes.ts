import express from "express";
import { verifyToken } from "../../utils/verifyUser";
import { create, getPosts, deletePost, updatePost } from "./productController";
import upload from "../../utils/multer";

const router = express.Router();

router.use(verifyToken);

router.post("/create", upload.array("image", 3), create);

router.route("/getallpost").get(getPosts);

router.route("/updatepost/:id").put(updatePost);

router.route("/delete/:id").delete(deletePost);

export default router;
