const express = require("express");
const puppeteerService = require("./PuppeteerService");
const dotenv = require("dotenv");
const logger = require("./logger");
require("express-async-errors");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

let token = process.env.TOKEN;

// 初始化 PuppeteerService
(async () => {
  try {
    await puppeteerService.initialize();
  } catch (error) {
    logger.error("Failed to initialize PuppeteerService:", error);
  }
})();

app.get("/barcode/:id", async (req, res) => {
  const { id: barcode } = req.params;
  if (!barcode) {
    return res.status(400).json({ error: "Barcode is required" });
  }

  logger.info("Fetching barcode detail", { barcode });

  try {
    const infoResponse = await puppeteerService.fetchBarcodeDetail(
      barcode,
      token
    );
    logger.info("Barcode detail fetched successfully", {
      barcode,
      infoResponse,
    });
    res.json({ success: true, data: infoResponse });
  } catch (error) {
    logger.error("请求失败:", error.message, { errorResponse: error.response });
    res.status(500).json({ success: false, error: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
