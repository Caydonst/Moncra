//const os = require("node:os");

module.exports = {
    apps: [
        {
            name: "moncra-server",
            script: "dist/index.js",
            time: true,
            watch: false,
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};