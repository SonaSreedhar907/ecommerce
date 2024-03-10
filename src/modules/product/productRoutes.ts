import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import {create,getPosts} from './productController'

const router = express.Router();

router.post('/create', verifyToken,create)

router.get('/getallpost',verifyToken ,getPosts)

export default router;