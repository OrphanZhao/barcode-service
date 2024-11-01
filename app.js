const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");
const logger = require("./logger");

dotenv.config();
const token = process.env.TOKEN;
const baseUrl = "https://bff.gds.org.cn/gds/searching-api/ProductService";
const defaultBarcode = 6932203601439;

const main = async () => {
  const startBrowser = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.goto("https://www.gds.org.cn/#/home/index", {
      waitUntil: "domcontentloaded",
    });
    return page;
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
    const page = await startBrowser();

    const {
      Data: { Items },
    } = await productListByGtin(page);
    const [target] = Items;
    const { f_id } = target;

    const {
      Data: { Items: all },
    } = await productListByFid(page, f_id);

    for (const item of all) {
      await new Promise(async (resolve) => {
        console.log(item);
        let res = {};
        try {
          res = await productInfoByGtin(page, item.gtin, item.base_id);
        } catch (error) {
          console.log(error);
          res = error;
        }
        logger.info("productInfoByGtin", { res });
        setTimeout(resolve, 5000);
      });
    }
  };
  start();
};

main();
