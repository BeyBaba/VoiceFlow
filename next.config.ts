import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libsodium-wrappers-sumo WASM modulunu desteklemek icin
  webpack: (config, { isServer }) => {
    // WASM dosyalari icin loader ekle
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // .wasm dosyalarini asset olarak isle
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // Client-side icin Node.js modullerini devre disi birak
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      };
    }

    return config;
  },

  // Turbopack kullanildiginda (dev modunda)
  turbopack: {
    resolveAlias: {
      // simple-peer Node.js buffer gerektirir
      buffer: "buffer/",
    },
  },
};

export default nextConfig;
