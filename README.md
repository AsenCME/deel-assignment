# Deel Assignment

## How do I run this?
Clone the repository, navigate to the root of the project where the *docker-compose.yml* file is. Make sure you have Docker installed and the daemon running. Type `docker compose up` in your terminal and it will come to life! Use `localhost:3000` to check out the client-facing application and `localhost:3001` if you want to make direct requests to the backend.

One thing to note is that the docker volume is connected to the project, so any changes to the code are instantly reflected in the container. This made development especially easy.

## Why Docker?
Docker means there will be no issues with compatibility between systems. 

I personally use a Mac and the version of sqlite3 that came with the project does not run properly on my machine. Docker solves that issue. I did have to remove sqlite3 from the `package.json` dependency list, as it needs to be installed seperately inside the container. Check out the `server/Dockerfile` to learn more.

## How do I run the tests?
Navigate to the `server/` folder and run `npm install && npm install sqlite3`. Then you can `npm test`. That will execute all unit tests for the backend. The reason for this structure is that sqlite3 conflicts with Docker if placed inside **package.json**.

Funny enough, I wanted to use **supertest** to simulate the express app when testing but it simply refused to work with the custom authentication header `profile: :id`. So, I instead opted to run the server on a random port before all tests and close it after all tests are done. Then I used **node-fetch@2** (ver. 2 was needed as it's the only that supports commonjs `require`) to make calls to localhost. It worked out super! The tests still execute within a reasonable time. I decided to seed the database before each test as that would give me predictable results so I could hard-code the expected values.

## Folder structure
 - **Server** - Contains all back-end code
 - **Client** - Contains all front-end code

## Project Description
The project uses several libraries that came with the assignment such as:
 - **SQLite3** for a simple, lightweight local sql-like database
 - **Sequelize** for a no-headaches ORM
 - **Express** as the world's most reliable and extensible JS backend library

Additionally, I installed:
 - **Zod** for simple validation of query parameters and request body
 - **NEXT.JS** - full-stack js framework, used for server-side rendering the front-end in this case
 - **Tailwind** - the one and only way to apply CSS styles to your app. Incredibly powerful

## Why NEXT.JS?
It is in capital letters for a reason! Full-stack JS! I don't even need **express** with this. But a stateful backend can sometimes be useful. Next.JS is fast, reliable, easy-to-use and by far my favourite JS library (**Qwik.js** is *qwik-ly* catching up ^^)

## NextJS rant
**React-Query** would have been a nice addition but it requires more setup to integrate with NextJS. It is much better than Redux and a lot easier to use than React Context; I would love to use Next.JS 13 with React Server Components and the new `use` hook (which unwraps responses!) but it needs to mature a little more. I can't use my favourite libraries and interactions are much worse (you have to specify client components with `"use client"` at the top of the file!). Astro really does it better. However Astro is suited to pages where the content does not change from user to user (like Blogs!), while Next.js is really for cases like this - each user will see a different list of contracts
 - 
## Would I have chosen different libraries?
 - I like TypeORM so if the backend was built in Typescript this is what I would have used. I especially like its style of using decorators;
 - Alternatively, for a bigger project, Prisma would have been amazing. Paired with a PostgresQL database, it is performant and unstoppable;
 - I've heard good things about **Fastify.JS** but **Express** pairs easily with the serverless framework and can be therefore deployed to AWS Lambda;

## How would I deploy this?
 - The express app can be used with the serverless framework and deployed to AWS Lambda
 - The Next.js app can be easily deployed to Vercel using their free plan. Vercel also offers Edge functions which brings the app closer to each user

## How much time did it take me to complete this?
**4-5h**. I realize it is more than was stipulated in the assignment but I think it was totally worth it. Without the tests and the Next.js app, it would be right around the 2h mark.
