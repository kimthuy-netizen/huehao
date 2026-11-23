import express from 'express';
import { attachStoreApiRoutes } from './_lib/store-app.ts';

const app = express();
app.use(express.json({ limit: '10mb' }));
attachStoreApiRoutes(app);

export default app;
