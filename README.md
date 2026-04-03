# 💬 Saraha App

A full-stack anonymous messaging platform that allows users to receive honest and private feedback without revealing the sender’s identity.

---

## 🚀 Overview

Saraha App is inspired by anonymous feedback platforms where users can share their profile and receive messages from others without exposing identities. The system focuses on privacy, simplicity, and secure communication.

Anonymous messaging apps are widely used to collect honest opinions and feedback without bias or identity exposure :contentReference[oaicite:0]{index=0}.

---

## ✨ Features

- 🔐 User Authentication (Signup & Login)
- 📨 Send Anonymous Messages
- 📥 Receive Private Messages
- 👤 User Profile & Shareable Link
- 🔒 Secure Password Hashing
- 🎫 Token-based Authentication (JWT)
- ⚡ Optimized API performance
- 🛡️ Input Validation & Error Handling

---

## 🛠️ Tech Stack

### 🔹 Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Bcrypt (Password Hashing)

### 🔹 Tools
- Postman
- Git & GitHub

---

## 🔐 Authentication Flow

1. User registers with email & password
2. Password is hashed using bcrypt
3. JWT token is generated upon login
4. Protected routes require valid token

---

## 📬 How It Works

- Each user gets a unique profile link
- Anyone with the link can send anonymous messages
- Messages are stored securely in the database
- Receiver can view messages without knowing the sender

---

## ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/AbrarKhalil26/Saraha-App.git

# Navigate to project
cd Saraha-App

# Install dependencies
npm install

# Run the server
npm run dev
