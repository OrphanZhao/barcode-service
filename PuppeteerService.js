const puppeteer = require("puppeteer");
const logger = require("./logger");

class PuppeteerService {
  constructor() {
    if (!PuppeteerService.instance) {
      this.browser = null;
      this.page = null;
      PuppeteerService.instance = this;
    }
    return PuppeteerService.instance;
  }

  async initialize() {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
        this.page.setDefaultNavigationTimeout(60000); // 60秒
        await this.page.goto("https://www.gds.org.cn/#/home/index", {
          waitUntil: "domcontentloaded",
        });
        logger.info("PuppeteerService initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize PuppeteerService:", error);
        throw error;
      }
    }
  }

  async fetchBarcodeDetail(barcode, token) {
    if (!this.page) {
      throw new Error("PuppeteerService is not initialized");
    }

    try {
      const listResponse = await this.fetchProductList(barcode, token);
      const { Code, Data } = listResponse;
      const { Items } = Data;

      if (Code === 1 && Data && Array.isArray(Items) && Items.length > 0) {
        const [target] = Items;
        const { gtin, base_id } = target;

        const infoResponse = await this.fetchProductInfo(base_id, gtin, token);
        return infoResponse;
      } else {
        throw new Error("No items found");
      }
    } catch (error) {
      throw error;
    }
  }

  async fetchProductList(barcode, token) {
    return await this.page.evaluate(
      async (barcode, token) => {
        const response = await fetch(
          `https://bff.gds.org.cn/gds/searching-api/ProductService/ProductListByGTIN?PageSize=30&PageIndex=1&SearchItem=${barcode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          await response.json();
          throw new Error(
            `ProductListByGTIN 请求失败，状态码: ${response.status}`
          );
        }
        return response.json();
      },
      barcode,
      token
    );
  }

  async fetchProductInfo(base_id, gtin, token) {
    return await this.page.evaluate(
      async (base_id, gtin, token) => {
        const response = await fetch(
          `https://bff.gds.org.cn/gds/searching-api/ProductService/ProductInfoByGTIN?gtin=${gtin}&id=${base_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          await response.json();
          throw new Error(
            `ProductInfoByGTIN 请求失败，状态码: ${response.status}`
          );
        }
        return response.json();
      },
      base_id,
      gtin,
      token
    );
  }
}

module.exports = new PuppeteerService();
