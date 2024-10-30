module.exports = {
  apps: [
    {
      name: "barcode-service",
      script: "app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 9999,
        TOKEN: "your_default_token_here",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 9999,
        TOKEN: "your_default_token_here",
      },
    },
  ],
};
