
// src/services/comments.ts
import axios from 'axios';
import { BASE_URL } from '../config';

export type UserMini = { _id: string; full_name?: string; avatar_url?: string };
export type CommentDoc = {
  _id: string;
  product_id: string;
  user_id: UserMini | string;
  rating: number;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchComments(productId: string): Promise<CommentDoc[]> {
  const { data } = await axios.get(`${BASE_URL}/api/comments/product/${productId}`);
  return data?.items ?? [];
}

export async function createComment(token: string, payload: { product_id: string; content: string; rating: number; }) {
  return axios.post(`${BASE_URL}/api/comments`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function updateComment(token: string, commentId: string, payload: { content: string; rating: number; }) {
  return axios.put(`${BASE_URL}/api/comments/${commentId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function deleteComment(token: string, commentId: string) {
  return axios.delete(`${BASE_URL}/api/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
