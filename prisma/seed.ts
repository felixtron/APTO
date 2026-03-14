import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Active subscribers from Stripe (fetched 2026-03-12)
const stripeSubscribers = [
  {
    email: "toarletete@gmail.com",
    name: "Arlete Yadira Sanchez Arista",
    customerId: "cus_TyLjSD8isFVcTC",
    subscriptionId: "sub_1T0P2HCWdAZWndMTfXi57nAS",
    subscriptionEnd: new Date("2027-02-13"),
  },
  {
    email: "otgabrielag@live.com",
    name: "Gabriela Granados Garcia",
    customerId: "cus_TryW1uLy0iXtJa",
    subscriptionId: "sub_1SuEaOCWdAZWndMT96Vz4Z01", // Latest subscription (Jan 2026)
    subscriptionEnd: new Date("2027-01-27"),
  },
  {
    email: "to23lunita@gmail.com",
    name: "Nohemi Graciela Gómez Luna",
    customerId: "cus_SjygJSdbnVE9Id",
    subscriptionId: "sub_1RoUjRCWdAZWndMTh9aOBQoA",
    subscriptionEnd: new Date("2026-07-24"),
  },
  {
    email: "todulcandy@gmail.com",
    name: "Dulce Rosario Solano Trejo",
    customerId: "cus_SS535gVeFnjoIE",
    subscriptionId: "sub_1RXAt6CWdAZWndMTopYtXY7e",
    subscriptionEnd: new Date("2026-06-06"),
  },
  // Note: otgabrielag@live.com has a duplicate older subscription (sub_1RTOnaCWdAZWndMTTdjz9fbm)
  // that should be cancelled in Stripe. We only import the most recent one.
];

function generatePassword(): string {
  return crypto.randomBytes(6).toString("base64url"); // 8-char random password
}

async function main() {
  console.log("Seeding APTO database...\n");

  const passwords: { email: string; name: string; password: string }[] = [];

  for (const sub of stripeSubscribers) {
    const existing = await prisma.member.findUnique({
      where: { email: sub.email },
    });

    if (existing) {
      console.log(`  ⏭  ${sub.email} — ya existe, actualizando Stripe data...`);
      await prisma.member.update({
        where: { email: sub.email },
        data: {
          stripeCustomerId: sub.customerId,
          subscriptionId: sub.subscriptionId,
          subscriptionEnd: sub.subscriptionEnd,
          status: "ACTIVE",
        },
      });
      passwords.push({ email: sub.email, name: sub.name, password: "(sin cambios)" });
      continue;
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.member.create({
      data: {
        email: sub.email,
        name: sub.name,
        passwordHash,
        type: "PROFESSIONAL",
        status: "ACTIVE",
        stripeCustomerId: sub.customerId,
        subscriptionId: sub.subscriptionId,
        subscriptionEnd: sub.subscriptionEnd,
      },
    });

    passwords.push({ email: sub.email, name: sub.name, password });
    console.log(`  ✓  ${sub.email} — creado`);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  CREDENCIALES GENERADAS");
  console.log("  (Guardar y enviar a cada miembro)");
  console.log("═══════════════════════════════════════\n");

  for (const p of passwords) {
    console.log(`  ${p.name}`);
    console.log(`  Email: ${p.email}`);
    console.log(`  Password: ${p.password}`);
    console.log("");
  }

  console.log(`Total: ${passwords.length} miembros\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
