import Router from "express";
import { SystemMonitor } from "../systemMonitor.js";

const router = Router();
const monitor = new SystemMonitor();

router.get("/snapshot", async (req, res) => {
  try {
    const data = await monitor.snapShot();

    return res.json(data);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
      statusCode: err.statusCode,
    });
  }
});

export default router;
