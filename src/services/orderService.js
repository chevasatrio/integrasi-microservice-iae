import axios from 'axios';

const BASE = 'http://localhost:8003/api';

export const getOrders      = ()     => axios.get(`${BASE}/orders`);
export const getOrderById   = (id)   => axios.get(`${BASE}/orders/${id}`);
export const createOrder    = (data) => axios.post(`${BASE}/orders`, data);
export const updateStatus   = (id, status) => axios.put(`${BASE}/orders/${id}/status`, { status });
export const deleteOrder    = (id)   => axios.delete(`${BASE}/orders/${id}`);