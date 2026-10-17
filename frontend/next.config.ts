import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/applicant",
        destination: "/applicant/dashboard",
        permanent: false,
      },
      {
        source: "/staff",
        destination: "/admin/evaluations",
        permanent: false,
      },
      {
        source: "/staff/dashboard",
        destination: "/admin/evaluations",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/admin/evaluations",
        permanent: false,
      },
      {
        source: "/track",
        destination: "/applicant/track",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/applicant/dashboard",
        permanent: false,
      },
      {
        source: "/apply",
        destination: "/applicant/apply",
        permanent: false,
      },
      {
        source: "/status",
        destination: "/applicant/track",
        permanent: false,
      },
      {
        source: "/map",
        destination: "/applicant/map",
        permanent: false,
      },
      {
        source: "/messages",
        destination: "/applicant/messages",
        permanent: false,
      },
      {
        source: "/evaluate",
        destination: "/admin/evaluations",
        permanent: false,
      },
      {
        source: "/evaluations",
        destination: "/admin/evaluations",
        permanent: false,
      },
      {
        source: "/templates",
        destination: "/applicant/templates",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)"
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com https://*.google.com https://*.googleusercontent.com; connect-src 'self' https: wss:; frame-src 'self' https://drive.google.com blob:; frame-ancestors 'self' https://*.vercel.app;"
          }
        ]
      }
    ];
  },
};

export default withPWA(nextConfig);

