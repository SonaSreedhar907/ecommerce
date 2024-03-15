import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import {create,getPosts,deletePost,updatePost} from './productController'
import upload from '../../utils/multer'

const router = express.Router();

router.use(verifyToken);

router.post('/create', upload.array('image', 3), create)

router.get('/getallpost',getPosts)

router.put('/updatepost/:id',updatePost)

router.delete('/delete/:id',deletePost)





export default router;