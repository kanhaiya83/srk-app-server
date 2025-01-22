
# Srk Auction App


## Commands
- **build**: Compiles TypeScript files into JavaScript.
  ```bash
  npm run build
  ```
  
- **start**: Starts the application using the compiled JavaScript files in the `dist` directory.
  ```bash
  npm run start
  ```
  
- **dev**: Starts the development server with live reload enabled using `nodemon`.
  ```bash
  npm run dev
  ```
  
- **generate**: Generates Prisma client files based on the schema.
  ```bash
  npm run generate
  ```
  
- **migrate**: Applies database migrations to keep the database schema in sync with the application.
  ```bash
  npm run migrate -- --name <migration-name>
  ```
  
## Requirements
- Node.js (v14 or later)
- TypeScript
- Prisma
- A database supported by Prisma

## Getting Started
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd srk-auction-app
   ```
   
2. Install dependencies:
   ```bash
   npm install
   ```
   
3. Set up Prisma:
   - Configure your database in the `.env` file.
   - Run the generate and migrate commands:
     ```bash
     npm run generate
     npm run migrate -- --name init
     ```
     
4. Start the application in development mode:
   ```bash
   npm run dev
   ```
   