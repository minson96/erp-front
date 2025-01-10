const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
	devServer: {
		host: 'localhost',
		port: 3000,
		proxy: {
			'/upload': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				logLevel: 'debug',
				
      },
      '/api/v1': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				logLevel: 'debug',
				
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: false,
				changeOrigin: true,
      },
    },
  },
});
