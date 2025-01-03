# Checkit Order Application

This repository contains the Checkit Order Application, an order management system built with NestJS. The application provides various functionalities including user authentication, order management, and chat features.

## Table of Contents

- [Documentation](#documentation)
- [Features](#features)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Other Notes](#other-notes)

## Documentation

The API documentation for this application is available in the Postman link. You can find the documentation [here](https://documenter.getpostman.com/view/26276921/2sAYJ98x9u).

## Features

- **User Authentication**: Register, login, and manage user sessions.
- **Order Management**: Create, update, and manage orders.
- **Chat**: Real-time chat functionality within orders.

## Setup

### Prerequisites

- Node.js (>= 20)
- PostgreSQL
- Redis

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/Horlakz/checkit-assessment.git
   cd checkit-assessment
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Set up environment variables:

   Copy the [.env.sample](http://_vscodecontentref_/0) file to [.env](http://_vscodecontentref_/1) and update the values as needed.

   ```sh
   cp .env.sample .env
   ```

4. Set up the database:

   ```sh
   pnpm prebuild
   ```

## Running the Application

To start the application in development mode:

```sh
pnpm start:dev
```

To stat the application in production mode:

```sh
pnpm build
pnpm start:prod
```

## Running Tests

### Unit Tests

To run unit tests:

```sh
pnpm test
```

### Integration Tests

To run integration tests:

```sh
pnpm test:e2e
```

## Environment Variables

The application uses the available environmental variables available in the .env.sample file, rename and configure in a .env file

## Other Notes

- you can connect to the websocket port with ws://localhost:8000/order-chat
- application contains more endpoints but only required endpoints are added to the postman docuementation
