import api from './api';
import { unwrap, toList } from './adapters';
import { messageBody } from './payloads';

export const messageService = {
  conversation: (userId) => api.get(`/messages/${userId}`).then((r) => toList(unwrap(r), ['messages'])),
  send: (receiverId, content) => api.post('/messages', messageBody(receiverId, content)).then(unwrap),
};
