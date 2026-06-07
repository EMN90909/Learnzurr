import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\n=======================================");
console.log("VAPID keys (free — no signup required)");
console.log("=======================================\n");
console.log("Public Key:");
console.log(keys.publicKey);
console.log("\nPrivate Key:");
console.log(keys.privateKey);
console.log("\nAdd to Render environment variables or .env.local:\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_EMAIL=mailto:you@example.com");
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log("\nKeep VAPID_PRIVATE_KEY secret. Only the public key is exposed to the browser.\n");
