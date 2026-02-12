import express, { Application } from "express";
import dotenv from "dotenv"
import router from "./routes";
import { ErrorHandlerMiddleware } from "@middlewares";
import path from "path";
dotenv.config();

const app: Application = express();
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "src", "uploads")))

app.use(router);

app.use("/*", ErrorHandlerMiddleware.errorHandlerMiddleware)

let PORT = process.env.APP_PORT as string || 9007
app.listen(PORT, () => {console.log(PORT)})