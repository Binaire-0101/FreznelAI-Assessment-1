import Router from "express";
import monitorRouter from "./monitor.route.js";

const router = Router();

router.use("/monitor", monitorRouter);

export default router;
