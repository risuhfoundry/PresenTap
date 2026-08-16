/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Images are loaded from Supabase Storage (logo_url). Allow that host when
  // the feature is used in later phases; safe to keep declared now.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
