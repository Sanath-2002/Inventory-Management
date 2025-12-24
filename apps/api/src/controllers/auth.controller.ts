import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateAccessToken = (user: any) => {
    return jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', validPassword);

        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

        const accessToken = generateAccessToken({ id: user.id, role: user.role });
        const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_SECRET || 'refreshSecret');

        res.json({ accessToken, refreshToken });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const refreshToken = (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.REFRESH_SECRET || 'refreshSecret', (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ id: user.id, role: user.role });
        res.json({ accessToken });
    });
};
