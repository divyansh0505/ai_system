import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { config } from '../config';
import { Consumer } from './consumers';
import { Database } from './db/mongo';
import { Routes } from './routes';
import logger from './utils/logger';

//config
const port = config.server.port;

// express application
const app = express();

// middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(cors());

async function main(): Promise<void> {
  try {
    Routes.mountRoutes(app);
    await Database.connect();
    await Consumer.mountConsumer();

    app.listen(port, () => {
      logger.info('SERVER_RUNNING_ON_PORT', { port });
    });
  } catch (error) {
    logger.error('ERROR_STARTING_SERVER', error);
    process.exit(1);
  }
}

main();
