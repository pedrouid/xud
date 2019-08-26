import { callback, loadXudClient } from '../command';
import { Arguments } from 'yargs';
import { ListOrderHistoryRequest } from '../../proto/xudrpc_pb';

export const command = 'listorderhistory <order_id>';

export const describe = 'list all events related to ab order';

export const builder = {
  order_id: {
    type: 'string',
  },
};

export const handler = (argv: Arguments) => {
  const request = new ListOrderHistoryRequest();
  request.setOrderId(argv.order_id);
  loadXudClient(argv).listOrderHistory(request, callback(argv));
};
