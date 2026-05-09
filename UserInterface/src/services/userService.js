import axios from 'axios';

const BASE = 'http://localhost:8001/api';

export const getUsers       = ()     => axios.get(`${BASE}/users`);
export const getUserById    = (id)   => axios.get(`${BASE}/users/${id}`);
export const createUser     = (data) => axios.post(`${BASE}/users`, data);
export const updateUser     = (id, data) => axios.put(`${BASE}/users/${id}`, data);
export const deleteUser     = (id)   => axios.delete(`${BASE}/users/${id}`);
export const getUserOrders  = (id)   => axios.get(`${BASE}/users/${id}/orders`);