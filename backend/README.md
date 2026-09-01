# backend
# Rockfall Monitoring System - Backend

## Overview

This module contains the Spring Boot backend for the Rockfall Monitoring System.

The backend acts as the central integration layer between:

- Computer Vision Service
- Machine Learning Risk Engine
- PostgreSQL Database
- Frontend application

It receives an uploaded rock image and a zone ID, communicates with the Computer Vision and Risk Engine services, and returns a combined analysis result.

---

# Architecture

```text
                    User / Frontend
                          |
                          | Image + Zone ID
                          v
                 Spring Boot Backend
                    Port: 8080
                          |
             +------------+------------+
             |                         |
             v                         v
    Computer Vision Service       Risk Engine
         Port: 8000                Port: 9000
             |                         |
             v                         v
      Crack Analysis             Risk Analysis
             |                         |
             +------------+------------+
                          |
                          v
                  Combined Response