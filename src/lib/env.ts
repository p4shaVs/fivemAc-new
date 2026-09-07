import { z } from "zod";

// Ortam değişkenlerini doğrula. ÖNEMLİ: Doğrulama TEMBEL (lazy) yapılır —
// yani `env.X` ilk kez OKUNDUĞUNDA (çalışma anında) çalışır, modül import
// edildiğinde DEĞİL. Böylece Next.js build sırasında sayfa verisi toplarken
// (env henüz enjekte edilmemişken) build çökmez; ama gerçek istek anında
// eksik/zayıf sır yine hızlıca hata verir.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET en az 32 karakter olmalı"),
  LICENSE_HMAC_SECRET: z.string().min(16),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

type Env = z.infer<typeof schema>;

let cached: Env | null = null;

function load(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Geçersiz ortam değişkenleri:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error(
      "Ortam değişkenleri doğrulanamadı (Netlify env değişkenlerini / .env dosyanızı kontrol edin)"
    );
  }
  cached = parsed.data;
  return cached;
}

// `env.DATABASE_URL` gibi erişimler eskisi gibi çalışır; doğrulama ilk
// erişimde tetiklenir (import anında değil).
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return load()[prop as keyof Env];
  },
}) as Env;
