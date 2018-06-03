import grpcGateway from 'grpc-dynamic-gateway';
import grpc from 'grpc';
import express from 'express';
import * as bodyParser from 'body-parser';
import Logger from '../../Logger';
import path from 'path';
import { Server } from 'net';

class GrpcWebProxyServer {
  private logger: Logger;
  private app: express.Application;
  private server?: Server;

  constructor() {
    this.logger = Logger.rpc;
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  /**
   * Starts the server and begins listening on the specified proxy port
   */
  public listen = (proxyPort: number, grpcPort: number): Promise<void> => {
    // Load the proxy on / URL
    const xudrpcProtoPath = path.join(__dirname, '..', '..', '..', 'proto', 'xudrpc.proto');
    this.app.use('/api/', grpcGateway([xudrpcProtoPath], `localhost:${grpcPort}`, grpc.credentials.createInsecure(), true, __dirname));
    return new Promise((resolve) => {
      this.server = this.app.listen(proxyPort, () => {
        this.logger.info(`GRPC Web API proxy listening on port ${proxyPort}`);
        resolve();
      });
    });
  }

  /**
   * Stops listening for requests
   */
  public close = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('GRPC Web API proxy stopped listening');
          resolve();
        }).once('error', (err) => {
          this.logger.error(err);
          reject(err);
        });
      } else {
        // there is already no server listening
        resolve();
      }
    });
  }
}

export default GrpcWebProxyServer;
