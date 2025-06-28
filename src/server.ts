import app from './app';
import { getServerConfig } from './config';
import logger from './utils/logger';

const serverConfig = getServerConfig();
app.listen(serverConfig.port, () => {
    logger.info(`POS Gateway listening on port ${serverConfig.port}`);
});
