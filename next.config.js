/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        // 如果设置为 true，在生产构建期间将完全忽略 ESLint 错误。
        // 这对于本地开发可能不起作用，因为 ESLint 通常在开发服务器启动时运行。
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
