import app from "./app";
import { envVariables } from "./config/env";

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
