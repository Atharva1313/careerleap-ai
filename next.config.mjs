/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "randomuser.me",
          pathname: "/**", // Allow all paths from this domain
        },
      ],
      domains: ["images.unsplash.com"], // Allow simpler domain-based configuration
    },
  };
  
  export default nextConfig;