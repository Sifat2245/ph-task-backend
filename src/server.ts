import "dotenv/config";
import app from "./app";

const port = Number(process.env.PORT ?? 3000);

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
