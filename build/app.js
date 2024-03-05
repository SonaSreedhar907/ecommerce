"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)()); // Enable CORS for all routes
app.use('/api/auth', authRoutes_1.default);
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).send('Something went wrong!');
});
// (async () => {
//     try {
//         await sequelize.sync();
//         console.log('Database synchronized successfully');
//     } catch (error) {
//         console.error('Error synchronizing database', error);
//     }
// })();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
