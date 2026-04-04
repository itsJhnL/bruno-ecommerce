export const products = [
  {
    id: "signature-heavy-tee",
    name: "Signature Heavy Tee",
    category: "Men",
    price: 48,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    description:
      "A structured heavyweight t-shirt with a precise drape, soft finish, and subtle BRUNO branding.",
    details: [
      "280 GSM cotton jersey",
      "Relaxed modern fit",
      "Pre-shrunk and garment washed"
    ],
    colors: ["Bone", "Black", "Olive"],
    sizes: ["S", "M", "L", "XL"],
    badge: "Best Seller"
  },
  {
    id: "studio-hoodie",
    name: "Studio Hoodie",
    category: "Essentials",
    price: 96,
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
    description:
      "Dense premium fleece hoodie with a roomy silhouette, smooth interior, and elevated everyday construction.",
    details: [
      "420 GSM brushed fleece",
      "Double-layer hood",
      "Ribbed cuffs and hem"
    ],
    colors: ["Ash", "Black"],
    sizes: ["S", "M", "L", "XL"],
    badge: "New Drop"
  },
  {
    id: "refined-cotton-shirt",
    name: "Refined Cotton Shirt",
    category: "Women",
    price: 82,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    description:
      "A crisp cotton layer designed for versatile styling with elegant structure and all-day ease.",
    details: [
      "Breathable premium cotton",
      "Clean concealed placket",
      "Tailored relaxed shape"
    ],
    colors: ["White", "Sand"],
    sizes: ["XS", "S", "M", "L"],
    badge: "Limited"
  },
  {
    id: "transit-overshirt",
    name: "Transit Overshirt",
    category: "Men",
    price: 118,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    description:
      "A structured overshirt built for layering, balancing utility function with minimalist tailoring.",
    details: [
      "Midweight brushed twill",
      "Two oversized utility pockets",
      "Made for layering"
    ],
    colors: ["Taupe", "Charcoal"],
    sizes: ["M", "L", "XL"],
    badge: "Premium"
  },
  {
    id: "minimal-cap",
    name: "Minimal Cap",
    category: "Accessories",
    price: 34,
    image:
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80",
    description:
      "Low-profile six-panel cap with a subtle embroidered mark and premium brushed-cotton finish.",
    details: [
      "Adjustable strap",
      "Soft structured crown",
      "Everyday neutral palette"
    ],
    colors: ["Stone", "Black"],
    sizes: ["One Size"],
    badge: "Core"
  },
  {
    id: "carry-tote",
    name: "Carry Tote",
    category: "Accessories",
    price: 54,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    description:
      "A reinforced heavyweight tote for daily essentials, finished with understated branding and clean lines.",
    details: [
      "Heavy canvas construction",
      "Interior drop pocket",
      "Reinforced shoulder straps"
    ],
    colors: ["Ecru", "Graphite"],
    sizes: ["One Size"],
    badge: "Daily Pick"
  }
];

export const categories = ["All", "Men", "Women", "Essentials", "Accessories"];

export function getProductById(productId) {
  return products.find((product) => product.id === productId);
}
