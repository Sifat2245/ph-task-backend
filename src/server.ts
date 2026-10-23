import app from "./app.js";
import { envVariables } from "./config/env.js";

const port = Number(envVariables.PORT);

const server = () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log("failed to start server", error);
  }
};

server();
