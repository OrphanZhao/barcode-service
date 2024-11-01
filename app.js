const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");

dotenv.config();
const token = process.env.TOKEN;
const baseUrl = "https://bff.gds.org.cn/gds/searching-api/ProductService";
const defaultBarcode = 6932203601439;
const imageBaseUrl = "https://oss.gds.org.cn";

const main = async () => {
  const startBrowser = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.goto("https://www.gds.org.cn/#/home/index", {
      waitUntil: "domcontentloaded",
    });
    return { browser, page };
  };

  const productListByGtin = async (page, barcode = defaultBarcode) => {
    return await page.evaluate(
      async (barcode, baseUrl, token) => {
        const response = await fetch(
          `${baseUrl}/ProductListByGTIN?PageSize=30&PageIndex=1&SearchItem=${barcode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.json();
      },
      barcode,
      baseUrl,
      token
    );
  };

  const productListByFid = async (page, f_id) => {
    return await page.evaluate(
      async (f_id, baseUrl, token) => {
        const response = await fetch(
          `${baseUrl}/ProductListByFID?PageSize=500&PageIndex=1&SearchItem=${f_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.json();
      },
      f_id,
      baseUrl,
      token
    );
  };

  const productInfoByGtin = async (page, gtin, base_id) => {
    return await page.evaluate(
      async (gtin, base_id, baseUrl, token) => {
        const response = await fetch(
          `${baseUrl}/ProductInfoByGTIN?gtin=${gtin}&id=${base_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.json();
      },
      gtin,
      base_id,
      baseUrl,
      token
    );
  };

  const start = async () => {
    const { browser, page } = await startBrowser();

    try {
      const {
        Data: { Items },
      } = await productListByGtin(page);
      const [target] = Items;
      const { f_id } = target;

      const {
        Data: { Items: all },
      } = await productListByFid(page, f_id);

      const data = all.map((v) => ({
        code: v.gtin,
        title: v.description,
        spec: v.specification,
        imageUrl: v.picture_filename
          ? `${imageBaseUrl}${v.picture_filename}`
          : null,
      }));

      const logFilePath = path.join(__dirname, "barcode.json");
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(logFilePath, jsonData, "utf8");
    } catch (error) {
      console.log(error);
    }

    browser.close();
  };
  start();
};

main();
