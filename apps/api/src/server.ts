import http from 'http';
import app from './app';
import { connectRedis } from './config/redis';
import pool from './config/database';
import { initSocket } from './socket';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
export const io = initSocket(server);

const startServer = async () => {
    try {
        await connectRedis();
        // Test DB connection
        const client = await pool.connect();
        client.release();
        console.log('Connected to PostgreSQL');

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
