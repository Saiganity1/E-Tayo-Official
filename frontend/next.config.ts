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
};

export default withPWA(nextConfig);

