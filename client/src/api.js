import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

export function getRoom(id) {
  return http.get(`/room/${encodeURIComponent(id)}`).then(r => r.data);
}

export function createRoom(id, partyA, partyB, password) {
  return http.post(`/room/${encodeURIComponent(id)}`, { partyA, partyB, password }).then(r => r.data);
}

export function verifyPassword(id, password) {
  return http.post(`/room/${encodeURIComponent(id)}/verify`, { password }).then(r => r.data);
}

export function getMessages(roomId, before = null, limit = 50) {
  const params = { limit };
  if (before) params.before = before;
  return http.get(`/messages/${encodeURIComponent(roomId)}`, { params }).then(r => r.data);
}

export function uploadFile(roomId, file, sender, onProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('sender', sender);
  return http.post(`/upload/${encodeURIComponent(roomId)}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }).then(r => r.data);
}
