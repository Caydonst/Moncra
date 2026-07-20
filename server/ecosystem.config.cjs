//const os = require("node:os");

module.exports = {
    apps: [
        {
            name: "moncra-server",
            script: "dist/index.js",
            time: true,
            watch: false,
            instances: 1, //os.cpus().length
            exec_mode: "fork",
            env_production: {
                NODE_ENV: "production",
            },
        },
    ],
};