import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Los PDFs se suben directamente desde el navegador a Supabase Storage,
  // por eso no hace falta subir el límite de tamaño de las Server Actions.
};

export default nextConfig;
