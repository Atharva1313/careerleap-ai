/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "randomuser.me",
          pathname: "/**", // Allow all paths from this domain
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          pathname: "/**",
        },
      ],
    },
  };
  
  export default nextConfig;