import api from "./axios-client";

export async function registerUser(username: string, email: string, password: string) {
  return api.post("/register", { username, email, password });
}

export async function loginUser(username: string, password: string) {
  return api.post("/login", { username, password });
}

export async function getMe() {
  return api.get("/me");
}

export function fetchCollections() {
  return api.get("/collections");
}

export function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function createChat(data: any) {
  return api.post("/chats", data);
}

export function askQuestion(data: any) {
  return api.post("/chat", data);
}

export async function logoutUser() {
  return api.post("/logout");
}

export default api;