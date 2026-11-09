# CineX
A movie ticket booking system

## Database and local services

CineX stores PostgreSQL data in Neon. Prisma connects using a Neon connection string supplied through environment configuration (for example, `DATABASE_URL`) and manages the schema and migrations. Do not commit real connection strings or `.env` files; keep `.env.example` limited to safe placeholders.

Docker Compose is for running the backend, frontend, and optionally Redis. It does not run PostgreSQL. Development, test, and production must use separate Neon targets; never run development seeds or destructive tests against production data.
