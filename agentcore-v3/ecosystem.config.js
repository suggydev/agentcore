module.exports = {
  apps: [
    {
      name: 'agentcore-api',
      cwd: './apps/api',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/agentcore-api-error.log',
      out_file: '/var/log/agentcore-api.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'agentcore-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/agentcore-web-error.log',
      out_file: '/var/log/agentcore-web.log',
      merge_logs: true,
      time: true,
    },
  ],
};
