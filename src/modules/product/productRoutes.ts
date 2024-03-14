import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import {create,getPosts} from './productController'

const router = express.Router();

router.use(verifyToken);

router.post('/create',create)

router.get('/getallpost',getPosts)





export default router;